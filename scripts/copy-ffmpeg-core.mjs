#!/usr/bin/env node
// Copies single-thread ESM ffmpeg-core into public/ so it's served same-origin.
//
// Why single-thread + ESM:
//   - The main FFmpeg worker is `type: "module"`, so it uses dynamic import()
//     (importScripts is unavailable). That requires ESM (with `export default`).
//   - Multi-thread mode spawns classic pthread workers that use importScripts(),
//     which can ONLY load UMD. Same file can't be both — so MT is incompatible
//     with the ffmpeg.wasm 0.12.x module-worker design on Vite. ST has no pthread
//     workers, so ESM works end-to-end.
//
// Why public/ + blob URL via toBlobURL:
//   - Vite's dev server rejects dynamic import() of files inside /public/.
//   - We fetch the file (Vite serves static), wrap in a Blob, and pass a blob:
//     URL to ffmpeg.load(). Blob URLs bypass Vite's transform pipeline.

import { mkdir, cp, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const dest = join(ROOT, "public", "ffmpeg");
const src = join(ROOT, "node_modules", "@ffmpeg", "core", "dist", "esm");
const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

try {
  await access(src);
} catch {
  console.warn(`[copy-ffmpeg-core] skipping ${src} (not installed)`);
  process.exit(0);
}

await mkdir(dest, { recursive: true });
for (const file of files) {
  await cp(join(src, file), join(dest, file));
}
console.log(`[copy-ffmpeg-core] -> ${dest}`);
