"""Prepare local source films for the browser; originals remain untouched."""
from pathlib import Path
import concurrent.futures, hashlib, json, subprocess, sys
from fractions import Fraction

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'resource'
OUT = ROOT / 'dist/assets/media/videos'
FFMPEG = '/opt/homebrew/bin/ffmpeg'
FFPROBE = '/opt/homebrew/bin/ffprobe'
RESUME = '--resume' in sys.argv
OUT.mkdir(parents=True, exist_ok=True)

def probe(path):
    return json.loads(subprocess.check_output([FFPROBE, '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(path)]))

def classify(source):
    name = Path(source).name
    if '纪录片' in source:
        return 'city', 'Documentary', ('On location: filming in Daqing' if '现场' in name else 'Behind the interview'), 'Behind-the-scenes footage from the Daqing documentary project.'
    if '华强北' in source:
        return 'lab', 'Research visits', 'Huaqiangbei research visit', 'A recorded visit to electronics shops in Huaqiangbei during project research.'
    if '蜡烛' in source:
        titles = {
            '27_1792203365.mp4': 'Sharing the candle collection',
            '28_1792203371.mp4': 'A conversation at the stall',
            '29_1792203379.mp4': 'Introducing the candle designs',
            '33_1792203388.mp4': 'Exploring the candle display',
            '34_1792203389.mp4': 'A quick moment at the stall',
            '37_1792203396.mp4': 'Visitors at the candle fundraiser',
            '39_1792203406.mp4': 'Talking through the collection',
            '41_1792203409.mp4': 'At the fundraising table',
            '46_1792203422.mp4': 'Around the fundraising tables',
        }
        return 'eurus', 'Fundraising', titles.get(name, 'Candle fundraiser: edited film'), 'Original footage from the candle fundraiser: product displays, visitors and conversations at the stall.'
    if 'daycare' in source.lower():
        return 'daycare', 'Daycare', 'A day at daycare', 'A recorded moment from the daycare activity archive.'
    if '春联' in source or '毛笔' in source:
        return 'culture', 'Calligraphy', 'Spring couplets for teachers', 'Writing spring couplets with a brush and sharing them with teachers.'
    if '篮球' in source:
        return 'basketball', 'Basketball', ('Basketball: edited highlights' if '剪辑' in name else 'School basketball: game footage'), 'School basketball footage from the supplied activity archive.'
    if '高尔夫' in source:
        return 'golf', 'Golf', ('Golf: swing collection' if '挥球' in name else 'Golf: edited highlights'), 'Practice and swing footage from the golf archive.'
    if '小提琴' in source or '拉琴' in source:
        titles = {
            '初中拉琴1.mp4': 'Violin: a middle-school performance',
            '小提琴独奏9.mp4': 'Violin solo',
            '小提琴表演2.mp4': 'Violin on stage',
            '乐队合奏在第二排.mp4': 'Violin in the ensemble',
            '乐队合奏有镜头的可以用.mp4': 'Ensemble performance',
            '有合奏特写镜头.mp4': 'Ensemble: a closer view',
            'niki拉琴.mp4': 'Violin performance from the archive',
            'niki黑色针织衫拉琴.mp4': 'Violin recital',
        }
        return 'council', 'Violin', titles.get(name, 'Violin performance'), 'An original recording from the violin and ensemble performance archive.'
    if '弹唱' in source:
        return 'council', 'Music at home', 'Music at home', 'Playing and singing during family downtime.'
    if '唱歌比赛' in source:
        return 'council', 'Singing', 'Singing competition', 'A performance recording from the singing-competition archive.'
    if '乐队' in source:
        return 'council', 'Singing', ('Summer Wind: band performance' if '夏天的风' in name else 'Singing with the band'), 'A live band performance from the music archive.'
    raise ValueError('Unclassified source: ' + source)

records, duplicates, seen, counters = [], [], {}, {}
for path in sorted(SOURCE.rglob('*')):
    if path.suffix.lower() not in ('.mp4', '.mov'):
        continue
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    source = str(path.relative_to(SOURCE))
    if digest in seen:
        duplicates.append({'source': source, 'duplicateOf': seen[digest], 'reason': 'Identical SHA256'})
        continue
    seen[digest] = source
    place, group, title, caption = classify(source)
    counters[place] = counters.get(place, 0) + 1
    number = counters[place]
    ident = f'{place}-film-{number:02d}'
    info = probe(path)
    stream = next(s for s in info['streams'] if s.get('codec_type') == 'video')
    records.append({'id': ident, 'place': place, 'source': source, 'sha256': digest,
                    'sourceBytes': path.stat().st_size, 'sourceDuration': float(info['format']['duration']),
                    'sourceWidth': stream['width'], 'sourceHeight': stream['height'],
                    'sourceFrameRate': stream.get('avg_frame_rate', stream['r_frame_rate']),
                    'sourceTransfer': stream.get('color_transfer'),
                    'sourceAudio': any(s.get('codec_type') == 'audio' for s in info['streams']),
                    'title': title, 'caption': caption, 'group': group})

# Repeated event fragments remain useful, but receive readable sequence labels.
title_totals = {}
for record in records:
    key = (record['place'], record['title'])
    title_totals[key] = title_totals.get(key, 0) + 1
title_counts = {}
for record in records:
    key = (record['place'], record['title'])
    title_counts[key] = title_counts.get(key, 0) + 1
    if title_totals[key] > 1:
        record['title'] += f" {title_counts[key]:02d}"

def run(record):
    path = SOURCE / record['source']
    dest = OUT / (record['id'] + '.mp4')
    poster = OUT / (record['id'] + '-poster.jpg')
    # Autorotation runs before scaling, keeping portrait films upright.
    filters = ["scale=w='if(gte(iw,ih),min(iw,1280),min(iw,720))':h='if(gte(iw,ih),min(ih,720),min(ih,1280))':force_original_aspect_ratio=decrease:force_divisible_by=2:out_range=tv"]
    if float(Fraction(record['sourceFrameRate'])) > 30.01:
        filters.append('fps=30')
    if record['sourceTransfer'] == 'arib-std-b67':
        filters.append('lut3d=file=media/hlg-to-sdr.cube:interp=tetrahedral')
        record['toneMap'] = 'HLG / BT.2020 to SDR BT.709; 1000-nit reference and luminance-preserving Reinhard rolloff'
    filters.append('setsar=1')
    command = [FFMPEG, '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-threads', '2', '-i', str(path),
               '-map', '0:v:0', '-map', '0:a:0?', '-vf', ','.join(filters),
               '-c:v', 'libx264', '-preset', 'fast', '-crf', '26', '-pix_fmt', 'yuv420p', '-threads', '2',
               '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-map_metadata', '-1',
               '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', str(dest)]
    reuse = False
    if RESUME and dest.exists():
        existing = probe(dest)
        v = next(s for s in existing['streams'] if s.get('codec_type') == 'video')
        reuse = v.get('codec_name') == 'h264' and v.get('pix_fmt') == 'yuv420p' and abs(float(existing['format']['duration']) - record['sourceDuration']) < .15
    if not reuse:
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
        if result.returncode:
            raise RuntimeError(record['source'] + '\n' + result.stderr)
    info = probe(dest)
    stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
    duration = float(info['format']['duration'])
    if abs(duration - record['sourceDuration']) > 0.15:
        raise RuntimeError('Duration changed for ' + record['source'])
    if stream['codec_name'] != 'h264' or stream['pix_fmt'] != 'yuv420p':
        raise RuntimeError('Unexpected output format: ' + record['id'])
    audio = next((s for s in info['streams'] if s.get('codec_type') == 'audio'), None)
    if record['sourceAudio'] and (not audio or audio.get('codec_name') != 'aac'):
        raise RuntimeError('Audio missing: ' + record['id'])
    seek = min(8, max(.2, duration * .2))
    result = subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-ss', str(seek), '-i', str(dest),
                             '-frames:v', '1', '-vf', "scale=w='min(iw,600)':h='min(ih,600)':force_original_aspect_ratio=decrease", '-q:v', '3', str(poster)], capture_output=True, text=True)
    if result.returncode or not poster.exists():
        raise RuntimeError('Poster failed: ' + record['id'] + result.stderr)
    # Decode first, middle and final samples, catching broken streams without replaying every frame.
    for seek in (0, duration / 2, max(0, duration - .5)):
        result = subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-nostdin', '-ss', str(seek), '-i', str(dest), '-frames:v', '1', '-f', 'null', '-'], capture_output=True, text=True)
        if result.returncode or result.stderr.strip():
            raise RuntimeError('Decode check failed: ' + record['id'] + result.stderr)
    record.update({'bytes': dest.stat().st_size, 'duration': round(duration, 3), 'width': stream['width'], 'height': stream['height'],
                   'src': './assets/media/videos/' + dest.name, 'poster': './assets/media/videos/' + poster.name,
                   'validation': 'H.264/yuv420p, AAC, duration, start/middle/end decode and poster passed'})
    print(f"READY {record['id']} {duration:.1f}s {record['width']}x{record['height']} {dest.stat().st_size / 1024 / 1024:.1f}MB", flush=True)
    return record

completed = []
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
    for result in executor.map(run, records):
        completed.append(result)

manifest = {}
for record in completed:
    manifest.setdefault(record['place'], []).append({k: record[k] for k in ('id', 'src', 'poster', 'title', 'caption', 'group', 'duration', 'width', 'height')} | {'type': 'video', 'thumb': record['poster']})
# Edited films introduce the event before the individual uncut fragments.
for place, ident in [('basketball', 'basketball-film-03'), ('eurus', 'eurus-film-10')]:
    manifest[place].sort(key=lambda item: item['id'] != ident)
(ROOT / 'dist/media-videos.js').write_text('// Local original videos, optimized for on-demand playback.\nexport const videoMedia = ' + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n')
report = {'sourceRoot': '../resource', 'uniqueVideos': len(completed), 'sourceBytes': sum(r['sourceBytes'] for r in completed),
          'outputBytes': sum(r['bytes'] for r in completed), 'durationSeconds': sum(r['duration'] for r in completed),
          'duplicates': duplicates, 'excluded': [], 'videos': completed}
(ROOT / 'media/source-videos.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ('uniqueVideos', 'sourceBytes', 'outputBytes', 'durationSeconds')}, indent=2), flush=True)
