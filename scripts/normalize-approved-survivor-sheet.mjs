import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const rawPath = path.join(root, "survivor", "assets", "raw", "gpt-approved-survivor-greenscreen.png");
const outPath = path.join(root, "survivor", "assets", "survivor-sprites.png");
const metaPath = path.join(root, "survivor", "assets", "survivor-art.json");

const source = PNG.sync.read(fs.readFileSync(rawPath));
const cell = 128;
const cols = 12;
const rows = 8;
const out = new PNG({ width: cols * cell, height: rows * cell });
for (let i = 0; i < out.data.length; i += 4) out.data[i + 3] = 0;

function isGreen(r, g, b) {
  return (g > 135 && g > r * 1.3 && g > b * 1.2)
    || (g > 60 && r < 120 && b < 150 && g > r * 1.08 && g > b * 1.04);
}

function readSourcePixel(x, y) {
  if (x < 0 || y < 0 || x >= source.width || y >= source.height) return [0, 0, 0, 0];
  const i = (y * source.width + x) * 4;
  const r = source.data[i];
  const g = source.data[i + 1];
  const b = source.data[i + 2];
  const a = source.data[i + 3];
  if (a === 0 || isGreen(r, g, b)) return [0, 0, 0, 0];
  return [r, g, b, a];
}

function writeOutPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= out.width || y >= out.height) return;
  const i = (y * out.width + x) * 4;
  out.data[i] = color[0];
  out.data[i + 1] = color[1];
  out.data[i + 2] = color[2];
  out.data[i + 3] = color[3];
}

function rect(ox, oy, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) writeOutPixel(ox + xx, oy + yy, color);
  }
}

function collectComponents(y0, y1, minArea = 10) {
  const width = source.width;
  const height = y1 - y0;
  const visited = new Uint8Array(width * height);
  const components = [];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

  for (let localY = 0; localY < height; localY++) {
    const y = y0 + localY;
    for (let x = 0; x < width; x++) {
      const index = localY * width + x;
      if (visited[index]) continue;
      const first = readSourcePixel(x, y);
      if (first[3] === 0) {
        visited[index] = 1;
        continue;
      }

      const queue = [[x, y]];
      const pixels = [];
      visited[index] = 1;
      let qi = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;

      while (qi < queue.length) {
        const [cx, cy] = queue[qi++];
        const color = readSourcePixel(cx, cy);
        if (color[3] === 0) continue;
        pixels.push({ x: cx, y: cy, color });
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= width || ny < y0 || ny >= y1) continue;
          const nLocalY = ny - y0;
          const ni = nLocalY * width + nx;
          if (visited[ni]) continue;
          visited[ni] = 1;
          if (readSourcePixel(nx, ny)[3] !== 0) queue.push([nx, ny]);
        }
      }

      if (pixels.length >= minArea) {
        components.push({
          pixels,
          minX,
          minY,
          maxX,
          maxY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
          cx: (minX + maxX) / 2,
          cy: (minY + maxY) / 2,
          area: pixels.length
        });
      }
    }
  }
  return components;
}

function groupByCenters({ y0, y1, centers, minArea = 10, maxDistance = 82 }) {
  const groups = centers.map((center) => ({
    center,
    pixels: [],
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    components: 0
  }));

  for (const comp of collectComponents(y0, y1, minArea)) {
    let bestIndex = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const d = Math.abs(comp.cx - centers[i]);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    if (bestIndex < 0 || bestDistance > maxDistance) continue;
    const group = groups[bestIndex];
    group.pixels.push(...comp.pixels);
    group.minX = Math.min(group.minX, comp.minX);
    group.minY = Math.min(group.minY, comp.minY);
    group.maxX = Math.max(group.maxX, comp.maxX);
    group.maxY = Math.max(group.maxY, comp.maxY);
    group.components++;
  }

  return groups.map((group) => {
    if (!Number.isFinite(group.minX)) return null;
    return {
      ...group,
      width: group.maxX - group.minX + 1,
      height: group.maxY - group.minY + 1
    };
  });
}

function drawGroup(group, outRow, outCol, anchor = "feet", scale = 1) {
  if (!group) return null;
  const maxH = anchor === "feet" ? 108 : 112;
  const maxW = 120;
  const finalScale = Math.min(scale, maxH / group.height, maxW / group.width);
  const outX = outCol * cell;
  const outY = outRow * cell;
  const srcAnchorX = group.minX + group.width / 2;
  const srcAnchorY = anchor === "feet" ? group.maxY : group.minY + group.height / 2;
  const dstAnchorX = outX + 64;
  const dstAnchorY = outY + (anchor === "feet" ? 112 : 64);

  for (const pixel of group.pixels) {
    const baseX = dstAnchorX + (pixel.x - srcAnchorX) * finalScale;
    const baseY = dstAnchorY + (pixel.y - srcAnchorY) * finalScale;
    const repeat = Math.max(1, Math.ceil(finalScale));
    for (let yy = 0; yy < repeat; yy++) {
      for (let xx = 0; xx < repeat; xx++) {
        writeOutPixel(Math.round(baseX + xx), Math.round(baseY + yy), pixel.color);
      }
    }
  }

  return {
    outRow,
    outCol,
    anchor,
    sourceBounds: {
      minX: group.minX,
      minY: group.minY,
      maxX: group.maxX,
      maxY: group.maxY,
      width: group.width,
      height: group.height
    },
    components: group.components,
    scale: Number(finalScale.toFixed(3)),
    dstAnchor: { x: 64, y: anchor === "feet" ? 112 : 64 }
  };
}

function pickGroup(groups, index) {
  if (groups[index]) return groups[index];
  for (let offset = 1; offset < groups.length; offset++) {
    const left = groups[index - offset];
    if (left) return left;
    const right = groups[index + offset];
    if (right) return right;
  }
  return null;
}

function buildDerivedTalisman(outCol) {
  const ox = outCol * cell;
  const oy = 7 * cell;
  rect(ox, oy, 30, 56, 52, 22, [181, 21, 32, 255]);
  rect(ox, oy, 36, 59, 38, 16, [255, 240, 188, 255]);
  rect(ox, oy, 46, 64, 16, 4, [181, 21, 32, 255]);
  rect(ox, oy, 76, 60, 15, 13, [57, 214, 218, 255]);
  rect(ox, oy, 24, 63, 10, 8, [38, 54, 85, 255]);
}

function buildDerivedBlade(outCol) {
  const ox = outCol * cell;
  const oy = 7 * cell;
  rect(ox, oy, 28, 59, 52, 13, [32, 42, 70, 255]);
  rect(ox, oy, 36, 54, 48, 11, [126, 244, 238, 255]);
  rect(ox, oy, 54, 50, 31, 8, [235, 255, 250, 255]);
  rect(ox, oy, 22, 62, 18, 12, [240, 174, 42, 255]);
}

const centers12 = Array.from({ length: 12 }, (_, i) => 64 + i * 128);
const centers8 = Array.from({ length: 8 }, (_, i) => 64 + i * 128);
const centers6Soul = Array.from({ length: 6 }, (_, i) => 64 + i * 128);
const centers6Fire = Array.from({ length: 6 }, (_, i) => 832 + i * 128);

const heroGroups = groupByCenters({ y0: 32, y1: 220, centers: centers12, minArea: 40, maxDistance: 92 });
const beastGroups = groupByCenters({ y0: 245, y1: 370, centers: centers12, minArea: 40, maxDistance: 92 });
const mageGroups = groupByCenters({ y0: 385, y1: 570, centers: centers8, minArea: 40, maxDistance: 92 });
const bruteGroups = groupByCenters({ y0: 585, y1: 770, centers: centers12, minArea: 40, maxDistance: 92 });
const soulGroups = groupByCenters({ y0: 795, y1: 925, centers: centers6Soul, minArea: 20, maxDistance: 92 });
const fireGroups = groupByCenters({ y0: 795, y1: 925, centers: centers6Fire, minArea: 20, maxDistance: 104 });

const placements = [];
for (let col = 0; col < cols; col++) {
  placements.push(drawGroup(pickGroup(heroGroups, col % 5), 0, col, "feet"));
  placements.push(drawGroup(pickGroup(heroGroups, 5 + (col % 7)), 1, col, "feet"));
  placements.push(drawGroup(pickGroup(beastGroups, col), 2, col, "feet"));
  placements.push(drawGroup(pickGroup(mageGroups, col % 8), 3, col, "feet"));
  placements.push(drawGroup(pickGroup(bruteGroups, col), 4, col, "feet", 0.94));
  placements.push(drawGroup(pickGroup(soulGroups, col % 6), 5, col, "center"));
  placements.push(drawGroup(pickGroup(fireGroups, col % 6), 6, col, "center"));
  if (col < 6) buildDerivedTalisman(col);
  else buildDerivedBlade(col);
}

fs.writeFileSync(outPath, PNG.sync.write(out));

let transparent = 0;
let opaqueGreen = 0;
for (let i = 0; i < out.data.length; i += 4) {
  const r = out.data[i];
  const g = out.data[i + 1];
  const b = out.data[i + 2];
  const a = out.data[i + 3];
  if (a === 0) transparent++;
  if (a > 0 && isGreen(r, g, b)) opaqueGreen++;
}

fs.writeFileSync(metaPath, JSON.stringify({
  source: "Approved GPT pixel-art green-screen sheet, component-normalized by foot anchor",
  raw: "assets/raw/gpt-approved-survivor-greenscreen.png",
  texture: "assets/survivor-sprites.png",
  cell,
  columns: cols,
  rows: {
    heroIdle: 0,
    heroRun: 1,
    beast: 2,
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
    opaqueGreenPixels: opaqueGreen,
    width: out.width,
    height: out.height
  },
  placements: placements.filter(Boolean)
}, null, 2));

console.log(`component-normalized approved sheet -> ${outPath}`);
console.log(`transparent=${transparent} opaqueGreen=${opaqueGreen} size=${out.width}x${out.height}`);
