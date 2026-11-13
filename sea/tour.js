// Glasses page: one long page. The story behind the project comes first, then scrolling on reaches the glasses themselves
// (explore the frame, how it works, Polaroids).
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

const TILTS = [-3, 2.5, -1.5, 4, -4, 1.5];
const FLY_OUT = 'translate(112%, -5%) rotate(13deg)';
const FLY_TIME = 230, SWIPE = 50, TAP = 6;
// The glasses glide to the middle while the second part of the page is coming up the screen.
const GLIDE_STARTS = .85, GLIDE_LENGTH = .6;

export function createTour(root, wall, scene) {
  let order = [], cards = [], items = [], busy = false, held = null;
  const tallScreen = () => matchMedia('(max-aspect-ratio: 95/100)').matches;
  const placeStart = () => {
    const line = document.querySelector('#golf-why').getBoundingClientRect();
    root.querySelector('#tour-switch').style.marginTop = `${line.bottom + scrollY + 8}px`;
  };
  // How far the page has scrolled decides where the glasses float and which part the switch shows.
  const follow = () => {
    if (root.hidden) return;
    document.body.classList.toggle('page-scrolled', scrollY > 30);
    const part = root.querySelector('#tour-glasses');
    const progress = Math.max(0, Math.min(1, (scrollY - (part.offsetTop - innerHeight * GLIDE_STARTS)) / (innerHeight * GLIDE_LENGTH)));
    scene().glide(progress, tallScreen());
    root.querySelectorAll('[data-page]').forEach(button => {
      const on = (button.dataset.page === 'glasses') === progress > .5;
      button.classList.toggle('on', on);
      button.setAttribute('aria-pressed', on);
    });
  };
  const goTo = page => {
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    scrollTo({top: page === 'story' ? 0 : root.querySelector('#tour-glasses').offsetTop, behavior});
  };

  // The stack: the top card flies off and slides in underneath.
  const layOut = () => {
    order.forEach((index, rank) => {
      const card = cards[index];
      card.style.zIndex = order.length - rank;
      card.style.opacity = rank > 3 ? 0 : 1;
      card.style.transform = `translate(${rank * 7}px, ${rank * 5}px) rotate(${TILTS[index % TILTS.length]}deg)`;
    });
    root.querySelector('#stack-count').textContent = `${order[0] + 1} / ${order.length}`;
    const open = root.querySelector('#stack-open');
    open.textContent = items[order[0]].film ? 'Play film' : 'View large';
    open.hidden = !!items[order[0]].empty;
  };
  const next = () => {
    if (busy || order.length < 2) return;
    busy = true;
    cards[order[0]].style.transform = FLY_OUT;
    setTimeout(() => {
      order.push(order.shift());
      busy = false;
      layOut();
    }, FLY_TIME);
  };
  const previous = () => {
    if (busy || order.length < 2) return;
    busy = true;
    order.unshift(order.pop());
    const card = cards[order[0]];
    card.style.transition = 'none';
    card.style.zIndex = order.length + 1;
    card.style.transform = FLY_OUT;
    card.getBoundingClientRect();
    card.style.transition = '';
    layOut();
    setTimeout(() => { busy = false; }, FLY_TIME);
  };

  const stopTalking = () => {
    speechSynthesis?.cancel();
    root.querySelectorAll('.read-aloud').forEach(button => { button.textContent = 'Read this aloud'; });
  };
  const setSpin = on => {
    const button = root.querySelector('#model-spin');
    button.textContent = on ? 'Stop' : 'Spin';
    button.setAttribute('aria-pressed', on);
  };
  const choosePart = id => {
    stopTalking();
    root.querySelectorAll('[data-part]').forEach(chip => {
      const on = chip.dataset.part === id;
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-pressed', on);
    });
    root.querySelectorAll('[data-part-text]').forEach(text => { text.hidden = text.dataset.partText !== id; });
    scene().focus(id);
    setSpin(false);
  };
  const chooseTab = id => {
    root.querySelectorAll('[data-tab]').forEach(tab => {
      const on = tab.dataset.tab === id;
      tab.classList.toggle('on', on);
      tab.setAttribute('aria-selected', on);
    });
    root.querySelectorAll('[data-tab-body]').forEach(body => { body.hidden = body.dataset.tabBody !== id; });
  };

  root.addEventListener('click', e => {
    const page = e.target.closest('[data-page]');
    if (page) goTo(page.dataset.page);
    if (e.target.closest('#story-finish')) goTo('glasses');
    const chip = e.target.closest('[data-part]');
    if (chip) choosePart(chip.dataset.part);
    const tab = e.target.closest('[data-tab]');
    if (tab) chooseTab(tab.dataset.tab);
    if (e.target.closest('#stack-next')) next();
    if (e.target.closest('#stack-previous')) previous();
    if (e.target.closest('#stack-open')) wall.open(order[0], e.target);
    if (e.target.closest('#model-spin')) setSpin(scene().spin());
    if (e.target.closest('#model-reset')) choosePart('frame');
    const read = e.target.closest('.read-aloud');
    if (read) {
      const talking = read.textContent === 'Stop reading';
      stopTalking();
      if (talking) return;
      const words = new SpeechSynthesisUtterance(read.parentElement.querySelector('h3').textContent + '. ' + read.parentElement.querySelector('p').textContent);
      words.onend = stopTalking;
      read.textContent = 'Stop reading';
      speechSynthesis.speak(words);
    }
  });

  // A tap or a swipe goes through the stack.
  root.addEventListener('pointerdown', e => {
    const pile = e.target.closest('#stack-cards');
    if (!pile || busy || !order.length || document.body.classList.contains('editing-text')) return;
    e.preventDefault();
    pile.setPointerCapture(e.pointerId);
    held = {x: e.clientX, dx: 0};
  });
  root.addEventListener('pointermove', e => {
    if (!held) return;
    held.dx = e.clientX - held.x;
    const card = cards[order[0]];
    card.style.transition = 'none';
    card.style.transform = `translate(${held.dx}px, 0) rotate(${held.dx * .05}deg)`;
  });
  const letGo = () => {
    if (!held) return;
    const {dx} = held;
    held = null;
    cards[order[0]].style.transition = '';
    if (Math.abs(dx) < TAP || dx > SWIPE) next();
    else if (dx < -SWIPE) {
      layOut();
      previous();
    } else layOut();
  };
  root.addEventListener('pointerup', letGo);
  root.addEventListener('pointercancel', letGo);

  addEventListener('keydown', e => {
    if (root.hidden || !['ArrowLeft', 'ArrowRight'].includes(e.key) || e.target.isContentEditable) return;
    if (document.body.classList.contains('editing-text') || !document.querySelector('#viewer').hidden) return;
    e.preventDefault();
    scene().nudge(e.key === 'ArrowLeft' ? -1 : 1);
  });
  addEventListener('scroll', follow, {passive: true});
  addEventListener('resize', () => {
    if (root.hidden) return;
    placeStart();
    follow();
  });

  return {
    show(islet, base, photos) {
      const {parts, how, tabs, story} = islet.tour;
      // Real pictures come first, so a card's number is also its place in the viewer.
      items = photos;
      root.hidden = false;
      root.innerHTML = `
        <div class="tour-switch" id="tour-switch">
          <button type="button" data-page="story">The story</button>
          <button type="button" data-page="glasses">The glasses</button>
        </div>
        <section class="story" aria-label="The story">
          ${story.moments.map((item, i) => `<div class="moment">
            <h2 data-text="${base}.tour.story.moments.${i}.heading">${esc(item.heading)}</h2>
            <p data-text="${base}.tour.story.moments.${i}.text">${esc(item.text)}</p>
            ${item.photos?.some(photo => photo.src) ? `<div class="snaps">${item.photos.map((photo, k) => photo.src ? `<figure class="polaroid snap"><div class="polaroid-photo"><img src="${esc(photo.src)}" alt="${esc(photo.caption)}" loading="lazy"></div><figcaption data-text="${base}.tour.story.moments.${i}.photos.${k}.caption">${esc(photo.caption)}</figcaption></figure>` : '').join('')}</div>` : ''}
          </div>`).join('')}
          <button class="tool story-finish" id="story-finish" type="button" data-text="${base}.tour.story.finish">${esc(story.finish)}</button>
        </section>
        <div class="tour-glasses" id="tour-glasses">
          <div class="model-tools" id="model-tools">
            <button class="tool" id="model-spin" type="button" aria-pressed="false">Spin</button>
            <button class="tool" id="model-reset" type="button">Reset view</button>
            <span class="tool-hint">Drag or use arrow keys</span>
          </div>
          <div class="tour-panels">
            <section class="tour-panel tour-left" aria-labelledby="explore-title">
              <h2 id="explore-title" data-text="${base}.tour.title">${esc(islet.tour.title)}</h2>
              <p class="tour-lede" data-text="${base}.tour.lede">${esc(islet.tour.lede)}</p>
              <div class="part-text" aria-live="polite">
                ${parts.map((part, i) => `<div data-part-text="${esc(part.id)}"${i ? ' hidden' : ''}>
                  <small data-text="${base}.tour.parts.${i}.name">${esc(part.name)}</small>
                  <h3 data-text="${base}.tour.parts.${i}.heading">${esc(part.heading)}</h3>
                  <p data-text="${base}.tour.parts.${i}.text">${esc(part.text)}</p>
                  ${'speechSynthesis' in window ? '<button class="tool read-aloud" type="button">Read this aloud</button>' : ''}
                </div>`).join('')}
              </div>
              <div class="part-chips">
                ${parts.map((part, i) => `<button class="part-chip${i ? '' : ' on'}" type="button" data-part="${esc(part.id)}" aria-pressed="${!i}"><b>${esc(part.name)}</b><span data-text="${base}.tour.parts.${i}.tag">${esc(part.tag)}</span></button>`).join('')}
              </div>
              <p class="tour-note" data-text="${base}.tour.note">${esc(islet.tour.note)}</p>
            </section>
            <section class="tour-panel tour-right" aria-labelledby="how-title">
              <div class="how">
                <h2 id="how-title" data-text="${base}.tour.how.title">${esc(how.title)}</h2>
                <p class="tour-lede" data-text="${base}.tour.how.lede">${esc(how.lede)}</p>
                <div class="how-tabs" role="tablist">
                  ${tabs.map((tab, i) => `<button class="how-tab${i ? '' : ' on'}" type="button" role="tab" aria-selected="${!i}" data-tab="${esc(tab.id)}" data-text="${base}.tour.tabs.${i}.name">${esc(tab.name)}</button>`).join('')}
                </div>
                ${tabs.map((tab, i) => `<div class="how-body" data-tab-body="${esc(tab.id)}"${i ? ' hidden' : ''}>
                  ${tab.text ? `<p data-text="${base}.tour.tabs.${i}.text">${esc(tab.text)}</p>` : ''}
                  ${tab.points.map((point, k) => `<p class="how-point"><b data-text="${base}.tour.tabs.${i}.points.${k}.name">${esc(point.name)}</b> <span data-text="${base}.tour.tabs.${i}.points.${k}.text">${esc(point.text)}</span></p>`).join('')}
                </div>`).join('')}
              </div>
              <div class="stack">
                <div class="stack-cards" id="stack-cards" role="group" aria-label="Pictures. Tap or swipe to go through them.">
                  ${items.map(item => `<figure class="polaroid${item.film ? ' film' : ''}${item.whole ? ' whole' : ''}${item.empty ? ' empty' : ''}"><div class="polaroid-photo">${item.empty ? '<span>Photo to add</span>' : `<img src="${esc(item.print || item.src)}" alt="" draggable="false">`}</div><figcaption data-text="${esc(item.textPath)}">${esc(item.caption)}</figcaption></figure>`).join('')}
                </div>
                <div class="stack-tools">
                  <button class="tool" id="stack-previous" type="button" aria-label="Previous picture">←</button>
                  <span id="stack-count" aria-live="polite"></span>
                  <button class="tool" id="stack-next" type="button" aria-label="Next picture">→</button>
                  <button class="tool" id="stack-open" type="button"></button>
                </div>
              </div>
            </section>
          </div>
        </div>`;
      cards = [...root.querySelectorAll('.stack-cards .polaroid')];
      order = items.map((_, index) => index);
      busy = false;
      layOut();
      scrollTo(0, 0);
      placeStart();
      document.fonts.ready.then(() => {
        if (root.hidden) return;
        placeStart();
        follow();
      });
      scene().glide(0, tallScreen(), true);
      follow();
    },
    hide() {
      if (root.hidden) return;
      stopTalking();
      root.hidden = true;
      root.innerHTML = '';
      document.body.classList.remove('page-scrolled');
      scrollTo(0, 0);
    },
  };
}
