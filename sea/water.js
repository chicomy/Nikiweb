// The sea: one shader doing caustics, shallows and foam around islands, the boat's wake, and the name under the water.
import * as THREE from 'three';

export const MAX_SHORES = 18;
export const MAX_TRAIL = 36;

const vertex = /* glsl */`
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */`
  precision highp float;
  varying vec3 vWorld;
  uniform float uTime, uNight, uMotion, uNameShow;
  uniform vec4 uShores[${MAX_SHORES}]; // x, z, radius, hover
  uniform int uShoreCount;
  uniform vec4 uTrail[${MAX_TRAIL}];   // x, z, ring radius, strength
  uniform int uTrailCount;
  uniform sampler2D uName;
  uniform vec4 uNameRect;              // centre x, centre z, width, height

  // Warped sine lines: the bright net of light on a pool floor.
  float caustic(vec2 world, float t) {
    vec2 p = mod(world, 6.28318) - 250.0;
    vec2 q = p;
    float c = 1.0;
    const float intensity = .005;
    for (int n = 0; n < 4; n++) {
      float f = t * (1.0 - 3.5 / float(n + 1));
      q = p + vec2(cos(f - q.x) + sin(f + q.y), sin(f - q.y) + cos(f + q.x));
      c += 1.0 / length(vec2(p.x / (sin(q.x + f) / intensity), p.y / (cos(q.y + f) / intensity)));
    }
    c /= 4.0;
    c = 1.17 - pow(c, 1.4);
    return clamp(pow(abs(c), 8.0), 0.0, 1.0);
  }

  void main() {
    vec2 p = vWorld.xz;
    float t = uTime * uMotion;

    float wave = sin(p.x * .32 + t * .5) * cos(p.y * .27 - t * .4);
    float light = caustic(p * .36, t * .32);
    float far = length(p - cameraPosition.xz);
    light *= 1.0 - smoothstep(70.0, 190.0, far);

    vec3 day = mix(vec3(.051, .545, .722), vec3(.086, .639, .776), .5 + .5 * wave);
    vec3 night = mix(vec3(.031, .106, .216), vec3(.055, .161, .294), .5 + .5 * wave);
    vec3 col = mix(day, night, uNight);
    float causticStrength = mix(.34, .12, uNight);

    float shore = 0.0, foam = 0.0, shade = 0.0, ripple = 0.0;
    for (int i = 0; i < uShoreCount; i++) {
      vec4 s = uShores[i];
      vec2 d = p - s.xy;
      // Far from this shore nothing below is visible, so skip the expensive part.
      if (s.w < .01 && dot(d, d) > (s.z + 5.0) * (s.z + 5.0)) continue;
      float angle = atan(d.y, d.x);
      float edge = s.z * (1.0 + .07 * sin(angle * 3.0 + s.x) + .045 * sin(angle * 5.0 + s.y));
      float dist = length(d) - edge;
      shore = max(shore, exp(-max(dist, 0.0) * 2.6 / max(s.z, .5)));
      float rings = sin(dist * 5.5 - t * 1.6 + 1.5 * sin(angle * 4.0 + s.x));
      // Foam hugs the outside of the shore only, since the sand islands cover whatever is underneath them.
      foam = max(foam, smoothstep(.3, .0, dist) * smoothstep(-.4, -.1, dist) * .75 + smoothstep(.75, 1.0, rings) * smoothstep(-.05, .1, dist) * exp(-max(dist, 0.0) * 2.4));
      if (s.w > .01) ripple += s.w * smoothstep(.72, 1.0, sin(dist * 3.4 - t * 4.2)) * exp(-max(dist, 0.0) * .55);
      vec2 shadowOffset = d + vec2(.35, -.5);
      shade = max(shade, smoothstep(edge * 1.2, edge * .55, length(shadowOffset)));
    }

    vec3 shallowDay = vec3(.42, .88, .85);
    vec3 shallowNight = vec3(.09, .33, .43);
    col = mix(col, mix(shallowDay, shallowNight, uNight), shore * .62);
    col *= 1.0 - shade * .22;

    // Name lying on the sea floor, bent by the water above it.
    vec2 bend = vec2(sin(p.y * 1.1 + t * .9), cos(p.x * .9 + t * .75)) * .09;
    bend += vec2(sin(p.x * 2.4 - t * 1.2), cos(p.y * 2.1 + t)) * .025;
    vec2 uv = (p + bend - uNameRect.xy) / uNameRect.zw + .5;
    uv.y = 1.0 - uv.y;
    float name = 0.0;
    if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) name = texture2D(uName, uv).a;
    vec3 nameCol = mix(vec3(.02, .22, .36), vec3(.73, .85, .9), uNight);
    name *= uNameShow;
    col = mix(col, nameCol, name * mix(.86, .72, uNight));

    col += light * causticStrength * (1.0 - name * .75) * vec3(.82, 1.0, 1.0);

    // Boat wake: rings spreading from the path overlap into a V of foam, with churned water down the middle.
    float wake = 0.0, churn = 0.0, inside = 0.0;
    for (int i = 0; i < uTrailCount; i++) {
      vec4 w = uTrail[i];
      vec2 d = p - w.xy;
      float dist = length(d);
      if (dist > w.z + 1.2) continue;
      float broken = .72 + .28 * sin(atan(d.y, d.x) * 5.0 + w.x * 4.0 + t * .8);
      wake = max(wake, w.w * broken * smoothstep(.1 + .13 * w.z, .0, abs(dist - w.z)));
      churn = max(churn, w.w * smoothstep(w.z * .85, .0, dist));
      inside = max(inside, smoothstep(w.z * .94, w.z * .68, dist));
    }
    // Only the outer edge of the overlapping rings stays, which draws the V.
    wake *= 1.0 - inside;
    col = mix(col, mix(shallowDay, shallowNight, uNight), churn * .5);

    vec3 foamCol = mix(vec3(.97, 1.0, .98), vec3(.55, .72, .82), uNight);
    col = mix(col, foamCol, clamp(foam, 0.0, 1.0) * .92);
    col = mix(col, foamCol, clamp(ripple, 0.0, 1.0) * .55);
    col = mix(col, foamCol, clamp(wake * 1.25, 0.0, 1.0) * .9);

    // Moonlight pooling on the water at night.
    float moon = exp(-length((p - vec2(9.0, -9.0)) * vec2(.1, .06)));
    col += uNight * moon * (.05 + light * .55) * vec3(1.0, .9, .66);

    // Water melts into the sky colour at the horizon when the camera is low.
    vec3 horizon = mix(vec3(.8, .94, .96), vec3(.1, .17, .3), uNight);
    col = mix(col, horizon, smoothstep(90.0, 620.0, far));

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Draw the words once, then the shader bends them every frame.
export function createNameTexture(lines) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const c = canvas.getContext('2d');
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#fff';
  c.font = '800 300px "Bricolage Grotesque", sans-serif';
  c.fillText(lines[0], 1024, 400);
  c.font = '700 88px "Bricolage Grotesque", sans-serif';
  c.fillText(lines[1], 1024, 650);
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = 8;
  return texture;
}

export function createWater(nameTexture) {
  const uniforms = {
    uTime: {value: 0},
    uNight: {value: 0},
    uMotion: {value: 1},
    uNameShow: {value: 1},
    uShores: {value: Array.from({length: MAX_SHORES}, () => new THREE.Vector4())},
    uShoreCount: {value: 0},
    uTrail: {value: Array.from({length: MAX_TRAIL}, () => new THREE.Vector4())},
    uTrailCount: {value: 0},
    uName: {value: nameTexture},
    uNameRect: {value: new THREE.Vector4(0, 0, 30, 15)},
  };
  const geometry = new THREE.PlaneGeometry(2400, 2400);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({uniforms, vertexShader: vertex, fragmentShader: fragment, toneMapped: false}));
  return {mesh, uniforms};
}
