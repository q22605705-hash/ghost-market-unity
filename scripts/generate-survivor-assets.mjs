import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const rawDir = path.join(root, "survivor", "assets", "raw");
const outDir = path.join(root, "survivor", "assets");
fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const scale = 4;
const cell = 32;
const rows = 6;
const cols = 12;
const width = cols * cell * scale;
const height = rows * cell * scale;
const green = [0, 255, 0, 255];
const raw = new PNG({ width, height });

for (let i = 0; i < raw.data.length; i += 4) {
  raw.data[i] = green[0];
  raw.data[i + 1] = green[1];
  raw.data[i + 2] = green[2];
  raw.data[i + 3] = green[3];
}

function px(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (Math.floor(y) * width + Math.floor(x)) * 4;
  raw.data[i] = color[0];
  raw.data[i + 1] = color[1];
  raw.data[i + 2] = color[2];
  raw.data[i + 3] = color[3] ?? 255;
}

function rect(cx, cy, x, y, w, h, color) {
  for (let yy = y * scale; yy < (y + h) * scale; yy++) {
    for (let xx = x * scale; xx < (x + w) * scale; xx++) px(cx + xx, cy + yy, color);
  }
}

function cellOrigin(col, row) {
  return [col * cell * scale, row * cell * scale];
}

const c = {
  ink: [20, 20, 28, 255],
  cloak: [32, 35, 52, 255],
  scarf: [42, 180, 210, 255],
  skin: [226, 174, 124, 255],
  blade: [220, 240, 230, 255],
  gold: [242, 196, 70, 255],
  ghoul: [62, 70, 76, 255],
  ghoulHi: [90, 108, 110, 255],
  mage: [116, 31, 42, 255],
  fire: [255, 102, 20, 255],
  brute: [116, 89, 68, 255],
  soul: [90, 245, 220, 255],
  white: [245, 248, 230, 255],
  shadow: [0, 0, 0, 120]
};

function drawHero(col, row, run = false) {
  const [ox, oy] = cellOrigin(col, row);
  const bob = run ? (col % 4 < 2 ? 1 : -1) : (col % 6 < 3 ? 0 : 1);
  rect(ox, oy, 10, 25, 12, 2, c.shadow);
  rect(ox, oy, 12, 7 + bob, 9, 9, c.ink);
  rect(ox, oy, 11, 14 + bob, 12, 10, c.cloak);
  rect(ox, oy, 14, 10 + bob, 5, 4, c.skin);
  rect(ox, oy, 9, 15 + bob, 12, 3, c.scarf);
  rect(ox, oy, 13, 24, 3, 5, c.ink);
  rect(ox, oy, 19, 24, 3, 5, c.ink);
  rect(ox, oy, 21, 17 + bob, 7, 2, c.blade);
  rect(ox, oy, 25, 15 + bob, 2, 2, c.white);
  rect(ox, oy, 9, 18 + bob, 3, 7, c.gold);
}

function drawGhoul(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const crawl = col % 4;
  rect(ox, oy, 6, 25, 20, 2, c.shadow);
  rect(ox, oy, 8 + crawl % 2, 17, 17, 8, c.ghoul);
  rect(ox, oy, 19, 12, 7, 7, c.ghoulHi);
  rect(ox, oy, 22, 15, 2, 2, c.soul);
  rect(ox, oy, 7, 24, 6, 3, c.ghoul);
  rect(ox, oy, 18, 24, 8, 3, c.ghoul);
}

function drawMage(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const cast = col % 6 > 2;
  rect(ox, oy, 9, 26, 13, 2, c.shadow);
  rect(ox, oy, 10, 11, 13, 16, c.mage);
  rect(ox, oy, 12, 8, 9, 6, c.ink);
  rect(ox, oy, 15, 13, 4, 3, c.fire);
  rect(ox, oy, cast ? 23 : 7, 13, 3, 12, c.gold);
  rect(ox, oy, cast ? 26 : 4, 10, 3, 5, c.fire);
  rect(ox, oy, 14, 27, 7, 2, c.ink);
}

function drawBrute(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const swing = col % 6 > 2;
  rect(ox, oy, 7, 27, 20, 2, c.shadow);
  rect(ox, oy, 9, 10, 15, 18, c.brute);
  rect(ox, oy, 11, 6, 11, 8, c.white);
  rect(ox, oy, 9, 5, 3, 5, c.gold);
  rect(ox, oy, 21, 5, 3, 5, c.gold);
  rect(ox, oy, 13, 10, 2, 2, c.ink);
  rect(ox, oy, 19, 10, 2, 2, c.ink);
  rect(ox, oy, swing ? 23 : 4, 15, 5, 13, c.ink);
  rect(ox, oy, swing ? 27 : 1, 13, 3, 12, c.gold);
}

function drawSoul(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const pulse = col % 4;
  rect(ox, oy, 13, 12 - (pulse === 1 ? 1 : 0), 7, 11, c.soul);
  rect(ox, oy, 15, 8, 3, 4, c.white);
  rect(ox, oy, 11, 16, 3, 5, [36, 165, 190, 255]);
}

function drawFire(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const tail = col % 5;
  rect(ox, oy, 11 + tail, 13, 11, 6, c.fire);
  rect(ox, oy, 16 + tail, 15, 8, 4, [255, 212, 70, 255]);
  rect(ox, oy, 7, 15, 7 + tail, 2, [184, 42, 22, 255]);
}

for (let i = 0; i < cols; i++) {
  drawHero(i, 0, false);
  drawHero(i, 1, true);
  drawGhoul(i, 2);
  drawMage(i, 3);
  drawBrute(i, 4);
  if (i < 6) drawSoul(i, 5);
  else drawFire(i, 5);
}

const rawPath = path.join(rawDir, "gpt-pixel-survivor-greenscreen.png");
fs.writeFileSync(rawPath, PNG.sync.write(raw));

const keyed = PNG.sync.read(fs.readFileSync(rawPath));
for (let i = 0; i < keyed.data.length; i += 4) {
  const r = keyed.data[i];
  const g = keyed.data[i + 1];
  const b = keyed.data[i + 2];
  if (g > 190 && r < 90 && b < 90) keyed.data[i + 3] = 0;
}

fs.writeFileSync(path.join(outDir, "survivor-sprites.png"), PNG.sync.write(keyed));

const meta = {
  source: "GPT pixel-art green-screen sheet, processed by local Luma Key",
  raw: "assets/raw/gpt-pixel-survivor-greenscreen.png",
  texture: "assets/survivor-sprites.png",
  cell: cell * scale,
  rows: {
    heroIdle: 0,
    heroRun: 1,
    ghoul: 2,
    mage: 3,
    brute: 4,
    soulAndFire: 5
  },
  columns: cols
};
fs.writeFileSync(path.join(outDir, "survivor-art.json"), JSON.stringify(meta, null, 2));
console.log(`generated ${rawPath}`);
