// A sky dome that only comes into view when the camera drops to water level.
import * as THREE from 'three';

const vertex = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */`
  varying vec3 vDir;
  uniform float uNight, uTime;

  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec3 dir = normalize(vDir);
    float up = clamp(dir.y, 0.0, 1.0);
    vec3 day = mix(vec3(.8, .94, .96), vec3(.2, .63, .9), pow(up * 2.6, .7));
    vec3 night = mix(vec3(.1, .17, .3), vec3(.02, .05, .13), pow(up * 2.6, .7));

    // Puffy clouds, flattened toward the horizon.
    vec2 p = vec2(atan(dir.x, -dir.z) * 5.0 + uTime * .006, dir.y * 16.0);
    float n = noise(p) * .55 + noise(p * 2.1 + 3.0) * .3 + noise(p * 4.3 + 7.0) * .15;
    float band = smoothstep(.01, .1, up) * smoothstep(.6, .16, up);
    float cloud = smoothstep(.5, .68, n) * band;
    day = mix(day, vec3(1.0, .99, .95), cloud * .95);
    night = mix(night, vec3(.2, .27, .4), cloud * .55);

    // Stars and moon at night, a soft sun glow by day.
    vec2 starUv = vec2(atan(dir.x, -dir.z), dir.y) * 90.0;
    vec2 starCell = floor(starUv);
    float starSeed = fract(sin(dot(starCell, vec2(12.9, 78.2))) * 43758.5);
    vec2 starOffset = vec2(fract(starSeed * 7.3), fract(starSeed * 13.7)) * .6 + .2;
    float twinkle = .65 + .35 * sin(uTime * (1.0 + starSeed * 2.0) + starSeed * 40.0);
    float star = step(.82, starSeed) * smoothstep(.09, .02, length(fract(starUv) - starOffset)) * twinkle;
    night += star * smoothstep(.03, .2, up) * (1.0 - cloud) * .9;
    vec3 toLight = normalize(vec3(.17, .15, -.97));
    float glow = max(dot(dir, toLight), 0.0);
    day += pow(glow, 40.0) * vec3(.3, .25, .12);
    night += smoothstep(.9993, .9996, glow) * vec3(1.0, .93, .74) + pow(glow, 90.0) * vec3(.14, .13, .1);

    gl_FragColor = vec4(mix(day, night, uNight), 1.0);
  }
`;

export function createSky(uniforms) {
  const material = new THREE.ShaderMaterial({
    uniforms: {uNight: uniforms.uNight, uTime: uniforms.uTime},
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), material);
  dome.renderOrder = -1;
  return dome;
}
