// Island shapes and the big toy symbol on each one.
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .72, metalness: 0, ...extra});

function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent?.add(m);
  return m;
}

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Radius wobble by angle, so no island is a perfect circle. Long, slow curves only, so the outline stays smooth.
export const wobble = (angle, seed) => 1 + .06 * Math.sin(angle * 2 + seed) + .04 * Math.sin(angle * 3 + seed * 2.3);

// A smooth pebble: spun around the centre with no seam, so light slides over it without creases.
// `profile` runs from the bottom edge up to the middle of the top, as [radius, height] pairs.
export function pebble(profile, seed) {
  const AROUND = 96, rows = profile.length, positions = [], indices = [];
  for (const [r, y] of profile) {
    for (let k = 0; k < AROUND; k++) {
      const a = k / AROUND * Math.PI * 2, w = r * wobble(a, seed);
      positions.push(Math.cos(a) * w, y, Math.sin(a) * w);
    }
  }
  for (let i = 0; i < rows - 1; i++) {
    for (let k = 0; k < AROUND; k++) {
      const a = i * AROUND + k, b = i * AROUND + (k + 1) % AROUND, c = a + AROUND, d = b + AROUND;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Rounded shoulder: a superellipse from straight up the side, curving over to the flat top.
export function shoulder(radius, base, height, skirt = 0) {
  const STEPS = 26, ROUND = 2.7, points = [];
  if (skirt) points.push([radius * 1.02, base - skirt], [radius * 1.01, base - skirt * .5]);
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS * Math.PI / 2;
    points.push([Math.max(radius * Math.cos(t) ** (2 / ROUND), .0001), base + height * Math.sin(t) ** (2 / ROUND)]);
  }
  return points;
}

// Reflections for the Feel To Read glasses only, so the other models keep their own look.
let studioEnvironment = null;
function reflections(renderer, lowColor, highColor) {
  const scene = new THREE.Scene();
  const geometry = new THREE.SphereGeometry(10, 32, 16);
  const position = geometry.attributes.position, colors = [];
  const low = new THREE.Color(lowColor), high = new THREE.Color(highColor), c = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    c.copy(low).lerp(high, THREE.MathUtils.smoothstep(position.getY(i), -6, 7));
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide})));
  for (const [x, y, z, w, h] of [[-5, 8, 3, 6, 3], [6, 6, -3, 3, 5], [0, 5, 8, 8, 1.2]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(6, 6, 5.6), side: THREE.DoubleSide}));
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    scene.add(panel);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  const texture = generator.fromScene(scene, .02).texture;
  generator.dispose();
  return texture;
}
export function prepareGlass(renderer) {
  // Neutral, so the black frames and metal arms of the glasses don't pick up the sea's blue.
  studioEnvironment = reflections(renderer, '#17181b', '#b9bcc1');
}

// Every island is solid sand, darker where the water wets the edge, with a fine grain.
function sandGrain() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d');
  c.fillStyle = '#f2f2f2';
  c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = i % 3 ? '#00000012' : '#ffffff66';
    c.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.setScalar(1.2);
  return texture;
}
const grain = sandGrain();
export const sandDry = new THREE.MeshStandardMaterial({color: '#ecd8a6', map: grain, roughness: .95});
export const sandWet = new THREE.MeshStandardMaterial({color: '#d9bf87', map: grain, roughness: .95});

export function createIslandBase(color, radius = 1, seed = 1) {
  const group = new THREE.Group();
  const add = (profile, material) => {
    const geometry = pebble(profile, seed);
    // Laid flat from above, since the pebble has no texture coordinates of its own.
    const position = geometry.attributes.position, uv = [];
    for (let i = 0; i < position.count; i++) uv.push(position.getX(i), position.getZ(i));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const part = new THREE.Mesh(geometry, material);
    part.castShadow = part.receiveShadow = true;
    group.add(part);
  };
  // A wet rim sitting in the water, with dry sand on top of it.
  add(shoulder(radius * 1.06, -.02, .2, .3), sandWet);
  if (color) add(shoulder(radius * .8, .1, .27), sandDry);
  return group;
}

// Fit any model into a box and stand it on y = 0.
function fit(model, height, maxWidth = height * 1.6) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = Math.min(height / size.y, maxWidth / Math.max(size.x, size.z));
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);
  const after = new THREE.Box3().setFromObject(model);
  const center = after.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= after.min.y;
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return model;
}

// Drop every triangle outside a box, for models that hold more than the symbol needs.
function keepInside(model, {min, max}) {
  model.updateMatrixWorld(true);
  const a = new THREE.Vector3(), remove = [];
  model.traverse(o => {
    if (!o.isMesh) return;
    const source = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const position = source.attributes.position;
    const kept = [];
    for (let i = 0; i < position.count; i += 3) {
      a.set(0, 0, 0);
      for (let k = 0; k < 3; k++) a.add(new THREE.Vector3().fromBufferAttribute(position, i + k).applyMatrix4(o.matrixWorld));
      a.divideScalar(3);
      if (a.x > min[0] && a.y > min[1] && a.z > min[2] && a.x < max[0] && a.y < max[1] && a.z < max[2]) kept.push(i);
    }
    if (!kept.length) { remove.push(o); return; }
    const geometry = new THREE.BufferGeometry();
    for (const [name, attribute] of Object.entries(source.attributes)) {
      const data = new attribute.array.constructor(kept.length * 3 * attribute.itemSize);
      kept.forEach((start, t) => data.set(attribute.array.subarray(start * attribute.itemSize, (start + 3) * attribute.itemSize), t * 3 * attribute.itemSize));
      geometry.setAttribute(name, new THREE.BufferAttribute(data, attribute.itemSize, attribute.normalized));
    }
    o.geometry = geometry;
  });
  remove.forEach(o => o.removeFromParent());
}

function loadInto(group, file, height, maxWidth, keep) {
  loader.load(new URL(`../dist/models/${file}`, import.meta.url).href, gltf => {
    if (keep) keepInside(gltf.scene, keep);
    group.add(fit(gltf.scene, height, maxWidth));
  }, undefined, error => console.warn(`Could not load ${file}`, error));
}

// The real Feel To Read glasses (GLV-024P), from the spec sheet's renders: a glossy black frame with a thick bridge,
// soft square lenses and a round disc in each outer corner; arms with a black hinge, a grey metal sleeve and a black ear tip.
const FRAME_OUTLINE = [[0, .46], [.5, .51], [.95, .55], [1.27, .55], [1.41, .49], [1.43, .34], [1.35, .16], [1.325, -.06], [1.27, -.34], [1.1, -.59], [.72, -.67], [.38, -.61], [.2, -.37], [.12, -.1], [.07, .07], [0, .11]];
const LENS_OUTLINE = [[.16, .31], [.5, .38], [.9, .42], [1.09, .41], [1.19, .26], [1.22, .02], [1.17, -.25], [1.01, -.47], [.72, -.56], [.44, -.5], [.27, -.28], [.2, .02]];
const FRAME_BEND = .045;
const ARM_PATH = [[1.39, .4, -.06], [1.385, .4, -.7], [1.37, .385, -1.4], [1.345, .36, -2], [1.31, .25, -2.4], [1.28, .02, -2.72], [1.26, -.2, -2.98]];
const ARM_HINGE = .14, ARM_SLEEVE = .66;

function closedOutline(points, count) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true);
  return curve.getSpacedPoints(count).slice(0, -1).map(({x, y}) => new THREE.Vector2(x, y));
}

function sweepArm(side, from, to, material, puff = 0) {
  const curve = new THREE.CatmullRomCurve3(ARM_PATH.map(([x, y, z]) => new THREE.Vector3(side * x, y, z)));
  const steps = 48, around = 24, positions = [], indices = [];
  const lastRing = () => positions.length / 3 - around;
  for (let i = 0; i <= steps; i++) {
    const u = from + (to - from) * i / steps, point = curve.getPointAt(u), tangent = curve.getTangentAt(u);
    const up = new THREE.Vector3(0, tangent.z, -tangent.y).normalize();
    // Tall where the electronics sit, thin and rounded off at the ear.
    const round = Math.sqrt(Math.max(.02, 1 - (Math.max(0, u - .97) / .03) ** 2));
    const tall = (.13 - .08 * THREE.MathUtils.smoothstep(u, .56, .84) + puff) * round;
    const thick = (.058 - .016 * u + puff) * round;
    for (let k = 0; k < around; k++) {
      const a = k / around * Math.PI * 2;
      const cx = Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** .55, cy = Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** .55;
      positions.push(point.x + cx * thick, point.y + up.y * cy * tall, point.z + up.z * cy * tall);
      if (i < steps) {
        const a0 = i * around + k, a1 = i * around + (k + 1) % around, b0 = a0 + around, b1 = a1 + around;
        indices.push(a0, a1, b0, a1, b1, b0);
      }
    }
  }
  for (const [u, ring, flip] of [[from, 0, true], [to, lastRing(), false]]) {
    const point = curve.getPointAt(u), center = positions.length / 3;
    positions.push(point.x, point.y, point.z);
    for (let k = 0; k < around; k++) {
      const a0 = ring + k, a1 = ring + (k + 1) % around;
      if (flip) indices.push(center, a1, a0); else indices.push(center, a0, a1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(geometry, material);
}

// Curves the front around the face, with soft edges and clean flat faces, so the gloss doesn't break up into facets.
function bendAndSmooth(geometry) {
  const position = geometry.attributes.position, normal = geometry.attributes.normal;
  for (let i = 0; i < position.count; i++) position.setZ(i, position.getZ(i) - FRAME_BEND * position.getX(i) ** 2);
  const [lids, sides] = geometry.groups;
  for (let i = lids.start; i < lids.start + lids.count; i++) {
    const facing = Math.sign(normal.getZ(i));
    const length = Math.hypot(2 * FRAME_BEND * position.getX(i), 1);
    normal.setXYZ(i, 2 * FRAME_BEND * position.getX(i) * facing / length, 0, facing / length);
  }
  const shared = new Map(), key = i => `${position.getX(i).toFixed(4)},${position.getY(i).toFixed(4)},${position.getZ(i).toFixed(4)}`;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), face = new THREE.Vector3();
  for (let i = sides.start; i < sides.start + sides.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    face.crossVectors(b.sub(a), c.sub(a));
    for (let k = 0; k < 3; k++) {
      const id = key(i + k);
      if (!shared.has(id)) shared.set(id, new THREE.Vector3());
      shared.get(id).add(face);
    }
  }
  for (let i = sides.start; i < sides.start + sides.count; i++) {
    const smooth = shared.get(key(i)).clone().normalize();
    normal.setXYZ(i, smooth.x, smooth.y, smooth.z);
  }
  return geometry;
}

function glasses() {
  const g = new THREE.Group();
  const rig = new THREE.Group();
  g.add(rig);
  const envMap = studioEnvironment;
  const black = new THREE.MeshPhysicalMaterial({color: '#08090b', roughness: .2, clearcoat: 1, clearcoatRoughness: .06, envMap, envMapIntensity: 1});
  const metal = new THREE.MeshStandardMaterial({color: '#8d9095', metalness: .9, roughness: .36, envMap, envMapIntensity: 1.1});

  const right = FRAME_OUTLINE, left = right.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  const frameShape = new THREE.Shape(closedOutline([...right, ...left], 280));
  const lensShape = side => new THREE.Shape(closedOutline(LENS_OUTLINE.map(([x, y]) => [x * side, y]), 110));
  for (const side of [1, -1]) frameShape.holes.push(new THREE.Path(lensShape(side).getPoints()));
  const frameGeometry = new THREE.ExtrudeGeometry(frameShape, {depth: .09, bevelEnabled: true, bevelThickness: .03, bevelSize: .02, bevelSegments: 6, curveSegments: 4});
  frameGeometry.translate(0, 0, -.045);
  mesh(bendAndSmooth(frameGeometry), black, rig);

  const clear = new THREE.MeshPhysicalMaterial({color: '#f2f6f6', transparent: true, opacity: .13, roughness: .03, side: THREE.DoubleSide, depthWrite: false, envMap, envMapIntensity: 1});
  for (const side of [-1, 1]) {
    const lensGeometry = new THREE.ShapeGeometry(lensShape(side), 4);
    const p = lensGeometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, -FRAME_BEND * p.getX(i) ** 2);
    lensGeometry.computeVertexNormals();
    const lens = mesh(lensGeometry, clear, rig);
    lens.castShadow = false;
    lens.renderOrder = 3;
    // The camera sits at the wearer's left corner and the white recording light at the right.
    const z = .08 - FRAME_BEND * 1.3 ** 2;
    const ring = mesh(new THREE.CylinderGeometry(.088, .088, .02, 36), new THREE.MeshStandardMaterial({color: '#5d6166', metalness: .8, roughness: .32, envMap}), rig, side * 1.3, .37, z);
    ring.rotation.x = Math.PI / 2;
    const glassy = side > 0 ? {color: '#111418', roughness: .08, metalness: .3} : {color: '#c9ccd0', roughness: .3, metalness: .1};
    const eye = mesh(new THREE.CylinderGeometry(.056, .056, .024, 32), new THREE.MeshStandardMaterial({...glassy, envMap}), rig, side * 1.3, .37, z + .002);
    eye.rotation.x = Math.PI / 2;
    rig.add(sweepArm(side, 0, ARM_HINGE, black, .004));
    rig.add(sweepArm(side, ARM_HINGE - .005, ARM_SLEEVE, metal));
    rig.add(sweepArm(side, ARM_SLEEVE - .005, 1, black, .002));
    // Two of the four microphones on each arm, and a speaker slit underneath, by the ear.
    for (const z of [-.55, -.85]) {
      const mic = mesh(new THREE.SphereGeometry(.016, 10, 8), std('#0a0b0d'), rig, side * 1.44, .4, z);
      mic.scale.x = .3;
    }
    const slit = mesh(new THREE.CapsuleGeometry(.014, .3, 4, 8), std('#0a0b0d'), rig, side * 1.362, .245, -1.72);
    slit.rotation.x = Math.PI / 2;
    // The button on top of each arm, for finding by touch.
    const button = mesh(new THREE.CapsuleGeometry(.018, .13, 6, 12), metal, rig, side * 1.385, .536, -.26);
    button.rotation.x = Math.PI / 2;
  }
  // The status light faces the wearer, and the two charging pins sit at the end of the same arm.
  mesh(new THREE.SphereGeometry(.024, 12, 10), new THREE.MeshStandardMaterial({color: '#59e39a', emissive: '#2fcf7c', emissiveIntensity: 1}), rig, -1.328, .4, -.22);
  for (const y of [-.075, -.125]) {
    const pin = mesh(new THREE.CylinderGeometry(.013, .013, .012, 12), new THREE.MeshStandardMaterial({color: '#d9b36a', metalness: .9, roughness: .3, envMap}), rig, -1.232, y, -2.88);
    pin.rotation.z = Math.PI / 2;
  }
  // Rest it on the sand the way glasses sit on a table: frame and ear tips touching.
  rig.position.set(0, .7, 1.3);
  rig.rotation.x = -.17;
  const stand = new THREE.Group();
  stand.add(rig);
  stand.rotation.y = .42;
  stand.scale.setScalar(.8);
  g.add(stand);
  g.userData.stand = stand;
  g.userData.rig = rig;
  return g;
}

function highway101() {
  const g = new THREE.Group();
  const road = mesh(new THREE.BoxGeometry(1.32, .05, .34), std('#556b78'), g, 0, .03, .22);
  road.rotation.y = -.12;
  for (let i = -2; i <= 2; i++) {
    const dash = mesh(new THREE.BoxGeometry(.16, .02, .035), std('#ffe6a8'), g, i * .27, .065, .22 + i * .032);
    dash.rotation.y = -.12;
  }
  mesh(new THREE.CylinderGeometry(.035, .035, .95, 10), std('#7d8e99'), g, 0, .48, -.16);
  const shield = canvasTexture(256, (c, s) => {
    c.fillStyle = '#fffdf6'; c.fillRect(0, 0, s, s);
    c.fillStyle = '#c6362f'; c.fillRect(14, 14, s - 28, 58);
    c.fillStyle = '#1e4e8c'; c.fillRect(14, 72, s - 28, s - 86);
    c.fillStyle = '#fff';
    c.font = '800 118px "Bricolage Grotesque", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('101', s / 2, 150);
  });
  const edge = std('#fff');
  const sign = mesh(new THREE.BoxGeometry(.72, .72, .06), [edge, edge, edge, edge, std('#fff', {map: shield}), edge], g, 0, 1.12, -.13);
  sign.rotation.x = -.15;
  return g;
}

function modelFrom(file, height, maxWidth, keep) {
  const g = new THREE.Group();
  loadInto(g, file, height, maxWidth, keep);
  return g;
}

function microphone() {
  const g = new THREE.Group();
  const steel = std('#3a4249', {roughness: .3, metalness: .35});
  mesh(new THREE.CylinderGeometry(.26, .29, .05, 28), steel, g, 0, .03, 0);
  mesh(new THREE.CylinderGeometry(.024, .03, .95, 12), steel, g, 0, .5, 0);
  const head = new THREE.Group();
  head.position.set(0, 1, 0);
  head.rotation.x = .55;
  g.add(head);
  g.userData.micHead = head;
  mesh(new THREE.CylinderGeometry(.075, .05, .36, 20), std('#14191d', {roughness: .3}), head, 0, .1, 0);
  mesh(new THREE.TorusGeometry(.083, .012, 8, 28), std('#c7ced3', {roughness: .25, metalness: .5}), head, 0, .28, 0).rotation.x = Math.PI / 2;
  const grille = canvasTexture(256, (c, s) => {
    c.fillStyle = '#b4bcc2'; c.fillRect(0, 0, s, s);
    c.strokeStyle = '#59626a'; c.lineWidth = 3;
    for (let i = -s; i < s * 2; i += 16) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i + s, s); c.stroke();
      c.beginPath(); c.moveTo(i, s); c.lineTo(i + s, 0); c.stroke();
    }
  });
  mesh(new THREE.SphereGeometry(.135, 28, 20), std('#fff', {map: grille, roughness: .4, metalness: .3}), head, 0, .38, 0);
  return g;
}

function golf() {
  const g = new THREE.Group();
  floor(g, (c, s) => {
    c.fillStyle = '#8fdc78'; c.fillRect(0, 0, s, s);
    c.strokeStyle = '#a9e893'; c.lineWidth = 14;
    for (let r = s * .12; r < s * .6; r += s * .09) { c.beginPath(); c.arc(s * .55, s / 2, r, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = '#f3e2b5';
    c.beginPath(); c.ellipse(s * .76, s * .78, s * .13, s * .09, -.5, 0, Math.PI * 2); c.fill();
  });
  mesh(new THREE.CylinderGeometry(.085, .085, .008, 24), std('#26351f'), g, .05, .036, 0);
  mesh(new THREE.CylinderGeometry(.016, .016, 1.3, 10), std('#fbfaf3'), g, .05, .66, 0);
  const flag = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(.48, -.15), new THREE.Vector2(0, -.3)]);
  mesh(new THREE.ExtrudeGeometry(flag, {depth: .015, bevelEnabled: false}), std('#ff6f59'), g, .06, 1.29, 0);
  const ball = mesh(new THREE.SphereGeometry(.09, 24, 18), std('#fbfaf3', {roughness: .5}), g, -.2, .11, .2);
  ball.userData.spin = .2;
  g.userData.ball = ball;
  return g;
}

function ballOn(make, radius) {
  const g = new THREE.Group();
  const ball = make(radius);
  ball.position.y = radius;
  ball.rotation.set(.3, .5, .2);
  ball.userData.spin = .3;
  g.add(ball);
  g.userData.ball = ball;
  return g;
}

function candle() {
  const g = new THREE.Group();
  loadInto(g, 'eurus-candle.glb', 2.45, 1.75);
  return g;
}

function basketball(radius) {
  const t = canvasTexture(512, (c, s) => {
    c.fillStyle = '#ef8a3c'; c.fillRect(0, 0, s, s);
    c.strokeStyle = '#3b2415'; c.lineWidth = 10;
    c.beginPath(); c.moveTo(0, s / 2); c.lineTo(s, s / 2); c.stroke();
    for (const x of [s / 4, s * 3 / 4]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, s); c.stroke(); }
    for (const x of [0, s / 2, s]) { c.beginPath(); c.arc(x, s / 2, s * .3, 0, Math.PI * 2); c.stroke(); }
  });
  return mesh(new THREE.SphereGeometry(radius, 36, 24), std('#fff', {map: t}));
}

function soccerBall(radius) {
  const t = canvasTexture(512, (c, s) => {
    c.fillStyle = '#fbfaf3'; c.fillRect(0, 0, s, s);
    c.fillStyle = '#10303f';
    for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
      const x = (col + (row % 2) * .5) * s / 5 + 30, y = (row + .5) * s / 3;
      c.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2 - Math.PI / 2;
        c[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * 30, y + Math.sin(a) * 30);
      }
      c.fill();
    }
  });
  return mesh(new THREE.SphereGeometry(radius, 36, 24), std('#fff', {map: t}));
}

// Height of an islet's sand mound at a distance from its centre, relative to where symbols stand.
function domeHeight(r) {
  const edge = ISLET_RADIUS * .8, round = 2.7;
  return .1 + .27 * Math.max(0, 1 - (r / edge) ** round) ** (1 / round) - .36;
}

// A playing surface that follows the curve of the sand, so everything on it is visibly standing on the island.
function floor(parent, draw, radius = .44) {
  const geometry = new THREE.RingGeometry(.001, radius, 64, 10);
  geometry.rotateX(-Math.PI / 2);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, domeHeight(Math.hypot(p.getX(i), p.getZ(i))) + .018);
  geometry.computeVertexNormals();
  const map = canvasTexture(512, draw);
  const part = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({map, roughness: .55, transparent: true, opacity: .88}));
  part.receiveShadow = true;
  parent.add(part);
}

function hoopCourt() {
  const g = ballOn(basketball, .24);
  g.userData.ball.position.set(-.2, .28, .16);
  floor(g, (c, s) => {
    c.fillStyle = '#e8a765'; c.fillRect(0, 0, s, s);
    c.strokeStyle = '#fff6e6'; c.lineWidth = 9;
    c.strokeRect(s * .62, s * .32, s * .38, s * .36);
    c.beginPath(); c.arc(s * .62, s / 2, s * .18, Math.PI / 2, Math.PI * 1.5); c.stroke();
    c.beginPath(); c.arc(s * .92, s / 2, s * .5, Math.PI * .68, Math.PI * 1.32); c.stroke();
  });
  const white = std('#fbfaf3');
  mesh(new THREE.CylinderGeometry(.026, .036, 1.36, 12), std('#3a4249', {roughness: .35}), g, .34, .64, -.12);
  mesh(new THREE.BoxGeometry(.03, .34, .5), white, g, .28, 1.2, -.12);
  const rim = new THREE.Vector3(.08, 1.08, -.12);
  // Tipped toward the camera so the hoop reads as a ring from a low view.
  const ring = mesh(new THREE.TorusGeometry(.18, .015, 10, 36), std('#ff6f59', {roughness: .4}), g, rim.x, rim.y, rim.z);
  ring.rotation.x = Math.PI / 2 - .4;
  const net = mesh(new THREE.CylinderGeometry(.18, .115, .23, 14, 3, true), new THREE.MeshBasicMaterial({color: '#fbfaf3', wireframe: true}), g, rim.x, rim.y - .115, rim.z);
  net.rotation.x = -.4;
  net.castShadow = false;
  return g;
}

function goalPitch() {
  const g = ballOn(soccerBall, .2);
  g.userData.ball.position.set(.08, .23, .17);
  floor(g, (c, s) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? '#7fce6f' : '#92dc80';
      c.fillRect(i * s / 8, 0, s / 8 + 1, s);
    }
    c.strokeStyle = '#fbfaf3'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(0, s * .56); c.lineTo(s, s * .56); c.stroke();
    c.beginPath(); c.arc(s / 2, s * .56, s * .15, 0, Math.PI * 2); c.stroke();
    c.strokeRect(s * .24, s * .02, s * .52, s * .22);
  });
  const white = std('#fbfaf3');
  for (const x of [-.34, .34]) mesh(new THREE.CylinderGeometry(.02, .02, .54, 10), white, g, x, .24, -.2);
  mesh(new THREE.CylinderGeometry(.02, .02, .7, 10), white, g, 0, .51, -.2).rotation.z = Math.PI / 2;
  const net = mesh(new THREE.PlaneGeometry(.68, .5, 10, 7), new THREE.MeshBasicMaterial({color: '#fbfaf3', wireframe: true, transparent: true, opacity: .75}), g, 0, .26, -.25);
  net.castShadow = false;
  return g;
}

function lantern() {
  const g = new THREE.Group();
  const red = std('#d8392f');
  const body = mesh(new THREE.SphereGeometry(.38, 24, 18), red, g, 0, .72, 0);
  body.scale.y = .86;
  for (let i = 0; i < 6; i++) {
    const rib = mesh(new THREE.TorusGeometry(.38, .012, 6, 40), std('#a72a22'), g, 0, .72, 0);
    rib.rotation.y = i / 6 * Math.PI;
    rib.scale.y = .86;
  }
  const gold = std('#f0bd52');
  mesh(new THREE.CylinderGeometry(.16, .16, .07, 18), gold, g, 0, 1.06, 0);
  mesh(new THREE.CylinderGeometry(.16, .16, .07, 18), gold, g, 0, .38, 0);
  mesh(new THREE.CylinderGeometry(.11, .02, .28, 10), std('#f0bd52'), g, 0, .2, 0);
  return g;
}

function ballot() {
  const g = new THREE.Group();
  mesh(new THREE.BoxGeometry(.78, .56, .62), std('#4d8fd1'), g, 0, .28, 0);
  mesh(new THREE.BoxGeometry(.84, .07, .68), std('#fffdf6'), g, 0, .59, 0);
  mesh(new THREE.BoxGeometry(.42, .02, .08), std('#10303f'), g, 0, .63, 0);
  const paper = mesh(new THREE.BoxGeometry(.3, .4, .012), std('#fffdf6'), g, .02, .82, 0);
  paper.rotation.z = -.12;
  mesh(new THREE.BoxGeometry(.16, .02, .004), std('#ff6f59'), paper, 0, .08, .008);
  mesh(new THREE.BoxGeometry(.16, .02, .004), std('#10303f'), paper, 0, 0, .008);
  return g;
}

function blocks() {
  const g = new THREE.Group();
  const letters = [['A', '#ff6f59', -.3, .2, 0, .2], ['B', '#4d8fd1', .32, .2, .06, -.25], ['C', '#f0bd52', 0, .62, .03, .12]];
  for (const [letter, color, x, y, z, turn] of letters) {
    const t = canvasTexture(128, (c, s) => {
      c.fillStyle = color; c.fillRect(0, 0, s, s);
      c.fillStyle = '#fff'; c.font = '800 88px "Bricolage Grotesque", sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(letter, s / 2, s / 2 + 4);
    });
    const face = std('#fff', {map: t});
    const b = mesh(new THREE.BoxGeometry(.42, .42, .42), face, g, x, y, z);
    b.rotation.y = turn;
  }
  return g;
}

// Where islets sit when seen together on the open sea, by how many there are.
const ISLET_HOMES = {
  2: [[-.86, .1], [.86, -.1]],
  3: [[-.92, -.52], [.92, -.52], [0, .76]],
  4: [[-1.08, -.72], [1.04, -.76], [-1.02, .72], [1.08, .66]],
};
const ISLET_RADIUS = .68;

// Several small islets instead of one big island. Order matches `islets` in islands.js.
function clusterOf(spots, homes = ISLET_HOMES[spots.length]) {
  const g = new THREE.Group();
  spots.forEach((spot, index) => {
    const [x, z] = homes[index];
    const islet = new THREE.Group();
    islet.position.set(x, 0, z);
    islet.add(createIslandBase(spot.color, ISLET_RADIUS, spot.seed));
    spot.symbol.position.y = .36;
    islet.add(spot.symbol);
    islet.userData.islet = ISLET_RADIUS;
    g.add(islet);
  });
  return g;
}

// A toy Kirby House until there's a reference photo of the real building: brick, white trim, a red door and pink hedges.
function house() {
  const g = new THREE.Group();
  const brick = std('#b5573f'), trim = std('#fbf6ea'), slate = std('#4a5560'), pane = std('#27414f', {roughness: .25});
  mesh(new THREE.BoxGeometry(1, .56, .6), brick, g, 0, .3, 0);
  mesh(new THREE.BoxGeometry(1.06, .04, .66), trim, g, 0, .03, 0);
  mesh(new THREE.BoxGeometry(1.08, .035, .68), trim, g, 0, .575, 0);
  const roofShape = new THREE.Shape([new THREE.Vector2(-.58, 0), new THREE.Vector2(.58, 0), new THREE.Vector2(0, .34)]);
  mesh(new THREE.ExtrudeGeometry(roofShape, {depth: .7, bevelEnabled: false}), slate, g, 0, .59, -.35);
  mesh(new THREE.BoxGeometry(.13, .26, .13), brick, g, .3, .8, 0);
  mesh(new THREE.BoxGeometry(.16, .03, .16), trim, g, .3, .94, 0);
  const windowAt = (x, y, size) => {
    mesh(new THREE.BoxGeometry(size + .035, size + .035, .012), trim, g, x, y, .303);
    mesh(new THREE.BoxGeometry(size, size, .012), pane, g, x, y, .308);
    mesh(new THREE.BoxGeometry(.012, size, .008), trim, g, x, y, .316);
    mesh(new THREE.BoxGeometry(size, .012, .008), trim, g, x, y, .316);
  };
  for (const x of [-.33, .33]) windowAt(x, .34, .15);
  for (const x of [-.15, .15]) windowAt(x, .47, .1);
  mesh(new THREE.BoxGeometry(.19, .3, .012), trim, g, 0, .17, .303);
  mesh(new THREE.BoxGeometry(.15, .27, .012), std('#d8283f', {roughness: .35}), g, 0, .155, .308);
  mesh(new THREE.BoxGeometry(.28, .04, .1), trim, g, 0, .02, .34);
  const leaf = std('#5f9e68');
  const bloom = std('#ff8fb1');
  for (const x of [-.36, -.22, .22, .36]) {
    mesh(new THREE.SphereGeometry(.07, 12, 10), leaf, g, x, .07, .34);
    mesh(new THREE.SphereGeometry(.018, 8, 6), bloom, g, x - .02, .125, .37);
    mesh(new THREE.SphereGeometry(.018, 8, 6), bloom, g, x + .025, .1, .39);
  }
  return g;
}

// A mooncake on a plate, stamped on top the way a mould presses them, with a second one behind it.
function mooncake() {
  const g = new THREE.Group();
  const crust = std('#c98a3c');
  const stamp = canvasTexture(256, (c, s) => {
    c.fillStyle = '#d29a4d';
    c.fillRect(0, 0, s, s);
    c.strokeStyle = '#8f5a1f';
    c.lineWidth = 7;
    c.beginPath();
    c.arc(s / 2, s / 2, s * .4, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#8f5a1f';
    c.font = '700 120px serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('月', s / 2, s / 2 + 6);
  });
  const cake = (x, y, z, size) => {
    const side = new THREE.CylinderGeometry(.34 * size, .36 * size, .24 * size, 28);
    // Scalloped sides, like the ridges a mould leaves.
    const p = side.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const push = 1 + Math.cos(Math.atan2(p.getZ(i), p.getX(i)) * 14) * .035;
      p.setX(i, p.getX(i) * push);
      p.setZ(i, p.getZ(i) * push);
    }
    side.computeVertexNormals();
    const body = mesh(side, [crust, std('#fff', {map: stamp}), crust], g, x, y, z);
    body.rotation.y = .4;
    return body;
  };
  mesh(new THREE.CylinderGeometry(.62, .54, .05, 40), std('#fbf6ea'), g, 0, .03, 0);
  cake(-.08, .18, .12, 1.05);
  cake(.2, .17, -.22, .85);
  return g;
}

// A red spring couplet hanging from a stand, with a brush leaning beside it.
function couplet() {
  const g = new THREE.Group();
  const paper = canvasTexture(256, (c, s) => {
    c.fillStyle = '#d8392f';
    c.fillRect(0, 0, s, s);
    c.fillStyle = '#1b1414';
    c.font = '700 170px serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('福', s / 2, s / 2 + 8);
  });
  const wood = std('#7a5636');
  for (const x of [-.34, .34]) mesh(new THREE.CylinderGeometry(.018, .022, 1, 10), wood, g, x, .5, -.04);
  const bar = mesh(new THREE.CylinderGeometry(.018, .018, .78, 10), wood, g, 0, .98, -.04);
  bar.rotation.z = Math.PI / 2;
  mesh(new THREE.BoxGeometry(.56, .56, .012), [std('#d8392f'), std('#d8392f'), std('#d8392f'), std('#d8392f'), std('#fff', {map: paper}), std('#d8392f')], g, 0, .66, -.03);
  mesh(new THREE.BoxGeometry(.8, .03, .28), wood, g, 0, .015, 0);
  const brush = new THREE.Group();
  mesh(new THREE.CylinderGeometry(.016, .016, .46, 10), std('#caa46a'), brush, 0, .23, 0);
  mesh(new THREE.ConeGeometry(.03, .1, 10), std('#1b1414'), brush, 0, -.05, 0).rotation.x = Math.PI;
  brush.position.set(.3, .12, .12);
  brush.rotation.z = -.5;
  g.add(brush);
  return g;
}

const community = () => clusterOf([  {symbol: lantern(), color: '#f8cfa0', seed: 2},
  {symbol: modelFrom('civic-hall.glb', 1.05, 1.05), color: '#d6e7c7', seed: 5},
  {symbol: ballot(), color: '#bcd9f2', seed: 7},
  {symbol: blocks(), color: '#f6e29c', seed: 9},
  {symbol: fit(house(), .95, 1.05), color: '#ffc4d6', seed: 4},
  // Same order as `islets` in islands.js, with Kirby House in front of the other four.
], [[-1.08, -.72], [1.04, -.76], [-1.42, .5], [1.42, .46], [0, 1.02]]);

const sports = () => clusterOf([
  {symbol: hoopCourt(), color: '#f4c9a0', seed: 3},
  {symbol: golf(), color: '#9edc7e', seed: 6},
  {symbol: goalPitch(), color: '#bfe6a8', seed: 8},
  // Golf sits in front, with the other two behind it. Same order as `islets` in islands.js.
], [[-.92, -.52], [0, .76], [.92, -.52]]);

const urban = () => clusterOf([
  {symbol: highway101(), color: '#c7d4dc', seed: 4},
  {symbol: modelFrom('daqing-pumpjack.glb', 1.1, 1.2), color: '#e3d7c0', seed: 7},
]);

const music = () => clusterOf([
  // The studio model also holds a piano, its plinth and a bow; keep only the violin. The bow comes from acts.js.
  {symbol: modelFrom('music-studio.glb', 1.5, 1.2, {min: [-3, .3, -2], max: [.6, 9, .05]}), color: '#f8bfca', seed: 2},
  {symbol: microphone(), color: '#c9bdf4', seed: 5},
  {symbol: modelFrom('playhouse.glb', 1.1, 1.1), color: '#f6dcae', seed: 9},
]);

function lighthouse() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const top = .3 - i * .04;
    mesh(new THREE.CylinderGeometry(top - .04, top, .38, 20), std(i % 2 ? '#fffdf6' : '#ff6f59'), g, 0, .19 + i * .38, 0);
  }
  mesh(new THREE.CylinderGeometry(.13, .13, .22, 16), std('#ffe6a8', {emissive: '#ffcf5a', emissiveIntensity: .7}), g, 0, 1.73, 0);
  mesh(new THREE.ConeGeometry(.2, .24, 16), std('#10303f'), g, 0, 1.96, 0);
  // A beam from the lamp that the page turns toward the cursor: a flat ray along +z that always faces the viewer,
  // soft at its edges and fading out toward the far end.
  const BEAM = {length: 4.2, near: .12, far: 1.5};
  const ray = new THREE.PlaneGeometry(1, BEAM.length, 1, 12);
  ray.rotateX(-Math.PI / 2);
  ray.translate(0, 0, BEAM.length / 2);
  const corners = ray.attributes.position;
  for (let i = 0; i < corners.count; i++) corners.setX(i, corners.getX(i) * (BEAM.near + (BEAM.far - BEAM.near) * corners.getZ(i) / BEAM.length));
  const light = new THREE.Mesh(ray, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: {uStrength: {value: 1}},
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float uStrength; varying vec2 vUv;
      void main() {
        float across = 1. - abs(vUv.x * 2. - 1.);
        float along = smoothstep(0., .08, 1. - vUv.y) * pow(vUv.y, 1.3);
        gl_FragColor = vec4(vec3(1., .94, .7) * pow(across, 1.6) * along * 1.5 * uStrength, 1.);
      }`,
  }));
  light.renderOrder = 4;
  const beam = new THREE.Group();
  beam.position.y = 1.73;
  beam.add(light);
  g.add(beam);
  g.userData.beam = beam;
  g.userData.beamRay = light;
  g.userData.beamStrength = light.material.uniforms.uStrength;
  return g;
}

function bottle() {
  const g = new THREE.Group();
  const points = [[0, 0], [.2, 0], [.24, .08], [.24, .55], [.1, .78], [.09, 1], [.11, 1.03], [0, 1.03]].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.MeshPhysicalMaterial({color: '#bfeee0', transparent: true, opacity: .55, roughness: .12});
  const rig = new THREE.Group();
  rig.rotation.z = 1.42;
  rig.position.set(.5, .13, 0);
  g.add(rig);
  mesh(new THREE.LatheGeometry(points, 22), glass, rig);
  mesh(new THREE.CylinderGeometry(.075, .085, .13, 12), std('#b98a58'), rig, 0, 1.06, 0);
  const note = mesh(new THREE.CylinderGeometry(.09, .09, .42, 12), std('#fffdf6'), rig, 0, .33, 0);
  note.rotation.z = .08;
  return g;
}

// The three Arts & Music landmarks, unscaled like the islets they come from, so the acts in acts.js line up with them.
const violin = () => modelFrom('music-studio.glb', 1.5, 1.2, {min: [-3, .3, -2], max: [.6, 9, .05]});
const playhouse = () => modelFrom('playhouse.glb', 1.1, 1.1);

const BUILDERS = {glasses, urban, candle, music, sports, community, lighthouse, bottle, violin, playhouse, stageMic: microphone,house: () => fit(house(), .95, 1.05), civicHall: () => modelFrom('civic-hall.glb', 1.05, 1.05), highway: () => fit(highway101(), 1.05, 1.05), ballot: () => fit(ballot(), 1.05, 1.05), blocks: () => fit(blocks(), 1.05, 1.05), pumpjack: () => modelFrom('daqing-pumpjack.glb', 1.1, 1.2), lantern: () => fit(lantern(), 1.1, 1), mooncake: () => fit(mooncake(), .55, 1.1), microphone: () => fit(microphone(), 1.1, .9), couplet: () => fit(couplet(), 1.1, 1)};

export function createSymbol(name) {
  return BUILDERS[name]();
}

// These stickers include hair and neck, so they need a little extra height to keep the face readable.
const FACES = {wink: 1.15, laugh: 1.12, surprised: 1.15};
const FACE_HEIGHT = 1.55;

export function createBoat() {
  const g = new THREE.Group();
  const paper = std('#fffdf6', {flatShading: true, side: THREE.DoubleSide});
  const hull = new THREE.BufferGeometry();
  // A folded paper boat: two hull faces and a centre peak.
  const v = [-1, .3, 0, 1, .3, 0, 0, -.12, 0, 0, .12, .42, 0, .12, -.42, 0, .86, 0];
  hull.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  hull.setIndex([0, 2, 3, 3, 2, 1, 1, 2, 4, 4, 2, 0, 0, 3, 5, 3, 1, 5, 1, 4, 5, 4, 0, 5]);
  hull.computeVertexNormals();
  mesh(hull, paper, g);
  // Niki's face sticker rides above the boat and swaps expression with what the visitor does.
  const faces = {};
  const textures = new THREE.TextureLoader();
  for (const name of Object.keys(FACES)) {
    faces[name] = textures.load(new URL(`./assets/stickers/${name}.png`, import.meta.url).href, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      if (name === g.userData.face) g.userData.fitFace(name);
    });
  }
  const sticker = new THREE.Sprite(new THREE.SpriteMaterial({map: faces.wink, depthWrite: false, transparent: true}));
  sticker.position.y = 1.5;
  g.add(sticker);
  g.userData.sticker = sticker;
  g.userData.face = 'wink';
  g.userData.fitFace = name => {
    const image = faces[name].image;
    g.userData.faceHeight = FACE_HEIGHT * FACES[name];
    g.userData.faceWidth = g.userData.faceHeight * (image ? image.width / image.height : .8);
  };
  g.userData.setFace = name => {
    if (g.userData.face === name) return;
    g.userData.face = name;
    sticker.material.map = faces[name];
    g.userData.fitFace(name);
    g.userData.pop = 1;
  };
  g.userData.faceWidth = FACE_HEIGHT * .8;
  g.userData.faceHeight = FACE_HEIGHT;
  g.userData.pop = 0;
  return g;
}
