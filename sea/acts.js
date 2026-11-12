// Small scenes that play when a place is opened: Niki's face joining in, kept slow and gentle on purpose.
import * as THREE from 'three';

// Where the camera sits for each scene, in island units.
export const ACT_VIEWS = {
  sing: {distance: 9.4, lookY: 1.2},
  violin: {distance: 8.6, lookY: 1},
};

const textures = new THREE.TextureLoader();
const NOTE_COLORS = ['#ff6f59', '#ffc846', '#8f7bea', '#22b8c9'];

function makeFace(group, name, height) {
  const texture = textures.load(new URL(`./assets/stickers/${name}.png`, import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, transparent: true, depthWrite: false}));
  sprite.renderOrder = 1;
  group.add(sprite);
  return {
    sprite,
    place(x, y, z, presence, tilt = 0) {
      const ratio = texture.image ? texture.image.width / texture.image.height : .85;
      sprite.position.set(x, y, z);
      sprite.scale.set(height * ratio * presence, height * presence, 1);
      sprite.material.rotation = tilt;
    },
  };
}

function canvasSprite(draw) {
  const size = 128, canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function noteTexture(kind, color) {
  return canvasSprite(c => {
    const draw = () => {
      c.beginPath();
      if (kind === 0) {
        c.ellipse(46, 96, 19, 14, -.35, 0, Math.PI * 2);
        c.moveTo(62, 92);
        c.lineTo(62, 22);
        c.quadraticCurveTo(70, 44, 92, 50);
        c.quadraticCurveTo(76, 54, 62, 44);
      } else {
        c.ellipse(32, 100, 17, 13, -.35, 0, Math.PI * 2);
        c.moveTo(82, 90);
        c.ellipse(82, 90, 17, 13, -.35, 0, Math.PI * 2);
        c.moveTo(46, 96);
        c.lineTo(46, 32);
        c.lineTo(96, 20);
        c.lineTo(96, 86);
        c.moveTo(46, 44);
        c.lineTo(96, 32);
      }
    };
    c.lineCap = c.lineJoin = 'round';
    // White sticker edge first, then the colored note on top.
    for (const [ink, width] of [['#fff', 20], [color, 8]]) {
      c.strokeStyle = c.fillStyle = ink;
      c.lineWidth = width;
      draw();
      c.stroke();
      c.fill();
    }
  });
}

// A little pool of sprites that drift upward and fade: notes, sparkles.
function makeFloaters(group, count, maps) {
  const items = Array.from({length: count}, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthWrite: false, opacity: 0}));
    sprite.visible = false;
    sprite.renderOrder = 2;
    group.add(sprite);
    return {sprite, age: 1, life: 1, vx: 0, rise: 0, size: 0, seed: 0};
  });
  let next = 0;
  return {
    spawn(x, y, z, {vx = 0, rise = .4, size = .25, life = 2.6} = {}) {
      const item = items[next];
      next = (next + 1) % count;
      Object.assign(item, {age: 0, life, vx, rise, size, seed: Math.random() * 6.28});
      item.sprite.material.map = maps[Math.floor(Math.random() * maps.length)];
      item.sprite.material.needsUpdate = true;
      item.sprite.position.set(x, y, z);
      item.sprite.visible = true;
    },
    update(dt) {
      for (const item of items) {
        if (item.age >= 1) continue;
        item.age += dt / item.life;
        if (item.age >= 1) {
          item.sprite.visible = false;
          continue;
        }
        item.sprite.position.y += dt * item.rise;
        item.sprite.position.x += (item.vx + Math.sin(item.seed + item.age * 7) * .1) * dt;
        item.sprite.scale.setScalar(item.size * Math.min(1, item.age * 8));
        item.sprite.material.rotation = Math.sin(item.seed + item.age * 5) * .25;
        item.sprite.material.opacity = Math.min(1, (1 - item.age) * 3);
      }
    },
  };
}

const notesFor = group => makeFloaters(group, 12, [0, 1].flatMap(kind => NOTE_COLORS.map(color => noteTexture(kind, color))));

function every(seconds) {
  let wait = 0;
  return dt => {
    wait += dt;
    if (wait < seconds) return false;
    wait = 0;
    return true;
  };
}

const SCENES = {
  sing(group, symbol) {
    const face = makeFace(group, 'laugh', 1.2), notes = notesFor(group), due = every(.45);
    const head = symbol.userData.micHead;
    return ({dt, active, presence, time, reduced}) => {
      head.rotation.z += ((active ? .62 : 0) - head.rotation.z) * Math.min(1, dt * 4);
      face.place(-.68, 1.66 + (reduced ? 0 : Math.sin(time * 1.5) * .025), -.3, presence, reduced ? 0 : Math.sin(time * 1.1) * .03);
      if (active && !reduced && due(dt)) notes.spawn(.05, 1.6, -.1, {vx: .1 + Math.random() * .35, rise: .5, size: .17 + Math.random() * .12});
      notes.update(dt);
    };
  },

  violin(group) {
    const face = makeFace(group, 'wink', .95), notes = notesFor(group), due = every(.6);
    const bow = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(.009, .013, 1.25, 8), new THREE.MeshStandardMaterial({color: '#6a3a1d', roughness: .4}));
    const hair = new THREE.Mesh(new THREE.BoxGeometry(.012, 1.12, .004), new THREE.MeshStandardMaterial({color: '#f3efe2', roughness: .8}));
    hair.position.set(-.03, 0, 0);
    const frog = new THREE.Mesh(new THREE.BoxGeometry(.05, .08, .03), new THREE.MeshStandardMaterial({color: '#14191d', roughness: .4}));
    frog.position.set(-.02, -.56, 0);
    bow.add(stick, hair, frog);
    bow.position.set(.1, .64, .22);
    group.add(bow);
    return ({dt, active, presence, time, reduced}) => {
      // Nearly flat across the strings, drawn slowly back and forth along its own length.
      const draw = reduced ? 0 : Math.sin(time * 1.6) * .22;
      bow.rotation.z = -1.32;
      bow.position.set(.1 + Math.cos(.25) * draw, .62 + Math.sin(.25) * draw, .22);
      bow.scale.setScalar(Math.max(.001, presence));
      face.place(-.62, 1.2, -.1, presence, -.2 + (reduced ? 0 : Math.sin(time * .8) * .02));
      if (active && !reduced && due(dt)) notes.spawn(.3, 1.05, .1, {vx: .08 + Math.random() * .25, rise: .42, size: .15 + Math.random() * .1});
      notes.update(dt);
    };
  },
};

export function createAct(kind, symbol) {
  const group = new THREE.Group();
  group.visible = false;
  symbol.add(group);
  const scene = SCENES[kind](group, symbol);
  let presence = 0, time = 0, wasActive = false;
  return (dt, active, reduced) => {
    if (active && !wasActive) time = 0;
    wasActive = active;
    presence = reduced ? (active ? 1 : 0) : presence + ((active ? 1 : 0) - presence) * Math.min(1, dt * 4.5);
    if (presence < .004 && !active) presence = 0;
    group.visible = presence > 0;
    time += dt;
    // Still runs while fading out, so everything can settle back to its resting pose.
    if (group.visible || active) scene({dt, active, presence, time, reduced});
  };
}
