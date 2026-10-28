'use strict';
/*
 * Trivora launch film — deterministic timeline.
 * Every visual is a pure function of time t (seconds). render.mjs calls
 * window.renderFrame(t) for each frame and screenshots the stage.
 */

// ---------------------------------------------------------------- utils
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  lin: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  // gentle iOS-like spring, ~1.5% overshoot
  spring: (t) => (t >= 1 ? 1 : 1 - Math.exp(-9 * t) * Math.cos(6 * t)),
  back: (t) => { const c1 = 1.3, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const P = (t, a, b, e = E.inOut) => e(clamp((t - a) / (b - a)));
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return lerp(v0, v1, (e || E.inOut)((t - t0) / (t1 - t0)));
    }
  }
  return keys[keys.length - 1][1];
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(a, b, k) {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
}
function show(el, on) {
  if (el._d === undefined) {
    const d = getComputedStyle(el).display;
    el._d = d === 'none' ? 'block' : d;
  }
  const v = on ? el._d : 'none';
  if (el.style.display !== v) el.style.display = v;
}
const f2 = (v) => v.toFixed(2);
const blur = (px) => (px > 0.05 ? `blur(${f2(px)}px)` : 'none');

// ---------------------------------------------------------------- glyphs
const svg = (p, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I = {
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="3.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  plans: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6 15h4"/>',
  team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17.5 14.6c2.2.3 3.6 2 4 4.4"/>',
  sales: '<path d="M5.5 20v-6M12 20V5M18.5 20v-10"/>',
  home: '<path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
  pass: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevR: '<path d="M9 5.5 15.5 12 9 18.5"/>',
  chevL: '<path d="M15 5.5 8.5 12 15 18.5"/>',
  key: '<circle cx="8" cy="15" r="4.2"/><path d="M11 12 20 3M16.5 6.5l3 3M14 9l2 2"/>',
  check: '<path d="M5 12.5 9.5 17 19 7.5"/>',
  share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  repeat: '<path d="M17 2.5 20.5 6 17 9.5M3.5 11V9.5a3.5 3.5 0 0 1 3.5-3.5h13.5M7 21.5 3.5 18 7 14.5M20.5 13v1.5a3.5 3.5 0 0 1-3.5 3.5H3.5"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5z"/>',
  grid: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
};
const MARK = [
  'M192 158 L350 158 C379 158 394 181 381 206 L306 300 L262 300 L326 214 L162 214 Z',
  'M213 214 L287 214 L180 381 Z',
];
let iconN = 0;
function iconSVG() {
  const id = 'i' + iconN++;
  return `<svg viewBox="0 0 540 540"><defs>
  <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#25A9F3"/><stop offset="1" stop-color="#0A70C2"/></linearGradient>
  <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".20"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="${id}c"><rect x="30" y="30" width="480" height="480" rx="108"/></clipPath></defs>
  <rect x="30" y="30" width="480" height="480" rx="108" fill="url(#${id}g)"/>
  <rect x="30" y="30" width="480" height="480" rx="108" fill="url(#${id}h)"/>
  <g fill="#fff">${MARK.map((d) => `<path d="${d}"/>`).join('')}</g>
  <g clip-path="url(#${id}c)"><rect class="sheen" x="-400" y="-200" width="180" height="940" fill="url(#${id}s)" transform="rotate(18 270 270)"/></g>
  <rect x="30.5" y="30.5" width="479" height="479" rx="107.5" fill="none" stroke="#fff" stroke-opacity=".14"/>
  </svg>`;
}
const SB = `<span>9:41</span><span class="ic">
<svg width="19" height="12" viewBox="0 0 19 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
<svg width="17" height="12" viewBox="0 0 17 12"><path d="M8.5 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.2A10.6 10.6 0 0 0 8.5.5 10.6 10.6 0 0 0 1 3.5l1.2 1.2a8.9 8.9 0 0 1 6.3-2.5zm0 3.4c1.5 0 2.9.6 4 1.6l1.2-1.2a7.3 7.3 0 0 0-10.4 0l1.2 1.2c1.1-1 2.5-1.6 4-1.6zm0 3.4c.7 0 1.3.3 1.8.7L8.5 11.5 6.7 9.7c.5-.4 1.1-.7 1.8-.7z"/></svg>
<svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="#000" stroke-opacity=".4"/><rect x="2" y="2" width="19" height="9" rx="2.5"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill-opacity=".45"/></svg></span>`;

// text helpers
const words = (s) => s.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
const line = (s, strike) => `<span class="ln">${words(s)}${strike ? '<i class="strike"></i>' : ''}</span>`;

function txt(el, t, tin, tout, o = {}) {
  const st = o.st ?? 0.06, dur = o.dur ?? 0.85, dy = o.dy ?? 0.3, bl = o.blur ?? 16, od = o.od ?? 0.42;
  if (t < tin || (tout != null && t > tout + od)) { show(el, false); return false; }
  show(el, true);
  const ws = el._w || (el._w = $$('.w', el));
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i];
    const k = P(t, tin + i * st, tin + i * st + dur, E.outQuint);
    w.style.opacity = f2(clamp(k * 1.35));
    w.style.transform = `translateY(${((1 - k) * dy).toFixed(4)}em)`;
    w.style.filter = blur((1 - k) * bl);
  }
  const ko = tout == null ? 0 : P(t, tout, tout + od, E.in);
  el.style.opacity = f2(1 - ko);
  el.style.transform = `translateY(${f2(-ko * (o.oy ?? 28))}px)`;
  el.style.filter = blur(ko * 12);
  return true;
}

// ---------------------------------------------------------------- build
const stage = $('#stage');
const extraCSS = document.createElement('style');
extraCSS.textContent = `
.ln { position: relative; display: inline-block; }
.strike { position: absolute; left: -3%; width: 106%; top: 53%; height: 0.075em; border-radius: 0.04em; background: #1497EB; transform-origin: 0 50%; transform: scaleX(0); }
`;
document.head.appendChild(extraCSS);

function H(html) { stage.insertAdjacentHTML('beforeend', html); }

// ---- 1. open
H(`<div class="layer" id="open">
  <div class="t" id="o1" style="top:716px;font-size:128px">${line('You started')}</div>
  <div class="t" id="o2" style="top:856px;font-size:128px">${line('your studio')}</div>
  <div class="t" id="o3" style="top:996px;font-size:128px">${line('to teach.')}</div>
  <div class="t" id="o4" style="top:800px;font-size:128px">${line('Not to chase')}</div>
  <div class="t" id="o5" style="top:940px;font-size:128px;color:#86868B">${line('admin.', true)}</div>
</div>`);

// ---- 2. chaos
const NOTIFS = [
  { n: 'Studio Group', m: 'Is the 7pm class full?', x: 640, y: 200, s: 0.74, r: -2, z: 45, t: 4.95 },
  { n: 'Priya', m: 'Can I move to Thursday instead?', x: 470, y: 1300, s: 0.74, r: 2.5, z: 0, t: 5.3 },
  { n: 'Rahul', m: 'Sent the payment, please check', x: 690, y: 585, s: 0.6, r: 3, z: -150, t: 5.6 },
  { n: 'Studio Group', m: "Who's teaching tomorrow morning?", x: 420, y: 110, s: 0.6, r: -3, z: -230, t: 6.25 },
  { n: 'Ananya', m: 'Do I still have classes left?', x: 330, y: 1700, s: 0.62, r: -3, z: -120, t: 6.55 },
  { n: 'Coach Dev', m: "Can't make Saturday. Anyone cover?", x: 700, y: 1830, s: 0.6, r: 2, z: -200, t: 7.1 },
  { n: 'Studio Group', m: '47 new messages', x: 640, y: 1240, s: 0.62, r: -2, z: -260, t: 7.4 },
  { n: 'Meera', m: 'Is there a waitlist for Sunday?', x: 760, y: 40, s: 0.6, r: 2, z: -300, t: 7.75 },
];
const CHAOS = NOTIFS.map((d) => ({ ...d, kind: 'n', w: 840, h: 136 }));
CHAOS.push({ kind: 'nb', x: 300, y: 430, s: 0.9, r: -9, z: 30, t: 5.85, w: 450, h: 540 });
CHAOS.push({ kind: 'sp', x: 745, y: 1540, s: 0.9, r: 6, z: 50, t: 6.85, w: 540, h: 412 });
CHAOS.sort((a, b) => a.z - b.z);
const chatIcon = `<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3.2c-5 0-9 3.4-9 7.7 0 2.4 1.3 4.6 3.4 6l-.9 3.3 3.8-2.1c.9.3 1.8.4 2.7.4 5 0 9-3.4 9-7.6S17 3.2 12 3.2z"/></svg>`;
function chaosCard(d) {
  if (d.kind === 'n') {
    return `<div class="notif chaos-c"><div class="ic">${chatIcon}</div><div class="bd"><div class="tl">${d.n}<span>now</span></div><div class="msg">${d.m}</div></div></div>`;
  }
  if (d.kind === 'nb') {
    const L = [
      ['Oct', 46, 'font-size:48px;font-weight:700'],
      ['Tue 7pm yoga — 14 ??', 108],
      ['Priya — paid? (cash)', 160],
      ['Rahul ✓  Meera ✓', 212],
      ['Sat class — who covers?', 264],
      ['Ananya: 3 left / or 2?', 316],
      ['call Dev re: Sunday', 368],
      ['waitlist → ask group', 420],
    ];
    return `<div class="notebook chaos-c">${L.map(([s, y, st]) => `<div class="hw" style="top:${y}px;${st || ''}">${s}</div>`).join('')}
      <div class="strike-hw" style="position:absolute;left:84px;top:${316 + 22}px;width:290px;height:3px;background:#2A3866;transform:rotate(-2deg)"></div>
      <div style="position:absolute;left:84px;top:${160 + 22}px;width:250px;height:3px;background:#C0392B;opacity:.8;transform:rotate(1.5deg)"></div></div>`;
  }
  const rows = [
    ['', 'A', 'B', 'C', 'D'],
    ['1', 'Name', 'Class', 'Paid', 'Left'],
    ['2', 'Priya S', 'Tue 7pm', '<span class="r">??</span>', '3'],
    ['3', 'Rahul M', 'Thu 6am', 'Yes', '8'],
    ['4', 'Ananya', 'Tue 7pm', 'cash', '<span class="r">#REF!</span>'],
    ['5', 'Meera', 'Sat', 'Yes', '1', 'y'],
    ['6', 'Karan', '—', 'no', '0'],
    ['7', 'Dev (coach)', 'Sat?', '', ''],
  ];
  return `<div class="sheetx chaos-c"><div class="bar"><i></i><i></i><i></i><b>bookings_FINAL_v3.xlsx</b></div><table>
    <colgroup><col style="width:44px"><col><col><col style="width:90px"><col style="width:84px"></colgroup>
    ${rows.map((r) => `<tr>${r.slice(0, 5).map((c, i) => `<td class="${r[5] && i > 0 ? 'y' : ''}">${c}</td>`).join('')}</tr>`).join('')}
  </table></div>`;
}
H(`<div class="layer" id="chaos">
  <div id="cards" style="position:absolute;inset:0;perspective:1800px;perspective-origin:540px 920px">${CHAOS.map(chaosCard).join('')}</div>
  <div class="t" id="c1" style="top:740px;font-size:124px">${line('Group chats.', true)}</div>
  <div class="t" id="c2" style="top:876px;font-size:124px">${line('Notebooks.', true)}</div>
  <div class="t" id="c3" style="top:1012px;font-size:124px">${line('Spreadsheets.', true)}</div>
  <div id="flash"><i></i></div>
</div>`);

// ---- 3. reveal
H(`<div class="layer" id="reveal">
  <div class="glow" id="rglow" style="left:-60px;top:220px;width:1200px;height:1200px"></div>
  <div class="appicon" id="ricon" style="left:405px;top:685px;width:270px;height:270px">${iconSVG()}</div>
  <div class="t" id="rword" style="top:968px;font-size:150px;letter-spacing:-0.03em">Trivora</div>
  <div class="t" id="r1" style="top:900px;font-size:96px">${line('Your entire studio.')}</div>
  <div class="t" id="r2" style="top:1012px;font-size:96px;color:#2AA3F2">${line('In one app.')}</div>
</div>`);

// ---- 4. features (phone + headlines)
const HL = [
  ['Create sessions.', 'In seconds.', 14.62, 17.8],
  ["When it's full,", 'waitlists kick in.', 18.1, 21.4],
  ['Repeat every week.', 'Set it once.', 21.7, 24.4],
  ['Sell memberships.', 'And credit packs.', 24.7, 28.0],
  ['Clients book', 'their own spots.', 28.3, 31.6],
  ['Every trainer.', 'Their own login.', 31.9, 34.6],
  ['Track every sale.', 'Export anytime.', 34.9, 38.4],
];

const tabbar = (on, kind = 'owner') => {
  const sets = {
    owner: [['cal', 'Schedule'], ['plans', 'Plans'], ['team', 'Team'], ['sales', 'Sales']],
    client: [['home', 'Home'], ['cal', 'Book'], ['pass', 'Passes'], ['user', 'Profile']],
    trainer: [['home', 'Today'], ['cal', 'Schedule'], ['team', 'Clients'], ['user', 'Profile']],
  };
  return `<div class="tabbar">${sets[kind].map(([ic, l], i) => `<div class="tb ${i === on ? 'on' : ''}">${svg(I[ic], 1.8)}<span>${l}</span></div>`).join('')}</div>`;
};
const week = (top, on = 1) => `<div class="week" style="top:${top}px">${['M', 'T', 'W', 'T', 'F', 'S', 'S']
  .map((d, i) => `<div class="d ${i === on ? 'on' : ''}"><small>${d}</small><b>${12 + i}</b></div>`).join('')}</div>`;
const C = { sage: '#6E9F84', clay: '#D9714A', rose: '#CF7393', sky: '#5E9BE0', sand: '#C9A35E', blue: '#1497EB' };
const card = (id, color, time, ap, title, sub, cap, p) =>
  `<div class="card" id="${id}"><div class="bar" style="background:${color}"></div>
   <div class="tm"><b>${time}</b><span>${ap}</span></div>
   <div class="inf"><b>${title}</b><span>${sub}</span></div>
   <div class="cp">${cap}${p != null ? `<i style="--p:${p};--c:${color}"></i>` : ''}</div></div>`;

const SCHED = [
  ['cNew', C.blue, '6:00', 'AM', 'Sunrise Yoga', 'Maya · 60 min', '<b>0/12</b>', 0.02],
  ['sc1', C.sage, '7:00', 'AM', 'Vinyasa Flow', 'Maya · 60 min', '<b>9/12</b>', 0.75],
  ['sc2', C.clay, '9:30', 'AM', 'Strength Club', 'Arjun · 45 min', '<span class="pill clay">Full</span>', null],
  ['sc3', C.rose, '12:15', 'PM', 'Pilates Core', 'Lena · 50 min', '<b>6/10</b>', 0.6],
  ['sc4', C.sky, '6:00', 'PM', 'Contemporary Dance', 'Kiara · 75 min', '<b>14/16</b>', 0.875],
  ['sc5', C.sand, '7:30', 'PM', '1:1 Coaching', 'Dev · 30 min', '<b>1/1</b>', 1],
];

const AVC = ['#6E9F84', '#D9714A', '#CF7393', '#5E9BE0', '#C9A35E', '#8A7FD1', '#4FA3A5', '#E0956B', '#7A9CC6', '#B98AA6', '#9AAE6B', '#5B8DB8'];
const AVN = ['PS', 'RM', 'AR', 'KD', 'MV', 'SK', 'NJ', 'TB', 'AL', 'VG', 'HP', 'DN'];

function monthPane(id, name, startIdx, days, past) {
  let cells = '';
  for (let i = 0; i < startIdx; i++) cells += '<span></span>';
  for (let d = 1; d <= days; d++) cells += `<span class="${d < past ? 'past' : ''}" data-d="${d}"><i></i><em>${d}</em></span>`;
  return `<div class="mpane" id="${id}"><div class="mh">${name}</div>
    <div class="abs" style="right:18px;top:16px;display:flex;gap:18px;color:var(--blue)">${svg(I.chevL, 2.2).replace('<svg', '<svg width="20" height="20"')}${svg(I.chevR, 2.2).replace('<svg', '<svg width="20" height="20"')}</div>
    <div class="wd">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span>${d}</span>`).join('')}</div>
    <div class="gd">${cells}</div></div>`;
}

const UI = `
<!-- Schedule (owner) -->
<div class="scr" id="sSched">
  <div class="abs cap13" style="left:20px;top:62px">TUESDAY, 13 OCTOBER</div>
  <div class="abs lt" style="left:20px;top:80px">Schedule</div>
  <div class="roundbtn acc" style="left:337px;top:84px">${svg(I.plus, 2.4)}</div>
  ${week(136)}
  <div class="abs" style="left:20px;top:216px;font-size:20px;font-weight:700;letter-spacing:-0.01em">Today</div>
  <div class="abs gray" id="schedCount" style="right:20px;top:220px;font-size:15px">5 classes</div>
  ${SCHED.map((c) => card(...c)).join('')}
  ${tabbar(0)}
</div>
<div class="dim" id="dimNew"></div>
<div class="sheet" id="sNew" style="height:791px">
  <div class="grab"></div>
  <div class="abs acc" style="left:16px;top:22px;font-size:17px">Cancel</div>
  <div class="abs" style="left:0;right:0;top:22px;text-align:center;font-size:17px;font-weight:600">New Session</div>
  <div class="abs" id="addLbl" style="right:16px;top:22px;font-size:17px;font-weight:600;color:#C7C7CC">Add</div>
  <div class="ghd" style="top:80px">DETAILS</div>
  <div class="grp" style="top:102px">
    <div class="row"><span>Class</span><span id="typeVal" style="color:#1D1D1F"></span></div>
    <div class="row"><span>Trainer</span><span class="v">Maya Iyer ${svg(I.chevR, 2.4)}</span></div>
  </div>
  <div class="ghd" style="top:226px">WHEN</div>
  <div class="grp" style="top:248px">
    <div class="row"><span>Date</span><span class="v">Tue, 13 Oct</span></div>
    <div class="row"><span>Time</span><span class="v">6:00 AM</span></div>
    <div class="row"><span>Duration</span><span class="v">60 min</span></div>
  </div>
  <div class="ghd" style="top:422px">BOOKING</div>
  <div class="grp" style="top:444px">
    <div class="row"><span>Capacity</span><span style="display:flex;align-items:center;gap:14px"><b id="capVal" style="font-weight:600;font-feature-settings:'tnum';min-width:22px;text-align:right">8</b><span class="stepper"><span>−</span><em></em><span>+</span></span></span></div>
    <div class="row"><span>Waitlist</span><span class="toggle" style="background:var(--blue)"><i style="left:22px"></i></span></div>
  </div>
  <div class="bigbtn" id="createBtn" style="top:690px">Create session</div>
</div>

<!-- Session detail -->
<div class="scr" id="sDetail">
  <div class="back">${svg(I.chevL, 2.4)}Schedule</div>
  <div class="abs" style="left:20px;top:100px"><span class="pill clay">Strength</span></div>
  <div class="abs" style="left:20px;top:128px;font-size:28px;font-weight:700;letter-spacing:-0.02em">Strength Club</div>
  <div class="abs gray" style="left:20px;top:166px;font-size:15px">Tue 13 Oct · 9:30 AM · with Arjun</div>
  <div class="abs" style="left:16px;right:16px;top:200px;height:230px;background:#fff;border-radius:20px">
    <div class="abs cap13" style="left:18px;top:18px">CAPACITY</div>
    <div class="abs" id="fullPill" style="right:16px;top:14px"><span class="pill clay">Full</span></div>
    <svg class="abs" style="left:100.5px;top:35px" width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="66" fill="none" stroke="#EEEEF1" stroke-width="15"/>
      <circle id="ring" cx="80" cy="80" r="66" fill="none" stroke="#1497EB" stroke-width="15" stroke-linecap="round" transform="rotate(-90 80 80)" stroke-dasharray="414.69" stroke-dashoffset="414.69"/>
    </svg>
    <div class="abs" style="left:0;right:0;top:82px;text-align:center"><b id="capNum" style="font-size:44px;font-weight:700;letter-spacing:-0.03em;font-feature-settings:'tnum'">0</b><span style="font-size:22px;font-weight:600;color:#AEAEB2">/12</span></div>
    <div class="abs gray" style="left:0;right:0;top:136px;text-align:center;font-size:13px">booked</div>
    <div class="abs" id="avRow" style="left:20px;top:188px;width:300px;height:30px">${AVN.map((n, i) => `<div class="av" style="left:${i * 21}px;background:${AVC[i]}">${n}</div>`).join('')}</div>
  </div>
  <div class="abs" style="left:20px;top:452px;font-size:20px;font-weight:700;letter-spacing:-0.01em">Waitlist</div>
  <div class="abs" style="left:112px;top:454px"><span class="pill blue" id="wlCount">0</span></div>
  <div class="grp" id="wlGrp" style="top:490px;height:174px;background:transparent">
    ${['Priya Shah|Joined 8:12 AM|#6E9F84', 'Rahul Mehta|Joined 8:40 AM|#5E9BE0', 'Ananya Rao|Joined 9:02 AM|#CF7393'].map((s, i) => {
      const [n, j, c] = s.split('|');
      return `<div class="row wlr" style="position:absolute;left:0;right:0;top:${i * 58}px;height:58px;background:#fff;gap:12px;justify-content:flex-start">
        <div style="width:36px;height:36px;border-radius:50%;background:${c};color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center">${n.split(' ').map((x) => x[0]).join('')}</div>
        <div><b style="display:block;font-size:16px;font-weight:600">${n}</b><span style="font-size:13px;color:#8E8E93">${j}</span></div>
        <span style="margin-left:auto;color:#AEAEB2;font-size:15px;font-weight:600">#${i + 1}</span></div>`;
    }).join('')}
  </div>
  <div class="abs gray" style="left:20px;right:20px;top:690px;font-size:13px;line-height:1.35">When a spot opens, the next person on the waitlist moves in automatically.</div>
  ${tabbar(0)}
</div>

<!-- Repeat weekly -->
<div class="scr" id="sMonth">
  <div class="back">${svg(I.chevL, 2.4)}Schedule</div>
  <div class="abs" style="left:20px;top:100px;font-size:28px;font-weight:700;letter-spacing:-0.02em">Sunrise Yoga</div>
  <div class="abs gray" style="left:20px;top:138px;font-size:15px">Tue · 6:00 AM · Maya · 60 min</div>
  <div class="grp" style="top:176px">
    <div class="row"><span style="display:flex;align-items:center;gap:10px"><span class="acc" style="display:flex">${svg(I.repeat, 2).replace('<svg', '<svg width="20" height="20"')}</span>Repeat weekly</span><span class="toggle" id="repTog"><i></i></span></div>
    <div class="row"><span>Repeats</span><span class="v"><span id="repNever">Never</span><span id="repEvery" class="acc" style="position:absolute;right:16px;opacity:0">Every Tuesday</span></span></div>
  </div>
  <div class="cal" style="top:296px;height:330px">
    ${monthPane('mOct', 'October 2026', 3, 31, 13)}
    ${monthPane('mNov', 'November 2026', 6, 30, 0)}
  </div>
  <div class="grp" style="top:642px">
    <div class="row"><span>Sessions scheduled</span><span class="v"><b id="sessCount" style="color:#1D1D1F;font-weight:600;font-feature-settings:'tnum'">1</b></span></div>
  </div>
  ${tabbar(0)}
</div>

<!-- Plans -->
<div class="scr" id="sPlans">
  <div class="abs lt" style="left:20px;top:80px">Plans</div>
  <div class="roundbtn acc" style="left:337px;top:84px">${svg(I.plus, 2.4)}</div>
  <div class="seg" style="top:136px"><span class="on">Memberships</span><span>Class packs</span></div>
  ${[
    ['Class Pack', '8 classes · valid 30 days', '32', C.sand, I.pass],
    ['Monthly', '18 credits · renews monthly', '48', C.sage, I.repeat],
    ['Yearly', '365 days · unlimited', '21', C.blue, I.cal],
  ].map(([n, s, a, c, ic], i) => `<div class="plan-row" id="pr${i}" style="top:${188 + i * 98}px">
      <div class="sq" style="background:${c}1f;color:${c}">${svg(ic, 2)}</div>
      <div><b>${n}</b><span>${s}</span></div>
      <div class="r"><b>${a}</b><br>active</div></div>`).join('')}
  <div class="abs" style="left:16px;right:16px;top:494px;height:120px;background:#fff;border-radius:18px;padding:16px 18px">
    <div class="cap13">SOLD THIS MONTH</div>
    <div style="margin-top:8px;font-size:34px;font-weight:700;letter-spacing:-0.03em">101 <span style="font-size:17px;color:#8E8E93;font-weight:500;letter-spacing:0">plans</span></div>
    <div style="margin-top:4px;font-size:13px;font-weight:600;color:#1F8A43">▲ 12% vs September</div>
  </div>
  ${tabbar(1)}
</div>

<!-- Client booking -->
<div class="scr" id="sBook">
  <div class="abs gray" style="left:20px;top:62px;font-size:15px;font-weight:500">Good morning, Ananya</div>
  <div class="abs" style="left:20px;top:82px;font-size:30px;font-weight:700;letter-spacing:-0.02em">Book a class</div>
  <div class="abs" style="right:16px;top:88px"><span class="pill blue" style="font-size:14px;padding:6px 12px"><b id="credTop" style="font-weight:700">7</b> credits</span></div>
  ${week(134)}
  <div class="abs" style="left:20px;top:214px;font-size:20px;font-weight:700;letter-spacing:-0.01em">Tuesday</div>
  ${[
    ['bk0', C.sage, '7:00', 'AM', 'Vinyasa Flow', 'Maya · 3 spots left'],
    ['bk1', C.rose, '9:00', 'AM', 'Mat Pilates', 'Lena · 5 spots left'],
    ['bk2', C.sage, '11:00', 'AM', 'Yin Yoga', 'Maya · 8 spots left'],
    ['bk3', C.sky, '6:00', 'PM', 'Dance Cardio', 'Kiara · 2 spots left'],
  ].map(([id, c, tm, ap, n, s], i) => card(id, c, tm, ap, n, s, `<span class="acc" style="display:flex">${svg(I.chevR, 2.2).replace('<svg', '<svg width="18" height="18"')}</span>`, null).replace('class="card"', `class="card" style="top:${248 + i * 92}px"`)).join('')}
  ${tabbar(1, 'client')}
</div>
<div class="dim" id="dimBook"></div>
<div class="sheet" id="sBookSheet" style="height:400px">
  <div class="grab"></div>
  <div class="abs" style="left:20px;top:26px;font-size:22px;font-weight:700;letter-spacing:-0.02em">Mat Pilates</div>
  <div class="abs gray" style="left:20px;top:58px;font-size:15px">Tue 13 Oct · 9:00 AM · with Lena</div>
  <div class="opt" id="opt0" style="top:100px"><div><b>Pay per class</b><span>Pay securely in the app</span></div><div class="rd"><i></i></div></div>
  <div class="opt" id="opt1" style="top:174px"><div><b>Use 1 credit</b><span>7 credits left</span></div><div class="rd"><i></i></div></div>
  <div class="bigbtn" id="bookBtn" style="top:262px">Book class</div>
</div>
<div class="scr" id="sSuccess" style="background:#fff">
  <svg class="abs" style="left:136.5px;top:250px" width="120" height="120" viewBox="0 0 120 120">
    <circle id="okCircle" cx="60" cy="60" r="54" fill="none" stroke="#1497EB" stroke-width="6" stroke-linecap="round" transform="rotate(-90 60 60)" stroke-dasharray="339.3" stroke-dashoffset="339.3"/>
    <path id="okCheck" d="M38 61 L53 76 L83 45" fill="none" stroke="#1497EB" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="70" stroke-dashoffset="70"/>
  </svg>
  <div class="abs" id="okT1" style="left:0;right:0;top:400px;text-align:center;font-size:28px;font-weight:700;letter-spacing:-0.02em">You're booked.</div>
  <div class="abs gray" id="okT2" style="left:0;right:0;top:442px;text-align:center;font-size:16px">Mat Pilates · Tue 9:00 AM · with Lena</div>
  <div class="abs" id="okT3" style="left:0;right:0;top:494px;text-align:center"><span class="pill blue" style="font-size:15px;padding:7px 14px"><b id="credOk" style="font-weight:700">7</b>&nbsp;credits left</span></div>
</div>

<!-- Team -->
<div class="scr" id="sTeam">
  <div class="abs lt" style="left:20px;top:80px">Team</div>
  <div class="abs gray" style="left:20px;top:126px;font-size:15px">4 trainers · each with their own login</div>
  <div class="grp" style="top:166px">
    ${[
      ['MI', 'Maya Iyer', 'Yoga & mobility', C.sage],
      ['AN', 'Arjun Nair', 'Strength', C.clay],
      ['LF', 'Lena Fernandes', 'Pilates', C.rose],
      ['KD', 'Kiara Das', 'Dance', C.sky],
    ].map(([ini, n, r, c], i) => `<div class="trow" id="tr${i}"><div class="ava" style="background:${c}22;color:${c}">${ini}</div>
      <div><b>${n}</b><span>${r}</span></div><span class="pill blue" id="tp${i}">${svg(I.key, 2.2)}Own login</span></div>`).join('')}
  </div>
  ${tabbar(2)}
</div>
<div class="scr" id="sTrainer">
  <div class="abs" style="left:20px;top:62px"><span class="pill blue">${svg(I.key, 2.2)}Signed in as Maya</span></div>
  <div class="abs" style="left:20px;top:104px;width:56px;height:56px;border-radius:50%;background:${C.sage}22;color:${C.sage};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600">MI</div>
  <div class="abs" style="left:88px;top:106px;font-size:24px;font-weight:700;letter-spacing:-0.02em">Good morning, Maya</div>
  <div class="abs gray" style="left:88px;top:138px;font-size:15px">3 classes today</div>
  <div class="abs" style="left:20px;top:192px;font-size:20px;font-weight:700;letter-spacing:-0.01em">My schedule</div>
  ${[
    ['6:00', 'AM', 'Sunrise Yoga', '12/12 booked'],
    ['11:00', 'AM', 'Yin Yoga', '8/12 booked'],
    ['5:30', 'PM', 'Vinyasa Flow', '9/12 booked'],
  ].map(([tm, ap, n, s], i) => card('tc' + i, C.sage, tm, ap, n, s, '<span class="pill blue">Check in</span>', null).replace('class="card"', `class="card" style="top:${228 + i * 92}px"`)).join('')}
  ${tabbar(0, 'trainer')}
</div>

<!-- Sales -->
<div class="scr" id="sSales">
  <div class="abs lt" style="left:20px;top:80px">Sales</div>
  <div class="roundbtn acc" id="expBtn" style="left:337px;top:84px">${svg(I.share, 2.2)}</div>
  <div class="seg" style="top:136px"><span>Week</span><span class="on">Month</span><span>Year</span></div>
  <div class="abs" style="left:16px;right:16px;top:186px;height:116px;background:#fff;border-radius:18px;padding:16px 18px">
    <div class="cap13">OCTOBER</div>
    <div style="margin-top:6px;display:flex;align-items:baseline;gap:8px"><b id="salesNum" style="font-size:40px;font-weight:700;letter-spacing:-0.03em;font-feature-settings:'tnum'">0</b><span style="font-size:17px;color:#8E8E93">bookings</span></div>
    <div style="margin-top:2px;font-size:13px;font-weight:600;color:#1F8A43">▲ 18% vs September</div>
  </div>
  <div class="abs" id="chart" style="left:16px;right:16px;top:314px;height:220px;background:#fff;border-radius:18px">
    <div class="abs cap13" style="left:18px;top:16px">DAILY BOOKINGS</div>
    ${[38, 52, 45, 61, 57, 70, 48, 66, 74, 69, 82, 77, 90, 100].map((h, i) => `<div class="chartbar" style="left:${22 + i * 23}px;height:${h * 1.3}px;${i === 13 ? 'background:#1497EB' : ''}"></div>`).join('')}
    <div class="abs gray" style="left:20px;right:20px;bottom:18px;display:flex;justify-content:space-between;font-size:11px;font-weight:500"><span>1 Oct</span><span>7 Oct</span><span>14 Oct</span></div>
  </div>
  <div class="grp" style="top:548px">
    <div class="row"><span>Memberships</span><span class="v" style="color:#1D1D1F;font-weight:600">212</span></div>
    <div class="row"><span>Credit packs</span><span class="v" style="color:#1D1D1F;font-weight:600">148</span></div>
    <div class="row"><span>Pay per class</span><span class="v" style="color:#1D1D1F;font-weight:600">924</span></div>
  </div>
  ${tabbar(3)}
</div>
<div id="expMenu" class="abs" style="right:16px;top:128px;width:230px;background:rgba(255,255,255,0.98);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,0.18);overflow:hidden;transform-origin:90% 0;z-index:75">
  ${[['Excel (.xlsx)', I.grid, '#1F8A43'], ['CSV', I.doc, '#8E8E93'], ['PDF report', I.doc, '#8E8E93']].map(([n, ic, c], i) =>
    `<div class="row" id="em${i}" style="height:46px;font-size:16px"><span>${n}</span><span style="color:${c};display:flex">${svg(ic, 2).replace('<svg', '<svg width="20" height="20"')}</span></div>`).join('')}
</div>

<div class="banner" id="ban1"><div class="bi">${iconSVG()}</div><div><b>Spot opened</b><span>Priya moved in from the waitlist</span></div><small>now</small></div>
<div class="banner" id="ban2"><div class="bi" style="background:#1F8A43;display:flex;align-items:center;justify-content:center;color:#fff">${svg(I.grid, 2).replace('<svg', '<svg width="24" height="24"')}</div><div><b>Report exported</b><span>Sales_October.xlsx is ready</span></div><small>now</small></div>

<div class="sb">${SB}</div>
<div class="homeind"></div>
<div id="tap"></div>
`;

const EDGES = Array.from({ length: 7 }, (_, i) => `<div class="ph-edge" style="transform:translateZ(${-(i + 1) * 3.5}px)"></div>`).join('');
const PCARDS = [
  { id: 'pc1', bg: '#1D1D1F', fg: '#F5F5F7', sub: '#98989D', lb: 'Class pack', big: '8', unit: 'classes', sm: 'Valid for 30 days' },
  { id: 'pc2', bg: '#FFFFFF', fg: '#1D1D1F', sub: '#6E6E73', lb: 'Monthly', big: '18', unit: 'credits', sm: 'Renews every month' },
  { id: 'pc3', bg: 'linear-gradient(135deg,#25A9F3,#0A70C2)', fg: '#FFFFFF', sub: 'rgba(255,255,255,.78)', lb: 'Yearly', big: '365', unit: 'days', sm: 'Unlimited · best for regulars' },
];
H(`<div class="layer" id="feat">
  <div id="floorShadow" style="position:absolute;left:290px;top:1840px;width:500px;height:80px;border-radius:50%;background:radial-gradient(ellipse at center, rgba(0,0,0,.28), rgba(0,0,0,0) 70%);filter:blur(8px)"></div>
  <div id="phoneWrap" style="display:block">
    <div id="phone">
      <div id="phShadow"></div>
      ${EDGES}
      <div class="btn-side" style="left:-7px;top:250px;height:62px;transform:translateZ(-12px)"></div>
      <div class="btn-side" style="left:-7px;top:352px;height:112px;transform:translateZ(-12px)"></div>
      <div class="btn-side" style="left:-7px;top:484px;height:112px;transform:translateZ(-12px)"></div>
      <div class="btn-side" style="right:-7px;top:400px;height:172px;transform:translateZ(-12px) scaleX(-1)"></div>
      <div class="ph-face"><div class="ph-bezel"></div></div>
      <div id="screen" style="transform:translateZ(0.6px)"><div id="ui">${UI}</div></div>
      <div id="island" style="transform:translateZ(1.2px)"></div>
      <div id="glare" style="transform:translateZ(1.8px)"></div>
      ${PCARDS.map((c) => `<div class="pcard" id="${c.id}" style="left:85px;top:0;background:${c.bg};color:${c.fg};box-shadow:0 40px 80px rgba(0,0,0,.28)">
        <div class="lb" style="color:${c.sub}">${c.lb}</div>
        <div class="big">${c.big}<small>${c.unit}</small></div>
        <div class="sm" style="color:${c.sub}">${c.sm}</div>
        <div class="mk">${c.id === 'pc2' ? iconSVG() : `<svg viewBox="140 140 280 260"><g fill="${c.id === 'pc1' ? '#F5F5F7' : '#fff'}" opacity=".9">${MARK.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`}</div>
      </div>`).join('')}
    </div>
  </div>
  ${HL.map(([a, b], i) => `<div class="t fh" id="h${i}a" style="top:206px;font-size:86px;color:#1D1D1F;font-weight:700">${line(a)}</div>
    <div class="t fh" id="h${i}b" style="top:300px;font-size:86px;color:#86868B;font-weight:700">${line(b)}</div>`).join('')}
</div>`);

// ---- 5. built for
const BUILT = [['Fitness.', '#F0A04B'], ['Yoga.', '#8DC3A0'], ['Dance.', '#EE8DAA'], ['Coaching.', '#7DB4F5']];
H(`<div class="layer" id="built">
  <div class="t" id="b0" style="top:770px;font-size:120px">${line('Built for')}</div>
  <div class="roll" style="top:892px;height:190px">${BUILT.map(([w, c], i) => `<div class="t" id="bw${i}" style="top:12px;font-size:156px;color:${c}">${w}</div>`).join('')}</div>
</div>`);

// ---- 6. fits
H(`<div class="layer" id="fits">
  <div class="t" id="f1" style="top:830px;font-size:100px">${line('Trivora fits')}</div>
  <div class="t" id="f2" style="top:940px;font-size:100px;color:#86868B">${line('the way you teach.')}</div>
</div>`);

// ---- 7. end card
H(`<div class="layer" id="end">
  <div class="glow" id="eglow" style="left:-60px;top:0px;width:1200px;height:1200px"></div>
  <div class="appicon" id="eicon" style="left:415px;top:470px;width:250px;height:250px">${iconSVG()}</div>
  <div class="t" id="eword" style="top:742px;font-size:140px;letter-spacing:-0.03em">Trivora</div>
  <div class="t" id="eline" style="top:920px;font-size:44px;font-weight:500;color:#86868B;letter-spacing:-0.01em">${line('Owners. Trainers. Clients.')}</div>
  <div class="ctapill" id="ecta" style="top:1090px">${svg(I.chat, 2.2).replace('stroke="currentColor"', 'stroke="#0A74C6"')}<span>Comment <b>“DEMO”</b></span></div>
  <div class="t" id="edm" style="top:1240px;font-size:38px;font-weight:500;color:#86868B;letter-spacing:-0.01em">${line("or DM us — we'll show you around.")}</div>
  <div class="t" id="efoot" style="top:1600px;font-size:30px;font-weight:500;color:#6E6E73;letter-spacing:0">${line('iOS and Android · Monthly and yearly plans')}</div>
</div>`);

// ---------------------------------------------------------------- refs
const L = {};
['open', 'chaos', 'reveal', 'feat', 'built', 'fits', 'end'].forEach((id) => (L[id] = $('#' + id)));
const chaosEls = $$('.chaos-c');
const R = (id) => $('#' + id);

// ---------------------------------------------------------------- scenes
function bg(t) {
  let c = '#000000';
  if (t >= 14.4 && t < 38.4) c = '#F5F5F7';
  stage.style.background = c;
}

function strike(el, t, t0, d = 0.32) {
  const s = $('.strike', el);
  if (s) s.style.transform = `scaleX(${f2(P(t, t0, t0 + d, E.inOutQuint))})`;
}

function sceneOpen(t) {
  const on = t < 4.85;
  show(L.open, on);
  if (!on) return;
  L.open.style.transform = `scale(${(1 + 0.012 * t).toFixed(4)})`;
  txt(R('o1'), t, 0.35, 2.6);
  txt(R('o2'), t, 0.7, 2.6);
  txt(R('o3'), t, 1.3, 2.62);
  txt(R('o4'), t, 2.95, 4.4);
  txt(R('o5'), t, 3.3, 4.42);
  strike(R('o5'), t, 3.85, 0.36);
}

function sceneChaos(t) {
  const on = t >= 4.8 && t < 9.7;
  show(L.chaos, on);
  if (!on) return;
  const kc = P(t, 8.7, 9.38, E.in);
  const dolly = (t - 4.8) * 55;
  CHAOS.forEach((d, i) => {
    const el = chaosEls[i];
    if (t < d.t) { el.style.opacity = 0; return; }
    const ka = P(t, d.t, d.t + 0.55, E.spring);
    const ko = P(t, d.t, d.t + 0.22, E.out);
    let x = d.x, y = d.y - (1 - ka) * 60, s = d.s * (0.9 + 0.1 * ka), z = d.z + dolly;
    x = lerp(x, 540, kc); y = lerp(y, 905, kc); s *= 1 - kc * 0.94; z = lerp(z, 0, kc);
    const depth = d.z < -100 ? (-d.z - 100) / 55 : 0;
    el.style.opacity = f2(ko * (1 - P(t, 9.1, 9.38)));
    el.style.transform = `translate3d(${f2(x - d.w / 2)}px,${f2(y - d.h / 2)}px,${f2(z)}px) rotate(${f2(d.r * (1 - kc))}deg) scale(${s.toFixed(4)})`;
    el.style.filter = (depth + kc * 10 > 0.05) ? `blur(${f2(depth + kc * 10)}px) brightness(${f2(1 - Math.min(0.45, depth * 0.12))})` : 'none';
  });
  const lines = [R('c1'), R('c2'), R('c3')];
  const tin = [4.85, 5.85, 6.85];
  lines.forEach((el, i) => {
    txt(el, t, tin[i], null, { dur: 0.8 });
    const dimNext = i < 2 ? P(t, tin[i + 1], tin[i + 1] + 0.35) : 0;
    const dimAll = P(t, 7.9 + i * 0.1, 8.3 + i * 0.1);
    el.style.color = mix('#F5F5F7', '#5A5A5E', Math.max(dimNext * 0.85, dimAll));
    strike(el, t, 7.85 + i * 0.12, 0.34);
    const ty = lerp(0, 905 - (parseFloat(el.style.top) + 64), kc);
    el.style.transform = `translateY(${f2(ty)}px) scale(${(1 - kc * 0.9).toFixed(4)})`;
    el.style.opacity = f2(1 - P(t, 9.0, 9.35));
    el.style.filter = blur(kc * 14);
  });
  // flash of light where everything collapses
  const kf1 = P(t, 9.18, 9.5, E.out), kf2 = P(t, 9.5, 9.72, E.in);
  const fl = $('#flash i');
  fl.style.opacity = f2(kf1 * (1 - kf2));
  fl.style.transform = `scale(${f2(0.2 + kf1 * 1.1 + kf2 * 0.6)})`;
}

function sheen(el, t, t0, t1) {
  const s = $('.sheen', el);
  if (s) s.setAttribute('x', f2(lerp(-420, 760, P(t, t0, t1, E.inOut))));
}

function sceneReveal(t) {
  const on = t >= 9.5 && t < 14.0;
  show(L.reveal, on);
  if (!on) return;
  const out = P(t, 13.3, 13.75, E.in);
  const kIn = P(t, 9.55, 10.6, E.outExpo);
  const kUp = P(t, 11.5, 12.25, E.inOutQuint);
  const icon = R('ricon');
  icon.style.opacity = f2(P(t, 9.55, 9.85) * (1 - out));
  icon.style.transform = `translateY(${f2(-kUp * 342 - out * 40)}px) scale(${(lerp(0.5, 1, kIn) * lerp(1, 0.6, kUp)).toFixed(4)})`;
  icon.style.filter = blur((1 - kIn) * 22 + out * 10);
  sheen(icon, t, 10.15, 11.0);
  const g = R('rglow');
  g.style.opacity = f2(P(t, 9.55, 10.6, E.out) * (1 - P(t, 13.2, 13.9)));
  g.style.transform = `translateY(${f2(-kUp * 342)}px) scale(${f2(lerp(0.6, 1, kIn) * lerp(1, 0.75, kUp))})`;

  const w = R('rword');
  const kw = P(t, 10.15, 11.1, E.outQuint);
  w.style.opacity = f2(clamp(kw * 1.3) * (1 - out));
  w.style.letterSpacing = `${(lerp(0.22, -0.03, kw)).toFixed(4)}em`;
  w.style.filter = blur((1 - kw) * 14 + out * 10);
  w.style.transform = `translateY(${f2(-kUp * 318 - out * 40)}px) scale(${(lerp(1, 0.62, kUp)).toFixed(4)})`;

  txt(R('r1'), t, 12.0, 13.3);
  txt(R('r2'), t, 12.4, 13.32);
}

// phone camera keys
const PH = {
  y: [[14.4, 760], [15.3, 0, E.outQuint], [18.0, 0], [18.8, 209], [19.6, 209], [20.25, 0], [24.6, 0], [25.35, 110], [27.55, 110], [28.35, 0], [34.8, 0], [35.6, 142], [36.05, 142], [36.55, 0], [38.4, 0]],
  s: [[14.4, 0.92], [15.3, 1, E.outQuint], [17.95, 1.03, E.lin], [18.0, 1.03], [18.8, 1.4], [19.6, 1.4], [20.25, 1], [21.9, 1], [22.7, 0.97], [24.6, 0.97], [25.35, 0.86], [27.55, 0.86], [28.35, 1], [31.6, 1.035, E.lin], [31.9, 1.035], [32.3, 1], [34.8, 1], [35.6, 1.3], [36.05, 1.3], [36.55, 1], [38.4, 1.02, E.lin]],
  rx: [[14.4, 30], [15.3, 0, E.outQuint], [21.9, 0], [22.8, 6], [24.3, 6], [25.35, 20], [27.55, 18], [28.35, 0]],
  ry: [[21.9, 0], [22.8, -14], [24.3, -10], [25.35, 18], [27.55, 13], [28.35, 0], [31.85, 0], [32.5, 9], [34.6, -5], [35.4, 0]],
  rz: [[24.6, 0], [25.35, -3], [27.55, -2], [28.35, 0]],
  x: [[21.9, 0], [22.8, 34], [24.3, 34], [25.35, 0]],
};

function screenFade(el, t, a, b, c, d) {
  // fade-in a→b, fade-out c→d with a subtle scale (context switch)
  const on = t >= a && t < d;
  show(el, on);
  if (!on) return 0;
  const ki = P(t, a, b, E.out), ko = P(t, c, d, E.in);
  el.style.opacity = f2(ki * (1 - ko));
  el.style.transform = `scale(${(lerp(1.04, 1, ki) * lerp(1, 0.96, ko)).toFixed(4)})`;
  return ki;
}

const TAPS = [
  [15.35, 355, 102], [16.6, 338, 533], [16.72, 338, 533], [16.84, 338, 533], [16.96, 338, 533], [17.15, 196, 780],
  [22.05, 336, 201], [28.85, 196, 382], [29.7, 196, 661], [30.1, 196, 743], [33.15, 196, 202], [36.65, 355, 102], [37.15, 260, 151],
];

function sceneFeatures(t) {
  const on = t >= 14.4 && t < 38.4;
  show(L.feat, on);
  if (!on) return;

  // camera
  const ph = R('phone');
  const y = kf(t, PH.y), s = kf(t, PH.s), rx = kf(t, PH.rx), ry = kf(t, PH.ry), rz = kf(t, PH.rz), x = kf(t, PH.x);
  ph.style.transform = `translate3d(${f2(x)}px,${f2(y)}px,0) scale(${s.toFixed(4)}) rotateX(${f2(rx)}deg) rotateY(${f2(ry)}deg) rotateZ(${f2(rz)}deg)`;
  const tilted = Math.max(Math.abs(rx), Math.abs(ry), Math.abs(rz)) > 0.4;
  if (ph._tilted !== tilted) { ph._tilted = tilted; $$('.ph-edge', ph).forEach((e) => (e.style.visibility = tilted ? 'visible' : 'hidden')); }
  R('glare').style.backgroundPosition = `${f2(50 + ry * 3 - rx * 1.5)}% 0`;
  const fs = R('floorShadow');
  fs.style.opacity = f2(clamp(1 - Math.abs(y) / 600) * clamp(1.4 - s * 0.6) * 0.9);
  fs.style.transform = `translate(${f2(x)}px,0) scaleX(${f2(s)})`;

  // headlines
  HL.forEach(([, , tin, tout], i) => {
    txt(R(`h${i}a`), t, tin, tout >= 38.4 ? null : tout, { dur: 0.8, od: 0.3 });
    txt(R(`h${i}b`), t, tin + 0.18, tout >= 38.4 ? null : tout, { dur: 0.8, od: 0.3 });
  });

  ui(t);
}

function ui(t) {
  // --- schedule + new session sheet
  const sched = R('sSched');
  const onS = t < 18.45;
  show(sched, onS);
  const kSheet = P(t, 15.45, 16.0, E.spring) * (1 - P(t, 17.25, 17.55, E.inOut));
  const kPush1 = P(t, 18.0, 18.42, E.inOutQuint);
  if (onS) {
    sched.style.transform = `translateX(${f2(-kPush1 * 118)}px) translateY(${f2(kSheet * 10)}px) scale(${(1 - kSheet * 0.07).toFixed(4)})`;
    sched.style.borderRadius = `${f2(kSheet * 14)}px`;
    sched.style.filter = kPush1 > 0.01 ? `brightness(${f2(1 - kPush1 * 0.12)})` : 'none';
    // insert new card
    const kI = P(t, 17.45, 17.85, E.spring);
    SCHED.forEach(([id], i) => {
      const c = R(id);
      const top = 250 + (i === 0 ? 0 : (i - 1) * 92 + kI * 92);
      c.style.top = `${f2(top)}px`;
      if (i === 0) {
        const ka = P(t, 17.5, 17.75, E.out);
        c.style.opacity = f2(ka);
        c.style.transform = `scale(${f2(lerp(0.94, 1, ka))})`;
        c.style.background = mix('#E2F0FC', '#FFFFFF', P(t, 17.8, 18.5));
      }
    });
    R('schedCount').textContent = t >= 17.55 ? '6 classes' : '5 classes';
  }
  R('ui').style.background = kSheet > 0.001 ? '#000' : '#F2F2F7';
  const dimN = R('dimNew');
  show(dimN, kSheet > 0.001);
  dimN.style.opacity = f2(kSheet * 0.3);
  const sNew = R('sNew');
  show(sNew, kSheet > 0.001);
  sNew.style.transform = `translateY(${f2((1 - kSheet) * 800)}px)`;
  if (kSheet > 0.001) {
    const word = 'Sunrise Yoga';
    const n = Math.floor(clamp((t - 15.95) / 0.05, 0, word.length));
    const typing = t >= 15.87 && t < 16.75;
    const caret = typing || (t < 17.1 && Math.floor(t * 2.2) % 2 === 0);
    R('typeVal').innerHTML = (n ? word.slice(0, n) : '<span style="color:#C7C7CC">Class name</span>') + (caret && t > 15.8 ? '<i class="caret"></i>' : '');
    R('addLbl').style.color = n >= word.length ? '#1497EB' : '#C7C7CC';
    const taps = [16.6, 16.72, 16.84, 16.96].filter((x) => t >= x + 0.04).length;
    R('capVal').textContent = 8 + taps;
    const press = P(t, 17.15, 17.2) * (1 - P(t, 17.22, 17.35));
    R('createBtn').style.transform = `scale(${f2(1 - press * 0.03)})`;
    R('createBtn').style.opacity = f2(1 - press * 0.15);
  }

  // --- session detail (capacity + waitlist)
  const det = R('sDetail');
  const onD = t >= 18.0 && t < 21.98;
  show(det, onD);
  if (onD) {
    const kPush2 = P(t, 21.6, 21.98, E.inOutQuint);
    det.style.transform = `translateX(${f2((1 - kPush1) * 393 - kPush2 * 118)}px)`;
    det.style.boxShadow = kPush1 < 1 ? '-20px 0 40px rgba(0,0,0,.12)' : 'none';
    const kr = P(t, 18.45, 19.45, E.out);
    const count = Math.round(kr * 12);
    R('ring').setAttribute('stroke-dashoffset', f2(414.69 * (1 - kr)));
    R('capNum').textContent = count;
    const kf1 = P(t, 19.48, 19.78, E.back);
    const fp = R('fullPill');
    fp.style.opacity = f2(clamp(kf1 * 2));
    fp.style.transform = `scale(${f2(lerp(0.6, 1, kf1))})`;
    $$('.av', det).forEach((a, i) => {
      const ka = P(t, 18.45 + (i + 0.5) * (1 / 12), 18.45 + (i + 0.5) * (1 / 12) + 0.25, E.back);
      a.style.opacity = f2(clamp(ka * 2));
      a.style.transform = `scale(${f2(lerp(0.4, 1, ka))})`;
    });
    const rows = $$('.wlr', det);
    let shown = 0;
    rows.forEach((r, i) => {
      const t0 = 19.85 + i * 0.2;
      const ka = P(t, t0, t0 + 0.45, E.spring);
      if (t >= t0 + 0.05) shown++;
      let ty = i * 58, op = clamp(ka * 1.5), tx = (1 - ka) * 40;
      if (i === 0) { const kx = P(t, 20.85, 21.1, E.in); op *= 1 - kx; tx -= kx * 60; }
      else ty -= P(t, 21.05, 21.4, E.spring) * 58;
      r.style.top = `${f2(ty)}px`;
      r.style.opacity = f2(op);
      r.style.transform = `translateX(${f2(tx)}px)`;
      r.style.borderRadius = '0';
    });
    if (rows[0]) {
      const firstGone = t >= 20.95;
      rows[firstGone ? 1 : 0].style.borderRadius = '12px 12px 0 0';
      rows[2].style.borderRadius = '0 0 12px 12px';
    }
    R('wlCount').textContent = Math.max(0, shown - (t >= 20.95 ? 1 : 0));
  }
  bannerAnim(R('ban1'), t, 20.6, 21.35);

  // --- repeat weekly
  const mon = R('sMonth');
  const onM = t >= 21.6 && t < 24.77;
  show(mon, onM);
  if (onM) {
    const kIn = P(t, 21.6, 21.98, E.inOutQuint);
    const kOut = P(t, 24.76, 24.77, E.in);
    mon.style.transform = `translateX(${f2((1 - kIn) * 393)}px)`;
    mon.style.opacity = f2(1 - kOut);
    mon.style.boxShadow = kIn < 1 ? '-20px 0 40px rgba(0,0,0,.12)' : 'none';
    const kt = P(t, 22.05, 22.28, E.inOut);
    R('repTog').style.background = mix('#E9E9EB', '#1497EB', kt);
    $('i', R('repTog')).style.transform = `translateX(${f2(kt * 20)}px)`;
    const kv = P(t, 22.2, 22.4);
    R('repNever').style.opacity = f2(1 - kv);
    R('repEvery').style.opacity = f2(kv);
    const kslide = P(t, 23.05, 23.42, E.inOutQuint);
    R('mOct').style.transform = `translateX(${f2(-kslide * 361)}px)`;
    R('mNov').style.transform = `translateX(${f2((1 - kslide) * 361)}px)`;
    const lights = [['mOct', 13, 22.35], ['mOct', 20, 22.55], ['mOct', 27, 22.75], ['mNov', 3, 23.5], ['mNov', 10, 23.65], ['mNov', 17, 23.8], ['mNov', 24, 23.95]];
    let lit = 0;
    lights.forEach(([m, d, t0]) => {
      const cell = $(`#${m} [data-d="${d}"]`);
      const k = P(t, t0, t0 + 0.4, E.back);
      if (t >= t0 + 0.05) lit++;
      const ci = $('i', cell);
      ci.style.opacity = f2(clamp(k * 2));
      ci.style.transform = `scale(${f2(lerp(0.3, 1, k))})`;
      $('em', cell).style.color = k > 0.3 ? '#fff' : '';
      $('em', cell).style.fontWeight = k > 0.3 ? '700' : '';
    });
    R('sessCount').textContent = Math.max(1, lit);
  }

  // --- plans
  const kPl = screenFade(R('sPlans'), t, 24.58, 24.76, 28.42, 28.43);
  const pcs = ['pc1', 'pc2', 'pc3'].map(R);
  const tgt = [
    { x: 300, y: 330, z: 150, r: -7 },
    { x: 345, y: 640, z: 240, r: 4 },
    { x: 300, y: 950, z: 330, r: -3 },
  ];
  pcs.forEach((c, i) => {
    const t0 = 25.15 + i * 0.16;
    const on = t >= t0 && t < 28.0;
    show(c, on);
    if (!on) return;
    const k = P(t, t0, t0 + 0.8, E.spring) * (1 - P(t, 27.5 + i * 0.05, 27.95, E.inOutQuint));
    const sy = 20 + (188 + i * 98 + 43) * 1.526718;
    const bob = Math.sin((t - 25) * 1.7 + i * 1.3) * 7 * k;
    const cx = lerp(320, tgt[i].x, k), cy = lerp(sy, tgt[i].y, k) + bob;
    c.style.opacity = f2(clamp(k * 3));
    c.style.transform = `translate3d(${f2(cx - 320)}px,${f2(cy - 136)}px,${f2(tgt[i].z * k + 2)}px) rotateZ(${f2(tgt[i].r * k)}deg) scale(${f2(lerp(0.66, 1, k))})`;
  });
  [0, 1, 2].forEach((i) => {
    const r = R('pr' + i);
    if (kPl) r.style.opacity = f2(1 - 0.55 * P(t, 25.15 + i * 0.16, 25.5 + i * 0.16) * (1 - P(t, 27.6, 27.95)));
  });

  // --- client booking
  screenFade(R('sBook'), t, 28.22, 28.42, 30.6, 30.65);
  const hl = P(t, 28.85, 28.9) * (1 - P(t, 29.1, 29.4));
  R('bk1').style.background = mix('#FFFFFF', '#E6F1FB', hl);
  const kB = P(t, 29.0, 29.45, E.spring) * (1 - P(t, 30.25, 30.5));
  show(R('dimBook'), kB > 0.001 && t < 30.6);
  R('dimBook').style.opacity = f2(kB * 0.3);
  const bs = R('sBookSheet');
  show(bs, kB > 0.001 && t < 30.6);
  bs.style.transform = `translateY(${f2((1 - kB) * 420)}px)`;
  const kSel = P(t, 29.7, 29.85);
  R('opt1').style.borderColor = mix('#E5E5EA', '#1497EB', kSel);
  R('opt1').style.background = mix('#FFFFFF', '#F2F8FE', kSel);
  $('.rd', R('opt1')).style.borderColor = mix('#C7C7CC', '#1497EB', kSel);
  $('.rd i', R('opt1')).style.opacity = f2(kSel);
  const pb = P(t, 30.1, 30.15) * (1 - P(t, 30.17, 30.3));
  R('bookBtn').style.transform = `scale(${f2(1 - pb * 0.03)})`;
  const suc = R('sSuccess');
  const onSu = t >= 30.22 && t < 32.08;
  show(suc, onSu);
  if (onSu) {
    const ki = P(t, 30.22, 30.5, E.out), ko = 0;
    suc.style.opacity = f2(ki * (1 - ko));
    suc.style.transform = `scale(${f2(lerp(0.97, 1, ki))})`;
    R('okCircle').setAttribute('stroke-dashoffset', f2(339.3 * (1 - P(t, 30.32, 30.75, E.inOut))));
    R('okCheck').setAttribute('stroke-dashoffset', f2(70 * (1 - P(t, 30.6, 30.88, E.out))));
    [['okT1', 30.55], ['okT2', 30.65], ['okT3', 30.75]].forEach(([id, t0]) => {
      const k = P(t, t0, t0 + 0.5, E.outQuint);
      R(id).style.opacity = f2(k);
      R(id).style.transform = `translateY(${f2((1 - k) * 14)}px)`;
    });
    R('credOk').textContent = t >= 31.0 ? 6 : 7;
  }

  // --- team + trainer view
  const team = R('sTeam');
  const onT = t >= 31.8 && t < 33.7;
  show(team, onT);
  const kPush3 = P(t, 33.3, 33.68, E.inOutQuint);
  if (onT) {
    const ki = P(t, 31.8, 32.08, E.out);
    team.style.opacity = f2(ki);
    team.style.transform = `translateX(${f2(-kPush3 * 118)}px) scale(${f2(lerp(1.04, 1, ki))})`;
    [0, 1, 2, 3].forEach((i) => {
      const k = P(t, 31.95 + i * 0.09, 32.45 + i * 0.09, E.outQuint);
      const r = R('tr' + i);
      r.style.opacity = f2(k);
      r.style.transform = `translateY(${f2((1 - k) * 18)}px)`;
      const kp = P(t, 32.4 + i * 0.13, 32.75 + i * 0.13, E.back);
      const p = R('tp' + i);
      p.style.opacity = f2(clamp(kp * 2));
      p.style.transform = `scale(${f2(lerp(0.5, 1, kp))})`;
    });
    R('tr0').style.background = mix('#FFFFFF', '#E9E9EE', P(t, 33.15, 33.2) * (1 - P(t, 33.5, 33.7)));
  }
  const tv = R('sTrainer');
  const onTv = t >= 33.3 && t < 35.08;
  show(tv, onTv);
  if (onTv) {
    tv.style.transform = `translateX(${f2((1 - kPush3) * 393)}px)`;
    tv.style.boxShadow = kPush3 < 1 ? '-20px 0 40px rgba(0,0,0,.12)' : 'none';
    tv.style.opacity = 1;
    [0, 1, 2].forEach((i) => {
      const k = P(t, 33.55 + i * 0.09, 34.05 + i * 0.09, E.outQuint);
      R('tc' + i).style.opacity = f2(k);
      R('tc' + i).style.transform = `translateY(${f2((1 - k) * 20)}px)`;
    });
  }

  // --- sales
  const kSa = screenFade(R('sSales'), t, 34.8, 35.08, 99, 100);
  if (kSa) {
    R('salesNum').textContent = Math.round(P(t, 35.0, 35.85, E.out) * 1284).toLocaleString('en-US');
    $$('.chartbar', R('sSales')).forEach((b, i) => {
      const k = P(t, 35.05 + i * 0.035, 35.6 + i * 0.035, E.spring);
      b.style.transform = `scaleY(${f2(Math.max(0.02, k))})`;
    });
    const pe = P(t, 36.65, 36.7) * (1 - P(t, 36.72, 36.85));
    R('expBtn').style.transform = `scale(${f2(1 - pe * 0.1)})`;
  }
  const menu = R('expMenu');
  const kMn = P(t, 36.75, 37.0, E.spring) * (1 - P(t, 37.25, 37.42, E.in));
  show(menu, kMn > 0.001 && t < 38.4);
  menu.style.opacity = f2(clamp(kMn * 1.5));
  menu.style.transform = `scale(${f2(lerp(0.85, 1, kMn))})`;
  R('em0').style.background = mix('#FFFFFF', '#ECECF0', P(t, 37.15, 37.2));
  bannerAnim(R('ban2'), t, 37.35, 99);

  // --- touch indicator
  tapIndicator(t);
}

function bannerAnim(el, t, tin, tout) {
  const on = t >= tin && t < tout + 0.3;
  show(el, on);
  if (!on) return;
  const k = P(t, tin, tin + 0.5, E.spring) * (1 - P(t, tout, tout + 0.28, E.in));
  el.style.transform = `translateY(${f2((1 - k) * -110)}px)`;
  el.style.opacity = f2(clamp(k * 2));
}

function tapIndicator(t) {
  const el = R('tap');
  let best = null, bo = 0;
  for (const [te, x, y] of TAPS) {
    if (t < te - 0.2 || t > te + 0.34) continue;
    const o = P(t, te - 0.2, te - 0.06, E.out) * (1 - P(t, te + 0.12, te + 0.34));
    if (o >= bo) { bo = o; best = [te, x, y]; }
  }
  if (!best) { el.style.opacity = 0; return; }
  const [te, x, y] = best;
  const press = P(t, te - 0.04, te, E.out) * (1 - P(t, te + 0.02, te + 0.14, E.out));
  const sc = lerp(1.25, 1, P(t, te - 0.2, te - 0.04, E.out)) * (1 - press * 0.18);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.opacity = f2(bo);
  el.style.transform = `scale(${f2(sc)})`;
}

function sceneBuilt(t) {
  const on = t >= 38.4 && t < 42.05;
  show(L.built, on);
  if (!on) return;
  txt(R('b0'), t, 38.45, 41.55);
  const T = [38.55, 39.3, 40.05, 40.8];
  BUILT.forEach((_, i) => {
    const el = R('bw' + i);
    const tin = T[i], tout = i < 3 ? T[i + 1] : 41.55;
    const on2 = t >= tin && t < tout + 0.45;
    show(el, on2);
    if (!on2) return;
    const ki = P(t, tin, tin + 0.55, E.outQuint), ko = P(t, tout, tout + 0.4, E.inOutQuint);
    el.style.transform = `translateY(${f2((1 - ki) * 150 - ko * 150)}px)`;
    el.style.opacity = f2(clamp(ki * 1.4) * (1 - ko));
    el.style.filter = blur((1 - ki) * 10 + ko * 10);
  });
}

function sceneFits(t) {
  const on = t >= 41.95 && t < 44.5;
  show(L.fits, on);
  if (!on) return;
  L.fits.style.transform = `scale(${(1 + 0.018 * (t - 42)).toFixed(4)})`;
  txt(R('f1'), t, 42.05, 43.95);
  txt(R('f2'), t, 42.35, 43.98);
}

function sceneEnd(t) {
  const on = t >= 44.35;
  show(L.end, on);
  if (!on) return;
  L.end.style.transform = `scale(${(1.03 - 0.03 * P(t, 44.4, 48, E.out)).toFixed(4)})`;
  const ki = P(t, 44.45, 45.4, E.outExpo);
  const ic = R('eicon');
  ic.style.opacity = f2(P(t, 44.45, 44.75));
  ic.style.transform = `scale(${f2(lerp(0.6, 1, ki))})`;
  ic.style.filter = blur((1 - ki) * 20);
  sheen(ic, t, 45.1, 45.9);
  const g = R('eglow');
  g.style.opacity = f2(P(t, 44.45, 45.6, E.out) * 0.9);
  g.style.transform = `scale(${f2(lerp(0.7, 1, ki))})`;
  const w = R('eword');
  const kw = P(t, 44.8, 45.7, E.outQuint);
  w.style.opacity = f2(clamp(kw * 1.3));
  w.style.letterSpacing = `${(lerp(0.2, -0.03, kw)).toFixed(4)}em`;
  w.style.filter = blur((1 - kw) * 12);
  txt(R('eline'), t, 45.25, null, { st: 0.08 });
  const kc = P(t, 45.65, 46.35, E.outQuint);
  const cta = R('ecta');
  cta.style.opacity = f2(clamp(kc * 1.3));
  cta.style.transform = `translateX(-50%) translateY(${f2((1 - kc) * 34)}px) scale(${f2(lerp(0.94, 1, kc))})`;
  cta.style.filter = blur((1 - kc) * 10);
  txt(R('edm'), t, 45.95, null, { st: 0.04 });
  txt(R('efoot'), t, 46.35, null, { st: 0.03, dy: 0.2 });
}

// ---------------------------------------------------------------- frame
function render(t) {
  bg(t);
  sceneOpen(t);
  sceneChaos(t);
  sceneReveal(t);
  sceneFeatures(t);
  sceneBuilt(t);
  sceneFits(t);
  sceneEnd(t);
}
window.DURATION = 48.0;
window.renderFrame = (t) => { render(t); return true; };
window.ready = document.fonts.ready.then(() => { render(0); return true; });
