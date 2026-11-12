// Soccer: a pitch framed by palms on a sand island, after the aerial references, in the same toy style as Golf.
import * as THREE from 'three';
import {sandDry, sandWet} from './symbols.js';
import {slab, closed, addPalms} from './course.js';
import {addPlayers} from './players.js';

const LAND = [[-5.5, 1.5], [-5.3, -1.4], [-3.9, -3], [-1, -3.4], [2, -3.3], [4.5, -2.9], [5.6, -1.4], [5.5, 1.5], [4.3, 3], [1, 3.4], [-2.5, 3.3], [-4.5, 2.95]];
const PITCH = {x: 0, z: .3, width: 7, depth: 4};
const LEFT = PITCH.x - PITCH.width / 2, BACK = PITCH.z - PITCH.depth / 2;

// A rounded rectangle, as points around its edge.
export function roundedRect(x, z, width, depth, radius) {
  const points = [];
  for (const [cx, cz, start] of [[width / 2 - radius, depth / 2 - radius, 0], [-width / 2 + radius, depth / 2 - radius, 1], [-width / 2 + radius, -depth / 2 + radius, 2], [width / 2 - radius, -depth / 2 + radius, 3]]) {
    for (let i = 0; i <= 6; i++) {
      const a = (start + i / 6) * Math.PI / 2;
      points.push([x + cx + Math.cos(a) * radius, z + cz + Math.sin(a) * radius]);
    }
  }
  return points;
}

function paintPitch() {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 800;
  const c = canvas.getContext('2d');
  const unit = canvas.width / PITCH.width;
  // Mowing stripes, then the markings a little inside the turf's edge.
  for (let i = 0; i < 14; i++) {
    c.fillStyle = i % 2 ? '#46a648' : '#3c9a41';
    c.fillRect(i * 100, 0, 101, 800);
  }
  c.strokeStyle = '#fbfff4';
  c.lineWidth = 7;
  const margin = 40, right = 1400 - margin, bottom = 800 - margin, midY = 400;
  c.strokeRect(margin, margin, 1400 - margin * 2, 800 - margin * 2);
  c.beginPath();
  c.moveTo(700, margin);
  c.lineTo(700, bottom);
  c.stroke();
  c.beginPath();
  c.arc(700, midY, .62 * unit, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = '#fbfff4';
  c.beginPath();
  c.arc(700, midY, 8, 0, Math.PI * 2);
  c.fill();
  for (const [edge, direction] of [[margin, 1], [right, -1]]) {
    const box = 1.1 * unit, half = 1.25 * unit, small = .42 * unit, smallHalf = .58 * unit;
    c.strokeRect(direction > 0 ? edge : edge - box, midY - half, box, half * 2);
    c.strokeRect(direction > 0 ? edge : edge - small, midY - smallHalf, small, smallHalf * 2);
    c.beginPath();
    const arcAt = edge + direction * box * .72;
    if (direction > 0) c.arc(arcAt, midY, .5 * unit, -.92, .92);
    else c.arc(arcAt, midY, .5 * unit, Math.PI - .92, Math.PI + .92);
    c.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function addPitch(group) {
  const turf = slab(roundedRect(PITCH.x, PITCH.z, PITCH.width, PITCH.depth, .08), .2, .08, new THREE.MeshStandardMaterial({map: paintPitch(), roughness: .8}), .012);
  const position = turf.geometry.attributes.position, uv = [];
  for (let i = 0; i < position.count; i++) uv.push((position.getX(i) - LEFT) / PITCH.width, 1 - (position.getZ(i) - BACK) / PITCH.depth);
  turf.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  group.add(turf);
}

function addGoal(group, side) {
  const white = new THREE.MeshStandardMaterial({color: '#fbfaf3', roughness: .4});
  const goal = new THREE.Group();
  goal.position.set(PITCH.x + side * (PITCH.width / 2 - .22), .28, PITCH.z);
  const post = (x, y, z, length, axis) => {
    const part = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, length, 10), white);
    part.position.set(x, y, z);
    if (axis === 'z') part.rotation.x = Math.PI / 2;
    if (axis === 'x') part.rotation.z = Math.PI / 2;
    part.castShadow = true;
    goal.add(part);
  };
  const HALF = .58, HEIGHT = .46, DEPTH = .3;
  for (const z of [-HALF, HALF]) {
    post(0, HEIGHT / 2, z, HEIGHT);
    post(side * DEPTH / 2, .012, z, DEPTH, 'x');
  }
  post(0, HEIGHT, 0, HALF * 2, 'z');
  post(side * DEPTH, .012, 0, HALF * 2, 'z');
  const net = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, Math.hypot(HEIGHT, DEPTH), 12, 6), new THREE.MeshBasicMaterial({color: '#fbfaf3', wireframe: true, transparent: true, opacity: .7}));
  net.rotation.set(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0);
  net.rotation.order = 'YXZ';
  net.rotation.x = side > 0 ? Math.atan2(DEPTH, HEIGHT) * -1 : Math.atan2(DEPTH, HEIGHT) * -1;
  net.position.set(side * DEPTH / 2, HEIGHT / 2, 0);
  goal.add(net);
  group.add(goal);
}

function addSideline(group) {
  const material = color => new THREE.MeshStandardMaterial({color, roughness: .5});
  // A pale walkway along the near touchline, with the two team benches on it.
  group.add(slab(roundedRect(PITCH.x, PITCH.z + PITCH.depth / 2 + .32, 5.4, .36, .08), .22, .04, material('#d9d6cc'), .012));
  for (const x of [-1.15, 1.15]) {
    const bench = new THREE.Group();
    bench.position.set(x, .26, PITCH.z + PITCH.depth / 2 + .32);
    const back = new THREE.Mesh(new THREE.BoxGeometry(.92, .32, .05), material('#fbfaf3'));
    back.position.set(0, .16, -.11);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(.96, .05, .28), material('#fbfaf3'));
    roof.position.set(0, .33, -.01);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(.84, .05, .13), material('#2f6fb0'));
    seat.position.set(0, .09, -.03);
    back.castShadow = roof.castShadow = true;
    bench.add(back, roof, seat);
    group.add(bench);
  }
  // Floodlights at the corners.
  for (const [x, z] of [[-3.95, -2], [3.95, -2], [-3.95, 2.6], [3.95, 2.6]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.018, .028, 1.15, 8), material('#8c979e'));
    pole.position.set(x, .24 + 1.15 / 2, z);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.24, .12, .05), material('#e9eef0'));
    lamp.position.set(x, .24 + 1.15, z);
    pole.castShadow = lamp.castShadow = true;
    group.add(pole, lamp);
  }
}

// Evenly planted but never in a straight line, the same on every visit.
function plantings() {
  const wobble = (i, size) => Math.sin(i * 12.9898) * size;
  const palms = [];
  for (let i = 0; i < 15; i++) palms.push([-4.6 + i * .66 + wobble(i, .1), -2.35 + wobble(i + 3, .12)]);
  for (let i = 0; i < 10; i++) palms.push([-3.3 + i * .74 + wobble(i + 7, .12), -2.95 + wobble(i + 9, .07)]);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) palms.push([side * (4.55 + wobble(i + side + 11, .28)), -1.45 + i * .72]);
  }
  const bushes = [];
  for (let i = 0; i < 14; i++) bushes.push([-4.4 + i * .68 + wobble(i + 2, .12), -1.97 + wobble(i + 5, .05), .2 + (i % 3) * .05, i % 3]);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) bushes.push([side * (3.98 + wobble(i + 4, .08)), -1.2 + i * .78, .2 + (i % 2) * .06, (i + 1) % 3]);
    for (let i = 0; i < 3; i++) bushes.push([side * (3.25 + i * .62), 2.95 - i * .22, .21 + (i % 2) * .05, i % 3]);
  }
  return {palms, bushes};
}

export function createPitch(scene, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  group.add(slab(closed(LAND.map(([x, z]) => [x * 1.05, z * 1.08])), -.12, .3, sandWet, .12));
  group.add(slab(closed(LAND), .06, .18, sandDry, .07));
  addPitch(group);
  addGoal(group, -1);
  addGoal(group, 1);
  addSideline(group);
  const {palms, bushes} = plantings();
  const swayPalms = addPalms(group, palms, bushes, {tall: 1.35});

  const playGame = addPlayers(group, {
    field: PITCH,
    ground: .28,
    squad: [[-2.95, 0, true], [-1.75, -.95], [-1.75, .95], [-.55, -.5], [-.55, .55], [.35, 0]],
    kits: [{shirt: '#d8392f', keeper: '#ffc846', shorts: '#22242c'}, {shirt: '#f4f7f6', keeper: '#7fce6f', shorts: '#2a4f7d'}],
    ball: {radius: .07, color: '#fbfaf3'},
    shot: {
      from: 1.1,
      chance: .45,
      // At goal: the other team's keeper goes across to save it.
      take(owner, direction, {players, kick}) {
        const keeper = players.find(p => p.keeper && p.team !== owner.team);
        const z = PITCH.z + (Math.random() - .5) * .9;
        keeper.goal.z = z;
        kick({x: PITCH.x + direction * (PITCH.width / 2 - .3), z, receiver: keeper, height: .16, speed: 3.2});
      },
    },
  });

  // The island's outer edge plus the tallest treetop, so the camera can keep it clear of everything floating.
  const edge = closed(LAND.map(([x, z]) => [x * 1.07, z * 1.1]), 60).map(([x, z]) => new THREE.Vector3(x, z < -1.8 ? 1.6 : .3, z));
  edge.push(new THREE.Vector3(0, 1.9, -3));

  const ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), point = new THREE.Vector3();
  return {
    edge,
    size: {width: 12, depth: 7.8},
    // Rough circles for the water's foam and ripples around the island.
    shores: [[-3, 0, 3.4], [0, 0, 3.7], [3, 0, 3.4]],
    update(active, center, unit, elapsed, reduced, dt, pointer) {
      group.visible = active;
      if (!active) return;
      group.position.set(center.x, reduced ? 0 : Math.sin(elapsed * .8) * .05, center.z);
      group.scale.setScalar(unit);
      group.updateMatrixWorld(true);
      if (reduced) return;
      let cursor = null;
      if (pointer) {
        ray.setFromCamera(pointer, camera);
        if (ray.ray.intersectPlane(ground, point)) cursor = group.worldToLocal(point.clone());
      }
      swayPalms(elapsed, cursor, dt);
      playGame(dt);
    },
  };
}
