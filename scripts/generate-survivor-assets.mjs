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
const rows = 8;
const cols = 12;
const spriteSize = cell * scale;
const width = cols * spriteSize;
const height = rows * spriteSize;
const GREEN = [0, 255, 0, 255];
const raw = new PNG({ width, height });

for (let i = 0; i < raw.data.length; i += 4) {
  raw.data[i] = GREEN[0];
  raw.data[i + 1] = GREEN[1];
  raw.data[i + 2] = GREEN[2];
  raw.data[i + 3] = GREEN[3];
}

const c = {
  ink: [12, 14, 22, 255],
  outline: [3, 6, 10, 255],
  shadow: [0, 0, 0, 150],
  skin: [231, 181, 124, 255],
  hair: [70, 42, 27, 255],
  scarf: [53, 223, 219, 255],
  robe: [22, 32, 58, 255],
  robe2: [42, 61, 95, 255],
  paper: [250, 238, 190, 255],
  charmRed: [207, 45, 54, 255],
  charmGold: [247, 186, 56, 255],
  blade: [229, 252, 244, 255],
  bladeBlue: [97, 239, 226, 255],
  ghoul: [63, 83, 80, 255],
  ghoul2: [94, 123, 116, 255],
  ghoulEye: [112, 255, 223, 255],
  mage: [94, 24, 43, 255],
  mage2: [139, 42, 55, 255],
  brute: [123, 86, 56, 255],
  brute2: [177, 126, 75, 255],
  bone: [238, 232, 195, 255],
  soul: [77, 255, 222, 255],
  soul2: [29, 156, 211, 255],
  fire: [255, 78, 21, 255],
  fire2: [255, 196, 51, 255],
  ember: [172, 31, 26, 255],
  white: [255, 255, 241, 255]
};

function setPx(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (Math.floor(y) * width + Math.floor(x)) * 4;
  raw.data[i] = color[0];
  raw.data[i + 1] = color[1];
  raw.data[i + 2] = color[2];
  raw.data[i + 3] = color[3] ?? 255;
}

function rect(ox, oy, x, y, w, h, color) {
  for (let yy = y * scale; yy < (y + h) * scale; yy++) {
    for (let xx = x * scale; xx < (x + w) * scale; xx++) setPx(ox + xx, oy + yy, color);
  }
}

function cellOrigin(col, row) {
  return [col * spriteSize, row * spriteSize];
}

function drawHero(col, row, moving) {
  const [ox, oy] = cellOrigin(col, row);
  const bob = moving ? (col % 4 < 2 ? 1 : -1) : (col % 6 < 3 ? 0 : 1);
  const leg = moving ? (col % 4 < 2 ? 1 : -1) : 0;
  rect(ox, oy, 7, 27, 19, 3, c.shadow);
  rect(ox, oy, 11, 6 + bob, 11, 10, c.outline);
  rect(ox, oy, 13, 7 + bob, 7, 7, c.skin);
  rect(ox, oy, 12, 5 + bob, 9, 4, c.hair);
  rect(ox, oy, 9, 14 + bob, 15, 12, c.outline);
  rect(ox, oy, 10, 15 + bob, 13, 10, c.robe);
  rect(ox, oy, 10, 16 + bob, 14, 3, c.scarf);
  rect(ox, oy, 9, 19 + bob, 4, 8, c.charmGold);
  rect(ox, oy, 14 + leg, 25, 4, 5, c.outline);
  rect(ox, oy, 20 - leg, 25, 4, 5, c.outline);
  rect(ox, oy, 22, 17 + bob, 7, 3, c.blade);
  rect(ox, oy, 27, 16 + bob, 2, 2, c.white);
}

function drawGhoul(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const crawl = col % 4 < 2 ? 0 : 1;
  rect(ox, oy, 5, 27, 21, 3, c.shadow);
  rect(ox, oy, 6 + crawl, 18, 20, 8, c.outline);
  rect(ox, oy, 7 + crawl, 17, 18, 8, c.ghoul);
  rect(ox, oy, 18 + crawl, 11, 8, 8, c.outline);
  rect(ox, oy, 19 + crawl, 12, 6, 6, c.ghoul2);
  rect(ox, oy, 22 + crawl, 14, 2, 2, c.ghoulEye);
  rect(ox, oy, 5, 25, 7, 3, c.outline);
  rect(ox, oy, 18, 25, 9, 3, c.outline);
}

function drawMage(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const cast = col % 6 > 2;
  rect(ox, oy, 8, 28, 17, 2, c.shadow);
  rect(ox, oy, 10, 8, 14, 20, c.outline);
  rect(ox, oy, 11, 12, 12, 15, c.mage);
  rect(ox, oy, 12, 7, 10, 6, c.ink);
  rect(ox, oy, 14, 13, 5, 3, c.fire2);
  rect(ox, oy, cast ? 23 : 6, 13, 4, 13, c.charmGold);
  rect(ox, oy, cast ? 26 : 3, 9, 4, 6, c.fire);
  rect(ox, oy, cast ? 27 : 4, 11, 2, 2, c.fire2);
}

function drawBrute(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const step = col % 4 < 2 ? 0 : 1;
  rect(ox, oy, 6, 28, 22, 2, c.shadow);
  rect(ox, oy, 8, 10, 18, 18, c.outline);
  rect(ox, oy, 10, 12, 14, 15, c.brute);
  rect(ox, oy, 11, 6, 12, 8, c.outline);
  rect(ox, oy, 12, 7, 10, 6, c.bone);
  rect(ox, oy, 9, 5, 4, 6, c.brute2);
  rect(ox, oy, 22, 5, 4, 6, c.brute2);
  rect(ox, oy, 14, 10, 2, 2, c.ink);
  rect(ox, oy, 20, 10, 2, 2, c.ink);
  rect(ox, oy, 7 + step, 16, 4, 12, c.brute2);
  rect(ox, oy, 25 - step, 16, 4, 12, c.brute2);
}

function drawSoul(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const pulse = col % 4 === 1 ? -1 : 0;
  rect(ox, oy, 12, 24, 8, 2, c.shadow);
  rect(ox, oy, 12, 13 + pulse, 9, 12, c.soul2);
  rect(ox, oy, 14, 10 + pulse, 6, 14, c.soul);
  rect(ox, oy, 16, 6 + pulse, 3, 5, c.white);
  rect(ox, oy, 20, 15 + pulse, 2, 5, c.white);
}

function drawFire(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const tail = col % 4;
  rect(ox, oy, 8, 16, 10 + tail, 3, c.ember);
  rect(ox, oy, 14, 13, 10, 7, c.fire);
  rect(ox, oy, 19, 15, 7, 4, c.fire2);
  rect(ox, oy, 23, 16, 3, 2, c.white);
}

function drawTalisman(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const tilt = col % 3;
  rect(ox, oy, 8 + tilt, 15, 18, 8, c.shadow);
  rect(ox, oy, 10 + tilt, 12, 17, 9, c.charmRed);
  rect(ox, oy, 12 + tilt, 13, 13, 7, c.paper);
  rect(ox, oy, 15 + tilt, 15, 6, 2, c.charmRed);
  rect(ox, oy, 24 + tilt, 14, 5, 4, c.scarf);
}

function drawBlade(col, row) {
  const [ox, oy] = cellOrigin(col, row);
  const shine = col % 4 < 2;
  rect(ox, oy, 7, 18, 18, 4, c.shadow);
  rect(ox, oy, 8, 13, 20, 5, c.outline);
  rect(ox, oy, 10, 12, 18, 4, c.blade);
  rect(ox, oy, 18, 11, 9, 3, shine ? c.white : c.bladeBlue);
  rect(ox, oy, 6, 15, 7, 5, c.charmGold);
  rect(ox, oy, 4, 16, 4, 3, c.charmRed);
}

for (let i = 0; i < cols; i++) {
  drawHero(i, 0, false);
  drawHero(i, 1, true);
  drawGhoul(i, 2);
  drawMage(i, 3);
  drawBrute(i, 4);
  drawSoul(i, 5);
  drawFire(i, 6);
  if (i < 6) drawTalisman(i, 7);
  else drawBlade(i, 7);
}

const rawPath = path.join(rawDir, "gpt-pixel-survivor-greenscreen.png");
fs.writeFileSync(rawPath, PNG.sync.write(raw));

const keyed = PNG.sync.read(fs.readFileSync(rawPath));
let transparent = 0;
let greenOpaque = 0;
for (let i = 0; i < keyed.data.length; i += 4) {
  const r = keyed.data[i];
  const g = keyed.data[i + 1];
  const b = keyed.data[i + 2];
  if (g > 190 && r < 90 && b < 90) keyed.data[i + 3] = 0;
  if (keyed.data[i + 3] === 0) transparent++;
  if (keyed.data[i + 3] > 0 && g > 190 && r < 90 && b < 90) greenOpaque++;
}

fs.writeFileSync(path.join(outDir, "survivor-sprites.png"), PNG.sync.write(keyed));

const meta = {
  source: "GPT pixel-art green-screen sheet, processed by local Luma Key",
  raw: "assets/raw/gpt-pixel-survivor-greenscreen.png",
  texture: "assets/survivor-sprites.png",
  cell: spriteSize,
  columns: cols,
  rows: {
    heroIdle: 0,
    heroRun: 1,
    ghoul: 2,
    mage: 3,
    brute: 4,
    soul: 5,
    enemyFire: 6,
    talismanAndBlade: 7
  },
  verification: {
    transparentPixels: transparent,
    opaqueGreenPixels: greenOpaque
  }
};
fs.writeFileSync(path.join(outDir, "survivor-art.json"), JSON.stringify(meta, null, 2));
console.log(`generated ${rawPath}`);
console.log(`luma keyed transparent=${transparent} opaqueGreen=${greenOpaque}`);
