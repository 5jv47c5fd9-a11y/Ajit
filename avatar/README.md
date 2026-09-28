# Ajit: talking 3D avatar for ajit.business

A photo-real 3D version of Ajit, built from one portrait. It turns to follow
the visitor's cursor, breathes, blinks and speaks about ajit.business with
lip-sync and live captions. It's a static page with no build step and no
external requests (three.js is vendored), so it can be dropped into any site.

```
avatar/
  index.html                 page (hero section for ajit.business)
  styles.css
  src/script.js              ← WHAT THE AVATAR SAYS: edit this
  src/main.js                page wiring: topics, captions, voice picker
  src/avatar-renderer.js     three.js scene: depth mesh, head motion, blinks
  src/shaders.js             photo warping for lips/jaw/eyelids + relighting
  src/speech.js              speech synthesis, word timing, recorded-audio mode
  src/visemes.js             text → mouth shapes
  assets/ajit-*.{jpg,png,json}  generated from the photo (see below)
  tools/build_avatar_assets.py  regenerates the assets from a new photo
  vendor/three.module.min.js    three.js r186 (MIT)
```

## Run it

Browsers only load ES modules over HTTP, so serve the folder:

```bash
cd avatar && python3 -m http.server 8080   # then open http://localhost:8080
```

## Change what it says

Edit `src/script.js`. Each entry in `SEGMENTS` becomes a topic button; the
first is the intro. `PRONOUNCE` fixes names the browser voice gets wrong
("Ajit" is spoken as "Ajeet"), and `VOICE.preferences` picks the voice.

**Your own voice:** record a segment (mp3/m4a/wav), put it in
`assets/voice/`, and add `audio: 'assets/voice/intro.mp3'` to that segment.
The lips then follow the real audio and `text` is used for the captions. A
cloned voice from a TTS service works the same way.

## Put it on ajit.business

- **Whole page:** upload the `avatar/` folder and link to it, or use
  `index.html` as the landing page.
- **Just the talking head:** embed it inside an existing page:

  ```html
  <iframe src="/avatar/?embed" title="Ajit's 3D avatar" allow="autoplay"
          style="width:100%;max-width:560px;aspect-ratio:1;border:0;border-radius:24px"></iframe>
  ```

## How it works

1. **Reconstruction** (`tools/build_avatar_assets.py`, runs once offline).
   MediaPipe Face Landmarker finds 478 3D landmarks, which give the real
   relief of the face (nose, lips, brow, jaw). A multiclass segmenter
   separates hair, face, neck, clothes and glasses. These are combined into
   one smooth depth map: face relief from the landmarks, a rounded skull for
   hair and ears, a cylinder for the neck, a torso for the shoulders, and the
   glasses frames raised off the face. A colour matte cuts the portrait from
   the studio background, and edge colours are unmixed so no white halo
   survives against the new backdrop.
2. **Rendering.** The photo is projected onto a 257×257 mesh displaced by
   that depth. The head part of the mesh turns around a neck pivot and is
   relit relative to the photo's own lighting, so turning the head gives
   genuine parallax and shading instead of a flat card.
3. **Animation.** Mouth and eyelids are animated by warping where the shader
   samples the photo, so the real lips, beard and eyelids move: the jaw drops
   and reveals a mouth interior (teeth, tongue), the corners spread or round
   per viseme, and the upper lid slides down without touching the glasses.
4. **Speech.** The browser's speech synthesis speaks sentence by sentence.
   Word-boundary events (or a self-calibrating estimate for voices without
   them) keep the visemes and captions in sync. With no voice installed, the
   avatar still lip-syncs with captions only.

## Rebuild from a new photo

Use a sharp, front-facing head-and-shoulders portrait on a plain light
background.

```bash
pip install mediapipe pillow numpy scipy opencv-python-headless
python tools/build_avatar_assets.py path/to/photo.png   # writes assets/ajit-*
```

The MediaPipe models (~20 MB) are downloaded into `tools/` on first run and
are not committed.
