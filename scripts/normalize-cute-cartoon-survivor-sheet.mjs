import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const rawPath = path.join(root, "survivor", "assets", "raw", "gpt-cute-cartoon-survivor-whitematte.png");
const outPath = path.join(root, "survivor", "assets", "survivor-sprites.png");
const metaPath = path.join(root, "survivor", "assets", "survivor-art.json");
const qualityPath = path.join(root, "survivor", "assets", "survivor-art-quality.json");

const source = PNG.sync.read(fs.readFileSync(rawPath));
const cell = 128;
const cols = 12;
const rows = 8;
const out = new PNG({ width: cols * cell, height: rows * cell });
for (let i = 0; i < out.data.length; i += 4) out.data[i + 3] = 0;

function idx(img, x, y) {
  return (y * img.width + x) * 4;
}

function read(img, x, y) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return [0, 0, 0, 0];
  const i = idx(img, x, y);
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

function write(x, y, color) {
  if (x < 0 || y < 0 || x >= out.width || y >= out.height) return;
  const i = idx(out, x, y);
  out.data[i] = color[0];
  out.data[i + 1] = color[1];
  out.data[i + 2] = color[2];
  out.data[i + 3] = color[3];
}

function clear(x, y) {
  if (x < 0 || y < 0 || x >= out.width || y >= out.height) return;
  const i = idx(out, x, y);
  out.data[i] = 0;
  out.data[i + 1] = 0;
  out.data[i + 2] = 0;
  out.data[i + 3] = 0;
}

function isWhiteMatte(r, g, b, a) {
  if (a <= 0) return false;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const avg = (r + g + b) / 3;
  return (r > 222 && g > 222 && b > 222 && spread < 48)
    || (avg > 238 && spread < 36);
}

function isLowSaturation(color) {
  const [r, g, b, a] = color;
  if (a <= 0) return false;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const avg = (r + g + b) / 3;
  return avg < 170 && spread < 54;
}

function isPureWhiteResidue(color) {
  const [r, g, b, a] = color;
  if (a <= 0) return false;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return r > 238 && g > 238 && b > 238 && spread < 26;
}

function isHeroFacePixel(color) {
  const [r, g, b, a] = color;
  if (a <= 0) return false;
  return r > 158 && g > 112 && b > 70 && r > g && g > b && r - b < 132;
}

function removeGroundShadows(raw, cellHeight) {
  const index = new Map();
  raw.forEach((p, i) => index.set(`${p.x},${p.y}`, i));
  const seen = new Uint8Array(raw.length);
  const drop = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    if (seen[i]) continue;
    const stack = [i];
    const component = [];
    seen[i] = 1;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let lowSat = 0;

    while (stack.length) {
      const current = stack.pop();
      const p = raw[current];
      component.push(current);
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      if (isLowSaturation(p.color)) lowSat++;
      for (const [nx, ny] of [[p.x + 1, p.y], [p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1]]) {
        const next = index.get(`${nx},${ny}`);
        if (next === undefined || seen[next]) continue;
        seen[next] = 1;
        stack.push(next);
      }
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const centerY = (minY + maxY) / 2;
    const lowSatRatio = lowSat / component.length;
    const looksLikeFloorShadow = width >= 20
      && height <= 16
      && width / Math.max(1, height) >= 2.6
      && lowSatRatio > 0.72
      && centerY > cellHeight * 0.62;

    if (looksLikeFloorShadow) {
      for (const current of component) drop[current] = 1;
    }
  }

  return raw.filter((_, i) => !drop[i]);
}

function cellImage(row, col) {
  const x0 = Math.round(col * source.width / cols);
  const y0 = Math.round(row * source.height / rows);
  const x1 = col === cols - 1 ? source.width : Math.round((col + 1) * source.width / cols);
  const y1 = row === rows - 1 ? source.height : Math.round((row + 1) * source.height / rows);
  const width = x1 - x0;
  const height = y1 - y0;
  const pixels = new Map();
  const seen = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < x0 || y < y0 || x >= x1 || y >= y1) return;
    const lx = x - x0;
    const ly = y - y0;
    const p = ly * width + lx;
    if (seen[p]) return;
    const [r, g, b, a] = read(source, x, y);
    if (!isWhiteMatte(r, g, b, a)) return;
    seen[p] = 1;
    queue.push([x, y]);
  };

  for (let x = x0; x < x1; x++) {
    push(x, y0);
    push(x, y1 - 1);
  }
  for (let y = y0; y < y1; y++) {
    push(x0, y);
    push(x1 - 1, y);
  }
  for (let q = 0; q < queue.length; q++) {
    const [x, y] = queue[q];
    pixels.set(`${x},${y}`, true);
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const raw = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (pixels.has(`${x},${y}`)) continue;
      const color = read(source, x, y);
      if (color[3] < 8) continue;
      if (isPureWhiteResidue(color)) continue;
      raw.push({ x: x - x0, y: y - y0, sourceX: x, sourceY: y, color });
    }
  }
  const kept = removeGroundShadows(raw, height);
  if (!kept.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let faceX = 0;
  let faceY = 0;
  let facePixels = 0;
  for (const p of kept) {
    minX = Math.min(minX, p.sourceX);
    minY = Math.min(minY, p.sourceY);
    maxX = Math.max(maxX, p.sourceX);
    maxY = Math.max(maxY, p.sourceY);
    if (isHeroFacePixel(p.color)) {
      faceX += p.sourceX;
      faceY += p.sourceY;
      facePixels++;
    }
  }
  return {
    kept,
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    faceAnchor: facePixels >= 120 ? { x: faceX / facePixels, y: faceY / facePixels, pixels: facePixels } : null
  };
}

function copyCell(row, col, anchor = "feet") {
  const src = cellImage(row, col);
  if (!src) return null;
  const outX = col * cell;
  const outY = row * cell;
  const maxW = anchor === "feet" ? 112 : 104;
  const maxH = anchor === "feet" ? 112 : 104;
  const scale = Math.min(maxW / src.width, maxH / src.height, 1);
  const rawCellX0 = Math.round(col * source.width / cols);
  const rawCellY0 = Math.round(row * source.height / rows);
  const rawCellX1 = col === cols - 1 ? source.width : Math.round((col + 1) * source.width / cols);
  const rawCellY1 = row === rows - 1 ? source.height : Math.round((row + 1) * source.height / rows);
  const useHeroBodyAnchor = row <= 1 && src.faceAnchor;
  const srcAnchorX = useHeroBodyAnchor ? src.faceAnchor.x : src.minX + src.width / 2;
  const srcAnchorY = anchor === "feet" ? src.maxY : src.minY + src.height / 2;
  const dstAnchorX = outX + 64;
  const dstAnchorY = outY + (anchor === "feet" ? 112 : 64);
  for (const p of src.kept) {
    const ox = Math.round(dstAnchorX + (p.sourceX - srcAnchorX) * scale);
    const oy = Math.round(dstAnchorY + (p.sourceY - srcAnchorY) * scale);
    write(ox, oy, p.color);
  }
  return {
    row,
    col,
    anchor,
    sourceBounds: { minX: src.minX, minY: src.minY, maxX: src.maxX, maxY: src.maxY, width: src.width, height: src.height },
    scale: Number(scale.toFixed(3)),
    sourceAnchor: {
      x: Number((srcAnchorX - rawCellX0).toFixed(2)),
      y: Number((srcAnchorY - rawCellY0).toFixed(2)),
      mode: useHeroBodyAnchor ? "detected-body-feet" : anchor,
      facePixels: src.faceAnchor?.pixels ?? 0
    },
    dstAnchor: { x: 64, y: anchor === "feet" ? 112 : 64 },
    opaquePixels: src.kept.length
  };
}

const placements = [];
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const anchor = row <= 4 ? "feet" : "center";
    placements.push(copyCell(row, col, anchor));
  }
}

function snapshotCell(row, col) {
  const pixels = [];
  const x0 = col * cell;
  const y0 = row * cell;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const color = read(out, x0 + x, y0 + y);
      if (color[3] > 0) pixels.push({ x, y, color });
    }
  }
  return pixels;
}

function clearCell(row, col) {
  const x0 = col * cell;
  const y0 = row * cell;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) clear(x0 + x, y0 + y);
  }
}

function lockHeroRowToStableFrame(row, sourceCol) {
  const base = snapshotCell(row, sourceCol);
  for (let col = 0; col < cols; col++) {
    clearCell(row, col);
    for (const p of base) write(col * cell + p.x, row * cell + p.y, p.color);
    const placement = placements[row * cols + col];
    if (placement) {
      placement.sourceAnchor = { x: 64, y: 112, mode: "locked-stable-feet", sourceCol };
      placement.lockedFromColumn = sourceCol;
    }
  }
}

lockHeroRowToStableFrame(0, 10);
lockHeroRowToStableFrame(1, 10);

for (let row = 0; row <= 4; row++) {
  for (let col = 0; col < cols; col++) {
    const x0 = col * cell;
    const y0 = row * cell;
    for (let y = y0 + 108; y < y0 + cell; y++) {
      for (let x = x0; x < x0 + cell; x++) {
        const [r, g, b, a] = read(out, x, y);
        if (a <= 0) continue;
        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        const avg = (r + g + b) / 3;
        const tealGlow = g > 120 && b > 110 && g - r > 45;
        const warmWeapon = r > 120 && g > 70 && r - b > 40;
        if (!tealGlow && !warmWeapon && avg < 155 && spread < 64) clear(x, y);
      }
    }
  }
}

let transparent = 0;
let matteLike = 0;
let opaque = 0;
for (let i = 0; i < out.data.length; i += 4) {
  const r = out.data[i];
  const g = out.data[i + 1];
  const b = out.data[i + 2];
  const a = out.data[i + 3];
  if (a === 0) transparent++;
  else {
    opaque++;
    if (isWhiteMatte(r, g, b, a)) matteLike++;
  }
}

const validPlacements = placements.filter(Boolean);
const failures = validPlacements.filter((p) => p.opaquePixels < (p.row <= 4 ? 160 : 100));
if (failures.length || validPlacements.length < cols * rows) {
  throw new Error(`Cute survivor art quality failed: placements=${validPlacements.length}/${cols * rows} low=${JSON.stringify(failures.slice(0, 6))}`);
}

fs.writeFileSync(outPath, PNG.sync.write(out));
fs.writeFileSync(metaPath, JSON.stringify({
  source: "GPT-generated cute cartoon white-matte sheet, edge-connected matte removed and anchored",
  raw: "assets/raw/gpt-cute-cartoon-survivor-whitematte.png",
  texture: "assets/survivor-sprites.png",
  cell,
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
  anchors: {
    characterRows: { x: 64, y: 112, mode: "bottom-center feet" },
    effectRows: { x: 64, y: 64, mode: "center" }
  },
  verification: {
    transparentPixels: transparent,
    matteLikePixels: matteLike,
    opaquePixels: opaque,
    width: out.width,
    height: out.height,
    placements: validPlacements.length
  },
  placements: validPlacements
}, null, 2));
fs.writeFileSync(qualityPath, JSON.stringify({ failures: [], placements: validPlacements }, null, 2));

console.log(`cute cartoon sheet -> ${outPath}`);
console.log(`placements=${validPlacements.length} transparent=${transparent} matteLike=${matteLike} opaque=${opaque} size=${out.width}x${out.height}`);
