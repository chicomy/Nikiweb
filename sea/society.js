// Chinese Society: a flat film strip of photos that keeps scrolling across the top, above one symbol for each event.
import * as THREE from 'three';
import {createIslandBase, createSymbol} from './symbols.js';

// Same order as the story cards in islands.js, so each card sits above its symbol.
const EVENTS = [
  {symbol: 'lantern', color: '#f8cfa0', seed: 2},
  {symbol: 'mooncake', color: '#f6e29c', seed: 5},
  {symbol: 'microphone', color: '#c9bdf4', seed: 7},
  {symbol: 'couplet', color: '#f8bfca', seed: 9},
];
const SPACING = 2.5, ISLET_RADIUS = .95, SYMBOL_RISE = .36, SYMBOL_SCALE = 1.5, TOP = 2.7, BOB = .05;

// The strip, in units of half the screen's width.
const PHOTO_RATIO = 4 / 3, GAP = .012, BORDER = .014, MIN_CELL = .4, STRIP_SHARE = .9;
const REACH = 1.6, BACK_STEPS = 140, PHOTO_STEPS = 24;
const AUTO_SPEED = .06, SPEED_EASE = 2.5, COAST_FADE = 3, MAX_COAST = 1.2, WHEEL_EASE = 12, WHEEL_REST = 1.5;
const SHADOW = {drop: .012, opacity: .28};
const CANVAS = {width: 1024, height: 768};

// A photo cropped to fill the frame. Films get a play button, and empty spots say what they're waiting for.
function paintPhoto(item, onDone) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS.width;
  canvas.height = CANVAS.height;
  const c = canvas.getContext('2d');
  const finish = () => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    onDone(texture);
  };
  if (item.empty) {
    c.fillStyle = '#e7eef0';
    c.fillRect(0, 0, CANVAS.width, CANVAS.height);
    c.strokeStyle = '#10303f66';
    c.lineWidth = 6;
    c.setLineDash([26, 18]);
    c.strokeRect(44, 44, CANVAS.width - 88, CANVAS.height - 88);
    c.fillStyle = '#47606c';
    c.textAlign = 'center';
    c.font = '700 58px "DM Sans", Arial, sans-serif';
    c.fillText('Photo to add', CANVAS.width / 2, CANVAS.height / 2 - 14);
    c.font = '500 44px "DM Sans", Arial, sans-serif';
    c.fillText(item.caption, CANVAS.width / 2, CANVAS.height / 2 + 56);
    finish();
    return;
  }
  const image = new Image();
  image.onload = () => {
    const scale = Math.max(CANVAS.width / image.width, CANVAS.height / image.height);
    const width = image.width * scale, height = image.height * scale;
    c.drawImage(image, (CANVAS.width - width) / 2, (CANVAS.height - height) / 2, width, height);
    if (item.film) {
      c.fillStyle = '#fffdf6';
      c.beginPath();
      c.arc(CANVAS.width / 2, CANVAS.height / 2, 70, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ff6f59';
      c.beginPath();
      c.moveTo(CANVAS.width / 2 - 22, CANVAS.height / 2 - 34);
      c.lineTo(CANVAS.width / 2 + 38, CANVAS.height / 2);
      c.lineTo(CANVAS.width / 2 - 22, CANVAS.height / 2 + 34);
      c.fill();
    }
    finish();
  };
  image.src = item.film ? item.print : item.src;
}

export function createSociety(scene, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const islets = EVENTS.map(({symbol, color, seed}, index) => {
    const islet = new THREE.Group();
    islet.position.x = (index - (EVENTS.length - 1) / 2) * SPACING;
    islet.add(createIslandBase(color, ISLET_RADIUS, seed));
    const model = createSymbol(symbol);
    model.scale.multiplyScalar(SYMBOL_SCALE);
    model.position.y += SYMBOL_RISE;
    islet.add(model);
    group.add(islet);
    return islet;
  });
  const reach = (EVENTS.length - 1) / 2 * SPACING + ISLET_RADIUS * 1.1;
  const edge = [[-1, 0, 0], [1, 0, 0], [-1, TOP, 0], [1, TOP, 0], [0, 0, 1]].map(([x, y, z]) => new THREE.Vector3(x * reach, y, z * ISLET_RADIUS * 1.1));

  const strip = new THREE.Group();
  strip.visible = false;
  scene.add(strip);
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, BACK_STEPS, 1), new THREE.MeshBasicMaterial({side: THREE.DoubleSide, toneMapped: false}));
  backing.frustumCulled = false;
  const shadow = new THREE.Mesh(backing.geometry, new THREE.MeshBasicMaterial({color: '#0b3e5c', transparent: true, opacity: SHADOW.opacity, side: THREE.DoubleSide, depthWrite: false}));
  shadow.frustumCulled = false;
  shadow.position.set(0, -SHADOW.drop, -.006);
  strip.add(shadow, backing);
  const hint = document.querySelector('#film-hint');
  let panels = [], openPhoto = () => {};

  // A straight, level strip. The photos slide along it.
  const place = (position, index, s, across, height, offset = 0) => {
    position.setXYZ(index, s, across * height / 2, offset);
  };

  let scroll = 0, coast = 0, speed = AUTO_SPEED, dragging = null, moved = false, halfWidthPx = 1, wheelLeft = 0, wheelRest = 0, frameColor = '';
  const ray = new THREE.Raycaster();
  const canHover = matchMedia('(hover: hover)').matches;
  const photoAt = ndc => {
    if (!strip.visible) return null;
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(backing).length ? ray.intersectObjects(panels)[0]?.object ?? backing : null;
  };
  const onMove = e => {
    if (!dragging) return;
    const dx = e.clientX - dragging.x;
    if (Math.abs(e.clientX - dragging.startX) > 4) moved = true;
    const seconds = Math.max(.008, (e.timeStamp - dragging.time) / 1000);
    dragging.x = e.clientX;
    dragging.time = e.timeStamp;
    scroll += dx / halfWidthPx;
    coast = Math.max(-MAX_COAST, Math.min(MAX_COAST, dx / halfWidthPx / seconds));
  };
  const onUp = () => {
    dragging = null;
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerup', onUp);
    removeEventListener('pointercancel', onUp);
  };

  // Scrolling anywhere on the page moves the strip, since the page itself doesn't scroll.
  addEventListener('wheel', e => {
    if (!strip.visible || !document.querySelector('#viewer').hidden || document.body.classList.contains('editing-text')) return;
    wheelLeft -= (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 30 : 1) / halfWidthPx;
    wheelRest = WHEEL_REST;
  }, {passive: true});

  const ahead = new THREE.Vector3(), point = new THREE.Vector3();

  return {
    edge,
    frame: true,
    // Looking further down than the shop window, so the bright sky stays off the title.
    angle: 42,
    shores: islets.map(islet => [islet.position.x, 0, ISLET_RADIUS * .92]),
    // Symbols get the space between the story cards and whatever is below them.
    band(height, tall) {
      const rects = selector => [...document.querySelectorAll(selector)].map(el => el.getBoundingClientRect()).filter(box => box.width);
      const notes = rects('.print.note'), facts = rects('#facts > li');
      if (tall) return {top: height * .41, bottom: Math.min(...notes.map(box => box.top)) - 4};
      return {top: Math.max(...notes.map(box => box.bottom)) + 4, bottom: Math.min(...facts.map(box => box.top)) - 6};
    },
    setPhotos(items, open) {
      openPhoto = open;
      if (panels.length) return;
      panels = items.map((item, index) => {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, PHOTO_STEPS, 1), new THREE.MeshBasicMaterial({color: '#20262b', side: THREE.DoubleSide, toneMapped: false}));
        panel.frustumCulled = false;
        panel.userData.index = index;
        paintPhoto(item, texture => {
          panel.material.map = texture;
          panel.material.color.set('#ffffff');
          panel.material.needsUpdate = true;
        });
        strip.add(panel);
        return panel;
      });
    },
    grab(ndc, e) {
      moved = false;
      if (!photoAt(ndc)) return;
      dragging = {x: e.clientX, startX: e.clientX, time: e.timeStamp};
      coast = 0;
      addEventListener('pointermove', onMove);
      addEventListener('pointerup', onUp);
      addEventListener('pointercancel', onUp);
    },
    // A click on a photo opens it; the end of a drag does nothing, and the water still splashes elsewhere.
    pick(ndc) {
      if (moved) {
        moved = false;
        return true;
      }
      const hit = photoAt(ndc);
      if (!hit) return false;
      if (hit !== backing) openPhoto(hit.userData.index);
      return true;
    },
    update(active, center, unit, elapsed, reduced, dt, pointer) {
      group.visible = strip.visible = active;
      if (!active) {
        document.body.classList.remove('film-hover', 'film-drag');
        return;
      }
      group.position.set(center.x, 0, center.z);
      group.scale.setScalar(unit);
      if (!reduced) islets.forEach((islet, index) => { islet.position.y = Math.sin(elapsed * .8 + index * 1.3) * BOB; });

      // The strip is sized in screen terms, so it always runs edge to edge, in the gap under the title.
      const line = document.querySelector('#golf-why').getBoundingClientRect();
      const tall = innerWidth / innerHeight < .95;
      const notes = [...document.querySelectorAll('.print.note')].map(el => el.offsetTop);
      if (!notes.length) return;
      const top = line.bottom + 8, bottom = tall ? innerHeight * .4 : Math.min(...notes) - 8;
      halfWidthPx = innerWidth / 2;
      const bandHeight = (bottom - top) / halfWidthPx;
      const height = Math.max(MIN_CELL / PHOTO_RATIO, bandHeight * STRIP_SHARE);
      const cell = height * PHOTO_RATIO + GAP;

      const distance = camera.position.y * .55;
      camera.getWorldDirection(ahead);
      point.set(0, 1 - 2 * ((top + bottom) / 2) / innerHeight, .5).unproject(camera).sub(camera.position).normalize();
      strip.position.copy(camera.position).addScaledVector(point, distance / point.dot(ahead));
      strip.quaternion.copy(camera.quaternion);
      strip.scale.setScalar(distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      strip.updateMatrixWorld(true);

      const hover = canHover && pointer && !dragging && !!photoAt(pointer);
      document.body.classList.toggle('film-hover', !!hover);
      document.body.classList.toggle('film-drag', !!dragging);
      // Keeps rolling on its own, slowing to a stop under the cursor so a photo is easy to click.
      wheelRest = Math.max(0, wheelRest - dt);
      speed += ((hover || reduced || wheelRest ? 0 : AUTO_SPEED) - speed) * Math.min(1, dt * SPEED_EASE);
      const wheelStep = wheelLeft * (1 - Math.exp(-WHEEL_EASE * dt));
      scroll += wheelStep;
      wheelLeft -= wheelStep;
      if (!dragging) {
        scroll += (speed + coast) * dt;
        coast *= Math.exp(-COAST_FADE * dt);
      }

      // Same colour as the story cards, in day and night.
      const card = getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
      if (card !== frameColor) backing.material.color.set(frameColor = card);
      hint.style.top = `${(top + bottom) / 2 + height * halfWidthPx / 2 - 34}px`;

      const backPosition = backing.geometry.attributes.position;
      for (let i = 0; i <= BACK_STEPS; i++) {
        const s = -REACH + i / BACK_STEPS * REACH * 2;
        place(backPosition, i, s, 1, height + BORDER * 2, -.003);
        place(backPosition, BACK_STEPS + 1 + i, s, -1, height + BORDER * 2, -.003);
      }
      backPosition.needsUpdate = true;
      backing.geometry.computeBoundingSphere();

      const total = cell * panels.length;
      panels.forEach((panel, index) => {
        const start = (((index * cell + scroll + total / 2) % total) + total) % total - total / 2;
        const position = panel.geometry.attributes.position;
        for (let i = 0; i <= PHOTO_STEPS; i++) {
          const s = start + i / PHOTO_STEPS * (cell - GAP);
          place(position, i, s, 1, height);
          place(position, PHOTO_STEPS + 1 + i, s, -1, height);
        }
        position.needsUpdate = true;
        panel.geometry.computeBoundingSphere();
      });
    },
  };
}
