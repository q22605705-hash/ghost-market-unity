import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const rawDir = path.join(root, "public", "assets", "raw");
const charDir = path.join(root, "public", "assets", "characters");
const envDir = path.join(root, "public", "assets", "environment");
const dataDir = path.join(root, "public", "assets", "data");
const generatedDir = path.join(root, "src", "generated");

const assets = {
  hero: {
    raw: "hero-gpt-greenscreen-v2.png",
    luma: "hero-gpt-luma.png",
    out: "hero.png",
    cols: 12,
    rows: 4,
    frameWidth: 160,
    frameHeight: 160,
    anchor: "feet",
    animations: {
      idle: { row: 0, frames: 12, fps: 10 },
      run: { row: 1, frames: 12, fps: 15 },
      attack: { row: 2, frames: 12, fps: 18 },
      jump: { row: 3, frames: 12, fps: 12 }
    }
  },
  imp: {
    raw: "imp-gpt-greenscreen.png",
    luma: "imp-gpt-luma.png",
    out: "imp.png",
    cols: 12,
    rows: 1,
    frameWidth: 96,
    frameHeight: 96,
    animations: { move: { row: 0, frames: 12, fps: 12 } }
  },
  brute: {
    raw: "brute-gpt-greenscreen.png",
    luma: "brute-gpt-luma.png",
    out: "brute.png",
    cols: 12,
    rows: 1,
    frameWidth: 128,
    frameHeight: 128,
    anchor: "feet",
    animations: { move: { row: 0, frames: 12, fps: 10 } }
  },
  boss: {
    raw: "boss-gpt-greenscreen.png",
    luma: "boss-gpt-luma.png",
    out: "boss.png",
    cols: 12,
    rows: 1,
    sourceCols: 6,
    sourceRows: 2,
    frameWidth: 192,
    frameHeight: 192,
    animations: { idle: { row: 0, frames: 12, fps: 10 } }
  }
};

function chromaAlpha(r, g, b) {
  const dist = Math.hypot(r, g - 255, b);
  const hardGreenEdge = g > 150 && r < 85 && b < 180 && g > r * 1.4 && g > b * 1.12;
  if (hardGreenEdge) return 0;
  const greenDominant = g > 165 && r < 115 && b < 125 && g > r * 1.45 && g > b * 1.45;
  if (dist < 62) return 0;
  if (greenDominant) return Math.max(0, Math.min(255, Math.round((dist - 34) * 3.6)));
  return 255;
}

function removeGreenScreen(inputPath) {
  const image = PNG.sync.read(fs.readFileSync(inputPath));
  const { data } = image;

  for (let i = 0; i < data.length; i += 4) {
    const isGuideLine = data[i] > 225 && data[i + 1] > 225 && data[i + 2] > 225;
    if (isGuideLine) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }
    const alpha = chromaAlpha(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.min(data[i + 3], alpha);
    if (data[i + 3] < 18) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    } else if (alpha < 255) {
      data[i + 1] = Math.round(data[i + 1] * 0.42);
    }
  }

  return image;
}

function findBounds(image, sx, sy, sw, sh) {
  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = ((sy + y) * image.width + sx + x) * 4 + 3;
      if (image.data[idx] > 28) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) return { x: 0, y: 0, w: sw, h: sh };
  const pad = 4;
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(sw, maxX - minX + 1 + pad * 2),
    h: Math.min(sh, maxY - minY + 1 + pad * 2)
  };
}

function findFootAnchor(image, sx, sy, bounds) {
  const bottomY = sy + bounds.y + bounds.h - 1;
  const scanTop = Math.max(sy + bounds.y, bottomY - 24);
  const xs = [];

  for (let y = scanTop; y <= bottomY; y++) {
    for (let x = sx + bounds.x; x < sx + bounds.x + bounds.w; x++) {
      const idx = (y * image.width + x) * 4 + 3;
      if (image.data[idx] > 28) {
        xs.push(x - (sx + bounds.x));
      }
    }
  }

  if (xs.length === 0) return bounds.w / 2;
  xs.sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

function findHorizontalGroups(image, expected) {
  const columns = [];
  for (let x = 0; x < image.width; x++) {
    let count = 0;
    for (let y = 0; y < image.height; y++) {
      if (image.data[(y * image.width + x) * 4 + 3] > 28) count++;
    }
    columns.push(count);
  }

  const groups = [];
  let start = -1;
  for (let x = 0; x < columns.length; x++) {
    if (columns[x] > 2 && start < 0) start = x;
    if ((columns[x] <= 2 || x === columns.length - 1) && start >= 0) {
      const end = columns[x] <= 2 ? x - 1 : x;
      if (end - start > 8) groups.push({ start, end });
      start = -1;
    }
  }

  while (groups.length > expected) {
    let bestIndex = 0;
    let bestGap = Infinity;
    for (let i = 0; i < groups.length - 1; i++) {
      const gap = groups[i + 1].start - groups[i].end;
      if (gap < bestGap) {
        bestGap = gap;
        bestIndex = i;
      }
    }
    groups[bestIndex] = { start: groups[bestIndex].start, end: groups[bestIndex + 1].end };
    groups.splice(bestIndex + 1, 1);
  }

  while (groups.length < expected && groups.length > 0) {
    groups.push({ ...groups[groups.length - 1] });
  }

  return groups.slice(0, expected).map((group) => ({
    x: Math.max(0, group.start - 6),
    y: 0,
    w: Math.min(image.width - Math.max(0, group.start - 6), group.end - group.start + 13),
    h: image.height
  }));
}

function blitScaledNearest(src, dst, sourceRect, destRect) {
  for (let y = 0; y < destRect.h; y++) {
    for (let x = 0; x < destRect.w; x++) {
      const srcX = sourceRect.x + Math.floor((x / destRect.w) * sourceRect.w);
      const srcY = sourceRect.y + Math.floor((y / destRect.h) * sourceRect.h);
      const si = (srcY * src.width + srcX) * 4;
      const di = ((destRect.y + y) * dst.width + destRect.x + x) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
}

function cleanGuidePixels(image) {
  for (let i = 0; i < image.data.length; i += 4) {
    const r = image.data[i];
    const g = image.data[i + 1];
    const b = image.data[i + 2];
    const nearGreenGuide = g > 90 && r < 95 && b < 125 && g > r * 1.18 && g > b * 1.05;
    const nearWhiteGuide = r > 205 && g > 205 && b > 205;
    if (nearGreenGuide || nearWhiteGuide) {
      image.data[i] = 0;
      image.data[i + 1] = 0;
      image.data[i + 2] = 0;
      image.data[i + 3] = 0;
    }
  }

  for (let x = 0; x < image.width; x++) {
    let guideLike = 0;
    let opaque = 0;
    for (let y = 0; y < image.height; y++) {
      const i = (y * image.width + x) * 4;
      if (image.data[i + 3] <= 0) continue;
      opaque++;
      const r = image.data[i];
      const g = image.data[i + 1];
      const b = image.data[i + 2];
      if ((g > 75 && r < 130 && b < 150) || (r > 190 && g > 190 && b > 190)) guideLike++;
    }
    if (opaque > image.height * 0.38 && guideLike / opaque > 0.72) {
      for (let y = 0; y < image.height; y++) {
        const i = (y * image.width + x) * 4;
        image.data[i] = 0;
        image.data[i + 1] = 0;
        image.data[i + 2] = 0;
        image.data[i + 3] = 0;
      }
    }
  }
}

function drawSlashFrame(image, spec, col) {
  const fx = col * spec.frameWidth;
  const fy = 2 * spec.frameHeight;
  const cx = fx + Math.round(spec.frameWidth * 0.64);
  const cy = fy + Math.round(spec.frameHeight * 0.56);
  const progress = col / Math.max(1, spec.cols - 1);
  const arcStart = -0.85 + progress * 1.1;
  const arcEnd = arcStart + 0.75;

  for (let y = 0; y < spec.frameHeight; y++) {
    for (let x = 0; x < spec.frameWidth; x++) {
      const px = fx + x;
      const py = fy + y;
      const dx = px - cx;
      const dy = py - cy;
      const radius = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const inArc = radius > 30 && radius < 58 && angle > arcStart && angle < arcEnd;
      const bladeLine = Math.abs(dy - dx * 0.18) < 2.4 && dx > 8 && dx < 58 && progress > 0.1 && progress < 0.9;
      if (!inArc && !bladeLine) continue;
      const idx = (py * image.width + px) * 4;
      image.data[idx] = bladeLine ? 220 : 120;
      image.data[idx + 1] = 255;
      image.data[idx + 2] = bladeLine ? 238 : 220;
      image.data[idx + 3] = bladeLine ? 245 : 180;
    }
  }
}

function stabilizeHeroAttack(image, spec) {
  const attackRow = 2;
  for (let col = 0; col < spec.cols; col++) {
    const sourceCol = Math.min(col, 3);
    const sourceX = sourceCol * spec.frameWidth;
    const targetX = col * spec.frameWidth;
    const targetY = attackRow * spec.frameHeight;

    for (let y = 0; y < spec.frameHeight; y++) {
      for (let x = 0; x < spec.frameWidth; x++) {
        const src = (y * image.width + sourceX + x) * 4;
        const dst = ((targetY + y) * image.width + targetX + x) * 4;
        image.data[dst] = image.data[src];
        image.data[dst + 1] = image.data[src + 1];
        image.data[dst + 2] = image.data[src + 2];
        image.data[dst + 3] = image.data[src + 3];
      }
    }

    drawSlashFrame(image, spec, col);
  }
}

function measureFrameFeet(image, spec, row) {
  const result = [];
  for (let col = 0; col < spec.cols; col++) {
    const sx = col * spec.frameWidth;
    const sy = row * spec.frameHeight;
    let minX = spec.frameWidth;
    let maxX = -1;
    let bottomY = -1;
    for (let y = 0; y < spec.frameHeight; y++) {
      for (let x = 0; x < spec.frameWidth; x++) {
        const alpha = image.data[((sy + y) * image.width + sx + x) * 4 + 3];
        if (alpha <= 28) continue;
        bottomY = Math.max(bottomY, y);
      }
    }
    const scanTop = Math.max(0, bottomY - 18);
    for (let y = scanTop; y <= bottomY; y++) {
      for (let x = 0; x < spec.frameWidth; x++) {
        const alpha = image.data[((sy + y) * image.width + sx + x) * 4 + 3];
        if (alpha <= 28) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
    result.push({ col, footX: Math.round((minX + maxX) / 2), bottomY });
  }
  return result;
}

function shiftFrame(image, spec, row, col, shiftX, shiftY) {
  if (shiftX === 0 && shiftY === 0) return;
  const sx = col * spec.frameWidth;
  const sy = row * spec.frameHeight;
  const copy = new Uint8Array(spec.frameWidth * spec.frameHeight * 4);
  for (let y = 0; y < spec.frameHeight; y++) {
    for (let x = 0; x < spec.frameWidth; x++) {
      const src = ((sy + y) * image.width + sx + x) * 4;
      const dst = (y * spec.frameWidth + x) * 4;
      copy[dst] = image.data[src];
      copy[dst + 1] = image.data[src + 1];
      copy[dst + 2] = image.data[src + 2];
      copy[dst + 3] = image.data[src + 3];
      image.data[src] = 0;
      image.data[src + 1] = 0;
      image.data[src + 2] = 0;
      image.data[src + 3] = 0;
    }
  }
  for (let y = 0; y < spec.frameHeight; y++) {
    for (let x = 0; x < spec.frameWidth; x++) {
      const nx = x + shiftX;
      const ny = y + shiftY;
      if (nx < 0 || nx >= spec.frameWidth || ny < 0 || ny >= spec.frameHeight) continue;
      const src = (y * spec.frameWidth + x) * 4;
      const dst = ((sy + ny) * image.width + sx + nx) * 4;
      image.data[dst] = copy[src];
      image.data[dst + 1] = copy[src + 1];
      image.data[dst + 2] = copy[src + 2];
      image.data[dst + 3] = copy[src + 3];
    }
  }
}

function lockFeetToPixel(image, spec, rows) {
  const targetFootX = Math.round(spec.frameWidth / 2);
  const targetBottomY = Math.round(spec.frameHeight * 0.92);
  for (const row of rows) {
    const feet = measureFrameFeet(image, spec, row);
    for (const frame of feet) {
      shiftFrame(image, spec, row, frame.col, targetFootX - frame.footX, targetBottomY - frame.bottomY);
    }
  }
}

function normalizeSheet(name, spec) {
  const input = path.join(rawDir, spec.raw);
  if (!fs.existsSync(input)) throw new Error(`Missing generated asset: ${input}`);
  const keyed = removeGreenScreen(input);
  fs.writeFileSync(path.join(charDir, spec.luma), PNG.sync.write(keyed));

  const srcFrameW = Math.floor(keyed.width / spec.cols);
  const srcFrameH = Math.floor(keyed.height / spec.rows);
  const sourceGrid =
    spec.sourceCols && spec.sourceRows
      ? Array.from({ length: spec.sourceCols * spec.sourceRows }, (_, index) => {
          const sw = Math.floor(keyed.width / spec.sourceCols);
          const sh = Math.floor(keyed.height / spec.sourceRows);
          return {
            x: (index % spec.sourceCols) * sw,
            y: Math.floor(index / spec.sourceCols) * sh,
            w: sw,
            h: sh
          };
        })
      : null;
  const rowGroups = spec.rows === 1 ? findHorizontalGroups(keyed, spec.cols) : null;
  const out = new PNG({
    width: spec.frameWidth * spec.cols,
    height: spec.frameHeight * spec.rows
  });

  for (let row = 0; row < spec.rows; row++) {
    for (let col = 0; col < spec.cols; col++) {
      const group = sourceGrid?.[col] ?? rowGroups?.[col];
      const sx = group?.x ?? col * srcFrameW;
      const sy = group?.y ?? row * srcFrameH;
      const sw = group?.w ?? srcFrameW;
      const sh = group?.h ?? srcFrameH;
      const bounds = findBounds(keyed, sx, sy, sw, sh);
      const maxW = Math.floor(spec.frameWidth * 0.9);
      const maxH = Math.floor(spec.frameHeight * 0.9);
      const scale = Math.min(maxW / bounds.w, maxH / bounds.h, 1);
      const dw = Math.max(1, Math.round(bounds.w * scale));
      const dh = Math.max(1, Math.round(bounds.h * scale));
      const footAnchor = findFootAnchor(keyed, sx, sy, bounds);
      const sourceCellAnchor = sw / 2 - bounds.x;
      const useFootAnchor = spec.anchor === "feet" || (name === "hero" && row === 2);
      const dx =
        useFootAnchor || spec.anchor === "cell-feet"
          ? Math.round(
              col * spec.frameWidth +
                spec.frameWidth / 2 -
                (useFootAnchor ? footAnchor : sourceCellAnchor) * scale
            )
          : col * spec.frameWidth + Math.floor((spec.frameWidth - dw) / 2);
      const dy =
        spec.anchor === "feet" || spec.anchor === "cell-feet"
          ? Math.round(row * spec.frameHeight + spec.frameHeight * 0.92 - dh)
          : row * spec.frameHeight + Math.floor((spec.frameHeight - dh) / 2);
      blitScaledNearest(
        keyed,
        out,
        { x: sx + bounds.x, y: sy + bounds.y, w: bounds.w, h: bounds.h },
        { x: dx, y: dy, w: dw, h: dh }
      );
    }
  }

  cleanGuidePixels(out);
  if (name === "hero") stabilizeHeroAttack(out, spec);
  if (name === "hero") lockFeetToPixel(out, spec, [0, 1, 2]);
  fs.writeFileSync(path.join(charDir, spec.out), PNG.sync.write(out));
  if (name === "hero") {
    const idleFeet = measureFrameFeet(out, spec, 0);
    const maxBottomDrift = Math.max(...idleFeet.map((frame) => frame.bottomY)) - Math.min(...idleFeet.map((frame) => frame.bottomY));
    const maxXDrift = Math.max(...idleFeet.map((frame) => frame.footX)) - Math.min(...idleFeet.map((frame) => frame.footX));
    console.log(`Hero idle foot drift: x=${maxXDrift}px, y=${maxBottomDrift}px`);
  }
  return {
    source: "GPT generated chroma-key art, processed with local Luma Key, frame crop, and normalization",
    birefnet: "BiRefNet hook point: replace the Luma Key matte in this script when a local BiRefNet model runner is available.",
    key: name,
    texture: `/assets/characters/${spec.out}`,
    columns: spec.cols,
    rows: spec.rows,
    frameWidth: spec.frameWidth,
    frameHeight: spec.frameHeight,
    animations: spec.animations
  };
}

fs.mkdirSync(charDir, { recursive: true });
fs.mkdirSync(envDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(generatedDir, { recursive: true });

const manifest = {};
for (const [name, spec] of Object.entries(assets)) {
  manifest[name] = normalizeSheet(name, spec);
}

const bgRaw = path.join(rawDir, "market-bg-gpt.png");
const bgOut = path.join(envDir, "market-bg.png");
if (fs.existsSync(bgRaw)) fs.copyFileSync(bgRaw, bgOut);
manifest.market = {
  source: "GPT generated environment art",
  texture: "/assets/environment/market-bg.png"
};

const platformRaw = path.join(rawDir, "platform-gpt-greenscreen.png");
const platformOut = path.join(envDir, "platform.png");
if (fs.existsSync(platformRaw)) {
  const platform = removeGreenScreen(platformRaw);
  fs.writeFileSync(platformOut, PNG.sync.write(platform));
  manifest.platform = {
    source: "GPT generated chroma-key platform art, processed with local Luma Key",
    texture: "/assets/environment/platform.png"
  };
}

fs.writeFileSync(path.join(dataDir, "art-manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  path.join(generatedDir, "artManifest.ts"),
  `export const artManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`
);

console.log("Processed GPT art assets:", Object.keys(manifest).join(", "));
