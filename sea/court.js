// Basketball: a blue outdoor court on a sand island, in the same toy style as Golf and Soccer.
import * as THREE from 'three';
import {sandDry, sandWet} from './symbols.js';
import {slab, closed, addPalms} from './course.js';
import {roundedRect} from './pitch.js';
import {addPlayers} from './players.js';

const LAND = [[-5.2, 1.3], [-5, -1.5], [-3.5, -2.9], [-.6, -3.2], [2.6, -3.1], [4.6, -2.5], [5.3, -1], [5.2, 1.6], [3.8, 3.05], [.6, 3.35], [-2.8, 3.2], [-4.4, 2.6]];
const COURT = {x: 0, z: .15, width: 6.8, depth: 3.9};
const LEFT = COURT.x - COURT.width / 2, BACK = COURT.z - COURT.depth / 2;
const GROUND = .28, RIM_X = COURT.width / 2 - .62, RIM_Y = GROUND + 1.08, RIM_RADIUS = .15;

function paintCourt() {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 803;
  const c = canvas.getContext('2d');
  const unit = canvas.width / COURT.width, margin = 40, midY = canvas.height / 2, right = canvas.width - margin;
  // A surround, the blue of the real school court, then darker keys.
  c.fillStyle = '#5fb3a2';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#3d7dbf';
  c.fillRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);
  for (let i = 0; i < 9; i++) {
    c.fillStyle = i % 2 ? '#3f82c6' : '#3a78b8';
    c.fillRect(margin + i * 147, margin, 148, canvas.height - margin * 2);
  }
  const keyLength = 1.3 * unit, keyHalf = .55 * unit;
  c.fillStyle = '#2a5f9e';
  c.fillRect(margin, midY - keyHalf, keyLength, keyHalf * 2);
  c.fillRect(right - keyLength, midY - keyHalf, keyLength, keyHalf * 2);
  c.beginPath();
  c.arc(canvas.width / 2, midY, .5 * unit, 0, Math.PI * 2);
  c.fill();

  c.strokeStyle = '#fbfff4';
  c.lineWidth = 7;
  c.strokeRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);
  c.beginPath();
  c.moveTo(canvas.width / 2, margin);
  c.lineTo(canvas.width / 2, canvas.height - margin);
  c.stroke();
  c.beginPath();
  c.arc(canvas.width / 2, midY, .5 * unit, 0, Math.PI * 2);
  c.stroke();
  for (const [edge, direction] of [[margin, 1], [right, -1]]) {
    c.strokeRect(direction > 0 ? edge : edge - keyLength, midY - keyHalf, keyLength, keyHalf * 2);
    const line = edge + direction * keyLength;
    c.beginPath();
    c.arc(line, midY, keyHalf, 0, Math.PI * 2);
    c.stroke();
    // Three-point line: straight along the sides, then an arc around the hoop.
    const hoop = edge + direction * .38 * unit, reach = 1.62 * unit, flat = 1.5 * unit;
    const bend = Math.acos(flat / reach);
    c.beginPath();
    c.moveTo(edge, midY - flat);
    if (direction > 0) c.arc(hoop, midY, reach, -Math.PI / 2 + bend, Math.PI / 2 - bend);
    else c.arc(hoop, midY, reach, Math.PI * 1.5 - bend, Math.PI / 2 + bend, true);
    c.lineTo(edge, midY + flat);
    c.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function addCourt(group) {
  const surface = slab(roundedRect(COURT.x, COURT.z, COURT.width, COURT.depth, .08), .2, .08, new THREE.MeshStandardMaterial({map: paintCourt(), roughness: .7}), .012);
  const position = surface.geometry.attributes.position, uv = [];
  for (let i = 0; i < position.count; i++) uv.push((position.getX(i) - LEFT) / COURT.width, 1 - (position.getZ(i) - BACK) / COURT.depth);
  surface.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  group.add(surface);
}

function addHoop(group, side) {
  const hoop = new THREE.Group();
  hoop.position.set(COURT.x, GROUND, COURT.z);
  hoop.scale.x = side;
  const steel = new THREE.MeshStandardMaterial({color: '#39424a', roughness: .4});
  const postX = COURT.width / 2 - .1, boardX = RIM_X + RIM_RADIUS + .05, rimHeight = RIM_Y - GROUND;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, rimHeight + .12, 12), steel);
  post.position.set(postX, (rimHeight + .12) / 2, 0);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(postX - boardX, .04, .05), steel);
  arm.position.set((postX + boardX) / 2, rimHeight + .08, 0);
  const board = new THREE.Mesh(new THREE.BoxGeometry(.03, .34, .56), new THREE.MeshStandardMaterial({color: '#fbfaf3', roughness: .3}));
  board.position.set(boardX, rimHeight + .12, 0);
  const square = new THREE.Mesh(new THREE.BoxGeometry(.005, .14, .22), new THREE.MeshBasicMaterial({color: '#ff6f59'}));
  square.position.set(boardX - .018, rimHeight + .1, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM_RADIUS, .014, 10, 36), new THREE.MeshStandardMaterial({color: '#ff6f59', roughness: .4}));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(RIM_X, rimHeight, 0);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(RIM_RADIUS, RIM_RADIUS * .62, .2, 14, 3, true), new THREE.MeshBasicMaterial({color: '#fbfaf3', wireframe: true}));
  net.position.set(RIM_X, rimHeight - .1, 0);
  for (const part of [post, arm, board, rim]) part.castShadow = true;
  hoop.add(post, arm, board, square, rim, net);
  group.add(hoop);
}

function addCourtside(group) {
  const material = color => new THREE.MeshStandardMaterial({color, roughness: .5});
  // Low stands along the near side.
  for (const [row, color] of ['#3d7dbf', '#5c97d0', '#7fb0dd'].entries()) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.6, .1 + row * .1, .2), material(color));
    seat.position.set(COURT.x, .24 + (.1 + row * .1) / 2, COURT.z + COURT.depth / 2 + .26 + row * .2);
    seat.castShadow = true;
    group.add(seat);
  }
  for (const [x, z] of [[-3.75, -1.95], [3.75, -1.95], [-3.75, 2.4], [3.75, 2.4]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.018, .028, 1.3, 8), material('#8c979e'));
    pole.position.set(x, .24 + .65, z);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.24, .12, .05), material('#e9eef0'));
    lamp.position.set(x, .24 + 1.3, z);
    pole.castShadow = lamp.castShadow = true;
    group.add(pole, lamp);
  }
}

function plantings() {
  const wobble = (i, size) => Math.sin(i * 12.9898) * size;
  const palms = [];
  for (let i = 0; i < 12; i++) palms.push([-4 + i * .73 + wobble(i, .14), -2.5 + wobble(i + 3, .2)]);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) palms.push([side * (4.35 + wobble(i + side + 11, .25)), -1.1 + i * .86]);
  }
  const bushes = [];
  for (let i = 0; i < 10; i++) bushes.push([-3.6 + i * .8 + wobble(i + 2, .14), -2.04 + wobble(i + 5, .05), .17 + (i % 3) * .05, i % 3]);
  for (const side of [-1, 1]) bushes.push([side * 2.75, 2.85, .2, 1], [side * 3.35, 2.65, .25, 0], [side * 3.85, 2.2, .19, 2]);
  return {palms, bushes};
}

export function createCourt(scene, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  group.add(slab(closed(LAND.map(([x, z]) => [x * 1.05, z * 1.08])), -.12, .3, sandWet, .12));
  group.add(slab(closed(LAND), .06, .18, sandDry, .07));
  addCourt(group);
  addHoop(group, -1);
  addHoop(group, 1);
  addCourtside(group);
  const {palms, bushes} = plantings();
  const swayPalms = addPalms(group, palms, bushes, {tall: 1.25});

  const playGame = addPlayers(group, {
    field: COURT,
    ground: GROUND,
    squad: [[-1.75, -.85], [-1.75, .85], [-.65, -.5], [-.65, .5]],
    kits: [{shirt: '#d8392f', shorts: '#fbfaf3'}, {shirt: '#22242c', shorts: '#22242c'}],
    ball: {radius: .075, color: '#e8792f'},
    dribbleBounce: .16,
    shot: {
      // From most of the attacking half, so the ball regularly reaches the hoop.
      from: .1,
      chance: .5,
      // Up and through the hoop, then whoever on the other team is closest gets the rebound.
      take(owner, direction, {players, kick, nearest, restY}) {
        const x = COURT.x + direction * RIM_X, z = COURT.z;
        kick({
          x, z, y: RIM_Y, height: .55, speed: 2.6,
          then: () => {
            const rebound = nearest(players.filter(p => p.team !== owner.team), x, z);
            kick({x: x - direction * .15, z, y: restY, receiver: rebound, height: 0, speed: 1.5});
          },
        });
      },
    },
  });

  // The island's outer edge plus the tallest treetop, so the camera can keep it clear of everything floating.
  const edge = closed(LAND.map(([x, z]) => [x * 1.07, z * 1.1]), 60).map(([x, z]) => new THREE.Vector3(x, z < -1.8 ? 1.5 : .3, z));
  edge.push(new THREE.Vector3(0, 1.8, -2.8));

  const ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), point = new THREE.Vector3();
  return {
    edge,
    size: {width: 11.2, depth: 7.4},
    // Rough circles for the water's foam and ripples around the island.
    shores: [[-2.8, 0, 3.2], [0, 0, 3.5], [2.8, 0, 3.2]],
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
