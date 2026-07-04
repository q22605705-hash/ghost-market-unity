// Diagnostic: actually play the survivor game with real keyboard input and
// capture animation frames + full-screen clutter. Assumes a static server is
// already serving survivor/ on the port given (default 8791).
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "survivor/test-artifacts/diag");
const port = Number(process.argv[2] || 8791);

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
};

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await page.goto(`http://127.0.0.1:${port}/?diag=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");

  // Enter a playing state with a fire build and some enemies.
  await page.evaluate(() => {
    window.debug_apply_element_build("fire");
    window.debug_spawn_enemy("ghoul", 10, true);
  });
  let mode = await page.evaluate(() => JSON.parse(window.render_game_to_text()).mode);
  await page.click("canvas").catch(() => {});

  // Full HUD clutter view (idle).
  await page.waitForTimeout(400);
  await shot(page, "01-hud-idle");

  // Real movement: run right, sample frames.
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  await shot(page, "02-run-a");
  await page.waitForTimeout(250);
  await shot(page, "03-run-b");
  await page.keyboard.up("d");
  await page.waitForTimeout(120);
  await shot(page, "04-run-stop");

  // Move left to check facing/flip.
  await page.keyboard.down("a");
  await page.waitForTimeout(300);
  await shot(page, "05-run-left");
  await page.keyboard.up("a");

  // Stand near enemies so auto-attack triggers the attack row.
  await page.waitForTimeout(400);
  await shot(page, "06-attack");

  // Dash.
  await page.keyboard.down("d");
  await page.keyboard.press("Shift");
  await page.waitForTimeout(80);
  await shot(page, "07-dash");
  await page.keyboard.up("d");

  // Elites + bosses, one at a time, near the player.
  const spawns = ["weaver", "mirror_lantern", "talisman_binder"];
  for (const [i, kind] of spawns.entries()) {
    await page.evaluate((k) => window.debug_spawn_enemy(k, 1, true), kind);
    await page.waitForTimeout(300);
    await shot(page, `08-elite-${i}-${kind}`);
  }
  await page.evaluate(() => window.debug_spawn_boss());
  await page.waitForTimeout(300);
  await shot(page, "09-boss");
  await page.evaluate(() => window.debug_spawn_final_boss());
  await page.waitForTimeout(300);
  await shot(page, "10-final-boss");

  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  await fs.writeFile(
    path.join(outDir, "state.json"),
    JSON.stringify({ mode, playerMode: state.mode, player: state.player, enemyKinds: state.enemyKinds, consoleErrors }, null, 2)
  );
  console.log(JSON.stringify({ ok: true, mode, playerMode: state.mode, consoleErrors, out: path.relative(repoRoot, outDir) }, null, 2));
  await browser.close();
}

await main();
