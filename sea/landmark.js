// A page built around one landmark on a sand islet, with photos collaged around it: Kirby House, Civic Life, Student Government, Kindergarten, Divided by 101, Rise and Decline and About.
import * as THREE from 'three';
import {createIslandBase, createSymbol} from './symbols.js';
import {createAct} from './acts.js';

const ISLET_RADIUS = 2.6, TOP = 4.1, BOB = .05;

// Sticker faces floating around the landmark: they bob, and hop when clicked.
const STICKER = {height: 1.6, hop: 1.1, bob: .12};
// Left of the lighthouse, right of it, and up behind it, so all three stay in view.
const STICKER_SPOTS = [[-3, 1.3, 1.1], [3, 1, 1.2], [-1.7, 3.5, -1.2]];

function createLandmark(scene, {symbol, color, seed, scale, rise, stickers = [], ownBand = false, frameWidth = .3, act}, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  group.add(createIslandBase(color, ISLET_RADIUS, seed));
  // Wrapped, because a model that loads later sets its own scale and position.
  const holder = new THREE.Group();
  holder.scale.setScalar(scale);
  holder.position.y = rise;
  const model = createSymbol(symbol);
  holder.add(model);
  group.add(holder);
  // Niki's face playing along: the violin bow or the singing, as on the Arts & Music islets.
  const playAct = act ? createAct(act, model) : null;

  const loader = new THREE.TextureLoader();
  const faces = stickers.map((name, index) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthWrite: false}));
    loader.load(new URL(`./assets/stickers/${name}.png`, import.meta.url).href, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      sprite.material.map = texture;
      sprite.material.needsUpdate = true;
      sprite.scale.set(STICKER.height * texture.image.width / texture.image.height, STICKER.height, 1);
    });
    sprite.userData = {home: new THREE.Vector3(...STICKER_SPOTS[index % STICKER_SPOTS.length]), seed: index * 1.7, hop: 0};
    sprite.position.copy(sprite.userData.home);
    group.add(sprite);
    return sprite;
  });
  const ray = new THREE.Raycaster();

  // The islet's rim in every direction, plus the top of the landmark.
  // Niki's face in an act floats above the landmark, so it needs some extra headroom.
  const top = act ? TOP + .9 : TOP;
  const edge = [[-1, 0, 0], [1, 0, 0], [0, 0, 1], [0, 0, -1], [0, top, 0]].map(([x, y, z]) => new THREE.Vector3(x * ISLET_RADIUS * 1.1, y, z * ISLET_RADIUS * 1.1));
  // The stickers have to fit in view too.
  for (const face of faces) edge.push(face.userData.home.clone().setY(face.userData.home.y + STICKER.height / 2));

  return {
    edge,
    frame: true,
    frameWidth,
    // With notes beside the landmark instead of above it, it gets the space between the title and the tags.
    band: ownBand ? (height, tall) => {
      const rects = selector => [...document.querySelectorAll(selector)].map(el => el.getBoundingClientRect()).filter(box => box.width);
      if (tall) return {top: Math.max(...rects('.print:not(.note)').map(box => box.bottom)) + 6, bottom: Math.min(...rects('.print.note').map(box => box.top)) - 6};
      return {top: Math.max(...rects('#zoom-title, #golf-why').map(box => box.bottom)) + 10, bottom: Math.min(...rects('#facts > li').map(box => box.top)) - 10};
    } : undefined,
    // Looking down far enough that the bright sky stays off the title.
    angle: 34,
    shores: [[0, 0, ISLET_RADIUS], ...faces.map(face => [face.userData.home.x, face.userData.home.z, .5])],
    lighthouse: model.userData.beam ? model : null,
    pick(ndc) {
      if (!faces.length) return false;
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(faces)[0];
      if (!hit) return false;
      hit.object.userData.hop = 1;
      return true;
    },
    update(active, center, unit, elapsed, reduced, dt) {
      group.visible = active;
      playAct?.(dt, active, reduced);
      if (!active) return;
      group.position.set(center.x, reduced ? 0 : Math.sin(elapsed * .8) * BOB * unit, center.z);
      group.scale.setScalar(unit);
      for (const face of faces) {
        const {home, seed} = face.userData;
        face.userData.hop = Math.max(0, face.userData.hop - dt * 1.6);
        const jump = Math.sin(face.userData.hop * Math.PI) * STICKER.hop;
        face.position.set(home.x, home.y + (reduced ? 0 : Math.sin(elapsed * 1.3 + seed) * STICKER.bob) + jump, home.z);
        face.material.rotation = reduced ? 0 : Math.sin(elapsed * .9 + seed) * .08 + face.userData.hop * Math.PI * 2;
      }
    },
  };
}

export const createKirby = scene => createLandmark(scene, {symbol: 'house', color: '#ffc4d6', seed: 4, scale: 3.5, rise: .36});
export const createCivic = scene => createLandmark(scene, {symbol: 'civicHall', color: '#d6e7c7', seed: 5, scale: 3.4, rise: .36});
export const createDivide = scene => createLandmark(scene, {symbol: 'highway', color: '#c7d4dc', seed: 4, scale: 2.5, rise: .36});
export const createDaqing = scene => createLandmark(scene, {symbol: 'pumpjack', color: '#e3d7c0', seed: 7, scale: 3.2, rise: .36});
export const createCouncil = scene => createLandmark(scene, {symbol: 'ballot', color: '#bcd9f2', seed: 7, scale: 2.7, rise: .36});
export const createCare = scene => createLandmark(scene, {symbol: 'blocks', color: '#f6e29c', seed: 9, scale: 2.7, rise: .36});
export const createViolin = scene => createLandmark(scene, {symbol: 'violin', color: '#f8bfca', seed: 2, scale: 2.4, rise: .36, act: 'violin'});
export const createVocal = scene => createLandmark(scene, {symbol: 'stageMic', color: '#c9bdf4', seed: 5, scale: 2.2, rise: .36, act: 'sing'});
export const createTheatre = scene => createLandmark(scene, {symbol: 'playhouse', color: '#f6dcae', seed: 9, scale: 3.2, rise: .36});
export const createAbout =(scene, camera) => createLandmark(scene, {symbol: 'lighthouse', color: '#f5dfaf', seed: 3, scale: 2, rise: .36, stickers: ['wink', 'laugh', 'surprised'], ownBand: true, frameWidth: .33}, camera);
