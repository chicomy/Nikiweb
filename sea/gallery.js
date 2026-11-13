import {galleryItems} from './gallery-media.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// A separate viewer keeps the island's selected prints and mobile layout intact.
export function createGallery(dialog, button) {
  let items = [], selected = -1, opener = null, thumbnail = null;
  const grid = dialog.querySelector('.gallery-grid');
  const detail = dialog.querySelector('.gallery-detail');
  const image = detail.querySelector('img');
  const film = detail.querySelector('video');
  const stopFilm = () => { film.pause(); film.removeAttribute('src'); film.load(); };
  const overview = () => {
    stopFilm();
    selected = -1;
    detail.hidden = true;
    grid.hidden = false;
    thumbnail?.focus({preventScroll: true});
  };
  const show = index => {
    selected = (index + items.length) % items.length;
    const item = items[selected];
    stopFilm();
    image.hidden = !!item.film;
    film.hidden = !item.film;
    if (item.film) {
      film.poster = item.print || item.thumb;
      film.src = item.src;
    } else {
      image.src = item.src;
      image.alt = item.caption || item.title || '';
    }
    detail.querySelector('figcaption').textContent = item.caption || item.title || '';
    detail.querySelector('.gallery-position').textContent = `${selected + 1} / ${items.length}`;
    grid.hidden = true;
    detail.hidden = false;
    dialog.scrollTop = 0;
  };
  const close = () => {
    stopFilm();
    if (dialog.open) dialog.close();
  };
  button.addEventListener('click', () => {
    if (!items.length) return;
    opener = button;
    thumbnail = null;
    overview();
    grid.innerHTML = items.map((item, index) => `<button class="gallery-tile" type="button" data-index="${index}" aria-label="${item.film ? 'Play film' : 'View photo'}: ${esc(item.caption || item.title)}">
      <img src="${esc(item.thumb || item.print || item.src)}" alt="" loading="lazy" decoding="async">
      <span class="gallery-kind">${item.film ? '▶ Film · ' : ''}${esc(item.group)}</span><span>${esc(item.title || item.caption)}</span></button>`).join('');
    dialog.showModal();
    dialog.querySelector('[data-close]').focus();
  });
  dialog.addEventListener('click', e => {
    if (e.target === dialog || e.target.closest('[data-close]')) return close();
    const tile = e.target.closest('[data-index]');
    if (tile) {
      thumbnail = tile;
      show(Number(tile.dataset.index));
      detail.querySelector('[data-overview]').focus();
    }
    if (e.target.closest('[data-overview]')) overview();
    if (e.target.closest('[data-prev]')) show(selected - 1);
    if (e.target.closest('[data-next]')) show(selected + 1);
  });
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    if (selected >= 0) overview(); else close();
  });
  dialog.addEventListener('close', () => {
    stopFilm();
    grid.innerHTML = '';
    image.removeAttribute('src');
    opener?.focus({preventScroll: true});
  });
  addEventListener('keydown', e => {
    if (!dialog.open) return;
    // Keep page shortcuts from moving the island or routing away beneath the dialog.
    e.stopImmediatePropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      if (selected >= 0) overview(); else close();
    } else if (selected >= 0 && ['ArrowLeft', 'ArrowRight'].includes(e.key) && e.target !== film) {
      e.preventDefault();
      show(selected + (e.key === 'ArrowLeft' ? -1 : 1));
    }
  }, true);
  return {
    close,
    get open() { return dialog.open; },
    setPlace(place) {
      close();
      items = place ? galleryItems(place) : [];
      button.hidden = !items.length;
      button.setAttribute('aria-label', `View all ${items.length} photos and films`);
      dialog.querySelector('h2').textContent = `${place?.title || place?.name || ''} — Gallery`;
      dialog.querySelector('.gallery-count').textContent = `${items.filter(item => !item.film).length} photos & design pages · ${items.filter(item => item.film).length} films`;
    },
  };
}
