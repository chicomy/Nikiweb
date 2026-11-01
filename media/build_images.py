from pathlib import Path
from PIL import Image,ImageOps
import json,subprocess,tempfile
import fitz
ROOT=Path(__file__).resolve().parents[1]
INV=json.loads((ROOT/'media/source-image-inventory.json').read_text())
OUT=ROOT/'dist/assets/media/images';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT.parent/'resource'
CACHE=Path(tempfile.gettempdir())/'niki-media-image-build';CACHE.mkdir(parents=True,exist_ok=True)
def source_image(entry):
 src=SOURCE/entry['source']
 if src.suffix.lower()=='.heic':
  decoded=CACHE/(entry['sha256'][:16]+'.jpg')
  if not decoded.exists():
   subprocess.run(['heif-convert',str(src),str(decoded)],capture_output=True,check=True)
  src=decoded
 return Image.open(src)
# Titles and captions are based on the supplied folder context and visual review.
DATA='''
1|civic|Civic learning|Hutchins scholars together|A group photograph from the Hutchins civic-life archive.
2|civic|Civic learning|A shared gathering|A circle of materials prepared for a group activity.
3|eurus|Product design|The winter forest candle|A detailed product photograph of the botanical Christmas candle.
4|eurus|Product design|A woodland on the box|The illustrated packaging for the Eurus Christmas candle.
5|golf|Golf|The varsity portrait|A studio portrait with a golf club and ball.
6|golf|Golf|In Lawrenceville red|A second portrait from the golf-team photo session.
7|daycare|Volunteer teaching|Visiting the community|A group photograph during the volunteer-teaching visit.
8|daycare|Volunteer teaching|A conversation outside|Meeting people in the community during the visit.
9|daycare|Volunteer teaching|Time with a family|A photograph from a home visit in the volunteer-teaching archive.
10|daycare|Volunteer teaching|At the school doorway|A group photograph outside a classroom.
11|daycare|Volunteer teaching|A moment together|A close-up photograph with a child during the teaching visit.
12|daycare|Volunteer teaching|An afternoon visit|Spending time with children during a community visit.
13|daycare|Volunteer teaching|At the classroom board|A view of a lesson from the back of the classroom.
14|daycare|Volunteer teaching|Teaching in the classroom|A lesson with students seated at their desks.
15|daycare|Volunteer teaching|Learning together|Another moment from the classroom teaching session.
16|daycare|Volunteer teaching|Gifts for the students|Sharing gifts with children at the school.
17|daycare|Volunteer teaching|A classroom conversation|A wide view of the lesson and the students.
18|daycare|Volunteer teaching|The visit, together|A group photograph outside the school.
19|daycare|Volunteer teaching|A little company|A quiet moment with a baby during the visit.
20|daycare|Volunteer teaching|Meeting the families|A family photograph from the community visit.
21|city|Documentary|Before the camera rolls|Preparing the camera and equipment for a documentary shoot.
22|city|Documentary|At the oilfield|A research visit to the oilfield and its working infrastructure.
23|city|Documentary|Listening to a local story|An interview recorded for the Daqing documentary project.
24|golf|Golf|Club in hand|A golf portrait from the school-team archive.
25|golf|Golf|The team and coach|The Lawrenceville golf team pictured with their coach.
26|golf|Golf|A team portrait in red|A portrait of the golf team from the supplied archive.
27|golf|Golf|Ready for the swing|A studio golf portrait with a raised club.
28|daycare|Daycare|A day outdoors|Spending time outside with children at Loveland Daycare.
29|daycare|Daycare|A birthday afternoon|A birthday moment in the daycare room.
30|daycare|Daycare|Little celebrations|Another photograph from the daycare birthday gathering.
31|wellness|Everyday connections|Around the game table|A relaxed gathering around a board game at home.
32|council|Music at home|A room full of music|A shared singing session with family at home.
33|council|Music at home|At the microphone|A closer view of the home music session.
34|council|Music at home|Singing together at home|Singing and playing music in a relaxed family setting.
35|wellness|Everyday connections|Making food together|Preparing food together in the kitchen.
36|council|Singing|A school performance|A moment from the singing-event archive.
37|council|Singing|After the performance|A photograph with flowers after the school event.
38|council|Singing|A shared celebration|A second photograph from the singing-event gathering.
39|golf|Golf|On the practice range|Practicing a golf swing on an outdoor course.
40|golf|Golf|Following through|A full swing against the backdrop of the course.
42|golf|Golf|A golf-team portrait|A portrait with club and ball from the team archive.
43|golf|Golf|The team in white|A studio portrait of the golf team.
44|golf|Golf|A moment off the course|A photograph from the golf activity archive.
45|golf|Golf|Golf, beyond the round|Another photograph from the golf activity archive.
46|golf|Golf|A swing in the hills|An outdoor practice swing on the golf course.
47|eurus|Fundraising|Preparing for the sale|Packing materials before the candle fundraiser.
48|eurus|Fundraising|At the candle table|Presenting the candles to visitors at the fundraising event.
49|eurus|Fundraising|A conversation at the stall|Talking with visitors beside the candle display.
50|eurus|Fundraising|Sharing the product|A closer view of the candle stall and its visitors.
51|eurus|Fundraising|The stall in detail|A moment arranging and presenting products at the table.
52|eurus|Fundraising|Welcoming visitors|Meeting a visitor at the candle fundraiser.
53|eurus|Fundraising|Talking through the candles|A product conversation at the fundraising stall.
54|eurus|Fundraising|A closer look at the collection|A visitor explores the candle collection.
55|eurus|Fundraising|Candles and supporters|A photograph with candles at the fundraising event.
56|eurus|Fundraising|The collection on display|Sharing the boxed candles at the stall.
57|eurus|Fundraising|Meeting the community|Talking with visitors about the candles.
58|eurus|Fundraising|Young visitors at the table|A photograph with children beside the candle display.
59|eurus|Fundraising|Introducing the candles|A moment sharing the collection with a young visitor.
60|eurus|Fundraising|Stories across the stall|Conversations around the candle table.
61|eurus|Fundraising|Behind the scenes|Gathering around a worktable during the project.
62|civic|Event planning|Setting the scene|Preparing the Spring Formal venue and decorations.
64|civic|Event planning|The finished venue|A photograph at the decorated Spring Formal backdrop.
65|civic|Event planning|Before the guests arrive|Working on table details for the school event.
66|civic|Event planning|The planning team at work|Finishing event preparations at the tables.
67|civic|Event planning|A room taking shape|The Spring Formal venue during setup.
68|civic|Event planning|The welcome table|The event sign-in display and decorations.
69|civic|Event planning|Details before the evening|Preparing the tables in front of the Spring Formal backdrop.
70|civic|Event planning|The event team together|A group portrait beside the decorated school-event backdrop.
71|basketball|Basketball|A moment during the game|School basketball players on court during a game.
72|basketball|Basketball|Play in motion|Another view of the school basketball game.
73|arts|Musical theatre|An evening of Macbeth|A photograph beside the Macbeth production display.
74|arts|Musical theatre|Under the blue lights|The ensemble performing on the Macbeth stage.
75|arts|Musical theatre|The ensemble on stage|Another scene from the musical-theatre production.
76|arts|Musical theatre|A moment in the spotlight|The cast on stage beneath the theatre lighting.
77|arts|Musical theatre|Together at the curtain call|The performers gather across the stage.
78|arts|Musical theatre|At the theatre|A photograph beside the Macbeth show display.
79|culture|Calligraphy|Writing the spring couplets|Brush calligraphy on red paper for Lunar New Year.
80|culture|Calligraphy|A finished spring greeting|The completed handwritten spring couplet.
81|council|Violin|At the music stand|A violin performance from the recital archive.
82|council|Violin|A solo in progress|A closer view of the violin recital.
83|council|Violin|On the recital stage|A full-stage view of the violin performance.
84|council|Violin|Playing with the ensemble|The string players at a school music showcase.
85|council|Violin|The sound of the ensemble|Another view of the violin section during the showcase.
86|council|Violin|Among the strings|A closer view of the violinists performing together.
88|council|Violin|Following the conductor|The ensemble and conductor during a performance.
89|council|Violin|Across the music stands|A photograph of the orchestra in performance.
90|football|Football|A pass on the pitch|A moment of play from the football archive.
91|football|Football|The school team|A team photograph outside the school.
92|football|Football|A tournament gathering|A football-team photograph from the activity archive.
93|football|Football|Together at the goal|The school football team pictured by the goal.
94|daycare|Volunteer teaching|Sharing the teaching experience|Presenting the volunteer-teaching experience at a group event.
95|daycare|Volunteer teaching|The story, shared|Another moment from the volunteer-teaching presentation.
96|civic|School community|A shared milestone|A school group photograph with certificates.
97|daycare|Daycare|Story time at daycare|Reading and spending time with children at Loveland Daycare.
98|football|Football|An earlier team chapter|The school U12 girls football-team portrait.
100|civic|Event planning|The evening on stage|Performers and decorations at a school evening event.
101|civic|Event planning|The graduation dinner|A wide view of the school graduation banquet.
102|basketball|Basketball|At the trophy presentation|The basketball team during a trophy presentation.
103|football|Football|The team by the goal|A football-team photograph on the pitch.
104|football|Football|A team on the field|Players and coaches pictured together on the football pitch.
105|football|Football|The team huddle|The football team gathering together on the field.
106|football|Football|After the match|Players greeting one another on the pitch.
107|football|Football|Across the field|Another view of the teams meeting after play.
108|basketball|Basketball|A team celebration|The basketball team pictured together with a trophy.
109|golf|Golf|Reading the green|A practice moment lining up a putt.
110|culture|Chinese Society|A Lunar New Year celebration|Lion-dance costumes at a Chinese Society celebration.
111|culture|Chinese Society|The celebration continues|A second lion-dance costume from the cultural event.
112|civic|Civic learning|Summer learning at Penn|A photograph from the Penn summer-program archive.
113|city|Documentary|The pumpjack in the landscape|An oil pumpjack photographed during the Daqing fieldwork.
114|city|Documentary|Through the camera monitor|An interview seen through the documentary camera monitor.
'''
CAT={int(row.split('|')[0]):row.split('|')[1:] for row in DATA.strip().splitlines()}
VISUAL_DUP={41:24,63:69,87:86,99:70,115:43}
places=['city','divide','lab','eurus','civic','wellness','daycare','culture','basketball','golf','football','council','arts']
media={p:[] for p in places};records=[]
def export_image(im,ident):
 im=ImageOps.exif_transpose(im).convert('RGB');im.thumbnail((1600,1600),Image.LANCZOS);w,h=im.size
 im.save(OUT/(ident+'.jpg'),quality=86,optimize=True,progressive=True)
 thumb=im.copy();thumb.thumbnail((440,440),Image.LANCZOS);thumb.save(OUT/(ident+'-thumb.jpg'),quality=80,optimize=True,progressive=True)
 return {'src':f'./assets/media/images/{ident}.jpg','thumb':f'./assets/media/images/{ident}-thumb.jpg','width':w,'height':h}
for e in sorted(INV,key=lambda e:e.get('reviewId',9999)):
 if 'duplicateOf' in e:records.append({'source':e['source'],'sha256':e['sha256'],'status':'exact duplicate','duplicateOf':e['duplicateOf']});continue
 n=e['reviewId']
 if n in VISUAL_DUP:
  other=next(x for x in INV if x.get('reviewId')==VISUAL_DUP[n]);records.append({'source':e['source'],'sha256':e['sha256'],'status':'visual duplicate','duplicateOf':other['source'],'reason':'Same photograph in a second export or a photograph of the image; keep the clearer copy.'});continue
 if n not in CAT:raise ValueError(f'Missing reviewed caption: {n}')
 place,group,title,caption=CAT[n];ident=f'{place}-photo-{n:03d}';props=export_image(source_image(e),ident);entry={'id':ident,'type':'image',**props,'title':title,'caption':caption,'group':group};media[place].append(entry)
 records.append({'source':e['source'],'sha256':e['sha256'],'status':'included','id':ident,'place':place,'group':group,'output':props['src'],'sourceDimensions':e['size']})
# The supplied design portfolio is itself an original project artifact.
PDF_INFO=[('The Eurus collection','The Christmas candle-set cover from the design portfolio.'),('The starting point','The inspiration behind the Eurus forest-candle concept.'),('From idea to object','Concept sketches and the core design idea.'),('A connected woodland','Packaging design that forms a continuous woodland display.'),('A second life as a planter','Seed-paper design and planting instructions.'),('Three scent stories','The fragrance notes for the candle collection.'),('The complete design journey','The collection and design credits from the final portfolio page.')]
pdfsource='niki23号分享的资料/Eurus-Design-Portfolio.pdf'
portfolio=fitz.open(SOURCE/pdfsource)
for i,(title,caption) in enumerate(PDF_INFO,1):
 ident=f'eurus-design-page-{i:02d}';pdfpage=portfolio[i-1];scale=1600/pdfpage.rect.height;pix=pdfpage.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False);props=export_image(Image.frombytes('RGB',[pix.width,pix.height],pix.samples),ident);media['eurus'].append({'id':ident,'type':'image',**props,'title':title,'caption':caption,'group':'Product design'})
 records.append({'source':pdfsource,'page':i,'status':'included','id':ident,'place':'eurus','group':'Product design','output':props['src']})
(ROOT/'dist/media-images.js').write_text('// Curated from the supplied original photographs and Eurus design portfolio.\nexport const imageMedia = '+json.dumps(media,ensure_ascii=False,indent=2)+';\n')
report={'sourceRoot':'resource','imageFiles':len(INV),'includedPhotographs':sum(len(x) for x in media.values())-len(PDF_INFO),'includedPortfolioPages':len(PDF_INFO),'exactDuplicates':sum('duplicateOf' in e for e in INV),'visualDuplicates':len(VISUAL_DUP),'sourceFilesUnchanged':True,'items':records}
(ROOT/'media/source-images.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
# Decode every generated JPEG, and verify web dimensions and image/thumbnail pairing.
for items in media.values():
 for e in items:
  for key in ['src','thumb']:
   with Image.open(ROOT/'dist'/e[key].removeprefix('./')) as im:
    im.load();assert im.format=='JPEG';assert max(im.size)<=1600
print(json.dumps({'counts':{k:len(v) for k,v in media.items()},'total':sum(len(x) for x in media.values()),'bytes':sum(p.stat().st_size for p in OUT.glob('*.jpg')),'decodedJPEGs':len(list(OUT.glob('*.jpg')))},indent=2))
