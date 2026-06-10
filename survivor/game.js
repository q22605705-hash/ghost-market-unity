const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 2600;
const WORLD_H = 1800;
const SPRITE = 128;
const TWO_PI = Math.PI * 2;

const ROW = {
  heroIdle: 0,
  heroRun: 1,
  ghoul: 2,
  mage: 3,
  brute: 4,
  soul: 5,
  fire: 6,
  talismanBlade: 7
};

const sprites = new Image();
sprites.src = "./assets/survivor-sprites.png";

const keys = new Set();
const pressed = new Set();
const pointer = { x: W / 2, y: H / 2, down: false };
let raf = 0;
let last = performance.now();
let fixedMode = false;

const state = {
  mode: "loading",
  time: 0,
  kills: 0,
  level: 1,
  xp: 0,
  xpNeed: 8,
  shake: 0,
  freeze: 0,
  spawnT: 0,
  mageT: 0,
  eliteT: 0,
  message: "",
  camera: { x: 0, y: 0 },
  player: null,
  enemies: [],
  bullets: [],
  enemyBullets: [],
  pickups: [],
  damageText: [],
  options: [],
  stats: null
};

function resetGame() {
  state.mode = "playing";
  state.time = 0;
  state.kills = 0;
  state.level = 1;
  state.xp = 0;
  state.xpNeed = 8;
  state.shake = 0;
  state.freeze = 0;
  state.spawnT = 0;
  state.mageT = 12;
  state.eliteT = 30;
  state.message = "撐住怪潮，吃魂火升級。";
  state.camera = { x: 0, y: 0 };
  state.enemies = [];
  state.bullets = [];
  state.enemyBullets = [];
  state.pickups = [];
  state.damageText = [];
  state.options = [];
  state.stats = {
    speed: 292,
    maxHp: 180,
    regen: 1.4,
    fireRate: 0.34,
    damage: 34,
    projectileSpeed: 700,
    magnet: 190,
    area: 1,
    blades: 2,
    bladeDamage: 22,
    pierce: 0,
    dashCooldown: 1.25
  };
  state.player = {
    x: WORLD_W / 2,
    y: WORLD_H / 2,
    vx: 0,
    vy: 0,
    hp: state.stats.maxHp,
    radius: 18,
    facing: 1,
    invuln: 0,
    shootT: 0,
    dashT: 0,
    anim: 0
  };
  for (let i = 0; i < 10; i++) spawnEnemy("ghoul");
}

function startMenu() {
  state.mode = "menu";
  state.message = "像素割草新版本";
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function norm(dx, dy) {
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
}

function edgeSpawn() {
  const p = state.player;
  const side = Math.floor(Math.random() * 4);
  const margin = 430;
  let x = p.x;
  let y = p.y;
  if (side === 0) { x += rand(-margin, margin); y -= margin; }
  if (side === 1) { x += margin; y += rand(-margin, margin); }
  if (side === 2) { x += rand(-margin, margin); y += margin; }
  if (side === 3) { x -= margin; y += rand(-margin, margin); }
  return { x: clamp(x, 40, WORLD_W - 40), y: clamp(y, 40, WORLD_H - 40) };
}

function spawnEnemy(kind = "ghoul") {
  const pos = edgeSpawn();
  const minute = state.time / 60;
  const templates = {
    ghoul: { hp: 32 + minute * 9, speed: 66 + minute * 5, damage: 5, radius: 19, xp: 7 },
    mage: { hp: 52 + minute * 13, speed: 46 + minute * 3, damage: 6, radius: 18, xp: 14, shoot: rand(1.5, 2.4) },
    brute: { hp: 140 + minute * 30, speed: 38 + minute * 3, damage: 13, radius: 29, xp: 30 }
  };
  const template = templates[kind];
  state.enemies.push({
    kind,
    ...pos,
    ...template,
    maxHp: template.hp,
    hit: 0,
    anim: Math.random() * 12
  });
}

function nearestEnemy(max = Infinity) {
  let best = null;
  let bestD = max;
  for (const e of state.enemies) {
    const d = dist(state.player, e);
    if (d < bestD) {
      best = e;
      bestD = d;
    }
  }
  return best;
}

function fireAtNearest() {
  const target = nearestEnemy(760);
  if (!target) return;
  const p = state.player;
  const d = norm(target.x - p.x, target.y - p.y);
  state.bullets.push({
    x: p.x + d.x * 24,
    y: p.y + d.y * 24,
    vx: d.x * state.stats.projectileSpeed,
    vy: d.y * state.stats.projectileSpeed,
    angle: Math.atan2(d.y, d.x),
    r: 8 * state.stats.area,
    life: 1.3,
    damage: state.stats.damage,
    pierce: state.stats.pierce,
    anim: 0
  });
}

function radialBurst() {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TWO_PI;
    state.bullets.push({
      x: state.player.x,
      y: state.player.y,
      vx: Math.cos(a) * 540,
      vy: Math.sin(a) * 540,
      angle: a,
      r: 9 * state.stats.area,
      life: 0.75,
      damage: state.stats.damage * 0.85,
      pierce: 1,
      anim: 0
    });
  }
}

function damageEnemy(e, amount, knock = 16) {
  e.hp -= amount;
  e.hit = 0.1;
  const d = norm(e.x - state.player.x, e.y - state.player.y);
  e.x += d.x * knock;
  e.y += d.y * knock;
  state.damageText.push({ x: e.x, y: e.y - 18, t: 0.45, text: Math.round(amount).toString() });
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  const i = state.enemies.indexOf(e);
  if (i >= 0) state.enemies.splice(i, 1);
  state.kills++;
  const count = e.kind === "brute" ? 4 : e.kind === "mage" ? 2 : 1;
  for (let n = 0; n < count; n++) {
    state.pickups.push({ x: e.x + rand(-12, 12), y: e.y + rand(-12, 12), r: 8, xp: e.xp / count, t: 0 });
  }
  if (state.kills % 45 === 0) radialBurst();
}

function gainXp(amount) {
  state.xp += amount;
  while (state.xp >= state.xpNeed) {
    state.xp -= state.xpNeed;
    state.level++;
    state.xpNeed = Math.floor(state.xpNeed * 1.22 + 6);
    openLevelUp();
  }
}

const upgradePool = [
  { name: "符火加速", desc: "攻擊間隔 -12%", apply: () => state.stats.fireRate *= 0.88 },
  { name: "劍符增傷", desc: "傷害 +7", apply: () => state.stats.damage += 7 },
  { name: "疾行靴", desc: "移動速度 +12%", apply: () => state.stats.speed *= 1.12 },
  { name: "聚魂鈴", desc: "吸取範圍 +45", apply: () => state.stats.magnet += 45 },
  { name: "護命符", desc: "最大生命 +25 並治療", apply: () => { state.stats.maxHp += 25; state.player.hp = Math.min(state.stats.maxHp, state.player.hp + 45); } },
  { name: "旋刃", desc: "增加一把環繞刀", apply: () => state.stats.blades += 1 },
  { name: "大符紙", desc: "武器尺寸 +16%", apply: () => state.stats.area *= 1.16 },
  { name: "穿透符", desc: "符咒穿透 +1", apply: () => state.stats.pierce += 1 },
  { name: "回春印", desc: "每秒回血 +0.8", apply: () => state.stats.regen += 0.8 }
];

function openLevelUp() {
  state.mode = "level";
  state.options = [];
  const bag = [...upgradePool].sort(() => Math.random() - 0.5);
  state.options.push(...bag.slice(0, 3));
}

function chooseUpgrade(i) {
  const opt = state.options[i];
  if (!opt) return;
  opt.apply();
  state.options = [];
  state.mode = "playing";
  state.message = `${opt.name} 已強化`;
}

function update(dt) {
  if (state.mode !== "playing") return;
  if (state.freeze > 0) {
    state.freeze -= dt;
    return;
  }
  state.time += dt;
  state.shake = Math.max(0, state.shake - dt * 18);
  updatePlayer(dt);
  updateSpawns(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updatePickups(dt);
  updateEffects(dt);
  if (state.player.hp <= 0) state.mode = "dead";
}

function updatePlayer(dt) {
  const p = state.player;
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const up = keys.has("w") || keys.has("arrowup");
  const down = keys.has("s") || keys.has("arrowdown");
  const moving = left || right || up || down;
  const dir = moving ? norm((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0)) : { x: 0, y: 0 };
  p.vx = dir.x * state.stats.speed;
  p.vy = dir.y * state.stats.speed;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  if (Math.abs(dir.x) > 0.05) p.facing = dir.x < 0 ? -1 : 1;
  if ((pressed.has("shift") || pressed.has(" ")) && p.dashT <= 0) {
    const dashX = moving ? dir.x : p.facing;
    const dashY = moving ? dir.y : 0;
    p.x += dashX * 145;
    p.y += dashY * 145;
    p.invuln = 0.35;
    p.dashT = state.stats.dashCooldown;
    state.shake = 3;
  }
  p.x = clamp(p.x, 30, WORLD_W - 30);
  p.y = clamp(p.y, 30, WORLD_H - 30);
  p.invuln = Math.max(0, p.invuln - dt);
  p.dashT = Math.max(0, p.dashT - dt);
  p.hp = Math.min(state.stats.maxHp, p.hp + state.stats.regen * dt);
  p.shootT -= dt;
  if (p.shootT <= 0) {
    fireAtNearest();
    p.shootT = state.stats.fireRate;
  }
  p.anim += dt * (moving ? 12 : 6);
  updateOrbitBlades(dt);
}

function updateOrbitBlades(dt) {
  const p = state.player;
  const radius = 62 * state.stats.area;
  for (let i = 0; i < state.stats.blades; i++) {
    const a = state.time * 3.2 + (i / state.stats.blades) * TWO_PI;
    const bx = p.x + Math.cos(a) * radius;
    const by = p.y + Math.sin(a) * radius;
    for (const e of state.enemies) {
      if (Math.hypot(e.x - bx, e.y - by) < e.radius + 13 * state.stats.area) {
        damageEnemy(e, state.stats.bladeDamage * dt * 4, 5);
      }
    }
  }
}

function updateSpawns(dt) {
  const pressure = Math.min(0.5, state.time / 280);
  state.spawnT -= dt;
  state.mageT -= dt;
  state.eliteT -= dt;
  if (state.spawnT <= 0) {
    const pack = 2 + Math.floor(state.time / 34);
    for (let i = 0; i < pack; i++) spawnEnemy("ghoul");
    state.spawnT = 1.2 - pressure;
  }
  if (state.mageT <= 0) {
    spawnEnemy("mage");
    state.mageT = 7.8 - pressure * 4.5;
  }
  if (state.eliteT <= 0) {
    spawnEnemy("brute");
    state.eliteT = 27 - pressure * 16;
  }
}

function updateEnemies(dt) {
  const p = state.player;
  for (const e of [...state.enemies]) {
    e.anim += dt * 9;
    e.hit = Math.max(0, e.hit - dt);
    const d = norm(p.x - e.x, p.y - e.y);
    const desired = e.kind === "mage" && dist(e, p) < 360 ? -0.35 : 1;
    e.x += d.x * e.speed * desired * dt;
    e.y += d.y * e.speed * desired * dt;
    e.x = clamp(e.x, 20, WORLD_W - 20);
    e.y = clamp(e.y, 20, WORLD_H - 20);
    if (e.kind === "mage") {
      e.shoot -= dt;
      if (e.shoot <= 0 && dist(e, p) < 650) {
        const aim = norm(p.x - e.x, p.y - e.y);
        state.enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: aim.x * 250,
          vy: aim.y * 250,
          angle: Math.atan2(aim.y, aim.x),
          r: 9,
          life: 4.2,
          damage: 14,
          anim: 0
        });
        e.shoot = rand(1.4, 2.4);
      }
    }
    if (dist(e, p) < e.radius + p.radius && p.invuln <= 0) {
      p.hp -= e.damage;
      p.invuln = 0.6;
      state.freeze = 0.08;
      state.shake = 8;
      state.message = "受傷！用 Shift/Space 閃避，吃魂火升級。";
    }
  }
}

function updateBullets(dt) {
  for (const b of [...state.bullets]) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    b.anim += dt * 16;
    for (const e of [...state.enemies]) {
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.r) {
        damageEnemy(e, b.damage, 22);
        b.pierce -= 1;
        state.freeze = 0.025;
        if (b.pierce < 0) b.life = -1;
        break;
      }
    }
    if (b.life <= 0) state.bullets.splice(state.bullets.indexOf(b), 1);
  }
  for (const b of [...state.enemyBullets]) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    b.anim += dt * 12;
    if (Math.hypot(state.player.x - b.x, state.player.y - b.y) < state.player.radius + b.r && state.player.invuln <= 0) {
      state.player.hp -= b.damage;
      state.player.invuln = 0.55;
      state.shake = 7;
      b.life = -1;
    }
    if (b.life <= 0) state.enemyBullets.splice(state.enemyBullets.indexOf(b), 1);
  }
}

function updatePickups(dt) {
  const p = state.player;
  for (const s of [...state.pickups]) {
    s.t += dt;
    const d = dist(s, p);
    if (d < state.stats.magnet || s.t > 6) {
      const n = norm(p.x - s.x, p.y - s.y);
      const pull = d < state.stats.magnet ? state.stats.magnet - d : 80;
      s.x += n.x * (320 + pull * 4) * dt;
      s.y += n.y * (320 + pull * 4) * dt;
    }
    if (d < p.radius + 10) {
      gainXp(s.xp);
      state.pickups.splice(state.pickups.indexOf(s), 1);
    }
  }
}

function updateEffects(dt) {
  for (const t of [...state.damageText]) {
    t.t -= dt;
    t.y -= 24 * dt;
    if (t.t <= 0) state.damageText.splice(state.damageText.indexOf(t), 1);
  }
  pressed.clear();
}

function worldToScreen(x, y) {
  return { x: x - state.camera.x, y: y - state.camera.y };
}

function updateCamera() {
  const p = state.player || { x: WORLD_W / 2, y: WORLD_H / 2 };
  state.camera.x = clamp(p.x - W / 2, 0, WORLD_W - W);
  state.camera.y = clamp(p.y - H / 2, 0, WORLD_H - H);
  if (state.shake > 0) {
    state.camera.x += rand(-state.shake, state.shake);
    state.camera.y += rand(-state.shake, state.shake);
  }
}

function draw() {
  updateCamera();
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  if (state.mode === "menu" || state.mode === "loading") {
    drawMenu();
    return;
  }
  drawPickups();
  drawBullets();
  drawEnemies();
  drawPlayer();
  drawOrbitBlades();
  drawDamageText();
  drawHud();
  if (state.mode === "level") drawLevelUp();
  if (state.mode === "dead") drawDead();
}

function drawBackground() {
  ctx.fillStyle = "#071016";
  ctx.fillRect(0, 0, W, H);
  const cx = -state.camera.x % 96;
  const cy = -state.camera.y % 96;
  for (let y = cy - 96; y < H + 96; y += 96) {
    for (let x = cx - 96; x < W + 96; x += 96) {
      ctx.fillStyle = ((x + y) / 96) % 2 === 0 ? "#0d1b20" : "#0a151a";
      ctx.fillRect(x, y, 96, 96);
      ctx.fillStyle = "#163039";
      ctx.fillRect(x + 8, y + 88, 52, 4);
      ctx.fillStyle = "#2a604f";
      if ((x + y) % 192 === 0) ctx.fillRect(x + 72, y + 22, 8, 22);
    }
  }
}

function drawSprite(row, frame, x, y, size = SPRITE, flip = false, angle = 0, alpha = 1, anchorX = 64, anchorY = 64) {
  const sx = (frame % 12) * SPRITE;
  const sy = row * SPRITE;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (angle) ctx.rotate(angle);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sprites, sx, sy, SPRITE, SPRITE, -(anchorX / SPRITE) * size, -(anchorY / SPRITE) * size, size, size);
  ctx.restore();
}

function drawPlayer() {
  const p = state.player;
  const s = worldToScreen(p.x, p.y);
  const moving = Math.abs(p.vx) + Math.abs(p.vy) > 1;
  const row = moving ? ROW.heroRun : ROW.heroIdle;
  const alpha = p.invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0 ? 0.55 : 1;
  drawSprite(row, Math.floor(p.anim) % 12, s.x, s.y, 116, p.facing < 0, 0, alpha, 64, 112);
}

function drawEnemies() {
  for (const e of state.enemies) {
    const s = worldToScreen(e.x, e.y);
    const row = e.kind === "mage" ? ROW.mage : e.kind === "brute" ? ROW.brute : ROW.ghoul;
    const size = e.kind === "brute" ? 124 : e.kind === "mage" ? 104 : 96;
    if (e.hit > 0) drawSprite(row, Math.floor(e.anim) % 12, s.x, s.y, size + 8, e.x > state.player.x, 0, 0.45, 64, 112);
    drawSprite(row, Math.floor(e.anim) % 12, s.x, s.y, size, e.x > state.player.x, 0, 1, 64, 112);
    ctx.fillStyle = "#1b0b0b";
    ctx.fillRect(s.x - 22, s.y - size * 0.9, 44, 5);
    ctx.fillStyle = e.kind === "brute" ? "#ff7b32" : "#f04452";
    ctx.fillRect(s.x - 22, s.y - size * 0.9, 44 * Math.max(0, e.hp / e.maxHp), 5);
  }
}

function drawBullets() {
  for (const b of state.bullets) {
    const s = worldToScreen(b.x, b.y);
    drawSprite(ROW.talismanBlade, Math.floor(b.anim) % 6, s.x, s.y, 62 * state.stats.area, false, b.angle);
  }
  for (const b of state.enemyBullets) {
    const s = worldToScreen(b.x, b.y);
    drawSprite(ROW.fire, Math.floor(b.anim) % 12, s.x, s.y, 66, false, b.angle);
  }
}

function drawPickups() {
  for (const p of state.pickups) {
    const s = worldToScreen(p.x, p.y + Math.sin(p.t * 8) * 4);
    drawSprite(ROW.soul, Math.floor(p.t * 10) % 12, s.x, s.y, 56);
  }
}

function drawOrbitBlades() {
  const p = state.player;
  const radius = 62 * state.stats.area;
  for (let i = 0; i < state.stats.blades; i++) {
    const a = state.time * 3.2 + (i / state.stats.blades) * TWO_PI;
    const s = worldToScreen(p.x + Math.cos(a) * radius, p.y + Math.sin(a) * radius);
    drawSprite(ROW.talismanBlade, 6 + (Math.floor(state.time * 14 + i) % 6), s.x, s.y, 62 * state.stats.area, false, a);
  }
}

function drawDamageText() {
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  for (const t of state.damageText) {
    const s = worldToScreen(t.x, t.y);
    ctx.fillStyle = `rgba(255, 238, 150, ${Math.max(0, t.t / 0.45)})`;
    ctx.fillText(t.text, s.x, s.y);
  }
}

function drawHud() {
  const p = state.player;
  panel(18, 16, 438, 86);
  bar(34, 44, 180, 12, p.hp / state.stats.maxHp, "#f04452");
  bar(34, 72, 180, 12, p.dashT <= 0 ? 1 : 1 - p.dashT / state.stats.dashCooldown, "#47d7ff");
  bar(248, 72, 170, 12, state.xp / state.xpNeed, "#67f070");
  text("生命", 34, 36, 14);
  text("閃避", 34, 64, 14);
  text(`Lv ${state.level}`, 248, 64, 14);
  text(`擊殺 ${state.kills}`, 248, 36, 14);
  text(formatTime(state.time), 370, 36, 18, "#ffe8ad");
  text(state.message, 26, H - 28, 16, "#d8e3df");
}

function drawMenu() {
  panel(310, 145, 660, 420);
  center("符火夜行", W / 2, 220, 54, "#fff4d8");
  center("2D 像素割草：怪潮追擊、遠程火球、符咒自動攻擊。", W / 2, 278, 20, "#d9e3df");
  center("WASD / 方向鍵移動  |  Shift / Space 閃避  |  吃魂火升級", W / 2, 322, 18, "#a8c8c0");
  center(state.mode === "loading" ? "載入像素素材中..." : "點擊畫面或按 Enter 開始", W / 2, 428, 30, "#ffe8ad");
}

function drawLevelUp() {
  panel(235, 126, 810, 468);
  center("選擇一個符咒強化", W / 2, 190, 36, "#fff4d8");
  for (let i = 0; i < state.options.length; i++) {
    const x = 290 + i * 245;
    card(x, 260, 210, 210, state.options[i], i + 1);
  }
}

function drawDead() {
  panel(365, 210, 550, 270);
  center("魂火熄滅", W / 2, 285, 42, "#fff4d8");
  center(`存活 ${formatTime(state.time)} / 擊殺 ${state.kills} / 等級 ${state.level}`, W / 2, 340, 20, "#d9e3df");
  center("按 Enter 重新開始", W / 2, 410, 26, "#ffe8ad");
}

function card(x, y, w, h, opt, n) {
  ctx.fillStyle = "#101b20";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#42615e";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  center(`${n}`, x + 28, y + 34, 24, "#ffe8ad");
  text(opt.name, x + 24, y + 76, 24, "#fff4d8");
  wrap(opt.desc, x + 24, y + 116, w - 48, 20, "#b9d0ca");
}

function panel(x, y, w, h) {
  ctx.fillStyle = "rgba(5, 10, 13, 0.88)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#31444a";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function bar(x, y, w, h, value, color) {
  ctx.fillStyle = "#223038";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(value, 0, 1), h);
}

function text(value, x, y, size = 16, color = "#eaf2ee") {
  ctx.font = `${size}px "Microsoft JhengHei", sans-serif`;
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function center(value, x, y, size = 24, color = "#eaf2ee") {
  ctx.font = `${size}px "Microsoft JhengHei", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function wrap(value, x, y, w, line, color) {
  ctx.font = `18px "Microsoft JhengHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  let current = "";
  for (const ch of value) {
    const next = current + ch;
    if (ctx.measureText(next).width > w) {
      ctx.fillText(current, x, y);
      current = ch;
      y += line + 5;
    } else current = next;
  }
  if (current) ctx.fillText(current, x, y);
}

function formatTime(t) {
  const m = Math.floor(t / 60).toString().padStart(2, "0");
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (!fixedMode) update(dt);
  draw();
  raf = requestAnimationFrame(loop);
}

function clickAt(x, y) {
  if (state.mode === "menu" || state.mode === "dead") {
    resetGame();
    return;
  }
  if (state.mode === "level") {
    const cards = [290, 535, 780];
    for (let i = 0; i < cards.length; i++) {
      if (x >= cards[i] && x <= cards[i] + 210 && y >= 260 && y <= 470) chooseUpgrade(i);
    }
  }
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
  if (state.mode === "menu" && k === "enter") resetGame();
  else if (state.mode === "dead" && k === "enter") resetGame();
  else if (state.mode === "level" && ["1", "2", "3"].includes(k)) chooseUpgrade(Number(k) - 1);
  if (k === "f") canvas.requestFullscreen?.();
});

window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener("pointermove", (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * W;
  pointer.y = ((e.clientY - r.top) / r.height) * H;
});
canvas.addEventListener("pointerdown", () => {
  pointer.down = true;
  clickAt(pointer.x, pointer.y);
});
canvas.addEventListener("pointerup", () => pointer.down = false);

window.render_game_to_text = () => JSON.stringify({
  mode: state.mode,
  time: Number(state.time.toFixed(1)),
  player: state.player ? { x: Math.round(state.player.x), y: Math.round(state.player.y), hp: Math.round(state.player.hp), level: state.level } : null,
  enemies: state.enemies.length,
  rangedEnemies: state.enemies.filter((e) => e.kind === "mage").length,
  bullets: state.bullets.length,
  enemyBullets: state.enemyBullets.length,
  pickups: state.pickups.length,
  kills: state.kills,
  sprites: {
    complete: sprites.complete,
    naturalWidth: sprites.naturalWidth,
    naturalHeight: sprites.naturalHeight
  },
  note: "All gameplay actors are drawn from survivor-sprites.png."
});

window.advanceTime = (ms) => {
  fixedMode = true;
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(1 / 60);
  draw();
};

sprites.onload = () => {
  startMenu();
  last = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
};

sprites.onerror = () => {
  state.mode = "loading";
  state.message = "素材載入失敗，請重新整理。";
  draw();
};
