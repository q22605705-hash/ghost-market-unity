import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const rawPath = path.join(root, "survivor", "assets", "raw", "gpt-pixel-survivor-greenscreen.png");
const outPath = path.join(root, "survivor", "assets", "survivor-sprites.png");
const metaPath = path.join(root, "survivor", "assets", "survivor-art.json");

const png = PNG.sync.read(fs.readFileSync(rawPath));
let transparent = 0;
let opaqueGreen = 0;

for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  const isGreenScreen = (g > 135 && g > r * 1.35 && g > b * 1.25)
    || (g > 70 && r < 110 && b < 130 && g > r * 1.2 && g > b * 1.15)
    || (g > 45 && r < 85 && b < 105 && g > r * 1.05 && g > b * 1.05);
  if (isGreenScreen) png.data[i + 3] = 0;
}

const cell = 128;
function keyPixel(x, y) {
  const i = (y * png.width + x) * 4;
  png.data[i + 3] = 0;
}

for (let y = ROW_TO_Y(5); y < ROW_TO_Y(6); y++) {
  for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4;
    if (png.data[i + 3] === 0) continue;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    const soulColor = b > 130 && g > 120 && r < 230;
    const glowWhite = r > 210 && g > 220 && b > 210;
    if (!soulColor && !glowWhite) keyPixel(x, y);
  }
}

function ROW_TO_Y(row) {
  return row * cell;
}

for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  if (png.data[i + 3] === 0) transparent++;
  const stillGreen = (g > 135 && g > r * 1.35 && g > b * 1.25)
    || (g > 70 && r < 110 && b < 130 && g > r * 1.2 && g > b * 1.15)
    || (g > 45 && r < 85 && b < 105 && g > r * 1.05 && g > b * 1.05);
  if (png.data[i + 3] > 0 && stillGreen) opaqueGreen++;
}

fs.writeFileSync(outPath, PNG.sync.write(png));
fs.writeFileSync(metaPath, JSON.stringify({
  source: "GPT-generated pixel-art green-screen sheet, processed by local Luma Key",
  raw: "assets/raw/gpt-pixel-survivor-greenscreen.png",
  texture: "assets/survivor-sprites.png",
  cell: 128,
  columns: 12,
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
    opaqueGreenPixels: opaqueGreen,
    width: png.width,
    height: png.height
  }
}, null, 2));

console.log(`luma keyed ${rawPath}`);
console.log(`transparent=${transparent} opaqueGreen=${opaqueGreen} size=${png.width}x${png.height}`);
