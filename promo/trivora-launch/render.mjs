// Renders the film with headless Chromium.
//   node render.mjs stills <outDir> <t1> <t2> ...        -> PNG stills for review
//   node render.mjs segment <outFile> <fps> <f0> <f1>     -> frames [f0, f1) piped to ffmpeg (lossless-ish)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const [mode, out, ...rest] = process.argv.slice(2);

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
await page.goto('file://' + path.join(here, 'index.html'));
await page.evaluate(() => window.ready);
const cdp = await page.context().newCDPSession(page);

async function frame(t) {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return Buffer.from(data, 'base64');
}

if (mode === 'stills') {
  fs.mkdirSync(out, { recursive: true });
  for (const s of rest) {
    const t = parseFloat(s);
    fs.writeFileSync(path.join(out, `t_${t.toFixed(2).padStart(6, '0')}.png`), await frame(t));
  }
} else if (mode === 'segment') {
  const [fps, f0, f1] = rest.map(Number);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '8', '-pix_fmt', 'yuv444p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const buf = await frame(f / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 120 === 0) console.log(`[${path.basename(out)}] frame ${f}/${f1} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
}
await browser.close();
