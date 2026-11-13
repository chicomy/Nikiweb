import * as THREE from 'three';
import {ISLANDS, EXTRAS} from './islands.js';
import {createIslandBase, createSymbol, createBoat, prepareGlass} from './symbols.js';
import {createWater, createNameTexture, MAX_SHORES} from './water.js';
import {createWake} from './wake.js';
import {createSky} from './sky.js';
import {createAct, ACT_VIEWS} from './acts.js';
import {createCourse} from './course.js';
import {createPitch} from './pitch.js';
import {createCourt} from './court.js';
import {createDisplay} from './display.js';
import {createKirby, createCivic, createCouncil, createCare, createAbout, createDivide, createDaqing, createViolin, createVocal, createTheatre} from './landmark.js';
import {createSociety} from './society.js';
import {createShowcase} from './showcase.js';
import {createPhotoWall} from './photo-wall.js';
import {createTour} from './tour.js';
import {createArrangement} from './layout.js';
import {createTextEditor, applyTextEdits} from './text-editor.js';
import {createGallery} from './gallery.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const all = [...ISLANDS, ...EXTRAS];
const textEdits = await fetch(new URL('./text-edits.json', import.meta.url), {cache: 'no-store'}).then(reply => (reply.ok ? reply.json() : {}), () => ({}));
applyTextEdits(all, textEdits);

// World scene
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('#sea').append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, .1, 2600);
const HOME = {position: new THREE.Vector3(0, 40, 26), look: new THREE.Vector3(0, 0, 0)};
camera.position.copy(HOME.position);
camera.lookAt(HOME.look);

const hemi = new THREE.HemisphereLight('#fff7e4', '#7fd0da', 1.9);
const sun = new THREE.DirectionalLight('#fff3da', 2.4);
sun.position.set(-16, 34, 16);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left: -34, right: 34, top: 30, bottom: -30, far: 90});
sun.shadow.bias = -.0005;
sun.shadow.radius = 5;
scene.add(hemi, sun);

await Promise.all([document.fonts.load('800 80px "Bricolage Grotesque"'), document.fonts.load('700 40px "Bricolage Grotesque"')]);

const water = createWater(createNameTexture(["Hi, I'm Niki", 'I research, design, build and play.']));
scene.add(water.mesh);
const sky = createSky(water.uniforms);
scene.add(sky);

prepareGlass(renderer);
renderer.transmissionResolutionScale = .6;

// Islands
const labels = $('#labels');
const entries = all.map((data, index) => {
  const root = new THREE.Group();
  const lift = new THREE.Group();
  root.add(lift);
  const isCluster = !!data.islets;
  if (data.color && !isCluster) lift.add(createIslandBase(data.color, data.small ? .72 : 1.62, index * 1.7 + 1));
  const symbol = createSymbol(data.symbol);
  symbol.position.y = data.color && !isCluster ? .36 : 0;
  if (!data.small && !isCluster) symbol.scale.setScalar(1.12);
  if (isCluster) symbol.scale.setScalar(.92);
  lift.add(symbol);
  scene.add(root);

  // Invisible hover area: a low drum, so it never reaches up over the name in the water.
  const hitRadius = data.small ? 1.1 : isCluster ? 1.85 : 2.05;
  const hitHeight = data.small ? 2.4 : data.symbol === 'community' ? .9 : isCluster ? 1.6 : 2.6;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(hitRadius, hitRadius, hitHeight, 20), new THREE.MeshBasicMaterial({visible: false}));
  hit.position.y = hitHeight / 2;
  hit.userData.id = data.id;
  root.add(hit);

  const label = document.createElement('a');
  label.className = `label${data.small ? ' small' : ''}`;
  label.href = `#/${data.id}`;
  label.innerHTML = `<b>${esc(data.name)}</b><span><i>${esc(data.tagline)}</i></span>`;
  labels.append(label);
  label.addEventListener('pointerenter', () => { labelHover = data.id; });
  label.addEventListener('pointerleave', () => { if (labelHover === data.id) labelHover = null; });
  label.addEventListener('focus', () => { if (usingKeyboard) labelHover = data.id; });
  label.addEventListener('blur', () => { if (labelHover === data.id) labelHover = null; });

  return {
    data, root, lift, symbol, hit, label, index, isCluster,
    bobSeed: index * 1.31,
    scale: reduced ? 1 : 0, velocity: 0,
    hover: 0,
    radius: data.small ? .78 : 1.75,
    enter: reduced ? 0 : .28 + index * .11,
    base: new THREE.Vector3(),
    anchor: new THREE.Vector3(),
  };
});
const byId = id => entries.find(e => e.data.id === id);
const lighthouseEntry = entries.find(e => e.data.symbol === 'lighthouse');
const beamFrom = new THREE.Vector3(), beamAim = new THREE.Vector3(), beamLook = new THREE.Vector3(), beamGoal = new THREE.Vector3();
const BEAM_DEAD_ZONE = .35, BEAM_DIP = .1;
// Turns side to side only, staying nearly level so it never shines down through its own tower,
// and dims as it turns toward the viewer, where it would wash the tower out.
function aimBeam(lit, elapsed, dt) {
  const {beam, beamRay, beamStrength} = lit.userData;
  const dir = lit.userData.beamDir ??= new THREE.Vector3(1, 0, 0);
  beam.getWorldPosition(beamFrom);
  const onScreen = Math.abs(pointer.x) <= 1;
  let dx = Math.cos(reduced ? 0 : elapsed * .5), dz = Math.sin(reduced ? 0 : elapsed * .5);
  if (onScreen) {
    ray.setFromCamera(pointer, camera);
    // Over the water, toward the point under the cursor; above the horizon, the way the cursor points.
    const hit = ray.ray.intersectPlane(seaLevel, beamAim);
    dx = hit ? hit.x - beamFrom.x : ray.ray.direction.x;
    dz = hit ? hit.z - beamFrom.z : ray.ray.direction.z;
  }
  const reach = Math.hypot(dx, dz);
  // Right on top of the lighthouse there's no clear direction, so it keeps the last one.
  if (reach > BEAM_DEAD_ZONE * unit || !onScreen) {
    beamGoal.set(dx / reach, -BEAM_DIP, dz / reach).normalize();
    dir.lerp(beamGoal, reduced ? 1 : Math.min(1, dt * 6)).normalize();
  }
  beam.lookAt(beamLook.copy(beamFrom).add(dir));
  // The flat ray rolls around its own length to face the camera.
  beam.updateMatrixWorld(true);
  beam.worldToLocal(beamLook.copy(camera.position));
  beamRay.rotation.z = Math.atan2(-beamLook.x, beamLook.y);
  beamAim.copy(camera.position).sub(beamFrom).setY(0).normalize();
  beamStrength.value = 1 - .85 * Math.max(0, beamAim.dot(beamGoal.copy(dir).setY(0).normalize())) ** 1.5;
}

// Islets act as separate places once the camera has zoomed into their island.
// Where they go in the landscape view: a shallow arc across the horizon, or rows on a tall phone.
const SCENE_SCALE = .92;
const ISLET_SPOTS = {
  wide: {2: [[-1.9, 0], [1.9, 0]], 3: [[-2, .25], [0, -.35], [2, .25]], 4: [[-3.3, .35], [-1.15, -.75], [1.15, -.75], [3.3, .35]]},
  tall: {2: [[-1.14, -.8], [1.14, -.8]], 3: [[-1.14, -4.2], [1.14, -4.2], [0, 2.5]], 4: [[-1.14, -4.2], [1.14, -4.2], [-1.14, 2.5], [1.14, 2.5]]},
};
const isletSpot = (cluster, index) => {
  const shape = tall ? 'tall' : 'wide';
  return (cluster.data.isletSpots?.[shape] ?? ISLET_SPOTS[shape][cluster.islets.length])[index];
};
const isletLabels = $('#islet-labels');
const makeIslets = cluster => cluster.data.islets.map((data, index) => {
  const group = cluster.symbol.children[index];
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(.82, .82, 1.7, 20), new THREE.MeshBasicMaterial({visible: false}));
  hit.position.y = .85;
  hit.userData.isletId = data.id;
  group.add(hit);
  const label = document.createElement('a');
  label.className = 'label ready';
  label.href = `#/${cluster.data.id}/${data.id}`;
  label.innerHTML = `<b>${esc(data.name)}</b><span><i>${esc(data.tagline)}</i></span>`;
  isletLabels.append(label);
  label.addEventListener('pointerenter', () => { labelIslet = data.id; });
  label.addEventListener('pointerleave', () => { if (labelIslet === data.id) labelIslet = null; });
  label.addEventListener('focus', () => { if (usingKeyboard) labelIslet = data.id; });
  label.addEventListener('blur', () => { if (labelIslet === data.id) labelIslet = null; });
  // Spinning balls: found once here, because models load in later without any.
  const spinners = [];
  group.traverse(o => { if (o.userData.spin) spinners.push(o); });
  return {data, group, hit, label, index, spinners, home: group.position.clone(), scale: 1, velocity: 0, hover: 0};
});
for (const e of entries) if (e.isCluster) {
  e.islets = makeIslets(e);
  e.spread = 0;
  e.reach = (Math.max(...e.islets.map(i => i.home.z)) + .68) * SCENE_SCALE + .25;
}
const allIslets = entries.flatMap(e => e.islets || []);
const isletById = id => allIslets.find(i => i.data.id === id);
// Scenes that play while a place is open, for islets and whole islands alike.
const acts = [
  ...allIslets.filter(i => i.data.act).map(i => ({isOpen: () => openIslet === i.data.id, update: createAct(i.data.act, i.group.children[1])})),
  ...entries.filter(e => e.data.act).map(e => ({isOpen: () => opened === e.data.id, update: createAct(e.data.act, e.symbol)})),
];
const openCluster = () => (opened && byId(opened)?.isCluster ? byId(opened) : null);
let boatSize = 1, usingKeyboard = false, zoomed = false, openIslet = null, labelIslet = null, hoveredIslet = null;

// Basketball, Golf and Soccer each open as a whole island of their own, in place of their islet.
const venueScenes = {golf: createCourse, pitch: createPitch, court: createCourt, display: createDisplay, showcase: createShowcase, kirby: createKirby, civic: createCivic, council: createCouncil, care: createCare, about: createAbout, divide: createDivide, daqing: createDaqing, society: createSociety, violin: createViolin, vocal: createVocal, theatre: createTheatre};
const ARTS_PAGES = ['violin', 'vocal', 'theatre'];
const venues = [
  ...allIslets.filter(islet => islet.data.course).map(islet => ({
    islet,
    owner: entries.find(entry => entry.isCluster && entry.islets.includes(islet)),
  })),
  // A whole island can also open this way, as Candle does.
  ...entries.filter(entry => entry.data.course).map(entry => ({islet: entry, owner: entry, whole: true})),
].map(venue => ({...venue, scene: venueScenes[venue.islet.data.course](scene, camera)}));
const wall = createPhotoWall($('#prints'), $('#viewer'));
const gallery = createGallery($('#gallery'), $('#open-gallery'));
const tour = createTour($('#tour'), wall, () => openVenue().scene);
wall.onResize = () => { if (inCourse()) frameCamera(); };
// Golf's arrangement. Phones keep their own automatic layout.
const savedLayout = await fetch(new URL('./golf-layout.json', import.meta.url), {cache: 'no-store'}).then(reply => (reply.ok ? reply.json() : {}), () => ({}));
const arrangement = createArrangement({saved: savedLayout, wall, applies: () => openVenue()?.islet.data.course === 'golf' && !tall && width > 760});
const textEditor = createTextEditor({
  saved: textEdits,
  isDialogOpen: () => gallery.open || !$('#viewer').hidden || !$('#scorecard').hidden,
  onCancel: () => {
    arrangement.clear();
    showRoute();
  },
});
wall.textOf = textEditor.textOf;
wall.onShow = textEditor.refresh;
document.body.classList.toggle('can-edit', ['127.0.0.1', 'localhost'].includes(location.hostname));
const openVenue = () => venues.find(venue => (venue.whole ? opened === venue.islet.data.id : venue.islet.data.id === openIslet));
const inCourse = () => !!openVenue();

const boat = createBoat();
scene.add(boat);
const updateWake = createWake(scene, water.uniforms);
const boatState = {pos: new THREE.Vector3(0, 0, 11), heading: 0, speed: 0};

// Layout is set in screen fractions, so the same arrangement fits any window.
const ray = new THREE.Raycaster();
const seaLevel = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function onSea(nx, ny, cam = camera) {
  ray.setFromCamera(new THREE.Vector2(nx, ny), cam);
  return ray.ray.intersectPlane(seaLevel, new THREE.Vector3()) || new THREE.Vector3();
}

let tall = false, unit = 1, width = 1, height = 1;
const layoutCam = new THREE.PerspectiveCamera();
function layout() {
  const wasTall = tall;
  width = innerWidth;
  height = innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  tall = camera.aspect < .95;
  camera.fov = tall ? 36 : 30;
  camera.updateProjectionMatrix();

  layoutCam.copy(camera);
  layoutCam.clearViewOffset();
  layoutCam.position.copy(HOME.position);
  layoutCam.lookAt(HOME.look);
  layoutCam.updateMatrixWorld();
  const left = onSea(-1, 0, layoutCam).x, right = onSea(1, 0, layoutCam).x;
  const span = right - left;
  unit = tall ? span / 9.4 : Math.min(span / 19, 2.05);
  const name = onSea(0, tall ? .68 : 0, layoutCam);
  const nameWidth = tall ? span * 1.02 : Math.min(span * .5, 27);
  water.uniforms.uNameRect.value.set(name.x, name.z, nameWidth, nameWidth / 2);

  for (const e of entries) {
    const [nx, ny] = e.data.layout[tall ? 'tall' : 'wide'];
    e.base.copy(onSea(nx, ny, layoutCam));
    e.root.position.copy(e.base);
  }
  // The boat idles below the name.
  boatState.home = onSea(tall ? 0 : -.28, tall ? .36 : -.3, layoutCam);
  if (!boatState.placed) { boatState.pos.copy(boatState.home); boatState.placed = true; }
  boat.scale.setScalar(unit * .72);
  if (inCourse()) {
    const venue = openVenue();
    if (wasTall !== tall) {
      wall.close();
      renderVenue(venue.islet.data, venue.owner.data);
    } else {
      wall.place(tall, venue.islet.data.photoSpots);
      arrangement.apply();
    }
  }
  frameCamera(true);
}

// Hover
const pointer = new THREE.Vector2(9, 9);
let pointerHover = null, labelHover = null, hovered = null, opened = null, lastOpened = null;
const hits = entries.map(e => e.hit);
let surpriseUntil = 0, boatHop = 0, touchGoal = null;
addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') touchGoal = new THREE.Vector2(e.clientX / width * 2 - 1, -(e.clientY / height) * 2 + 1);
});
addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  pointer.set(e.clientX / width * 2 - 1, -(e.clientY / height) * 2 + 1);
});
document.documentElement.addEventListener('mouseleave', () => {
  pointer.set(9, 9);
});

// Only move focus to a label for keyboard users; a mouse click would leave it outlined and stuck popped up.
addEventListener('keydown', e => { if (e.key === 'Tab') usingKeyboard = true; });
addEventListener('pointerdown', () => { usingKeyboard = false; });
function returnFocus(label) {
  if (usingKeyboard) label.focus({preventScroll: true});
  else document.activeElement?.blur?.();
  labelHover = labelIslet = null;
}

// Hit areas overlap on screen, so the island whose centre is closest to the pointer wins.
function pickIsland(ndc) {
  ray.setFromCamera(ndc, camera);
  let best = null, bestDistance = Infinity;
  for (const hit of ray.intersectObjects(hits)) {
    const e = byId(hit.object.userData.id);
    const center = new THREE.Vector3(e.base.x, unit * .8, e.base.z).project(camera);
    const distance = Math.hypot((center.x - ndc.x) * camera.aspect, center.y - ndc.y);
    if (distance < bestDistance) { best = e.data.id; bestDistance = distance; }
  }
  return best;
}

function pickIslet(ndc) {
  ray.setFromCamera(ndc, camera);
  let best = null, bestDistance = Infinity;
  for (const hit of ray.intersectObjects(openCluster().islets.map(i => i.hit))) {
    const islet = isletById(hit.object.userData.isletId);
    const center = islet.group.getWorldPosition(new THREE.Vector3()).project(camera);
    const distance = Math.hypot((center.x - ndc.x) * camera.aspect, center.y - ndc.y);
    if (distance < bestDistance) { best = islet.data.id; bestDistance = distance; }
  }
  return best;
}

function onBoat(ndc) {
  ray.setFromCamera(ndc, camera);
  return ray.intersectObject(boat.userData.sticker).length > 0;
}

renderer.domElement.addEventListener('pointerdown', e => {
  if (textEditor.editing || !inCourse()) return;
  openVenue().scene.grab?.(new THREE.Vector2(e.clientX / width * 2 - 1, -(e.clientY / height) * 2 + 1), e);
});

renderer.domElement.addEventListener('click', e => {
  if (textEditor.editing) return;
  const point = new THREE.Vector2(e.clientX / width * 2 - 1, -(e.clientY / height) * 2 + 1);
  if (inCourse()) {
    if (openVenue().scene.pick?.(point)) return;
    // On these pages a click just plays with the water.
    const water = onSea(point.x, point.y);
    updateWake.splash(water.x, water.z, unit);
    return;
  }
  const id = zoomed ? pickIslet(point) : pickIsland(point);
  // Islands win: the boat is often right beside the cursor now.
  if ((!opened || zoomed) && !id && onBoat(point)) {
    surpriseUntil = elapsed + 1.4;
    boatHop = 1;
    return;
  }
  if (zoomed) {
    if (id) location.hash = `#/${opened}/${id}`;
  } else if (id && !opened) location.hash = `#/${id}`;
  else if (!id && opened) location.hash = openIslet ? `#/${opened}` : '#/';
});

function setHover(id) {
  if (id === hovered) return;
  hovered = id;
  document.body.classList.toggle('hovering', !!id || !!hoveredIslet);
  for (const e of entries) e.label.classList.toggle('on', e.data.id === id);
}

function setIsletHover(id) {
  if (id === hoveredIslet) return;
  hoveredIslet = id;
  document.body.classList.toggle('hovering', !!id || !!hovered);
  for (const islet of allIslets) islet.label.classList.toggle('on', islet.data.id === id);
}

// Camera: glide home above the sea, or swoop to water level at whatever is open.
const camGoal = {position: HOME.position.clone(), look: HOME.look.clone()};
const camNow = {position: HOME.position.clone(), look: HOME.look.clone()};
function frameCamera(snap = false) {
  const e = opened && byId(opened);
  if (!e) {
    camGoal.position.copy(HOME.position);
    camGoal.look.copy(HOME.look);
  } else if (zoomed) {
    // Drop to water level and look across at the islets, with the horizon behind them.
    const halfView = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const widest = Math.max(...e.islets.map((_, index) => Math.abs(isletSpot(e, index)[0])));
    const reach = widest * SCENE_SCALE + .72;
    const distance = reach * unit / (halfView * camera.aspect * .9);
    if (tall) {
      // A phone needs a higher camera so the two rows stack instead of hiding each other.
      const height = 7 * unit, z = e.base.z + (2.5 * SCENE_SCALE * unit) + distance;
      camGoal.look.set(e.base.x, 0, z - height / Math.tan(THREE.MathUtils.degToRad(19)));
      camGoal.position.set(e.base.x, height, z);
    } else {
      camGoal.look.set(e.base.x, .85 * unit, e.base.z);
      camGoal.position.set(e.base.x, 1.2 * unit, e.base.z + distance);
    }
  } else if (inCourse() && openVenue().scene.frame) {
    // A shop window: looking slightly down at the display, sized to the space between the cards.
    const display = openVenue().scene;
    const boxes = selector => [...document.querySelectorAll(selector)].map(el => el.getBoundingClientRect()).filter(box => box.width);
    const above = boxes(tall ? '.print:not(.note)' : '.print.note').map(box => box.bottom);
    const below = boxes(tall ? '.print.note' : '#facts > li').map(box => box.top);
    const band = display.band?.(height, tall);
    // A page that scrolls can't measure where things are now, so its model has a set space on screen.
    const top = band ? band.top : display.room ? (tall ? 150 : 70) : Math.max(...above) + 6;
    const bottom = band ? band.bottom : display.room ? (tall ? height * .47 - 48 : height - 132) : Math.min(...below) - 6;
    // The display fits between the side panels when a page has them.
    const [leftSide] = boxes('.tour-left'), [rightSide] = boxes('.tour-right');
    const share = tall ? .98 : display.room && leftSide && rightSide ? (rightSide.left - leftSide.right - 16) / width : display.frameWidth || .62;
    const look = new THREE.Vector3(e.base.x, unit * .9, e.base.z), angle = THREE.MathUtils.degToRad(display.angle || 22);
    let distance = 30 * unit, middle = height / 2;
    layoutCam.copy(camera);
    layoutCam.clearViewOffset();
    for (let pass = 0; pass < 6; pass++) {
      layoutCam.position.set(look.x, look.y + Math.sin(angle) * distance, look.z + Math.cos(angle) * distance);
      layoutCam.lookAt(look);
      layoutCam.updateMatrixWorld();
      const points = display.edge.map(point => tmp.copy(point).multiplyScalar(unit).add(e.base).setY(point.y * unit).project(layoutCam).clone());
      const xs = points.map(p => (p.x * .5 + .5) * width), ys = points.map(p => (-p.y * .5 + .5) * height);
      const spanY = Math.max(...ys) - Math.min(...ys);
      middle = (Math.max(...ys) + Math.min(...ys)) / 2;
      distance *= Math.max((Math.max(...xs) - Math.min(...xs)) / (width * share), spanY / (bottom - top));
    }
    camGoal.look.copy(look);
    camGoal.position.set(look.x, look.y + Math.sin(angle) * distance, look.z + Math.cos(angle) * distance);
    displayShift = middle - (top + bottom) / 2;
    if (snap) {
      camNow.position.copy(camGoal.position);
      camNow.look.copy(camGoal.look);
    }
  } else if (inCourse()) {
    const course = openVenue().scene;
    // High above the island: try it at several spots in the open water and keep whichever lets it be largest
    // without touching a photo, a card, a tag or the title.
    const facts = $('#facts').getBoundingClientRect(), why = $('#golf-why').getBoundingClientRect();
    const top = tall ? height * .3 : why.bottom + 10, bottom = tall ? height * .53 : facts.top - 8;
    const room = width * (tall ? 1 : .72);
    const halfView = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const toLift = perUnit => unit / perUnit * height / (2 * halfView) * .93;
    // Extra margin, because perspective makes the near edge of the island look larger.
    const startLift = toLift(Math.min(room * .92 / course.size.width, (bottom - top) * .95 / course.size.depth));
    const boxes = [...document.querySelectorAll('.print, #facts > li, #zoom-title, #golf-why')].map(el => el.getBoundingClientRect()).filter(box => box.width);
    const viewFrom = (rise, screenX, screenY) => {
      const perPixel = 2 * Math.hypot(rise, rise * .4) * halfView / height;
      const lookX = e.base.x + (width / 2 - screenX) * perPixel, lookZ = e.base.z + (height / 2 - screenY) * perPixel;
      layoutCam.copy(camera);
      layoutCam.clearViewOffset();
      layoutCam.position.set(lookX, rise, lookZ + rise * .4);
      layoutCam.lookAt(lookX, 0, lookZ);
      layoutCam.updateMatrixWorld();
      // On a phone the flag may reach up between the photos; only the land has to stay clear.
      const edge = (tall ? course.edge.slice(0, -1) : course.edge).map(point => {
        const onScreen = tmp.copy(point).multiplyScalar(unit).add(e.base).project(layoutCam);
        return [(onScreen.x * .5 + .5) * width, (-onScreen.y * .5 + .5) * height];
      });
      return {lookX, lookZ, edge};
    };
    const chosen = arrangement.island();
    if (chosen) {
      // A saved spot and size: find the camera that puts the island exactly there.
      const goalWidth = chosen.w * arrangement.scale(), goalX = chosen.x * width, goalY = chosen.y * height;
      let rise = startLift, screenX = width / 2, screenY = height / 2, view;
      for (let pass = 0; pass < 6; pass++) {
        view = viewFrom(rise, screenX, screenY);
        const xs = view.edge.slice(0, -1).map(p => p[0]), ys = view.edge.slice(0, -1).map(p => p[1]);
        rise *= (Math.max(...xs) - Math.min(...xs)) / goalWidth;
        screenX += goalX - (Math.max(...xs) + Math.min(...xs)) / 2;
        screenY += goalY - (Math.max(...ys) + Math.min(...ys)) / 2;
      }
      view = viewFrom(rise, screenX, screenY);
      camGoal.look.set(view.lookX, 0, view.lookZ);
      camGoal.position.set(view.lookX, rise, view.lookZ + rise * .4);
      if (snap) {
        camNow.position.copy(camGoal.position);
        camNow.look.copy(camGoal.look);
      }
      return;
    }
    const fitsAt = (rise, screenX, screenY) => {
      const {lookX, lookZ, edge} = viewFrom(rise, screenX, screenY);
      const land = tall ? edge : edge.slice(0, -1);
      const inside = (x, y) => {
        let odd = false;
        for (let i = 0, j = land.length - 1; i < land.length; j = i++) {
          if ((land[i][1] > y) !== (land[j][1] > y) && x < (land[j][0] - land[i][0]) * (y - land[i][1]) / (land[j][1] - land[i][1]) + land[i][0]) odd = !odd;
        }
        return odd;
      };
      const ys = edge.map(p => p[1]), xs = edge.map(p => p[0]);
      if (Math.min(...ys) < top - 40 || Math.max(...ys) > bottom || Math.min(...xs) < 4 || Math.max(...xs) > width - 4) return null;
      if (boxes.some(box => [[box.left, box.top], [box.right, box.top], [box.left, box.bottom], [box.right, box.bottom], [(box.left + box.right) / 2, (box.top + box.bottom) / 2]].some(([x, y]) => inside(x, y)) || edge.some(([x, y]) => x > box.left - 6 && x < box.right + 6 && y > box.top - 6 && y < box.bottom + 6))) return null;
      return {lookX, lookZ};
    };
    let best = null;
    for (let rise = startLift, attempt = 0; attempt < 30 && !best; attempt++, rise *= 1.03) {
      // Highest spot first, so a tie goes to the one closest to the title.
      for (let row = 0; row <= 8 && !best; row++) {
        for (const shift of [0, -.02, .02, -.04, .04]) {
          const spot = fitsAt(rise, width / 2 + shift * width, top + (bottom - top) * (.28 + row * .05));
          if (spot) {
            best = {...spot, rise};
            break;
          }
        }
      }
    }
    best ??= {lookX: e.base.x, lookZ: e.base.z, rise: startLift * 2.4};
    camGoal.look.set(best.lookX, 0, best.lookZ);
    camGoal.position.set(best.lookX, best.rise, best.lookZ + best.rise * .4);
  } else {
    // Stay low and move in, leaving the island or islet in the space beside its page.
    let x = e.base.x, z = e.base.z, distance = 8.5 * unit, lookY = 1.4 * unit;
    if (openIslet) {
      const [sx, sz] = isletSpot(e, isletById(openIslet).index);
      x += sx * SCENE_SCALE * unit;
      z += sz * SCENE_SCALE * unit;
      distance = 8 * unit;
      lookY = .85 * unit;
    } else if (e.data.symbol === 'lighthouse') {
      distance = 9.5 * unit;
      lookY = 1.2 * unit;
    } else if (e.data.symbol === 'bottle') {
      distance = 4.6 * unit;
      lookY = .3 * unit;
    }
    // A phone is narrow, so everything needs more distance to fit across.
    if (tall) distance *= 1.5;
    const view = ACT_VIEWS[(openIslet ? isletById(openIslet).data : e.data).act];
    if (view) {
      // Frame the scene; on a phone, pull back and sit it above the shorter page.
      const far = tall ? view.tallDistance ?? view.distance * 1.35 : view.distance;
      distance = far * unit;
      lookY = view.lookY * unit;
    }
    const lookX = x;
    camGoal.look.set(lookX, lookY, z);
    camGoal.position.set(lookX, lookY + (view?.rise ?? (tall ? 1 : .25)) * unit, z + distance);
  }
  if (snap) {
    camNow.position.copy(camGoal.position);
    camNow.look.copy(camGoal.look);
  }
}

// Island pages
const panel = $('#panel');
let stripHeight = 0, viewShift = 0, displayShift = 0;
const body = $('#panel-body');

const photoCard = label => `<div class="card card-photo"><div class="ph" role="img" aria-label="Placeholder image">Photo · ${esc(label)}</div></div>`;

// Everything about a place, as a row of cards: who and what first, then each part of the story with its photo.
function renderCards(data, owner, base) {
  const projects = data.projects || [];
  const only = projects.length === 1 ? projects[0] : null;
  const pathOf = project => `${owner.id}.projects.${owner.projects.indexOf(project)}`;
  const words = (tag, path, value, extra = '') => `<${tag} data-text="${path}"${extra}>${esc(value)}</${tag}>`;
  const statRow = (stats, path) => `<div class="stats">${stats.map((stat, i) => `<div>${words('b', `${path}.stats.${i}.value`, stat.value)}${words('span', `${path}.stats.${i}.label`, stat.label)}</div>`).join('')}</div>`;
  // More than two numbers get a card of their own, so nothing has to scroll inside a card.
  const statCard = (project, path) => (project.stats?.length > 2 ? `<article class="card card-stats">${statRow(project.stats, path)}</article>` : '');
  const inlineStats = (project, path) => (project.stats?.length && project.stats.length <= 2 ? statRow(project.stats, path) : '');
  const roleLine = (project, path) => `<small>${words('span', `${path}.role`, project.role)} · ${words('span', `${path}.years`, project.years)}</small>`;
  let html = `<article class="card card-title">${words('h2', `${base}.name`, data.name, ' id="panel-title"')}${words('p', `${base}.tagline`, data.tagline, ' class="lede"')}
    ${only ? roleLine(only, pathOf(only)) + inlineStats(only, pathOf(only)) : ''}</article>`;
  if (only) html += statCard(only, pathOf(only));
  if (data.id === 'about') html += `<div class="card card-faces">${['wink', 'laugh', 'surprised'].map(name => `<img src="./assets/stickers/${name}.png" alt="Niki, ${name} sticker">`).join('')}</div>`;
  if (data.note && !data.email) html += `<article class="card">${words('p', `${base}.note`, data.note)}</article>`;
  if (data.email) html += `<article class="card card-contact">${words('p', `${base}.note`, data.note || '')}<a class="contact-email" href="mailto:${esc(data.email)}">${esc(data.email)}</a><button class="pill contact-copy" type="button" data-copy="${esc(data.email)}">Copy email</button></article>`;
  (data.notes || []).forEach((note, i) => { html += `<article class="card">${words('h3', `${base}.notes.${i}.name`, note.name)}${words('p', `${base}.notes.${i}.text`, note.text)}</article>`; });
  (data.photoSlots || []).forEach(label => { html += photoCard(label); });
  for (const project of projects) {
    const path = pathOf(project);
    if (!only) html += `<article class="card">${words('h3', `${path}.title`, project.title)}${roleLine(project, path)}${inlineStats(project, path)}</article>${statCard(project, path)}`;
    project.pages.forEach((page, i) => {
      html += `<article class="card">${words('h3', `${path}.pages.${i}.title`, page.title)}${words('p', `${path}.pages.${i}.body`, page.body)}</article>`;
      if (page.photo?.film) html += `<button class="card card-photo card-film" type="button" data-film="${esc(page.photo.film)}" data-media="${esc(page.photo.media)}" data-caption="${esc(page.photo.caption)}" data-path="${path}.pages.${i}.photo" aria-label="Play film: ${esc(page.photo.caption)}"><img src="../dist/assets/media/videos/${esc(page.photo.film)}-poster.jpg" alt=""></button>`;
      else if (page.photo) html += `<div class="card card-photo card-photo-tall"><img src="${esc(page.photo.src)}" alt="${esc(page.photo.alt)}"></div>`;
      else if (page.image || page.video) html += photoCard(project.title);
    });
  }
  return html;
}

$('#panel').addEventListener('click', e => {
  const copy = e.target.closest('[data-copy]');
  if (copy) {
    navigator.clipboard?.writeText(copy.dataset.copy).then(() => {
      copy.textContent = 'Copied!';
      setTimeout(() => { copy.textContent = 'Copy email'; }, 1600);
    }, () => {});
    return;
  }
  const film = e.target.closest('[data-film]');
  if (!film) return;
  const {film: id, media, caption, path} = film.dataset;
  wall.fillPictures(media, [id], path, {[`${id}.mp4`.replace(/\W/g, '_')]: caption});
  wall.open(0, film);
});

// The arrows only appear when the cards don't all fit.
function syncCardArrows() {
  const fits = body.scrollWidth <= body.clientWidth + 2;
  $('#cards-prev').hidden = $('#cards-next').hidden = fits;
}
addEventListener('resize', () => { if (!panel.hidden) syncCardArrows(); });

// A vertical wheel moves along the row, and the arrow keys and buttons step a card at a time.
const stepCards = direction => body.scrollBy({left: direction * 356, behavior: reduced ? 'auto' : 'smooth'});
body.addEventListener('wheel', e => {
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  e.preventDefault();
  body.scrollLeft += e.deltaY;
}, {passive: false});
$('#cards-prev').addEventListener('click', () => stepCards(-1));
$('#cards-next').addEventListener('click', () => stepCards(1));
addEventListener('keydown', e => {
  if (!opened || panel.hidden || e.target.isContentEditable) return;
  if (e.key === 'ArrowRight') stepCards(1);
  if (e.key === 'ArrowLeft') stepCards(-1);
});

const scorecard = $('#scorecard');
function closeScorecard() {
  if (scorecard.hidden) return;
  scorecard.hidden = true;
  $('#open-scorecard')?.focus({preventScroll: true});
}
$('#facts').addEventListener('click', e => {
  if (!e.target.closest('#open-scorecard')) return;
  scorecard.hidden = false;
  scorecard.querySelector('.viewer-close').focus({preventScroll: true});
});
scorecard.addEventListener('click', e => {
  if (e.target === scorecard || e.target.closest('.viewer-close')) closeScorecard();
});
addEventListener('keydown', e => {
  if (e.key !== 'Escape' || scorecard.hidden) return;
  e.stopImmediatePropagation();
  closeScorecard();
}, true);

function renderVenue(islet, data) {
  const whole = islet === data;
  const list = whole ? ISLANDS : data.islets;
  const next = list[(list.indexOf(islet) + 1) % list.length];
  const nextHref = whole ? `#/${next.id}` : `#/${data.id}/${next.id}`;
  const base = whole ? data.id : `${data.id}.islets.${data.islets.indexOf(islet)}`;
  arrangement.clear();
  openVenue().scene.reset?.();
  $('#zoom-title').textContent = islet.title || islet.name;
  $('#zoom-title').dataset.text = `${base}.${islet.title ? 'title' : 'name'}`;
  $('#golf-why').textContent = islet.why;
  $('#golf-why').dataset.text = `${base}.why`;
  const photos = tall && islet.phonePhotos ? islet.phonePhotos.map(i => islet.photos[i]) : islet.photos;
  if (islet.tour) tour.show(islet, base, wall.fillPictures(islet.media || islet.id, photos, base, islet.captions));
  else {
    tour.hide();
    wall.fill(islet.media || islet.id, photos, islet.stories, base, islet.captions, !islet.filmStrip);
    if (islet.filmStrip) openVenue().scene.setPhotos(wall.items(), index => wall.open(index, renderer.domElement));
  }
  wall.place(tall, islet.photoSpots);
  $('#facts').innerHTML = islet.rankings.map((r, i) => `<li><div class="fact">${r.value ? `<b data-text="${base}.rankings.${i}.value">${esc(r.value)}</b>` : ''}<span data-text="${base}.rankings.${i}.label">${esc(r.label)}</span></div></li>`).join('')
    + `${islet.record ? '<li><button class="fact fact-open" id="open-scorecard" type="button"><span>Player statistics</span></button></li>' : ''}<li><a class="pill" href="${nextHref}">${esc(next.name)} →</a></li>`;
  [...$('#facts').children].forEach((li, index) => { li.dataset.slot = `fact:${index}`; });
  arrangement.apply();
  wall.settle();
  if (!islet.record) return;
  const {team, tournaments, stats, statNote, mentor} = islet.record;
  const record = `${base}.record`;
  $('#scorecard-body').innerHTML = `<h2 id="scorecard-title">Player statistics</h2><p data-text="${record}.team">${esc(team)}</p>
    <table><thead><tr><th scope="col">Tournament</th><th scope="col">Team</th><th scope="col">Individual</th></tr></thead>
    <tbody>${tournaments.map((t, i) => `<tr><td data-text="${record}.tournaments.${i}.name">${esc(t.name)}</td><td data-text="${record}.tournaments.${i}.team">${esc(t.team) || '–'}</td><td data-text="${record}.tournaments.${i}.individual">${esc(t.individual) || '–'}</td></tr>`).join('')}</tbody></table>
    <div class="stats">${stats.map((stat, i) => `<div><b data-text="${record}.stats.${i}.value">${esc(stat.value)}</b><span data-text="${record}.stats.${i}.label">${esc(stat.label)}</span></div>`).join('')}</div><p class="stat-note" data-text="${record}.statNote">${esc(statNote)}</p>
    <h3 data-text="${record}.mentor.title">${esc(mentor.title)}</h3><small data-text="${record}.mentor.when">${esc(mentor.when)}</small><p class="mentor" data-text="${record}.mentor.text">${esc(mentor.text)}</p>`;
}

// Golf has its own view, so going in or out of it (or jumping across holes) is a plain fade, not a camera flight.
const venueInHash = () => venues.find(({islet, owner, whole}) => location.hash.replace(/\/$/, '') === (whole ? `#/${owner.data.id}` : `#/${owner.data.id}/${islet.data.id}`));
const fade = $('#fade');
let routed = false;
function snapToRoute() {
  frameCamera(true);
  water.uniforms.uNameShow.value = opened ? 0 : 1;
  for (const {owner, whole} of venues) {
    for (const islet of whole ? [owner] : owner.islets) {
      islet.scale = inCourse() ? 0 : 1;
      islet.velocity = 0;
    }
  }
}
function route() {
  // Going in, out, or from one of these pages straight to another.
  const entering = venueInHash() !== openVenue();
  if (!routed || reduced) {
    routed = true;
    showRoute();
    if (inCourse()) snapToRoute();
  } else if (entering) {
    fade.classList.add('on');
    setTimeout(() => {
      showRoute();
      snapToRoute();
      fade.classList.remove('on');
    }, 280);
  } else showRoute();
}
// Newly drawn words pick up any unsaved edits.
function showRoute() {
  applyRoute();
  textEditor.refresh();
}
function applyRoute() {
  gallery.close();
  wall.close();
  scorecard.hidden = true;
  const [id, isletId] = location.hash.replace(/^#\/?/, '').split('/');
  const data = all.find(d => d.id === id);
  const islet = data?.islets?.find(i => i.id === isletId);
  const wasIslet = openIslet;
  if (data) lastOpened = id;
  opened = data ? id : null;
  openIslet = islet ? islet.id : null;
  zoomed = !!data?.islets && !islet;
  const venuePage = islet?.course ? islet : data?.course ? data : null;
  gallery.setPlace(venuePage);
  document.body.classList.toggle('course', !!venuePage);
  document.body.classList.toggle('candle-page', data?.course === 'display');
  document.body.classList.toggle('society-page', islet?.course === 'society');
  document.body.classList.toggle('kirby-page', islet?.course === 'kirby');
  document.body.classList.toggle('civic-page', islet?.course === 'civic');
  document.body.classList.toggle('divide-page', islet?.course === 'divide');
  document.body.classList.toggle('daqing-page', islet?.course === 'daqing');
  document.body.classList.toggle('council-page', islet?.course === 'council');
  document.body.classList.toggle('care-page', islet?.course === 'care');
  document.body.classList.toggle('arts-page', ARTS_PAGES.includes(islet?.course));
  document.body.classList.toggle('violin-page', islet?.course === 'violin');
  document.body.classList.toggle('spread-page', ['civic', 'council', 'care', 'divide', 'daqing', ...ARTS_PAGES].includes(islet?.course));
  const pageCourse = islet?.course || data?.course;
  document.body.classList.toggle('about-page', pageCourse === 'about');
  document.body.classList.toggle('collage-page', pageCourse === 'about' || ['kirby', 'civic', 'council', 'care', 'divide', 'daqing', ...ARTS_PAGES].includes(islet?.course));
  document.body.classList.toggle('grab-page', data?.course === 'showcase');
  if (data?.course !== 'showcase') tour.hide();
  if (!venuePage) arrangement.clear();
  document.body.classList.toggle('open', !!data);
  document.body.classList.toggle('zoomed', zoomed);
  document.body.classList.toggle('stage', !!(islet || data)?.act || !!venuePage);
  for (const entry of entries) if (entry.isCluster) for (const i of entry.islets) i.label.classList.toggle('active', entry.data === data);
  frameCamera();
  $('#back').href = islet ? `#/${data.id}` : '#/';
  $('#back').textContent = islet ? `← Back to ${data.name}` : '← Back to the sea';
  if (zoomed) {
    $('#zoom-title').textContent = data.name;
    $('#zoom-title').dataset.text = `${data.id}.name`;
    panel.hidden = true;
    document.title = `${data.name} · Niki's Sea`;
    returnFocus((isletById(wasIslet) || byId(id).islets[0]).label);
  } else if (data) {
    const position = ISLANDS.indexOf(data);
    if (venuePage) {
      // No cards: the island, the floating photos and the tags are the whole page.
      panel.hidden = true;
      renderVenue(venuePage, data);
      frameCamera();
      document.title = `${venuePage.name} · Niki's Sea`;
      $('#golf').focus({preventScroll: true});
      return;
    }
    if (islet) {
      const index = data.islets.indexOf(islet);
      const next = data.islets[(index + 1) % data.islets.length];
      body.innerHTML = renderCards({...islet, projects: data.projects.filter(p => p.key === islet.id)}, data, `${data.id}.islets.${index}`);
      $('#panel-next').href = `#/${data.id}/${next.id}`;
      $('#panel-next').textContent = `${next.name} →`;
      $('#panel-next').setAttribute('aria-label', `Next: ${next.name}`);
      $('#panel-where').textContent = `${data.name} · ${index + 1} of ${data.islets.length}`;
    } else {
      const next = position >= 0 ? ISLANDS[(position + 1) % ISLANDS.length] : ISLANDS[0];
      body.innerHTML = renderCards(data, data, data.id);
      $('#panel-next').href = `#/${next.id}`;
      $('#panel-next').textContent = `${next.name} →`;
      $('#panel-next').setAttribute('aria-label', `Next island: ${next.name}`);
      $('#panel-where').textContent = position >= 0 ? `Island ${position + 1} of ${ISLANDS.length}` : data.tagline;
    }
    body.scrollLeft = 0;
    panel.hidden = false;
    stripHeight = panel.offsetHeight;
    syncCardArrows();
    frameCamera();
    document.title = `${(islet || data).name} · Niki's Sea`;
    body.focus({preventScroll: true});
  } else {
    if (lastOpened) returnFocus(byId(lastOpened).label);
    panel.hidden = true;
    document.title = "Niki's Sea";
  }
}
addEventListener('hashchange', route);
addEventListener('keydown', e => {
  if (e.key === 'Escape' && opened) location.hash = $('#back').getAttribute('href');
});

// Day and night
let night = false;
const dayLight = {hemi: new THREE.Color('#fff7e4'), sun: new THREE.Color('#fff3da')};
const nightLight = {hemi: new THREE.Color('#8fb2e0'), sun: new THREE.Color('#bcd2f5')};
$('#theme').addEventListener('click', () => {
  night = !night;
  document.documentElement.dataset.theme = night ? 'night' : 'day';
  $('#theme').textContent = night ? 'Day' : 'Night';
  $('#theme').setAttribute('aria-pressed', String(night));
  $('#theme').setAttribute('aria-label', night ? 'Switch to day' : 'Switch to night');
});

// Frame loop
const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
let elapsed = 0;

function tick() {
  const dt = Math.min(clock.getDelta(), .05);
  elapsed += dt;
  const u = water.uniforms;
  u.uTime.value = elapsed;
  u.uMotion.value = reduced ? .18 : 1;
  u.uNameShow.value += ((opened ? 0 : 1) - u.uNameShow.value) * Math.min(1, dt * (reduced ? 60 : 3));
  const nightGoal = night ? 1 : 0;
  u.uNight.value += (nightGoal - u.uNight.value) * Math.min(1, dt * 3);
  const n = u.uNight.value;
  hemi.color.lerpColors(dayLight.hemi, nightLight.hemi, n);
  hemi.intensity = 1.9 - n * 1.05;
  sun.color.lerpColors(dayLight.sun, nightLight.sun, n);
  sun.intensity = 2.4 - n * 1.5;

  camNow.position.lerp(camGoal.position, 1 - Math.pow(.02, dt * (reduced ? 40 : 1.15)));
  camNow.look.lerp(camGoal.look, 1 - Math.pow(.02, dt * (reduced ? 40 : 1.15)));
  camera.position.copy(camNow.position);
  // Lift the picture so whatever is open centres in the space above the cards.
  const viewGoal = inCourse() && openVenue().scene.frame ? displayShift : opened && !panel.hidden ? stripHeight / 2 : 0;
  viewShift = reduced ? viewGoal : viewShift + (viewGoal - viewShift) * Math.min(1, dt * 3);
  camera.setViewOffset(width, height, 0, viewShift, width, height);
  sky.position.copy(camNow.position);
  // From high above the sky is never in view, so don't pay to draw it.
  sky.visible = !!opened || camNow.position.y < 26;
  // Gentle lean toward the pointer on the open sea.
  if (!opened && !reduced && Math.abs(pointer.x) <= 1) {
    camera.position.x += pointer.x * .7;
    camera.position.z -= pointer.y * .45;
  }
  camera.lookAt(camNow.look);
  camera.updateMatrixWorld();

  if (!opened && Math.abs(pointer.x) <= 1) {
    pointerHover = pickIsland(pointer);
  } else pointerHover = null;
  setHover(opened ? null : labelHover || pointerHover);
  setIsletHover(zoomed ? labelIslet || (Math.abs(pointer.x) <= 1 ? pickIslet(pointer) : null) : null);

  let shoreCount = 0;
  const shores = u.uShores.value;
  for (const e of entries) {
    const on = hovered === e.data.id;
    const dim = hovered && !on;
    // Once a place is open the camera is at water level, so everything else sinks out of the way.
    const sunk = opened && (opened !== e.data.id || e.data.course);
    const goal = elapsed < e.enter || sunk ? 0 : (on ? 1.3 : dim ? .95 : 1);
    // Spring, so the pop overshoots a little and settles.
    if (reduced) e.scale = goal;
    else {
      e.velocity += (goal - e.scale) * 150 * dt;
      e.velocity *= Math.exp(-13 * dt);
      e.scale += e.velocity * dt;
    }
    e.hover += ((on ? 1 : 0) - e.hover) * Math.min(1, dt * 9);

    const bob = reduced ? 0 : Math.sin(elapsed * .8 + e.bobSeed) * .08;
    const s = Math.max(.001, e.scale) * unit;
    e.root.scale.setScalar(s);
    e.root.visible = e.scale > .01;
    e.lift.position.y = (bob + e.hover * .5) / Math.max(unit, .001);
    e.lift.rotation.z = reduced ? 0 : Math.sin(elapsed * .6 + e.bobSeed) * .012;
    e.symbol.rotation.y = reduced ? 0 : e.hover * Math.sin(elapsed * 2.2) * .22;

    // Tell the water where every shoreline is.
    if (e.isCluster) {
      e.spread += ((opened === e.data.id ? 1 : 0) - e.spread) * Math.min(1, dt * (reduced ? 60 : 3.2));
      for (const islet of e.islets) {
        const isOn = hoveredIslet === islet.data.id;
        // On an islet's page its neighbours sink, and Golf's island replaces all of them.
        const isletGoal = inCourse() || (openIslet && openIslet !== islet.data.id) ? 0 : isOn ? 1.24 : 1;
        if (reduced) islet.scale = isletGoal;
        else {
          islet.velocity += (isletGoal - islet.scale) * 170 * dt;
          islet.velocity *= Math.exp(-12 * dt);
          islet.scale += islet.velocity * dt;
        }
        islet.hover += ((isOn ? 1 : 0) - islet.hover) * Math.min(1, dt * 9);
        const [spotX, spotZ] = isletSpot(e, islet.index);
        islet.group.position.set(islet.home.x + (spotX - islet.home.x) * e.spread, islet.hover * .22, islet.home.z + (spotZ - islet.home.z) * e.spread);
        if (!reduced) for (const spinner of islet.spinners) spinner.rotation.y += spinner.userData.spin * dt * (1 + Math.max(islet.hover, e.hover) * 5);
        islet.group.scale.setScalar(Math.max(.001, islet.scale));
        islet.group.visible = islet.scale > .01;
        islet.group.children[1].rotation.y = reduced ? 0 : islet.hover * Math.sin(elapsed * 2.4) * .3;

        islet.group.updateWorldMatrix(true, false);
        islet.group.getWorldPosition(tmp);
        const shoreHover = Math.max(islet.hover, zoomed ? 0 : e.hover);
        if (shoreCount < MAX_SHORES && e.scale >= .1 && islet.scale >= .1) shores[shoreCount++].set(tmp.x, tmp.z, islet.group.userData.islet * .92 * s * islet.scale, shoreHover);

        // Name sticker below each islet.
        if (opened !== e.data.id) continue;
        // Across from the islet's centre, not its front edge, which perspective pushes outward.
        tmpTarget.copy(tmp);
        tmpTarget.y = 0;
        tmpTarget.project(camera);
        const anchorX = (tmpTarget.x * .5 + .5) * width;
        tmp.z += .82 * .92 * s * islet.scale;
        tmp.y = 0;
        tmp.project(camera);
        const halfWidth = islet.label.offsetWidth / 2;
        const labelX = Math.max(halfWidth + 10, Math.min(width - halfWidth - 10, anchorX));
        const labelY = Math.min(height - islet.label.offsetHeight - 80, (-tmp.y * .5 + .5) * height);
        islet.label.style.transform = `translate(${labelX}px, ${labelY}px) translateX(-50%) rotate(${(islet.index % 2 ? 1 : -1) * 1.2}deg) scale(${isOn ? 1.08 : 1})`;
      }
    } else if (e.scale < .1) {
      // Sunk or not yet risen: no shoreline to draw.
    } else if (shoreCount < MAX_SHORES && e.data.color) {
      shores[shoreCount++].set(e.base.x, e.base.z, e.radius * .93 * s, e.hover);
    } else if (shoreCount < MAX_SHORES) {
      // The bottle floats free, so it gets a small ring.
      shores[shoreCount++].set(e.base.x, e.base.z, .22 * s, e.hover);
    }

    // Keep the sticker just below the island.
    const reach = (e.isCluster ? e.reach : e.data.small ? .95 : 1.9) * s;
    tmp.set(e.base.x, 0, e.base.z + reach);
    tmp.project(camera);
    const x = (tmp.x * .5 + .5) * width;
    const y = (-tmp.y * .5 + .5) * height;
    const halfWidth = e.label.offsetWidth / 2;
    const clampX = Math.max(halfWidth + 10, Math.min(width - halfWidth - 10, x));
    const clampY = Math.min(height - e.label.offsetHeight - 14, y);
    e.label.style.transform = `translate(${clampX}px, ${clampY}px) translateX(-50%) rotate(${(e.index % 2 ? 1 : -1) * 1.2}deg) scale(${on ? 1.08 : 1})`;
    if (e.scale > .4) e.label.classList.add('ready');
  }
  for (const venue of venues) venue.scene.update(venue === openVenue(), venue.owner.base, unit, elapsed, reduced, dt, Math.abs(pointer.x) <= 1 ? pointer : null, width, height);
  if (inCourse() && !reduced) wall.update(dt);
  if (inCourse()) {
    const {scene: course, owner} = openVenue();
    for (const [x, z, radius] of course.shores) {
      if (shoreCount < MAX_SHORES) shores[shoreCount++].set(owner.base.x + x * unit, owner.base.z + z * unit, radius * unit, 0);
    }
    // Each floating print rests in its own ring of ripples.
    for (const {x, y, vx, vy, ring, below} of wall.floats()) {
      if (shoreCount >= MAX_SHORES) break;
      const onWater = onSea(x * 2 - 1, 1 - y * 2 - below);
      shores[shoreCount++].set(onWater.x, onWater.z, ring * unit, vx || vy ? .9 : 0);
    }
  }
  u.uShoreCount.value = shoreCount;

  for (const act of acts) act.update(dt, act.isOpen(), reduced);

  // The paper boat chases the cursor (or the last tap), skirting islands, and idles when nobody is around.
  const pointerOnScreen = Math.abs(pointer.x) <= 1;
  let target = boatState.home, stop = .4;
  const boatOut = !opened || zoomed;
  if (boatOut && (pointerOnScreen || touchGoal)) {
    const aim = pointerOnScreen ? pointer : touchGoal;
    if (zoomed) {
      // Near the horizon a screen point can land miles away, so sail a strip of water in front of the islets.
      const halfX = camGoal.position.distanceTo(camGoal.look) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      const base = openCluster().base;
      target = tmpTarget.set(base.x + aim.x * halfX * .85, 0, base.z + (tall ? 3.7 : 1.2) * unit - aim.y * (tall ? 1 : .4) * unit);
    } else target = onSea(aim.x, aim.y);
    stop = .9 * unit;
  } else if (hovered) {
    target = byId(hovered).base;
    stop = 3.3 * unit;
  } else if (zoomed) {
    target = openCluster().base;
    stop = 3.3 * unit;
  }
  if (target && !reduced) {
    tmp.copy(target).sub(boatState.pos);
    tmp.y = 0;
    const away = tmp.length();
    const speed = Math.min(9 * unit, Math.max(0, away - stop) * 3.2);
    boatState.speed += (speed - boatState.speed) * Math.min(1, dt * 6);
    // Point where it is going while sailing; rest side-on so the boat shape reads.
    const heading = boatState.speed > .3 ? Math.atan2(tmp.x, tmp.z) : Math.PI / 2;
    let turn = heading - boatState.heading;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    boatState.heading += turn * Math.min(1, dt * 5.5);
    boatState.pos.x += Math.sin(boatState.heading) * boatState.speed * dt;
    boatState.pos.z += Math.cos(boatState.heading) * boatState.speed * dt;
    // Sail around islands, never over them.
    const skirt = (x, z, keepOut) => {
      const dx = boatState.pos.x - x, dz = boatState.pos.z - z;
      const dist = Math.hypot(dx, dz) || .01;
      if (dist < keepOut) {
        boatState.pos.x = x + dx / dist * keepOut;
        boatState.pos.z = z + dz / dist * keepOut;
      }
    };
    for (const e of entries) {
      if (e.isCluster) {
        if (e.scale < .5) continue;
        for (const islet of e.islets) {
          islet.group.getWorldPosition(tmp);
          skirt(tmp.x, tmp.z, .85 * unit * Math.max(1, e.scale) * islet.scale);
        }
      } else if (e.data.color && e.scale > .5) skirt(e.base.x, e.base.z, e.radius * 1.12 * unit * Math.max(1, e.scale));
    }
  }
  // Fewer islets means a closer camera, so the boat shrinks to match.
  const nearness = zoomed && !tall ? Math.min(1, (Math.max(...openCluster().islets.map((_, index) => Math.abs(isletSpot(openCluster(), index)[0]))) * SCENE_SCALE + .72) / 3.76) : 1;
  boatSize += ((zoomed ? .36 * nearness : 1) - boatSize) * Math.min(1, dt * 3);
  boat.scale.setScalar(unit * .72 * boatSize);
  boat.position.set(boatState.pos.x, .07 * unit + (reduced ? 0 : Math.sin(elapsed * 1.5) * .05), boatState.pos.z);
  boat.rotation.y = boatState.heading - Math.PI / 2;
  boat.rotation.z = reduced ? 0 : Math.sin(elapsed * 1.2) * .05;
  updateWake(dt, {x: boatState.pos.x, z: boatState.pos.z, heading: boatState.heading, speed: boatState.speed, unit: unit * boatSize, active: boatOut && !reduced});
  boat.visible = boatOut;

  // Lighthouses turn their beams toward the cursor, and sweep slowly when there's none.
  for (const lit of [lighthouseEntry?.symbol, inCourse() && openVenue().scene.lighthouse]) if (lit) aimBeam(lit, elapsed, dt);

  // React to whatever the visitor is looking at.
  const reaction = hoveredIslet ? isletById(hoveredIslet).data.face : hovered ? byId(hovered).data.face : 'wink';
  boat.userData.setFace(elapsed < surpriseUntil ? 'surprised' : reaction);
  boatHop = Math.max(0, boatHop - dt * 1.7);
  if (!reduced) boat.position.y += Math.sin(boatHop * Math.PI) * 1.5 * unit;
  document.body.classList.toggle('on-boat', boatOut && !hovered && !hoveredIslet && pointerOnScreen && onBoat(pointer));
  const pop = boat.userData.pop;
  boat.userData.pop = reduced ? 0 : Math.max(0, pop - dt * 3.5);
  const size = 1 + Math.sin(pop * Math.PI) * .22;
  boat.userData.sticker.scale.set(boat.userData.faceWidth * size, boat.userData.faceHeight * size, 1);
  boat.userData.sticker.material.rotation = reduced ? 0 : Math.sin(elapsed * 1.3) * .07;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

addEventListener('resize', layout);
layout();
route();
camNow.position.copy(camGoal.position);
camNow.look.copy(camGoal.look);
tick();
