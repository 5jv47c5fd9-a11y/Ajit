// Text -> mouth shapes. Browser speech synthesis does not expose its audio,
// so the lips are driven from the words being spoken: each word becomes a
// short sequence of visemes (open = jaw, wide = spread vs rounded lips) that
// is played over the time the voice spends on that word.

export const SHAPES = {
  rest: { open: 0.0, wide: 0.0 },
  PP: { open: 0.0, wide: -0.1 },   // p b m: lips pressed
  FF: { open: 0.1, wide: 0.15 },   // f v
  TH: { open: 0.2, wide: 0.1 },
  DD: { open: 0.24, wide: 0.15 },  // t d n l
  KK: { open: 0.32, wide: 0.05 },  // k g ng
  CH: { open: 0.22, wide: -0.45 }, // ch j sh
  SS: { open: 0.12, wide: 0.4 },   // s z
  RR: { open: 0.24, wide: -0.4 },
  AA: { open: 0.9, wide: 0.15 },
  E: { open: 0.55, wide: 0.5 },
  I: { open: 0.38, wide: 0.6 },
  O: { open: 0.7, wide: -0.6 },
  U: { open: 0.32, wide: -0.9 },
};

const VOWEL_WEIGHT = 1.5;
const CONSONANT_WEIGHT = 0.8;
const VOWELS = new Set(['AA', 'E', 'I', 'O', 'U']);

const MULTI = [
  ['tion', ['CH', 'U', 'DD']], ['sion', ['CH', 'U', 'DD']], ['ough', ['O']], ['augh', ['O']],
  ['igh', ['AA', 'I']], ['th', ['TH']], ['sh', ['CH']], ['ch', ['CH']], ['ph', ['FF']],
  ['wh', ['U']], ['ng', ['KK']], ['ck', ['KK']], ['qu', ['KK', 'U']], ['gh', []],
  ['oo', ['U']], ['ee', ['I']], ['ea', ['I']], ['ie', ['I']], ['ou', ['AA', 'U']],
  ['ow', ['O', 'U']], ['ai', ['E']], ['ay', ['E', 'I']], ['ei', ['E']], ['oa', ['O']],
  ['au', ['O']], ['aw', ['O']], ['oi', ['O', 'I']], ['oy', ['O', 'I']], ['ew', ['U']],
];

const SINGLE = {
  a: 'AA', e: 'E', i: 'I', o: 'O', u: 'AA', y: 'I',
  b: 'PP', m: 'PP', p: 'PP', f: 'FF', v: 'FF',
  d: 'DD', t: 'DD', n: 'DD', l: 'DD',
  k: 'KK', g: 'KK', c: 'KK', q: 'KK', x: 'KK', h: 'KK',
  s: 'SS', z: 'SS', j: 'CH', r: 'RR', w: 'U',
};

const DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** @returns {{shape: string, weight: number}[]} */
export function wordToVisemes(word) {
  let w = word.toLowerCase().replace(/\d/g, (d) => DIGITS[+d]).replace(/[^a-z]/g, '');
  if (w.length > 3 && w.endsWith('e') && !/[aeiou]e$/.test(w)) w = w.slice(0, -1);   // silent e
  const out = [];
  const push = (shape) => {
    if (out.length && out[out.length - 1].shape === shape) return;
    out.push({ shape, weight: VOWELS.has(shape) ? VOWEL_WEIGHT : CONSONANT_WEIGHT });
  };
  for (let i = 0; i < w.length;) {
    const hit = MULTI.find(([g]) => w.startsWith(g, i));
    if (hit) {
      hit[1].forEach(push);
      i += hit[0].length;
    } else {
      if (SINGLE[w[i]]) push(SINGLE[w[i]]);
      i += 1;
    }
  }
  if (!out.length) push('E');
  return out;
}

/** Relative length of a word, in viseme weight units. */
export const wordUnits = (visemes) => visemes.reduce((s, v) => s + v.weight, 0);

/**
 * Mouth shape at `progress` (0..1) through a word, blending neighbouring
 * visemes for coarticulation. Closes towards rest at the very end.
 */
export function mouthAt(visemes, progress) {
  if (!visemes.length || progress >= 1) return SHAPES.rest;
  const total = wordUnits(visemes);
  let pos = Math.max(0, progress) * total;
  let i = 0;
  while (i < visemes.length - 1 && pos > visemes[i].weight) {
    pos -= visemes[i].weight;
    i += 1;
  }
  const f = Math.min(1, pos / visemes[i].weight);
  const a = SHAPES[visemes[i].shape];
  const b = SHAPES[(visemes[i + 1] ?? { shape: 'rest' }).shape];
  const blend = f > 0.6 ? (f - 0.6) / 0.4 : 0;
  const s = blend * blend * (3 - 2 * blend);
  return { open: a.open + (b.open - a.open) * s, wide: a.wide + (b.wide - a.wide) * s };
}
