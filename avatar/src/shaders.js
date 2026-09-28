// Shaders for the photo-real talking head.
//
// Geometry: a dense grid displaced by the depth map built from the photo.
// The head part of the grid (weighted by aRot) turns around a neck pivot.
//
// Texture space ("image space" below) is the source photo in normalised
// coordinates: x to the right, y DOWN, both 0..1. Mouth and eyelid motion is
// done here by warping where each pixel samples the photo, so the real lips,
// beard and eyelids move instead of a painted-on overlay.

export const vertexShader = /* glsl */ `
uniform float uDepthScale;
uniform vec3 uPivot;
uniform mat3 uHeadRot;
uniform vec3 uHeadShift;
uniform float uBreath;

attribute float aRot;

varying vec2 vUv;
varying vec3 vNormalNow;
varying vec3 vNormalRest;
varying vec3 vNormalView;
varying vec3 vViewPos;

void main() {
  vec3 p = position;
  p.z *= uDepthScale;
  vec3 n0 = normalize(vec3(normal.xy, normal.z / uDepthScale));

  vec3 turned = uHeadRot * (p - uPivot) + uPivot + uHeadShift;
  vec3 pos = mix(p, turned, aRot);
  pos.y += uBreath * (1.0 - 0.45 * aRot);
  vec3 n = normalize(mix(n0, uHeadRot * n0, aRot));

  vUv = uv;
  vNormalNow = n;
  vNormalRest = n0;
  vNormalView = normalize(normalMatrix * n);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uMap;
uniform sampler2D uMatte;

// expression state
uniform float uOpen;    // jaw 0..1
uniform float uWide;    // -1 rounded (oo) .. 1 spread (ee)
uniform float uSmile;   // 0..1
uniform float uBlink;   // 0..1
uniform float uMaxOpen; // lower-lip drop at full open, image units

// mouth geometry (image space)
uniform vec2 uMouthC;
uniform float uMouthHW;
uniform vec3 uLip;      // lip line y = c0 + c1*d + c2*d^2, d = (x - cx) / halfWidth
uniform vec2 uCornerL;
uniform vec2 uCornerR;
uniform float uNoseY;
uniform float uLowerY;
uniform float uChinY;
uniform float uJawHW;

// eyes: (centre x, centre y, half width, glasses frame y) + lid polynomials
uniform vec4 uEyeA;
uniform vec3 uEyeAUp;
uniform vec3 uEyeALo;
uniform vec4 uEyeB;
uniform vec3 uEyeBUp;
uniform vec3 uEyeBLo;

// light
uniform vec3 uLightRest;
uniform vec3 uLight;
uniform float uRelight;
uniform vec3 uRimColor;
uniform float uRim;
uniform float uFade;

varying vec2 vUv;
varying vec3 vNormalNow;
varying vec3 vNormalRest;
varying vec3 vNormalView;
varying vec3 vViewPos;

float poly(vec3 c, float d) { return c.x + c.y * d + c.z * d * d; }

vec4 photo(vec2 q) {
  vec2 uv = vec2(q.x, 1.0 - q.y);
  return vec4(texture2D(uMap, uv).rgb, texture2D(uMatte, uv).r);
}

// Upper eyelid slides down over the eye: the lid skin between the glasses
// frame and the lash line is stretched down to the moving lid edge.
vec2 blinkWarp(vec2 q, vec4 eye, vec3 up, vec3 lo, inout float lash) {
  float d = (q.x - eye.x) / eye.z;
  float fx = 1.0 - smoothstep(0.8, 1.25, abs(d));
  if (fx <= 0.0 || uBlink <= 0.001) return q;
  float dd = clamp(d, -1.0, 1.0);
  float yu = poly(up, dd);
  float yb = poly(lo, dd);
  float h = max(yb - yu, 0.0);
  float ye = yu + uBlink * fx * (h + 0.0015);
  float top = max(yu - 1.1 * h - 0.004, eye.w + 0.0035);
  top = min(top, yu - 0.002);
  if (q.y < top || q.y > ye) return q;
  float s = (q.y - top) / max(ye - top, 1e-5);
  lash = max(lash, uBlink * fx * (1.0 - smoothstep(0.0, 0.003, ye - q.y)));
  return vec2(q.x, top + (yu - top) * s);
}

// Returns where to sample the photo; 'inside' is the open-mouth coverage.
vec2 mouthWarp(vec2 q, out float inside, out vec3 innerCol, out float lipShade) {
  inside = 0.0;
  innerCol = vec3(0.0);
  lipShade = 1.0;
  vec2 c = uMouthC;
  float hw = uMouthHW;
  vec2 p = q;

  // smile: lift the corners up and out
  float r2 = hw * hw * 0.36;
  float gl = exp(-dot(q - uCornerL, q - uCornerL) / r2);
  float gr = exp(-dot(q - uCornerR, q - uCornerR) / r2);
  p += uSmile * 0.0045 * (gl * vec2(0.3, 1.0) + gr * vec2(-0.3, 1.0));

  // spread / round the lips
  float s = 1.0 + 0.085 * uWide;
  float mreg = 1.0 - smoothstep(0.45, 1.0, length(vec2((p.x - c.x) / (hw * 1.9), (p.y - c.y) / 0.065)));
  p.x = c.x + (p.x - c.x) / mix(1.0, s, mreg);

  // jaw: the lower lip, beard and chin drop; the upper lip lifts a little
  float D = uOpen * uMaxOpen;
  float d = (p.x - c.x) / (hw * 0.96);
  float lens = pow(max(0.0, 1.0 - d * d), 0.7);   // opening tapers into the corners
  float jaw = 1.0 - smoothstep(0.55, 1.2, abs(p.x - c.x) / uJawHW);
  float yl = poly(uLip, clamp((p.x - c.x) / hw, -1.3, 1.3));
  float Dl = D * lens;
  float Du = 0.2 * D * lens;
  float Dj = 0.9 * D * jaw;
  float gapTop = yl - Du;
  float gapBot = yl + Dl;
  float y = p.y;

  if (y < gapTop) {
    p.y = y + Du * smoothstep(uNoseY, yl, y);
  } else if (y > gapBot) {
    float t = smoothstep(yl, uLowerY + 0.015, y - Dl);
    float L = mix(Dl, Dj, t);
    L *= 1.0 - smoothstep(uChinY - 0.01, uChinY + 0.075, y - L);
    p.y = y - L;
  } else {
    p.y = yl;
  }

  float gh = gapBot - gapTop;
  // inner edges of the lips darken as they part
  float near = max(1.0 - smoothstep(0.0, 0.004, gapTop - y), 1.0 - smoothstep(0.0, 0.005, y - gapBot));
  lipShade = 1.0 - 0.2 * near * lens * smoothstep(0.05, 0.4, uOpen);
  if (gh > 1e-5) {
    // soft, slightly wet lip edges rather than a cut-out
    float aa = max(fwidth(q.y), 0.0011);
    inside = smoothstep(gapTop - aa, gapTop + aa, y) * (1.0 - smoothstep(gapBot - aa, gapBot + aa, y));
    inside *= smoothstep(0.0, 2.0 * aa, gh);

    float tt = clamp((y - gapTop) / gh, 0.0, 1.0);
    float deep = smoothstep(0.15, 0.85, lens) * (1.0 - abs(tt - 0.45) * 1.2);
    vec3 col = mix(vec3(0.26, 0.085, 0.085), vec3(0.045, 0.012, 0.016), clamp(deep, 0.0, 1.0));
    // upper teeth: shadowed by the lip, catching light at the biting edge,
    // falling into shadow towards the corners
    float teethH = min(0.0055, gh * 0.42) * smoothstep(0.3, 0.8, lens) * (0.55 + 0.45 * lens);
    float ty = (y - gapTop) / max(teethH, 1e-5);
    float teeth = (1.0 - smoothstep(0.7, 1.0, ty)) * smoothstep(0.1, 0.35, uOpen);
    float k = (p.x - c.x) / (hw * 0.23);
    float gaps = 1.0 - 0.12 * (1.0 - smoothstep(0.0, 0.25, abs(sin(k * 3.14159 * (1.0 - 0.08 * abs(k))))));
    vec3 teethCol = vec3(0.64, 0.60, 0.54) * gaps
      * (0.35 + 0.65 * smoothstep(0.35, 0.95, lens))
      * (0.62 + 0.38 * smoothstep(0.0, 0.9, ty));
    col = mix(col, teethCol, teeth);
    // tongue resting low in the mouth
    float tongueTop = gapBot - gh * 0.36;
    float tongue = smoothstep(tongueTop, tongueTop + gh * 0.3, y) * smoothstep(0.35, 0.8, uOpen);
    col = mix(col, vec3(0.42, 0.16, 0.16) * (0.45 + 0.55 * lens), tongue * 0.75);
    // the lips shade the opening
    col *= mix(0.6, 1.0, smoothstep(0.0, 0.3, tt)) * mix(0.6, 1.0, smoothstep(0.0, 0.2, 1.0 - tt));
    innerCol = col;
  }
  return p;
}

void main() {
  vec2 q = vec2(vUv.x, 1.0 - vUv.y);

  float lash = 0.0;
  vec2 p = blinkWarp(q, uEyeA, uEyeAUp, uEyeALo, lash);
  p = blinkWarp(p, uEyeB, uEyeBUp, uEyeBLo, lash);

  float inside;
  float lipShade;
  vec3 innerCol;
  p = mouthWarp(p, inside, innerCol, lipShade);

  vec4 s = photo(p);
  vec3 col = s.rgb * (1.0 - 0.18 * lash) * lipShade;
  col = mix(col, innerCol, inside);

  // Relight relative to the photo's own lighting: when the head turns or
  // the light moves, surfaces facing away darken and those facing it brighten.
  float now = 0.42 + 0.58 * max(dot(normalize(vNormalNow), uLight), 0.0);
  float rest = 0.42 + 0.58 * max(dot(normalize(vNormalRest), uLightRest), 0.0);
  col *= mix(1.0, clamp(now / rest, 0.65, 1.35), uRelight);

  float rim = pow(1.0 - clamp(dot(normalize(vNormalView), normalize(-vViewPos)), 0.0, 1.0), 3.0);
  col += uRimColor * rim * uRim;

  float a = s.a * (1.0 - smoothstep(uFade, 1.0, q.y));
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}
`;
