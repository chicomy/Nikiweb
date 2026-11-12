// Printed photos resting in the sea around a place, in fixed spots. Click one to see it large. Story cards can be dragged.
import {imageMedia} from '../dist/media-images.js';
import {videoMedia} from '../dist/media-videos.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Where each print floats, as fractions of the screen. Wide screens ring the island; phones get a row above and below it.
const SPOTS = {
  wide: [[.085, .215], [.075, .495], [.085, .78], [.915, .215], [.925, .7], [.255, .42], [.76, .815]],
  tall: [[.17, .225], [.83, .225], [.5, .22], [.125, .58], [.875, .58], [.375, .585], [.625, .585]],
};

// The story cards float in the open water between the prints and the island.
const NOTE_SPOTS = {
  // Wide screens: a row straight under the opening line, placed in `place` because it depends on that line and the card width.
  wide: null,
  tall: [[.17, .745], [.5, .745], [.83, .745]],
};

function notesAt(tall, spots) {
  if (!document.querySelector('.print.note')) return [];
  if (!tall && spots.notesWide) return spots.notesWide;
  if (tall && spots.notesTall) return spots.notesTall;
  if (tall) return document.querySelectorAll('.print.note').length === 2 ? [[.28, .745], [.72, .745]] : NOTE_SPOTS.tall;
  const line = document.querySelector('#golf-why').getBoundingClientRect();
  const card = document.querySelector('.print.note').offsetWidth + 14;
  const count = document.querySelectorAll('.print.note').length;
  return Array.from({length: count}, (_, i) => [.5 + (i - (count - 1) / 2) * card / innerWidth, (line.bottom + 18) / innerHeight]);
}

export function createPhotoWall(layer, viewer) {
  let notes = [], items = [], current = -1, opener = null, held = null, moved = false;
  // Live position and drift of each print, as fractions of the screen.
  let floats = [];
  const moveTo = (print, float) => {
    print.style.left = `${float.x * 100}%`;
    print.style.top = `${float.y * 100}%`;
  };
  // Photos never sit on words: anything overlapping the title, a story card, a tag or the top bar slides clear of it.
  // A little more room vertically, because the cards bob up and down.
  const GAP_X = 8, GAP_Y = 14, EDGE = 8;
  const settle = () => {
    const words = [...document.querySelectorAll('.print.note, #zoom-title, #golf-why, #facts > li, .logo, .back, .bar-tools')]
      .map(el => el.getBoundingClientRect()).filter(box => box.width);
    [...layer.children].forEach((print, index) => {
      if (print.classList.contains('note') || print.dataset.pinned) return;
      const float = floats[index];
      // Always from its set spot, so a nudge made before a photo finished loading can't stick.
      float.x = float.homeX;
      float.y = float.homeY;
      moveTo(print, float);
      const nudge = (dx, dy) => {
        float.x += dx / innerWidth;
        float.y += dy / innerHeight;
        moveTo(print, float);
      };
      for (let pass = 0; pass < 4; pass++) {
        let clear = true;
        for (const box of words) {
          const own = print.getBoundingClientRect();
          const moves = [
            [-(own.right + GAP_X - box.left), 0],
            [box.right + GAP_X - own.left, 0],
            [0, -(own.bottom + GAP_Y - box.top)],
            [0, box.bottom + GAP_Y - own.top],
          ];
          // Already clear on some side, so nothing to do.
          if (moves[0][0] >= 0 || moves[1][0] <= 0 || moves[2][1] >= 0 || moves[3][1] <= 0) continue;
          clear = false;
          // The shortest way out that keeps the whole print on screen.
          const fits = ([dx, dy]) => own.left + dx >= EDGE && own.right + dx <= innerWidth - EDGE && own.top + dy >= EDGE && own.bottom + dy <= innerHeight - EDGE;
          const size = ([dx, dy]) => Math.abs(dx) + Math.abs(dy);
          // Never sideways toward the middle of the screen, which belongs to the island.
          const outward = ([dx]) => !dx || (own.left + own.right < innerWidth ? dx < 0 : dx > 0);
          const options = moves.filter(fits).filter(outward).sort((a, b) => size(a) - size(b));
          if (options.length) nudge(...options[0]);
        }
        if (clear) break;
      }
      // Whatever happened above, it stays fully on screen.
      const own = print.getBoundingClientRect();
      nudge(Math.max(0, EDGE - own.left) - Math.max(0, own.right - innerWidth + EDGE), Math.max(0, EDGE - own.top) - Math.max(0, own.bottom - innerHeight + EDGE));
    });
  };
  // Button widths change once the fonts arrive.
  document.fonts.ready.then(settle);
  const paint = () => [...layer.children].forEach((print, index) => moveTo(print, floats[index]));
  // A print changes size once its photo loads, so its space is checked again then.
  layer.addEventListener('load', e => {
    e.target.parentElement.classList.toggle('portrait', !e.target.parentElement.classList.contains('film') && e.target.naturalHeight > e.target.naturalWidth);
    settle();
    wall.onResize?.();
  }, true);

  // Films load only when opened, and let go of their source when closed.
  const stopFilm = () => {
    const film = viewer.querySelector('video');
    film.pause();
    film.removeAttribute('src');
    film.load();
  };
  const close = () => {
    if (current < 0) return;
    current = -1;
    stopFilm();
    viewer.hidden = true;
    opener?.focus({preventScroll: true});
  };
  const show = (index, step = 1) => {
    current = (index + items.length) % items.length;
    // Empty spots have nothing to show, so browsing goes past them.
    while (items[current].empty) current = (current + step + items.length) % items.length;
    const item = items[current];
    const image = viewer.querySelector('img'), film = viewer.querySelector('video');
    stopFilm();
    image.hidden = !!item.film;
    film.hidden = !item.film;
    if (item.film) {
      film.poster = item.print;
      film.src = item.src;
      film.play().catch(() => {});
    } else {
      image.src = item.src;
      image.alt = item.caption;
    }
    const caption = viewer.querySelector('figcaption');
    caption.dataset.text = item.textPath;
    caption.textContent = wall.textOf?.(item.textPath) ?? item.caption;
    wall.onShow?.();
    // Nothing to browse to when there's only one.
    viewer.querySelector('.viewer-prev').hidden = viewer.querySelector('.viewer-next').hidden = items.length < 2;
    viewer.hidden = false;
    viewer.querySelector('.viewer-close').focus({preventScroll: true});
  };

  // Story cards can be picked up and pushed around; photos stay where they are.
  layer.addEventListener('pointerdown', e => {
    const print = e.target.closest('.print.note');
    if (e.target.closest('[data-play], a')) return;
    if (!print || document.body.classList.contains('editing-text')) return;
    e.preventDefault();
    print.setPointerCapture(e.pointerId);
    const float = floats[[...layer.children].indexOf(print)];
    held = {print, float, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, time: performance.now()};
    float.vx = float.vy = 0;
    moved = false;
  });
  layer.addEventListener('pointermove', e => {
    if (!held) return;
    if (!moved && Math.hypot(e.clientX - held.startX, e.clientY - held.startY) < 6) return;
    moved = true;
    held.print.classList.add('held');
    const dx = (e.clientX - held.x) / innerWidth, dy = (e.clientY - held.y) / innerHeight;
    const now = performance.now(), gap = Math.max(8, now - held.time) / 1000;
    held.float.x = Math.max(.03, Math.min(.97, held.float.x + dx));
    held.float.y = Math.max(.1, Math.min(.92, held.float.y + dy));
    // Capped, so a quick flick glides a little rather than shooting across the screen.
    held.float.vx = Math.max(-.5, Math.min(.5, dx / gap));
    held.float.vy = Math.max(-.5, Math.min(.5, dy / gap));
    held.x = e.clientX;
    held.y = e.clientY;
    held.time = now;
    paint();
  });
  const drop = () => {
    if (!held) return;
    held.print.classList.remove('held');
    held = null;
  };
  layer.addEventListener('pointerup', drop);
  layer.addEventListener('pointercancel', drop);
  layer.addEventListener('click', e => {
    const play = e.target.closest('[data-play]');
    if (play && !document.body.classList.contains('editing-text')) {
      opener = play;
      show(items.findIndex(item => item.noPrint));
      return;
    }
    const print = e.target.closest('[data-photo]');
    if (!print) return;
    opener = print;
    show(Number(print.dataset.photo));
  });
  viewer.addEventListener('click', e => {
    if (e.target === viewer || e.target.closest('.viewer-close')) close();
    if (e.target.closest('.viewer-prev')) show(current - 1, -1);
    if (e.target.closest('.viewer-next')) show(current + 1);
  });
  // Runs before the page's own keys, so Esc closes the photo instead of leaving the page.
  addEventListener('keydown', e => {
    if (current < 0) return;
    if (e.target.isContentEditable && e.key !== 'Escape') return;
    if (!['Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') close();
    else if (items.length > 1) show(current + (e.key === 'ArrowLeft' ? -1 : 1), e.key === 'ArrowLeft' ? -1 : 1);
  }, true);

  // A music stand under each print; only the Violin page shows it.
  const STAND = '<span class="print-stand" aria-hidden="true"></span>';

  const load = (place, ids, base, captions) => {
    const media = [...(imageMedia[place] || []), ...(videoMedia[place] || [])];
    const fromSite = path => path.replace('./', '../dist/');
    items = ids.map(entry => (typeof entry === 'string' ? {...media.find(m => m.id === entry)} : entry)).filter(m => m.src || m.empty).map(m => {
      if (m.empty) return m;
      if (m.type === 'video') return {...m, film: true, src: fromSite(m.src), print: fromSite(m.poster)};
      return {...m, src: m.print ? m.src : fromSite(m.src)};
    });
    for (const item of items) {
      const key = (item.src || item.caption).split('/').pop().replace(/\W/g, '_');
      item.caption = captions[key] ?? item.caption;
      item.textPath = `${base}.captions.${key}`;
    }
  };

  const wall = {
    close,
    fill(place, ids, stories = [], base = '', captions = {}, showPrints = true) {
      notes = stories;
      load(place, ids, base, captions);
      layer.innerHTML = (showPrints ? items : []).map((item, index) => (item.noPrint ? '' : item.empty ? `<div class="print print-empty" data-caption="${esc(item.caption)}" data-slot="photo:${esc(item.caption)}" style="--i:${index}"><div class="print-slot">${esc(item.slot || 'Photo to add')}</div><small data-text="${esc(item.textPath)}">${esc(item.caption)}</small>${STAND}</div>` : `<button class="print${item.film ? ' film' : ''}" type="button" data-slot="photo:${esc(item.src.split('/').pop())}" data-photo="${index}" data-caption="${esc(item.short || item.caption)}" aria-label="${item.film ? 'Play film' : 'View photo'}: ${esc(item.caption)}" style="--i:${index}"><img src="${esc(item.print || item.src)}" alt="">${item.film ? '<span class="play-badge"></span>' : ''}${STAND}</button>`)).join('')
        + notes.map((note, index) => `<article class="print note" data-slot="note:${esc(note.id)}" style="--i:${index}"><h3 data-text="${base}.stories.${index}.name">${esc(note.name)}</h3><p data-text="${base}.stories.${index}.text">${esc(note.text)}</p>${note.watch ? `<button class="note-play" type="button" data-play data-text="${base}.stories.${index}.watch">${esc(note.watch)}</button>` : ''}${note.link ? `<a class="note-play note-link" href="${esc(note.link.href)}" data-text="${base}.stories.${index}.link.label">${esc(note.link.label)}</a>` : ''}</article>`).join('');
    },
    // For a page that shows its own pictures: nothing floats, but they still open in the viewer.
    fillPictures(place, ids, base, captions = {}) {
      notes = [];
      load(place, ids, base, captions);
      layer.innerHTML = '';
      return items;
    },
    items: () => items,
    open(index, from) {
      opener = from;
      show(index);
    },
    place(tall, spots = SPOTS) {
      const key = tall ? 'tall' : 'wide';
      floats = [
        ...spots[key].slice(0, items.length).map(([x, y]) => ({x, y, homeX: x, homeY: y, vx: 0, vy: 0, ring: .62, below: .1})),
        ...notesAt(tall, spots).slice(0, notes.length).map(([x, y]) => ({x, y, vx: 0, vy: 0, ring: .26, below: .05})),
      ];
      paint();
      settle();
    },
    settle,
    // A spot chosen in the layout editor: it stays exactly there.
    pin(print, x, y) {
      const float = floats[[...layer.children].indexOf(print)];
      Object.assign(float, {x, y, vx: 0, vy: 0});
      print.dataset.pinned = '1';
      moveTo(print, float);
    },
    // A released card glides to a stop, like something pushed across water.
    update(dt) {
      let drifting = false;
      for (const float of floats) {
        if (held?.float === float || (!float.vx && !float.vy)) continue;
        float.x = Math.max(.03, Math.min(.97, float.x + float.vx * dt));
        float.y = Math.max(.1, Math.min(.92, float.y + float.vy * dt));
        float.vx *= Math.exp(-2.4 * dt);
        float.vy *= Math.exp(-2.4 * dt);
        if (Math.hypot(float.vx, float.vy) < .004) float.vx = float.vy = 0;
        drifting = true;
      }
      if (drifting) paint();
    },
    // Where everything is now, so the water can ripple around it; moving cards ripple more.
    floats: () => floats,
  };
  return wall;
}
