// Only display a fully decoded image for the current selection.
export function createPhotoLoader(image) {
  const figure = image.parentElement;
  const status = document.createElement('p');
  status.className = 'photo-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  image.after(status);
  let version = 0, pending = null;

  const clear = () => {
    version++;
    pending?.removeAttribute('src');
    pending = null;
    image.hidden = true;
    image.removeAttribute('src');
    image.alt = '';
    status.hidden = true;
    figure.removeAttribute('aria-busy');
  };

  const show = async (src, alt = '') => {
    clear();
    const request = version;
    status.textContent = 'Loading photo…';
    status.hidden = false;
    figure.setAttribute('aria-busy', 'true');
    const next = document.createElement('img');
    next.alt = alt;
    next.decoding = 'async';
    next.src = src;
    pending = next;
    try {
      await next.decode();
      if (request !== version) return;
      image.replaceWith(next);
      image = next;
      status.hidden = true;
    } catch {
      if (request !== version) return;
      status.textContent = 'This photo could not load. Please try again.';
    }
    pending = null;
    figure.removeAttribute('aria-busy');
  };

  return {show, clear};
}
