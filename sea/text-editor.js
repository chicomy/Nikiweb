// Edit text mode: click any words on a page and type. Changes are saved to text-edits.json as {"path": "new words"},
// where a path like "sports.islets.1.why" points into the data in islands.js.
const $ = s => document.querySelector(s);

export function applyTextEdits(places, edits) {
  for (const [path, value] of Object.entries(edits)) {
    const [id, ...keys] = path.split('.');
    let node = places.find(place => place.id === id);
    const last = keys.pop();
    for (const key of keys) node = node && (node[key] ??= {});
    if (node && last) node[last] = value;
  }
}

export function createTextEditor({saved, isDialogOpen, onCancel}) {
  let editing = false, draft = {...saved};

  function refresh() {
    document.querySelectorAll('[data-text]').forEach(el => {
      if (!editing) {
        el.removeAttribute('contenteditable');
        return;
      }
      el.setAttribute('contenteditable', 'plaintext-only');
      if (el.dataset.text in draft) el.textContent = draft[el.dataset.text];
    });
  }

  function setEditing(on) {
    editing = on;
    document.body.classList.toggle('editing-text', on);
    $('#text-status').textContent = on ? 'Click any outlined words and type.' : '';
    if (!on) document.activeElement?.blur?.();
    refresh();
  }

  function cancel() {
    draft = {...saved};
    setEditing(false);
    onCancel();
  }

  $('#edit-text').addEventListener('click', () => setEditing(true));
  $('#text-cancel').addEventListener('click', cancel);
  $('#text-save').addEventListener('click', async () => {
    $('#text-status').textContent = 'Saving…';
    try {
      const reply = await fetch('/__save-text', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(draft)});
      if (!reply.ok) throw new Error(String(reply.status));
      // Words also appear in labels and buttons around the site, so start fresh with everything in place.
      location.reload();
    } catch {
      // Keep the work: nothing is lost if the preview isn't running the saving server.
      $('#text-status').textContent = 'Could not save. Run python3 sea/dev-server.py, then press Save again.';
    }
  });

  document.addEventListener('input', e => {
    const el = e.target.closest?.('[data-text]');
    if (el) draft[el.dataset.text] = el.textContent;
  });
  addEventListener('keydown', e => {
    if (!editing) return;
    if (e.key === 'Enter' && e.target.closest?.('[data-text]')) {
      e.preventDefault();
      e.target.blur();
    }
    if (e.key === 'Escape' && !isDialogOpen()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      cancel();
    }
  }, true);

  return {
    refresh,
    get editing() { return editing; },
    textOf: path => draft[path],
  };
}
