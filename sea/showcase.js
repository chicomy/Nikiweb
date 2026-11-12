// Glasses: the model floats over the water and can be dragged to turn it, next to a floating sticker of me wearing them.
import * as THREE from 'three';
import {createSymbol} from './symbols.js';

const HERO = {x: .9, y: 1.6, size: 1.5, ripple: 1.7};
const STICKER = {x: -3.2, y: 1.75, height: 2.2, ratio: 413 / 512, roll: .08, ripple: .85};
// Leans back to face the camera, which looks down at this angle.
const FACE_CAMERA = THREE.MathUtils.degToRad(22);
// How far everything may reach, so the camera can size it to the space between the panels.
const REACH = {x: 4.2, top: 3.15};
const BOB = .05;
// During the story the glasses float to the side, leaving the space for the words.
const STORY_X = 3.9;
const HERO_SHADOW = {width: 2.6, depth: 1.3};
const STICKER_SHADOW = {width: 1.15, depth: .6};
const SPIN_SPEED = .009, MAX_COAST = 3, GRAB_RADIUS = 2.3, START_TURN = -.42, REST_TILT = -.12, AUTO_SPIN = .55, NUDGE = .22;
// Each part: where it is on the model, and the turn and tip that show it best. Left and right mean the wearer's.
const PARTS = {
  frame: {view: [START_TURN, 0], at: []},
  camera: {view: [-.55, 0], at: [[1.3, .37, .03]]},
  'left-button': {view: [-.95, .4], at: [[1.385, .55, -.26]]},
  'right-button': {view: [.95, .4], at: [[-1.385, .55, -.26]]},
  recording: {view: [.55, 0], at: [[-1.3, .37, .03]]},
  status: {view: [-2.4, .1], at: [[-1.328, .4, -.22]]},
  microphones: {view: [-1.15, .1], at: [[1.44, .4, -.55], [1.44, .4, -.85]]},
  speakers: {view: [-1.3, -.15], at: [[1.362, .245, -1.72]]},
  charging: {view: [-2.3, -.2], at: [[-1.232, -.1, -2.88]]},
};

// A soft shadow on the water, which is what makes something look like it's hovering.
function shadowOnWater(group, x, width, depth) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d');
  const fade = c.createRadialGradient(64, 64, 6, 64, 64, 64);
  fade.addColorStop(0, '#fff');
  fade.addColorStop(1, '#000');
  c.fillStyle = fade;
  c.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({alphaMap: new THREE.CanvasTexture(canvas), color: '#06364d', transparent: true, opacity: .3, depthWrite: false}));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(width, depth, 1);
  shadow.position.set(x, .03, 0);
  group.add(shadow);
  return shadow;
}

// Standing the model upright around its own middle.
function makeGlasses() {
  const model = createSymbol('glasses');
  const {stand, rig} = model.userData;
  stand.rotation.y = 0;
  stand.scale.setScalar(1);
  rig.position.set(0, 0, 1.25);
  rig.rotation.x = 0;
  return model;
}

export function createShowcase(scene, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const hero = makeGlasses();
  hero.position.set(HERO.x, HERO.y, 0);
  hero.scale.setScalar(HERO.size);
  group.add(hero);
  const heroShadow = shadowOnWater(group, HERO.x, HERO_SHADOW.width, HERO_SHADOW.depth);

  // Soft rings on whichever part is being explained, always visible even from behind.
  const rig = hero.userData.rig, ringImage = document.createElement('canvas');
  ringImage.width = ringImage.height = 128;
  const paint = ringImage.getContext('2d');
  paint.lineWidth = 9;
  paint.strokeStyle = '#ff6f59';
  paint.arc(64, 64, 50, 0, Math.PI * 2);
  paint.stroke();
  const ringTexture = new THREE.CanvasTexture(ringImage);
  const rings = [0, 1].map(() => {
    const ring = new THREE.Sprite(new THREE.SpriteMaterial({map: ringTexture, depthTest: false, transparent: true}));
    ring.renderOrder = 6;
    ring.visible = false;
    rig.add(ring);
    return ring;
  });

  // The glasses are already part of the picture, so they can't slip off my eyes.
  const sticker = new THREE.Group();
  sticker.position.set(STICKER.x, STICKER.y, 0);
  sticker.rotation.x = -FACE_CAMERA;
  const texture = new THREE.TextureLoader().load(new URL('./assets/stickers/surprised-glasses.png', import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const face = new THREE.PlaneGeometry(STICKER.height * STICKER.ratio, STICKER.height);
  const drop = new THREE.Mesh(face, new THREE.MeshBasicMaterial({map: texture, color: '#000', transparent: true, opacity: .2, depthWrite: false}));
  drop.position.set(.035, -.05, .03);
  const print = new THREE.Mesh(face, new THREE.MeshBasicMaterial({map: texture, transparent: true, alphaTest: .4, toneMapped: false}));
  print.position.z = .06;
  drop.rotation.z = print.rotation.z = STICKER.roll;
  sticker.add(drop, print);
  group.add(sticker);
  const stickerShadow = shadowOnWater(group, STICKER.x, STICKER_SHADOW.width, STICKER_SHADOW.depth);

  const edge = [[-1, 0], [1, 0], [-1, REACH.top], [1, REACH.top]].map(([side, y]) => new THREE.Vector3(side * REACH.x, y, 0));

  // Dragging: left and right spins the glasses, up and down tips them a little.
  let yaw = START_TURN, pitch = 0, spinX = 0, spinY = 0, dragging = null, moved = false, spinning = false, goal = null, heroX = HERO.x, heroGoalX = HERO.x, stickerShown = 1;
  const shores = [[HERO.x, 0, HERO.ripple], [STICKER.x, 0, STICKER.ripple]];
  const clampPitch = value => Math.max(-.5, Math.min(.5, value));
  const ray = new THREE.Raycaster(), sphere = new THREE.Sphere();
  const overGlasses = ndc => {
    ray.setFromCamera(ndc, camera);
    hero.getWorldPosition(sphere.center);
    sphere.radius = GRAB_RADIUS * group.scale.x;
    return ray.ray.intersectsSphere(sphere);
  };
  const onMove = e => {
    if (!dragging) return;
    const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    const seconds = Math.max(.008, (e.timeStamp - dragging.time) / 1000);
    dragging.x = e.clientX;
    dragging.y = e.clientY;
    dragging.time = e.timeStamp;
    yaw += dx * SPIN_SPEED;
    pitch = Math.max(-.5, Math.min(.5, pitch + dy * SPIN_SPEED));
    // Remembered in turns per second, so a flick coasts the same distance on any screen.
    spinX = Math.max(-MAX_COAST, Math.min(MAX_COAST, dx * SPIN_SPEED / seconds));
    spinY = Math.max(-MAX_COAST, Math.min(MAX_COAST, dy * SPIN_SPEED / seconds));
  };
  const onUp = () => {
    dragging = null;
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerup', onUp);
    removeEventListener('pointercancel', onUp);
  };
  const qYaw = new THREE.Quaternion(), qTip = new THREE.Quaternion();
  const axisY = new THREE.Vector3(0, 1, 0), axisX = new THREE.Vector3(1, 0, 0);

  return {
    edge,
    frame: true,
    room: true,
    shores,
    grab(ndc, e) {
      moved = false;
      if (!overGlasses(ndc)) return;
      dragging = {x: e.clientX, y: e.clientY, time: e.timeStamp};
      spinX = spinY = 0;
      goal = null;
      addEventListener('pointermove', onMove);
      addEventListener('pointerup', onUp);
      addEventListener('pointercancel', onUp);
    },
    // A click that was really the end of a drag, or that landed on the glasses, shouldn't splash the water.
    pick: ndc => moved || overGlasses(ndc),
    over: overGlasses,
    reset() {
      yaw = START_TURN;
      pitch = spinX = spinY = 0;
      spinning = false;
      goal = null;
      for (const ring of rings) ring.visible = false;
    },
    // Follows the page's scroll: beside the story at 0, in the middle next to the sticker at 1.
    glide(progress, tall, snap) {
      heroGoalX = (tall ? 0 : STORY_X) + (HERO.x - (tall ? 0 : STORY_X)) * progress;
      if (snap) heroX = heroGoalX;
      stickerShown = progress;
    },
    // Turn toward a part by the short way round, and ring it.
    focus(id) {
      const {view: [turn, tip], at} = PARTS[id];
      spinning = false;
      spinX = spinY = 0;
      goal = {yaw: turn + Math.round((yaw - turn) / (Math.PI * 2)) * Math.PI * 2, pitch: tip};
      rings.forEach((ring, index) => {
        ring.visible = index < at.length;
        if (ring.visible) ring.position.set(...at[index]);
      });
    },
    spin() {
      spinning = !spinning;
      goal = null;
      return spinning;
    },
    nudge(direction) {
      spinning = false;
      yaw = (goal?.yaw ?? yaw) + direction * NUDGE;
      goal = null;
    },
    update(active, center, unit, elapsed, reduced, dt, pointer) {
      group.visible = active;
      if (!active) {
        document.body.classList.remove('can-grab');
        return;
      }
      group.position.set(center.x, 0, center.z);
      group.scale.setScalar(unit);
      heroX += (heroGoalX - heroX) * (reduced ? 1 : 1 - Math.exp(-4 * dt));
      hero.position.x = heroShadow.position.x = shores[0][0] = heroX;
      sticker.visible = stickerShadow.visible = stickerShown > .02;
      sticker.scale.setScalar(Math.max(.02, stickerShown));
      stickerShadow.scale.set(STICKER_SHADOW.width * stickerShown, STICKER_SHADOW.depth * stickerShown, 1);
      shores[1][2] = STICKER.ripple * stickerShown;
      hero.position.y = HERO.y + (reduced ? 0 : Math.sin(elapsed * .9) * BOB);
      sticker.position.y = STICKER.y + (reduced ? 0 : Math.sin(elapsed * .9 + 1.4) * BOB);
      group.updateMatrixWorld(true);

      // Coasts briefly after a flick, then stays where it was left.
      if (goal) {
        const ease = reduced ? 1 : 1 - Math.exp(-6 * dt);
        yaw += (goal.yaw - yaw) * ease;
        pitch += (goal.pitch - pitch) * ease;
        if (Math.abs(goal.yaw - yaw) + Math.abs(goal.pitch - pitch) < .001) goal = null;
      }
      if (spinning && !dragging) yaw += AUTO_SPIN * dt;
      const beat = 1 + (reduced ? 0 : Math.sin(elapsed * 3.4) * .14);
      for (const ring of rings) ring.scale.setScalar(.3 * beat);
      if (!dragging && !reduced) {
        yaw += spinX * dt;
        pitch = Math.max(-.5, Math.min(.5, pitch + spinY * dt));
      }
      spinX *= Math.exp(-5 * dt);
      spinY *= Math.exp(-5 * dt);
      qYaw.setFromAxisAngle(axisY, yaw);
      qTip.setFromAxisAngle(axisX, REST_TILT + pitch);
      hero.quaternion.multiplyQuaternions(qYaw, qTip);

      document.body.classList.toggle('can-grab', !!pointer && overGlasses(pointer));
      document.body.classList.toggle('grabbing', !!dragging);
    },
  };
}
