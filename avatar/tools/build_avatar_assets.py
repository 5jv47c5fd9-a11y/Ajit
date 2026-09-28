#!/usr/bin/env python3
"""Build the 3D avatar assets from a single front-facing portrait.

Pipeline
  1. MediaPipe Face Landmarker   -> 478 3D face landmarks (real facial relief)
  2. MediaPipe multiclass segmenter -> hair / face / neck / clothes / glasses
  3. Colour matte against the studio background -> clean silhouette + alpha
  4. Depth synthesis: face relief from the landmarks, a rounded skull for
     hair and ears, a cylinder for the neck and a torso for the shoulders,
     blended into one smooth depth field
  5. Export a texture, a matte and a JSON grid (depth + head-rotation weight
     + facial feature positions used by the lip-sync and blink shaders)

Usage
  pip install mediapipe pillow numpy scipy opencv-python-headless
  python tools/build_avatar_assets.py path/to/photo.png [--out assets]

The two MediaPipe models are downloaded next to this script on first run.
"""
import argparse
import base64
import json
import os
import urllib.request

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.interpolate import griddata

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = {
    'face_landmarker.task': 'https://storage.googleapis.com/mediapipe-models/face_landmarker/'
                            'face_landmarker/float16/latest/face_landmarker.task',
    'selfie_multiclass.tflite': 'https://storage.googleapis.com/mediapipe-models/image_segmenter/'
                                'selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
}

# Segmentation classes of selfie_multiclass_256x256
BG, HAIR, BODY_SKIN, FACE_SKIN, CLOTHES, OTHERS = range(6)

FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
             400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
             54, 103, 67, 109]
UPPER_INNER_LIP = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]
LOWER_INNER_LIP = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]
# "A" is the eye on the left of the image, "B" the one on the right.
EYE_A = dict(corners=(33, 133), upper=[246, 161, 160, 159, 158, 157, 173], lower=[7, 163, 144, 145, 153, 154, 155], iris=468)
EYE_B = dict(corners=(362, 263), upper=[398, 384, 385, 386, 387, 388, 466], lower=[382, 381, 380, 374, 373, 390, 249], iris=473)
BROW_A = [70, 63, 105, 66, 107]
BROW_B = [336, 296, 334, 293, 300]


def ensure_models():
    paths = {}
    for name, url in MODELS.items():
        path = os.path.join(HERE, name)
        if not os.path.exists(path):
            print(f'downloading {name} ...')
            urllib.request.urlretrieve(url, path)
        paths[name] = path
    return paths


def run_mediapipe(img, models):
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision

    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img))
    landmarker = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=models['face_landmarker.task']), num_faces=1))
    faces = landmarker.detect(mp_img).face_landmarks
    landmarker.close()
    if not faces:
        raise SystemExit('No face found in the photo.')
    pts = np.array([[p.x, p.y, p.z] for p in faces[0]], dtype=np.float64)

    segmenter = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=mpt.BaseOptions(model_asset_path=models['selfie_multiclass.tflite']),
        output_category_mask=True))
    cat = np.squeeze(segmenter.segment(mp_img).category_mask.numpy_view()).astype(np.uint8)
    segmenter.close()
    return pts, cat


def blur(a, sigma):
    return ndimage.gaussian_filter(a.astype(np.float64), sigma)


def silhouette_matte(img):
    """Soft alpha for a subject shot on a plain, light studio background."""
    h, w = img.shape[:2]
    f = img.astype(np.float64)
    border = np.concatenate([f[:4].reshape(-1, 3), f[:, :4].reshape(-1, 3), f[:, -4:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((f - bg) ** 2).sum(-1))
    # Background = near-bg pixels connected to the image border (glare in the
    # lenses is near-white too, but it is enclosed by the subject).
    near = dist < 22
    lab, _ = ndimage.label(near)
    edge_labels = np.unique(np.concatenate([lab[0], lab[:, 0], lab[:, -1]]))
    edge_labels = edge_labels[edge_labels > 0]
    background = np.isin(lab, edge_labels)
    solid = ndimage.binary_fill_holes(~background)
    lab, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        solid = lab == (1 + int(np.argmax(sizes)))
    # Along the silhouette, estimate coverage by projecting each pixel onto the
    # line between the background and the nearby foreground colour: grey hair
    # tips on white become semi-transparent dark hair instead of a light fringe.
    inner = ndimage.distance_transform_edt(solid)
    core = inner > 5
    _, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True)
    fg_near = ndimage.gaussian_filter(f[iy, ix], (2, 2, 0))
    span = bg - fg_near
    cover = ((bg - f) * span).sum(-1) / np.maximum((span ** 2).sum(-1), 400.0)
    cover = np.clip((cover - 0.08) / 0.84, 0, 1)
    band = (inner <= 5) & solid
    band |= ndimage.distance_transform_edt(~solid) <= 2
    alpha = np.where(band, cover, solid.astype(np.float64))
    alpha = ndimage.gaussian_filter(alpha, 0.5)
    return alpha, solid, bg, fg_near


def decontaminate(img, alpha, bg, fg_near):
    """Remove the background colour from soft edges and bleed colour outward
    so bilinear filtering at the silhouette never picks up the background."""
    f = img.astype(np.float64)
    a = np.clip(alpha, 0.05, 1)[..., None]
    unmixed = np.clip((f - (1 - a) * bg) / a, 0, 255)
    # Faint coverage is too noisy to unmix; use the nearby foreground colour.
    w = np.clip((alpha - 0.25) / 0.4, 0, 1)[..., None]
    out = np.where((alpha < 0.999)[..., None], w * unmixed + (1 - w) * fg_near, f)
    known = alpha > 0.35
    _, (iy, ix) = ndimage.distance_transform_edt(~known, return_indices=True)
    out = np.where(known[..., None], out, out[iy, ix])
    return out.astype(np.uint8)


def fit_poly(xs, ys, cx, scale, deg=2):
    """Least-squares y = c0 + c1*d + c2*d^2 with d = (x - cx) / scale."""
    d = (np.asarray(xs) - cx) / scale
    return np.polyfit(d, ys, deg)[::-1].tolist()


def build_depth(pts, cat, solid, W, H):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    P = pts[:, :2] * [W, H]
    face_z = -pts[:, 2] * W                     # pixels, positive = towards camera

    head_mask = np.isin(cat, [HAIR, FACE_SKIN, OTHERS]) & solid
    head_mask = ndimage.binary_opening(head_mask, iterations=3)
    rows = np.where(head_mask.any(1))[0]
    top, chin_y = rows.min(), P[152, 1]

    # Skull: a slightly boxy ellipsoid fitted to the hair silhouette (above the ears).
    forehead_rows = np.arange(int(top + 0.25 * (chin_y - top)), int(top + 0.40 * (chin_y - top)))
    widths = [np.where(head_mask[r])[0] for r in forehead_rows]
    xl = np.median([w.min() for w in widths]); xr = np.median([w.max() for w in widths])
    cx, ax = (xl + xr) / 2, (xr - xl) / 2 * 1.04
    ay = (chin_y - top) / 2 * 1.02
    cy = top + ay * 0.98
    p = 2.4
    r = (np.abs((xx - cx) / ax) ** p + np.abs((yy - cy) / ay) ** p) ** (1 / p)
    skull_shape = ax * np.sqrt(np.clip(1 - r ** 2, 0, None))

    # Face relief from the landmarks, aligned to the skull along the face oval.
    oval = np.array(FACE_OVAL)
    S_oval = ndimage.map_coordinates(skull_shape, [P[oval, 1], P[oval, 0]], order=1)
    A = np.stack([S_oval, np.ones_like(S_oval)], 1)
    kz, off = np.linalg.lstsq(A, face_z[oval], rcond=None)[0]
    kz = float(np.clip(kz, 0.8, 1.6))
    off = float(np.median(face_z[oval] - kz * S_oval))
    skull = kz * skull_shape + off              # in the same frame as face_z
    # Clough-Tocher interpolation gives a smooth (C1) surface through the landmarks.
    face = griddata(P, face_z, (xx, yy), method='cubic')
    inside = ~np.isnan(face)
    _, (iy, ix) = ndimage.distance_transform_edt(~inside, return_indices=True)
    face = face[iy, ix]
    face = ndimage.gaussian_filter(face, 3.0)
    outside_dist = ndimage.distance_transform_edt(~inside)
    # Bend the skull onto the face along the oval so the hairline has no step;
    # the correction fades out over the rest of the head.
    resid = face_z[oval] - ndimage.map_coordinates(skull, [P[oval, 1], P[oval, 0]], order=1)
    resid_field = griddata(P[oval], resid, (xx, yy), method='nearest')
    resid_field = ndimage.gaussian_filter(resid_field, 25)
    skull = skull + resid_field * np.exp(-(outside_dist / (0.07 * W)) ** 2)
    # Outside the landmark hull (beard under the chin, jaw sides) the face
    # surface keeps receding instead of snapping to the skull.
    receding = face - 1.1 * outside_dist
    w_face = blur(ndimage.binary_erosion(inside, iterations=8), 8)
    head = w_face * face + (1 - w_face) * np.maximum(skull, receding)
    # Ears and hair outside the skull ellipse: keep them near the silhouette plane.
    head = np.maximum(head, off + 6)

    # Glasses frames sit in front of the eyes.
    frames = blur(cat == OTHERS, 2.0)
    head += 16 * np.clip(frames * 1.6, 0, 1)

    # Neck and torso, placed relative to the chin.
    chin_z = face_z[152]
    neck_px = np.where((cat == BODY_SKIN) & solid)
    ncx = np.median(neck_px[1]) if len(neck_px[1]) else cx
    nax = max(1.0, (np.percentile(neck_px[1], 98) - np.percentile(neck_px[1], 2)) / 2) if len(neck_px[1]) else ax * 0.8
    neck = (chin_z - 120) + 0.55 * nax * (np.sqrt(np.clip(1 - ((xx - ncx) / (nax * 1.05)) ** 2, 0, None)) - 1)
    tax = 0.62 * W
    torso = (chin_z - 110) + 0.45 * tax * (np.sqrt(np.clip(1 - ((xx - ncx) / tax) ** 2, 0, None)) - 1)
    # Round the body off towards its silhouette so the shoulders roll back.
    R = 0.08 * W
    edge = np.minimum(ndimage.distance_transform_edt(solid), R)
    edge[:, :2] = R; edge[:, -2:] = R; edge[-2:, :] = R   # the frame cuts the body, it has no edge there
    edge = ndimage.gaussian_filter(edge, 4)
    roll = R - np.sqrt(np.clip(R ** 2 - (R - edge) ** 2, 0, None))
    torso -= roll
    neck -= 0.5 * roll

    w_head = blur(head_mask | inside, 5)
    w_neck = blur((cat == BODY_SKIN) & solid, 5)
    w_body = blur(((cat == CLOTHES) | (cat == BG)) & solid, 5)
    wsum = w_head + w_neck + w_body + 1e-6
    depth = (w_head * head + w_neck * neck + w_body * torso) / wsum
    # Anything not covered by a class (tiny gaps) falls back to the nearest value.
    known = wsum > 0.05
    _, (iy, ix) = ndimage.distance_transform_edt(~known, return_indices=True)
    depth = np.where(known, depth, depth[iy, ix])
    depth = ndimage.gaussian_filter(depth, 1.5)
    depth -= off                                # skull silhouette plane = 0

    # How much each point follows the head when it turns: 1 on the head,
    # fading down the neck to 0 at the collar.
    neck_ramp = np.clip((P[152, 1] + 0.09 * H - yy) / (0.09 * H), 0, 1)
    rot = np.clip(blur(head_mask | inside, 6) + w_neck * neck_ramp, 0, 1)
    rot = blur(rot, 14)
    info = dict(skull=dict(cx=cx, cy=cy, ax=ax, ay=ay, kz=kz), chin_z=float(chin_z - off))
    return depth, rot, info


def frame_above_eye(img, pts, spec, W, H):
    """y (normalised) of the lower edge of the glasses' top bar above an eye,
    so blinking never drags the frame. Falls back to a lid-relative guess."""
    lum = img.astype(np.float64) @ [0.299, 0.587, 0.114]
    c0, c1 = pts[spec['corners'][0], :2], pts[spec['corners'][1], :2]
    lid_y = pts[spec['upper'], 1].min() * H
    hits = []
    for t in np.linspace(0.3, 0.7, 9):
        x = int(round((c0[0] + (c1[0] - c0[0]) * t) * W))
        y = int(lid_y) - 5
        while y > lid_y - 0.06 * H:
            if (lum[y - 3:y + 1, x] < 55).all():
                hits.append(y + 1)
                break
            y -= 1
    y = np.median(hits) if hits else lid_y - 0.02 * H
    return round(float(y / H), 5)


def features(pts, W, H, img):
    P = pts[:, :2]
    def pt(i):
        return [round(float(P[i, 0]), 5), round(float(P[i, 1]), 5)]

    mouth_l, mouth_r = P[61], P[291]
    mcx = (mouth_l[0] + mouth_r[0]) / 2
    mhw = abs(mouth_r[0] - mouth_l[0]) / 2
    lip_idx = sorted(set(UPPER_INNER_LIP + LOWER_INNER_LIP))
    lip = fit_poly(P[lip_idx, 0], P[lip_idx, 1], mcx, mhw)

    def eye(spec):
        c0, c1 = P[spec['corners'][0]], P[spec['corners'][1]]
        ecx, hw = (c0[0] + c1[0]) / 2, abs(c1[0] - c0[0]) / 2
        up = [spec['corners'][0]] + spec['upper'] + [spec['corners'][1]]
        lo = [spec['corners'][0]] + spec['lower'] + [spec['corners'][1]]
        return dict(center=[round(ecx, 5), round((c0[1] + c1[1]) / 2, 5)], halfWidth=round(hw, 5),
                    upper=fit_poly(P[up, 0], P[up, 1], ecx, hw), lower=fit_poly(P[lo, 0], P[lo, 1], ecx, hw),
                    iris=pt(spec['iris']), frameY=frame_above_eye(img, pts, spec, W, H))

    def brow(idx):
        return dict(center=[float(P[idx, 0].mean()), float(P[idx, 1].mean())],
                    halfWidth=float((P[idx, 0].max() - P[idx, 0].min()) / 2))

    return dict(
        mouth=dict(cornerL=pt(61), cornerR=pt(291), center=[round(mcx, 5), round(float(P[[13, 14], 1].mean()), 5)],
                   halfWidth=round(mhw, 5), lipLine=lip, upperOuter=pt(0), lowerOuter=pt(17),
                   noseBase=pt(2), chin=pt(152),
                   jawHalfWidth=round(float(abs(P[379, 0] - P[150, 0]) / 2), 5)),
        eyeA=eye(EYE_A), eyeB=eye(EYE_B), browA=brow(BROW_A), browB=brow(BROW_B),
        noseTip=pt(1), forehead=pt(10),
        faceCenter=[round(float(P[FACE_OVAL, 0].mean()), 5), round(float(P[FACE_OVAL, 1].mean()), 5)],
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('photo')
    ap.add_argument('--out', default=os.path.join(HERE, '..', 'assets'))
    ap.add_argument('--grid', type=int, default=256, help='mesh cells per side')
    ap.add_argument('--name', default='ajit')
    args = ap.parse_args()

    img = np.array(Image.open(args.photo).convert('RGB'))
    H, W = img.shape[:2]
    pts, cat = run_mediapipe(img, ensure_models())
    alpha, solid, bg, fg_near = silhouette_matte(img)
    albedo = decontaminate(img, alpha, bg, fg_near)
    depth, rot, info = build_depth(pts, cat, solid, W, H)

    n = args.grid + 1
    gy, gx = np.mgrid[0:n, 0:n] / args.grid
    coords = [gy * (H - 1), gx * (W - 1)]
    d = ndimage.map_coordinates(depth, coords, order=1)
    rw = ndimage.map_coordinates(rot, coords, order=1)
    d_min, d_max = float(d.min()), float(d.max())
    d_q = np.round((d - d_min) / (d_max - d_min) * 65535).astype('<u2')
    r_q = np.round(np.clip(rw, 0, 1) * 255).astype(np.uint8)

    os.makedirs(args.out, exist_ok=True)
    Image.fromarray(albedo).save(os.path.join(args.out, f'{args.name}-albedo.jpg'), quality=93, subsampling=0)
    Image.fromarray(np.round(alpha * 255).astype(np.uint8)).save(os.path.join(args.out, f'{args.name}-matte.png'), optimize=True)

    data = dict(
        version=1,
        image=dict(width=W, height=H),
        grid=dict(size=n, depthMin=round(d_min, 3), depthMax=round(d_max, 3), depthUnits='pixels',
                  depth=base64.b64encode(d_q.tobytes()).decode(), rotation=base64.b64encode(r_q.tobytes()).decode()),
        features=features(pts, W, H, img),
        # Neck joint the head turns around: between ear level and chin, just
        # behind the skull's silhouette plane (z is in pixels, like depth).
        pivot=dict(x=round(float(info['skull']['cx'] / W), 5),
                   y=round(float((pts[234, 1] + pts[454, 1]) / 4 + pts[152, 1] / 2), 5), z=-0.03 * W),
        build=dict(skull={k: round(float(v), 3) for k, v in info['skull'].items()}),
    )
    with open(os.path.join(args.out, f'{args.name}-avatar.json'), 'w') as fh:
        json.dump(data, fh, separators=(',', ':'))
    print(f'depth range {d_min:.1f}..{d_max:.1f}px  skull kz={info["skull"]["kz"]:.2f}  wrote {args.out}')


if __name__ == '__main__':
    main()
