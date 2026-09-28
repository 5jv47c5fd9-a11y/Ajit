import { AvatarRenderer } from './avatar-renderer.js';
import { Speaker } from './speech.js';
import { PROFILE, PRONOUNCE, SEGMENTS, VOICE } from './script.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
if (params.has('embed')) document.documentElement.classList.add('embed');

const stage = $('stage');
const els = {
  view: $('view'), loader: $('loader'), loaderText: $('loaderText'), play: $('play'), captions: $('captions'),
  notice: $('notice'), topics: $('topics'), stop: $('stop'), voice: $('voice'), photo: $('fallbackPhoto'),
};

$('headline').textContent = PROFILE.headline;
$('lede').textContent = PROFILE.lede;
for (const a of document.querySelectorAll('[data-site-link]')) a.href = PROFILE.url;

const assets = new URL('../assets/', import.meta.url).href;
const avatar = new AvatarRenderer(els.view, { assets, name: 'ajit' });
const speaker = new Speaker({ pronounce: PRONOUNCE, voicePreferences: VOICE.preferences, rate: VOICE.rate, pitch: VOICE.pitch });
avatar.driver = (now) => speaker.sample(now);
Object.assign(window, { avatar, speaker });   // handy from the console

// ── topics ──────────────────────────────────────────────────────────────────
const chips = SEGMENTS.map((seg) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = seg.label;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => play(seg));
  els.topics.append(b);
  return b;
});

// ── captions ────────────────────────────────────────────────────────────────
let words = [];
speaker.addEventListener('sentence', ({ detail }) => {
  els.captions.replaceChildren(...detail.sentence.tokens.map((t) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = `${t.display} `;
    return s;
  }));
  words = [...els.captions.children];
  els.captions.classList.add('show');
});
speaker.addEventListener('word', ({ detail }) => {
  words.forEach((w, i) => {
    w.classList.toggle('said', i < detail.index);
    w.classList.toggle('now', i === detail.index);
  });
  if (detail.emphasis && Math.random() < 0.7) avatar.emphasize(0.6 + Math.random() * 0.5);
});
function notify(text, ms = 6000) {
  els.notice.textContent = text;
  els.notice.hidden = false;
  clearTimeout(notify.timer);
  if (ms) notify.timer = setTimeout(() => { els.notice.hidden = true; }, ms);
}
speaker.addEventListener('fallback', () => notify('No voice available in this browser, showing captions instead.'));

// ── playback ────────────────────────────────────────────────────────────────
function setActive(seg) {
  chips.forEach((c, i) => c.setAttribute('aria-pressed', String(SEGMENTS[i] === seg)));
  stage.classList.toggle('talking', !!seg);
  els.stop.disabled = !seg;
  els.play.hidden = !!seg;
}

async function play(seg) {
  speaker.unlock();
  if (speaker.voices.length === 0) await speaker.loadVoices();
  setActive(seg);
  const completed = await speaker.speak(seg);
  if (speaker.speaking) return;             // another segment took over
  setActive(null);
  els.captions.classList.remove('show');
  if (completed) {
    const next = SEGMENTS[SEGMENTS.indexOf(seg) + 1];
    els.play.querySelector('span').textContent = next ? `Next: ${next.label}` : 'Hear it again';
    els.play.onclick = () => play(next ?? SEGMENTS[0]);
  }
}

els.play.onclick = () => play(SEGMENTS[0]);
els.stop.addEventListener('click', () => speaker.stop());

// ── voices ──────────────────────────────────────────────────────────────────
const VOICE_KEY = 'ajit-avatar-voice';
function listVoices() {
  const voices = speaker.voices;
  els.voice.replaceChildren(...voices.map((v) => new Option(`${v.name} (${v.lang})`, v.name, false, v.name === speaker.voice?.name)));
  els.voice.closest('label').hidden = voices.length === 0;
}
async function initVoices() {
  if (!speaker.supported) {
    els.voice.closest('label').hidden = true;
    return;
  }
  let saved = null;
  try { saved = localStorage.getItem(VOICE_KEY); } catch { /* storage blocked */ }
  await speaker.loadVoices();
  if (saved) speaker.setVoice(saved);
  listVoices();
  // Some browsers only list their voices a while after page load.
  speechSynthesis.addEventListener('voiceschanged', async () => {
    const hadVoice = !!speaker.voice;
    await speaker.loadVoices();
    if (!hadVoice && saved) speaker.setVoice(saved);
    listVoices();
  });
  els.voice.addEventListener('change', () => {
    speaker.setVoice(els.voice.value);
    try { localStorage.setItem(VOICE_KEY, els.voice.value); } catch { /* storage blocked */ }
  });
}

// ── pointer: the head follows the visitor ───────────────────────────────────
window.addEventListener('pointermove', (e) => {
  const r = stage.getBoundingClientRect();
  const x = (e.clientX - (r.left + r.width / 2)) / (r.width * 0.75);
  const y = -(e.clientY - (r.top + r.height * 0.4)) / (r.height * 0.75);
  avatar.setLook(x, y);
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => avatar.setLook(0, 0));

// ── boot ────────────────────────────────────────────────────────────────────
avatar.load((p) => { els.loaderText.textContent = `Building 3D avatar… ${Math.round(p * 100)}%`; })
  .then(() => {
    avatar.start();
    stage.classList.add('ready');
    els.loader.hidden = true;
    els.play.hidden = false;
  })
  .catch((err) => {
    console.error(err);
    els.loader.hidden = true;
    els.play.hidden = false;
    showPhoto().catch(() => {});
    notify('3D is not available on this device, so here is the photo version.', 0);
  });

// Without WebGL: the cut-out portrait (texture + matte composited in 2D).
async function showPhoto() {
  const load = (src) => new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });
  const [photo, matte] = await Promise.all([load(`${assets}ajit-albedo.jpg`), load(`${assets}ajit-matte.png`)]);
  const c = els.photo;
  c.width = photo.naturalWidth;
  c.height = photo.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(matte, 0, 0);
  const a = g.getImageData(0, 0, c.width, c.height).data;
  g.drawImage(photo, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  for (let i = 3; i < a.length; i += 4) img.data[i] = a[i - 3];
  g.putImageData(img, 0, 0);
  c.hidden = false;
}
initVoices();
