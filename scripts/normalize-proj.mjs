// Normalize the 6x1 projectile flicker/lifecycle sheets: green removal +
// despill only (frames are centre-designed already), kept at 256px cells.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const kind = process.argv[2];
if (!kind) throw new Error("Usage: node scripts/normalize-proj.mjs <proj_fire|proj_dark>");
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = PNG.sync.read(fs.readFileSync(path.join(repoRoot, `survivor/assets/incoming/${kind}/${kind}-greenscreen.png`)));
const out = new PNG({ width: src.width, height: src.height });
function px(x, y) { const i = (y * src.width + x) << 2; return [src.data[i], src.data[i + 1], src.data[i + 2]]; }
const corners = [px(2, 2), px(src.width - 3, 2), px(2, src.height - 3), px(src.width - 3, src.height - 3)];
const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, p) => s + p[c], 0) / corners.length));
let solid = 0, matte = 0;
for (let y = 0; y < src.height; y++) {
  for (let x = 0; x < src.width; x++) {
    let [r, g, b] = px(x, y);
    const i = (y * out.width + x) << 2;
    const isM = Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < 110 || (g > 100 && g > r + 55 && g > b + 55);
    if (isM) { out.data[i + 3] = 0; continue; }
    const rb = (r + b) / 2;
    if (g > rb + 26) g = Math.round(rb + (g - rb) * 0.4);
    out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b; out.data[i + 3] = 255;
    solid++;
    if (g > r + 40 && g > b + 40) matte++;
  }
}
fs.writeFileSync(path.join(repoRoot, `survivor/assets/${kind}.png`), PNG.sync.write(out));
console.log(JSON.stringify({ ok: true, kind, matteResidualRatio: Number((solid ? matte / solid : 0).toFixed(4)) }));
