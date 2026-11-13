// Verify that every retained source photo, design page and film remains reachable.
// Run from any directory: node media/audit-sea-media.mjs
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {ISLANDS, EXTRAS} from '../sea/islands.js';
import {imageMedia} from '../dist/media-images.js';
import {videoMedia} from '../dist/media-videos.js';
import {galleryItems} from '../sea/gallery-media.js';

const root = new URL('../', import.meta.url);
const base = 'https://site.invalid/sea/';
const pathOf = path => new URL(path, base).pathname;
const venues = [...ISLANDS, ...EXTRAS].flatMap(place => place.islets || [place]).filter(place => place.course);
const reachable = new Set();
for (const place of venues) {
  const media = [...(imageMedia[place.media || place.id] || []), ...(videoMedia[place.media || place.id] || [])];
  for (const entry of place.photos || []) {
    assert(!entry.empty, `${place.id}: empty featured slot`);
    if (typeof entry === 'string') assert(media.some(item => item.id === entry), `${place.id}: unresolved ${entry}`);
  }
  for (const index of place.phonePhotos || []) assert(place.photos[index], `${place.id}: invalid phone photo ${index}`);
  const items = galleryItems(place);
  const paths = items.map(item => pathOf(item.src));
  assert.equal(new Set(paths).size, paths.length, `${place.id}: duplicate gallery path`);
  for (const item of items) {
    reachable.add(pathOf(item.src));
    for (const field of ['src', 'thumb', 'print']) {
      if (!item[field]) continue;
      const relative = pathOf(item[field]).slice(1);
      assert(existsSync(new URL(relative, root)), `${place.id}: missing ${relative}`);
    }
  }
  console.log(`${place.id}: ${items.filter(item => !item.film).length} images, ${items.filter(item => item.film).length} films`);
}
const images = Object.values(imageMedia).flat(), videos = Object.values(videoMedia).flat();
for (const item of [...images, ...videos]) {
  assert(reachable.has('/dist/' + item.src.replace(/^\.\//, '')), `Archive item is unreachable: ${item.id}`);
}
// A deployed root and the local /sea/ entry must resolve shared resources identically.
for (const item of venues.flatMap(galleryItems)) {
  const published = new URL(item.src, 'https://site.invalid/').pathname;
  const local = pathOf(item.src);
  assert.equal(published, local.startsWith('/sea/') ? local.slice(4) : local);
}
const index = readFileSync(new URL('sea/index.html', root), 'utf8');
assert(index.includes('id="gallery"') && index.includes('id="open-gallery"'));
console.log(`PASS: all ${images.length} images/design pages and ${videos.length} archive films are reachable.`);
