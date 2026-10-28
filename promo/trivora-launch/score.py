"""Original score + sound design for the Trivora launch film.

Pure numpy synthesis (no samples, no licensing). 100 BPM, 48 s, 44.1 kHz stereo.
Every cue below is locked to a moment in main.js.

    python3 score.py out/score.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 48.0
N = int(SR * DUR)
BEAT = 0.6  # 100 BPM
rng = np.random.default_rng(11)

dry = np.zeros((2, N))
send = np.zeros((2, N))  # reverb send


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, sig, t0, gain=1.0, pan=0.0):
    """Mix a mono or stereo signal into buf at time t0 with constant-power pan."""
    i0 = int(round(t0 * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    k = min(int(0.008 * SR), sig.shape[1])  # de-click: short fade at the tail
    if k > 1:
        sig = sig.copy()
        sig[:, -k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    if i0 < 0:
        sig = sig[:, -i0:]
        i0 = 0
    n = min(sig.shape[1], N - i0)
    if n > 0:
        buf[:, i0:i0 + n] += sig[:, :n] * gain


def fft_filter(x, lo=None, hi=None, order=2):
    """Zero-phase spectral band filter with smooth (butterworth-like) slopes."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    H = np.ones_like(f)
    if hi:
        H /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        H /= np.sqrt(1 + (lo / f) ** (2 * order))
    return np.fft.irfft(X * H, len(x))


def tt(dur):
    return np.arange(int(dur * SR)) / SR


# ------------------------------------------------------------------ instruments
def ep(m, dur=0.5, vel=1.0, bright=1.0):
    """FM electric-piano / soft mallet."""
    f = mtof(m)
    t = tt(dur + 1.8)
    idx = (1.5 * bright * vel) * np.exp(-t / 0.22) + 0.12
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    if f * 14 < 16000:
        y += 0.18 * bright * np.exp(-t / 0.09) * np.sin(2 * np.pi * f * 14 * t)
    amp = np.exp(-t / 1.1) * (1 - np.exp(-t / 0.003))
    amp *= np.where(t > dur, np.exp(-(t - dur) / 0.35), 1.0)
    return y * amp * vel


def pad_note(m, dur, att=0.9, rel=1.6, bright=1.0):
    f = mtof(m)
    t = tt(dur + rel)
    y = np.zeros_like(t)
    for cents in (-8, 0, 8):
        ff = f * 2 ** (cents / 1200)
        for h in range(1, 9):
            if ff * h > 7000:
                break
            y += np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 2 * np.pi)) * (1 / h ** (1.9 - 0.4 * bright))
    env = np.clip(t / att, 0, 1) ** 2
    env *= np.where(t > dur, np.exp(-(t - dur) / (rel / 3)), 1.0)
    env *= 1 + 0.06 * np.sin(2 * np.pi * 0.25 * t + rng.uniform(0, 6))
    return y * env / 3


def kick():
    t = tt(0.55)
    f = 44 + 100 * np.exp(-t / 0.032)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.26)
    click = fft_filter(rng.normal(size=len(t)), hi=4000) * np.exp(-t / 0.0025) * 0.35
    return np.tanh(1.4 * (y + click))


def clap():
    t = tt(0.4)
    n = rng.normal(size=len(t))
    env = np.zeros_like(t)
    for d in (0, 0.009, 0.018):
        env += np.where(t >= d, np.exp(-(t - d) / 0.006), 0)
    env += np.where(t >= 0.025, np.exp(-(t - 0.025) / 0.11), 0) * 0.55
    return fft_filter(n * env, lo=900, hi=4200)


def hat(open_=False):
    t = tt(0.35 if open_ else 0.08)
    env = np.exp(-t / (0.12 if open_ else 0.022)) * (1 - np.exp(-t / 0.0006))
    return fft_filter(rng.normal(size=len(t)) * env, lo=7000, order=3)


def bass_note(m, dur):
    f = mtof(m)
    t = tt(dur + 0.08)
    y = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    env = (1 - np.exp(-t / 0.004)) * (0.65 + 0.35 * np.exp(-t / 0.08))
    env *= np.where(t > dur, np.exp(-(t - dur) / 0.02), 1.0)
    return y * env


def impact(size=1.0):
    t = tt(3.5)
    sub = np.sin(2 * np.pi * np.cumsum(32 + 46 * np.exp(-t / 0.12)) / SR) * np.exp(-t / (0.9 * size))
    body = fft_filter(rng.normal(size=len(t)), hi=1800) * np.exp(-t / 0.18) * 0.6
    air = fft_filter(rng.normal(size=len(t)), lo=5000) * np.exp(-t / 0.5) * 0.08
    return np.tanh(1.2 * (sub + body)) + air


def sweep(dur, f0, f1, shape='swell', width=0.55):
    """Band-pass filtered noise with a moving centre frequency (STFT)."""
    n = int(dur * SR)
    x = rng.normal(size=n + 2048)
    fr, hop = 2048, 512
    win = np.hanning(fr)
    out = np.zeros_like(x)
    norm = np.zeros_like(x)
    freqs = np.fft.rfftfreq(fr, 1 / SR) + 1e-9
    for s in range(0, len(x) - fr, hop):
        tc = clamp01((s + fr / 2) / n)
        fc = f0 * (f1 / f0) ** tc
        mask = np.exp(-0.5 * (np.log(freqs / fc) / width) ** 2)
        seg = np.fft.irfft(np.fft.rfft(x[s:s + fr] * win) * mask, fr)
        out[s:s + fr] += seg * win
        norm[s:s + fr] += win ** 2
    y = (out / np.maximum(norm, 1e-6))[:n]
    u = np.linspace(0, 1, n)
    if shape == 'swell':
        env = np.where(u < 0.65, (u / 0.65) ** 2, ((1 - u) / 0.35) ** 1.5)
    elif shape == 'rise':
        env = u ** 2.5
    else:
        env = np.sin(np.pi * u) ** 2
    return y * env / (np.abs(y).max() + 1e-9)


def clamp01(v):
    return min(1.0, max(0.0, v))


def tick(f=2300, g=1.0):
    t = tt(0.05)
    return g * (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.003))


def ping(m):
    t = tt(0.9)
    f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t / 0.05)) * np.exp(-t / 0.28) * (1 - np.exp(-t / 0.002))


def thud():
    t = tt(0.25)
    return np.sin(2 * np.pi * np.cumsum(90 + 80 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.06) + \
        fft_filter(rng.normal(size=len(t)), hi=900) * np.exp(-t / 0.03) * 0.5


# ------------------------------------------------------------------ harmony
CH = {
    'D': [50, 57, 61, 64, 66],    # Dmaj9
    'Bm': [47, 54, 57, 62, 64],   # Bm11
    'G': [43, 50, 54, 57, 59],    # Gmaj9 (no 3rd doubling)
    'A': [45, 52, 57, 59, 62],    # A sus2/4
}
ROOT = {'D': 38, 'Bm': 35, 'G': 31, 'A': 33}
TIMELINE = [
    (0.0, 2.4, 'D'), (2.4, 4.8, 'Bm'), (4.8, 7.2, 'G'), (7.2, 9.55, 'A'),
    (9.6, 12.0, 'D'), (12.0, 13.2, 'G'), (13.2, 14.4, 'A'),
]
for i in range(10):
    TIMELINE.append((14.4 + i * 2.4, 16.8 + i * 2.4, ['D', 'Bm', 'G', 'A'][i % 4]))
TIMELINE += [(38.4, 39.6, 'G'), (39.6, 40.8, 'A'), (40.8, 42.0, 'Bm'), (42.0, 43.2, 'G'), (43.2, 44.4, 'A'), (44.4, 48.0, 'D')]


def chord_at(t):
    for a, b, c in TIMELINE:
        if a <= t < b:
            return c
    return 'D'


# ------------------------------------------------------------------ pad bed
pad = np.zeros((2, N))
for a, b, c in TIMELINE:
    bright = 1.25 if a in (9.6, 44.4) else 1.0
    g = 0.055
    if a < 4.8:
        g = 0.05
    elif a < 9.6:
        g = 0.045
    elif 14.4 <= a < 42.0:
        g = 0.034
    for j, m in enumerate(CH[c]):
        place(pad, pad_note(m, b - a, att=0.5 if a > 0 else 1.2, bright=bright), a, g, pan=(-0.5 + j * 0.25))
    if a in (9.6, 44.4):  # shimmer octave on the reveals
        for j, m in enumerate(CH[c][2:]):
            place(pad, pad_note(m + 24, b - a, att=0.25, rel=2.5, bright=0.7), a, 0.012, pan=0.6 * (-1) ** j)
pad = np.vstack([fft_filter(pad[0], lo=110, hi=3200), fft_filter(pad[1], lo=110, hi=3200)])

# ------------------------------------------------------------------ drums + bass (groove)
drums = np.zeros((2, N))
kick_env = np.zeros(N)
K = kick()


def groove(t0, t1, intensity=1.0):
    t = t0
    step = 0
    while t < t1 - 1e-6:
        pos = step % 8  # 8th notes in a bar
        if pos in (0, 4):
            place(drums, K, t, 0.62 * intensity)
            i0 = int(t * SR)
            kick_env[i0:i0 + int(0.3 * SR)] = np.maximum(kick_env[i0:i0 + int(0.3 * SR)], np.exp(-np.arange(min(int(0.3 * SR), N - i0)) / SR / 0.09))
        if pos == 7 and (step // 8) % 2 == 1:
            place(drums, K, t + BEAT / 4, 0.35 * intensity)
        if pos in (2, 6):
            place(drums, clap(), t, 0.2 * intensity, pan=0.05)
            place(send, clap(), t, 0.05 * intensity)
        place(drums, hat(open_=(pos == 7)), t + (0.018 if pos % 2 else 0), (0.05 if pos % 2 else 0.035) * intensity, pan=0.35)
        if pos % 2 == 1:
            place(drums, hat(), t + BEAT / 4, 0.02 * intensity, pan=-0.3)
        # bass: 8th-note pulse on the root, octave pop on the last 8th
        c = chord_at(t + 0.01)
        m = ROOT[c] + (12 if pos == 7 else 0)
        place(drums, bass_note(m, BEAT / 2 * 0.82), t, 0.2 * intensity)
        t += BEAT / 2
        step += 1


groove(14.4, 38.4)
groove(38.4, 42.0, 1.08)
# chaos heartbeat: low pulse on every beat, growing
for i in range(8):
    tb = 4.8 + i * BEAT * 0.75 if i < 6 else 4.8 + 6 * BEAT * 0.75 + (i - 6) * BEAT * 0.375
    place(drums, bass_note(31 if tb < 7.2 else 33, 0.18), tb, 0.08 + 0.02 * i)
# ticking 16ths in the chaos, accelerating density
tq = 5.4
while tq < 9.45:
    place(drums, hat(), tq, 0.012 + 0.03 * (tq - 5.4) / 4.0, pan=rng.uniform(-0.6, 0.6))
    tq += BEAT / 4 if tq < 7.8 else BEAT / 8

# ------------------------------------------------------------------ melody / plucks
keys = np.zeros((2, N))


def ep_at(m, t0, dur=0.4, vel=0.6, pan=0.0, rv=0.35, bright=1.0):
    s = ep(m, dur, vel, bright)
    place(keys, s, t0, 1.0, pan)
    place(send, s, t0, rv, pan)
    # dotted-8th ping-pong echo
    place(keys, s, t0 + 0.45, 0.22, -pan - 0.4)
    place(keys, s, t0 + 0.9, 0.08, pan + 0.4)


# intro motif: lands on the words
for t0, m in [(0.35, 69), (0.7, 74), (1.3, 78), (1.95, 76), (2.95, 74), (3.3, 78), (3.85, 71)]:
    ep_at(m, t0, 0.5, 0.42, pan=rng.uniform(-0.3, 0.3), rv=0.5)
# chaos: notification pings in the current chord, high register
NOTIF_T = [4.95, 5.3, 5.6, 6.25, 6.55, 7.1, 7.4, 7.75]
for i, t0 in enumerate(NOTIF_T):
    c = chord_at(t0)
    m = CH[c][2 + i % 3] + 24
    place(keys, ping(m), t0, 0.06, pan=(-0.6, 0.5, 0.3, -0.4, -0.7, 0.6, 0.1, 0.45)[i])
    place(send, ping(m), t0, 0.03)
# reveal: rising arpeggio after the logo
for k, m in enumerate([62, 66, 69, 73, 74, 78, 81]):
    ep_at(m, 10.4 + k * 0.3, 0.45, 0.32 + 0.03 * k, pan=-0.3 + 0.1 * k, rv=0.45)
for k, m in enumerate([67, 71, 74, 76]):
    ep_at(m, 12.0 + k * 0.3, 0.45, 0.4, pan=0.2 - 0.1 * k, rv=0.45)
for k, m in enumerate([69, 71, 74, 76]):
    ep_at(m, 13.2 + k * 0.3, 0.45, 0.42, pan=-0.2 + 0.1 * k, rv=0.45)
# groove arpeggio (8ths with a 16th pickup every other bar)
PAT = [0, 2, 1, 3, 2, 4, 3, 2]
t0 = 14.4
step = 0
while t0 < 42.0 - 1e-6:
    c = chord_at(t0 + 0.01)
    tones = [n + 12 for n in CH[c][1:]] + [CH[c][1] + 24]
    m = tones[PAT[step % 8] % len(tones)]
    vel = 0.36 if step % 2 == 0 else 0.26
    if t0 >= 38.4:
        vel *= 1.12
    ep_at(m, t0, 0.22, vel, pan=0.35 * np.sin(step * 0.9), rv=0.3)
    if step % 16 == 15:
        ep_at(tones[-1], t0 + BEAT / 4, 0.15, 0.2, pan=-0.3, rv=0.3)
    t0 += BEAT / 2
    step += 1
# breakdown + final cadence
for t1, m in [(42.05, 71), (42.35, 74), (42.95, 79), (43.25, 76), (43.55, 74), (43.85, 76)]:
    ep_at(m, t1, 0.5, 0.36, pan=rng.uniform(-0.3, 0.3), rv=0.55)
for k, m in enumerate([62, 66, 69, 73, 76, 78]):
    ep_at(m, 44.4 + k * 0.09, 2.6, 0.42 - 0.02 * k, pan=-0.4 + 0.16 * k, rv=0.7, bright=0.8)
ep_at(86, 45.1, 1.2, 0.18, pan=0.4, rv=0.8)
ep_at(90, 45.7, 1.2, 0.14, pan=-0.4, rv=0.8)

# ------------------------------------------------------------------ sound design
sfx = np.zeros((2, N))


def sfx_at(sig, t0, g, pan=0.0, rv=0.25):
    place(sfx, sig, t0, g, pan)
    place(send, sig, t0, g * rv, pan)


# soft whooshes on every cut (peak lands on the cut)
for tc, d, f0, f1, g in [
    (2.6, 0.55, 500, 2600, 0.10),
    (14.75, 0.75, 250, 3000, 0.13),
    (18.0, 0.6, 400, 3000, 0.09), (21.6, 0.6, 400, 3000, 0.09), (24.6, 0.7, 350, 2800, 0.10),
    (28.2, 0.6, 400, 3000, 0.09), (31.8, 0.6, 400, 3000, 0.09), (34.8, 0.6, 400, 3000, 0.09),
    (39.3, 0.4, 600, 3500, 0.05), (40.05, 0.4, 600, 3500, 0.05), (40.8, 0.4, 600, 3500, 0.05),
    (41.55, 0.6, 500, 2600, 0.07), (43.95, 0.6, 500, 2600, 0.07),
]:
    sfx_at(sweep(d, f0, f1), tc - d * 0.65, g, pan=0.0)
# pen strikes (blue lines through words)
for ts in [3.85, 7.85, 7.97, 8.09]:
    sfx_at(sweep(0.32, 2200, 6500, 'bell', 0.35), ts, 0.05, pan=rng.uniform(-0.3, 0.3), rv=0.1)
# notebook + spreadsheet landing
sfx_at(thud(), 5.9, 0.12, -0.4)
sfx_at(thud(), 6.9, 0.12, 0.4)
# collapse: rising suck into the flash, then silence, then the reveal hit
sfx_at(sweep(0.95, 500, 7000, 'rise'), 8.6, 0.22, rv=0.15)
riser_t = tt(0.95)
sfx_at(np.sin(2 * np.pi * np.cumsum(180 * 6 ** (riser_t / 0.95)) / SR) * (riser_t / 0.95) ** 3, 8.6, 0.05, rv=0.3)
sfx_at(impact(1.3), 9.6, 0.75, rv=0.4)
sfx_at(impact(0.8), 38.4, 0.42, rv=0.3)
sfx_at(impact(1.4), 44.4, 0.6, rv=0.5)
# pre-drop riser
sfx_at(sweep(1.3, 300, 6000, 'rise'), 13.1, 0.12, rv=0.2)
sfx_at(sweep(0.9, 400, 5000, 'rise'), 43.5, 0.09, rv=0.3)
# UI: taps, typing, chimes, card pops
TAPS = [15.35, 16.6, 16.72, 16.84, 16.96, 17.15, 22.05, 28.85, 29.7, 30.1, 33.15, 36.65, 37.15]
for ta in TAPS:
    sfx_at(tick(2300 + rng.uniform(-150, 150)), ta, 0.09, pan=0.1, rv=0.05)
for k in range(12):
    sfx_at(tick(4200 + rng.uniform(-400, 400)) * 0.5, 15.95 + k * 0.05, 0.05, pan=0.15, rv=0.02)
for t1, m in [(30.6, 81), (30.72, 86)]:  # booked chime
    sfx_at(ep(m, 0.4, 0.6), t1, 0.16, rv=0.4)
for t1 in (20.6, 37.35):  # banner ding
    sfx_at(ping(88), t1, 0.06, 0.3, rv=0.3)
    sfx_at(ping(93), t1 + 0.08, 0.04, 0.3, rv=0.3)
for k, t1 in enumerate([25.15, 25.31, 25.47]):  # plan cards fly out
    sfx_at(sweep(0.35, 600 + 300 * k, 4000, 'bell', 0.4), t1, 0.06, pan=-0.3 + 0.3 * k, rv=0.2)
for k in range(7):  # calendar lights
    tl = [22.35, 22.55, 22.75, 23.5, 23.65, 23.8, 23.95][k]
    sfx_at(ping(86 + (0, 2, 4, 5, 7, 9, 11)[k]) * 0.6, tl, 0.035, pan=0.2, rv=0.4)

# ------------------------------------------------------------------ reverb
def make_ir(rt=2.4, length=3.2):
    t = tt(length)
    ir = np.zeros((2, len(t)))
    for ch in range(2):
        n = rng.normal(size=len(t))
        ir[ch] = fft_filter(n, lo=200, hi=5500) * np.exp(-6.9 * t / rt)
        ir[ch][: int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt((ir ** 2).sum() / 2)


def convolve(x, h):
    n = len(x) + len(h) - 1
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(h, nfft), nfft)[: len(x)]


IR = make_ir()
wet = np.vstack([convolve(send[0], IR[0]), convolve(send[1], IR[1])])

# ------------------------------------------------------------------ mix + master
duck = 1 - 0.45 * kick_env  # sidechain pumping on pad + keys
mix = pad * duck + keys * (1 - 0.2 * kick_env) + drums + sfx * 1.0 + wet * 0.32
mix = np.vstack([fft_filter(mix[0], lo=28), fft_filter(mix[1], lo=28)])
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(1.35 * mix) / np.tanh(1.35)
fade_in = np.clip(np.arange(N) / (0.02 * SR), 0, 1)
fade_out = np.clip((DUR - np.arange(N) / SR) / 1.4, 0, 1) ** 1.5
mix *= fade_in * fade_out
mix *= 10 ** (-1.0 / 20) / (np.abs(mix).max() + 1e-9)

out = sys.argv[1] if len(sys.argv) > 1 else 'score.wav'
pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
rms = np.sqrt((mix ** 2).mean())
print(f'wrote {out}  peak -1.0 dBFS  rms {20 * np.log10(rms):.1f} dBFS')
