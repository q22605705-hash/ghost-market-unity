// Capture the hero RUNNING in real time (holding a movement key) as a filmstrip
// of tight crops, to judge whether the run animation looks coherent in motion.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "survivor/test-artifacts/diag");
const port = Number(process.argv[2] || 8791);
const clip = { x: 540, y: 250, width: 200, height: 200 };

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${port}/?diagrun=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => { window.debug_spawn_enemy("ghoul", 2); });
  const ver = await page.evaluate(() => document.querySelector("script[src*='game.js']")?.src || "");
  await page.click("canvas").catch(() => {});
  await page.keyboard.down("d");
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(90);
    await page.screenshot({ path: path.join(outDir, `run-real-${i}.png`), clip });
  }
  await page.keyboard.up("d");
  console.log(JSON.stringify({ ok: true, ver }));
  await browser.close();
}
await main();
