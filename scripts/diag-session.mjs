// Play a fuller session: move around, auto-pick upgrades when a level-up
// appears, fight elites and bosses, and capture frames throughout to spot
// remaining visual bugs. Reports console/page errors.
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
  await page.goto(`http://127.0.0.1:${port}/?sess=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => { window.debug_spawn_enemy("ghoul", 6, true); });
  await page.click("canvas").catch(() => {});

  const dirs = ["d", "s", "a", "w"];
  let shot = 0;
  const events = [];
  for (let i = 0; i < 24; i++) {
    // If a level-up is up, pick the recommended card and resume.
    const st = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    if (st.mode === "level") {
      const idx = st.levelChoice?.recommended?.index ?? 0;
      await page.evaluate((k) => window.debug_choose_upgrade(k), idx);
      events.push(`lvlup->pick ${idx}`);
      continue;
    }
    // Move for a bit.
    const key = dirs[i % dirs.length];
    await page.keyboard.down(key);
    await page.waitForTimeout(260);
    await page.keyboard.up(key);
    // Periodically inject content.
    if (i === 4) await page.evaluate(() => window.debug_spawn_enemy("skitter", 6, true));
    if (i === 8) await page.evaluate(() => window.debug_spawn_enemy("weaver", 2, true));
    if (i === 12) await page.evaluate(() => window.debug_spawn_enemy("mirror_lantern", 2, true));
    if (i === 16) await page.evaluate(() => window.debug_spawn_boss());
    if (i === 20) await page.evaluate(() => window.debug_spawn_final_boss());
    if (i % 3 === 0) {
      await page.screenshot({ path: path.join(outDir, `sess-${String(shot).padStart(2, "0")}.png`), fullPage: true });
      shot++;
    }
  }
  const final = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  await page.screenshot({ path: path.join(outDir, `sess-${String(shot).padStart(2, "0")}.png`), fullPage: true });
  await fs.writeFile(path.join(outDir, "sess-state.json"), JSON.stringify({ mode: final.mode, enemyKinds: final.enemyKinds, events, errors }, null, 2));
  console.log(JSON.stringify({ ok: true, shots: shot + 1, finalMode: final.mode, events, errors }, null, 2));
  await browser.close();
}
await main();
