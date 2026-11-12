// What the boat leaves behind: foam rings that spread on the water, and bubbles that pop above it.
import * as THREE from 'three';
import {MAX_TRAIL} from './water.js';

const TRAIL_LIFE = 2.6;
const BUBBLE_COUNT = 70;
const BUBBLES_PER_SECOND = 30;

// A soap-film look: nearly clear in the middle, bright at the rim, with window-like highlights.
const bubbleVertex = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 view = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelViewMatrix) * mat3(instanceMatrix) * normal);
    vView = normalize(-view.xyz);
    gl_Position = projectionMatrix * view;
  }
`;

const bubbleFragment = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 n = normalize(vNormal);
    float facing = clamp(dot(n, vView), 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.6);
    // Thin dark line just inside the rim gives the bubble a crisp edge on bright water.
    float line = smoothstep(.3, .52, 1.0 - facing) * smoothstep(.8, .56, 1.0 - facing);
    vec3 film = .5 + .5 * cos(6.28 * (1.0 - facing) * 1.6 + vec3(0.0, 2.1, 4.2));
    vec3 color = mix(vec3(1.0), film, .3);
    color = mix(color, vec3(.03, .3, .46), line * .7);
    float main = pow(max(dot(n, normalize(vec3(-.45, .62, .64))), 0.0), 70.0);
    float bounce = pow(max(dot(n, normalize(vec3(.42, -.55, .72))), 0.0), 18.0) * .5;
    float alpha = .1 + rim * .9 + line * .22;
    gl_FragColor = vec4(color + (main + bounce) * 1.4, clamp(alpha + main + bounce, 0.0, 1.0));
  }
`;

export function createWake(scene, uniforms) {
  const trail = [];
  let sinceDrop = Infinity, lastX = 0, lastZ = 0;

  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 24, 18),
    new THREE.ShaderMaterial({vertexShader: bubbleVertex, fragmentShader: bubbleFragment, transparent: true, depthWrite: false, toneMapped: false}),
    BUBBLE_COUNT,
  );
  bubbles.frustumCulled = false;
  scene.add(bubbles);
  const particles = Array.from({length: BUBBLE_COUNT}, () => ({life: 0, age: 1, x: 0, y: 0, z: 0, vx: 0, vz: 0, size: 0, seed: 0}));
  const matrix = new THREE.Matrix4();
  let nextParticle = 0, spawnDebt = 0;

  function spawn(x, z, side, unit) {
    const p = particles[nextParticle];
    nextParticle = (nextParticle + 1) % BUBBLE_COUNT;
    const spread = (Math.random() - .5) * .6 * unit;
    p.x = x + side.x * spread;
    p.z = z + side.z * spread;
    p.y = .04 * unit;
    p.vx = side.x * spread * .5;
    p.vz = side.z * spread * .5;
    // Mostly small, with a few big ones, as real bubbles come.
    p.size = (.05 + Math.random() * Math.random() * .2) * unit;
    p.life = 1.1 + Math.random() * 1.2;
    p.age = 0;
    p.seed = Math.random() * 6.28;
  }

  const update = function(dt, {x, z, heading, speed, unit, active}) {
    const forward = {x: Math.sin(heading), z: Math.cos(heading)};
    const side = {x: forward.z, z: -forward.x};
    const sternX = x - forward.x * .55 * unit;
    const sternZ = z - forward.z * .55 * unit;
    const pace = Math.min(1, speed / (2.4 * unit));

    // Drop a new ring every short stretch of water, so the rings overlap into a V.
    sinceDrop = Math.hypot(sternX - lastX, sternZ - lastZ);
    if (active && pace > .04 && sinceDrop > .34 * unit) {
      trail.unshift({x: sternX, z: sternZ, age: 0, power: .35 + pace * .65});
      if (trail.length > MAX_TRAIL) trail.pop();
      lastX = sternX;
      lastZ = sternZ;
    }

    const slots = uniforms.uTrail.value;
    let count = 0;
    for (const point of trail) {
      point.age += dt / TRAIL_LIFE;
      if (point.age >= 1) continue;
      const spreadRadius = unit * (.14 + Math.pow(point.age, .62) * 1.35);
      slots[count++].set(point.x, point.z, spreadRadius, Math.pow(1 - point.age, 1.5) * point.power);
    }
    uniforms.uTrailCount.value = count;
    while (trail.length && trail[trail.length - 1].age >= 1) trail.pop();

    if (active) {
      spawnDebt += pace * BUBBLES_PER_SECOND * dt;
      while (spawnDebt >= 1) {
        spawnDebt -= 1;
        spawn(sternX, sternZ, side, unit);
      }
    }
    particles.forEach((p, index) => {
      if (p.age >= 1) {
        bubbles.setMatrixAt(index, matrix.makeScale(0, 0, 0));
        return;
      }
      p.age += dt / p.life;
      // Bigger bubbles rise faster and wander side to side as they go.
      p.y += dt * unit * (.1 + p.size / unit * 1.6);
      p.x += (p.vx + Math.sin(p.seed + p.age * 9) * .16 * unit) * dt;
      p.z += (p.vz + Math.cos(p.seed + p.age * 7) * .1 * unit) * dt;
      // Grow quickly, wobble, swell a little, then pop.
      const pop = p.age > .93 ? 1 + (p.age - .93) * 4 : 1;
      const s = p.size * Math.min(1, p.age * 7) * pop;
      const wobble = Math.sin(p.seed + p.age * 22) * .05;
      matrix.makeScale(s * (1 + wobble), s * (1 - wobble), s * (1 + wobble)).setPosition(p.x, p.y, p.z);
      bubbles.setMatrixAt(index, matrix);
    });
    bubbles.instanceMatrix.needsUpdate = true;
  };
  // A ring and a burst of bubbles where the water was clicked.
  update.splash = (x, z, unit) => {
    trail.unshift({x, z, age: .04, power: 1});
    if (trail.length > MAX_TRAIL) trail.pop();
    for (let i = 0; i < 12; i++) spawn(x + (Math.random() - .5) * .5 * unit, z + (Math.random() - .5) * .5 * unit, {x: 1, z: 0}, unit);
  };
  return update;
}
