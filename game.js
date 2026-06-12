const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 2600;
const WORLD_H = 1800;
const SPRITE = 128;
const TWO_PI = Math.PI * 2;
const VIEW_SCALE = 0.78;

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
const skillEffects = new Image();
skillEffects.src = "./assets/skill-effects.png";
const skillIcons = new Image();
skillIcons.src = "./assets/raw/gpt-skill-icons-whitematte.png";
let keyedSkillIcons = null;

const keys = new Set();
const pressed = new Set();
const pointer = { x: W / 2, y: H / 2, down: false };
let raf = 0;
let last = performance.now();
let fixedMode = false;
let nextEnemyId = 1;

const state = {
  mode: "loading",
  time: 0,
  kills: 0,
  level: 1,
  xp: 0,
  xpNeed: 18,
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
  effects: [],
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
  state.xpNeed = 18;
  state.shake = 0;
  state.freeze = 0;
  state.spawnT = 0;
  state.mageT = 12;
  state.eliteT = 30;
  nextEnemyId = 1;
  state.message = "撐住怪潮，吃魂火升級。";
  state.camera = { x: 0, y: 0 };
  state.enemies = [];
  state.bullets = [];
  state.enemyBullets = [];
  state.pickups = [];
  state.effects = [];
  state.damageText = [];
  state.options = [];
  state.stats = {
    speed: 292,
    maxHp: 180,
    regen: 1.4,
    fireRate: 0.38,
    damage: 28,
    projectileSpeed: 680,
    magnet: 135,
    area: 1,
    blades: 2,
    bladeDamage: 17,
    pierce: 0,
    dashCooldown: 1.25,
    element: null,
    fire: { burn: 0, explosion: 0, meteor: 0 },
    water: { slow: 0, frostNova: 0, shard: 0 },
    lightning: { chain: 0, crit: 0, storm: 0 },
    poison: { venom: 0, cloud: 0, weaken: 0 },
    shadow: { curse: 0, execute: 0, void: 0 },
    holy: { heal: 0, shield: 0, smite: 0 },
    wind: { speed: 0, cyclone: 0, split: 0 }
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
    ghoul: { hp: 48 + minute * 14, speed: 66 + minute * 5, damage: 5, radius: 19, xp: 5 },
    mage: { hp: 78 + minute * 20, speed: 46 + minute * 3, damage: 6, radius: 18, xp: 12, shoot: rand(1.5, 2.4) },
    brute: { hp: 210 + minute * 48, speed: 38 + minute * 3, damage: 13, radius: 29, xp: 30 }
  };
  const template = templates[kind];
  state.enemies.push({
    id: nextEnemyId++,
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
    element: state.stats.element,
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
      element: state.stats.element,
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
  const recent = state.damageText.find((text) => text.enemyId === e.id && text.t > 0.32);
  if (recent) {
    recent.amount += amount;
    recent.text = Math.round(recent.amount).toString();
    recent.x = e.x;
    recent.y = e.y - 18;
    recent.t = 0.45;
  } else {
    state.damageText.push({ enemyId: e.id, amount, x: e.x, y: e.y - 18, t: 0.45, text: Math.round(amount).toString() });
  }
  if (e.hp <= 0) killEnemy(e);
}

function addEffect(row, frame, x, y, size = 120, life = 0.45, angle = 0, alpha = 0.95) {
  state.effects.push({ row, frame, x, y, size, life, maxLife: life, angle, alpha });
}

function applyElementHit(e, b) {
  const element = b.element || state.stats.element;
  if (!element) return;
  if (element === "fire") {
    addEffect(0, state.stats.fire.explosion > 0 ? 0 : 5, e.x, e.y - 10, 118, 0.38);
    e.burn = Math.max(e.burn || 0, 1.8 + state.stats.fire.burn * 0.65);
    if (state.stats.fire.explosion > 0 && Math.random() < 0.18 + state.stats.fire.explosion * 0.08) {
      addEffect(0, 2, e.x, e.y - 8, 150 + state.stats.fire.explosion * 10, 0.45);
      for (const other of state.enemies) {
        if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 76 + state.stats.fire.explosion * 18) {
          damageEnemy(other, state.stats.damage * (0.45 + state.stats.fire.explosion * 0.12), 10);
        }
      }
    }
  }
  if (element === "water") {
    addEffect(1, state.stats.water.frostNova > 0 ? 4 : 3, e.x, e.y - 8, 120 + state.stats.water.frostNova * 10, 0.45);
    e.slow = Math.max(e.slow || 0, 1.4 + state.stats.water.slow * 0.35);
    if (state.stats.water.shard > 0 && Math.random() < 0.22) {
      b.pierce += 1;
    }
  }
  if (element === "lightning") {
    addEffect(2, state.stats.lightning.storm > 0 ? 7 : 0, e.x, e.y - 12, 130, 0.32);
    if (state.stats.lightning.crit > 0 && Math.random() < 0.12 + state.stats.lightning.crit * 0.08) {
      damageEnemy(e, state.stats.damage * 0.7, 8);
    }
    let jumps = state.stats.lightning.chain;
    let from = e;
    const hit = new Set([e]);
    while (jumps > 0) {
      let target = null;
      let best = 150;
      for (const other of state.enemies) {
        if (hit.has(other)) continue;
        const d = Math.hypot(other.x - from.x, other.y - from.y);
        if (d < best) {
          best = d;
          target = other;
        }
      }
      if (!target) break;
      addEffect(2, 3, (from.x + target.x) / 2, (from.y + target.y) / 2 - 10, 118, 0.25, Math.atan2(target.y - from.y, target.x - from.x));
      damageEnemy(target, state.stats.damage * 0.38, 6);
      hit.add(target);
      from = target;
      jumps--;
    }
  }
  if (element === "poison") {
    addEffect(3, state.stats.poison.cloud > 0 ? 2 : 0, e.x, e.y - 6, 120 + state.stats.poison.cloud * 12, 0.55);
    e.poison = Math.max(e.poison || 0, 2.4 + state.stats.poison.venom * 0.7);
    e.weaken = Math.max(e.weaken || 0, state.stats.poison.weaken > 0 ? 1.6 + state.stats.poison.weaken * 0.3 : 0);
    if (state.stats.poison.cloud > 0 && Math.random() < 0.16 + state.stats.poison.cloud * 0.08) {
      for (const other of state.enemies) {
        if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 92 + state.stats.poison.cloud * 16) {
          other.poison = Math.max(other.poison || 0, 1.4 + state.stats.poison.venom * 0.45);
        }
      }
    }
  }
  if (element === "shadow") {
    addEffect(3, state.stats.shadow.void > 0 ? 6 : 3, e.x, e.y - 8, 124, 0.4);
    e.curse = Math.max(e.curse || 0, 1.7 + state.stats.shadow.curse * 0.45);
    if (state.stats.shadow.execute > 0 && e.hp / e.maxHp < 0.22 + state.stats.shadow.execute * 0.04) {
      damageEnemy(e, state.stats.damage * (0.9 + state.stats.shadow.execute * 0.2), 12);
      addEffect(3, 4, e.x, e.y - 10, 140, 0.35);
    }
  }
  if (element === "holy") {
    addEffect(4, state.stats.holy.smite > 0 ? 3 : 1, e.x, e.y - 12, 120, 0.36);
    if (state.stats.holy.smite > 0) damageEnemy(e, state.stats.damage * (0.18 + state.stats.holy.smite * 0.08), 4);
    if (state.stats.holy.heal > 0 && Math.random() < 0.1 + state.stats.holy.heal * 0.04) {
      state.player.hp = Math.min(state.stats.maxHp, state.player.hp + 2 + state.stats.holy.heal * 2);
      addEffect(4, 0, state.player.x, state.player.y - 32, 112, 0.45);
    }
  }
  if (element === "wind") {
    addEffect(4, state.stats.wind.cyclone > 0 ? 7 : 6, e.x, e.y - 8, 118 + state.stats.wind.cyclone * 10, 0.38);
    if (state.stats.wind.split > 0 && Math.random() < 0.18 + state.stats.wind.split * 0.06) {
      b.pierce += 1;
      e.slow = Math.max(e.slow || 0, 0.5);
    }
  }
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
    state.xpNeed = Math.floor(state.xpNeed * 1.22 + 10 + state.level);
    openLevelUp();
  }
}

const baseUpgradePool = [
  { name: "符火加速", desc: "攻擊間隔 -12%", apply: () => state.stats.fireRate *= 0.88 },
  { name: "劍符增傷", desc: "傷害 +7", apply: () => state.stats.damage += 7 },
  { name: "疾行靴", desc: "移動速度 +12%", apply: () => state.stats.speed *= 1.12 },
  { name: "聚魂鈴", desc: "吸取範圍 +30", apply: () => state.stats.magnet += 30 },
  { name: "護命符", desc: "最大生命 +25 並治療", apply: () => { state.stats.maxHp += 25; state.player.hp = Math.min(state.stats.maxHp, state.player.hp + 45); } },
  { name: "旋刃", desc: "增加一把環繞刀", apply: () => state.stats.blades += 1 },
  { name: "大符紙", desc: "武器尺寸 +16%", apply: () => state.stats.area *= 1.16 },
  { name: "穿透符", desc: "符咒穿透 +1", apply: () => state.stats.pierce += 1 },
  { name: "回春印", desc: "每秒回血 +0.8", apply: () => state.stats.regen += 0.8 }
];

const elementUnlocks = [
  { name: "火系符脈", desc: "符咒附加燃燒，之後出現火系分支", apply: () => { state.stats.element = "fire"; state.stats.fire.burn += 1; } },
  { name: "水系符脈", desc: "符咒附加緩速，之後出現水系分支", apply: () => { state.stats.element = "water"; state.stats.water.slow += 1; } },
  { name: "雷系符脈", desc: "符咒可連鎖跳電，之後出現雷系分支", apply: () => { state.stats.element = "lightning"; state.stats.lightning.chain += 1; } },
  { name: "毒系符脈", desc: "符咒附加毒蝕，之後出現毒系分支", apply: () => { state.stats.element = "poison"; state.stats.poison.venom += 1; } },
  { name: "影系符脈", desc: "符咒附加詛咒，之後出現暗影分支", apply: () => { state.stats.element = "shadow"; state.stats.shadow.curse += 1; } },
  { name: "聖系符脈", desc: "符咒命中可回復，之後出現聖光分支", apply: () => { state.stats.element = "holy"; state.stats.holy.heal += 1; } },
  { name: "風系符脈", desc: "符咒帶旋風，之後出現風系分支", apply: () => { state.stats.element = "wind"; state.stats.wind.speed += 1; state.stats.speed *= 1.06; } }
];

const elementBranches = {
  fire: [
    { name: "灼燒延長", desc: "燃燒時間與傷害提高", apply: () => state.stats.fire.burn += 1 },
    { name: "爆炎符", desc: "命中有機率造成小範圍爆炸", apply: () => state.stats.fire.explosion += 1 },
    { name: "隕火印", desc: "提升火系爆發與燃燒擴散", apply: () => { state.stats.fire.meteor += 1; state.stats.damage += 4; } }
  ],
  water: [
    { name: "寒流符", desc: "緩速時間增加", apply: () => state.stats.water.slow += 1 },
    { name: "霜環", desc: "提高控場，旋刃範圍增加", apply: () => { state.stats.water.frostNova += 1; state.stats.area *= 1.08; } },
    { name: "冰晶裂片", desc: "水系符咒有機率增加穿透", apply: () => state.stats.water.shard += 1 }
  ],
  lightning: [
    { name: "連鎖雷", desc: "雷系命中後多跳一名敵人", apply: () => state.stats.lightning.chain += 1 },
    { name: "雷暴會心", desc: "雷系有機率追加傷害", apply: () => state.stats.lightning.crit += 1 },
    { name: "風暴核心", desc: "提升雷系跳電與攻速", apply: () => { state.stats.lightning.storm += 1; state.stats.fireRate *= 0.94; } }
  ],
  poison: [
    { name: "猛毒符", desc: "毒蝕時間與傷害提高", apply: () => state.stats.poison.venom += 1 },
    { name: "毒霧", desc: "命中有機率擴散毒雲", apply: () => state.stats.poison.cloud += 1 },
    { name: "腐蝕印", desc: "中毒敵人傷害降低", apply: () => state.stats.poison.weaken += 1 }
  ],
  shadow: [
    { name: "暗影咒", desc: "詛咒時間提高", apply: () => state.stats.shadow.curse += 1 },
    { name: "斬魂", desc: "低血敵人受到斬殺傷害", apply: () => state.stats.shadow.execute += 1 },
    { name: "虛空裂隙", desc: "暗影命中特效和爆發提高", apply: () => { state.stats.shadow.void += 1; state.stats.damage += 3; } }
  ],
  holy: [
    { name: "聖療", desc: "命中時有機率治療玩家", apply: () => state.stats.holy.heal += 1 },
    { name: "金盾", desc: "提高最大生命與受擊容錯", apply: () => { state.stats.holy.shield += 1; state.stats.maxHp += 18; state.player.hp += 18; } },
    { name: "聖裁", desc: "聖系命中追加光傷", apply: () => state.stats.holy.smite += 1 }
  ],
  wind: [
    { name: "疾風步", desc: "移動速度與閃避節奏提升", apply: () => { state.stats.wind.speed += 1; state.stats.speed *= 1.08; state.stats.dashCooldown *= 0.95; } },
    { name: "旋風刃", desc: "風系命中產生更大旋風", apply: () => state.stats.wind.cyclone += 1 },
    { name: "裂風", desc: "風系符咒有機率增加穿透", apply: () => state.stats.wind.split += 1 }
  ]
};

function currentUpgradePool() {
  const pool = [...baseUpgradePool];
  if (!state.stats.element && state.level >= 2) pool.push(...elementUnlocks);
  if (state.stats.element) pool.push(...elementBranches[state.stats.element]);
  return pool;
}

function openLevelUp() {
  state.mode = "level";
  state.options = [];
  const baseBag = [...baseUpgradePool].sort(() => Math.random() - 0.5);
  if (!state.stats.element && state.level >= 2) {
    const elementBag = [...elementUnlocks].sort(() => Math.random() - 0.5);
    state.options.push(elementBag[0], elementBag[1], baseBag[0]);
    return;
  }
  if (state.stats.element) {
    const branchBag = [...elementBranches[state.stats.element]].sort(() => Math.random() - 0.5);
    state.options.push(branchBag[0], baseBag[0], branchBag[1] ?? baseBag[1]);
    return;
  }
  state.options.push(...baseBag.slice(0, 3));
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
  const radius = 42 * state.stats.area;
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
    state.spawnT = 1.45 - pressure;
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
    if (e.burn > 0) {
      e.burn -= dt;
      damageEnemy(e, (2.5 + state.stats.fire.burn * 1.4) * dt, 0);
      if (e.hp <= 0) continue;
    }
    if (e.poison > 0) {
      e.poison -= dt;
      damageEnemy(e, (1.8 + state.stats.poison.venom * 1.7) * dt, 0);
      if (e.hp <= 0) continue;
    }
    e.curse = Math.max(0, (e.curse || 0) - dt);
    e.weaken = Math.max(0, (e.weaken || 0) - dt);
    e.slow = Math.max(0, (e.slow || 0) - dt);
    const d = norm(p.x - e.x, p.y - e.y);
    const desired = e.kind === "mage" && dist(e, p) < 360 ? -0.35 : 1;
    const slowFactor = e.slow > 0 ? 0.58 : 1;
    e.x += d.x * e.speed * desired * slowFactor * dt;
    e.y += d.y * e.speed * desired * slowFactor * dt;
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
      const contactDamage = e.weaken > 0 ? e.damage * 0.72 : e.damage;
      const shieldBlock = state.stats.holy.shield > 0 ? Math.min(e.damage * 0.35, state.stats.holy.shield * 2) : 0;
      p.hp -= Math.max(1, contactDamage - shieldBlock);
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
        applyElementHit(e, b);
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
    if (d < state.stats.magnet) {
      const n = norm(p.x - s.x, p.y - s.y);
      const pull = state.stats.magnet - d;
      s.x += n.x * (180 + pull * 3.2) * dt;
      s.y += n.y * (180 + pull * 3.2) * dt;
    }
    if (d < p.radius + 10) {
      gainXp(s.xp);
      state.pickups.splice(state.pickups.indexOf(s), 1);
    }
  }
}

function updateEffects(dt) {
  for (const fx of [...state.effects]) {
    fx.life -= dt;
    if (fx.life <= 0) state.effects.splice(state.effects.indexOf(fx), 1);
  }
  for (const t of [...state.damageText]) {
    t.t -= dt;
    t.y -= 24 * dt;
    if (t.t <= 0) state.damageText.splice(state.damageText.indexOf(t), 1);
  }
  pressed.clear();
}

function worldToScreen(x, y) {
  return { x: (x - state.camera.x) * VIEW_SCALE, y: (y - state.camera.y) * VIEW_SCALE };
}

function updateCamera() {
  const p = state.player || { x: WORLD_W / 2, y: WORLD_H / 2 };
  state.camera.x = clamp(p.x - W / (2 * VIEW_SCALE), 0, WORLD_W - W / VIEW_SCALE);
  state.camera.y = clamp(p.y - H / (2 * VIEW_SCALE), 0, WORLD_H - H / VIEW_SCALE);
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
  drawEffects();
  drawPlayer();
  drawOrbitBlades();
  drawDamageText();
  drawHud();
  if (state.mode === "level") drawLevelUp();
  if (state.mode === "dead") drawDead();
}

function drawBackground() {
  ctx.fillStyle = "#071414";
  ctx.fillRect(0, 0, W, H);
  const tile = 128 * VIEW_SCALE;
  const cx = -(state.camera.x * VIEW_SCALE) % tile;
  const cy = -(state.camera.y * VIEW_SCALE) % tile;
  for (let y = cy - tile; y < H + tile; y += tile) {
    for (let x = cx - tile; x < W + tile; x += tile) {
      const parity = (Math.round((x - cx) / tile) + Math.round((y - cy) / tile)) % 2;
      ctx.fillStyle = parity ? "#0d1d1b" : "#0a1818";
      ctx.fillRect(x, y, tile, tile);
      ctx.fillStyle = "#14312f";
      ctx.fillRect(x + 12 * VIEW_SCALE, y + 98 * VIEW_SCALE, 54 * VIEW_SCALE, 5 * VIEW_SCALE);
      ctx.fillStyle = "#1d4b43";
      if (parity === 0) ctx.fillRect(x + 86 * VIEW_SCALE, y + 24 * VIEW_SCALE, 7 * VIEW_SCALE, 28 * VIEW_SCALE);
      ctx.fillStyle = "#102826";
      if (parity !== 0) ctx.fillRect(x + 30 * VIEW_SCALE, y + 32 * VIEW_SCALE, 38 * VIEW_SCALE, 4 * VIEW_SCALE);
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
  if (state.stats.element) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = elementColor(state.stats.element);
    ctx.beginPath();
    ctx.arc(s.x, s.y - 34 * VIEW_SCALE, 42 * VIEW_SCALE, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
  drawSprite(row, Math.floor(p.anim) % 12, s.x, s.y, 116 * VIEW_SCALE, p.facing < 0, 0, alpha, 64, 112);
}

function drawSkillEffect(row, frame, x, y, size = 128, angle = 0, alpha = 1) {
  if (!skillEffects.complete) return;
  const sx = (frame % 8) * 128;
  const sy = row * 128;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (angle) ctx.rotate(angle);
  ctx.drawImage(skillEffects, sx, sy, 128, 128, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function buildKeyedSkillIcons() {
  if (!skillIcons.complete || keyedSkillIcons) return;
  const canvas = document.createElement("canvas");
  canvas.width = skillIcons.naturalWidth;
  canvas.height = skillIcons.naturalHeight;
  const kctx = canvas.getContext("2d", { willReadFrequently: true });
  kctx.drawImage(skillIcons, 0, 0);
  const image = kctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = image;
  const cols = 8;
  const rows = 2;
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);

  const isMatte = (x, y) => {
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    return a > 0 && r > 180 && g > 180 && b > 180 && Math.max(r, g, b) - Math.min(r, g, b) < 55;
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = Math.round(col * width / cols);
      const y0 = Math.round(row * height / rows);
      const x1 = col === cols - 1 ? width : Math.round((col + 1) * width / cols);
      const y1 = row === rows - 1 ? height : Math.round((row + 1) * height / rows);
      const localW = x1 - x0;
      const localH = y1 - y0;
      const seen = new Uint8Array(localW * localH);
      const queue = [];
      const push = (x, y) => {
        if (x < x0 || y < y0 || x >= x1 || y >= y1) return;
        const lx = x - x0;
        const ly = y - y0;
        const p = ly * localW + lx;
        if (seen[p] || !isMatte(x, y)) return;
        seen[p] = 1;
        queue.push([x, y]);
      };
      for (let x = x0; x < x1; x++) {
        push(x, y0);
        push(x, y1 - 1);
      }
      for (let y = y0; y < y1; y++) {
        push(x0, y);
        push(x1 - 1, y);
      }
      for (let q = 0; q < queue.length; q++) {
        const [x, y] = queue[q];
        const i = (y * width + x) * 4;
        data[i + 3] = 0;
        push(x + 1, y);
        push(x - 1, y);
        push(x, y + 1);
        push(x, y - 1);
      }
    }
  }
  const bounds = [];
  for (let row = 0; row < rows; row++) {
    const y0 = Math.round(row * height / rows);
    const y1 = row === rows - 1 ? height : Math.round((row + 1) * height / rows);
    const counts = [];
    for (let x = 0; x < width; x++) {
      let count = 0;
      for (let y = y0; y < y1; y++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] >= 24 && !isMatte(x, y)) count++;
      }
      counts[x] = count;
    }
    const groups = [];
    for (let x = 0; x < width; x++) {
      if (counts[x] <= 2) continue;
      const last = groups[groups.length - 1];
      if (!last || x > last.end + 18) groups.push({ start: x, end: x });
      else last.end = x;
    }
    const usable = groups.length >= cols
      ? groups.slice(0, cols)
      : Array.from({ length: cols }, (_, col) => ({
        start: Math.round(col * width / cols),
        end: col === cols - 1 ? width - 1 : Math.round((col + 1) * width / cols) - 1
      }));

    for (let col = 0; col < cols; col++) {
      const x0 = usable[col].start;
      const x1 = usable[col].end + 1;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          if (data[i + 3] < 24 || isMatte(x, y)) continue;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      bounds[row * cols + col] = Number.isFinite(minX)
        ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
        : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
  }
  kctx.putImageData(image, 0, 0);
  keyedSkillIcons = { canvas, cols, rows: 2, cellW, cellH, bounds };
}

function drawUpgradeIcon(icon, x, y, size = 74) {
  buildKeyedSkillIcons();
  if (!keyedSkillIcons) {
    drawSkillEffect(icon.row, icon.frame, x, y, size, 0, 1);
    return;
  }
  const { canvas, cols, bounds } = keyedSkillIcons;
  const source = bounds[(icon.iconRow ?? 1) * cols + icon.frame];
  const pad = 2;
  const sx = Math.max(0, source.x - pad);
  const sy = Math.max(0, source.y - pad);
  const sw = Math.min(canvas.width - sx, source.w + pad * 2);
  const sh = Math.min(canvas.height - sy, source.h + pad * 2);
  const fit = Math.min(size / sw, size / sh);
  const dw = Math.round(sw * fit);
  const dh = Math.round(sh * fit);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, sx, sy, sw, sh, Math.round(x - dw / 2), Math.round(y - dh / 2), dw, dh);
  ctx.restore();
}

function drawEffects() {
  for (const fx of state.effects) {
    const s = worldToScreen(fx.x, fx.y);
    const t = Math.max(0, fx.life / fx.maxLife);
    drawSkillEffect(fx.row, fx.frame, s.x, s.y, fx.size * VIEW_SCALE * (1 + (1 - t) * 0.12), fx.angle, fx.alpha * t);
  }
}

function drawEnemies() {
  for (const e of state.enemies) {
    const s = worldToScreen(e.x, e.y);
    const row = e.kind === "mage" ? ROW.mage : e.kind === "brute" ? ROW.brute : ROW.ghoul;
    const size = e.kind === "brute" ? 124 : e.kind === "mage" ? 104 : 96;
    if (e.hit > 0) drawSprite(row, Math.floor(e.anim) % 12, s.x, s.y, (size + 8) * VIEW_SCALE, e.x > state.player.x, 0, 0.45, 64, 112);
    drawSprite(row, Math.floor(e.anim) % 12, s.x, s.y, size * VIEW_SCALE, e.x > state.player.x, 0, 1, 64, 112);
    ctx.fillStyle = "#1b0b0b";
    ctx.fillRect(s.x - 22 * VIEW_SCALE, s.y - size * 0.9 * VIEW_SCALE, 44 * VIEW_SCALE, 5 * VIEW_SCALE);
    ctx.fillStyle = e.kind === "brute" ? "#ff7b32" : "#f04452";
    ctx.fillRect(s.x - 22 * VIEW_SCALE, s.y - size * 0.9 * VIEW_SCALE, 44 * Math.max(0, e.hp / e.maxHp) * VIEW_SCALE, 5 * VIEW_SCALE);
  }
}

function drawBullets() {
  for (const b of state.bullets) {
    const s = worldToScreen(b.x, b.y);
    drawElementTrail(b, s);
    drawSprite(ROW.talismanBlade, Math.floor(b.anim) % 6, s.x, s.y, 62 * state.stats.area * VIEW_SCALE, false, b.angle);
  }
  for (const b of state.enemyBullets) {
    const s = worldToScreen(b.x, b.y);
    drawSprite(ROW.fire, Math.floor(b.anim) % 12, s.x, s.y, 66 * VIEW_SCALE, false, b.angle);
  }
}

function elementColor(element) {
  if (element === "fire") return "#ff7a1a";
  if (element === "water") return "#50d8ff";
  if (element === "lightning") return "#f6e95d";
  if (element === "poison") return "#87ef38";
  if (element === "shadow") return "#b25cff";
  if (element === "holy") return "#ffe16b";
  if (element === "wind") return "#9effbe";
  return "#ffffff";
}

function elementName(element) {
  if (element === "fire") return "火系";
  if (element === "water") return "水系";
  if (element === "lightning") return "雷系";
  if (element === "poison") return "毒系";
  if (element === "shadow") return "影系";
  if (element === "holy") return "聖系";
  if (element === "wind") return "風系";
  return "未選";
}

function drawElementTrail(b, s) {
  if (!b.element) return;
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = elementColor(b.element);
  ctx.lineWidth = 4 * VIEW_SCALE;
  ctx.beginPath();
  ctx.moveTo(s.x - Math.cos(b.angle) * 26 * VIEW_SCALE, s.y - Math.sin(b.angle) * 26 * VIEW_SCALE);
  ctx.lineTo(s.x - Math.cos(b.angle) * 7 * VIEW_SCALE, s.y - Math.sin(b.angle) * 7 * VIEW_SCALE);
  ctx.stroke();
  if (b.element === "lightning") {
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(s.x - 10 * VIEW_SCALE, s.y - 8 * VIEW_SCALE);
    ctx.lineTo(s.x + 4 * VIEW_SCALE, s.y + 2 * VIEW_SCALE);
    ctx.lineTo(s.x - 2 * VIEW_SCALE, s.y + 12 * VIEW_SCALE);
    ctx.stroke();
  }
  if (b.element === "poison" || b.element === "shadow" || b.element === "holy" || b.element === "wind") {
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 10 * VIEW_SCALE, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPickups() {
  for (const p of state.pickups) {
    const s = worldToScreen(p.x, p.y);
    drawSprite(ROW.soul, 0, s.x, s.y, 50 * VIEW_SCALE, false, 0, 1, 64, 64);
  }
}

function drawOrbitBlades() {
  const p = state.player;
  const radius = 42 * state.stats.area;
  for (let i = 0; i < state.stats.blades; i++) {
    const a = state.time * 3.2 + (i / state.stats.blades) * TWO_PI;
    const s = worldToScreen(p.x + Math.cos(a) * radius, p.y + Math.sin(a) * radius);
    drawSprite(ROW.talismanBlade, 6 + (Math.floor(state.time * 14 + i) % 6), s.x, s.y, 54 * state.stats.area * VIEW_SCALE, false, a);
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
  text(`元素 ${elementName(state.stats.element)}`, 248, 96, 14, elementColor(state.stats.element));
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
  const icon = upgradeIcon(opt.name);
  if (icon) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#061114";
    ctx.strokeStyle = "#58716d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w - 45, y + 45, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawUpgradeIcon(icon, x + w - 45, y + 45, 74);
  }
  text(opt.name, x + 24, y + 82, 23, "#fff4d8");
  wrap(opt.desc, x + 24, y + 122, w - 48, 20, "#b9d0ca");
}

function upgradeIcon(name) {
  if (name.includes("劍") || name.includes("增傷") || name.includes("大符") || name.includes("穿透") || name.includes("符紙")) return { row: 5, frame: 7, iconRow: 1 };
  if (name.includes("聚魂")) return { row: 5, frame: 4, iconRow: 1 };
  if (name.includes("護命") || name.includes("回春")) return { row: 5, frame: 5, iconRow: 1 };
  if (name.includes("火") || name.includes("灼") || name.includes("爆") || name.includes("隕")) return { row: 5, frame: 0, iconRow: 1 };
  if (name.includes("水") || name.includes("寒") || name.includes("霜") || name.includes("冰")) return { row: 5, frame: 1, iconRow: 1 };
  if (name.includes("雷") || name.includes("風暴") || name.includes("連鎖")) return { row: 5, frame: 2, iconRow: 1 };
  if (name.includes("毒") || name.includes("腐")) return { row: 5, frame: 3, iconRow: 1 };
  if (name.includes("影") || name.includes("斬") || name.includes("虛空")) return { row: 5, frame: 4, iconRow: 1 };
  if (name.includes("聖") || name.includes("療") || name.includes("盾")) return { row: 5, frame: 5, iconRow: 1 };
  if (name.includes("風") || name.includes("疾") || name.includes("旋")) return { row: 5, frame: 6, iconRow: 1 };
  return null;
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
  pickupSamples: state.pickups.slice(0, 4).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
  effects: state.effects.length,
  damageTexts: state.damageText.slice(0, 6).map((t) => ({ text: t.text, amount: Number(t.amount?.toFixed?.(1) ?? t.text), enemyId: t.enemyId ?? null })),
  kills: state.kills,
  xp: Number(state.xp.toFixed(1)),
  xpNeed: state.xpNeed,
  magnet: Math.round(state.stats?.magnet ?? 0),
  element: state.stats?.element ?? null,
  viewScale: VIEW_SCALE,
  options: state.options.map((opt) => opt.name),
  sprites: {
    complete: sprites.complete,
    naturalWidth: sprites.naturalWidth,
    naturalHeight: sprites.naturalHeight
  },
  skillEffects: {
    complete: skillEffects.complete,
    naturalWidth: skillEffects.naturalWidth,
    naturalHeight: skillEffects.naturalHeight
  },
  skillIcons: {
    complete: skillIcons.complete,
    naturalWidth: skillIcons.naturalWidth,
    naturalHeight: skillIcons.naturalHeight,
    keyed: Boolean(keyedSkillIcons)
  },
  note: "All gameplay actors are drawn from survivor-sprites.png."
});

window.advanceTime = (ms) => {
  fixedMode = true;
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(1 / 60);
  draw();
};

window.debug_set_upgrade_options = (names) => {
  const pool = [...elementUnlocks, ...baseUpgradePool, ...Object.values(elementBranches).flat()];
  if (!state.player) resetGame();
  if (!names?.length) return pool.map((option) => option.name);
  state.mode = "level";
  state.options = names
    .map((name) => typeof name === "number"
      ? pool[name]
      : pool.find((option) => option.name === name || option.name.includes(name) || name.includes(option.name)))
    .filter(Boolean)
    .slice(0, 3);
  draw();
  return state.options.map((option) => option.name);
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
