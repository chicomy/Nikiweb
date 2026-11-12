// Golf's saved arrangement from golf-layout.json. Positions are fractions of the screen; sizes are pixels at the
// window the layout was made in, scaled for other windows.
const $ = s => document.querySelector(s);

export function createArrangement({saved, wall, applies}) {
  const items = saved.items || {};
  const scale = () => (saved.ref ? Math.min(innerWidth / saved.ref[0], innerHeight / saved.ref[1]) : 1);

  function applyOne(el) {
    const item = items[el.dataset.slot];
    if (!item) return;
    const type = el.dataset.slot.split(':')[0];
    if (type === 'photo' || type === 'note') {
      wall.pin(el, item.x, item.y);
      el.style.width = `${item.w * scale()}px`;
      if (type === 'note') {
        el.style.translate = '-50% -50%';
        el.style.scale = String(item.s * scale());
      }
      return;
    }
    Object.assign(el.style, {
      position: 'fixed', left: `${item.x * 100}%`, top: `${item.y * 100}%`, right: 'auto', bottom: 'auto',
      margin: '0', maxWidth: 'none', width: 'max-content', transform: 'none', translate: '-50% -50%', scale: String(item.s * scale()),
    });
  }

  return {
    scale,
    apply() {
      if (applies()) document.querySelectorAll('[data-slot]').forEach(applyOne);
    },
    island: () => (applies() ? items.island : null),
    // The title is shared with other pages, so its saved spot must not follow the visitor there.
    clear() {
      for (const el of [$('#zoom-title'), $('#golf-why')]) {
        for (const name of ['position', 'left', 'top', 'right', 'bottom', 'margin', 'maxWidth', 'width', 'transform', 'translate', 'scale']) el.style[name] = '';
      }
    },
  };
}
