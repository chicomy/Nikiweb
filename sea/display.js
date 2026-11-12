// Candle: a shop-window display on a sand island. The real product photos stand on plinths in front of the
// real packaging art, which joins up across the three boxes.
import * as THREE from 'three';
import {sandDry, sandWet} from './symbols.js';
import {slab, closed} from './course.js';

const LAND = [[-5.2, .6], [-4.7, -1.6], [-2.8, -2.7], [0, -2.95], [2.8, -2.7], [4.7, -1.6], [5.2, .6], [4.2, 2.1], [2, 2.7], [0, 2.8], [-2, 2.7], [-4.2, 2.1]];
const STAND_X = [-2.6, 0, 2.6], STAND_Z = 1.7, STAND_HEIGHT = .3;
const CANDLE_HEIGHT = [1.7, 2.03, 2.03];
// The boxes sit up on a shelf, high enough that the candles in front never cover them.
const SHELF = {height: 1.78, z: -1.1, depth: 1.5, width: 5.5};
const BOX = {width: 1.5, height: 2.03, depth: 1.05, z: SHELF.z};
const TILT = -.34;

const url = name => new URL(`./assets/candle/${name}`, import.meta.url).href;
const textures = new THREE.TextureLoader();
function photo(name, onLoad) {
  return textures.load(url(name), texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    onLoad?.(texture);
  });
}

function softDisc() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d');
  const fade = c.createRadialGradient(64, 64, 8, 64, 64, 64);
  fade.addColorStop(0, '#fff');
  fade.addColorStop(1, '#fff0');
  c.fillStyle = fade;
  c.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function addBoxes(group) {
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(SHELF.width, SHELF.height, SHELF.depth), new THREE.MeshStandardMaterial({color: '#fbf6ea', roughness: .45}));
  shelf.position.set(0, .24 + SHELF.height / 2, SHELF.z);
  shelf.castShadow = shelf.receiveShadow = true;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(SHELF.width + .04, .05, SHELF.depth + .04), new THREE.MeshStandardMaterial({color: '#d9b36a', roughness: .35, metalness: .35}));
  trim.position.set(0, .24 + SHELF.height - .02, SHELF.z);
  group.add(shelf, trim);
  const ink = new THREE.MeshStandardMaterial({color: '#0f3a37', roughness: .55});
  ['box-tree.jpg', 'box-fireplace.jpg', 'box-chair.jpg'].forEach((name, index) => {
    const front = new THREE.MeshStandardMaterial({map: photo(name), roughness: .6});
    const box = new THREE.Mesh(new THREE.BoxGeometry(BOX.width, BOX.height, BOX.depth), [ink, ink, ink, ink, front, ink]);
    box.position.set((index - 1) * BOX.width, .24 + SHELF.height + BOX.height / 2, BOX.z);
    box.castShadow = true;
    group.add(box);
  });
}

// Toy evergreens behind the boxes, for the forest the collection is named after.
function addForest(group) {
  const leaf = ['#2f7a4f', '#3b8c5a', '#276b48'].map(color => new THREE.MeshStandardMaterial({color, roughness: .7}));
  const bark = new THREE.MeshStandardMaterial({color: '#8a6a48', roughness: .8});
  const place = (x, z, size) => {
    const tree = new THREE.Group();
    tree.position.set(x, .24, z);
    tree.scale.setScalar(size);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .3, 8), bark);
    trunk.position.y = .15;
    tree.add(trunk);
    [[.48, .75, .55], [.38, .65, .95], [.26, .55, 1.3]].forEach(([radius, height, y], tier) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 14), leaf[(Math.abs(Math.round(x * 3)) + tier) % 3]);
      cone.position.y = y;
      cone.castShadow = true;
      tree.add(cone);
    });
    group.add(tree);
  };
  for (let i = 0; i < 9; i++) place(-3.9 + i * .975, -2.2 + Math.sin(i * 2.3) * .2, 1.75 + Math.sin(i * 4.1) * .3);
  for (const [x, z, size] of [[-4.2, -.6, 1.3], [-3.5, -1.2, 1.6], [3.5, -1.2, 1.6], [4.2, -.6, 1.3]]) place(x, z, size);
}

export function createDisplay(scene, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  group.add(slab(closed(LAND.map(([x, z]) => [x * 1.05, z * 1.08])), -.12, .3, sandWet, .12));
  group.add(slab(closed(LAND), .06, .18, sandDry, .07));
  addBoxes(group);
  addForest(group);

  const cream = new THREE.MeshStandardMaterial({color: '#fbf6ea', roughness: .45});
  const brass = new THREE.MeshStandardMaterial({color: '#d9b36a', roughness: .35, metalness: .35});
  const disc = softDisc();
  const stands = ['hidden-woodland.png', 'firelight.png', 'first-snow.png'].map((name, index) => {
    const x = STAND_X[index];
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.92, .98, STAND_HEIGHT, 56), cream);
    plinth.position.set(x, .24 + STAND_HEIGHT / 2, STAND_Z);
    plinth.castShadow = plinth.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.93, .022, 8, 64), brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, .24 + STAND_HEIGHT, STAND_Z);
    const contact = new THREE.Mesh(new THREE.CircleGeometry(.62, 32), new THREE.MeshBasicMaterial({map: disc, color: '#4b3f2c', transparent: true, opacity: .4, depthWrite: false}));
    contact.rotation.x = -Math.PI / 2;
    contact.scale.y = .6;
    contact.position.set(x, .24 + STAND_HEIGHT + .01, STAND_Z);
    const candle = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({transparent: true, alphaTest: .3, toneMapped: false}));
    candle.geometry.translate(0, .5, 0);
    candle.material.map = photo(name, texture => {
      candle.userData.ratio = texture.image.width / texture.image.height;
      candle.material.needsUpdate = true;
    });
    candle.position.set(x, .24 + STAND_HEIGHT - .02, STAND_Z);
    candle.rotation.x = TILT;
    group.add(plinth, ring, contact, candle);
    return {candle, index};
  });

  const edge = closed(LAND.map(([x, z]) => [x * 1.05, z * 1.08]), 60).map(([x, z]) => new THREE.Vector3(x, .1, z));
  // Treetops and the top of the boxes also have to fit in view.
  edge.push(new THREE.Vector3(0, 4.15, -1.6), new THREE.Vector3(-3.9, 3.1, -2.1), new THREE.Vector3(3.9, 3.1, -2.1));

  return {
    edge,
    frame: true,
    shores: [[-2.9, 0, 3], [0, 0, 3.1], [2.9, 0, 3]],
    update(active, center, unit) {
      group.visible = active;
      if (!active) return;
      group.position.set(center.x, 0, center.z);
      group.scale.setScalar(unit);
      for (const {candle, index} of stands) {
        const tall = CANDLE_HEIGHT[index];
        candle.scale.set(tall * (candle.userData.ratio || .7), tall, 1);
      }
    },
  };
}
