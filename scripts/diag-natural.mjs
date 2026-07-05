// Natural-pacing playtest: no debug spawns. Move continuously, auto-pick
// upgrades, fast-forward with advanceTime, and sample the state + frames to
// judge the real early-game pacing a player experiences.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "survivor/test-artifacts/diag");
const port = Number(process.argv[2] || 8791);

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(`http://127.0.0.1:${port}/?nat=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  // Start a run from the menu via the normal entry (Enter key on menu).
  await page.click("canvas").catch(() => {});
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  let st = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  // Skip briefing if present.
  for (let i = 0; i < 4 && st.mode !== "playing"; i++) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
    st = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  }
  const samples = [];
  const dirs = ["d", "s", "a", "w"];
  let shot = 0;
  for (let step = 0; step < 36; step++) {
    st = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    if (st.mode === "level") {
      const idx = st.levelChoice?.recommended?.index ?? 0;
      await page.evaluate((k) => window.debug_choose_upgrade(k), idx);
      continue;
    }
    if (st.mode !== "playing") break;
    const key = dirs[step % dirs.length];
    await page.keyboard.down(key);
    await page.evaluate(() => window.advanceTime(2500)); // 2.5s of game time per step
    await page.keyboard.up(key);
    if (step % 6 === 0) {
      samples.push({
        t: st.time ?? null,
        mode: st.mode,
        hp: st.player?.hp,
        level: st.player?.level,
        kills: st.kills,
        enemies: st.enemies,
        xp: st.xp
      });
      await page.screenshot({ path: path.join(outDir, `nat-${String(shot).padStart(2, "0")}.png`), fullPage: true });
      shot++;
    }
  }
  const fin = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  await page.screenshot({ path: path.join(outDir, `nat-final.png`), fullPage: true });
  console.log(JSON.stringify({ ok: true, finalMode: fin.mode, time: fin.stagePhase, kills: fin.kills, level: fin.player?.level, hp: fin.player?.hp, samples, errors }, null, 2));
  await browser.close();
}
await main();
