import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const rawPath = path.join(root, "survivor", "assets", "raw", "gpt-cute-cartoon-survivor-greenmatte.png");
const outPath = path.join(root, "survivor", "assets", "survivor-sprites.png");
const qualityPath = path.join(root, "survivor", "assets", "survivor-animation-quality.json");
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

function write(x, y, rgba) {
  if (x < 0 || y < 0 || x >= out.width || y >= out.height) return;
  const i = idx(out, x, y);
  out.data[i] = rgba[0];
  out.data[i + 1] = rgba[1];
  out.data[i + 2] = rgba[2];
  out.data[i + 3] = rgba[3];
}

function isGreenMatte(r, g, b, a) {
  if (a <= 0) return false;
  return g > 150 && g > r * 1.45 && g > b * 1.45;
}

function greenSpillClean([r, g, b, a]) {
  if (a <= 0) return [0, 0, 0, 0];
  if (isGreenMatte(r, g, b, a)) return [0, 0, 0, 0];
  const spill = Math.max(0, g - Math.max(r, b) - 24);
  if (spill <= 0) return [r, g, b, a];
  return [r, Math.max(0, g - spill * 1.25), b, Math.max(0, a - spill * 0.35)];
}

function isWhiteEdge([r, g, b, a]) {
  if (a < 16) return false;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return (r + g + b) / 3 > 218 && spread < 48;
}

function isNearWhite([r, g, b, a]) {
  if (a < 16) return false;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return (r + g + b) / 3 > 218 && spread < 48;
}

function hasTransparentNeighbor(x, y) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    if (read(out, x + dx, y + dy)[3] < 16) return true;
  }
  return false;
}

function postCleanEdges() {
  let removedWhite = 0;
  let tintedWhite = 0;
  let clearedFoot = 0;
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const color = read(out, x, y);
      const [r, g, b, a] = color;
      if (a <= 0) continue;
      if (isGreenMatte(r, g, b, a)) {
        write(x, y, [0, 0, 0, 0]);
        continue;
      }
      if (isNearWhite(color) && hasTransparentNeighbor(x, y)) {
        if (r > 238 && g > 238 && b > 238) {
          write(x, y, [0, 0, 0, 0]);
          removedWhite++;
        } else {
          write(x, y, [Math.min(r, 204), Math.min(g, 198), Math.min(b, 178), Math.min(a, 190)]);
          tintedWhite++;
        }
      }
    }
  }
  for (let row = 0; row <= 1; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col * cell;
      const y0 = row * cell;
      for (let y = 113; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          if (read(out, x0 + x, y0 + y)[3] <= 0) continue;
          write(x0 + x, y0 + y, [0, 0, 0, 0]);
          clearedFoot++;
        }
      }
    }
  }
  return { removedWhite, tintedWhite, clearedFoot };
}

function cellPixels(row, col) {
  const x0 = Math.round(col * source.width / cols);
  const y0 = Math.round(row * source.height / rows);
  const x1 = col === cols - 1 ? source.width : Math.round((col + 1) * source.width / cols);
  const y1 = row === rows - 1 ? source.height : Math.round((row + 1) * source.height / rows);
  const pixels = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let sy = y0; sy < y1; sy++) {
    for (let sx = x0; sx < x1; sx++) {
      const color = greenSpillClean(read(source, sx, sy));
      if (color[3] < 24) continue;
      const x = sx - x0;
      const y = sy - y0;
      pixels.push({ x, y, color });
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!pixels.length) return null;
  return { pixels, minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function luminance([r, g, b]) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function detectFootAnchorX(src) {
  const headPixels = src.pixels.filter((p) => {
    const [r, g, b, a] = p.color;
    if (a < 32 || p.y > src.minY + 58) return false;
    const bright = (r + g + b) / 3;
    return bright > 145 || (g > 120 && b > 105);
  });
  const headCenter = headPixels.length >= 24
    ? headPixels.reduce((sum, p) => sum + p.x, 0) / headPixels.length
    : src.minX + src.width / 2;
  const bottomBand = src.pixels.filter((p) => p.y >= src.maxY - 18 && p.y <= src.maxY);
  const dark = bottomBand.filter((p) => {
    const [r, g, b, a] = p.color;
    if (a < 32) return false;
    if (Math.abs(p.x - headCenter) > 38) return false;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    return luminance(p.color) < 128 && !(r > 150 && g > 80 && b < 80 && sat > 70);
  });
  const centeredBottom = bottomBand.filter((p) => Math.abs(p.x - headCenter) <= 42);
  const candidates = dark.length >= 8 ? dark : centeredBottom.length ? centeredBottom : bottomBand;
  if (!candidates.length) return src.minX + src.width / 2;

  const xs = [...new Set(candidates.map((p) => p.x))].sort((a, b) => a - b);
  const groups = [];
  for (const x of xs) {
    const last = groups[groups.length - 1];
    if (!last || x > last.end + 4) groups.push({ start: x, end: x });
    else last.end = x;
  }
  const bodyCenter = headCenter;
  const scored = groups.map((g) => {
    const groupPixels = candidates.filter((p) => p.x >= g.start && p.x <= g.end);
    const avg = groupPixels.reduce((sum, p) => sum + p.x, 0) / groupPixels.length;
    const bottomCount = groupPixels.filter((p) => p.y >= src.maxY - 4).length;
    return {
      avg,
      width: g.end - g.start + 1,
      count: groupPixels.length,
      score: bottomCount * 3 + groupPixels.length + Math.max(0, 30 - Math.abs(avg - bodyCenter))
    };
  }).filter((g) => g.width >= 3 || g.count >= 8);
  if (!scored.length) return bodyCenter;
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const nearby = scored
    .filter((g) => g !== best && Math.abs(g.avg - best.avg) <= 34 && g.score >= best.score * 0.38)
    .slice(0, 1);
  const combined = [best, ...nearby];
  return combined.reduce((sum, g) => sum + g.avg * g.score, 0) / combined.reduce((sum, g) => sum + g.score, 0);
}

function copyCell(row, col) {
  const src = cellPixels(row, col);
  if (!src) return null;
  const character = row <= 4;
  const dstAnchorX = col * cell + 64;
  const dstAnchorY = row * cell + (character ? 112 : 64);
  const srcAnchorX = row <= 1 ? detectFootAnchorX(src) : src.minX + src.width / 2;
  const srcAnchorY = character ? src.maxY : src.minY + src.height / 2;
  const maxW = character ? 112 : 116;
  const maxH = character ? 112 : 116;
  const scale = Math.min(maxW / src.width, maxH / src.height, 1);

  for (const p of src.pixels) {
    const dx = Math.round(dstAnchorX + (p.x - srcAnchorX) * scale);
    const dy = Math.round(dstAnchorY + (p.y - srcAnchorY) * scale);
    if (character && dy > row * cell + 112) continue;
    write(dx, dy, p.color);
  }
  return {
    row,
    col,
    character,
    scale: Number(scale.toFixed(3)),
    sourceBounds: {
      minX: src.minX,
      minY: src.minY,
      maxX: src.maxX,
      maxY: src.maxY,
      width: src.width,
      height: src.height,
      pixels: src.pixels.length
    },
    sourceAnchor: {
      x: Number(srcAnchorX.toFixed(2)),
      y: Number(srcAnchorY.toFixed(2)),
      mode: row <= 1 ? "detected-dark-foot-center" : character ? "bounds-feet" : "center"
    }
  };
}

function localBounds(row, col) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let green = 0;
  let whiteEdge = 0;
  const x0 = col * cell;
  const y0 = row * cell;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const color = read(out, x0 + x, y0 + y);
      const [r, g, b, a] = color;
      if (a <= 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (isGreenMatte(r, g, b, a)) green++;
      if (isWhiteEdge(color) && (x <= minX + 2 || x >= maxX - 2 || y <= minY + 2 || y >= maxY - 2)) whiteEdge++;
    }
  }
  return { row, col, minX, minY, maxX, maxY, centerX: (minX + maxX) / 2, bottom: maxY, green, whiteEdge };
}

function outputFootContact(row, col) {
  const x0 = col * cell;
  const y0 = row * cell;
  let minY = Infinity;
  let maxYForHead = -Infinity;
  const headXs = [];
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const color = read(out, x0 + x, y0 + y);
      const [r, g, b, a] = color;
      if (a <= 24) continue;
      minY = Math.min(minY, y);
      maxYForHead = Math.max(maxYForHead, y);
      const bright = (r + g + b) / 3;
      if (y <= minY + 62 && (bright > 145 || (g > 120 && b > 105))) headXs.push(x);
    }
  }
  const headCenter = headXs.length >= 16
    ? headXs.reduce((sum, x) => sum + x, 0) / headXs.length
    : 64;
  let maxY = -1;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      if (read(out, x0 + x, y0 + y)[3] > 24) maxY = Math.max(maxY, y);
    }
  }
  const xs = [];
  for (let y = Math.max(0, maxY - 18); y <= maxY; y++) {
    for (let x = 0; x < cell; x++) {
      const color = read(out, x0 + x, y0 + y);
      const [r, g, b, a] = color;
      if (a > 24 && Math.abs(x - headCenter) <= 38 && luminance(color) < 128 && !(r > 150 && g > 80 && b < 80)) xs.push(x);
    }
  }
  const avg = xs.length ? xs.reduce((sum, x) => sum + x, 0) / xs.length : NaN;
  return { row, col, headCenter: Number(headCenter.toFixed(2)), footCenterX: Number(avg.toFixed(2)), footPixelCount: xs.length };
}

function shiftCell(row, col, dx) {
  if (!dx) return;
  const x0 = col * cell;
  const y0 = row * cell;
  const copy = [];
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) copy.push(read(out, x0 + x, y0 + y));
  }
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) write(x0 + x, y0 + y, [0, 0, 0, 0]);
  }
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const rgba = copy[(y * cell + x)];
      if (rgba[3] <= 0) continue;
      write(x0 + x + dx, y0 + y, rgba);
    }
  }
}

function correctHeroFootCenters() {
  const corrections = [];
  for (const row of [0, 1]) {
    for (let col = 0; col < cols; col++) {
      const foot = outputFootContact(row, col);
      if (!Number.isFinite(foot.footCenterX) || foot.footPixelCount < 8) {
        corrections.push({ ...foot, dx: 0, skipped: true });
        continue;
      }
      const dx = Math.round(64 - foot.footCenterX);
      shiftCell(row, col, dx);
      corrections.push({ ...foot, dx });
    }
  }
  return corrections;
}

const placements = [];
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) placements.push(copyCell(row, col));
}
const cleanup = postCleanEdges();
const footCorrections = [
  ...correctHeroFootCenters().map((item) => ({ pass: 1, ...item })),
  ...correctHeroFootCenters().map((item) => ({ pass: 2, ...item }))
];

const bounds = [];
const footContacts = [];
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    bounds.push(localBounds(row, col));
    if (row <= 1) footContacts.push(outputFootContact(row, col));
  }
}
const heroRows = [0, 1].map((row) => {
  const items = bounds.filter((b) => b.row === row);
  const feet = footContacts.filter((b) => b.row === row && Number.isFinite(b.footCenterX)).map((b) => b.footCenterX);
  const centers = items.map((b) => b.centerX);
  const bottoms = items.map((b) => b.bottom);
  return {
    row,
    centerRange: Number((Math.max(...centers) - Math.min(...centers)).toFixed(2)),
    bottomRange: Math.max(...bottoms) - Math.min(...bottoms),
    footCenterRange: Number((Math.max(...feet) - Math.min(...feet)).toFixed(2)),
    greenPixels: items.reduce((sum, b) => sum + b.green, 0),
    whiteEdgePixels: items.reduce((sum, b) => sum + b.whiteEdge, 0)
  };
});

fs.writeFileSync(outPath, PNG.sync.write(out));
fs.writeFileSync(qualityPath, JSON.stringify({ source: rawPath, cleanup, footCorrections, placements, rows: heroRows, bounds, footContacts }, null, 2));
console.log(JSON.stringify({ cleanup, rows: heroRows }, null, 2));
