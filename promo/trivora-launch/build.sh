#!/usr/bin/env bash
# Renders the Trivora launch film.
#   ./build.sh            -> out/master60.mkv (60 fps intermediate) + final MP4s
set -euo pipefail
cd "$(dirname "$0")"
OUT=${OUT:-out}
FPS=60
DUR=48
WORKERS=${WORKERS:-4}
mkdir -p "$OUT"

if [ "${SKIP_VIDEO:-0}" != "1" ]; then
  N=$((FPS * DUR))
  PER=$(( (N + WORKERS - 1) / WORKERS ))
  : > "$OUT/segments.txt"
  for i in $(seq 0 $((WORKERS - 1))); do
    F0=$((i * PER)); F1=$(( (i + 1) * PER )); [ "$F1" -gt "$N" ] && F1=$N
    node render.mjs segment "$OUT/seg_$i.mp4" "$FPS" "$F0" "$F1" &
    echo "file 'seg_$i.mp4'" >> "$OUT/segments.txt"
  done
  wait
  ffmpeg -v error -y -f concat -safe 0 -i "$OUT/segments.txt" -c copy "$OUT/master60.mp4"
fi

# Soundtrack (original score, synthesized)
python3 -I score.py "$OUT/score.wav"

# Final: 30 fps, crisp (every other frame of the 60 fps master)
VF="fps=30,format=yuv420p"
ENC=(-c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -movflags +faststart -color_primaries bt709 -color_trc bt709 -colorspace bt709)
ffmpeg -v error -y -i "$OUT/master60.mp4" -i "$OUT/score.wav" -vf "$VF" "${ENC[@]}" -c:a aac -b:a 256k -shortest "$OUT/Trivora_Launch_Film.mp4"
ffmpeg -v error -y -i "$OUT/master60.mp4" -vf "$VF" "${ENC[@]}" -an "$OUT/Trivora_Launch_Film_no_music.mp4"
echo "done -> $OUT"
