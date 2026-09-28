import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders.js';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function decodeBase64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Critically damped spring towards a target (stable for any dt).
function spring(state, target, omega, dt) {
  const x = state.x - target;
  const exp = Math.exp(-omega * dt);
  const nx = (x + (state.v + omega * x) * dt) * exp;
  state.v = (state.v - omega * (state.v + omega * x) * dt) * exp;
  state.x = target + nx;
  return state.x;
}

/**
 * Photo-real 2.5D head: the portrait is projected onto a dense mesh shaped by
 * a depth map reconstructed from the photo, so it can turn, nod, breathe,
 * blink and talk with real parallax and relighting.
 */
export class AvatarRenderer {
  constructor(container, { assets = './assets/', name = 'ajit' } = {}) {
    this.container = container;
    this.assets = assets.endsWith('/') ? assets : `${assets}/`;
    this.name = name;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.mouth = { open: { x: 0, v: 0 }, wide: { x: 0, v: 0 }, smile: { x: 0, v: 0 } };
    this.talk = { x: 0, v: 0 };
    this.nod = { x: 0, v: 0 };
    this.look = { x: 0, y: 0, sx: 0, sy: 0 };
    this.blink = { next: 1.5, start: -1, count: 1 };
    /** Called every frame with the time in ms; returns {open, wide, smile, talking}. */
    this.driver = null;
    /** Overrides for testing, e.g. { open: 1, yaw: 0.2 }. */
    this.debug = {};
    this.time = 0;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.m4 = new THREE.Matrix4();
  }

  async load(onProgress = () => {}) {
    let done = 0;
    const step = (v) => { done += 1; onProgress(done / 3); return v; };
    const texLoader = new THREE.TextureLoader();
    const tex = (file) => texLoader.loadAsync(this.assets + file).then(step);
    const [data, map, matte] = await Promise.all([
      fetch(`${this.assets}${this.name}-avatar.json`).then((r) => {
        if (!r.ok) throw new Error(`Could not load avatar data (${r.status})`);
        return r.json();
      }).then(step),
      tex(`${this.name}-albedo.jpg`),
      tex(`${this.name}-matte.png`),
    ]);
    this.data = data;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;
    this.container.appendChild(renderer.domElement);

    for (const t of [map, matte]) {
      t.colorSpace = THREE.NoColorSpace;   // shader outputs photo colours untouched
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      t.minFilter = THREE.LinearMipmapLinearFilter;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(16, 1, 0.1, 100);
    this.mesh = new THREE.Mesh(this.buildGeometry(data), this.buildMaterial(data, map, matte));
    this.scene.add(this.mesh);

    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(this.container);
    this.fit();
    return this;
  }

  buildGeometry(data) {
    const { size: n, depthMin, depthMax } = data.grid;
    const depth = new Uint16Array(decodeBase64(data.grid.depth).buffer);
    const rot = decodeBase64(data.grid.rotation);
    const { width: W, height: H } = data.image;
    const unit = 2 / W;                       // image width spans 2 world units
    const aspect = H / W;

    const pos = new Float32Array(n * n * 3);
    const uv = new Float32Array(n * n * 2);
    const aRot = new Float32Array(n * n);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        const u = i / (n - 1);
        const v = j / (n - 1);
        pos[k * 3] = u * 2 - 1;
        pos[k * 3 + 1] = (1 - v * 2) * aspect;
        pos[k * 3 + 2] = (depthMin + (depth[k] / 65535) * (depthMax - depthMin)) * unit;
        uv[k * 2] = u;
        uv[k * 2 + 1] = 1 - v;
        aRot[k] = rot[k] / 255;
      }
    }
    const index = new Uint32Array((n - 1) * (n - 1) * 6);
    let o = 0;
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const a = j * n + i;
        const b = a + 1;
        const c = a + n;
        const d = c + 1;
        index.set([a, c, b, b, c, d], o);
        o += 6;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('aRot', new THREE.BufferAttribute(aRot, 1));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.computeVertexNormals();
    return geo;
  }

  buildMaterial(data, map, matte) {
    const f = data.features;
    const { width: W, height: H } = data.image;
    const m = f.mouth;
    const eye = (e) => new THREE.Vector4(e.center[0], e.center[1], e.halfWidth, e.frameY);
    const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    this.lightRest = new THREE.Vector3(-0.3, 0.35, 0.89).normalize();

    this.uniforms = {
      uMap: { value: map },
      uMatte: { value: matte },
      uDepthScale: { value: 1.0 },
      uPivot: { value: new THREE.Vector3(data.pivot.x * 2 - 1, (1 - data.pivot.y * 2) * (H / W), data.pivot.z * (2 / W)) },
      uHeadRot: { value: new THREE.Matrix3() },
      uHeadShift: { value: new THREE.Vector3() },
      uBreath: { value: 0 },

      uOpen: { value: 0 },
      uWide: { value: 0 },
      uSmile: { value: 0 },
      uBlink: { value: 0 },
      uMaxOpen: { value: 0.021 },

      uMouthC: { value: new THREE.Vector2(...m.center) },
      uMouthHW: { value: m.halfWidth },
      uLip: { value: v3(m.lipLine) },
      uCornerL: { value: new THREE.Vector2(...m.cornerL) },
      uCornerR: { value: new THREE.Vector2(...m.cornerR) },
      uNoseY: { value: m.noseBase[1] },
      uLowerY: { value: m.lowerOuter[1] },
      uChinY: { value: m.chin[1] },
      uJawHW: { value: m.jawHalfWidth },

      uEyeA: { value: eye(f.eyeA) },
      uEyeAUp: { value: v3(f.eyeA.upper) },
      uEyeALo: { value: v3(f.eyeA.lower) },
      uEyeB: { value: eye(f.eyeB) },
      uEyeBUp: { value: v3(f.eyeB.upper) },
      uEyeBLo: { value: v3(f.eyeB.lower) },

      uLightRest: { value: this.lightRest.clone() },
      uLight: { value: this.lightRest.clone() },
      uRelight: { value: 0.6 },
      uRimColor: { value: new THREE.Color(0.55, 0.68, 0.9) },
      uRim: { value: 0.07 },
      uFade: { value: 0.9 },
    };
    return new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });
  }

  /** Frame head and shoulders to the container, whatever its shape. */
  fit() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const halfH = 0.95;
    const halfW = 0.66;   // narrow screens may crop the shoulders, never the head
    this.distance = Math.max(halfH / t, halfW / (t * this.camera.aspect));
    this.target = new THREE.Vector3(0, 0.03, 0);
    this.camera.updateProjectionMatrix();
  }

  /** Pointer position over the page, -1..1 (y up). The head follows it. */
  setLook(x, y) {
    this.look.x = clamp(x, -1, 1);
    this.look.y = clamp(y, -1, 1);
  }

  /** A little nod, e.g. on a stressed word. */
  emphasize(strength = 1) {
    if (this.reducedMotion) strength *= 0.4;
    this.nod.v += 0.22 * strength;
  }

  blinkValue(t) {
    const b = this.blink;
    const dur = 0.17;
    const gap = 0.06;
    if (b.start < 0) {
      if (t < b.next) return 0;
      b.start = t;
      b.count = Math.random() < 0.15 ? 2 : 1;   // the odd double blink
    }
    let ph = t - b.start;
    if (ph >= b.count * dur + (b.count - 1) * gap) {
      b.start = -1;
      b.next = t + 1.8 + Math.random() * 4.2;
      return 0;
    }
    ph %= dur + gap;
    if (ph > dur) return 0;
    // quick close, short hold, slower open
    if (ph < 0.06) return Math.sin((ph / 0.06) * (Math.PI / 2)) ** 2;
    if (ph < 0.08) return 1;
    return 1 - ((ph - 0.08) / 0.09) ** 0.8;
  }

  update(dt, nowMs) {
    const t = (this.time += dt);
    const d = this.debug;
    const drive = this.driver?.(nowMs) ?? {};
    const talking = drive.talking ? 1 : 0;

    spring(this.talk, talking, 4, dt);
    spring(this.mouth.open, d.open ?? drive.open ?? 0, 34, dt);
    spring(this.mouth.wide, d.wide ?? drive.wide ?? 0, 26, dt);
    spring(this.mouth.smile, d.smile ?? drive.smile ?? 0, 5, dt);

    const k = 1 - Math.exp(-dt * 2.5);
    this.look.sx += (this.look.x - this.look.sx) * k;
    this.look.sy += (this.look.y - this.look.sy) * k;
    // nod spring (pitch impulse decays back to 0)
    this.nod.v += (-60 * this.nod.x - 11 * this.nod.v) * dt;
    this.nod.x += this.nod.v * dt;

    const idle = this.reducedMotion ? 0.3 : 1;
    const tk = this.talk.x * idle;
    const lx = this.look.sx;
    const ly = this.look.sy;
    const yaw = d.yaw ?? (lx * 0.2 + idle * (0.03 * Math.sin(0.37 * t) + 0.018 * Math.sin(0.91 * t + 1.3))
      + tk * (0.022 * Math.sin(1.7 * t + 0.4) + 0.012 * Math.sin(2.9 * t)));
    const pitch = d.pitch ?? (-ly * 0.1 + idle * 0.016 * Math.sin(0.29 * t + 0.5)
      + tk * 0.016 * Math.sin(2.3 * t + 1) + this.nod.x);
    const roll = d.roll ?? (idle * 0.01 * Math.sin(0.23 * t + 2) + tk * 0.01 * Math.sin(1.3 * t + 2.2) - lx * 0.02);

    this.euler.set(pitch, yaw, roll);
    const u = this.uniforms;
    u.uHeadRot.value.setFromMatrix4(this.m4.makeRotationFromEuler(this.euler));
    u.uHeadShift.value.set(0, -0.004 * this.nod.x, 0);
    u.uBreath.value = (this.reducedMotion ? 0.002 : 0.005) * Math.sin((TAU * t) / 4.4);
    u.uOpen.value = clamp(this.mouth.open.x, 0, 1.1);
    u.uWide.value = clamp(this.mouth.wide.x, -1, 1);
    u.uSmile.value = clamp(this.mouth.smile.x, 0, 1);
    u.uBlink.value = d.blink ?? this.blinkValue(t);
    u.uLight.value.set(this.lightRest.x + lx * 0.4, this.lightRest.y + ly * 0.3, this.lightRest.z).normalize();

    // camera drifts gently with the pointer for extra parallax
    const az = lx * 0.05 + idle * 0.01 * Math.sin(0.17 * t);
    const el = ly * 0.03;
    const cam = this.camera;
    cam.position.set(
      this.target.x + this.distance * Math.sin(az) * Math.cos(el),
      this.target.y + this.distance * Math.sin(el),
      this.distance * Math.cos(az) * Math.cos(el),
    );
    cam.lookAt(this.target);
  }

  start() {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.update(dt, now);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  /** Render once at a fixed time step (used by tests / screenshots). */
  renderOnce(dt = 1 / 60) {
    this.update(dt, performance.now());
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    this.mesh?.geometry.dispose();
    this.mesh?.material.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
