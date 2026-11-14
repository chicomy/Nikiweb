// Deterministically reproduce slow/failed image decodes without network timing.
// Run: node media/audit-photo-loader.mjs
import assert from 'node:assert/strict';
import {createPhotoLoader} from '../sea/photo-loader.js';

class Element {
  constructor(tag, owner) {
    this.tagName = tag;
    this.owner = owner;
    this.attributes = new Map();
    this.hidden = false;
    this.alt = '';
    this.textContent = '';
    this.children = [];
    this.parentElement = null;
    if (tag === 'img') {
      this.decoded = new Promise((resolve, reject) => {
        this.finish = resolve;
        this.fail = reject;
      });
    }
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  set src(value) { this.setAttribute('src', value); }
  get src() { return this.getAttribute('src') || ''; }
  after(next) {
    const parent = this.parentElement;
    parent.children.splice(parent.children.indexOf(this) + 1, 0, next);
    next.parentElement = parent;
  }
  replaceWith(next) {
    const parent = this.parentElement;
    assert(parent, 'Only the current attached image may be replaced');
    parent.children[parent.children.indexOf(this)] = next;
    next.parentElement = parent;
    this.parentElement = null;
  }
  decode() {
    return this.owner.cached.has(this.src) ? Promise.resolve() : this.decoded;
  }
}

function fixture() {
  const owner = {
    cached: new Set(), created: [],
    createElement(tag) {
      const node = new Element(tag, this);
      this.created.push(node);
      return node;
    },
  };
  globalThis.document = owner;
  const figure = owner.createElement('figure');
  const previous = owner.createElement('img');
  previous.src = 'previous.jpg';
  previous.alt = 'Previous photo';
  figure.children.push(previous);
  previous.parentElement = figure;
  const loader = createPhotoLoader(previous);
  const status = figure.children[1];
  const pending = () => owner.created.filter(node => node.tagName === 'img').at(-1);
  const current = () => figure.children.find(node => node.tagName === 'img');
  return {owner, figure, previous, loader, status, pending, current};
}

const tests = [
  ['clears the previous bitmap before a delayed replacement is ready', async () => {
    const f = fixture();
    const result = f.loader.show('next.jpg', 'Next photo');
    assert(f.previous.hidden);
    assert.equal(f.previous.src, '');
    assert.equal(f.previous.alt, '');
    assert.equal(f.pending().parentElement, null);
    assert.equal(f.figure.getAttribute('aria-busy'), 'true');
    assert(!f.status.hidden);
    f.pending().finish();
    await result;
    assert.equal(f.current().src, 'next.jpg');
    assert.equal(f.current().alt, 'Next photo');
    assert(!f.current().hidden);
    assert(f.status.hidden);
    assert.equal(f.figure.getAttribute('aria-busy'), null);
  }],
  ['keeps the latest image when earlier decodes finish out of order', async () => {
    const f = fixture();
    const a = f.loader.show('a.jpg'); const imageA = f.pending();
    const b = f.loader.show('b.jpg'); const imageB = f.pending();
    const c = f.loader.show('c.jpg'); const imageC = f.pending();
    assert.equal(imageA.src, '');
    assert.equal(imageB.src, '');
    imageC.finish(); await c;
    imageA.finish(); await a;
    imageB.fail(new Error('late failure')); await b;
    assert.equal(f.current(), imageC);
    assert.equal(f.current().src, 'c.jpg');
    assert(f.status.hidden);
  }],
  ['ignores an old failure while a newer image is still loading', async () => {
    const f = fixture();
    const a = f.loader.show('a.jpg'); const imageA = f.pending();
    const b = f.loader.show('b.jpg'); const imageB = f.pending();
    imageA.fail(new Error('old failure')); await a;
    assert.equal(f.status.textContent, 'Loading photo…');
    assert.equal(f.figure.getAttribute('aria-busy'), 'true');
    assert(f.current().hidden);
    imageB.finish(); await b;
    assert.equal(f.current(), imageB);
  }],
  ['shows the current error without restoring an older successful image', async () => {
    const f = fixture();
    const a = f.loader.show('a.jpg'); const imageA = f.pending();
    const b = f.loader.show('broken.jpg'); const imageB = f.pending();
    imageB.fail(new Error('broken image')); await b;
    const error = f.status.textContent;
    assert.match(error, /could not load/);
    assert(!f.status.hidden);
    assert(f.current().hidden);
    assert.equal(f.current().src, '');
    assert.equal(f.figure.getAttribute('aria-busy'), null);
    imageA.finish(); await a;
    assert.equal(f.status.textContent, error);
    assert(f.current().hidden);
  }],
  ['cancels both successful and failed decodes on close or media switch', async () => {
    for (const outcome of ['finish', 'fail']) {
      const f = fixture();
      const result = f.loader.show('pending.jpg'); const pending = f.pending();
      f.loader.clear();
      assert.equal(pending.src, '');
      pending[outcome](new Error('cancelled'));
      await result;
      assert.equal(f.current(), f.previous);
      assert(f.current().hidden);
      assert(f.status.hidden);
      assert.equal(f.figure.getAttribute('aria-busy'), null);
    }
  }],
  ['cleans the replacement node and supports reopening a cached image', async () => {
    const f = fixture();
    const first = f.loader.show('first.jpg'); const firstImage = f.pending();
    firstImage.finish(); await first;
    f.loader.clear();
    assert(firstImage.hidden);
    assert.equal(firstImage.src, '');
    assert.equal(f.previous.parentElement, null);
    f.owner.cached.add('cached.jpg');
    const cached = f.loader.show('cached.jpg', 'Cached photo');
    assert(f.current().hidden, 'Even cached loads clear the old frame synchronously');
    await cached;
    assert.equal(f.current().src, 'cached.jpg');
    assert.equal(f.current().alt, 'Cached photo');
    assert(!f.current().hidden);
    f.loader.clear();
    assert(f.current().hidden);
    assert.equal(f.current().src, '');
  }],
];

const originalDocument = globalThis.document;
try {
  for (const [name, run] of tests) {
    await run();
    console.log('PASS:', name);
  }
  console.log(`Passed ${tests.length} photo-loader race regressions.`);
} finally {
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
}
