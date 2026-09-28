import { mouthAt, wordToVisemes, wordUnits } from './visemes.js';

// Name fragments of common male system voices (Windows, macOS/iOS, Chrome, Android).
const MALE_HINTS = ['prabhat', 'rishi', 'ravi', 'hemant', 'madhur', 'ryan', 'guy', 'andrew', 'brian', 'christopher',
  'eric', 'roger', 'steffan', 'daniel', 'aaron', 'alex', 'arthur', 'oliver', 'fred', 'david', 'mark', 'george',
  'james', 'thomas', 'male'];

const PAUSES = { ',': 170, ';': 220, ':': 220, '—': 200, '–': 200, '.': 320, '!': 320, '?': 320 };

/** Split a sentence-ending punctuation mark followed by whitespace (not "ajit.business"). */
export function splitSentences(text) {
  const out = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if ('.!?'.includes(text[i]) && (i + 1 === text.length || /\s/.test(text[i + 1]))) {
      out.push(text.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  if (text.slice(start).trim()) out.push(text.slice(start).trim());
  return out.filter(Boolean);
}

/**
 * Words of one sentence, each with what is displayed, what the voice says
 * (after the pronunciation map), where it sits in the spoken string, and the
 * mouth shapes for it.
 */
export function prepareSentence(display, pronounce = {}) {
  const lower = Object.fromEntries(Object.entries(pronounce).map(([k, v]) => [k.toLowerCase(), v]));
  const tokens = [];
  let spoken = '';
  for (const m of display.matchAll(/\S+/g)) {
    const raw = m[0];
    const [, lead, core, trail] = raw.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    const say = pronounce[core] ?? lower[core.toLowerCase()] ?? core;
    const text = `${lead}${say}${trail}`;
    if (spoken) spoken += ' ';
    const visemes = say.split(/\s+/).flatMap((w) => (w ? wordToVisemes(w) : []));
    tokens.push({
      display: raw,
      spokenStart: spoken.length,
      visemes,
      units: wordUnits(visemes),
      pause: PAUSES[trail.slice(-1)] ?? 0,
    });
    spoken += text;
  }
  return { display, spoken, tokens };
}

/**
 * Speaks script segments with the browser's speech synthesis and exposes the
 * mouth shape to drive the avatar every frame.
 *
 * Events: 'sentence' {index, sentence}, 'word' {sentence, index, emphasis},
 *         'start' {segment}, 'end' {segment, completed}, 'fallback' {reason}
 */
export class Speaker extends EventTarget {
  constructor({ pronounce = {}, voicePreferences = [], rate = 1, pitch = 1 } = {}) {
    super();
    this.pronounce = pronounce;
    this.voicePreferences = voicePreferences;
    this.rate = rate;
    this.pitch = pitch;
    this.unitMs = 64;          // ms per viseme weight unit at rate 1, refined from boundary events
    this.voices = [];
    this.voice = null;
    this.run = null;
    this.keep = [];            // Chrome drops events of utterances that get garbage collected
    this.smileUntil = 0;
    this.synth = window.speechSynthesis ?? null;
  }

  get supported() { return !!this.synth; }
  get speaking() { return !!this.run; }

  async loadVoices() {
    if (!this.synth) return [];
    let voices = this.synth.getVoices();
    if (!voices.length) {
      voices = await new Promise((resolve) => {
        const done = () => resolve(this.synth.getVoices());
        this.synth.addEventListener('voiceschanged', done, { once: true });
        setTimeout(done, 1500);
      });
    }
    this.voices = voices.filter((v) => /^en/i.test(v.lang));
    if (!this.voice) this.voice = this.pickVoice();
    return this.voices;
  }

  pickVoice() {
    const all = this.voices;
    for (const pref of this.voicePreferences) {
      const p = pref.toLowerCase();
      const v = all.find((x) => `${x.name} ${x.lang}`.toLowerCase().includes(p));
      if (v) return v;
    }
    return all.find((v) => MALE_HINTS.some((h) => v.name.toLowerCase().includes(h)))
      ?? all.find((v) => v.default) ?? all[0] ?? null;
  }

  setVoice(name) {
    this.voice = this.voices.find((v) => v.name === name) ?? this.pickVoice();
  }

  /** Call from a click handler: iOS only allows speech started by a gesture. */
  unlock() {
    if (!this.synth || this.unlocked) return;
    this.unlocked = true;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    this.synth.speak(u);
  }

  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }

  /** Speak one segment ({text, audio?}). Resolves when it finishes or is stopped. */
  speak(segment) {
    const busy = !!this.run || !!this.synth?.speaking;
    this.stop();
    const sentences = splitSentences(segment.text).map((s) => prepareSentence(s, this.pronounce));
    return new Promise((resolve) => {
      const mode = segment.audio ? 'audio' : this.synth ? 'tts' : 'silent';
      const run = { segment, sentences, si: -1, seq: 0, mode, resolve, token: -1, lastWord: -1 };
      this.run = run;
      this.emit('start', { segment });
      if (mode === 'audio') this.playAudio(segment.audio);
      // Chrome can drop an utterance queued right after cancel(): give it a beat.
      else if (busy && mode === 'tts') run.timer = setTimeout(() => this.nextSentence(), 80);
      else this.nextSentence();
    });
  }

  stop() {
    const run = this.run;
    if (!run) return;
    this.run = null;
    clearTimeout(run.timer);
    clearTimeout(run.watchdog);
    if (run.mode === 'tts') this.synth.cancel();
    if (run.audio) run.audio.pause();
    this.keep = [];
    run.resolve(false);
    this.emit('end', { segment: run.segment, completed: false });
  }

  finish() {
    const run = this.run;
    this.run = null;
    this.keep = [];
    this.smileUntil = performance.now() + 1600;
    run.resolve(true);
    this.emit('end', { segment: run.segment, completed: true });
  }

  estimate(sentence) {
    let t = 0;
    for (const tok of sentence.tokens) {
      tok.t0 = t;
      tok.dur = Math.max(140, tok.units * this.unitMs) / this.rate;
      t += tok.dur + tok.pause / this.rate;
    }
    return t;
  }

  nextSentence() {
    const run = this.run;
    if (!run) return;
    run.si += 1;
    if (run.si >= run.sentences.length) return this.finish();
    const sentence = run.sentences[run.si];
    const total = this.estimate(sentence);
    const seq = ++run.seq;
    // Events of an utterance that was replaced (e.g. after falling back to captions) are ignored.
    const live = () => this.run === run && run.seq === seq && run.mode === 'tts';
    Object.assign(run, { sentence, token: -1, lastWord: -1, boundary: false, started: false, start: performance.now() });
    this.emit('sentence', { index: run.si, sentence });

    if (run.mode === 'silent') {
      run.started = true;
      run.timer = setTimeout(() => this.nextSentence(), total + 250);
      return;
    }

    const u = new SpeechSynthesisUtterance(sentence.spoken);
    if (this.voice) { u.voice = this.voice; u.lang = this.voice.lang; }
    u.rate = this.rate;
    u.pitch = this.pitch;
    u.onstart = () => {
      if (!live()) return;
      clearTimeout(run.watchdog);
      run.started = true;
      run.start = performance.now();
    };
    u.onboundary = (e) => {
      if (!live() || (e.name && e.name !== 'word')) return;
      this.onBoundary(run, e.charIndex);
    };
    u.onend = () => {
      if (!live()) return;
      clearTimeout(run.watchdog);
      // Voices without word events: learn their pace from whole sentences.
      if (!run.boundary && run.started && total > 0) {
        const ratio = Math.min(1.6, Math.max(0.6, (performance.now() - run.start) / total));
        this.unitMs = Math.min(110, Math.max(40, this.unitMs * ratio ** 0.6));
      }
      run.timer = setTimeout(() => this.nextSentence(), 90);
    };
    u.onerror = (e) => {
      if (!live() || e.error === 'interrupted' || e.error === 'canceled') return;
      this.fallback(run, e.error || 'speech error');
    };
    this.keep.push(u);
    this.synth.speak(u);
    // No voice output (no voices installed, blocked autoplay...): keep the
    // avatar talking with captions so the page still works.
    run.watchdog = setTimeout(() => {
      if (live() && !run.started) this.fallback(run, 'no speech output');
    }, this.voices.length ? 2500 : 1200);
  }

  fallback(run, reason) {
    if (this.run !== run) return;
    this.synth?.cancel();
    run.mode = 'silent';
    this.emit('fallback', { reason });
    run.si -= 1;
    this.nextSentence();
  }

  onBoundary(run, charIndex) {
    const toks = run.sentence.tokens;
    let idx = 0;
    while (idx + 1 < toks.length && toks[idx + 1].spokenStart <= charIndex) idx += 1;
    const now = performance.now();
    if (run.boundary && idx === run.token + 1 && run.tokenAt) {
      const prev = toks[run.token];
      const measured = now - run.tokenAt - prev.pause / this.rate;
      if (measured > 80 && measured < 2500 && prev.units > 0) {
        this.unitMs = this.unitMs * 0.75 + ((measured * this.rate) / prev.units) * 0.25;
        this.unitMs = Math.min(110, Math.max(40, this.unitMs));
      }
    }
    run.boundary = true;
    run.token = idx;
    run.tokenAt = now;
  }

  playAudio(src) {
    const run = this.run;
    const audio = new Audio(src);
    audio.crossOrigin = 'anonymous';
    run.audio = audio;
    try {
      this.ctx ??= new AudioContext();
      const node = this.ctx.createMediaElementSource(audio);
      run.analyser = this.ctx.createAnalyser();
      run.analyser.fftSize = 1024;
      node.connect(run.analyser);
      run.analyser.connect(this.ctx.destination);
      run.buf = new Float32Array(run.analyser.fftSize);
      run.freq = new Uint8Array(run.analyser.frequencyBinCount);
      this.ctx.resume();
    } catch { /* plays without analysis */ }
    // Captions follow the audio proportionally to the words' lengths.
    const all = run.sentences.flatMap((s, si) => s.tokens.map((t, ti) => ({ t, si, ti })));
    let acc = 0;
    for (const x of all) { x.a = acc; acc += x.t.units + x.t.pause / 60; }
    run.flat = all;
    run.flatTotal = acc;
    audio.addEventListener('ended', () => { if (this.run === run) this.finish(); });
    audio.addEventListener('error', () => { if (this.run === run) { run.mode = 'silent'; run.si = -1; this.nextSentence(); } });
    audio.play().catch(() => { if (this.run === run) { run.mode = 'silent'; run.si = -1; this.nextSentence(); } });
  }

  wordChanged(run, si, index) {
    const tok = run.sentences[si].tokens[index];
    const prev = run.sentences[si].tokens[index - 1];
    const emphasis = tok.units >= 6 || (prev && prev.pause > 0) || (index > 0 && /^[A-Z]/.test(tok.display));
    this.emit('word', { sentence: si, index, emphasis });
  }

  /** Mouth + talking state for this frame. */
  sample(now = performance.now()) {
    const run = this.run;
    const smile = now < this.smileUntil ? 0.55 : 0;
    if (!run) return { open: 0, wide: 0, smile, talking: false };

    if (run.mode === 'audio') return this.sampleAudio(run);
    if (!run.started || !run.sentence) return { open: 0, wide: 0, smile: 0, talking: true };

    const toks = run.sentence.tokens;
    let idx;
    let progress;
    if (run.boundary) {
      idx = run.token;
      progress = (now - run.tokenAt) / toks[idx].dur;
    } else {
      const t = now - run.start;
      idx = 0;
      while (idx + 1 < toks.length && toks[idx + 1].t0 <= t) idx += 1;
      progress = (t - toks[idx].t0) / toks[idx].dur;
    }
    if (idx !== run.lastWord) {
      run.lastWord = idx;
      this.wordChanged(run, run.si, idx);
    }
    const m = mouthAt(toks[idx].visemes, progress);
    return { open: m.open, wide: m.wide, smile: 0, talking: true };
  }

  sampleAudio(run) {
    const a = run.audio;
    let open = 0;
    let wide = 0;
    if (run.analyser && !a.paused) {
      run.analyser.getFloatTimeDomainData(run.buf);
      let sum = 0;
      for (const v of run.buf) sum += v * v;
      const rms = Math.sqrt(sum / run.buf.length);
      open = Math.min(1, Math.max(0, (rms - 0.012) * 7)) ** 0.85;
      run.analyser.getByteFrequencyData(run.freq);
      const bin = this.ctx.sampleRate / run.analyser.fftSize;
      const band = (lo, hi) => {
        let s = 0; let n = 0;
        for (let i = Math.floor(lo / bin); i < Math.min(run.freq.length, hi / bin); i++) { s += run.freq[i]; n++; }
        return n ? s / n : 0;
      };
      const low = band(250, 1000);
      const high = band(2000, 5000);
      wide = low > 1 ? Math.max(-0.6, Math.min(0.6, (high / low - 0.35) * 2)) : 0;
    }
    if (a.duration && run.flat.length) {
      const pos = (a.currentTime / a.duration) * run.flatTotal;
      let k = 0;
      while (k + 1 < run.flat.length && run.flat[k + 1].a <= pos) k += 1;
      const { si, ti } = run.flat[k];
      if (si !== run.si) {
        run.si = si;
        run.sentence = run.sentences[si];
        run.lastWord = -1;
        this.emit('sentence', { index: si, sentence: run.sentence });
      }
      if (ti !== run.lastWord) {
        run.lastWord = ti;
        this.wordChanged(run, si, ti);
      }
    }
    return { open, wide, smile: 0, talking: true };
  }
}
