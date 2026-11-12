// Golf: one big hole, shaped after the aerial reference, built as a sand island like the rest of the sea.
import * as THREE from 'three';
import {mergeVertices} from '../dist/vendor/utils/BufferGeometryUtils.js';
import {sandDry, sandWet} from './symbols.js';

// How much room the island needs on screen, in course units.
const COURSE_SIZE = {width: 11.2, depth: 7.6};

const LAND = [[-5, 1.8], [-4.6, -.4], [-3.2, -1.9], [-1.2, -2.2], [.4, -3.2], [2.2, -3.4], [3.9, -2.8], [4.9, -1.4], [4.5, .2], [3.1, .9], [2.2, 2.2], [.5, 3], [-1.6, 2.9], [-3.6, 3.1]];
const TEE = [-4, 1.75], BEND = [-.5, -.9], GREEN = [3.15, -1.7];

export const closed = (points, samples = 170) => new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal')
  .getSpacedPoints(samples).slice(0, -1).map(p => [p.x, p.z]);

// A flat shape with a soft, rounded edge, so every layer of the island feels poured rather than cut.
export function slab(outline, y, height, material, bevel = .05) {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  const extruded = new THREE.ExtrudeGeometry(shape, {depth: Math.max(.001, height - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 5, curveSegments: 2});
  extruded.rotateX(-Math.PI / 2);
  extruded.deleteAttribute('uv');
  extruded.deleteAttribute('normal');
  const geometry = mergeVertices(extruded, 1e-3);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

const fairwayPoint = t => {
  const u = 1 - t;
  return [u * u * TEE[0] + 2 * u * t * BEND[0] + t * t * GREEN[0], u * u * TEE[1] + 2 * u * t * BEND[1] + t * t * GREEN[1]];
};

function fairwayOutline() {
  const left = [], right = [], END = 1.14;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60 * END;
    const [x, z] = fairwayPoint(t), [ax, az] = fairwayPoint(t + .02), [bx, bz] = fairwayPoint(t - .02);
    const length = Math.hypot(ax - bx, az - bz) || 1, sideX = -(az - bz) / length, sideZ = (ax - bx) / length;
    const taper = Math.sqrt(Math.min(1, t * 5)) * Math.sqrt(Math.min(1, (END - t) * 5));
    const a = (.95 + .22 * Math.sin(t * 7 + 1) + .08 * Math.sin(t * 17) + .25 * t) * taper;
    const b = (1 + .26 * Math.sin(t * 5 + 3) + .08 * Math.sin(t * 13 + 2) + .2 * t) * taper;
    left.push([x + sideX * a, z + sideZ * a]);
    right.unshift([x - sideX * b, z - sideZ * b]);
  }
  return [...left, ...right];
}

// Long mowing stripes that follow the length of the fairway.
function stripedFairway(mesh) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 4;
  const c = canvas.getContext('2d');
  c.fillStyle = '#7fd05c';
  c.fillRect(0, 0, 64, 4);
  c.fillStyle = '#93dd6e';
  c.fillRect(0, 0, 32, 4);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  const position = mesh.geometry.attributes.position, uv = [];
  const across = new THREE.Vector2(GREEN[1] - TEE[1], TEE[0] - GREEN[0]).normalize();
  for (let i = 0; i < position.count; i++) uv.push((position.getX(i) * across.x + position.getZ(i) * across.y) / .7, 0);
  mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  mesh.material.map = map;
  mesh.material.needsUpdate = true;
}

function kidney(x, z, size, turn) {
  return Array.from({length: 40}, (_, i) => {
    const a = i / 40 * Math.PI * 2, r = size * (1 + .2 * Math.cos(a * 2));
    const dx = Math.cos(a) * r * 1.35, dz = Math.sin(a) * r * .95 + (Math.cos(a) * 1.2) ** 2 * size * .5;
    return [x + dx * Math.cos(turn) - dz * Math.sin(turn), z + dx * Math.sin(turn) + dz * Math.cos(turn)];
  });
}

const PALMS = [[.2, 2], [1.75, 1.75], [4.1, .25], [-.7, 2.4], [-2.2, 2.45], [-3.7, -.75], [-2.6, -1.3], [.1, -2.15], [-4.3, .55], [4.2, -.55]];
const BUSHES = [[.95, 2.35], [-1.5, 2.2], [3.5, .75], [-3.3, 2.6], [-1.5, -1.7]];

const FRONDS = 9;
// Palms sway a little all the time, and more when the cursor passes close by.
export function addPalms(group, PLACES, BUSH_PLACES, {tall = 1} = {}) {
  const trunk = new THREE.CylinderGeometry(.035, .06, 1, 8);
  trunk.translate(0, .5, 0);
  const frond = new THREE.SphereGeometry(1, 10, 6);
  frond.scale(.42, .025, .1);
  frond.translate(.42, 0, 0);
  const position = frond.attributes.position;
  for (let i = 0; i < position.count; i++) position.setY(i, position.getY(i) - position.getX(i) ** 2 * .55);
  frond.computeVertexNormals();
  const trunks = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({color: '#a98a62', roughness: .8}), PLACES.length);
  const leaves = new THREE.InstancedMesh(frond, new THREE.MeshStandardMaterial({color: '#ffffff', roughness: .6}), PLACES.length * FRONDS);
  const holder = new THREE.Object3D(), color = new THREE.Color();
  const palms = PLACES.map(([x, z], p) => ({x, z, p, height: (.6 + (p * 37 % 5) * .07) * tall, lean: ((p * 13) % 7 - 3) * .03, stir: 0}));
  const pose = (palm, time) => {
    const sway = Math.sin(time * 1.2 + palm.p) * (.015 + palm.stir * .14);
    const tilt = palm.lean + sway;
    holder.position.set(palm.x, .24, palm.z);
    holder.rotation.set(0, 0, tilt);
    holder.scale.set(1, palm.height, 1);
    holder.updateMatrix();
    trunks.setMatrixAt(palm.p, holder.matrix);
    for (let k = 0; k < FRONDS; k++) {
      const flap = Math.sin(time * 2 + palm.p + k) * (.012 + palm.stir * .07);
      holder.position.set(palm.x - Math.sin(tilt) * palm.height, .24 + palm.height, palm.z);
      holder.rotation.set(0, k / FRONDS * Math.PI * 2 + palm.p, .22 + flap, 'YXZ');
      holder.scale.setScalar(.68 + (k % 3) * .09);
      holder.updateMatrix();
      leaves.setMatrixAt(palm.p * FRONDS + k, holder.matrix);
    }
    holder.rotation.order = 'XYZ';
  };
  palms.forEach(palm => {
    pose(palm, 0);
    for (let k = 0; k < FRONDS; k++) leaves.setColorAt(palm.p * FRONDS + k, color.set(k % 2 ? '#4fae5f' : '#39985a'));
  });
  trunks.castShadow = leaves.castShadow = true;
  group.add(trunks, leaves);
  const bushes = ['#3f9e5c', '#2f8a4e', '#8fc75a'].map(color => new THREE.MeshStandardMaterial({color, roughness: .7}));
  for (const [x, z, size = .2, shade = 0] of BUSH_PLACES) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), bushes[shade]);
    ball.position.set(x, .24 + size * .4, z);
    ball.scale.y = .8;
    ball.castShadow = true;
    group.add(ball);
  }
  return (time, cursor, dt) => {
    for (const palm of palms) {
      const near = cursor ? Math.max(0, 1 - Math.hypot(cursor.x - palm.x, cursor.z - palm.z) / 1.3) : 0;
      palm.stir += (near - palm.stir) * Math.min(1, dt * 3);
      pose(palm, time);
    }
    trunks.instanceMatrix.needsUpdate = leaves.instanceMatrix.needsUpdate = true;
  };
}

// Rounded rocks along the seaward shore, as on the reference's coast but in the toy style of the islands.
function addRocks(group, land) {
  const shore = land.filter(([x, z]) => z < -1 && x > -3.8 || x > 4.3 && z < .1);
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({color: '#ffffff', roughness: .75}), shore.length * 2);
  const holder = new THREE.Object3D(), color = new THREE.Color(), shades = ['#8d7c68', '#6f6254', '#a69684', '#7c6c5b'];
  let index = 0;
  for (const [x, z] of shore) {
    for (let k = 0; k < 2; k++, index++) {
      const seed = (index * 53) % 17 / 17, away = Math.hypot(x, z) || 1;
      const out = -.02 + seed * .24;
      holder.position.set(x + x / away * out + (seed - .5) * .12, .1 + seed * .06, z + z / away * out);
      holder.scale.set(.1 + seed * .13, .08 + seed * .08, .1 + (1 - seed) * .1);
      holder.rotation.set(seed * 6, seed * 11, seed * 3);
      holder.updateMatrix();
      rocks.setMatrixAt(index, holder.matrix);
      rocks.setColorAt(index, color.set(shades[index % shades.length]));
    }
  }
  rocks.castShadow = true;
  group.add(rocks);
}

function makeFlag(color, height, size) {
  const flag = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.018 * size + .007, .018 * size + .007, height, 12), new THREE.MeshStandardMaterial({color: '#fbfaf3'}));
  pole.position.y = height / 2;
  pole.castShadow = true;
  const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(.62 * size, -.2 * size), new THREE.Vector2(0, -.4 * size)]);
  const pennant = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth: .02, bevelEnabled: false}), new THREE.MeshStandardMaterial({color}));
  pennant.position.set(.02, height - .02, 0);
  pennant.castShadow = true;
  flag.add(pole, pennant);
  flag.userData.pennant = pennant;
  return flag;
}

export function createCourse(scene, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const land = closed(LAND);
  const material = color => new THREE.MeshStandardMaterial({color, roughness: .55});
  group.add(slab(closed(LAND.map(([x, z]) => [x * 1.07, z * 1.1])), -.12, .3, sandWet, .12));
  group.add(slab(land, .06, .18, sandDry, .07));
  const fairway = slab(fairwayOutline(), .22, .07, new THREE.MeshStandardMaterial({color: '#ffffff', roughness: .6}), .025);
  stripedFairway(fairway);
  group.add(fairway);

  const greenShape = grow => Array.from({length: 48}, (_, i) => {
    const a = i / 48 * Math.PI * 2, r = 1 + .13 * Math.sin(a * 2 + 1) + .08 * Math.sin(a * 3) + grow;
    return [GREEN[0] + Math.cos(a) * r * 1.1, GREEN[1] + Math.sin(a) * r * .8];
  });
  group.add(slab(greenShape(0), .27, .05, material('#b9f092'), .02));

  const sand = material('#fff3d8'), lip = material('#5aa845');
  for (const [x, z, size, turn] of [[2, -.55, .3, .5], [4.05, -.75, .22, 2.2], [.7, -.05, .27, -.5], [-1.2, -.35, .22, 2.6], [-2.45, 1.45, .2, .4]]) {
    group.add(slab(kidney(x, z, size + .05, turn), .265, .05, lip, .02));
    group.add(slab(kidney(x, z, size, turn), .285, .05, sand, .02));
  }

  const swayPalms = addPalms(group, PALMS, BUSHES);
  addRocks(group, land);

  // The hole itself, with a ball waiting back near the tee.
  const holeFlag = makeFlag('#ff6f59', 1.7, 1);
  holeFlag.position.set(GREEN[0], .32, GREEN[1]);
  const cup = new THREE.Mesh(new THREE.CircleGeometry(.09, 24), new THREE.MeshStandardMaterial({color: '#26351f'}));
  cup.rotation.x = -Math.PI / 2;
  cup.position.y = .012;
  holeFlag.add(cup);
  group.add(holeFlag);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 18), new THREE.MeshStandardMaterial({color: '#fbfaf3', roughness: .45}));
  const [ballX, ballZ] = fairwayPoint(.1);
  ball.position.set(ballX - .14, .38, ballZ + .14);
  ball.castShadow = true;
  group.add(ball);

  const point = new THREE.Vector3(), ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // The island's outer edge plus the top of its flag, so the camera can keep it clear of everything floating.
  const edge = closed(LAND.map(([x, z]) => [x * 1.1, z * 1.13]), 60).map(([x, z]) => new THREE.Vector3(x, .3, z));
  edge.push(new THREE.Vector3(GREEN[0], 2.05, GREEN[1]));

  return {
    edge,
    size: COURSE_SIZE,
    // Rough circles for the water's foam and ripples around the island's long shape.
    shores: [[-3.1, .9, 2.7], [.1, .1, 3], [3.1, -1.3, 2.5]],
    update(active, center, unit, elapsed, reduced, dt, pointer) {
      group.visible = active;
      if (!active) return;
      group.updateMatrixWorld(true);
      if (!reduced) {
        let cursor = null;
        if (pointer) {
          ray.setFromCamera(pointer, camera);
          if (ray.ray.intersectPlane(ground, point)) cursor = group.worldToLocal(point.clone());
        }
        swayPalms(elapsed, cursor, dt);
        holeFlag.userData.pennant.rotation.y = Math.sin(elapsed * 3 + holeFlag.position.x) * .3;
      }
      group.position.set(center.x, reduced ? 0 : Math.sin(elapsed * .8) * .05, center.z);
      group.scale.setScalar(unit);
    },
  };
}
