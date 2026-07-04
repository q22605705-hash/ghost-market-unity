// Close-up hero animation diagnostic: clip a tight box around the player and
// capture idle / run / attack / hit / dash frames to check foot-anchor jumps.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "survivor/test-artifacts/diag");
const port = Number(process.argv[2] || 8791);
const clip = { x: 520, y: 230, width: 240, height: 240 };

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${port}/?diaghero=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  // Play state, no enemies so nothing overlaps the hero; freeze auto-fire target.
  await page.evaluate(() => { window.debug_apply_element_build("fire"); window.debug_spawn_enemy("ghoul", 1); });

  const cap = async (name) => page.screenshot({ path: path.join(outDir, `hero-${name}.png`), clip });

  // Idle frames
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.advanceTime(120));
    await cap(`idle-${i}`);
  }
  // Attack frames (one-shot row)
  await page.evaluate(() => window.debug_player_anim("attack"));
  for (let i = 0; i < 4; i++) {
    await cap(`attack-${i}`);
    await page.evaluate(() => window.advanceTime(60));
  }
  // Hit
  await page.evaluate(() => window.debug_player_anim("hit"));
  await cap("hit-0");
  await page.evaluate(() => window.advanceTime(90));
  await cap("hit-1");
  // Dash
  await page.evaluate(() => window.debug_player_anim("dash"));
  await cap("dash-0");
  await page.evaluate(() => window.advanceTime(90));
  await cap("dash-1");

  console.log(JSON.stringify({ ok: true, clip }));
  await browser.close();
}
await main();
