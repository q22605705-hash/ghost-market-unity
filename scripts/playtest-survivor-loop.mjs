import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const survivorRoot = path.join(repoRoot, "survivor");
const artifactRoot = path.join(survivorRoot, "test-artifacts");
const scenario = process.argv[2] || "smoke";

async function findPort(start = 8096) {
  for (let port = start; port < start + 50; port++) {
    if (await isFree(port)) return port;
  }
  throw new Error(`No free local port found from ${start}`);
}

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function waitForServer(proc, port) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  proc.kill();
  throw new Error("Static server did not become ready");
}

function assertNoBrowserFailures(errors, failed) {
  if (errors.length || failed.length) {
    throw new Error(JSON.stringify({ consoleErrors: errors, failedRequests: failed }, null, 2));
  }
}

async function withPage(port, run) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => failedRequests.push(req.url()));
  try {
    const url = `http://127.0.0.1:${port}/?v=loop-${scenario}-${Date.now()}`;
    const response = await page.goto(url, { waitUntil: "networkidle" });
    if (!response || response.status() !== 200) throw new Error(`HTTP ${response?.status()}`);
    await page.waitForFunction(() => typeof window.render_game_to_text === "function");
    const result = await run(page);
    assertNoBrowserFailures(consoleErrors, failedRequests);
    return { ...result, consoleErrors, failedRequests };
  } finally {
    await browser.close();
  }
}

async function smoke(page) {
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  if (!["menu", "loading"].includes(state.mode)) throw new Error(`Unexpected initial mode: ${state.mode}`);
  await page.screenshot({ path: path.join(artifactRoot, "loop-smoke-menu.png"), fullPage: true });
  return { scenario: "smoke", mode: state.mode, title: await page.title() };
}

async function resultDamage(page) {
  await page.evaluate(() => window.debug_spawn_boss());
  await page.evaluate(() => window.debug_damage_boss(321));
  await page.evaluate(() => window.debug_spawn_final_boss());
  await page.evaluate(() => window.debug_damage_final_boss(999999));
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).mode === "result");
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const resultDamageSources = state.resultDamageSources;
  const resultBuildAdvice = state.resultBuildAdvice;
  const rows = resultDamageSources?.rows || [];
  if (!rows.some((row) => row.name === "Debug Boss 傷害")) {
    throw new Error(`Missing Debug Boss damage source: ${JSON.stringify(resultDamageSources)}`);
  }
  if (!rows.some((row) => row.name === "Debug 終局 Boss 傷害")) {
    throw new Error(`Missing Debug final Boss damage source: ${JSON.stringify(resultDamageSources)}`);
  }
  if ((resultDamageSources?.total || 0) < 1000000) {
    throw new Error(`Damage total too low: ${JSON.stringify(resultDamageSources)}`);
  }
  if (!resultBuildAdvice?.title || !resultBuildAdvice?.body) {
    throw new Error(`Missing result build advice: ${JSON.stringify(resultBuildAdvice)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-result-damage-readout.png"), fullPage: true });
  return { scenario: "result-damage", mode: state.mode, resultDamageSources, resultBuildAdvice };
}

async function pauseInfo(page) {
  const buildState = JSON.parse(await page.evaluate(() => window.debug_apply_element_build("fire")));
  const passiveState = JSON.parse(await page.evaluate(() => window.debug_apply_upgrade("\u528d\u7b26\u589e\u50b7")));
  await page.evaluate(() => window.debug_record_damage_source("\u706b\u7cfb\u7b26\u8108", 250));
  if (!buildState.pickedUpgrades?.length) {
    throw new Error(`Expected debug fire build to add active skills: ${JSON.stringify(buildState.pickedUpgrades)}`);
  }
  if (!passiveState.passiveUpgrades?.length) {
    throw new Error(`Expected debug passive upgrade to add passive skills: ${JSON.stringify(passiveState.passiveUpgrades)}`);
  }

  await page.evaluate(() => window.debug_open_pause("skills"));
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).mode === "pause");
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const panel = state.pausePanel;
  if (!panel || panel.tab !== "skills") {
    throw new Error(`Pause skills panel did not open: ${JSON.stringify(panel)}`);
  }
  if (!panel.selectedSkill?.title || !panel.selectedSkill?.desc || !panel.selectedSkill?.next) {
    throw new Error(`Pause selected skill is missing detail text: ${JSON.stringify(panel.selectedSkill)}`);
  }
  if (!panel.activeSkills?.some((skill) => skill.level >= 1)) {
    throw new Error(`Pause active skill list is empty or missing levels: ${JSON.stringify(panel.activeSkills)}`);
  }
  if (!panel.passiveSkills?.some((skill) => skill.level >= 1)) {
    throw new Error(`Pause passive skill list is empty or missing levels: ${JSON.stringify(panel.passiveSkills)}`);
  }
  if (!Array.isArray(panel.controls) || !panel.controls.some((text) => text.includes("Esc"))) {
    throw new Error(`Pause controls are missing resume guidance: ${JSON.stringify(panel.controls)}`);
  }
  if (!panel.stats || !panel.stats["\u751f\u547d"] || !panel.stats["\u50b7\u5bb3"]) {
    throw new Error(`Pause stat readout is missing combat stats: ${JSON.stringify(panel.stats)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-pause-info-skills.png"), fullPage: true });

  await page.evaluate(() => window.debug_open_pause("stats"));
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).pausePanel?.tab === "stats");
  const statsState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const statsPanel = statsState.pausePanel;
  const statKeys = Object.keys(statsPanel.stats || {});
  if (statKeys.length < 4) {
    throw new Error(`Pause stats panel is missing stat rows: ${JSON.stringify(statsPanel.stats)}`);
  }
  if (!statsPanel.damageSources?.rows?.some((row) => row.name === "\u706b\u7cfb\u7b26\u8108")) {
    throw new Error(`Pause stats panel is missing damage source rows: ${JSON.stringify(statsPanel.damageSources)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-pause-info-stats.png"), fullPage: true });

  await page.evaluate(() => window.debug_open_pause("missions"));
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).pausePanel?.tab === "missions");
  const missionState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const missionPanel = missionState.pausePanel;
  if (!missionPanel.objectiveCompass?.rows?.length) {
    throw new Error(`Pause missions panel is missing objective compass rows: ${JSON.stringify(missionPanel.objectiveCompass)}`);
  }
  if (!missionPanel.runLog?.rows?.length) {
    throw new Error(`Pause missions panel is missing run log rows: ${JSON.stringify(missionPanel.runLog)}`);
  }
  if (!missionPanel.missions?.length) {
    throw new Error(`Pause missions panel is missing mission rows: ${JSON.stringify(missionPanel.missions)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-pause-info-missions.png"), fullPage: true });

  return {
    scenario: "pause-info",
    mode: missionState.mode,
    selectedSkill: panel.selectedSkill,
    activeSkillCount: panel.activeSkills.length,
    passiveSkillCount: panel.passiveSkills.length,
    statCount: statKeys.length,
    damageSourceCount: statsPanel.damageSources.rows.length,
    objectiveCount: missionPanel.objectiveCompass.rows.length,
    runLogCount: missionPanel.runLog.rows.length,
    missionCount: missionPanel.missions.length,
    controlCount: panel.controls.length
  };
}

async function combatReadability(page) {
  await page.evaluate(() => window.debug_seed_combat_readability());
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const rows = state.damageSources?.rows || [];
  const nonDebugRows = rows.filter((row) => !/debug|\u6e2c\u8a66/i.test(row.name || ""));
  const requiredSources = [
    "\u57fa\u790e\u7b26\u5492",
    "\u706b\u7cfb\u71c3\u71d2",
    "\u6bd2\u7cfb\u8755\u50b7",
    "\u65cb\u5203",
    "\u591c\u86fe\u5f71"
  ];
  const missingSources = requiredSources.filter((name) => !nonDebugRows.some((row) => row.name === name));
  if (nonDebugRows.length < 5 || missingSources.length) {
    throw new Error(`Missing readable combat damage sources: ${JSON.stringify({ rows, missingSources })}`);
  }
  if (state.combatTracker?.damageFocus?.source && /debug|\u6e2c\u8a66/i.test(state.combatTracker.damageFocus.source)) {
    throw new Error(`Combat tracker focused a debug source: ${JSON.stringify(state.combatTracker.damageFocus)}`);
  }
  const lastHit = state.threat?.lastHit;
  if (!lastHit?.source || !/Boss|\u63a5\u89f8|\u5f48|\u5371\u96aa|\u6cd5\u5f48/.test(lastHit.source)) {
    throw new Error(`Missing readable player hit source: ${JSON.stringify(state.threat)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-combat-readability.png"), fullPage: true });
  return {
    scenario: "combat-readability",
    mode: state.mode,
    damageSources: state.damageSources,
    damageFocus: state.combatTracker.damageFocus,
    lastHit
  };
}

async function upgradeChoice(page) {
  // Start a run and pre-level the fire core skill to one pick before evolution (Lv.4).
  await page.evaluate(() => window.debug_apply_upgrade("火系符脈", 4));
  // Force a deterministic 3-card choice: near-evolution / utility passive / off-plan element.
  const offered = await page.evaluate(() =>
    window.debug_set_upgrade_options(["火系符脈", "聚魂鈴", "水系符脈"]));
  if (!Array.isArray(offered) || offered.length !== 3) {
    throw new Error(`Expected a 3-card forced choice set: ${JSON.stringify(offered)}`);
  }
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).mode === "level");
  const choiceState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const levelChoice = choiceState.levelChoice;
  if (!levelChoice) throw new Error("levelChoice missing while in level mode");
  if (!levelChoice.headline || !levelChoice.body) {
    throw new Error(`levelChoice is missing recommendation text: ${JSON.stringify(levelChoice)}`);
  }
  if (!Array.isArray(levelChoice.options) || levelChoice.options.length !== 3) {
    throw new Error(`Expected exactly 3 level options: ${JSON.stringify(levelChoice.options)}`);
  }
  for (const opt of levelChoice.options) {
    if (
      typeof opt.level !== "number" ||
      typeof opt.nextLevel !== "number" ||
      !opt.type ||
      !opt.family ||
      !opt.intent
    ) {
      throw new Error(`Level option is missing level/family/type/intent: ${JSON.stringify(opt)}`);
    }
  }
  const intents = levelChoice.options.map((opt) => opt.intent);
  if (!intents.includes("EVOLVE") || !intents.includes("PASSIVE") || !intents.includes("NEW")) {
    throw new Error(`Forced choice should mix evolve/utility/off-plan cards: ${JSON.stringify(intents)}`);
  }
  const recommended = levelChoice.recommended;
  if (!recommended || recommended.name !== "火系符脈" || recommended.intent !== "EVOLVE") {
    throw new Error(`Expected the near-evolution fire card to be recommended: ${JSON.stringify(recommended)}`);
  }
  if (recommended.level !== 4 || recommended.nextLevel !== 5) {
    throw new Error(`Expected fire card at Lv.4 -> Lv.5: ${JSON.stringify(recommended)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-upgrade-choice.png"), fullPage: true });

  // Pick the recommended card and confirm the run resumes with the evolution applied.
  const after = JSON.parse(
    await page.evaluate((index) => window.debug_choose_upgrade(index), recommended.index)
  );
  if (after.mode !== "playing") {
    throw new Error(`Expected to resume playing after choosing: ${after.mode}`);
  }
  if (after.levelChoice) {
    throw new Error(`Level-up overlay should be cleared after choosing: ${JSON.stringify(after.levelChoice)}`);
  }
  if (!after.evolvedSkills.includes("炎王符")) {
    throw new Error(`Expected fire evolution 炎王符 after picking the evolve card: ${JSON.stringify(after.evolvedSkills)}`);
  }
  const fireSkill = after.pickedUpgrades.find(
    (item) => item.name === "火系符脈" || item.family === "火系"
  );
  if (!fireSkill || fireSkill.level < 5) {
    throw new Error(`Expected fire skill at max level after evolution: ${JSON.stringify(after.pickedUpgrades)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-upgrade-choice-resumed.png"), fullPage: true });
  return {
    scenario: "upgrade-choice",
    offered,
    headline: levelChoice.headline,
    recommendedName: recommended.name,
    recommendedIntent: recommended.intent,
    recommendedLevel: `${recommended.level}->${recommended.nextLevel}`,
    optionIntents: intents,
    evolvedSkills: after.evolvedSkills,
    resumedMode: after.mode
  };
}

async function enemySummoner(page) {
  // Spawn a 召虺 (weaver) summoner and confirm it is recognized as a ranged elite.
  const spawned = JSON.parse(await page.evaluate(() => window.debug_spawn_enemy("weaver", 1, true)));
  if ((spawned.summonerEnemies || 0) < 1 || (spawned.enemyKinds?.weaver || 0) < 1) {
    throw new Error(`Weaver did not spawn: ${JSON.stringify({ summonerEnemies: spawned.summonerEnemies, enemyKinds: spawned.enemyKinds })}`);
  }
  const baselineEnemies = spawned.enemies;

  // Force the conjure telegraph and confirm it is surfaced for the player to read/react.
  const charging = JSON.parse(await page.evaluate(() => window.debug_force_weaver_conjure()));
  if ((charging.conjuringEnemies || 0) < 1) {
    throw new Error(`Weaver conjure telegraph not active: ${JSON.stringify(charging.conjuringEnemies)}`);
  }
  const telegraph = (charging.castingEnemies || []).find((e) => e.kind === "weaver" && e.conjure > 0);
  if (!telegraph) {
    throw new Error(`Conjure not surfaced in castingEnemies: ${JSON.stringify(charging.castingEnemies)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-enemy-summoner-telegraph.png"), fullPage: true });

  // Resolve the conjure and confirm minions actually arrive (the threat that rewards prioritization).
  await page.evaluate(() => window.advanceTime(900));
  const resolved = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  if (resolved.enemies <= baselineEnemies) {
    throw new Error(`Conjure did not add minions: before ${baselineEnemies}, after ${resolved.enemies}`);
  }
  if ((resolved.conjuringEnemies || 0) !== 0) {
    throw new Error(`Conjure telegraph should clear after resolving: ${JSON.stringify(resolved.conjuringEnemies)}`);
  }

  // Killing the weaver should register as an elite takedown.
  const killed = JSON.parse(await page.evaluate(() => window.debug_kill_enemy_kind("weaver")));
  if ((killed.runRewards?.eliteKills || 0) < 1) {
    throw new Error(`Weaver kill did not count as an elite takedown: ${JSON.stringify(killed.runRewards)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-enemy-summoner-resolved.png"), fullPage: true });
  return {
    scenario: "enemy-summoner",
    baselineEnemies,
    afterConjure: resolved.enemies,
    minionsAdded: resolved.enemies - baselineEnemies,
    eliteKills: killed.runRewards?.eliteKills ?? 0
  };
}

async function eliteEnemies(page) {
  // Mirror Lantern: forces a mirrored shot that fires from an offset marker, not the enemy itself.
  const cast = JSON.parse(await page.evaluate(() => window.debug_force_mirror_shot()));
  const lanternCast = (cast.castingEnemies || []).find((e) => e.kind === "mirror_lantern" && e.mirror > 0);
  if (!lanternCast) {
    throw new Error(`Mirror lantern telegraph not surfaced: ${JSON.stringify(cast.castingEnemies)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-elite-mirror-telegraph.png"), fullPage: true });
  // The projectile can hit the player (and vanish) or the lantern can die
  // before a single check lands, so sample in small steps: pass if bullets
  // ever rise OR the player records a 鏡燈法彈 hit.
  const bulletsBefore = cast.enemyBullets;
  let mirrorFired = false;
  let fired = cast;
  for (let i = 0; i < 6 && !mirrorFired; i++) {
    await page.evaluate(() => window.advanceTime(150));
    fired = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    if (fired.enemyBullets > bulletsBefore || /鏡燈/.test(fired.threat?.lastHit?.source || "")) mirrorFired = true;
  }
  if (!mirrorFired) {
    throw new Error(`Mirror shot did not spawn a projectile: before ${bulletsBefore}, after ${fired.enemyBullets}`);
  }

  // Talisman Binder: places armed seal traps that slow the player on contact (no hard stun).
  const sealed = JSON.parse(await page.evaluate(() => window.debug_force_bind_seals()));
  if ((sealed.bindSeals || 0) < 2) {
    throw new Error(`Binder did not place seal traps: ${JSON.stringify(sealed.bindSeals)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-elite-bind-seals.png"), fullPage: true });

  // Move the player onto a seal, wait past the arm time, and confirm the slow applies via a readable source.
  await page.evaluate(() => window.debug_move_player_to_bind_seal());
  await page.evaluate(() => window.advanceTime(700));
  const moveState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  if ((moveState.playerSlowed || 0) <= 0) {
    throw new Error(`Bind seal did not slow the player: ${JSON.stringify({ playerSlowed: moveState.playerSlowed, threat: moveState.threat })}`);
  }
  const hitSource = moveState.threat?.lastHit?.source || "";
  if (!/縛符/.test(hitSource)) {
    throw new Error(`Bind seal hit source not readable: ${JSON.stringify(moveState.threat)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-elite-bind-slow.png"), fullPage: true });
  return {
    scenario: "elite-enemies",
    mirrorBulletsAdded: fired.enemyBullets - bulletsBefore,
    bindSeals: sealed.bindSeals,
    playerSlowed: moveState.playerSlowed,
    bindHitSource: hitSource
  };
}

async function heroAnim(page) {
  // Confirm the bespoke hero sheet loads (no failed request) and each action row is reachable.
  const start = JSON.parse(await page.evaluate(() => window.debug_spawn_enemy("ghoul", 3, true)));
  if (!start.player) throw new Error("No player after starting a run");
  if (!start.player.heroAnim) throw new Error(`Player state is missing heroAnim: ${JSON.stringify(start.player)}`);

  const attack = JSON.parse(await page.evaluate(() => window.debug_player_anim("attack")));
  if ((attack.player.heroAnim.attack || 0) <= 0) {
    throw new Error(`Attack animation did not trigger: ${JSON.stringify(attack.player.heroAnim)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-hero-anim-attack.png"), fullPage: true });

  const hit = JSON.parse(await page.evaluate(() => window.debug_player_anim("hit")));
  if ((hit.player.heroAnim.hit || 0) <= 0) {
    throw new Error(`Hit animation did not trigger: ${JSON.stringify(hit.player.heroAnim)}`);
  }

  const dash = JSON.parse(await page.evaluate(() => window.debug_player_anim("dash")));
  if ((dash.player.heroAnim.dash || 0) <= 0) {
    throw new Error(`Dash animation did not trigger: ${JSON.stringify(dash.player.heroAnim)}`);
  }

  // The one-shot hit/dash timers should decay back toward idle after time
  // passes. Teleport away first — adjacent enemies re-trigger the hit
  // animation on contact (correct game behaviour), and hitstop slows decay.
  await page.evaluate(() => window.debug_teleport_player(1200, 1200));
  // Hitstop (state.freeze) pauses the whole world 0.025s per bullet hit — an
  // intentional game-feel feature — so advance in slices until decayed.
  let settled;
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.advanceTime(400));
    settled = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    if (settled.mode === "level") {
      const idx = settled.levelChoice?.recommended?.index ?? 0;
      await page.evaluate((k) => window.debug_choose_upgrade(k), idx);
      continue;
    }
    if ((settled.player.heroAnim.hit || 0) === 0 && (settled.player.heroAnim.dash || 0) === 0) break;
  }
  if ((settled.player.heroAnim.hit || 0) > 0 || (settled.player.heroAnim.dash || 0) > 0) {
    throw new Error(`Hero one-shot timers did not decay: ${JSON.stringify(settled.player.heroAnim)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-hero-anim-idle.png"), fullPage: true });
  return {
    scenario: "hero-anim",
    attack: attack.player.heroAnim.attack,
    hit: hit.player.heroAnim.hit,
    dash: dash.player.heroAnim.dash,
    settled: settled.player.heroAnim
  };
}

async function finalBoss(page) {
  // Spawn the final boss and confirm it is active with bespoke art (no failed request).
  const spawned = JSON.parse(await page.evaluate(() => window.debug_spawn_final_boss()));
  if (!spawned.finalBossActive) {
    throw new Error(`Final boss did not activate: ${JSON.stringify({ finalBossActive: spawned.finalBossActive })}`);
  }
  if (!spawned.boss || !spawned.boss.finalBoss || !spawned.boss.finalPhase?.title) {
    throw new Error(`Final boss HUD is missing: ${JSON.stringify(spawned.boss)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-final-boss-idle.png"), fullPage: true });

  // Force its special cast and confirm the cast state is surfaced (drives the cast row).
  const cast = JSON.parse(await page.evaluate(() => window.debug_force_enemy_cast("finalBoss", true)));
  const casting = (cast.castingEnemies || []).find((e) => e.kind === "finalBoss");
  if (!casting) {
    throw new Error(`Final boss cast not surfaced: ${JSON.stringify(cast.castingEnemies)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-final-boss-cast.png"), fullPage: true });
  return {
    scenario: "final-boss",
    finalBossActive: spawned.finalBossActive,
    bossPhase: spawned.boss.finalPhase.title,
    casting
  };
}

async function bossFight(page) {
  // Spawn a regular (non-final) boss and confirm it renders with bespoke art (no failed request).
  const spawned = JSON.parse(await page.evaluate(() => window.debug_spawn_boss()));
  if (!spawned.boss || (spawned.boss.count || 0) < 1) {
    throw new Error(`Regular boss did not spawn: ${JSON.stringify(spawned.boss)}`);
  }
  if (spawned.boss.finalBoss) {
    throw new Error(`Expected a regular boss, got the final boss: ${JSON.stringify(spawned.boss)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-boss-idle.png"), fullPage: true });

  // Force its special cast and confirm the cast state is surfaced (drives the cast row).
  const cast = JSON.parse(await page.evaluate(() => window.debug_force_enemy_cast("boss", true)));
  const casting = (cast.castingEnemies || []).find((e) => e.kind === "boss");
  if (!casting) {
    throw new Error(`Boss cast not surfaced: ${JSON.stringify(cast.castingEnemies)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-boss-cast.png"), fullPage: true });
  return { scenario: "boss", bossCount: spawned.boss.count, casting };
}

const scenarios = {
  smoke,
  "result-damage": resultDamage,
  "pause-info": pauseInfo,
  "combat-readability": combatReadability,
  "upgrade-choice": upgradeChoice,
  "enemy-summoner": enemySummoner,
  "elite-enemies": eliteEnemies,
  "hero-anim": heroAnim,
  "final-boss": finalBoss,
  boss: bossFight,
  "enemy-status": enemyStatus
};

async function enemyStatus(page) {
  // Afflict an enemy with all four statuses and confirm the status icons render (no failed request).
  const res = JSON.parse(await page.evaluate(() => JSON.stringify(window.debug_afflict_enemy())));
  const a = res.afflicted;
  if (!a || !(a.burn > 0 && a.poison > 0 && a.slow > 0 && a.curse > 0)) {
    throw new Error(`Enemy was not afflicted with all statuses: ${JSON.stringify(a)}`);
  }
  await page.screenshot({ path: path.join(artifactRoot, "loop-enemy-status.png"), fullPage: true });
  return { scenario: "enemy-status", afflicted: a };
}

async function main() {
  await fs.mkdir(artifactRoot, { recursive: true });
  const runScenario = scenarios[scenario];
  if (!runScenario) {
    throw new Error(`Unknown scenario "${scenario}". Expected one of: ${Object.keys(scenarios).join(", ")}`);
  }
  const port = await findPort();
  const server = spawn(process.execPath, ["scripts/serve-static.mjs", "survivor", String(port)], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  const serverOutput = [];
  server.stdout.on("data", (data) => serverOutput.push(data.toString()));
  server.stderr.on("data", (data) => serverOutput.push(data.toString()));
  try {
    await waitForServer(server, port);
    const result = await withPage(port, runScenario);
    const output = {
      ok: true,
      port,
      at: new Date().toISOString(),
      ...result
    };
    const outputPath = path.join(artifactRoot, `loop-${scenario}-result.json`);
    await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, scenario, outputPath }, null, 2));
  } catch (error) {
    console.error(serverOutput.join(""));
    throw error;
  } finally {
    server.kill();
  }
}

await main();
