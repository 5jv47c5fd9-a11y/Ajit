# Trivora — Launch Film

A 48-second vertical (1080×1920, 30 fps) launch film for Trivora, the studio
booking app. It's styled like an Apple product launch: black and off-white
stages, large tight headlines, one brand colour, a real iPhone showing the
product, and every movement on eased timing.

`Trivora_Launch_Film.mp4` is the finished film with sound.
`Trivora_Launch_Film_no_music.mp4` has no music, for adding a trending
Instagram sound in the app.

## Story

| Time | Beat | On screen |
|---|---|---|
| 0–4.8s | Problem | "You started your studio to teach." → "Not to chase admin." (blue strike) |
| 4.8–9.6s | Chaos | Group-chat notifications, notebook, spreadsheet pile up, get struck through, collapse into a point of light |
| 9.6–14.4s | Reveal | Trivora icon + wordmark → "Your entire studio. In one app." |
| 14.4s | Drop | Hard cut to light stage on the beat, iPhone rises in |
| 14.4–18s | Feature 1 | "Create sessions. In seconds." — new-session sheet, typing, capacity stepper |
| 18–21.6s | Feature 2 | "When it's full, waitlists kick in." — capacity ring fills, waitlist auto-promotes |
| 21.6–24.6s | Feature 3 | "Repeat every week. Set it once." — Tuesdays light up across two months |
| 24.6–28.2s | Feature 4 | "Sell memberships. And credit packs." — plan cards float out of the phone in 3D |
| 28.2–31.8s | Feature 5 | "Clients book their own spots." — client books with a credit |
| 31.8–34.8s | Feature 6 | "Every trainer. Their own login." — team list → trainer's own view |
| 34.8–38.4s | Feature 7 | "Track every sale. Export anytime." — sales dashboard → Excel export |
| 38.4–42s | Audience | "Built for Fitness. Yoga. Dance. Coaching." |
| 42–44.4s | Promise | "Trivora fits the way you teach." |
| 44.4–48s | Call to action | Logo lockup · Owners. Trainers. Clients. · Comment "DEMO" · iOS and Android |

## Design system

- **Type:** Inter Display (headlines, −3.5% tracking) and Inter (app UI): the
  closest open-source match to SF Pro.
- **Colour:** `#000000` / `#F5F5F7` stages, `#1D1D1F` / `#86868B` text, one
  accent `#1497EB` taken from the Trivora icon. Muted category tones
  (sage, clay, rose, sky, sand) appear only inside the app UI and on the
  "Built for" words.
- **Motion:** word-by-word blur-rise reveals (quintic ease-out), clean
  out-then-in headline handoffs, iOS-style springs inside the phone,
  cuts on the beat.
- **Sound:** original score synthesised in `score.py` (100 BPM, D major), with
  effects synced to every cut, tap and transition. No samples, no licences.

## Rebuild

Requires Node with Playwright/Chromium, Python 3 with numpy, and ffmpeg.

```bash
./build.sh                  # renders out/master60.mp4, out/score.wav and the final MP4s
node render.mjs stills /tmp/stills 12.9 26 47.5   # preview single frames
```

Every frame is a pure function of time (`window.renderFrame(t)` in `main.js`),
so the render is deterministic. To change the copy, edit the strings in
`main.js`; to retime, edit the times next to them and the matching cues in
`score.py`.
