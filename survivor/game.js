const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 2600;
const WORLD_H = 1800;
const SPRITE = 128;
const TWO_PI = Math.PI * 2;
const VIEW_SCALE = 0.68;
const ASSET_VERSION = "result-icons-20260704";
const SAVE_KEY = "ghost-market-memory-save-v1";

const GAME_CONFIG = {
  missionPresets: {
    default: {
      name: "短局割草",
      message: "撐住怪潮，吃魂火升級。",
      targetKills: 75,
      spawn: { base: 1.8, timeScale: 0.014, min: 0.52, wavePack: (timeSec) => 2 + Math.floor(timeSec / 48) },
      mage: { base: 12, timeScale: 4.0 },
      elite: { base: 30, timeScale: 16.0 }
    },
    gauntlet: {
      name: "狂潮試煉",
      message: "開啟無限狂潮，撐到 110 擊殺。",
      targetKills: 110,
      spawn: { base: 1.65, timeScale: 0.02, min: 0.45, wavePack: (timeSec) => 3 + Math.floor(timeSec / 40) },
      mage: { base: 10, timeScale: 4.7 },
      elite: { base: 27, timeScale: 15.5 }
    },
    garden: {
      name: "月之庭園",
      message: "記憶碎片展開，無經驗掉落，挑戰更高分。",
      targetKills: 200,
      spawn: { base: 1.28, timeScale: 0.03, min: 0.34, wavePack: (timeSec) => 4 + Math.floor(timeSec / 32) },
      mage: { base: 7, timeScale: 5.4 },
      elite: { base: 18, timeScale: 13.5 }
    }
  },
  enemyProfiles: {
    ghoul: { baseHp: 60, hpPerMinute: 18, baseSpeed: 67, speedPerMinute: 5, baseDamage: 8, radius: 19, xp: 5 },
    skitter: { baseHp: 42, hpPerMinute: 13, baseSpeed: 118, speedPerMinute: 8, baseDamage: 6, radius: 15, xp: 5 },
    mage: { baseHp: 96, hpPerMinute: 28, baseSpeed: 47, speedPerMinute: 3, baseDamage: 11, radius: 18, xp: 13, shootMin: 1.5, shootMax: 2.4 },
    bomber: { baseHp: 86, hpPerMinute: 24, baseSpeed: 76, speedPerMinute: 4, baseDamage: 10, radius: 20, xp: 10 },
    warden: { baseHp: 180, hpPerMinute: 42, baseSpeed: 41, speedPerMinute: 2, baseDamage: 13, radius: 25, xp: 20 },
    weaver: { baseHp: 158, hpPerMinute: 34, baseSpeed: 50, speedPerMinute: 2, baseDamage: 9, radius: 21, xp: 18, conjureMin: 4.4, conjureMax: 6.2 },
    mirror_lantern: { baseHp: 92, hpPerMinute: 19, baseSpeed: 56, speedPerMinute: 2.2, baseDamage: 15, radius: 20, xp: 7, mirrorMin: 2.8, mirrorMax: 3.6 },
    talisman_binder: { baseHp: 128, hpPerMinute: 23, baseSpeed: 44, speedPerMinute: 1.7, baseDamage: 12, radius: 22, xp: 8, bindMin: 4.2, bindMax: 5.0 },
    brute: { baseHp: 260, hpPerMinute: 60, baseSpeed: 39, speedPerMinute: 3, baseDamage: 18, radius: 29, xp: 32 },
    boss: { baseHp: 1150, hpPerMinute: 185, baseSpeed: 34, speedPerMinute: 2, baseDamage: 28, radius: 42, xp: 80, shootMin: 1.1, shootMax: 1.8 }
  }
};

const BOSS_NODES = [30, 80, 110, 150, 200];
const STAGE_PHASES = [
  {
    id: "opening",
    name: "序幕",
    threshold: 0,
    objective: "清出安全距離，先吃魂火升到 Lv.2",
    message: "序幕：怪潮甦醒，先穩住走位。",
    spawn: ["ghoul", "ghoul", "skitter"]
  },
  {
    id: "ambush",
    name: "伏擊",
    threshold: 0.32,
    objective: "疾影開始混入，保持移動避免被包夾",
    message: "伏擊：疾影加入怪潮，別被貼身。",
    spawn: ["skitter", "skitter", "mage"]
  },
  {
    id: "rupture",
    name: "裂潮",
    threshold: 0.62,
    objective: "爆靈會留下危險區，擊殺後立刻換位；鏡燈使會折射符彈",
    message: "裂潮：爆靈與鏡燈使出現，注意斜向彈道。",
    spawn: ["bomber", "bomber", "mirror_lantern", "brute"]
  },
  {
    id: "warded",
    name: "護陣",
    threshold: 0.82,
    objective: "優先擊破護衛與召虺，並閃避縛符師的減速符陣",
    message: "護陣：護衛護群、召虺召兵、縛符師佈陣，先破關鍵敵。",
    spawn: ["warden", "weaver", "talisman_binder", "mage", "skitter"]
  }
];
const MISSION_CHOICES = [
  { id: "default", title: "記憶培育", sub: "75 擊殺，形成記憶碎片", key: "1" },
  { id: "gauntlet", title: "狂潮試煉", sub: "110 擊殺，更密集的怪潮", key: "2" },
  { id: "garden", title: "月之庭園", sub: "使用記憶碎片挑戰高分", key: "3" }
];
const TUTORIAL_HINTS = {
  start: { title: "先拉開距離", body: "A/D 或方向鍵移動，Shift 或 Space 可衝刺閃避。符咒會自動攻擊最近敵人。", duration: 6.5 },
  souls: { title: "魂火吸取", body: "敵人死亡會掉魂火。靠近後才會被吸過來，升級時選技能分支。", duration: 6 },
  level: { title: "技能成長", body: "主動技能最多 5 種；同一技能再選會升級，滿 5 級可進化。", duration: 6 },
  hurt: { title: "受擊無敵", body: "受傷後有短暫無敵。被包圍時先閃避，不要硬站在爆裂區。", duration: 5.5 },
  boss: { title: "Boss 預警", body: "接近 Boss 節點時先清小怪、保留閃避，Boss 會發射彈幕與封印圈。", duration: 5.8 },
  ambush: { title: "疾影來襲", body: "疾影靠近會加速，保持橫向移動，不要讓牠們同時貼身。", duration: 5.2 },
  rupture: { title: "爆靈危險", body: "爆靈死亡會爆裂。擊殺後立刻離開亮圈，利用爆炸清怪。", duration: 5.2 },
  warded: { title: "先破護衛", body: "護衛會替附近敵人減傷。看到護陣時先處理護衛再清群怪。", duration: 5.6 }
};
const EQUIPMENT = [
  {
    id: "soul_bell",
    name: "聚魂鈴",
    desc: "吸取範圍提高，菁英死亡時會拉近魂火。",
    apply: () => {
      state.stats.magnet += 42;
      state.stats.equipmentVacuum = 1;
    }
  },
  {
    id: "blood_cloak",
    name: "血月斗篷",
    desc: "最大生命提高，受擊後短暫提高攻速。",
    apply: () => {
      state.stats.maxHp += 35;
      state.stats.bloodCloak = 1;
    }
  },
  {
    id: "mirror_charm",
    name: "鏡符",
    desc: "符咒可多穿透一次，清怪速度更穩。",
    apply: () => {
      state.stats.pierce += 1;
      state.stats.damage += 3;
    }
  }
];

const PERMANENT_UPGRADES = [
  { id: "max_hp", name: "護身修行", desc: "每級最大生命 +8", max: 10, baseCost: 45, costStep: 25, apply: (stats, level) => { stats.maxHp += level * 8; } },
  { id: "attack", name: "符力修行", desc: "每級傷害 +2", max: 10, baseCost: 55, costStep: 30, apply: (stats, level) => { stats.damage += level * 2; } },
  { id: "magnet", name: "聚魂修行", desc: "每級吸魂範圍 +12", max: 8, baseCost: 40, costStep: 22, apply: (stats, level) => { stats.magnet += level * 12; } },
  { id: "speed", name: "步法修行", desc: "每級移動速度 +3%", max: 8, baseCost: 50, costStep: 28, apply: (stats, level) => { stats.speed *= 1 + level * 0.03; } },
  { id: "dash", name: "閃身修行", desc: "每級閃避冷卻 -0.04 秒", max: 6, baseCost: 60, costStep: 32, apply: (stats, level) => { stats.dashCooldown = Math.max(0.82, stats.dashCooldown - level * 0.04); } }
];

const SUMMONS = [
  { id: "moon_cat", name: "月影貓靈", desc: "初始伙伴，吸魂範圍 +18", cost: 0, color: "#77f0d2", apply: (stats) => { stats.magnet += 18; } },
  { id: "paper_imp", name: "符紙小使", desc: "符咒傷害 +4", cost: 120, color: "#ffe18a", apply: (stats) => { stats.damage += 4; } },
  { id: "bell_spirit", name: "鈴音靈", desc: "攻擊間隔 -5%", cost: 180, color: "#c9f2ff", apply: (stats) => { stats.fireRate *= 0.95; } },
  { id: "shadow_moth", name: "夜蛾影", desc: "移動速度 +6%", cost: 220, color: "#c18cff", apply: (stats) => { stats.speed *= 1.06; } }
];

const MISSIONS = [
  { id: "first_memory", name: "第一枚記憶", desc: "取得 1 枚記憶碎片", reward: 80, done: () => saveData.memoryFragments.length >= 1 },
  { id: "clear_once", name: "完成培育", desc: "完成 1 次記憶培育", reward: 120, done: () => saveData.clears >= 1 },
  { id: "hunt_200", name: "除靈二百", desc: "累積擊殺 200 名敵人", reward: 150, done: () => saveData.lifetimeKills >= 200 },
  { id: "garden_3000", name: "月庭初證", desc: "月之庭園分數達 3000", reward: 180, done: () => saveData.bestGarden >= 3000 },
  { id: "summon_two", name: "伙伴收集", desc: "解鎖 2 名召喚伙伴", reward: 160, done: () => saveData.unlockedSummons.length >= 2 }
];

const STORY_CHAPTERS = [
  { id: "first_memory", title: "一章：醒夢之鈴", objective: "完成記憶培育，形成第一枚記憶碎片", reward: "解鎖月之庭園入口", rewardDust: 80, done: () => saveData.memoryFragments.length >= 1, progress: () => `${saveData.memoryFragments.length}/1` },
  { id: "first_clear", title: "二章：終局首領", objective: "在記憶培育中擊破終局首領並完成 1 次通關", reward: "開放狂潮試煉推薦", rewardDust: 120, done: () => saveData.clears >= 1, progress: () => `${saveData.clears}/1` },
  { id: "hunter", title: "三章：除靈修行", objective: "累積擊殺 200 名敵人，熟悉怪潮節奏", reward: "取得除靈修行資金", rewardDust: 150, done: () => saveData.lifetimeKills >= 200, progress: () => `${Math.min(saveData.lifetimeKills, 200)}/200` },
  { id: "companion", title: "四章：召喚契約", objective: "解鎖第 2 名召喚伙伴，建立局內支援流派", reward: "擴充伙伴搭配資金", rewardDust: 160, done: () => saveData.unlockedSummons.length >= 2, progress: () => `${saveData.unlockedSummons.length}/2` },
  { id: "garden", title: "五章：月庭試煉", objective: "在月之庭園取得 3000 分", reward: "證明目前版本主線完成", rewardDust: 220, done: () => saveData.bestGarden >= 3000, progress: () => `${saveData.bestGarden || 0}/3000` }
];

const RUN_CHALLENGES = [
  { id: "first_wave", name: "除靈委託", desc: "本局擊殺 35 名敵人", target: 35, reward: 10, modes: ["cultivation"], value: () => state.kills },
  { id: "boss_hunt", name: "鎮壓首領", desc: "本局討伐 1 名 Boss", target: 1, reward: 18, modes: ["cultivation", "garden"], value: () => state.runRewards.bossKills },
  { id: "elite_breaker", name: "破陣委託", desc: "本局擊敗 2 名精英", target: 2, reward: 12, modes: ["cultivation", "garden"], value: () => state.runRewards.eliteKills },
  { id: "adept_growth", name: "符咒修行", desc: "本局達到 Lv.4", target: 4, reward: 14, modes: ["cultivation"], value: () => state.level },
  { id: "garden_score", name: "月庭試煉", desc: "月之庭園分數達 2400", target: 2400, reward: 18, modes: ["garden"], value: () => gardenScore() }
];

const EVOLUTIONS = {
  "火系符脈": { name: "炎王符", desc: "火系滿級進化，爆炎與燃燒擴散提高。", apply: () => { state.stats.fire.explosion += 2; state.stats.fire.meteor += 1; state.stats.damage += 8; } },
  "水系符脈": { name: "霜魄符", desc: "水系滿級進化，緩速與冰環範圍提高。", apply: () => { state.stats.water.frostNova += 2; state.stats.water.slow += 2; state.stats.area *= 1.1; } },
  "雷系符脈": { name: "天雷符", desc: "雷系滿級進化，連鎖與會心提高。", apply: () => { state.stats.lightning.chain += 2; state.stats.lightning.crit += 2; state.stats.fireRate *= 0.9; } },
  "毒系符脈": { name: "蝕魂符", desc: "毒系滿級進化，毒霧與腐蝕提高。", apply: () => { state.stats.poison.cloud += 2; state.stats.poison.weaken += 2; } },
  "影系符脈": { name: "夜裂符", desc: "影系滿級進化，斬殺與虛空裂隙提高。", apply: () => { state.stats.shadow.execute += 2; state.stats.shadow.void += 2; state.stats.damage += 5; } },
  "聖系符脈": { name: "白燈符", desc: "聖系滿級進化，護身與聖裁提高。", apply: () => { state.stats.holy.ward += 2; state.stats.holy.smite += 2; state.stats.maxHp += 20; } },
  "風系符脈": { name: "裂風符", desc: "風系滿級進化，旋風與穿透提高。", apply: () => { state.stats.wind.cyclone += 2; state.stats.wind.split += 2; state.stats.speed *= 1.08; } },
  "旋刃": { name: "月輪刃", desc: "旋刃滿級進化，環繞刀範圍與傷害提高。", apply: () => { state.stats.blades += 1; state.stats.bladeDamage += 18; state.stats.area *= 1.12; } }
};

const BOSS_REWARD_POOL = [
  { id: "sigil_damage", name: "破魔印", family: "攻擊", desc: "本局傷害 +12，打 Boss 後接著清精英會更有力。", apply: () => { state.stats.damage += 12; } },
  { id: "sigil_haste", name: "疾咒印", family: "攻速", desc: "本局攻擊間隔 -12%，讓符咒節奏更密。", apply: () => { state.stats.fireRate *= 0.88; } },
  { id: "sigil_guard", name: "護身印", family: "防禦", desc: "本局最大生命 +20，不會回復當前生命。", apply: () => { state.stats.maxHp += 20; } },
  { id: "sigil_magnet", name: "聚魂印", family: "資源", desc: "本局吸魂範圍 +45，討伐後更容易接上升級。", apply: () => { state.stats.magnet += 45; } },
  { id: "sigil_area", name: "大符印", family: "範圍", desc: "本局符咒尺寸 +14%，旋刃與元素效果範圍同步變大。", apply: () => { state.stats.area *= 1.14; } },
  { id: "sigil_pierce", name: "穿魂印", family: "穿透", desc: "本局符咒穿透 +1，清直線怪潮更穩。", apply: () => { state.stats.pierce += 1; } }
];

const EVENT_CHOICE_POOL = [
  {
    id: "soul_rain",
    name: "引魂燈",
    type: "資源",
    event: "soulRain",
    desc: "立刻引發魂火雨，但會追加一波疾影。",
    apply: () => {
      triggerCombatEvent("soulRain");
      for (let i = 0; i < 6; i++) spawnEnemy("skitter");
    }
  },
  {
    id: "spirit_rush",
    name: "破陣鼓",
    type: "戰鬥",
    event: "spiritRush",
    desc: "喚出怨靈急襲，完成後本局傷害 +5。",
    apply: () => {
      triggerCombatEvent("spiritRush");
      state.stats.damage += 5;
    }
  },
  {
    id: "seal_field",
    name: "封印石",
    type: "控場",
    event: "sealField",
    desc: "展開封印圈，同時清除場上敵彈並獲得短暫無敵。",
    apply: () => {
      triggerCombatEvent("sealField");
      state.enemyBullets = [];
      state.player.invuln = Math.max(state.player.invuln, 1.1);
    }
  },
  {
    id: "elite_pressure",
    name: "月塵懸賞",
    type: "獎勵",
    event: "elitePressure",
    desc: "召來精英壓迫，立即追加 +4 月塵戰利品。",
    apply: () => {
      state.runRewards.moonDust += 4;
      triggerCombatEvent("elitePressure");
    }
  },
  {
    id: "safe_focus",
    name: "靜心符",
    type: "穩定",
    event: "focus",
    desc: "不追加事件怪潮，本局攻擊間隔 -6%。",
    apply: () => {
      state.stats.fireRate *= 0.94;
      state.currentEvent = { id: "focus", t: 4.5 };
      state.message = "靜心符：攻擊節奏提升";
      addEffect("goldenShield", state.player.x, state.player.y - 34, 140, 0.48);
    }
  }
];

function storyEventChoice(focus = state.storyFocus || storyRunFocus()) {
  const common = {
    source: "story",
    storyId: focus.id,
    storyTitle: focus.title
  };
  const map = {
    first_memory: {
      ...common,
      id: "story_first_memory",
      name: "醒夢聚魂",
      type: "主線",
      event: "soulRain",
      desc: "為形成第一枚記憶引來魂火雨，同時追加疾影試煉。",
      apply: () => {
        triggerCombatEvent("soulRain");
        for (let i = 0; i < 4; i++) spawnEnemy("skitter");
        state.stats.magnet += 18;
        state.message = "醒夢聚魂：魂火雨與聚魂範圍提升";
      }
    },
    first_clear: {
      ...common,
      id: "story_first_clear",
      name: "終局預兆",
      type: "主線",
      event: "spiritRush",
      desc: "提早承受怨靈急襲，換取本局 Boss 與終局輸出。",
      apply: () => {
        triggerCombatEvent("spiritRush");
        state.stats.damage += 7;
        state.stats.pierce += 1;
        state.message = "終局預兆：傷害與穿透提升";
      }
    },
    hunter: {
      ...common,
      id: "story_hunter",
      name: "除靈懸賞",
      type: "主線",
      event: "elitePressure",
      desc: "追加高密度怪潮與懸賞，適合推進累積擊殺。",
      apply: () => {
        state.runRewards.moonDust += 6;
        triggerCombatEvent("elitePressure");
        for (let i = 0; i < 8; i++) spawnEnemy(i % 2 ? "skitter" : "ghoul");
        state.message = "除靈懸賞：怪潮加壓，月塵增加";
      }
    },
    companion: {
      ...common,
      id: "story_companion",
      name: "契約試煉",
      type: "主線",
      event: "elitePressure",
      desc: "召來精英試煉，完成後更容易累積締約資金。",
      apply: () => {
        state.runRewards.moonDust += 10;
        triggerCombatEvent("elitePressure");
        spawnEnemy("warden");
        spawnEnemy("brute");
        state.message = "契約試煉：精英壓迫與月塵懸賞";
      }
    },
    garden: {
      ...common,
      id: "story_garden",
      name: "月庭結界",
      type: "主線",
      event: "sealField",
      desc: "展開月庭結界清彈並短暫保護，適合高分續戰。",
      apply: () => {
        triggerCombatEvent("sealField");
        state.enemyBullets = [];
        state.player.invuln = Math.max(state.player.invuln, 1.45);
        state.stats.fireRate *= 0.96;
        state.message = "月庭結界：清彈、短暫無敵與攻速提升";
      }
    }
  };
  return map[focus.id] || map.first_memory;
}

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

const FRAME_ANCHORS = {
  [ROW.heroIdle]: [
    [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93], [67, 121.93]
  ],
  [ROW.heroRun]: [
    [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23], [58.08, 121.23]
  ],
  [ROW.ghoul]: [
    [71.5, 127], [67, 127], [60, 127], [59, 127], [54, 127], [59.5, 127], [60, 87], [59, 87], [55.5, 88], [50, 87], [66.5, 88], [45.5, 88]
  ],
  [ROW.mage]: [
    [80.5, 125], [63.5, 125], [68.5, 125], [70.5, 125], [64, 125], [64, 125], [64, 125], [64, 125], [64, 125], [64, 125], [60, 125], [69, 88]
  ],
  [ROW.brute]: [
    [77, 127], [64, 127], [64, 127], [64, 127], [64, 127], [64, 127], [64, 127], [64, 127], [64, 127], [64, 127], [64, 127], [43.5, 127]
  ]
};

const DEFAULT_ANCHOR = {
  x: 64,
  y: 112
};
const MAX_SKILL_LEVEL = 5;
const MAX_ACTIVE_SKILLS = 5;

function resolveFrameAnchor(row, frame, fallback = DEFAULT_ANCHOR) {
  const frames = FRAME_ANCHORS[row];
  if (!Array.isArray(frames)) return fallback;
  const anchor = frames[Math.floor(frame) % frames.length];
  if (!Array.isArray(anchor)) return fallback;
  const [x, y] = anchor;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return fallback;
  return { x, y };
}

const sprites = new Image();
sprites.src = `./assets/survivor-sprites.png?v=${ASSET_VERSION}`;
const mapBackground = new Image();
mapBackground.src = `./assets/map-shrine-courtyard.png?v=${ASSET_VERSION}`;
const vfxTags = new Image();
vfxTags.src = `./assets/skill-vfx-cutouts/normalized/magic-tags.png?v=${ASSET_VERSION}`;
const vfxBursts = new Image();
vfxBursts.src = `./assets/skill-vfx-cutouts/normalized/magic-bursts.png?v=${ASSET_VERSION}`;
const vfxFields = new Image();
vfxFields.src = `./assets/skill-vfx-cutouts/normalized/magic-fields.png?v=${ASSET_VERSION}`;
const vfxIcons = new Image();
vfxIcons.src = `./assets/skill-vfx-cutouts/normalized/item-icons-fx.png?v=${ASSET_VERSION}`;
// Bespoke elite sprite sheets (Codex art, normalized to 12x4 128px cells).
// Rows: 0=idle, 1=action (conjure/cast/seal), 2=hit, 3=death.
const ELITE_ROWS = { idle: 0, action: 1, hit: 2, death: 3 };
const ELITE_SHEETS = {
  weaver: { img: new Image(), file: "weaver-sprites.png", anchorY: 116 },
  mirror_lantern: { img: new Image(), file: "mirror_lantern-sprites.png", anchorY: 122 },
  talisman_binder: { img: new Image(), file: "talisman_binder-sprites.png", anchorY: 117 },
  boss: { img: new Image(), file: "boss-sprites.png", anchorY: 121 },
  final_boss: { img: new Image(), file: "final_boss-sprites.png", anchorY: 127 }
};
for (const sheet of Object.values(ELITE_SHEETS)) {
  sheet.img.src = `./assets/${sheet.file}?v=${ASSET_VERSION}`;
}

// Bespoke hero sheet (Codex art): 12x6 128px cells.
const heroSprites = new Image();
heroSprites.src = `./assets/hero-sprites.png?v=${ASSET_VERSION}`;
const HERO_ROWS = { idle: 0, run: 1, attack: 2, hit: 3, dash: 4, death: 5 };
const HERO_ANCHOR_Y = 122;
const HERO_ANIM = { attack: 0.26, hit: 0.3, dash: 0.28 };

// Bespoke UI icon roster (Codex art): 6x4 128px cells, id -> [col, row].
const uiIcons = new Image();
uiIcons.src = `./assets/ui-icons.png?v=${ASSET_VERSION}`;
const UI_ICONS = {
  fire: [0, 0], water: [1, 0], lightning: [2, 0], poison: [3, 0], shadow: [4, 0], holy: [5, 0],
  wind: [0, 1], health: [1, 1], shield: [2, 1], speed: [3, 1], magnet: [4, 1], summon: [5, 1],
  moon_dust: [0, 2], memory_shard: [1, 2], boss_key: [2, 2], reroll: [3, 2], revive: [4, 2], blade: [5, 2],
  talisman: [0, 3], burn: [1, 3], slow: [2, 3], curse: [3, 3], armor: [4, 3], pickup_range: [5, 3]
};
function drawUiIcon(id, x, y, size, alpha = 1) {
  const cell = UI_ICONS[id];
  if (!cell || !(uiIcons.complete && uiIcons.naturalWidth > 0)) return false;
  const c = 128;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(uiIcons, cell[0] * c, cell[1] * c, c, c, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
  ctx.restore();
  return true;
}
function damageIconId(name = "") {
  if (/刃|劍|旋/.test(name)) return "blade";
  if (/召|伙伴|貓靈|符使|鈴|夜蛾/.test(name)) return "summon";
  const fam = elementNameFromName(name);
  if (fam !== "通用") return familyIconId(fam);
  if (name.includes("符")) return "talisman";
  return null;
}
function familyIconId(family = "") {
  if (family.includes("火")) return "fire";
  if (family.includes("水")) return "water";
  if (family.includes("雷")) return "lightning";
  if (family.includes("毒")) return "poison";
  if (family.includes("影")) return "shadow";
  if (family.includes("聖")) return "holy";
  if (family.includes("風")) return "wind";
  if (family === "Melee") return "blade";
  if (family === "Utility") return "speed";
  if (family === "Survive") return "shield";
  return "talisman";
}

const VFX_CELL = 160;
const ICON_CELL = 128;
const ELEMENT_VFX_ROW = {
  fire: 0,
  water: 1,
  lightning: 2,
  poison: 3,
  shadow: 4,
  holy: 5,
  wind: 6
};
const EFFECT_DEFS = {
  fireBurst: { sheet: "bursts", row: 0 },
  frostRing: { sheet: "bursts", row: 1 },
  chainLightning: { sheet: "bursts", row: 2 },
  thunderCrit: { sheet: "bursts", row: 3 },
  poisonMist: { sheet: "fields", row: 3 },
  corrosionSeal: { sheet: "bursts", row: 5 },
  soulSlash: { sheet: "bursts", row: 4 },
  voidRift: { sheet: "fields", row: 4 },
  holyWard: { sheet: "fields", row: 5 },
  goldenShield: { sheet: "fields", row: 5 },
  divineJudgment: { sheet: "bursts", row: 5 },
  cycloneBlade: { sheet: "fields", row: 6 },
  splittingGale: { sheet: "bursts", row: 6 },
  meteorSeal: { sheet: "fields", row: 0 }
};

const ENTITY_BUDGETS = {
  enemies: 135,
  pickups: 190,
  effects: 90,
  damageText: 85,
  enemyBullets: 130,
  hazards: 55
};

const AMBIENCE_NODES = [
  { kind: "wisp", x: 520, y: 430, size: 42, phase: 0.2 },
  { kind: "wisp", x: 930, y: 1220, size: 36, phase: 1.8 },
  { kind: "wisp", x: 1660, y: 620, size: 40, phase: 2.7 },
  { kind: "wisp", x: 2180, y: 1320, size: 34, phase: 3.4 },
  { kind: "rune", x: 1280, y: 900, size: 220, phase: 0 },
  { kind: "rune", x: 1960, y: 440, size: 150, phase: 1.1 },
  { kind: "rune", x: 680, y: 1450, size: 160, phase: 2.2 },
  { kind: "mist", x: 420, y: 1060, size: 260, phase: 0.8 },
  { kind: "mist", x: 1460, y: 350, size: 230, phase: 2.6 },
  { kind: "mist", x: 2160, y: 860, size: 280, phase: 4.1 },
  { kind: "petal", x: 980, y: 720, size: 90, phase: 0.6 },
  { kind: "petal", x: 1770, y: 1180, size: 110, phase: 3.2 }
];

const keys = new Set();
const pressed = new Set();
const pointer = { x: W / 2, y: H / 2, down: false };
const touchControl = {
  active: false,
  pointerId: null,
  startX: 118,
  startY: H - 104,
  x: 118,
  y: H - 104,
  dx: 0,
  dy: 0,
  dashQueued: false,
  lastDashT: 0
};
let raf = 0;
let last = performance.now();
let fixedMode = false;
let nextEnemyId = 1;
let audioCtx = null;
let musicTimer = 0;
let audioMuted = false;
let musicLoopIndex = 0;
let saveData = loadSave();
audioMuted = saveData.settings?.audio === false;

const state = {
  mode: "loading",
  menuTab: "home",
  recordsTab: "overview",
  codexElement: "fire",
  pauseTab: "skills",
  pauseSkillIndex: 0,
  resetConfirm: false,
  memoryDeleteConfirmId: null,
  mission: "default",
  runType: "cultivation",
  selectedMission: saveData.selectedMission || MISSION_CHOICES[0].id,
  briefingMission: null,
  selectedEquipment: saveData.selectedEquipment || EQUIPMENT[0].id,
  selectedFragmentId: saveData.selectedFragmentId || null,
  appliedMemory: null,
  spawnedBossNodes: [],
  warnedBossNodes: [],
  finalBossActive: false,
  finalBossDefeated: false,
  finalized: false,
  lastRunSummary: null,
  time: 0,
  kills: 0,
  targetKills: 75,
  cleared: false,
  level: 1,
  xp: 0,
  xpNeed: 20,
  shake: 0,
  hurtFlash: 0,
  lastHit: null,
  freeze: 0,
  spawnT: 0,
  mageT: 0,
  eliteT: 0,
  eventT: 0,
  currentEvent: null,
  eventChoiceOptions: [],
  eventChoiceSource: null,
  eventChoicesTaken: [],
  phaseIndex: 0,
  phaseNoticeT: 0,
  milestoneBanner: null,
  tutorialHint: null,
  seenHints: {},
  tutorialProgress: { moved: 0, souls: 0, upgrades: 0 },
  message: "",
  camera: { x: 0, y: 0 },
  player: null,
  companion: null,
  enemies: [],
  bullets: [],
  enemyBullets: [],
  pickups: [],
  hazards: [],
  effects: [],
  damageText: [],
  damageSources: {},
  perfStats: { skippedSpawns: 0, trimmedPickups: 0, trimmedEffects: 0, trimmedDamageText: 0, trimmedEnemies: 0 },
  runRewards: { moonDust: 0, bossKills: 0, eliteKills: 0 },
  runChallenge: null,
  runChallengeCompleted: false,
  challengeToast: null,
  combatMedals: [],
  challengeBonus: 0,
  bossRewardOptions: [],
  bossRewardSource: null,
  bossBoons: [],
  storyFocus: null,
  options: [],
  pickedUpgrades: [],
  passiveUpgrades: [],
  evolvedSkills: [],
  skillLevels: {},
  stats: null
};

function defaultSave() {
  return {
    playerLevel: 1,
    moonDust: 0,
    bestGarden: 0,
    lifetimeKills: 0,
    runsPlayed: 0,
    clears: 0,
    selectedEquipment: EQUIPMENT[0].id,
    selectedMission: MISSION_CHOICES[0].id,
    selectedFragmentId: null,
    selectedSummon: SUMMONS[0].id,
    unlockedSummons: [SUMMONS[0].id],
    upgrades: {},
    claimedMissions: {},
    claimedStoryChapters: {},
    settings: {
      audio: true,
      screenShake: true,
      damageNumbers: true,
      hints: true
    },
    memoryFragments: []
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      memoryFragments: Array.isArray(parsed.memoryFragments) ? parsed.memoryFragments : [],
      unlockedSummons: Array.isArray(parsed.unlockedSummons) && parsed.unlockedSummons.length ? parsed.unlockedSummons : base.unlockedSummons,
      selectedSummon: parsed.selectedSummon || base.selectedSummon,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      claimedMissions: { ...base.claimedMissions, ...(parsed.claimedMissions || {}) },
      claimedStoryChapters: { ...base.claimedStoryChapters, ...(parsed.claimedStoryChapters || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) }
    };
  } catch {
    return defaultSave();
  }
}

function persistSave() {
  saveData.selectedMission = state.selectedMission;
  saveData.selectedEquipment = state.selectedEquipment;
  saveData.selectedFragmentId = state.selectedFragmentId;
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function gameSettings() {
  const base = defaultSave().settings;
  saveData.settings = { ...base, ...(saveData.settings || {}) };
  return saveData.settings;
}

function settingEnabled(key) {
  return gameSettings()[key] !== false;
}

function setGameSetting(key, value) {
  const settings = gameSettings();
  settings[key] = Boolean(value);
  if (key === "audio") {
    audioMuted = !settings.audio;
    if (audioMuted) {
      window.clearTimeout(musicTimer);
      audioCtx?.close?.();
      audioCtx = null;
    } else {
      startAudio();
    }
  }
  if (key === "hints" && !settings.hints) state.tutorialHint = null;
  persistSave();
}

function toggleGameSetting(key) {
  const next = !settingEnabled(key);
  setGameSetting(key, next);
  const labels = {
    audio: "音樂與音效",
    screenShake: "畫面震動",
    damageNumbers: "傷害數字",
    hints: "戰鬥提示"
  };
  state.message = `${labels[key] || key}已${next ? "開啟" : "關閉"}`;
  return next;
}

function selectedEquipment() {
  return EQUIPMENT.find((item) => item.id === state.selectedEquipment) || EQUIPMENT[0];
}

function selectedFragment() {
  return saveData.memoryFragments.find((item) => item.id === state.selectedFragmentId) || saveData.memoryFragments[0] || null;
}

function requestDeleteSelectedMemory() {
  const fragment = selectedFragment();
  if (!fragment) {
    state.message = "沒有可刪除的記憶碎片";
    return false;
  }
  state.memoryDeleteConfirmId = fragment.id;
  state.message = `再次確認刪除：${fragment.name}`;
  return true;
}

function cancelDeleteMemory() {
  state.memoryDeleteConfirmId = null;
  state.message = "已取消刪除記憶";
}

function confirmDeleteSelectedMemory() {
  const fragment = selectedFragment();
  if (!fragment || state.memoryDeleteConfirmId !== fragment.id) {
    state.memoryDeleteConfirmId = null;
    state.message = "請先選擇並確認要刪除的記憶";
    return false;
  }
  const removedName = fragment.name;
  saveData.memoryFragments = saveData.memoryFragments.filter((item) => item.id !== fragment.id);
  const next = saveData.memoryFragments[0] || null;
  state.selectedFragmentId = next?.id || null;
  saveData.selectedFragmentId = state.selectedFragmentId;
  state.memoryDeleteConfirmId = null;
  persistSave();
  state.message = `已刪除記憶：${removedName}`;
  return true;
}

function selectedSummon() {
  return SUMMONS.find((item) => item.id === saveData.selectedSummon) || SUMMONS[0];
}

function upgradeLevel(id) {
  return Math.max(0, Number(saveData.upgrades?.[id] || 0));
}

function upgradeCost(item) {
  return item.baseCost + upgradeLevel(item.id) * item.costStep;
}

function affordablePermanentUpgrades() {
  return PERMANENT_UPGRADES.filter((item) => upgradeLevel(item.id) < item.max && saveData.moonDust >= upgradeCost(item));
}

function recommendedPermanentUpgrade() {
  return PERMANENT_UPGRADES
    .filter((item) => upgradeLevel(item.id) < item.max)
    .sort((a, b) => {
      const affordableDelta = Number(saveData.moonDust >= upgradeCost(b)) - Number(saveData.moonDust >= upgradeCost(a));
      if (affordableDelta) return affordableDelta;
      return upgradeCost(a) - upgradeCost(b);
    })[0] || null;
}

function permanentUpgradeSummary() {
  const totalLevel = PERMANENT_UPGRADES.reduce((sum, item) => sum + upgradeLevel(item.id), 0);
  const maxLevel = PERMANENT_UPGRADES.reduce((sum, item) => sum + item.max, 0);
  const next = recommendedPermanentUpgrade();
  return {
    totalLevel,
    maxLevel,
    affordableCount: affordablePermanentUpgrades().length,
    next: next ? { id: next.id, name: next.name, level: upgradeLevel(next.id), max: next.max, cost: upgradeCost(next) } : null
  };
}

function storyProgressSummary() {
  const rows = STORY_CHAPTERS.map((chapter, index) => {
    const done = Boolean(chapter.done());
    const claimed = Boolean(saveData.claimedStoryChapters?.[chapter.id]);
    return {
      id: chapter.id,
      number: index + 1,
      title: chapter.title,
      objective: chapter.objective,
      reward: chapter.reward,
      rewardDust: chapter.rewardDust || 0,
      progress: chapter.progress(),
      done,
      claimed,
      claimable: done && !claimed
    };
  });
  const current = rows.find((chapter) => !chapter.done) || rows[rows.length - 1];
  const completed = rows.filter((chapter) => chapter.done).length;
  const claimable = rows.filter((chapter) => chapter.claimable);
  return {
    current,
    completed,
    total: rows.length,
    percent: Math.round((completed / rows.length) * 100),
    claimableCount: claimable.length,
    claimableDust: claimable.reduce((sum, chapter) => sum + chapter.rewardDust, 0),
    rows
  };
}

function storySceneSummary(chapter = storyProgressSummary().current) {
  const scenes = {
    first_memory: {
      mood: "醒夢",
      opening: "祠堂的鈴聲把貓符師喚醒，散落的魂火正在把第一段記憶拼回來。",
      battle: "先在怪潮裡穩住腳步，讓魂火靠近你，再把第一個符咒流派定下來。",
      success: "第一枚記憶碎片會成為月之庭園的鑰匙。",
      next: "完成培育後，回圖鑑領取主線獎勵。"
    },
    first_clear: {
      mood: "終局",
      opening: "月庭深處出現不完整的首領影子，牠會等你完成擊殺目標後現身。",
      battle: "Boss 節點只是前奏，真正的通關條件是擊破終局首領。",
      success: "終局首領倒下後，培育才算完整通關。",
      next: "用通關取得的月塵補永久修行。"
    },
    hunter: {
      mood: "除靈",
      opening: "祠道上的魑魅越聚越多，這一章要求你熟悉怪潮密度。",
      battle: "優先建立清群技能，拉著怪潮走，不要站著吃包圍。",
      success: "擊殺累積會推進除靈修行，讓後續章節有足夠資金。",
      next: "累積擊殺後，回任務與主線頁領獎。"
    },
    companion: {
      mood: "契約",
      opening: "召喚契約需要月塵與戰鬥證明，伙伴會改變局內支援節奏。",
      battle: "多處理精英與 Boss，取得月塵後回大廳締約新伙伴。",
      success: "第二名伙伴解鎖後，召喚系統才真正打開。",
      next: "前往召喚頁締結新契約。"
    },
    garden: {
      mood: "月庭",
      opening: "月之庭園會讀取保存的記憶，測試你前面培育出的 build。",
      battle: "庭園不只是清怪，它會看你的記憶強度、技能完成度和生存節奏。",
      success: "月庭分數達標後，目前主線就算完成一輪。",
      next: "挑戰高分，或回頭強化記憶碎片。"
    }
  };
  const scene = scenes[chapter?.id] || scenes.first_memory;
  return {
    id: chapter?.id || "first_memory",
    title: chapter?.title || STORY_CHAPTERS[0].title,
    progress: chapter?.progress || "0/1",
    objective: chapter?.objective || STORY_CHAPTERS[0].objective,
    reward: chapter?.reward || STORY_CHAPTERS[0].reward,
    ...scene
  };
}

function claimableStoryChapters() {
  return storyProgressSummary().rows.filter((chapter) => chapter.claimable);
}

function claimAllStoryRewards() {
  const claimable = claimableStoryChapters();
  if (!claimable.length) {
    state.message = "目前沒有可領取的主線獎勵";
    return { claimed: 0, dust: 0 };
  }
  const dust = claimable.reduce((sum, chapter) => sum + chapter.rewardDust, 0);
  for (const chapter of claimable) saveData.claimedStoryChapters[chapter.id] = true;
  saveData.moonDust += dust;
  persistSave();
  state.message = `領取 ${claimable.length} 項主線獎勵：+${dust} 月塵`;
  return { claimed: claimable.length, dust };
}

function homeDashboardSummary() {
  const story = storyProgressSummary();
  const upgrades = permanentUpgradeSummary();
  const lockedSummon = nextLockedSummon();
  const claimable = claimableMissionList();
  const storyClaimable = claimableStoryChapters();
  const nextSummonCost = lockedSummon ? lockedSummon.cost : 0;
  return {
    story: {
      title: story.current.title,
      progress: story.current.progress,
      completed: story.completed,
      total: story.total,
      percent: story.percent,
      claimable: storyClaimable.length,
      rewardDust: storyClaimable.reduce((sum, chapter) => sum + chapter.rewardDust, 0)
    },
    rewards: {
      claimable: claimable.length,
      moonDust: claimableMissionReward()
    },
    training: {
      totalLevel: upgrades.totalLevel,
      maxLevel: upgrades.maxLevel,
      affordable: upgrades.affordableCount,
      next: upgrades.next
    },
    summon: {
      owned: saveData.unlockedSummons.length,
      total: SUMMONS.length,
      next: lockedSummon ? lockedSummon.name : "已全數締約",
      cost: nextSummonCost,
      affordable: Boolean(lockedSummon && saveData.moonDust >= lockedSummon.cost)
    }
  };
}

function completionTrackerSummary() {
  const story = storyProgressSummary();
  const missionsDone = MISSIONS.filter((mission) => mission.done()).length;
  const missionsClaimed = MISSIONS.filter((mission) => saveData.claimedMissions[mission.id]).length;
  const training = permanentUpgradeSummary();
  const memoryCount = saveData.memoryFragments.length;
  const gardenReady = Boolean(selectedFragment());
  const rows = [
    {
      id: "story",
      label: "主線",
      progress: `${story.completed}/${story.total}`,
      done: story.completed >= story.total,
      status: story.claimableCount ? `${story.claimableCount} 可領` : story.completed >= story.total ? "完成" : story.current.progress,
      next: story.claimableCount ? `可領 ${story.claimableDust} 月塵` : story.completed >= story.total ? "主線章節已完成" : story.current.objective,
      tab: "records",
      color: story.claimableCount ? "#ffe18a" : story.completed >= story.total ? "#7edac2" : "#ffe18a"
    },
    {
      id: "missions",
      label: "任務",
      progress: `${missionsClaimed}/${MISSIONS.length}`,
      done: missionsClaimed >= MISSIONS.length,
      status: claimableMissionList().length ? `${claimableMissionList().length} 可領` : `${missionsDone} 達成`,
      next: claimableMissionList().length ? `可領 ${claimableMissionReward()} 月塵` : "完成長期任務取得月塵",
      tab: "missions",
      color: claimableMissionList().length ? "#ffe18a" : "#a8c8c0"
    },
    {
      id: "training",
      label: "修行",
      progress: `${training.totalLevel}/${training.maxLevel}`,
      done: training.totalLevel >= training.maxLevel,
      status: training.affordableCount ? `${training.affordableCount} 可升` : training.next ? `${saveData.moonDust}/${training.next.cost}` : "滿級",
      next: training.next ? `下一項：${training.next.name}` : "永久修行已滿",
      tab: "shop",
      color: training.affordableCount ? "#7edac2" : "#a8c8c0"
    },
    {
      id: "summon",
      label: "召喚",
      progress: `${saveData.unlockedSummons.length}/${SUMMONS.length}`,
      done: saveData.unlockedSummons.length >= SUMMONS.length,
      status: nextLockedSummon() ? `${saveData.moonDust}/${nextLockedSummon().cost}` : "全締約",
      next: nextLockedSummon() ? `下一名：${nextLockedSummon().name}` : "所有伙伴已解鎖",
      tab: "summon",
      color: nextLockedSummon() && saveData.moonDust >= nextLockedSummon().cost ? "#ffe18a" : "#a8c8c0"
    },
    {
      id: "memory",
      label: "記憶",
      progress: `${memoryCount}/8`,
      done: gardenReady && (saveData.bestGarden || 0) >= 3000,
      status: gardenReady ? `月庭 ${saveData.bestGarden || 0}` : "未形成",
      next: gardenReady ? "用記憶挑戰月之庭園" : "完成一輪形成第一枚記憶",
      tab: gardenReady ? "memory" : "missions",
      color: gardenReady ? "#7edac2" : "#a8c8c0"
    }
  ];
  const completed = rows.filter((row) => row.done).length;
  const urgent = rows.find((row) => row.id === "missions" && claimableMissionList().length)
    || rows.find((row) => row.id === "training" && training.affordableCount)
    || rows.find((row) => !row.done)
    || rows[0];
  return {
    completed,
    total: rows.length,
    percent: Math.round((completed / rows.length) * 100),
    urgent,
    rows
  };
}

function collectionSummary() {
  const elements = elementCodexMeta();
  const activeFamilies = new Set([
    ...saveData.memoryFragments.flatMap((fragment) => fragment.activeSkills || []),
    ...(state.pickedUpgrades || []).map((skill) => skill.name)
  ]
    .map((item) => typeof item === "string" ? item : item?.name)
    .filter(Boolean)
    .map(elementNameFromName));
  const unlockedElements = elements.filter((meta) => activeFamilies.has(`${meta.label}系`) || (state.stats?.element === meta.id)).length;
  const bossKinds = new Set();
  if ((saveData.clears || 0) > 0 || (state.runRewards?.bossKills || 0) > 0) bossKinds.add("boss");
  if (state.finalBossDefeated || saveData.clears > 0) bossKinds.add("final");
  const rows = [
    {
      id: "memory",
      label: "記憶",
      value: saveData.memoryFragments.length,
      total: 8,
      status: `${saveData.memoryFragments.length}/8`,
      done: saveData.memoryFragments.length >= 8,
      color: "#7edac2"
    },
    {
      id: "summon",
      label: "召喚",
      value: saveData.unlockedSummons.length,
      total: SUMMONS.length,
      status: `${saveData.unlockedSummons.length}/${SUMMONS.length}`,
      done: saveData.unlockedSummons.length >= SUMMONS.length,
      color: "#ffe18a"
    },
    {
      id: "elements",
      label: "流派",
      value: unlockedElements,
      total: elements.length,
      status: `${unlockedElements}/${elements.length}`,
      done: unlockedElements >= elements.length,
      color: "#c18cff"
    },
    {
      id: "boss",
      label: "強敵",
      value: bossKinds.size,
      total: 2,
      status: `${bossKinds.size}/2`,
      done: bossKinds.size >= 2,
      color: "#d6a33f"
    },
    {
      id: "garden",
      label: "月庭",
      value: Math.min(saveData.bestGarden || 0, 3000),
      total: 3000,
      status: `${saveData.bestGarden || 0}`,
      done: (saveData.bestGarden || 0) >= 3000,
      color: "#77f0d2"
    }
  ];
  const score = rows.reduce((sum, row) => sum + clamp(row.value / Math.max(1, row.total), 0, 1), 0);
  const percent = Math.round((score / rows.length) * 100);
  const next = rows.find((row) => !row.done) || rows[rows.length - 1];
  return {
    percent,
    completed: rows.filter((row) => row.done).length,
    total: rows.length,
    next,
    rows
  };
}

function nextLockedSummon() {
  return SUMMONS.find((item) => !saveData.unlockedSummons.includes(item.id)) || null;
}

function homeGuidanceRows() {
  const claimable = claimableMissionList();
  const upgrades = permanentUpgradeSummary();
  const lockedSummon = nextLockedSummon();
  const fragment = selectedFragment();
  const story = storyProgressSummary();
  const rows = [];
  if (story.claimableCount) {
    rows.push({
      tab: "records",
      title: "領取主線獎勵",
      body: `${story.claimableCount} 章可領，共 ${story.claimableDust} 月塵`,
      status: "可領",
      color: "#ffe18a",
      priority: -1
    });
  }
  if (story.current && story.completed < story.total) {
    rows.push({
      tab: "records",
      title: story.current.title,
      body: story.current.objective,
      status: story.current.progress,
      color: "#ffe18a",
      priority: 0
    });
  }
  if (claimable.length) {
    rows.push({
      tab: "missions",
      title: "領取任務獎勵",
      body: `${claimable.length} 項可領，共 ${claimableMissionReward()} 月塵`,
      status: "可領",
      color: "#ffe18a",
      priority: 1
    });
  }
  if (upgrades.affordableCount) {
    rows.push({
      tab: "shop",
      title: "提升永久修行",
      body: `${upgrades.affordableCount} 項可升級，推薦 ${upgrades.next?.name || "修行"}`,
      status: "可買",
      color: "#7edac2",
      priority: 2
    });
  } else if (upgrades.next) {
    rows.push({
      tab: "shop",
      title: "累積月塵",
      body: `${upgrades.next.name} 需要 ${upgrades.next.cost} 月塵`,
      status: `${saveData.moonDust}/${upgrades.next.cost}`,
      color: "#a8c8c0",
      priority: 3
    });
  }
  if (lockedSummon) {
    rows.push({
      tab: "summon",
      title: "解鎖召喚伙伴",
      body: `${lockedSummon.name} 可改變局內支援節奏`,
      status: saveData.moonDust >= lockedSummon.cost ? "可解鎖" : `${saveData.moonDust}/${lockedSummon.cost}`,
      color: saveData.moonDust >= lockedSummon.cost ? "#ffe18a" : "#a8c8c0",
      priority: 4
    });
  }
  rows.push({
    tab: fragment ? "memory" : "missions",
    title: fragment ? "使用記憶碎片" : "形成第一枚記憶",
    body: fragment ? `${fragment.name} 可開啟月之庭園` : "完成記憶培育後保存本局成長",
    status: fragment ? "可用" : `${saveData.memoryFragments.length}/1`,
    color: fragment ? "#7edac2" : "#a8c8c0",
    priority: 5
  });
  rows.push({
    tab: "home",
    title: "開始本輪挑戰",
    body: `${selectedMissionChoice().title} · ${resolveMissionPreset(state.selectedMission).targetKills} 擊殺後迎戰終局`,
    status: "出發",
    color: "#fff4d8",
    priority: 6
  });
  return rows.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

function homeNextAction() {
  const claimable = claimableMissionList();
  const upgrades = permanentUpgradeSummary();
  const lockedSummon = nextLockedSummon();
  const story = storyProgressSummary();
  const fragment = selectedFragment();
  if (story.claimableCount) {
    return {
      tab: "records",
      action: "openStoryRewards",
      title: "領取主線獎勵",
      body: `${story.claimableCount} 章已完成，可領 ${story.claimableDust} 月塵。`,
      cta: "領主線獎勵",
      status: "高優先",
      color: "#ffe18a"
    };
  }
  if (claimable.length) {
    return {
      tab: "missions",
      action: "open",
      title: "先領任務獎勵",
      body: `${claimable.length} 項獎勵可領，合計 ${claimableMissionReward()} 月塵。`,
      cta: "前往任務",
      status: "高優先",
      color: "#ffe18a"
    };
  }
  if (upgrades.affordableCount) {
    return {
      tab: "shop",
      action: "open",
      title: "強化永久修行",
      body: `有 ${upgrades.affordableCount} 項可升級，推薦先點 ${upgrades.next?.name || "核心修行"}。`,
      cta: "前往商店",
      status: "可提升",
      color: "#7edac2"
    };
  }
  if (lockedSummon && saveData.moonDust >= lockedSummon.cost) {
    return {
      tab: "summon",
      action: "open",
      title: "締結新召喚",
      body: `${lockedSummon.name} 已可解鎖，會改變局內支援節奏。`,
      cta: "前往召喚",
      status: "可解鎖",
      color: "#ffe18a"
    };
  }
  if (story.current && story.completed < story.total) {
    return {
      tab: "records",
      action: "open",
      title: story.current.title,
      body: story.current.objective,
      cta: "查看主線",
      status: story.current.progress,
      color: "#ffe18a"
    };
  }
  if (fragment && state.selectedMission !== "garden") {
    return {
      tab: "home",
      action: "selectGarden",
      title: "挑戰月之庭園",
      body: `${fragment.name} 已可使用，月庭會測試你保存的技能配置。`,
      cta: "切到月庭",
      status: "新模式",
      color: "#7edac2"
    };
  }
  return {
    tab: "home",
    action: "start",
    title: "開始本輪探索",
    body: `${selectedMissionChoice().title}：${resolveMissionPreset(state.selectedMission).targetKills} 擊殺後迎戰終局首領。`,
    cta: "開始探索",
    status: "出發",
    color: "#fff4d8"
  };
}

function runHomeAction(row = homeNextAction()) {
  if (!row) return false;
  if (row.action === "start") return startSelectedMission();
  if (row.action === "openStoryRewards") {
    setMenuTab("records");
    state.recordsTab = "overview";
    state.message = "圖鑑總覽可領取主線章節獎勵";
    return true;
  }
  if (row.action === "selectGarden") {
    selectMission("garden");
    return true;
  }
  if (row.tab && row.tab !== "home") {
    setMenuTab(row.tab);
    if (row.tab === "records") state.recordsTab = "overview";
    return true;
  }
  state.menuTab = "home";
  state.message = row.title;
  return true;
}

function applyMetaProgression(stats) {
  for (const item of PERMANENT_UPGRADES) item.apply(stats, upgradeLevel(item.id));
  selectedSummon().apply(stats);
}

function canClaimMission(mission) {
  return mission.done() && !saveData.claimedMissions[mission.id];
}

function claimableMissionList() {
  return MISSIONS.filter(canClaimMission);
}

function claimableMissionReward() {
  return claimableMissionList().reduce((sum, mission) => sum + mission.reward, 0);
}

function missionProgress(mission) {
  const rows = {
    first_memory: `${saveData.memoryFragments.length}/1`,
    clear_once: `${saveData.clears}/1`,
    hunt_200: `${Math.min(saveData.lifetimeKills, 200)}/200`,
    garden_3000: `${saveData.bestGarden || 0}/3000`,
    summon_two: `${saveData.unlockedSummons.length}/2`
  };
  return rows[mission.id] || (mission.done() ? "完成" : "進行中");
}

function missionStatus(mission) {
  if (saveData.claimedMissions[mission.id]) return "已領取";
  if (canClaimMission(mission)) return "可領取";
  return "進行中";
}

function claimMission(index) {
  const mission = MISSIONS[index];
  if (!mission) return false;
  if (!canClaimMission(mission)) {
    state.message = saveData.claimedMissions[mission.id] ? "任務獎勵已領取" : "任務尚未達成";
    return false;
  }
  saveData.claimedMissions[mission.id] = true;
  saveData.moonDust += mission.reward;
  persistSave();
  state.message = `領取 ${mission.name}：+${mission.reward} 月塵`;
  return true;
}

function claimAllMissions() {
  const claimable = claimableMissionList();
  if (!claimable.length) {
    state.message = "目前沒有可領取的任務獎勵";
    return false;
  }
  const reward = claimable.reduce((sum, mission) => sum + mission.reward, 0);
  for (const mission of claimable) saveData.claimedMissions[mission.id] = true;
  saveData.moonDust += reward;
  persistSave();
  state.message = `已領取 ${claimable.length} 項任務：+${reward} 月塵`;
  return true;
}

function pickRunChallenge(runType) {
  const candidates = RUN_CHALLENGES.filter((challenge) => challenge.modes.includes(runType));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function storyRunFocus(chapter = storyProgressSummary().current) {
  const map = {
    first_memory: {
      id: "first_memory",
      title: "醒夢培育",
      objective: "形成第一枚記憶碎片",
      battleNote: "先穩住 Lv.4 與魂火節奏，完成培育後會保存記憶。",
      preferredChallenge: "adept_growth",
      pressure: ["ghoul", "skitter"],
      event: "soulRain",
      color: "#ffe18a"
    },
    first_clear: {
      id: "first_clear",
      title: "終局討伐",
      objective: "擊破終局首領並完成通關",
      battleNote: "保留閃避處理 Boss 節點，擊殺目標達成後要打倒終局。",
      preferredChallenge: "boss_hunt",
      pressure: ["mage", "brute"],
      event: "spiritRush",
      color: "#d6a33f"
    },
    hunter: {
      id: "hunter",
      title: "除靈修行",
      objective: "累積擊殺 200 名敵人",
      battleNote: "怪潮密度提高，優先建立清群技能與穿透。",
      preferredChallenge: "first_wave",
      pressure: ["skitter", "bomber", "ghoul"],
      event: "elitePressure",
      color: "#7edac2"
    },
    companion: {
      id: "companion",
      title: "召喚契約",
      objective: "解鎖第二名召喚伙伴",
      battleNote: "多打菁英與 Boss 取得月塵，回大廳締結新伙伴。",
      preferredChallenge: "elite_breaker",
      pressure: ["warden", "weaver", "brute"],
      event: "elitePressure",
      color: "#c18cff"
    },
    garden: {
      id: "garden",
      title: "月庭試煉",
      objective: "在月之庭園取得 3000 分",
      battleNote: "使用已保存記憶挑戰高分，庭園節奏比培育更急。",
      preferredChallenge: "garden_score",
      pressure: ["mage", "warden", "bomber"],
      event: "sealField",
      color: "#77f0d2"
    }
  };
  const focus = map[chapter?.id] || map.first_memory;
  return {
    ...focus,
    chapterTitle: chapter?.title || STORY_CHAPTERS[0].title,
    progress: chapter?.progress || "0/1"
  };
}

function pickStoryRunChallenge(runType, focus = storyRunFocus()) {
  const preferred = RUN_CHALLENGES.find((challenge) => challenge.id === focus.preferredChallenge && challenge.modes.includes(runType));
  return preferred || pickRunChallenge(runType);
}

function runChallengeProgress(challenge = state.runChallenge) {
  if (!challenge) return null;
  const current = Math.max(0, Math.floor(challenge.value()));
  const done = current >= challenge.target;
  return {
    id: challenge.id,
    name: challenge.name,
    desc: challenge.desc,
    current: Math.min(current, challenge.target),
    target: challenge.target,
    reward: challenge.reward,
    done,
    ratio: clamp(current / challenge.target, 0, 1)
  };
}

function runChallengeSummary() {
  const progress = runChallengeProgress();
  if (!progress) return null;
  return {
    id: progress.id,
    name: progress.name,
    desc: progress.desc,
    progress: `${progress.current}/${progress.target}`,
    reward: progress.reward,
    done: progress.done
  };
}

function objectiveCompassSummary(config = {}) {
  const missionId = config.missionId || state.briefingMission || state.selectedMission;
  const preset = resolveMissionPreset(missionId);
  const focus = config.focus || state.storyFocus || storyRunFocus();
  const challenge = config.challenge || state.runChallenge || previewRunChallenge(missionId === "garden" ? "garden" : "cultivation", focus);
  const live = Boolean(state.player) && !config.preview;
  const challengeProgress = live ? runChallengeProgress(challenge) : null;
  const kills = live ? state.kills : 0;
  const story = storyProgressSummary();
  const storyCurrent = story.rows.find((row) => row.id === focus.id) || story.current;
  const finalState = live
    ? state.finalBossDefeated
      ? "已擊破"
      : state.finalBossActive
        ? "交戰中"
        : kills >= state.targetKills
          ? "即將現身"
          : `${kills}/${state.targetKills}`
    : `0/${preset.targetKills}`;
  const rows = [
    {
      id: "story",
      label: "主線",
      title: focus.title,
      body: focus.objective,
      status: storyCurrent?.progress || focus.progress,
      ratio: storyCurrent?.done ? 1 : 0,
      done: Boolean(storyCurrent?.done),
      color: focus.color || "#ffe18a"
    },
    {
      id: "challenge",
      label: "委託",
      title: challenge?.name || "本局委託",
      body: challenge?.desc || "本局沒有額外委託",
      status: challengeProgress ? `${challengeProgress.current}/${challengeProgress.target}` : challenge ? `0/${challenge.target}` : "無",
      ratio: challengeProgress ? challengeProgress.ratio : 0,
      done: Boolean(challengeProgress?.done),
      color: challengeProgress?.done ? "#ffe18a" : "#7edac2"
    },
    {
      id: "final",
      label: "終局",
      title: missionId === "garden" ? "月庭終局首領" : "終局首領",
      body: `${preset.targetKills} 擊殺後召喚，擊破才算完成本輪。`,
      status: finalState,
      ratio: state.finalBossDefeated ? 1 : clamp(kills / Math.max(1, live ? state.targetKills : preset.targetKills), 0, 1),
      done: Boolean(state.finalBossDefeated),
      color: state.finalBossActive ? "#ffe18a" : "#c18cff"
    }
  ];
  return {
    title: "本輪目標羅盤",
    subtitle: rows.find((row) => !row.done)?.body || "本輪主要目標已完成",
    rows,
    next: rows.find((row) => !row.done) || rows[rows.length - 1]
  };
}

function updateRunChallengeFeedback(dt) {
  if (state.challengeToast) {
    state.challengeToast.t -= dt;
    if (state.challengeToast.t <= 0) state.challengeToast = null;
  }
  const progress = runChallengeProgress();
  if (!progress || state.runChallengeCompleted || !progress.done) return;
  state.runChallengeCompleted = true;
  state.challengeToast = {
    title: `${progress.name} 完成`,
    body: `結算追加 +${progress.reward} 月塵`,
    reward: progress.reward,
    t: 3.4,
    maxT: 3.4
  };
  state.message = `${progress.name} 完成：結算 +${progress.reward} 月塵`;
  pushCombatMedal("challenge", `${progress.name} 完成`, `結算追加 +${progress.reward} 月塵`);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TWO_PI;
    addPickup(state.player.x + Math.cos(a) * 54, state.player.y + Math.sin(a) * 42, 1.5, 7);
  }
  state.shake = Math.max(state.shake, 5);
  addEffect("goldenShield", state.player.x, state.player.y - 28, 150, 0.55);
  sfx("level");
}

function pushCombatMedal(kind, title, body, color = "#ffe18a") {
  state.combatMedals.unshift({
    kind,
    title,
    body,
    color,
    t: 3.8,
    maxT: 3.8
  });
  state.combatMedals = state.combatMedals.slice(0, 4);
}

function updateCombatMedals(dt) {
  for (const medal of state.combatMedals) medal.t -= dt;
  state.combatMedals = state.combatMedals.filter((medal) => medal.t > 0);
}

function musicMoodSummary() {
  if (state.mode === "menu" || state.mode === "loading") {
    return { mood: "lobby", label: "神社待機", intensity: 0.2, bpm: 72 };
  }
  if (state.mode === "pause") {
    return { mood: "pause", label: "暫停低鳴", intensity: 0.25, bpm: 68 };
  }
  if (state.mode === "result") {
    return { mood: "result", label: "結算餘韻", intensity: 0.35, bpm: 76 };
  }
  if (state.mode === "dead") {
    return { mood: "danger", label: "魂火熄滅", intensity: 0.45, bpm: 84 };
  }
  const hpRatio = state.player && state.stats ? state.player.hp / Math.max(1, state.stats.maxHp) : 1;
  const bossActive = activeBosses().length > 0 || state.finalBossActive;
  const danger = hpRatio < 0.32 || state.currentEvent || state.hazards.length > 8 || state.enemies.some((enemy) => enemy.castT > 0 || enemy.specialCast);
  const progress = state.targetKills ? clamp(state.kills / state.targetKills, 0, 1) : 0;
  const crowd = clamp(state.enemies.length / 90, 0, 1);
  let intensity = clamp(0.32 + progress * 0.22 + crowd * 0.24 + (danger ? 0.16 : 0) + (bossActive ? 0.22 : 0), 0.2, 1);
  if (state.mode === "level" || state.mode === "bossReward" || state.mode === "eventChoice") intensity = Math.min(intensity, 0.42);
  if (bossActive) return { mood: "boss", label: state.finalBossActive ? "終局壓迫" : "Boss 交戰", intensity, bpm: 112 };
  if (danger) return { mood: "danger", label: "危險怪潮", intensity, bpm: 104 };
  return { mood: "battle", label: "怪潮推進", intensity, bpm: 88 + Math.round(progress * 14) };
}

function resultNextActions(summary = state.lastRunSummary) {
  const actions = [];
  const story = summary?.storyProgress || storyProgressSummary();
  if (story.claimableCount) {
    actions.push({
      id: "records",
      label: "領主線",
      title: "領取主線章節獎勵",
      body: `${story.claimableCount} 章可領 / +${story.claimableDust} 月塵`,
      color: "#d6a33f"
    });
  }
  const claimable = claimableMissionList();
  if (claimable.length) {
    actions.push({
      id: "missions",
      label: "領任務",
      title: "領取任務月塵",
      body: `${claimable.length} 項可領 / +${claimableMissionReward()} 月塵`,
      color: "#d6a33f"
    });
  }
  const shop = permanentUpgradeSummary();
  if (shop.affordableCount) {
    actions.push({
      id: "shop",
      label: "去商店",
      title: "升級永久修行",
      body: `${shop.affordableCount} 項可升級 / ${shop.next?.name || "修行"}`,
      color: "#4f8f82"
    });
  } else if (shop.next) {
    actions.push({
      id: "shop",
      label: "看商店",
      title: "累積下一次升級",
      body: `${shop.next.name} 需要 ${shop.next.cost} 月塵`,
      color: "#50666a"
    });
  }
  if (summary?.fragment) {
    actions.push({
      id: "memory",
      label: "看記憶",
      title: "新記憶已形成",
      body: `${summary.fragment.name} / 強度 ${summary.fragment.power}`,
      color: "#4b8ca4"
    });
  } else if (!selectedFragment()) {
    actions.push({
      id: "start",
      label: "再挑戰",
      title: "形成第一枚記憶",
      body: "提高等級與擊殺數後會保存本局成長",
      color: "#50666a"
    });
  }
  actions.push({
    id: "start",
    label: "再出發",
    title: "開始下一輪",
    body: `${selectedMissionChoice().title} · 目標 ${resolveMissionPreset(state.selectedMission).targetKills} 擊殺`,
    color: "#263338"
  });
  return actions.slice(0, 3);
}

function postRunPlanSummary(summary = state.lastRunSummary) {
  const story = summary?.storyProgress || storyProgressSummary();
  const claimable = claimableMissionList();
  const shop = permanentUpgradeSummary();
  const summon = nextLockedSummon();
  const rows = [];
  rows.push({
    id: "story",
    label: "主線",
    title: story.claimableCount ? "主線獎勵可領" : story.current.title,
    body: story.claimableCount ? `${story.claimableCount} 章完成，可領 ${story.claimableDust} 月塵` : story.completed >= story.total ? "目前主線已完成" : story.current.objective,
    status: story.claimableCount ? "可領" : story.current.progress,
    tab: "records",
    color: story.claimableCount ? "#b87d23" : story.completed >= story.total ? "#25756a" : "#7b5f1a"
  });
  rows.push({
    id: "missions",
    label: "任務",
    title: claimable.length ? "可領取長期任務" : "沒有可領任務",
    body: claimable.length ? `${claimable.length} 項任務，共 +${claimableMissionReward()} 月塵` : "回大廳查看下一個任務條件",
    status: claimable.length ? "可領" : "追蹤",
    tab: "missions",
    color: claimable.length ? "#b87d23" : "#5c696b"
  });
  rows.push({
    id: "training",
    label: "修行",
    title: shop.affordableCount ? "月塵足夠升級" : "累積下一次修行",
    body: shop.affordableCount ? `${shop.affordableCount} 項可升級，推薦 ${shop.next?.name || "修行"}` : shop.next ? `${shop.next.name} 需要 ${shop.next.cost} 月塵` : "永久修行已滿",
    status: shop.affordableCount ? "可升級" : `${saveData.moonDust}`,
    tab: "shop",
    color: shop.affordableCount ? "#25756a" : "#5c696b"
  });
  rows.push({
    id: "summon",
    label: "召喚",
    title: summon ? summon.name : "伙伴已全數解鎖",
    body: summon ? (saveData.moonDust >= summon.cost ? "月塵足夠締結新契約" : `需要 ${summon.cost} 月塵`) : `${saveData.unlockedSummons.length}/${SUMMONS.length} 伙伴已解鎖`,
    status: summon ? (saveData.moonDust >= summon.cost ? "可解鎖" : `${saveData.moonDust}/${summon.cost}`) : "完成",
    tab: "summon",
    color: summon && saveData.moonDust >= summon.cost ? "#b87d23" : "#5c696b"
  });
  return rows;
}

function resultHighlights(summary = state.lastRunSummary) {
  if (!summary) return [];
  const highlights = [];
  if (summary.runChallenge) {
    highlights.push({
      label: "委託",
      title: summary.runChallenge.done ? "完成" : "未完成",
      body: `${summary.runChallenge.name} ${summary.runChallenge.progress}`,
      color: summary.runChallenge.done ? "#b87d23" : "#5c696b"
    });
  }
  const evolved = summary.evolvedSkills?.length || 0;
  const active = summary.activeSkills?.length || 0;
  highlights.push({
    label: "Build",
    title: evolved ? `${evolved} 進化` : `${active}/5 主動`,
    body: summary.evolvedSkills?.[0]?.name || summary.activeSkills?.[0]?.name || "尚未成形",
    color: evolved ? "#b87d23" : "#25756a"
  });
  const events = summary.eventChoices?.length || 0;
  const boons = summary.bossBoons?.length || 0;
  highlights.push({
    label: "抉擇",
    title: `${boons} 戰利品 / ${events} 事件`,
    body: summary.bossBoons?.[0]?.name || summary.eventChoices?.[0]?.name || "尚未取得",
    color: boons || events ? "#4b8ca4" : "#5c696b"
  });
  if (summary.fragment) {
    highlights.push({
      label: "記憶",
      title: `強度 ${summary.fragment.power}`,
      body: summary.fragment.name,
      color: "#25756a"
    });
  } else if (summary.runType === "garden") {
    highlights.push({
      label: "月庭",
      title: `分數 ${summary.score}`,
      body: `最高 ${summary.bestGarden}`,
      color: "#4b8ca4"
    });
  }
  return highlights.slice(0, 3);
}

function runProgressDeltaSummary(summary = state.lastRunSummary) {
  const story = summary?.storyProgress || storyProgressSummary();
  const collection = collectionSummary();
  const challenge = summary?.runChallenge;
  const rows = [
    {
      label: "主線",
      title: story.claimableCount ? `${story.claimableCount} 章可領` : story.current?.title || "主線推進",
      body: story.claimableCount ? `可領 +${story.claimableDust} 月塵` : story.current?.progress || "持續推進",
      color: story.claimableCount ? "#b87d23" : "#25756a"
    },
    {
      label: "收藏",
      title: `${collection.percent}%`,
      body: `下個：${collection.next.label} ${collection.next.status}`,
      color: "#4b8ca4"
    },
    {
      label: "委託",
      title: challenge ? (challenge.done ? "完成" : "未完成") : "無委託",
      body: challenge ? `${challenge.name} ${challenge.progress}` : "下局會重新抽選",
      color: challenge?.done ? "#b87d23" : "#5c696b"
    }
  ];
  if (summary?.fragment) {
    rows[1] = {
      label: "記憶",
      title: `強度 ${summary.fragment.power}`,
      body: summary.fragment.name,
      color: "#25756a"
    };
  } else if (summary?.runType === "garden") {
    rows[1] = {
      label: "月庭",
      title: `分數 ${summary.score}`,
      body: `最高 ${summary.bestGarden}`,
      color: summary.score >= summary.bestGarden ? "#b87d23" : "#4b8ca4"
    };
  }
  return rows;
}

function deathSummary() {
  const summary = state.lastRunSummary || {
    runType: state.runType,
    cleared: false,
    time: Math.round(state.time),
    kills: state.kills,
    level: state.level,
    moonDust: 0,
    phaseReached: currentStagePhase().name,
    runRewards: state.runRewards,
    runChallenge: runChallengeSummary(),
    activeSkills: state.pickedUpgrades,
    evolvedSkills: state.evolvedSkills,
    storyProgress: storyProgressSummary()
  };
  const hit = state.lastHit;
  const cause = hit?.source || (activeBosses().length ? "Boss 壓迫" : "怪潮包圍");
  const tips = [];
  if ((summary.level || 1) < 3) tips.push("先保留閃避，拉開距離再撿魂火。");
  if (!summary.activeSkills?.length) tips.push("升級時先拿主動技能，建立基本輸出。");
  if (!summary.evolvedSkills?.length && (summary.level || 1) >= 4) tips.push("把核心技能推到 Lv.5，優先做出進化。");
  if (summary.runChallenge && !summary.runChallenge.done) tips.push(`本局委託「${summary.runChallenge.name}」下一局可優先完成。`);
  if (!tips.length) tips.push("下一局補被動生存或吸魂範圍，走位會更穩。");
  return {
    cause,
    title: "魂火熄滅",
    subtitle: `${summary.runType === "garden" ? "月之庭園" : "記憶培育"}未完成`,
    time: summary.time,
    kills: summary.kills,
    level: summary.level,
    moonDust: summary.moonDust || 0,
    phaseReached: summary.phaseReached || currentStagePhase().name,
    runChallenge: summary.runChallenge || null,
    storyProgress: summary.storyProgress || storyProgressSummary(),
    activeSkills: (summary.activeSkills || []).map((skill) => ({ name: skill.name, level: skill.level || 1 })).slice(0, 5),
    tips: tips.slice(0, 3),
    actions: [
      { id: "retry", label: "再試一次", hint: "直接重新進入同模式" },
      { id: "menu", label: "回庭院", hint: "整理裝備與模式" },
      { id: "shop", label: "去強化", hint: "使用月塵升永久修行" }
    ]
  };
}

function runLogSummary() {
  const threat = threatSummary();
  const rows = [];
  rows.push({
    label: "戰利品",
    title: `Boss ${state.runRewards.bossKills} / 精英 ${state.runRewards.eliteKills}`,
    body: `本局 +${state.runRewards.moonDust} 月塵`,
    color: state.runRewards.moonDust ? "#d6a33f" : "#6f8587"
  });
  rows.push({
    label: "Boss",
    title: state.bossBoons.length ? state.bossBoons.map((boon) => boon.name).slice(-2).join(" / ") : "尚未取得戰利品",
    body: state.finalBossActive ? "終局交戰中" : state.finalBossDefeated ? "終局已擊破" : activeBosses().length ? "Boss 交戰中" : "尚未遇到 Boss",
    color: state.bossBoons.length || activeBosses().length ? "#d6a33f" : "#6f8587"
  });
  rows.push({
    label: "異變",
    title: state.eventChoicesTaken.length ? state.eventChoicesTaken.map((event) => event.name).slice(-2).join(" / ") : "尚未觸發",
    body: state.currentEvent ? `進行中：${combatEventName(state.currentEvent.id)}` : "目前無事件壓力",
    color: state.eventChoicesTaken.length || state.currentEvent ? "#7edac2" : "#6f8587"
  });
  rows.push({
    label: "危險",
    title: threat.title,
    body: threat.active ? threat.line : "目前可專注撿魂火與拉怪",
    color: threat.color
  });
  return {
    time: Math.round(state.time),
    score: state.runType === "garden" ? gardenScore() : state.kills,
    threat,
    rows
  };
}

function retryLastRun() {
  const missionId = state.selectedMission || saveData.selectedMission || MISSION_CHOICES[0].id;
  const mission = selectedMissionChoice(missionId);
  state.selectedMission = mission.id;
  state.runBriefing = runBriefingSummary(mission);
  state.mode = "briefing";
  state.message = "重新整備：確認後再次出發";
  draw();
}

function openResultDestination(destination = "home") {
  startMenu();
  if (destination === "missions") setMenuTab("missions");
  else if (destination === "shop") setMenuTab("shop");
  else if (destination === "memory") setMenuTab("memory");
  else if (destination === "summon") setMenuTab("summon");
  else if (destination === "records") {
    setMenuTab("records");
    state.recordsTab = "overview";
  }
  else state.menuTab = "home";
  state.message = destination === "home" ? "準備開始下一輪挑戰" : "已依結算建議開啟對應頁面";
}

function buyPermanentUpgrade(index) {
  const item = PERMANENT_UPGRADES[index];
  if (!item) return false;
  const level = upgradeLevel(item.id);
  if (level >= item.max) {
    state.message = `${item.name} 已滿級`;
    return false;
  }
  const cost = upgradeCost(item);
  if (saveData.moonDust < cost) {
    state.message = `月塵不足，需要 ${cost}`;
    return false;
  }
  saveData.moonDust -= cost;
  saveData.upgrades[item.id] = level + 1;
  persistSave();
  state.message = `${item.name} 升到 ${level + 1}/${item.max}`;
  return true;
}

function autoBuyPermanentUpgrades() {
  let bought = 0;
  let spent = 0;
  const purchased = [];
  while (true) {
    const item = recommendedPermanentUpgrade();
    if (!item || upgradeLevel(item.id) >= item.max) break;
    const cost = upgradeCost(item);
    if (saveData.moonDust < cost) break;
    saveData.moonDust -= cost;
    saveData.upgrades[item.id] = upgradeLevel(item.id) + 1;
    bought++;
    spent += cost;
    purchased.push(item.name);
  }
  if (!bought) {
    const next = recommendedPermanentUpgrade();
    state.message = next ? `月塵不足，下一項 ${next.name} 需要 ${upgradeCost(next)}` : "永久修行已全數滿級";
    return false;
  }
  persistSave();
  state.message = `自動修行 ${bought} 次，花費 ${spent} 月塵`;
  return { bought, spent, purchased };
}

function buyOrSelectSummon(index) {
  const item = SUMMONS[index];
  if (!item) return false;
  const owned = saveData.unlockedSummons.includes(item.id);
  if (!owned) {
    if (saveData.moonDust < item.cost) {
      state.message = `月塵不足，需要 ${item.cost}`;
      return false;
    }
    saveData.moonDust -= item.cost;
    saveData.unlockedSummons.push(item.id);
  }
  saveData.selectedSummon = item.id;
  persistSave();
  state.message = `召喚伙伴：${item.name}`;
  return true;
}

function affordableLockedSummons() {
  return SUMMONS.filter((item) => !saveData.unlockedSummons.includes(item.id) && saveData.moonDust >= item.cost);
}

function autoUnlockSummons() {
  const unlocked = [];
  let spent = 0;
  for (const item of SUMMONS) {
    if (saveData.unlockedSummons.includes(item.id)) continue;
    if (saveData.moonDust < item.cost) continue;
    saveData.moonDust -= item.cost;
    saveData.unlockedSummons.push(item.id);
    saveData.selectedSummon = item.id;
    unlocked.push(item.name);
    spent += item.cost;
  }
  if (!unlocked.length) {
    const next = nextLockedSummon();
    state.message = next ? `月塵不足，${next.name} 需要 ${next.cost}` : "召喚伙伴已全數締約";
    return false;
  }
  persistSave();
  state.message = `締約 ${unlocked.length} 名伙伴，花費 ${spent} 月塵`;
  return { unlocked, spent };
}

function menuTabTitle() {
  const titles = {
    home: "月夜庭院",
    memory: "記憶碎片",
    stats: "角色屬性",
    equipment: "裝備",
    missions: "任務",
    shop: "月塵商店",
    summon: "召喚",
    records: "圖鑑紀錄",
    settings: "設定"
  };
  return titles[state.menuTab] || titles.home;
}

function setMenuTab(tab) {
  state.menuTab = tab;
  state.message = `${menuTabTitle()} 已開啟`;
}

function activeSkillsForView() {
  normalizePickedUpgrades();
  return state.pickedUpgrades.slice(0, MAX_ACTIVE_SKILLS);
}

function passiveSkillsForView() {
  normalizePassiveUpgrades();
  return state.passiveUpgrades.slice(0, 8);
}

function pauseInspectableSkills() {
  return [
    ...activeSkillsForView().map((skill, index) => ({ ...skill, slot: index + 1, group: "主動" })),
    ...passiveSkillsForView().map((skill, index) => ({ ...skill, slot: index + 1, group: "被動" })),
    ...state.evolvedSkills.map((skill, index) => ({ ...skill, level: MAX_SKILL_LEVEL, family: "進化", slot: index + 1, group: "進化" }))
  ];
}

function pauseSelectedSkill() {
  const list = pauseInspectableSkills();
  if (!list.length) return null;
  state.pauseSkillIndex = clamp(state.pauseSkillIndex, 0, list.length - 1);
  return list[state.pauseSkillIndex];
}

function recordTabs() {
  return [
    ["overview", "概覽"],
    ["enemies", "敵人"],
    ["skills", "流派"],
    ["rules", "規則"]
  ];
}

function enemyCodexRows() {
  return [
    ["魑魅", "基礎近戰，數量多，用走位拉開後清掉。"],
    ["疾影", "靠近時會加速貼身，橫向移動比直線後退安全。"],
    ["咒師", "遠距離施法，會先出現瞄準提示再射彈。"],
    ["爆靈", "死亡留下爆裂區，擊殺後立刻換位。"],
    ["護衛", "替附近敵人減傷，看到護陣先集火。"],
    ["巨怪 / Boss", "高血量壓迫目標，會有彈幕與終局 Boss。"]
  ];
}

function elementCodexRows() {
  return [
    ["火", "燃燒、爆炎、隕火，適合密集怪潮。"],
    ["水", "緩速、霜環、冰片，適合控場拉距離。"],
    ["雷", "連鎖、會心、雷暴，適合打散群怪。"],
    ["毒", "持續傷害、毒雲、腐蝕，適合削高血敵。"],
    ["影", "詛咒、斬殺、裂隙，適合收割殘血。"],
    ["聖", "護身、金盾、聖裁，適合提高容錯。"],
    ["風", "疾風、旋風、裂風，適合高速走位。"]
  ];
}

function elementCodexMeta() {
  return [
    { id: "fire", label: "火", role: "怪潮爆發", advice: "敵人密集時成長最快，搭配大符紙與穿透可把爆炎連成清場節奏。" },
    { id: "water", label: "水", role: "控場拉距離", advice: "適合新手或高壓局，用緩速與霜環保留走位空間，搭配旋刃更穩。" },
    { id: "lightning", label: "雷", role: "連鎖清線", advice: "怪物分散時價值最高，攻速越快越容易觸發跳電與會心連段。" },
    { id: "poison", label: "毒", role: "削弱高血敵", advice: "對護衛、巨怪與 Boss 壓力好，靠持續傷害與腐蝕降低被貼身風險。" },
    { id: "shadow", label: "影", role: "殘血收割", advice: "適合高傷害或爆發型配置，先壓低血量再靠斬魂與裂隙收尾。" },
    { id: "holy", label: "聖", role: "容錯防守", advice: "沒有自動回血時很重要，護身與金盾能讓失誤不至於直接崩盤。" },
    { id: "wind", label: "風", role: "高速機動", advice: "適合主動拉怪與穿梭拾魂，配合閃避冷卻與旋風刃維持節奏。" }
  ];
}

function elementCodexDetail(id = state.codexElement) {
  const meta = elementCodexMeta().find((item) => item.id === id) || elementCodexMeta()[0];
  const unlock = elementUnlocks.find((item) => item.name.startsWith(meta.label)) || elementUnlocks[0];
  const branches = (elementBranches[meta.id] || []).map((branch) => ({
    name: branch.name,
    desc: branch.desc
  }));
  const evolution = EVOLUTIONS[unlock.name];
  return {
    id: meta.id,
    label: `${meta.label}系`,
    role: meta.role,
    color: elementColor(meta.id),
    unlock: { name: unlock.name, desc: unlock.desc },
    branches,
    evolution: evolution ? { name: evolution.name, desc: evolution.desc, from: unlock.name } : null,
    advice: meta.advice
  };
}

function compactCodexText(value, max = 15) {
  const textValue = String(value || "");
  return textValue.length > max ? `${textValue.slice(0, max - 1)}…` : textValue;
}

function fitText(value, maxWidth, size = 13) {
  const textValue = String(value || "");
  ctx.font = `${size}px "Microsoft JhengHei", sans-serif`;
  if (ctx.measureText(textValue).width <= maxWidth) return textValue;
  let out = "";
  for (const ch of textValue) {
    if (ctx.measureText(`${out}${ch}…`).width > maxWidth) break;
    out += ch;
  }
  return out ? `${out}…` : "…";
}

function ruleCodexRows() {
  return [
    "主動技能最多 5 種；同名技能會升級，不佔新槽。",
    "被動、Boss 戰利品、事件抉擇會分開記錄。",
    "魂火只有靠近後才會吸過來，聚魂可擴大範圍。",
    "達成擊殺目標後會召喚終局 Boss，擊破才結算。",
    "沒有自動回血，生命主要靠走位、閃避、護身與最大生命撐住。"
  ];
}

function nextBossTarget() {
  return BOSS_NODES.find((node) => node > state.kills && node <= state.targetKills) || null;
}

function combatTrackerSummary() {
  const phase = currentStagePhase();
  const challenge = runChallengeProgress();
  const bossSummary = bossHudSummary();
  const nextBoss = nextBossTarget();
  const castingCount = state.enemies.filter((enemy) => enemy.castT > 0).length;
  const objective = state.finalBossActive
    ? "擊破終局首領"
    : state.finalBossDefeated
      ? "本輪完成，準備結算"
      : state.kills >= state.targetKills
        ? "等待終局首領現身"
        : state.runType === "garden"
          ? `月庭生存到 ${state.targetKills} 擊殺`
          : `培育 ${state.kills}/${state.targetKills} 擊殺`;
  const bossLine = state.finalBossActive
    ? "終局首領交戰中"
    : bossSummary
      ? `${bossSummary.finalBoss ? "終局" : "Boss"} HP ${bossSummary.hp}/${bossSummary.maxHp}`
      : nextBoss
        ? `下一 Boss：${Math.max(0, nextBoss - state.kills)} 擊殺後`
        : state.finalBossDefeated
          ? "終局已擊破"
          : "準備終局";
  const danger = state.currentEvent
    ? `事件：${combatEventName(state.currentEvent.id)}`
    : castingCount
      ? `施法預警 x${castingCount}`
      : state.hazards.length
        ? `危險區 x${state.hazards.length}`
        : phase.objective;
  const focus = state.storyFocus || storyRunFocus();
  return {
    objective,
    storyFocus: {
      id: focus.id,
      title: focus.title,
      objective: focus.objective,
      progress: focus.progress,
      note: focus.battleNote
    },
    phase: phase.name,
    phaseObjective: phase.objective,
    bossLine,
    danger,
    damageFocus: combatTrackerDamageFocus(),
    challenge: challenge ? {
      name: challenge.name,
      current: challenge.current,
      target: challenge.target,
      reward: challenge.reward,
      done: challenge.done,
      ratio: challenge.ratio
    } : null
  };
}

function combatReadoutSummary() {
  normalizePickedUpgrades();
  normalizePassiveUpgrades();
  const challenge = runChallengeProgress();
  const activeCount = state.pickedUpgrades.length;
  const passiveCount = state.passiveUpgrades.length;
  const evolvedCount = state.evolvedSkills.length;
  return {
    element: state.stats?.element || null,
    elementName: elementName(state.stats?.element),
    activeSlots: activeCount,
    maxActiveSlots: MAX_ACTIVE_SKILLS,
    passiveCount,
    evolvedCount,
    equipment: selectedEquipment().name,
    challenge: challenge ? {
      name: challenge.name,
      current: challenge.current,
      target: challenge.target,
      done: challenge.done,
      reward: challenge.reward
    } : null,
    line: `${elementName(state.stats?.element)} · 主動 ${activeCount}/${MAX_ACTIVE_SKILLS} · 進化 ${evolvedCount}`,
    subline: challenge ? `${challenge.name} ${challenge.current}/${challenge.target}${challenge.done ? ` +${challenge.reward}` : ""}` : selectedEquipment().name
  };
}

function threatSummary() {
  if (!state.player) {
    return {
      level: "safe",
      title: "安全",
      line: "尚未進入戰鬥",
      color: "#7edac2",
      casting: 0,
      bullets: 0,
      hazards: 0,
      nearEnemies: 0,
      nearest: null,
      lastHit: null,
      active: false
    };
  }
  const p = state.player;
  const threats = [];
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (e.castT > 0 || e.specialCast) {
      threats.push({
        type: e.specialCast ? "bossCast" : "cast",
        label: e.specialCast ? "Boss 技能" : "遠程施法",
        x: e.x,
        y: e.y,
        distance: d,
        urgency: e.specialCast ? 95 : 76
      });
    } else if (d < e.radius + p.radius + 46) {
      threats.push({
        type: "contact",
        label: e.kind === "skitter" ? "貼身疾影" : "近身敵人",
        x: e.x,
        y: e.y,
        distance: d,
        urgency: 58
      });
    }
  }
  for (const b of state.enemyBullets) {
    const d = Math.hypot(b.x - p.x, b.y - p.y);
    if (d < 430) {
      threats.push({
        type: "bullet",
        label: b.kind === "boss" ? "Boss 彈幕" : "敵方彈",
        x: b.x,
        y: b.y,
        distance: d,
        urgency: d < 140 ? 92 : 66
      });
    }
  }
  for (const h of state.hazards) {
    if (h.owner === "player") continue;
    const d = Math.hypot(h.x - p.x, h.y - p.y);
    if (d < h.r + p.radius + 180) {
      threats.push({
        type: "hazard",
        label: h.warn > 0 ? "危險區預警" : "危險區",
        x: h.x,
        y: h.y,
        distance: Math.max(0, d - h.r),
        urgency: h.warn > 0 ? 82 : 88
      });
    }
  }
  const casting = state.enemies.filter((e) => e.castT > 0 || e.specialCast).length;
  const nearEnemies = state.enemies.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius + 64).length;
  const lastHit = state.lastHit && state.lastHit.t > 0 ? {
    source: state.lastHit.source,
    damage: Math.round(state.lastHit.damage || 0),
    t: Number(state.lastHit.t.toFixed(2))
  } : null;
  const nearest = threats.sort((a, b) => b.urgency - a.urgency || a.distance - b.distance)[0] || null;
  const level = lastHit ? "hit" : nearest?.urgency >= 85 ? "danger" : threats.length ? "warn" : "safe";
  const title = lastHit ? `受擊：${lastHit.source}` : level === "danger" ? "高危險" : level === "warn" ? "危險預警" : "安全";
  const line = lastHit
    ? `剛受到 ${lastHit.damage} 傷害，先拉開距離。`
    : nearest
      ? `${nearest.label} · 距離 ${Math.round(nearest.distance)}`
      : "目前沒有明顯危險來源。";
  return {
    level,
    title,
    line,
    color: level === "hit" || level === "danger" ? "#ffb4a8" : level === "warn" ? "#ffe18a" : "#7edac2",
    casting,
    bullets: state.enemyBullets.length,
    hazards: state.hazards.filter((h) => h.owner !== "player").length,
    nearEnemies,
    nearest: nearest ? { type: nearest.type, label: nearest.label, x: Math.round(nearest.x), y: Math.round(nearest.y), distance: Math.round(nearest.distance), urgency: nearest.urgency } : null,
    lastHit,
    active: Boolean(lastHit || nearest || casting || state.enemyBullets.length || state.hazards.some((h) => h.owner !== "player"))
  };
}

function mapRatioPoint(entity) {
  return {
    x: Number(clamp(entity.x / WORLD_W, 0, 1).toFixed(3)),
    y: Number(clamp(entity.y / WORLD_H, 0, 1).toFixed(3))
  };
}

function minimapSummary() {
  if (!state.player) {
    return {
      player: null,
      bosses: [],
      hazards: [],
      pickups: [],
      elites: [],
      enemyClusters: [],
      counts: { enemies: 0, pickups: 0, hazards: 0, bosses: 0 }
    };
  }
  const enemyClusters = [];
  const cell = 420;
  const cells = new Map();
  for (const enemy of state.enemies) {
    const key = `${Math.floor(enemy.x / cell)}:${Math.floor(enemy.y / cell)}`;
    const current = cells.get(key) || { x: 0, y: 0, count: 0 };
    current.x += enemy.x;
    current.y += enemy.y;
    current.count += 1;
    cells.set(key, current);
  }
  for (const cluster of [...cells.values()].sort((a, b) => b.count - a.count).slice(0, 5)) {
    enemyClusters.push({
      ...mapRatioPoint({ x: cluster.x / cluster.count, y: cluster.y / cluster.count }),
      count: cluster.count
    });
  }
  const pickupSamples = state.pickups
    .slice()
    .sort((a, b) => Math.hypot(a.x - state.player.x, a.y - state.player.y) - Math.hypot(b.x - state.player.x, b.y - state.player.y))
    .slice(0, 8)
    .map((item) => ({ ...mapRatioPoint(item), xp: item.xp || 1 }));
  return {
    player: mapRatioPoint(state.player),
    bosses: activeBosses().slice(0, 4).map((boss) => ({
      ...mapRatioPoint(boss),
      final: Boolean(boss.finalBoss),
      hpRatio: Number((boss.hp / Math.max(1, boss.maxHp)).toFixed(2))
    })),
    hazards: state.hazards.filter((h) => h.owner !== "player").slice(0, 6).map((hazard) => ({
      ...mapRatioPoint(hazard),
      warn: Number((hazard.warn || 0).toFixed(2)),
      kind: hazard.kind || "hazard"
    })),
    pickups: pickupSamples,
    elites: state.enemies
      .filter((enemy) => ["mage", "warden", "weaver", "mirror_lantern", "talisman_binder", "brute", "bomber"].includes(enemy.kind))
      .slice(0, 8)
      .map((enemy) => ({ ...mapRatioPoint(enemy), kind: enemy.kind })),
    enemyClusters,
    counts: {
      enemies: state.enemies.length,
      pickups: state.pickups.length,
      hazards: state.hazards.filter((h) => h.owner !== "player").length,
      bosses: activeBosses().length
    }
  };
}

function buildProgressSummary() {
  normalizePickedUpgrades();
  normalizePassiveUpgrades();
  const active = state.pickedUpgrades.map((skill, index) => {
    const level = skill.level || skillLevelForOption(findUpgradeByName(skill.name) || skill) || 1;
    const evolution = EVOLUTIONS[skill.name];
    return {
      name: skill.name,
      level,
      slot: index + 1,
      family: skill.family || upgradeFamily(findUpgradeByName(skill.name) || skill),
      evolution: evolution ? { name: evolution.name, remaining: Math.max(0, MAX_SKILL_LEVEL - level), readyNext: level === MAX_SKILL_LEVEL - 1 } : null
    };
  });
  const evolving = active
    .filter((skill) => skill.evolution && !state.evolvedSkills.some((evo) => evo.from === skill.name || evo.name === skill.evolution.name))
    .sort((a, b) => a.evolution.remaining - b.evolution.remaining || b.level - a.level);
  const closest = evolving[0] || null;
  const core = active.slice().sort((a, b) => b.level - a.level || a.slot - b.slot)[0] || null;
  let recommendation = "收集魂火升級，先決定一個核心流派。";
  if (!state.stats?.element && state.level >= 2) {
    recommendation = "下一次升級優先選元素符脈，讓分支技能開始出現。";
  } else if (!active.length) {
    recommendation = "先拿 1 個主動技能，建立基本輸出。";
  } else if (closest?.evolution?.readyNext) {
    recommendation = `下一次看到 ${closest.name} 就拿，會進化成 ${closest.evolution.name}。`;
  } else if (active.length < MAX_ACTIVE_SKILLS && active.length < 3) {
    recommendation = "補第二、第三個主動技能，避免清怪角度太單一。";
  } else if (state.passiveUpgrades.length < 2) {
    recommendation = "補被動強化，優先傷害、吸魂範圍或閃避冷卻。";
  } else if (closest) {
    recommendation = `把 ${closest.name} 推到 Lv.${MAX_SKILL_LEVEL}，目標 ${closest.evolution.name}。`;
  } else if (state.evolvedSkills.length) {
    recommendation = "已有進化技能，現在把怪潮拉進核心輸出範圍。";
  }
  return {
    element: state.stats?.element || null,
    elementName: elementName(state.stats?.element),
    color: elementColor(state.stats?.element) || "#7edac2",
    activeSlots: active.length,
    maxActiveSlots: MAX_ACTIVE_SKILLS,
    passiveCount: state.passiveUpgrades.length,
    evolvedCount: state.evolvedSkills.length,
    coreSkill: core ? { name: core.name, level: core.level, family: core.family } : null,
    nextEvolution: closest ? { from: closest.name, to: closest.evolution.name, level: closest.level, max: MAX_SKILL_LEVEL, remaining: closest.evolution.remaining, readyNext: closest.evolution.readyNext } : null,
    evolved: state.evolvedSkills.map((skill) => ({ name: skill.name, from: skill.from })),
    recommendation
  };
}

function tutorialQuestSummary() {
  const progress = state.tutorialProgress || { moved: 0, souls: 0, upgrades: 0 };
  const bossProgress = state.spawnedBossNodes.filter((node) => node !== "final").length + (state.runRewards?.bossKills || 0);
  const rows = [
    {
      id: "move",
      label: "移動",
      detail: "拉開距離",
      current: Math.min(120, Math.floor(progress.moved || 0)),
      target: 120,
      done: (progress.moved || 0) >= 120
    },
    {
      id: "soul",
      label: "魂火",
      detail: "靠近吸取",
      current: Math.min(3, progress.souls || 0),
      target: 3,
      done: (progress.souls || 0) >= 3
    },
    {
      id: "upgrade",
      label: "升級",
      detail: "選擇符咒",
      current: Math.min(1, progress.upgrades || 0),
      target: 1,
      done: (progress.upgrades || 0) >= 1 || state.pickedUpgrades.length + state.passiveUpgrades.length > 0
    },
    {
      id: "boss",
      label: "Boss",
      detail: "處理節點",
      current: Math.min(1, bossProgress),
      target: 1,
      done: bossProgress > 0 || state.finalBossActive || state.finalBossDefeated
    },
    {
      id: "final",
      label: "終局",
      detail: "擊破首領",
      current: state.finalBossDefeated ? 1 : 0,
      target: 1,
      done: state.finalBossDefeated || state.cleared
    }
  ];
  const completed = rows.filter((row) => row.done).length;
  const active = rows.find((row) => !row.done) || rows[rows.length - 1];
  return { completed, total: rows.length, active, rows };
}

function skillDetailSummary(skill) {
  if (!skill) {
    return {
      title: "尚未取得技能",
      subtitle: "升級後選擇主動或被動強化",
      desc: "主動技能最多 5 種；同一技能重選會升級，不會佔新槽。被動技能另外記錄。",
      next: "先收集魂火升級，再決定流派方向。",
      color: "#6f8587"
    };
  }
  const source = findUpgradeByName(skill.name);
  const evolution = EVOLUTIONS[skill.name];
  const evolvedFrom = Object.entries(EVOLUTIONS).find(([, evo]) => evo.name === skill.name)?.[0];
  const desc = skill.desc || source?.desc || evolution?.desc || "本局取得的強化。";
  const next = evolvedFrom
    ? `由 ${evolvedFrom} 進化而來，屬於最終形態。`
    : evolution
      ? skill.level >= MAX_SKILL_LEVEL
        ? `已可進化為 ${evolution.name}。`
        : `Lv.${MAX_SKILL_LEVEL} 後可進化為 ${evolution.name}。`
      : skill.group === "被動"
        ? "被動不佔主動技能槽，可持續疊加。"
        : skill.level >= MAX_SKILL_LEVEL
          ? "已達目前最高等級。"
          : `再次選到同名技能會升到 Lv.${Math.min(MAX_SKILL_LEVEL, (skill.level || 1) + 1)}。`;
  return {
    title: `${skill.name} Lv.${skill.level || 1}`,
    subtitle: `${skill.group || "技能"} / ${skill.family || upgradeFamily(source)}`,
    desc,
    next,
    color: elementColor(skill.family) || "#ffe8ad"
  };
}

function readableStatRows() {
  const stats = state.stats || makeBaseStats();
  return [
    ["生命", `${state.player ? Math.round(state.player.hp) : stats.maxHp}/${Math.round(stats.maxHp)}`],
    ["傷害", Math.round(stats.damage)],
    ["攻擊間隔", `${stats.fireRate.toFixed(2)} 秒`],
    ["移動速度", Math.round(stats.speed)],
    ["吸魂範圍", Math.round(stats.magnet)],
    ["符咒尺寸", `${Math.round(stats.area * 100)}%`],
    ["穿透", stats.pierce],
    ["閃避冷卻", `${stats.dashCooldown.toFixed(2)} 秒`]
  ];
}

function statsWithEquipment(equipment = null) {
  const previousStats = state.stats;
  const stats = makeBaseStats();
  try {
    state.stats = stats;
    for (const item of PERMANENT_UPGRADES) item.apply(stats, upgradeLevel(item.id));
    selectedSummon().apply(stats);
    equipment?.apply?.();
    return {
      maxHp: stats.maxHp,
      damage: stats.damage,
      fireRate: stats.fireRate,
      speed: stats.speed,
      magnet: stats.magnet,
      pierce: stats.pierce,
      dashCooldown: stats.dashCooldown
    };
  } finally {
    state.stats = previousStats;
  }
}

function signedValue(value, suffix = "") {
  const rounded = Math.round(value * 100) / 100;
  if (rounded > 0) return `+${rounded}${suffix}`;
  return `${rounded}${suffix}`;
}

function equipmentPreviewRows(equipment = selectedEquipment()) {
  const base = statsWithEquipment(null);
  const equipped = statsWithEquipment(equipment);
  return [
    ["最大生命", signedValue(equipped.maxHp - base.maxHp)],
    ["傷害", signedValue(equipped.damage - base.damage)],
    ["吸魂範圍", signedValue(equipped.magnet - base.magnet)],
    ["穿透", signedValue(equipped.pierce - base.pierce)],
    ["攻擊間隔", signedValue(equipped.fireRate - base.fireRate, " 秒")],
    ["閃避冷卻", signedValue(equipped.dashCooldown - base.dashCooldown, " 秒")]
  ].filter(([, value]) => !value.startsWith("0"));
}

function elementBuildSummary(element = state.stats?.element) {
  if (element === "fire") return "火系：燃燒、爆炎與隕火，適合清密集怪潮。";
  if (element === "water") return "水系：緩速、冰環與裂片，適合控場拉距離。";
  if (element === "lightning") return "雷系：連鎖、會心與雷暴，適合打散群怪。";
  if (element === "poison") return "毒系：持續傷害、毒雲與腐蝕，適合削弱高血敵人。";
  if (element === "shadow") return "影系：詛咒、斬殺與裂隙，適合收割殘血。";
  if (element === "holy") return "聖系：護身、金盾與聖裁，適合提高容錯。";
  if (element === "wind") return "風系：機動、旋風與裂風，適合高速走位。";
  return "尚未選擇流派：Lv.2 後會開始出現元素分支。";
}

function activeElementStats() {
  const s = state.stats;
  if (!s) return [];
  if (s.element === "fire") return [["燃燒", s.fire.burn], ["爆炎", s.fire.explosion], ["隕火", s.fire.meteor]];
  if (s.element === "water") return [["緩速", s.water.slow], ["霜環", s.water.frostNova], ["裂片", s.water.shard]];
  if (s.element === "lightning") return [["連鎖", s.lightning.chain], ["會心", s.lightning.crit], ["雷暴", s.lightning.storm]];
  if (s.element === "poison") return [["猛毒", s.poison.venom], ["毒雲", s.poison.cloud], ["腐蝕", s.poison.weaken]];
  if (s.element === "shadow") return [["詛咒", s.shadow.curse], ["斬魂", s.shadow.execute], ["裂隙", s.shadow.void]];
  if (s.element === "holy") return [["護身", s.holy.ward], ["金盾", s.holy.shield], ["聖裁", s.holy.smite]];
  if (s.element === "wind") return [["疾風", s.wind.speed], ["旋風", s.wind.cyclone], ["裂風", s.wind.split]];
  return [];
}

function resolveMissionPreset(name = "default") {
  return GAME_CONFIG.missionPresets[name] || GAME_CONFIG.missionPresets.default;
}

function selectedMissionChoice() {
  return MISSION_CHOICES.find((mission) => mission.id === state.selectedMission) || MISSION_CHOICES[0];
}

function gardenMissionPreview(fragment = selectedFragment()) {
  if (!fragment) {
    return {
      available: false,
      title: "月之庭園未解鎖",
      lines: ["完成記憶培育後會保存本局技能", "取得記憶碎片後可進入月之庭園"],
      bestGarden: saveData.bestGarden || 0
    };
  }
  const skills = [...(fragment.activeSkills || []), ...(fragment.evolvedSkills || [])].filter(Boolean);
  return {
    available: true,
    title: fragment.name,
    power: fragment.power || 0,
    level: fragment.level || 1,
    activeSkillCount: fragment.activeSkills?.length || 0,
    evolvedSkillCount: fragment.evolvedSkills?.length || 0,
    bestGarden: saveData.bestGarden || 0,
    lines: [
      `記憶強度 ${fragment.power || 0} · Lv.${fragment.level || 1}`,
      `${fragment.activeSkills?.length || 0} 主動 / ${fragment.evolvedSkills?.length || 0} 進化`,
      skills.length ? `核心：${skills.slice(0, 2).join(" / ")}` : "核心：尚未記錄技能"
    ]
  };
}

function canStartMission(id = state.selectedMission) {
  return id !== "garden" || Boolean(selectedFragment());
}

function previewRunChallenge(runType, focus = storyRunFocus()) {
  const preferred = RUN_CHALLENGES.find((challenge) => challenge.id === focus.preferredChallenge && challenge.modes.includes(runType));
  if (preferred) return preferred;
  if (runType === "garden") return RUN_CHALLENGES.find((challenge) => challenge.id === "garden_score");
  return RUN_CHALLENGES.find((challenge) => challenge.id === "first_wave") || RUN_CHALLENGES[0];
}

function runBriefingSummary(missionId = state.briefingMission || state.selectedMission) {
  const mission = MISSION_CHOICES.find((item) => item.id === missionId) || selectedMissionChoice();
  const preset = resolveMissionPreset(mission.id);
  const runType = mission.id === "garden" ? "garden" : "cultivation";
  const focus = storyRunFocus();
  const scene = storySceneSummary();
  const challenge = previewRunChallenge(runType, focus);
  const fragment = selectedFragment();
  const garden = mission.id === "garden" ? gardenMissionPreview(fragment) : null;
  const equipment = selectedEquipment();
  const summon = selectedSummon();
  const locked = !canStartMission(mission.id);
  return {
    missionId: mission.id,
    title: mission.title,
    subtitle: mission.sub,
    locked,
    runType,
    targetKills: preset.targetKills,
    finalBoss: mission.id === "garden" ? "月庭終局首領" : "終局首領",
    story: {
      id: focus.id,
      title: focus.chapterTitle,
      focus: focus.title,
      objective: focus.objective,
      progress: focus.progress,
      note: focus.battleNote,
      color: focus.color,
      scene
    },
    challenge: challenge ? { id: challenge.id, name: challenge.name, desc: challenge.desc, target: challenge.target, reward: challenge.reward } : null,
    compass: objectiveCompassSummary({ missionId: mission.id, focus, challenge, targetKills: preset.targetKills, preview: true, locked }),
    loadout: {
      equipment: equipment.name,
      equipmentDesc: equipment.desc,
      summon: summon.name,
      summonDesc: summon.desc,
      fragment: fragment?.name || null,
      garden
    },
    rules: [
      `${preset.targetKills} 擊殺後召喚${mission.id === "garden" ? "月庭終局" : "終局首領"}`,
      "魂火只有靠近後才會吸取，升級時選技能分支",
      "沒有自動回血，受傷後靠閃避與防守技能保命"
    ]
  };
}

function selectMission(id) {
  const mission = MISSION_CHOICES.find((item) => item.id === id);
  if (!mission) return false;
  if (id === "garden" && !selectedFragment()) {
    state.message = "月之庭園需要先完成培育取得記憶碎片";
    return false;
  }
  state.selectedMission = id;
  persistSave();
  state.message = `模式：${mission.title}`;
  return true;
}

function startSelectedMission() {
  if (!canStartMission(state.selectedMission)) {
    state.message = "先完成一次記憶培育，取得碎片後才能進入月之庭園";
    return false;
  }
  state.briefingMission = state.selectedMission;
  state.mode = "briefing";
  state.message = "確認本局目標後出發";
  return true;
}

function closeRunBriefing() {
  state.mode = "menu";
  state.menuTab = "home";
  state.briefingMission = null;
  state.message = "已返回出擊準備";
  return true;
}

function confirmRunBriefing() {
  const missionId = state.briefingMission || state.selectedMission;
  if (!canStartMission(missionId)) {
    state.message = "此模式尚未解鎖";
    state.mode = "menu";
    return false;
  }
  state.briefingMission = null;
  resetGame(missionId);
  return true;
}

function makeBaseStats() {
  return {
    speed: 292,
    maxHp: 70,
    fireRate: 0.38,
    damage: 30,
    projectileSpeed: 680,
    magnet: 130,
    area: 1,
    blades: 0,
    bladeDamage: 20,
    pierce: 0,
    dashCooldown: 1.25,
    hurtGrace: 0,
    equipmentVacuum: 0,
    bloodCloak: 0,
    bloodFrenzy: 0,
    element: null,
    fire: { burn: 0, explosion: 0, meteor: 0 },
    water: { slow: 0, frostNova: 0, shard: 0 },
    lightning: { chain: 0, crit: 0, storm: 0 },
    poison: { venom: 0, cloud: 0, weaken: 0 },
    shadow: { curse: 0, execute: 0, void: 0 },
    holy: { ward: 0, shield: 0, smite: 0 },
    wind: { speed: 0, cyclone: 0, split: 0 }
  };
}

function resetGame(missionName = "default") {
  const mission = resolveMissionPreset(missionName);
  const runType = missionName === "garden" ? "garden" : "cultivation";
  startAudio();
  state.mode = "playing";
  state.runType = runType;
  state.appliedMemory = runType === "garden" ? selectedFragment() : null;
  state.finalized = false;
  state.lastRunSummary = null;
  state.time = 0;
  state.kills = 0;
  state.targetKills = mission.targetKills;
  state.cleared = false;
  state.level = 1;
  state.xp = 0;
  state.xpNeed = 20;
  state.shake = 0;
  state.hurtFlash = 0;
  state.lastHit = null;
  state.freeze = 0;
  state.spawnT = 0;
  state.mageT = mission.mage.base;
  state.eliteT = mission.elite.base;
  state.eventT = 18;
  state.currentEvent = null;
  state.eventChoiceOptions = [];
  state.eventChoiceSource = null;
  state.eventChoicesTaken = [];
  state.phaseIndex = 0;
  state.phaseNoticeT = 4.5;
  state.milestoneBanner = null;
  state.tutorialHint = null;
  state.seenHints = {};
  state.tutorialProgress = { moved: 0, souls: 0, upgrades: 0 };
  state.mission = missionName;
  state.spawnConfig = mission.spawn;
  state.spawnedBossNodes = [];
  state.warnedBossNodes = [];
  state.finalBossActive = false;
  state.finalBossDefeated = false;
  nextEnemyId = 1;
  state.message = mission.message;
  state.camera = {
    x: clamp(WORLD_W / 2 - W / (2 * VIEW_SCALE), 0, WORLD_W - W / VIEW_SCALE),
    y: clamp(WORLD_H / 2 - H / (2 * VIEW_SCALE), 0, WORLD_H - H / VIEW_SCALE),
    shakeX: 0,
    shakeY: 0
  };
  state.enemies = [];
  state.bullets = [];
  state.enemyBullets = [];
  state.pickups = [];
  state.hazards = [];
  state.effects = [];
  state.damageText = [];
  state.damageSources = {};
  state.perfStats = { skippedSpawns: 0, trimmedPickups: 0, trimmedEffects: 0, trimmedDamageText: 0, trimmedEnemies: 0 };
  state.runRewards = { moonDust: 0, bossKills: 0, eliteKills: 0 };
  state.storyFocus = storyRunFocus();
  state.runChallenge = pickStoryRunChallenge(runType, state.storyFocus);
  state.runChallengeCompleted = false;
  state.challengeToast = null;
  state.challengeBonus = 0;
  state.bossRewardOptions = [];
  state.bossRewardSource = null;
  state.bossBoons = [];
  state.options = [];
  state.pickedUpgrades = [];
  state.passiveUpgrades = [];
  state.evolvedSkills = [];
  state.skillLevels = {};
  state.stats = makeBaseStats();
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
  state.companion = {
    x: state.player.x + 58,
    y: state.player.y - 58,
    cooldown: 0.8,
    pulse: 0,
    action: "idle"
  };
  applyMetaProgression(state.stats);
  selectedEquipment().apply();
  if (runType === "garden") applyMemoryFragment(state.appliedMemory);
  state.player.hp = state.stats.maxHp;
  for (let i = 0; i < 8; i++) spawnEnemy("ghoul");
  applyStoryRunFocusStart();
  showHint("start", true);
}

function applyStoryRunFocusStart() {
  const focus = state.storyFocus || storyRunFocus();
  if (!state.player) return;
  for (const kind of focus.pressure || []) {
    const enemy = spawnEnemy(kind);
    if (!enemy) continue;
    const angle = Math.random() * TWO_PI;
    const radius = rand(230, 360);
    enemy.x = clamp(state.player.x + Math.cos(angle) * radius, 60, WORLD_W - 60);
    enemy.y = clamp(state.player.y + Math.sin(angle) * radius, 60, WORLD_H - 60);
  }
  state.phaseNoticeT = Math.max(state.phaseNoticeT, 4.8);
  showMilestoneBanner("phase", focus.title, focus.battleNote, 3.6);
  state.message = `${focus.title}：${focus.objective}`;
}

function applyMemoryFragment(fragment) {
  if (!fragment) {
    state.message = "尚未有記憶碎片，先完成培育。";
    return;
  }
  state.level = Math.max(1, fragment.level || 1);
  state.stats.damage += Math.round((fragment.power || 0) * 0.22);
  state.stats.maxHp += Math.round((fragment.power || 0) * 0.55);
  state.stats.magnet += 30;
  state.pickedUpgrades = fragment.activeSkills.map((skill) => ({ ...skill }));
  state.passiveUpgrades = fragment.passiveSkills.map((skill) => ({ ...skill }));
  state.evolvedSkills = (fragment.evolvedSkills || []).map((skill) => ({ ...skill }));
  for (const skill of [...state.pickedUpgrades, ...state.passiveUpgrades]) {
    state.skillLevels[skill.key || `skill:${skill.name}`] = skill.level || 1;
    for (let i = 0; i < (skill.level || 1); i++) {
      const opt = findUpgradeByName(skill.name);
      opt?.apply?.();
    }
  }
  for (const evo of state.evolvedSkills) {
    const source = Object.values(EVOLUTIONS).find((item) => item.name === evo.name);
    source?.apply?.();
  }
}

function startAudio() {
  if (audioMuted || audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume?.();
  scheduleMusic();
}

function toggleAudioMute() {
  const audioEnabled = audioMuted;
  setGameSetting("audio", audioEnabled);
  state.message = audioEnabled ? "音樂已開啟" : "音樂已關閉";
}

function requestSaveReset() {
  state.resetConfirm = true;
  state.message = "再次點擊確認重置，或按取消保留存檔";
}

function cancelSaveReset() {
  state.resetConfirm = false;
  state.message = "已取消重置存檔";
}

function confirmSaveReset() {
  localStorage.removeItem(SAVE_KEY);
  saveData = loadSave();
  audioMuted = saveData.settings?.audio === false;
  state.selectedMission = saveData.selectedMission;
  state.selectedEquipment = saveData.selectedEquipment;
  state.selectedFragmentId = saveData.selectedFragmentId;
  state.memoryDeleteConfirmId = null;
  state.resetConfirm = false;
  startMenu();
  setMenuTab("settings");
  state.message = "存檔已重置";
}

function scheduleMusic() {
  if (!audioCtx || audioMuted) return;
  const mood = musicMoodSummary();
  const beat = 60 / mood.bpm;
  const rootTime = audioCtx.currentTime + 0.04;
  const patterns = {
    lobby: [98, 130.81, 146.83, 130.81],
    pause: [82.41, 98, 110, 98],
    result: [130.81, 164.81, 196, 164.81],
    battle: [110, 110, 146.83, 98],
    danger: [92.5, 92.5, 123.47, 87.31],
    boss: [73.42, 92.5, 73.42, 110]
  };
  const lead = {
    lobby: [392, 493.88, 523.25],
    pause: [261.63, 329.63, 392],
    result: [523.25, 659.25, 783.99],
    battle: [659.25, 783.99, 880],
    danger: [587.33, 739.99, 830.61],
    boss: [554.37, 739.99, 987.77]
  };
  const bassLine = patterns[mood.mood] || patterns.battle;
  const leadLine = lead[mood.mood] || lead.battle;
  const section = musicLoopIndex++;
  for (let i = 0; i < 16; i++) {
    const t = rootTime + i * beat;
    const bass = bassLine[(i + section) % bassLine.length];
    tone(bass, t, 0.1 + mood.intensity * 0.07, mood.mood === "boss" ? "sawtooth" : "triangle", 0.026 + mood.intensity * 0.03);
    if (i % 2 === 0 && mood.mood !== "pause") noise(t + 0.02, 0.03 + mood.intensity * 0.02, 0.008 + mood.intensity * 0.018);
    if (mood.mood === "boss" && i % 4 === 0) tone(bass * 2, t + beat * 0.5, 0.08, "square", 0.014 + mood.intensity * 0.01);
    if ((mood.mood === "danger" || mood.mood === "battle") && i % 4 === 2) tone(leadLine[(i + section) % leadLine.length], t + beat * 0.33, 0.08, "sine", 0.014 + mood.intensity * 0.018);
    if (mood.mood === "result" && i % 4 === 1) tone(leadLine[(i + section) % leadLine.length], t + beat * 0.4, 0.12, "sine", 0.018);
    if (mood.mood === "lobby" && i % 8 === 6) tone(leadLine[(i + section) % leadLine.length], t + beat * 0.45, 0.1, "sine", 0.015);
  }
  musicTimer = window.setTimeout(scheduleMusic, beat * 16 * 1000 - 80);
}

function tone(freq, when = 0, duration = 0.08, type = "sine", gain = 0.05) {
  if (!audioCtx || audioMuted) return;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(gain, when + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(amp).connect(audioCtx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

function noise(when = 0, duration = 0.05, gain = 0.025) {
  if (!audioCtx || audioMuted) return;
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = audioCtx.createBufferSource();
  const amp = audioCtx.createGain();
  src.buffer = buffer;
  amp.gain.setValueAtTime(gain, when);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  src.connect(amp).connect(audioCtx.destination);
  src.start(when);
}

function sfx(name) {
  if (!audioCtx || audioMuted) return;
  const now = audioCtx.currentTime;
  if (name === "hit") tone(360, now, 0.04, "square", 0.018);
  if (name === "shoot") tone(740, now, 0.035, "triangle", 0.014);
  if (name === "hurt") { tone(92, now, 0.16, "sawtooth", 0.045); noise(now, 0.12, 0.025); }
  if (name === "level") { tone(523.25, now, 0.08, "sine", 0.04); tone(783.99, now + 0.08, 0.12, "sine", 0.04); }
  if (name === "clear") { tone(392, now, 0.12, "triangle", 0.045); tone(523.25, now + 0.13, 0.12, "triangle", 0.045); tone(783.99, now + 0.26, 0.2, "triangle", 0.04); }
}

function startMenu() {
  state.mode = "menu";
  state.menuTab = "home";
  state.pauseTab = "skills";
  state.pauseSkillIndex = 0;
  state.resetConfirm = false;
  state.memoryDeleteConfirmId = null;
  state.message = "短局任務制割草新版本";
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

function updateVirtualStick(x, y, pointerId = touchControl.pointerId) {
  const maxR = 62;
  const dx = x - touchControl.startX;
  const dy = y - touchControl.startY;
  const d = Math.hypot(dx, dy);
  const scale = d > maxR ? maxR / d : 1;
  touchControl.pointerId = pointerId;
  touchControl.x = touchControl.startX + dx * scale;
  touchControl.y = touchControl.startY + dy * scale;
  touchControl.dx = d > 8 ? (dx * scale) / maxR : 0;
  touchControl.dy = d > 8 ? (dy * scale) / maxR : 0;
}

function startVirtualStick(x, y, pointerId) {
  touchControl.active = true;
  touchControl.pointerId = pointerId;
  touchControl.startX = x;
  touchControl.startY = y;
  updateVirtualStick(x, y, pointerId);
}

function stopVirtualStick(pointerId = touchControl.pointerId) {
  if (touchControl.pointerId !== pointerId) return;
  touchControl.active = false;
  touchControl.pointerId = null;
  touchControl.dx = 0;
  touchControl.dy = 0;
  touchControl.x = touchControl.startX;
  touchControl.y = touchControl.startY;
}

function isDashButton(x, y) {
  return x >= W - 196 && y >= H - 184;
}

function isPauseButton(x, y) {
  return x >= W - 72 && x <= W - 12 && y >= 8 && y <= 68;
}

function openPause(tab = "skills") {
  if (state.mode !== "playing") return;
  state.mode = "pause";
  state.pauseTab = tab;
  draw();
}

function closePause() {
  if (state.mode !== "pause") return;
  state.mode = "playing";
  draw();
}

function queueTouchDash() {
  touchControl.dashQueued = true;
  touchControl.lastDashT = 0.18;
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

function enemyBudgetFull(kind) {
  if (kind === "boss") return false;
  return state.enemies.filter((enemy) => enemy.kind !== "boss").length >= ENTITY_BUDGETS.enemies;
}

function trimOldest(array, max, statKey) {
  while (array.length > max) {
    array.shift();
    if (statKey) state.perfStats[statKey] = (state.perfStats[statKey] || 0) + 1;
  }
}

function addPickup(x, y, xp, r = 8) {
  state.pickups.push({ x, y, r, xp, t: 0 });
  trimOldest(state.pickups, ENTITY_BUDGETS.pickups, "trimmedPickups");
}

function spawnEnemy(kind = "ghoul", overrides = {}) {
  if (enemyBudgetFull(kind)) {
    state.perfStats.skippedSpawns++;
    return null;
  }
  const pos = edgeSpawn();
  const minute = state.time / 60;
  const template = GAME_CONFIG.enemyProfiles[kind] || GAME_CONFIG.enemyProfiles.ghoul;
  const missionScale = 1 + Math.max(0, state.time - 80) / 190;
  const tuned = {
    ...template,
    hp: template.baseHp + minute * template.hpPerMinute * missionScale,
    speed: template.baseSpeed + minute * template.speedPerMinute,
    damage: template.baseDamage,
    radius: template.radius,
    xp: template.xp
  };
  const enemy = {
    id: nextEnemyId++,
    kind,
    ...pos,
    ...tuned,
    ...overrides,
    maxHp: tuned.hp,
    shoot: (kind === "mage" || kind === "boss") ? rand(template.shootMin, template.shootMax) : undefined,
    conjure: kind === "weaver" ? rand(template.conjureMin ?? 4.4, template.conjureMax ?? 6.2) : undefined,
    mirror: kind === "mirror_lantern" ? rand(template.mirrorMin ?? 2.8, template.mirrorMax ?? 3.6) : undefined,
    bind: kind === "talisman_binder" ? rand(template.bindMin ?? 4.2, template.bindMax ?? 5.0) : undefined,
    skill: kind === "boss" ? 3.2 : 0,
    hit: 0,
    anim: Math.random() * 12
  };
  if (overrides.hp) enemy.maxHp = overrides.maxHp || overrides.hp;
  if (overrides.shoot !== undefined) enemy.shoot = overrides.shoot;
  if (overrides.skill !== undefined) enemy.skill = overrides.skill;
  state.enemies.push(enemy);
  return enemy;
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
  if (Math.random() < 0.45) sfx("shoot");
}

function radialBurst() {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TWO_PI;
    spawnPlayerBullet(state.player.x, state.player.y, a, 540, state.stats.damage * 0.85, 0.75, 1, state.stats.element, 9 * state.stats.area);
  }
}

function spawnPlayerBullet(x, y, angle, speed, damage, life, pierce = 0, element = state.stats.element, radius = 8 * state.stats.area) {
  state.bullets.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    r: radius,
    life,
    damage,
    pierce,
    element,
    anim: 0
  });
}

function damageSourceLabelForBullet(b) {
  const map = {
    fire: "火符",
    water: "水符",
    lightning: "雷符",
    poison: "毒符",
    shadow: "影符",
    holy: "聖符",
    wind: "風符"
  };
  return map[b?.element] || "基礎符咒";
}

function recordDamageSource(source, amount) {
  if (!state.damageSources || !Number.isFinite(amount) || amount <= 0) return;
  const name = source || "未標記傷害";
  const row = state.damageSources[name] || { name, damage: 0, hits: 0 };
  row.damage += amount;
  row.hits += 1;
  state.damageSources[name] = row;
}

function damageSourceSummary(limit = 5) {
  const rows = Object.values(state.damageSources || {})
    .filter((row) => row.damage > 0)
    .sort((a, b) => b.damage - a.damage);
  const total = rows.reduce((sum, row) => sum + row.damage, 0);
  return {
    total: Math.round(total),
    rows: rows.slice(0, limit).map((row) => ({
      name: row.name,
      damage: Math.round(row.damage),
      hits: row.hits,
      percent: total > 0 ? Math.round((row.damage / total) * 100) : 0
    }))
  };
}

function combatTrackerDamageFocus() {
  const rows = damageSourceSummary(8).rows
    .filter((row) => !/debug|測試/i.test(row.name || ""));
  const top = rows[0];
  if (!top) {
    return {
      label: "輸出建立中",
      source: "尚無有效來源",
      percent: 0,
      hits: 0,
      color: "#6f8587"
    };
  }
  return {
    label: top.percent >= 50 ? "主輸出" : "輸出焦點",
    source: top.name,
    percent: top.percent,
    hits: top.hits,
    color: top.percent >= 50 ? "#ffe18a" : "#7edac2"
  };
}

function resultDamageAdvice(summary = state.lastRunSummary) {
  const rows = summary?.damageSources?.rows || [];
  const top = rows[0];
  if (!top) {
    return {
      title: "先建立主輸出",
      body: "下一局優先拿一個主動技能，讓輸出來源開始成形。",
      color: "#5c696b",
      source: null
    };
  }
  const name = top.name || "";
  const percent = top.percent || 0;
  const highShare = percent >= 55;
  const elementAdvice = [
    ["火", "火系爆發", "繼續堆火系等級，搭配大符/穿透把爆燃和燃燒面積放大。", "#c65b2d"],
    ["水", "水系控場", "補攻速或範圍，讓霜環更常觸發，替自己爭取撿魂火空間。", "#3f91b2"],
    ["雷", "雷系連鎖", "優先補暴擊與攻速，讓連鎖觸發頻率變成清場核心。", "#a49321"],
    ["毒", "毒系持續", "補生存與聚怪，讓毒傷有時間疊滿，不要只拚瞬間爆發。", "#4f8f27"],
    ["影", "影系處決", "保持高移速與穿透，讓低血處決能一路收割殘血怪。", "#7b4fb2"],
    ["聖", "聖系防守", "把護盾和範圍補起來，讓裁光變成穩定安全圈。", "#b89b28"],
    ["風", "風系旋流", "補攻速與範圍，讓旋流覆蓋更多敵人並維持走位節奏。", "#4f9b6b"]
  ];
  const matched = elementAdvice.find(([key]) => name.includes(key));
  if (matched) {
    return {
      title: highShare ? `${matched[1]}已成核心` : `可加深${matched[1]}`,
      body: matched[2],
      color: matched[3],
      source: top.name
    };
  }
  if (name.includes("旋刃")) {
    return {
      title: "旋刃正在扛輸出",
      body: "下局補範圍、傷害或穿透，讓貼身繞圈變成穩定清場手段。",
      color: "#b87d23",
      source: top.name
    };
  }
  if (SUMMONS.some((summon) => name.includes(summon.name))) {
    return {
      title: "伙伴貢獻明顯",
      body: "可把月塵投入召喚解鎖或支援型 build，讓伙伴承擔更多控場。",
      color: "#4b8ca4",
      source: top.name
    };
  }
  if (name.includes("Debug")) {
    return {
      title: "測試輸出已記錄",
      body: "正式跑局時會依實際技能來源，提示該補強哪條流派。",
      color: "#5c696b",
      source: top.name
    };
  }
  return {
    title: highShare ? "主輸出已集中" : "輸出仍可聚焦",
    body: highShare ? "下一局圍繞第一名輸出補被動與進化。" : "下一局先把一個技能推到 Lv.5，避免輸出太分散。",
    color: "#25756a",
    source: top.name
  };
}

function damageEnemy(e, amount, knock = 16, source = "未標記傷害") {
  if (e.guarded > 0 && amount > 2) amount *= 0.72;
  recordDamageSource(source, amount);
  e.hp -= amount;
  if (knock > 0 && amount >= 8 && Math.random() < 0.35) sfx("hit");
  e.hit = 0.1;
  const d = norm(e.x - state.player.x, e.y - state.player.y);
  e.x += d.x * knock;
  e.y += d.y * knock;
  const recent = state.damageText.find((text) => text.enemyId === e.id && text.t > 0.32);
  if (recent) {
    recent.amount += amount;
    recent.hits = (recent.hits || 1) + 1;
    const averageHit = recent.amount / recent.hits;
    recent.text = recent.hits > 1 && averageHit >= 3 ? `${Math.round(recent.amount)} x${recent.hits}` : Math.round(recent.amount).toString();
    recent.x = e.x;
    recent.y = e.y - 18;
    recent.t = 0.45;
  } else {
    state.damageText.push({ enemyId: e.id, amount, hits: 1, x: e.x, y: e.y - 18, t: 0.45, text: Math.round(amount).toString() });
    trimOldest(state.damageText, ENTITY_BUDGETS.damageText, "trimmedDamageText");
  }
  if (e.finalBoss && e.hp > 0) updateFinalBossPhaseBreaks(e);
  if (e.hp <= 0) killEnemy(e);
}

function addEffect(kind, x, y, size = 120, life = 0.45, angle = 0, alpha = 0.95) {
  state.effects.push({ kind, x, y, size, life, maxLife: life, angle, alpha });
  trimOldest(state.effects, ENTITY_BUDGETS.effects, "trimmedEffects");
}

function applyElementHit(e, b) {
  const element = b.element || state.stats.element;
  if (!element) return;
  if (element === "fire") {
    addEffect(state.stats.fire.meteor > 0 ? "meteorSeal" : "fireBurst", e.x, e.y - 10, 118, 0.38);
    e.burn = Math.max(e.burn || 0, 1.8 + state.stats.fire.burn * 0.65);
    if (state.stats.fire.meteor > 0 && Math.random() < 0.08 + state.stats.fire.meteor * 0.045) {
      addEffect("meteorSeal", e.x, e.y - 48, 210, 0.62);
      for (const other of state.enemies) {
        if (Math.hypot(other.x - e.x, other.y - e.y) < 105 + state.stats.fire.meteor * 12) {
          damageEnemy(other, state.stats.damage * (0.22 + state.stats.fire.meteor * 0.08), 8, "火系隕符");
          other.burn = Math.max(other.burn || 0, 1.2 + state.stats.fire.burn * 0.35);
        }
      }
    }
    if (state.stats.fire.explosion > 0 && Math.random() < 0.18 + state.stats.fire.explosion * 0.08) {
      addEffect("fireBurst", e.x, e.y - 8, 150 + state.stats.fire.explosion * 10, 0.45);
      for (const other of state.enemies) {
        if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 76 + state.stats.fire.explosion * 18) {
          damageEnemy(other, state.stats.damage * (0.45 + state.stats.fire.explosion * 0.12), 10, "火系爆燃");
        }
      }
    }
  }
  if (element === "water") {
    addEffect("frostRing", e.x, e.y - 8, 120 + state.stats.water.frostNova * 10, 0.45);
    e.slow = Math.max(e.slow || 0, 1.4 + state.stats.water.slow * 0.35);
    if (state.stats.water.frostNova > 0 && Math.random() < 0.1 + state.stats.water.frostNova * 0.06) {
      addEffect("frostRing", state.player.x, state.player.y - 8, 170 + state.stats.water.frostNova * 18, 0.5);
      for (const other of state.enemies) {
        if (Math.hypot(other.x - state.player.x, other.y - state.player.y) < 135 + state.stats.water.frostNova * 20) {
          other.slow = Math.max(other.slow || 0, 1.2 + state.stats.water.slow * 0.25);
          damageEnemy(other, state.stats.damage * 0.12, 4, "水系霜環");
        }
      }
    }
    if (state.stats.water.shard > 0 && Math.random() < 0.22) {
      b.pierce += 1;
      const a = b.angle + (Math.random() < 0.5 ? -0.45 : 0.45);
      spawnPlayerBullet(e.x, e.y, a, state.stats.projectileSpeed * 0.72, state.stats.damage * 0.36, 0.55, 0, "water", 6 * state.stats.area);
    }
  }
  if (element === "lightning") {
    addEffect(state.stats.lightning.storm > 0 ? "thunderCrit" : "chainLightning", e.x, e.y - 12, 130, 0.32);
    if (state.stats.lightning.crit > 0 && Math.random() < 0.12 + state.stats.lightning.crit * 0.08) {
      damageEnemy(e, state.stats.damage * 0.7, 8, "雷系暴擊");
      addEffect("thunderCrit", e.x, e.y - 14, 150, 0.28);
    }
    if (state.stats.lightning.storm > 0 && Math.random() < 0.08 + state.stats.lightning.storm * 0.04) {
      for (let i = 0; i < 3 + state.stats.lightning.storm; i++) {
        const target = state.enemies[Math.floor(Math.random() * state.enemies.length)];
        if (!target) break;
        addEffect("thunderCrit", target.x, target.y - 18, 135, 0.28);
        damageEnemy(target, state.stats.damage * 0.28, 5, "雷系風暴");
      }
      state.shake = Math.max(state.shake, 4);
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
      addEffect("chainLightning", (from.x + target.x) / 2, (from.y + target.y) / 2 - 10, 118, 0.25, Math.atan2(target.y - from.y, target.x - from.x));
      damageEnemy(target, state.stats.damage * 0.38, 6, "雷系連鎖");
      hit.add(target);
      from = target;
      jumps--;
    }
  }
  if (element === "poison") {
    addEffect(state.stats.poison.weaken > 0 ? "corrosionSeal" : "poisonMist", e.x, e.y - 6, 120 + state.stats.poison.cloud * 12, 0.55);
    e.poison = Math.max(e.poison || 0, 2.4 + state.stats.poison.venom * 0.7);
    e.weaken = Math.max(e.weaken || 0, state.stats.poison.weaken > 0 ? 1.6 + state.stats.poison.weaken * 0.3 : 0);
    if (state.stats.poison.cloud > 0 && Math.random() < 0.16 + state.stats.poison.cloud * 0.08) {
      state.hazards.push({
        kind: "poisonCloud",
        x: e.x,
        y: e.y,
        r: 62 + state.stats.poison.cloud * 10,
        warn: 0,
        life: 3.4 + state.stats.poison.cloud * 0.35,
        damage: 0,
        tick: 0,
        owner: "player"
      });
      for (const other of state.enemies) {
        if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 92 + state.stats.poison.cloud * 16) {
          other.poison = Math.max(other.poison || 0, 1.4 + state.stats.poison.venom * 0.45);
          addEffect("poisonMist", other.x, other.y - 6, 92, 0.38);
        }
      }
    }
  }
  if (element === "shadow") {
    addEffect(state.stats.shadow.void > 0 ? "voidRift" : "soulSlash", e.x, e.y - 8, 124, 0.4);
    e.curse = Math.max(e.curse || 0, 1.7 + state.stats.shadow.curse * 0.45);
    if (state.stats.shadow.execute > 0 && e.hp / e.maxHp < 0.22 + state.stats.shadow.execute * 0.04) {
      damageEnemy(e, state.stats.damage * (0.9 + state.stats.shadow.execute * 0.2), 12, "影系處決");
      addEffect("soulSlash", e.x, e.y - 10, 140, 0.35);
    }
    if (state.stats.shadow.void > 0 && Math.random() < 0.09 + state.stats.shadow.void * 0.045) {
      addEffect("voidRift", e.x, e.y - 8, 165, 0.55);
      for (const other of state.enemies) {
        if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 120 + state.stats.shadow.void * 14) {
          const pull = norm(e.x - other.x, e.y - other.y);
          other.x += pull.x * 34;
          other.y += pull.y * 34;
          damageEnemy(other, state.stats.damage * 0.18, 2, "影系裂隙");
        }
      }
    }
  }
  if (element === "holy") {
    addEffect(state.stats.holy.smite > 0 ? "divineJudgment" : "goldenShield", e.x, e.y - 12, 120, 0.36);
    if (state.stats.holy.smite > 0) damageEnemy(e, state.stats.damage * (0.18 + state.stats.holy.smite * 0.08), 4, "聖系裁光");
    if (state.stats.holy.ward > 0 && Math.random() < 0.1 + state.stats.holy.ward * 0.04) {
      state.player.invuln = Math.max(state.player.invuln, 0.16 + state.stats.holy.ward * 0.03);
      addEffect("goldenShield", state.player.x, state.player.y - 32, 112, 0.45);
    }
  }
  if (element === "wind") {
    addEffect(state.stats.wind.cyclone > 0 ? "cycloneBlade" : "splittingGale", e.x, e.y - 8, 118 + state.stats.wind.cyclone * 10, 0.38);
    if (state.stats.wind.split > 0 && Math.random() < 0.18 + state.stats.wind.split * 0.06) {
      b.pierce += 1;
      e.slow = Math.max(e.slow || 0, 0.5);
      spawnPlayerBullet(e.x, e.y, b.angle - 0.32, state.stats.projectileSpeed * 0.82, state.stats.damage * 0.42, 0.58, 0, "wind", 6 * state.stats.area);
      spawnPlayerBullet(e.x, e.y, b.angle + 0.32, state.stats.projectileSpeed * 0.82, state.stats.damage * 0.42, 0.58, 0, "wind", 6 * state.stats.area);
    }
    if (state.stats.wind.cyclone > 0 && Math.random() < 0.08 + state.stats.wind.cyclone * 0.04) {
      for (const other of state.enemies) {
        if (Math.hypot(other.x - e.x, other.y - e.y) < 96 + state.stats.wind.cyclone * 15) {
          other.slow = Math.max(other.slow || 0, 0.7);
          damageEnemy(other, state.stats.damage * 0.13, 7, "風系旋流");
        }
      }
    }
  }
}

function killEnemy(e) {
  const i = state.enemies.indexOf(e);
  if (i < 0) return;
  state.enemies.splice(i, 1);
  if (e.kind === "bomber") explodeBomber(e);
  state.kills++;
  awardStrongEnemyLoot(e);
  if (state.kills === 1) showHint("souls");
  if (state.runType !== "garden") {
    const count = e.kind === "boss" ? 8 : e.kind === "brute" ? 4 : e.kind === "mage" ? 2 : 1;
    for (let n = 0; n < count; n++) {
      addPickup(e.x + rand(-12, 12), e.y + rand(-12, 12), e.xp / count);
    }
  } else {
    saveData.moonDust += e.kind === "boss" ? 9 : e.kind === "brute" ? 3 : e.kind === "mage" ? 2 : 1;
    if (e.kind === "boss") persistSave();
  }
  if (e.kind === "brute" || e.kind === "boss") triggerEquipmentVacuum();
  if (state.kills % 45 === 0) radialBurst();
  if (e.finalBoss) {
    state.finalBossActive = false;
    state.finalBossDefeated = true;
    state.message = "終局首領已擊破";
  }
}

function awardStrongEnemyLoot(e) {
  const rewardTable = {
    warden: { dust: 1, burst: "goldenShield", label: "護衛瓦解" },
    weaver: { dust: 2, burst: "voidRift", label: "召虺瓦解" },
    mirror_lantern: { dust: 1, burst: "divineJudgment", label: "鏡燈使破碎" },
    talisman_binder: { dust: 1, burst: "goldenShield", label: "縛符師解陣" },
    brute: { dust: 2, burst: "soulSlash", label: "巨怪倒下" },
    boss: e.finalBoss
      ? { dust: 28, burst: "divineJudgment", label: "終局首領討伐" }
      : { dust: 12, burst: "voidRift", label: "Boss 討伐" }
  };
  const reward = rewardTable[e.kind];
  if (!reward) return;
  state.runRewards.moonDust += reward.dust;
  if (e.kind === "boss") state.runRewards.bossKills++;
  else state.runRewards.eliteKills++;
  state.message = `${reward.label}：+${reward.dust} 月塵`;
  pushCombatMedal(e.kind === "boss" ? "boss" : "elite", reward.label, `+${reward.dust} 月塵與魂火爆發`, e.kind === "boss" ? "#d6a33f" : "#7edac2");
  state.shake = Math.max(state.shake, e.kind === "boss" ? 12 : 7);
  addEffect(reward.burst, e.x, e.y - 14, e.kind === "boss" ? 240 : 160, e.kind === "boss" ? 0.9 : 0.55);
  addEffect("thunderCrit", e.x, e.y - 20, e.kind === "boss" ? 210 : 135, 0.35);
  const xpBursts = e.kind === "boss" ? 12 : e.kind === "brute" ? 7 : 5;
  for (let n = 0; n < xpBursts; n++) {
    const a = (n / xpBursts) * TWO_PI;
    const radius = e.kind === "boss" ? rand(28, 82) : rand(18, 56);
    addPickup(e.x + Math.cos(a) * radius, e.y + Math.sin(a) * radius, e.kind === "boss" ? 3 : 1.5, 7);
  }
  state.damageText.push({
    x: e.x,
    y: e.y - 72,
    t: 0.9,
    text: `+${reward.dust}`,
    amount: reward.dust,
    enemyId: null
  });
  trimOldest(state.damageText, ENTITY_BUDGETS.damageText, "trimmedDamageText");
  if (e.kind === "boss" && !e.finalBoss) openBossReward(e);
}

function explodeBomber(e) {
  addEffect("fireBurst", e.x, e.y - 8, 150, 0.45);
  state.hazards.push({
    kind: "bomberBlast",
    x: e.x,
    y: e.y,
    r: 68,
    warn: 0.35,
    life: 1.25,
    damage: 11,
    tick: 0
  });
  for (const other of state.enemies) {
    if (Math.hypot(other.x - e.x, other.y - e.y) < 92) damageEnemy(other, state.stats.damage * 0.22, 10, "爆靈爆裂");
  }
}

function triggerEquipmentVacuum() {
  if (!state.stats.equipmentVacuum) return;
  for (const p of state.pickups) {
    p.x += (state.player.x - p.x) * 0.55;
    p.y += (state.player.y - p.y) * 0.55;
  }
}

function gainXp(amount) {
  if (state.runType === "garden") return;
  state.xp += amount;
  while (state.xp >= state.xpNeed) {
    state.xp -= state.xpNeed;
    state.level++;
    state.xpNeed = Math.floor(state.xpNeed * 1.28 + 12 + state.level * 2);
    sfx("level");
    openLevelUp();
  }
}

const baseUpgradePool = [
  { name: "符火加速", desc: "攻擊間隔 -12%", apply: () => state.stats.fireRate *= 0.88 },
  { name: "劍符增傷", desc: "傷害 +7", apply: () => state.stats.damage += 7 },
  { name: "疾行靴", desc: "移動速度 +12%", apply: () => state.stats.speed *= 1.12 },
  { name: "聚魂鈴", desc: "吸取範圍 +30", apply: () => state.stats.magnet += 30 },
  { name: "護命符", desc: "最大生命 +25", apply: () => { state.stats.maxHp += 25; } },
  { name: "旋刃", desc: "召喚一把環繞刀，再次升級會增加數量", apply: () => state.stats.blades += 1 },
  { name: "大符紙", desc: "武器尺寸 +16%", apply: () => state.stats.area *= 1.16 },
  { name: "穿透符", desc: "符咒穿透 +1", apply: () => state.stats.pierce += 1 },
  { name: "魂盾印", desc: "受擊後無敵時間 +0.12 秒", apply: () => state.stats.hurtGrace += 0.12 }
];

const elementUnlocks = [
  { name: "火系符脈", desc: "符咒附加燃燒，之後出現火系分支", apply: () => { state.stats.element = "fire"; state.stats.fire.burn += 1; } },
  { name: "水系符脈", desc: "符咒附加緩速，之後出現水系分支", apply: () => { state.stats.element = "water"; state.stats.water.slow += 1; } },
  { name: "雷系符脈", desc: "符咒可連鎖跳電，之後出現雷系分支", apply: () => { state.stats.element = "lightning"; state.stats.lightning.chain += 1; } },
  { name: "毒系符脈", desc: "符咒附加毒蝕，之後出現毒系分支", apply: () => { state.stats.element = "poison"; state.stats.poison.venom += 1; } },
  { name: "影系符脈", desc: "符咒附加詛咒，之後出現暗影分支", apply: () => { state.stats.element = "shadow"; state.stats.shadow.curse += 1; } },
  { name: "聖系符脈", desc: "符咒命中可短暫護身，之後出現聖光分支", apply: () => { state.stats.element = "holy"; state.stats.holy.ward += 1; } },
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
    { name: "聖印", desc: "命中時有機率短暫護身", apply: () => state.stats.holy.ward += 1 },
    { name: "金盾", desc: "提高最大生命與受擊容錯", apply: () => { state.stats.holy.shield += 1; state.stats.maxHp += 18; } },
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

function findUpgradeByName(name) {
  return [...elementUnlocks, ...baseUpgradePool, ...Object.values(elementBranches).flat()].find((option) => option.name === name);
}

function upgradeType(opt) {
  if (elementUnlocks.includes(opt) || Object.values(elementBranches).some((branch) => branch.includes(opt))) return "ACTIVE";
  if (opt.name.includes("旋刃") || opt.name.includes("符火")) return "ACTIVE";
  return "PASSIVE";
}

function upgradeFamily(opt) {
  for (const unlock of elementUnlocks) {
    if (unlock === opt) return elementNameFromName(opt.name);
  }
  for (const [key, branch] of Object.entries(elementBranches)) {
    if (branch.includes(opt)) return elementName(key);
  }
  if (opt.name.includes("旋刃") || opt.name.includes("劍") || opt.name.includes("穿透") || opt.name.includes("符紙")) return "Melee";
  if (opt.name.includes("聚魂") || opt.name.includes("疾行")) return "Utility";
  if (opt.name.includes("護命") || opt.name.includes("魂盾")) return "Survive";
  return "Talisman";
}

function upgradeKey(opt) {
  return `skill:${opt.name.trim()}`;
}

function upgradeSlotName(opt) {
  return opt.name;
}

function skillLevelForOption(opt) {
  return state.skillLevels[upgradeKey(opt)] || 0;
}

function upgradeIntent(opt) {
  const current = skillLevelForOption(opt);
  const next = Math.min(MAX_SKILL_LEVEL, current + 1);
  const type = upgradeType(opt);
  const active = type === "ACTIVE";
  if (current >= MAX_SKILL_LEVEL) return { label: "MAX", detail: "已滿級", color: "#6f8587", next };
  if (active && current === MAX_SKILL_LEVEL - 1 && EVOLUTIONS[opt.name]) {
    return { label: "EVOLVE", detail: `選後進化為 ${EVOLUTIONS[opt.name].name}`, color: "#d6a33f", next };
  }
  if (current > 0) return { label: "UPGRADE", detail: `Lv.${current} -> Lv.${next}`, color: "#6f9fe8", next };
  if (active) return { label: "NEW", detail: "新增主動技能", color: "#bb4f45", next };
  return { label: "PASSIVE", detail: "被動強化，不佔技能槽", color: "#4b8ca4", next };
}

function optionSummary(opt) {
  const intent = upgradeIntent(opt);
  return {
    name: opt.name,
    level: skillLevelForOption(opt),
    nextLevel: intent.next,
    type: upgradeType(opt),
    family: upgradeFamily(opt),
    intent: intent.label,
    detail: intent.detail,
    slotHint: upgradeSlotHint(opt),
    impact: upgradeBuildImpact(opt),
    decision: upgradeDecisionSummary(opt)
  };
}

function upgradeRecommendationScore(opt) {
  const intent = upgradeIntent(opt);
  const type = upgradeType(opt);
  const family = upgradeFamily(opt);
  let score = 0;
  if (intent.label === "EVOLVE") score += 120;
  if (intent.label === "UPGRADE") score += 72 + intent.next * 4;
  if (intent.label === "NEW") score += state.pickedUpgrades.length < 2 ? 58 : 36;
  if (intent.label === "PASSIVE") score += state.passiveUpgrades.length < 2 ? 48 : 30;
  if (!state.stats.element && type === "ACTIVE" && family.includes("系")) score += 34;
  if (state.stats.element && family === elementName(state.stats.element)) score += 22;
  if (state.player && state.player.hp / Math.max(1, state.stats.maxHp) < 0.38 && (opt.name.includes("護") || opt.name.includes("盾") || opt.name.includes("生命"))) score += 32;
  if (state.pickedUpgrades.length >= MAX_ACTIVE_SKILLS && intent.label === "NEW") score -= 120;
  return score;
}

function levelChoiceSummary() {
  const options = state.options.map((opt, index) => ({
    ...optionSummary(opt),
    index,
    score: upgradeRecommendationScore(opt)
  }));
  const recommended = options.slice().sort((a, b) => b.score - a.score || a.index - b.index)[0] || null;
  let headline = "先建立核心輸出";
  let body = "選一個主動技能開始成形，再用同名技能升級。";
  if (recommended) {
    if (recommended.intent === "EVOLVE") {
      headline = "優先進化";
      body = `${recommended.name} 選下去會完成進化，強度提升最明顯。`;
    } else if (recommended.intent === "UPGRADE") {
      headline = "強化核心";
      body = `${recommended.name} 會升到 Lv.${recommended.nextLevel}，不佔新主動槽。`;
    } else if (recommended.intent === "NEW") {
      headline = "補主動角度";
      body = `${recommended.name} 會佔 1 格主動槽，讓清怪方向更完整。`;
    } else if (recommended.intent === "PASSIVE") {
      headline = "補被動底盤";
      body = `${recommended.name} 不佔主動槽，適合補資源、生存或基礎傷害。`;
    }
  }
  return {
    level: state.level,
    element: state.stats?.element || null,
    elementName: elementName(state.stats?.element),
    activeSlots: activeSkillsForView().length,
    maxActiveSlots: MAX_ACTIVE_SKILLS,
    passiveCount: passiveSkillsForView().length,
    recommended,
    headline,
    body,
    options
  };
}

function activeSkillFreeSlots() {
  normalizePickedUpgrades();
  return Math.max(0, MAX_ACTIVE_SKILLS - state.pickedUpgrades.length);
}

function upgradeSlotHint(opt) {
  const type = upgradeType(opt);
  const current = skillLevelForOption(opt);
  if (type !== "ACTIVE") return `被動紀錄：目前 ${state.passiveUpgrades.length} 項`;
  if (current > 0) return `升級既有技能，不佔新槽`;
  const free = activeSkillFreeSlots();
  if (free > 0) return `會佔用 1 格主動槽，剩餘 ${free - 1}/${MAX_ACTIVE_SKILLS}`;
  return "主動槽已滿：不會再加入新主動技能";
}

function upgradeBuildImpact(opt) {
  const type = upgradeType(opt);
  const family = upgradeFamily(opt);
  const current = skillLevelForOption(opt);
  if (type !== "ACTIVE") return "被動成長；不佔主動槽。";
  if (current > 0) return "既有技能升級；不佔新槽。";
  if (family.includes("火")) return "火系：燃燒與爆發。";
  if (family.includes("水")) return "水系：緩速與控場。";
  if (family.includes("雷")) return "雷系：連鎖與會心。";
  if (family.includes("毒")) return "毒系：持續削弱。";
  if (family.includes("影")) return "影系：詛咒與斬殺。";
  if (family.includes("聖")) return "聖系：護身與容錯。";
  if (family.includes("風")) return "風系：機動與旋風。";
  return "新增主動；佔 1 格技能槽。";
}

function elementKeyFromFamily(family = "") {
  if (family.includes("火")) return "fire";
  if (family.includes("水")) return "water";
  if (family.includes("雷")) return "lightning";
  if (family.includes("毒")) return "poison";
  if (family.includes("影")) return "shadow";
  if (family.includes("聖")) return "holy";
  if (family.includes("風")) return "wind";
  return null;
}

function upgradeDecisionSummary(opt) {
  const intent = upgradeIntent(opt);
  const type = upgradeType(opt);
  const family = upgradeFamily(opt);
  const current = skillLevelForOption(opt);
  if (intent.label === "EVOLVE") {
    return {
      title: "進化時機",
      body: `${opt.name} 會進化成 ${EVOLUTIONS[opt.name]?.name || "最終形態"}，直接強化核心玩法。`,
      tone: "#d6a33f"
    };
  }
  if (current > 0) {
    return {
      title: "強化既有技能",
      body: `從 Lv.${current} 升到 Lv.${intent.next}，不佔新的主動技能槽。`,
      tone: "#6f9fe8"
    };
  }
  if (type === "PASSIVE") {
    return {
      title: "被動補強",
      body: "不佔主動槽，適合補足生存、資源或基礎傷害。",
      tone: "#4b8ca4"
    };
  }
  if (state.pickedUpgrades.length >= MAX_ACTIVE_SKILLS) {
    return {
      title: "主動槽已滿",
      body: "優先選既有技能或被動會更穩，避免浪費新主動。",
      tone: "#ffb4a8"
    };
  }
  return {
    title: "開新流派",
    body: `${family} 會佔 1 格主動槽，決定這局接下來的分支方向。`,
    tone: elementColor(elementKeyFromFamily(family)) || "#bb4f45"
  };
}

function upgradeLevelPreview(opt) {
  const current = skillLevelForOption(opt);
  const next = Math.min(MAX_SKILL_LEVEL, current + 1);
  return current > 0 ? `Lv.${current} -> Lv.${next}` : `NEW -> Lv.${next}`;
}

function bossRewardDecision(reward) {
  if (!reward) return null;
  const map = {
    sigil_damage: ["爆發輸出", "適合已有清怪手段時補 Boss / 精英傷害。"],
    sigil_haste: ["攻擊節奏", "適合任何符咒 build，讓命中、連鎖與觸發更頻繁。"],
    sigil_guard: ["容錯防守", "不回血但提高血量上限，適合低血或高壓局。"],
    sigil_magnet: ["資源循環", "適合想更快升級與撿魂火，但不能替代走位。"],
    sigil_area: ["範圍擴張", "適合旋刃、元素爆發和控場 build。"],
    sigil_pierce: ["直線穿透", "適合怪潮成排時，讓符咒多打幾個目標。"]
  };
  const [title, body] = map[reward.id] || ["本局強化", "不佔主動技能槽，選完立即套用。"];
  return { title, body, tone: "#d6a33f" };
}

function bossRewardSummary(opt) {
  return opt ? { id: opt.id, name: opt.name, family: opt.family, desc: opt.desc, decision: bossRewardDecision(opt) } : null;
}

function openBossReward(enemy) {
  if (state.mode !== "playing" || !state.player) return;
  state.bossRewardOptions = [...BOSS_REWARD_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  state.bossRewardSource = { kind: enemy.kind, x: Math.round(enemy.x), y: Math.round(enemy.y) };
  state.mode = "bossReward";
  state.message = "Boss 戰利品：選擇一個本局強化";
}

function chooseBossReward(index) {
  const reward = state.bossRewardOptions[index];
  if (!reward || !state.player || !state.stats) return;
  reward.apply();
  state.bossBoons.push(bossRewardSummary(reward));
  state.bossRewardOptions = [];
  state.bossRewardSource = null;
  state.mode = "playing";
  state.message = `${reward.name} 已套用本局`;
  state.shake = Math.max(state.shake, 5);
  addEffect("goldenShield", state.player.x, state.player.y - 30, 132, 0.48);
  sfx("level");
  draw();
}

function setUpgradeOptions(candidates) {
  const seen = new Set();
  state.options = [];
  for (const opt of candidates) {
    if (!opt || !canOfferUpgrade(opt)) continue;
    const key = upgradeKey(opt);
    if (seen.has(key)) continue;
    seen.add(key);
    state.options.push(opt);
    if (state.options.length >= 3) break;
  }
}

function normalizePickedUpgrades() {
  const merged = new Map();
  for (const item of state.pickedUpgrades) {
    const key = item.key || `skill:${item.name}`;
    const existing = merged.get(key);
    if (existing) {
      existing.level = Math.max(existing.level, item.level || 1);
    } else {
      merged.set(key, { ...item, key, level: item.level || 1 });
    }
  }
  state.pickedUpgrades = [...merged.values()];
}

function normalizePassiveUpgrades() {
  const merged = new Map();
  for (const item of state.passiveUpgrades) {
    const key = item.key || `skill:${item.name}`;
    const existing = merged.get(key);
    if (existing) {
      existing.level = Math.max(existing.level, item.level || 1);
    } else {
      merged.set(key, { ...item, key, level: item.level || 1 });
    }
  }
  state.passiveUpgrades = [...merged.values()];
}

function canOfferUpgrade(opt) {
  if (skillLevelForOption(opt) >= MAX_SKILL_LEVEL) return false;
  if (upgradeType(opt) !== "ACTIVE") return true;
  normalizePickedUpgrades();
  const key = upgradeKey(opt);
  return state.pickedUpgrades.some((item) => item.key === key) || state.pickedUpgrades.length < MAX_ACTIVE_SKILLS;
}

function elementNameFromName(name) {
  if (name.includes("火")) return "火系";
  if (name.includes("水")) return "水系";
  if (name.includes("雷")) return "雷系";
  if (name.includes("毒")) return "毒系";
  if (name.includes("影")) return "影系";
  if (name.includes("聖")) return "聖系";
  if (name.includes("風")) return "風系";
  return "通用";
}

function openLevelUp() {
  state.mode = "level";
  state.options = [];
  normalizePickedUpgrades();
  normalizePassiveUpgrades();
  const availableBase = baseUpgradePool.filter(canOfferUpgrade);
  const baseBag = [...availableBase].sort(() => Math.random() - 0.5);
  const existingActive = state.pickedUpgrades
    .map((item) => findUpgradeByName(item.name))
    .filter((opt) => opt && canOfferUpgrade(opt))
    .sort((a, b) => skillLevelForOption(b) - skillLevelForOption(a));
  if (!state.stats.element && state.level >= 2) {
    const elementBag = elementUnlocks.filter(canOfferUpgrade).sort(() => Math.random() - 0.5);
    setUpgradeOptions([existingActive[0], elementBag[0], elementBag[1], baseBag[0], baseBag[1]]);
    return;
  }
  if (state.stats.element) {
    const branchBag = elementBranches[state.stats.element].filter(canOfferUpgrade).sort(() => Math.random() - 0.5);
    setUpgradeOptions([existingActive[0], branchBag[0], baseBag[0], branchBag[1], baseBag[1]]);
    return;
  }
  setUpgradeOptions([existingActive[0], ...baseBag]);
}

function chooseUpgrade(i) {
  const opt = state.options[i];
  if (!opt) return;
  if (!canOfferUpgrade(opt)) {
    state.message = "主動技能槽已滿";
    state.options = [];
    closePause();
    return;
  }
  const key = upgradeKey(opt);
  const nextLevel = Math.min(MAX_SKILL_LEVEL, (state.skillLevels[key] || 0) + 1);
  state.skillLevels[key] = nextLevel;
  normalizePickedUpgrades();
  normalizePassiveUpgrades();
  const targetList = upgradeType(opt) === "ACTIVE" ? state.pickedUpgrades : state.passiveUpgrades;
  const existing = targetList.find((item) => item.key === key);
  if (existing) {
    existing.level = nextLevel;
    existing.desc = opt.desc;
  } else {
    targetList.push({
      key,
      name: upgradeSlotName(opt),
      desc: opt.desc,
      family: upgradeFamily(opt),
      type: upgradeType(opt),
      level: nextLevel
    });
  }
  opt.apply();
  if (state.tutorialProgress) state.tutorialProgress.upgrades += 1;
  const evolved = maybeEvolveSkill(opt, nextLevel);
  state.options = [];
  state.mode = "playing";
  if (!evolved) state.message = `${upgradeSlotName(opt)} Lv.${nextLevel}`;
  showHint("level");
}

function maybeEvolveSkill(opt, level) {
  if (level < MAX_SKILL_LEVEL) return false;
  const evo = EVOLUTIONS[opt.name];
  if (!evo || state.evolvedSkills.some((item) => item.name === evo.name)) return false;
  evo.apply();
  state.evolvedSkills.push({ name: evo.name, from: opt.name, desc: evo.desc });
  state.message = `${evo.name} 進化完成`;
  state.shake = 8;
  sfx("level");
  return true;
}

function showHint(id, force = false) {
  if (!settingEnabled("hints")) return;
  const hint = TUTORIAL_HINTS[id];
  if (!hint) return;
  if (!force && state.seenHints[id]) return;
  state.seenHints[id] = true;
  state.tutorialHint = {
    id,
    title: hint.title,
    body: hint.body,
    t: hint.duration,
    maxT: hint.duration
  };
}

function updateTutorialHint(dt) {
  if (!state.tutorialHint) return;
  state.tutorialHint.t -= dt;
  if (state.tutorialHint.t <= 0) state.tutorialHint = null;
}

function showMilestoneBanner(kind, title, subtitle, duration = 2.6) {
  const colors = {
    phase: "#7edac2",
    bossWarning: "#ffe18a",
    boss: "#d946ef",
    final: "#ffe18a",
    clear: "#7edac2"
  };
  state.milestoneBanner = {
    kind,
    title,
    subtitle,
    t: duration,
    maxT: duration,
    color: colors[kind] || "#7edac2"
  };
}

function updateMilestoneBanner(dt) {
  if (!state.milestoneBanner) return;
  state.milestoneBanner.t -= dt;
  if (state.milestoneBanner.t <= 0) state.milestoneBanner = null;
}

function currentStagePhase() {
  return STAGE_PHASES[state.phaseIndex] || STAGE_PHASES[0];
}

function updateStagePhase() {
  if (!state.player || state.targetKills <= 0) return;
  const progress = clamp(state.kills / state.targetKills, 0, 1);
  let nextIndex = state.phaseIndex;
  for (let i = 0; i < STAGE_PHASES.length; i++) {
    if (progress >= STAGE_PHASES[i].threshold) nextIndex = i;
  }
  if (nextIndex <= state.phaseIndex) return;
  state.phaseIndex = nextIndex;
  const phase = currentStagePhase();
  state.message = phase.message;
  state.phaseNoticeT = 4.6;
  pushCombatMedal("phase", `${phase.name}階段`, phase.objective, "#7edac2");
  showMilestoneBanner("phase", `${phase.name} ${state.phaseIndex + 1}/${STAGE_PHASES.length}`, phase.objective, 3.1);
  state.shake = Math.max(state.shake, 6);
  if (phase.id !== "opening") showHint(phase.id);
  for (const kind of phase.spawn) {
    const enemy = spawnEnemy(kind);
    if (!enemy) continue;
    const a = Math.random() * TWO_PI;
    enemy.x = clamp(state.player.x + Math.cos(a) * rand(230, 390), 40, WORLD_W - 40);
    enemy.y = clamp(state.player.y + Math.sin(a) * rand(190, 330), 40, WORLD_H - 40);
  }
  triggerCombatEvent(phase.id === "warded" ? "elitePressure" : phase.id === "rupture" ? "sealField" : "spiritRush");
  state.message = phase.message;
}

function update(dt) {
  if (state.mode !== "playing") return;
  state.hurtFlash = Math.max(0, state.hurtFlash - dt * 0.9);
  if (state.freeze > 0) {
    state.freeze -= dt;
    return;
  }
  state.time += dt;
  state.shake = Math.max(0, state.shake - dt * 18);
  if (state.lastHit) {
    state.lastHit.t = Math.max(0, state.lastHit.t - dt);
    if (state.lastHit.t <= 0) state.lastHit = null;
  }
  state.phaseNoticeT = Math.max(0, state.phaseNoticeT - dt);
  updateTutorialHint(dt);
  updateMilestoneBanner(dt);
  updateCombatMedals(dt);
  state.stats.bloodFrenzy = Math.max(0, state.stats.bloodFrenzy - dt);
  updatePlayer(dt);
  updateCompanion(dt);
  updateStagePhase();
  updateCombatDirector(dt);
  updateSpawns(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updatePickups(dt);
  updateHazards(dt);
  updateEffects(dt);
  updateRunChallengeFeedback(dt);
  enforceEntityBudgets();
  updateCamera(dt);
  if (state.player.hp <= 0) {
    state.mode = "dead";
    finalizeRun();
  }
  if (state.kills >= state.targetKills && state.mode === "playing" && !state.finalBossActive && !state.finalBossDefeated) {
    spawnFinalBoss();
  }
  if (state.finalBossDefeated && state.mode === "playing") completeRun();
}

function completeRun() {
  state.cleared = true;
  state.mode = "result";
  state.message = "任務完成";
  showMilestoneBanner("clear", "任務完成", "記憶已穩定，回到結算查看獎勵", 3.2);
  finalizeRun();
  sfx("clear");
}

function enforceEntityBudgets() {
  trimOldest(state.enemyBullets, ENTITY_BUDGETS.enemyBullets);
  trimOldest(state.hazards, ENTITY_BUDGETS.hazards);
  trimOldest(state.pickups, ENTITY_BUDGETS.pickups, "trimmedPickups");
  trimOldest(state.effects, ENTITY_BUDGETS.effects, "trimmedEffects");
  trimOldest(state.damageText, ENTITY_BUDGETS.damageText, "trimmedDamageText");
  const nonBossCount = state.enemies.filter((enemy) => enemy.kind !== "boss").length;
  if (nonBossCount <= ENTITY_BUDGETS.enemies || !state.player) return;
  const removeCount = nonBossCount - ENTITY_BUDGETS.enemies;
  const removable = state.enemies
    .filter((enemy) => enemy.kind !== "boss")
    .map((enemy) => ({ enemy, d: dist(enemy, state.player) }))
    .sort((a, b) => b.d - a.d)
    .slice(0, removeCount)
    .map((item) => item.enemy);
  for (const enemy of removable) {
    const index = state.enemies.indexOf(enemy);
    if (index >= 0) {
      state.enemies.splice(index, 1);
      state.perfStats.trimmedEnemies++;
    }
  }
}

function finalizeRun() {
  if (state.finalized) return;
  state.finalized = true;
  const summary = {
    runType: state.runType,
    cleared: state.cleared,
    time: Math.round(state.time),
    kills: state.kills,
    level: state.level,
    bossNodes: [...state.spawnedBossNodes],
    phaseReached: currentStagePhase().name,
    finalBossDefeated: state.finalBossDefeated,
    moonDust: 0,
    fragment: null,
    score: 0,
    bestGarden: saveData.bestGarden || 0,
    activeSkills: state.pickedUpgrades.map((skill) => ({ ...skill })),
    passiveSkills: state.passiveUpgrades.map((skill) => ({ ...skill })),
    evolvedSkills: state.evolvedSkills.map((skill) => ({ ...skill })),
    bossBoons: state.bossBoons.map((boon) => ({ ...boon })),
    eventChoices: state.eventChoicesTaken.map((choice) => ({ ...choice })),
    damageSources: damageSourceSummary(6),
    runChallenge: runChallengeSummary()
  };
  const challengeBonus = summary.runChallenge?.done ? summary.runChallenge.reward : 0;
  state.challengeBonus = challengeBonus;
  summary.runRewards = { ...state.runRewards };
  saveData.runsPlayed += 1;
  saveData.lifetimeKills += state.kills;
  if (state.cleared) saveData.clears += 1;
  if (state.runType === "garden") {
    const score = gardenScore();
    const dust = Math.max(10, Math.floor(score / 180));
    saveData.bestGarden = Math.max(saveData.bestGarden || 0, score);
    saveData.playerLevel = Math.max(saveData.playerLevel || 1, 1 + Math.floor((saveData.bestGarden || 0) / 4500));
    saveData.moonDust += dust + state.runRewards.moonDust + challengeBonus;
    summary.score = score;
    summary.bestGarden = saveData.bestGarden || 0;
    summary.moonDust = dust + state.runRewards.moonDust + challengeBonus;
    summary.storyProgress = storyProgressSummary();
    state.lastRunSummary = summary;
    persistSave();
    return;
  }
  const dust = Math.floor(state.kills / 4) + (state.cleared ? 45 : 0) + state.runRewards.moonDust + challengeBonus;
  saveData.moonDust += dust;
  summary.moonDust = dust;
  if (state.level < 2 && state.kills < 20) {
    summary.storyProgress = storyProgressSummary();
    state.lastRunSummary = summary;
    persistSave();
    return;
  }
  const fragment = createMemoryFragment();
  saveData.memoryFragments.unshift(fragment);
  saveData.memoryFragments = saveData.memoryFragments.slice(0, 8);
  saveData.selectedFragmentId = fragment.id;
  state.selectedFragmentId = fragment.id;
  saveData.playerLevel = Math.max(saveData.playerLevel || 1, 1 + Math.floor(saveData.memoryFragments.length / 2));
  summary.fragment = fragment;
  summary.storyProgress = storyProgressSummary();
  state.lastRunSummary = summary;
  persistSave();
}

function gardenScore() {
  return Math.round(state.kills * 45 + state.time * 18 + state.spawnedBossNodes.length * 900 + state.level * 80);
}

function createMemoryFragment() {
  normalizePickedUpgrades();
  normalizePassiveUpgrades();
  const power = Math.round(state.level * 18 + state.kills * 1.5 + state.spawnedBossNodes.length * 40 + state.evolvedSkills.length * 60);
  const primary = state.stats.element ? elementName(state.stats.element) : "未定流派";
  return {
    id: `mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: `${primary}記憶 Lv.${state.level}`,
    createdAt: Date.now(),
    level: state.level,
    kills: state.kills,
    time: Math.round(state.time),
    power,
    equipment: selectedEquipment().name,
    activeSkills: state.pickedUpgrades.map((skill) => ({ ...skill })),
    passiveSkills: state.passiveUpgrades.map((skill) => ({ ...skill })),
    evolvedSkills: state.evolvedSkills.map((skill) => ({ ...skill }))
  };
}

function updatePlayer(dt) {
  const p = state.player;
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const up = keys.has("w") || keys.has("arrowup");
  const down = keys.has("s") || keys.has("arrowdown");
  const keyX = (right ? 1 : 0) - (left ? 1 : 0);
  const keyY = (down ? 1 : 0) - (up ? 1 : 0);
  const touchX = touchControl.active ? touchControl.dx : 0;
  const touchY = touchControl.active ? touchControl.dy : 0;
  const rawX = keyX || touchX;
  const rawY = keyY || touchY;
  const moving = Math.hypot(rawX, rawY) > 0.08;
  const dir = moving ? norm(rawX, rawY) : { x: 0, y: 0 };
  p.slowT = Math.max(0, (p.slowT || 0) - dt);
  const slowFactor = p.slowT > 0 ? 0.58 : 1;
  p.vx = dir.x * state.stats.speed * slowFactor;
  p.vy = dir.y * state.stats.speed * slowFactor;
  const oldX = p.x;
  const oldY = p.y;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  if (Math.abs(dir.x) > 0.05) p.facing = dir.x < 0 ? -1 : 1;
  const wantsDash = pressed.has("shift") || pressed.has(" ") || touchControl.dashQueued;
  if (wantsDash && p.dashT <= 0) {
    const dashX = moving ? dir.x : p.facing;
    const dashY = moving ? dir.y : 0;
    p.x += dashX * 145;
    p.y += dashY * 145;
    p.invuln = 0.35;
    p.dashT = state.stats.dashCooldown;
    p.dashAnimT = HERO_ANIM.dash;
    state.shake = 3;
  }
  touchControl.dashQueued = false;
  touchControl.lastDashT = Math.max(0, touchControl.lastDashT - dt);
  p.x = clamp(p.x, 30, WORLD_W - 30);
  p.y = clamp(p.y, 30, WORLD_H - 30);
  if (state.tutorialProgress) state.tutorialProgress.moved += Math.hypot(p.x - oldX, p.y - oldY);
  p.invuln = Math.max(0, p.invuln - dt);
  p.dashT = Math.max(0, p.dashT - dt);
  p.attackT = Math.max(0, (p.attackT || 0) - dt);
  p.dashAnimT = Math.max(0, (p.dashAnimT || 0) - dt);
  p.hurtT = Math.max(0, (p.hurtT || 0) - dt);
  p.hp = Math.min(state.stats.maxHp, p.hp);
  p.shootT -= dt;
  if (p.shootT <= 0) {
    fireAtNearest();
    p.attackT = HERO_ANIM.attack;
    p.shootT = state.stats.fireRate * (state.stats.bloodFrenzy > 0 ? 0.72 : 1);
  }
  p.anim += dt * (moving ? 12 : 6);
  updateOrbitBlades(dt);
}

function updateCompanion(dt) {
  const c = state.companion;
  const p = state.player;
  if (!c || !p) return;
  const summon = selectedSummon();
  const targetX = p.x + Math.cos(state.time * 2.2) * 54;
  const targetY = p.y - 54 + Math.sin(state.time * 2.6) * 18;
  c.x += (targetX - c.x) * Math.min(1, dt * 8);
  c.y += (targetY - c.y) * Math.min(1, dt * 8);
  c.cooldown -= dt;
  c.pulse = Math.max(0, c.pulse - dt * 2.6);
  c.action = "idle";

  if (summon.id === "moon_cat") {
    let pulled = 0;
    for (const pickup of state.pickups) {
      const d = Math.hypot(pickup.x - c.x, pickup.y - c.y);
      if (d < 210 && d > 4) {
        pickup.x += (c.x - pickup.x) * dt * 1.9;
        pickup.y += (c.y - pickup.y) * dt * 1.9;
        pulled++;
      }
    }
    if (pulled > 0) {
      c.action = "pull";
      c.pulse = Math.max(c.pulse, 0.25);
    }
    return;
  }

  if (c.cooldown > 0) return;
  if (summon.id === "paper_imp") {
    const target = nearestEnemy(560);
    if (target) {
      const angle = Math.atan2(target.y - c.y, target.x - c.x);
      spawnPlayerBullet(c.x, c.y, angle, 620, state.stats.damage * 0.55, 0.62, 0, state.stats.element || "shadow", 6 * state.stats.area);
      c.cooldown = 1.25;
      c.pulse = 1;
      c.action = "shot";
      addEffect("soulSlash", c.x, c.y, 82, 0.28, angle, 0.7);
    }
    return;
  }

  if (summon.id === "bell_spirit") {
    state.player.shootT = Math.min(state.player.shootT, state.stats.fireRate * 0.45);
    addEffect("goldenShield", c.x, c.y, 96, 0.36, 0, 0.65);
    c.cooldown = 3.8;
    c.pulse = 1;
    c.action = "tempo";
    return;
  }

  if (summon.id === "shadow_moth") {
    let affected = 0;
    for (const enemy of state.enemies) {
      if (Math.hypot(enemy.x - c.x, enemy.y - c.y) < 150) {
        enemy.slow = Math.max(enemy.slow || 0, 1.0);
        enemy.curse = Math.max(enemy.curse || 0, 0.9);
        damageEnemy(enemy, state.stats.damage * 0.12, 2, selectedSummon().name);
        affected++;
      }
    }
    if (affected > 0) {
      addEffect("voidRift", c.x, c.y, 110, 0.34, 0, 0.55);
      c.pulse = 1;
      c.action = "hex";
    }
    c.cooldown = 1.8;
  }
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
        damageEnemy(e, state.stats.bladeDamage * dt * 4, 5, "旋刃");
      }
    }
  }
}

function updateCombatDirector(dt) {
  if (state.time < 10) return;
  state.eventT -= dt;
  if (state.eventT > 0) return;
  openEventChoice("combatDirector");
}

function eventChoiceDecision(option) {
  if (!option) return null;
  if (option.source === "story") {
    const focus = state.storyFocus || storyRunFocus();
    const map = {
      first_memory: ["主線推進", "用魂火雨加速第一枚記憶形成，但會追加疾影壓力。", "風險：疾影貼身"],
      first_clear: ["終局準備", "用一波急襲換輸出與穿透，幫助後續 Boss/終局戰。", "風險：怨靈急襲"],
      hunter: ["擊殺推進", "用更密集怪潮換擊殺進度與月塵，適合清群能力成形時選。", "風險：怪潮變厚"],
      companion: ["締約資金", "用精英壓迫換更多月塵，幫助回大廳解鎖伙伴。", "風險：護衛與巨怪"],
      garden: ["庭園續戰", "清除彈幕並取得短暫保護，適合月庭高分續戰。", "風險：輸出收益較小"]
    };
    const [title, body, risk] = map[focus.id] || map.first_memory;
    return { title, body, risk, tone: focus.color || "#ffe18a" };
  }
  const map = {
    soulRain: ["高收益高壓", "大量魂火換一波疾影，適合有閃避空間時選。", "風險：追加疾影"],
    spiritRush: ["壓力換傷害", "撐過怨靈急襲後提高傷害，適合輸出不足時選。", "風險：怪潮急襲"],
    sealField: ["救場控場", "清除敵彈並給短暫無敵，適合危險或彈幕多時選。", "風險：收益較低"],
    elitePressure: ["月塵懸賞", "立刻拿月塵並叫出精英，適合血量健康時賭收益。", "風險：精英壓迫"],
    focus: ["穩定成長", "不追加怪潮，只提高攻擊節奏，適合保守續航。", "風險：短期收益小"]
  };
  const [title, body, risk] = map[option.event] || ["事件抉擇", "選完立即觸發事件效果。", "風險：未知"];
  return { title, body, risk, tone: option.event === "focus" || option.event === "sealField" ? "#7edac2" : "#d6a33f" };
}

function eventChoiceSummary(option) {
  return option ? {
    id: option.id,
    name: option.name,
    type: option.type,
    event: option.event,
    desc: option.desc,
    source: option.source || "generic",
    storyId: option.storyId || null,
    storyTitle: option.storyTitle || null,
    decision: eventChoiceDecision(option)
  } : null;
}

function openEventChoice(source = "event") {
  if (state.mode !== "playing" || !state.player) return;
  const storyOption = storyEventChoice();
  const generic = [...EVENT_CHOICE_POOL]
    .filter((option) => option.event !== storyOption.event || option.id !== storyOption.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  state.eventChoiceOptions = [storyOption, ...generic];
  state.eventChoiceSource = {
    source,
    time: Math.round(state.time),
    phase: currentStagePhase().name,
    storyFocus: state.storyFocus ? { id: state.storyFocus.id, title: state.storyFocus.title } : null
  };
  state.mode = "eventChoice";
  state.message = "異變抉擇：選擇一個事件";
}

function chooseEventChoice(index) {
  const option = state.eventChoiceOptions[index];
  if (!option || !state.player || !state.stats) return;
  option.apply();
  state.eventChoicesTaken.push(eventChoiceSummary(option));
  state.eventChoiceOptions = [];
  state.eventChoiceSource = null;
  state.mode = "playing";
  state.eventT = rand(24, 36) * (state.runType === "garden" ? 0.75 : 1);
  state.shake = Math.max(state.shake, 4);
  sfx("level");
  draw();
}

function triggerCombatEvent(event) {
  state.currentEvent = { id: event, t: 4.5 };
  if (event === "soulRain") {
    state.message = "魂火雨：附近掉落大量魂火";
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * TWO_PI;
      const r = rand(90, 260);
      addPickup(clamp(state.player.x + Math.cos(a) * r, 40, WORLD_W - 40), clamp(state.player.y + Math.sin(a) * r, 40, WORLD_H - 40), 5 + state.level);
    }
    addEffect("meteorSeal", state.player.x, state.player.y - 20, 260, 0.65);
    sfx("level");
    return;
  }
  if (event === "spiritRush") {
    state.message = "怨靈急襲：左右兩側湧出怪潮";
    for (let i = 0; i < 12; i++) spawnEnemy(i % 5 === 0 ? "mage" : i % 3 === 0 ? "skitter" : "ghoul");
    state.shake = 6;
    return;
  }
  if (event === "sealField") {
    state.message = "封印圈：離開紫圈，避免被咒力灼傷";
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TWO_PI + Math.random() * 0.6;
      state.hazards.push({
        kind: "seal",
        x: clamp(state.player.x + Math.cos(a) * rand(120, 250), 80, WORLD_W - 80),
        y: clamp(state.player.y + Math.sin(a) * rand(90, 210), 80, WORLD_H - 80),
        r: 74,
        warn: 1.1,
        life: 5.2,
        damage: 9,
        tick: 0
      });
    }
    return;
  }
  if (event === "elitePressure") {
    state.message = "精英壓迫：強敵靠近，擊破可拉近魂火";
    spawnEnemy("brute");
    spawnEnemy("warden");
    spawnEnemy("mage");
    state.shake = 5;
  }
}

function updateSpawns(dt) {
  const missionCfg = resolveMissionPreset(state.mission);
  const spawnCfg = state.spawnConfig || missionCfg.spawn;
  const pressure = Math.min(1, state.time / 280);
  const phase = currentStagePhase();
  state.spawnT -= dt;
  state.mageT -= dt;
  state.eliteT -= dt;
  if (state.spawnT <= 0) {
    const pack = Math.max(1, spawnCfg.wavePack(state.time));
    for (let i = 0; i < pack; i++) {
      const mix = Math.random();
      if (phase.id === "warded" && mix < 0.13) spawnEnemy("warden");
      else if ((phase.id === "rupture" || phase.id === "warded") && mix < 0.27) spawnEnemy("bomber");
      else if ((phase.id === "ambush" || phase.id === "rupture" || phase.id === "warded") && mix < 0.42) spawnEnemy("skitter");
      else if (state.time > 120 && mix < 0.12) spawnEnemy("bomber");
      else if (state.time > 55 && mix < 0.24) spawnEnemy("skitter");
      else spawnEnemy("ghoul");
    }
    const spread = state.time / 85;
    const bonusMage = Math.min(0.22, spread > 1.4 ? 0.1 : 0);
    const bonusBrute = Math.min(0.18, spread / 22);
    const bonusWarden = state.time > 95 ? Math.min(0.12, spread / 26) : 0;
    const roll = Math.random();
    if (roll < bonusWarden) spawnEnemy("warden");
    else if (roll < bonusWarden + bonusBrute) spawnEnemy("brute");
    else if (roll < bonusWarden + bonusBrute + bonusMage) spawnEnemy("mage");
    state.spawnT = Math.max(spawnCfg.min, spawnCfg.base - spawnCfg.timeScale * pressure * 6.2);
  }
  if (state.mageT <= 0) {
    spawnEnemy("mage");
    state.mageT = Math.max(1.6, missionCfg.mage.base - pressure * missionCfg.mage.timeScale);
  }
  if (state.eliteT <= 0) {
    spawnEnemy(state.time > 145 ? "warden" : state.time > 85 ? "brute" : "bomber");
    state.eliteT = Math.max(8.5, missionCfg.elite.base - pressure * missionCfg.elite.timeScale);
  }
  updateBossNodes();
}

function updateBossNodes() {
  for (const node of BOSS_NODES) {
    if (node <= state.targetKills && state.kills >= node - 6 && state.kills < node && !state.warnedBossNodes.includes(node)) {
      state.warnedBossNodes.push(node);
      state.message = `Boss 預警：再 ${node - state.kills} 擊殺，月庭魑魅將現身`;
      state.phaseNoticeT = Math.max(state.phaseNoticeT, 3.4);
      showMilestoneBanner("bossWarning", "Boss 預警", `再 ${node - state.kills} 擊殺，保留閃避並清出安全距離`, 2.8);
      state.shake = Math.max(state.shake, 4);
      showHint("boss");
    }
    if (state.kills >= node && !state.spawnedBossNodes.includes(node)) {
      state.spawnedBossNodes.push(node);
      spawnEnemy("boss");
      state.message = `Boss 節點 ${node}：月庭魑魅現身`;
      state.phaseNoticeT = Math.max(state.phaseNoticeT, 4.2);
      showMilestoneBanner("boss", `Boss 節點 ${node}`, "月庭魑魅現身，注意彈幕與封印圈", 3.2);
      state.shake = 10;
      sfx("level");
    }
  }
}

function spawnFinalBoss() {
  if (state.finalBossActive || state.finalBossDefeated) return null;
  const boss = spawnEnemy("boss", {
    finalBoss: true,
    hp: 1850 + state.level * 70 + state.spawnedBossNodes.length * 180,
    maxHp: 1850 + state.level * 70 + state.spawnedBossNodes.length * 180,
    damage: 34,
    radius: 52,
    speed: 38,
    xp: 120,
    shoot: 0.8,
    skill: 1.2,
    phaseBreaks: []
  });
  if (!boss) return null;
  const a = Math.random() * TWO_PI;
  boss.x = clamp(state.player.x + Math.cos(a) * 360, 120, WORLD_W - 120);
  boss.y = clamp(state.player.y + Math.sin(a) * 260, 120, WORLD_H - 120);
  state.finalBossActive = true;
  state.spawnedBossNodes.push("final");
  state.message = "終局首領現身：擊破後完成本輪";
  state.phaseNoticeT = Math.max(state.phaseNoticeT, 5.2);
  showMilestoneBanner("final", "終局首領", "擊破後完成本輪，優先拉開距離", 3.6);
  state.shake = 14;
  addEffect("voidRift", boss.x, boss.y - 20, 300, 0.9);
  showHint("boss", true);
  sfx("level");
  return boss;
}

function activeBosses() {
  return state.enemies.filter((enemy) => enemy.kind === "boss");
}

function finalBossPhaseSummary(boss = activeBosses().find((item) => item.finalBoss)) {
  if (!boss) return null;
  const ratio = clamp(boss.hp / (boss.maxHp || 1), 0, 1);
  const breaks = Array.isArray(boss.phaseBreaks) ? boss.phaseBreaks : [];
  if (ratio <= 0.33) {
    return { phase: 3, label: "終幕", title: "殘月暴走", next: "擊破", ratio, breaks };
  }
  if (ratio <= 0.66) {
    return { phase: 2, label: "第二幕", title: "月輪裂潮", next: "33% 破階", ratio, breaks };
  }
  return { phase: 1, label: "第一幕", title: "醒月現身", next: "66% 破階", ratio, breaks };
}

function bossHudSummary() {
  const bosses = activeBosses();
  if (!bosses.length) return null;
  const finalBosses = bosses.filter((boss) => boss.finalBoss);
  const totalHp = bosses.reduce((sum, boss) => sum + Math.max(0, boss.hp), 0);
  const totalMax = bosses.reduce((sum, boss) => sum + boss.maxHp, 0) || 1;
  const nearest = bosses
    .map((boss) => ({ boss, d: state.player ? dist(boss, state.player) : 0 }))
    .sort((a, b) => a.d - b.d)[0];
  return {
    count: bosses.length,
    hp: Math.round(totalHp),
    maxHp: Math.round(totalMax),
    ratio: clamp(totalHp / totalMax, 0, 1),
    finalBoss: finalBosses.length > 0,
    finalBossCount: finalBosses.length,
    finalPhase: finalBosses.length > 0 ? finalBossPhaseSummary(finalBosses[0]) : null,
    nearestDistance: Math.round(nearest?.d || 0),
    nearest: nearest?.boss ? { x: Math.round(nearest.boss.x), y: Math.round(nearest.boss.y) } : null
  };
}

function spawnAroundBoss(kind, boss, count, minDistance = 120, maxDistance = 220) {
  for (let i = 0; i < count; i++) {
    const enemy = spawnEnemy(kind);
    if (!enemy) continue;
    const a = (i / Math.max(1, count)) * TWO_PI + Math.random() * 0.35;
    const r = rand(minDistance, maxDistance);
    enemy.x = clamp(boss.x + Math.cos(a) * r, 60, WORLD_W - 60);
    enemy.y = clamp(boss.y + Math.sin(a) * r, 60, WORLD_H - 60);
  }
}

function triggerFinalBossPhaseBreak(boss, phase) {
  boss.phaseBreaks = Array.isArray(boss.phaseBreaks) ? boss.phaseBreaks : [];
  if (boss.phaseBreaks.includes(phase)) return;
  boss.phaseBreaks.push(phase);
  if (phase === 2) {
    boss.speed += 5;
    boss.skill = Math.min(boss.skill || 0, 0.35);
    boss.shoot = Math.min(boss.shoot || 0.8, 0.35);
    state.message = "終局破階：月輪裂潮";
    state.phaseNoticeT = Math.max(state.phaseNoticeT, 4.4);
    state.shake = Math.max(state.shake, 13);
    addEffect("divineJudgment", boss.x, boss.y - 22, 270, 0.85);
    resolveBossSpecial(boss, "radial");
    spawnAroundBoss("skitter", boss, 4, 135, 245);
    spawnAroundBoss("mage", boss, 2, 170, 285);
    showMilestoneBanner("final", "終局二幕", "月輪彈幕展開，清出安全距離", 3.2);
    sfx("level");
    return;
  }
  if (phase === 3) {
    boss.speed += 8;
    boss.damage += 5;
    boss.skill = Math.min(boss.skill || 0, 0.25);
    boss.shoot = Math.min(boss.shoot || 0.7, 0.25);
    state.message = "終局破階：殘月暴走";
    state.phaseNoticeT = Math.max(state.phaseNoticeT, 4.8);
    state.shake = Math.max(state.shake, 17);
    addEffect("voidRift", boss.x, boss.y - 20, 330, 0.95);
    resolveBossSpecial(boss, "seal");
    spawnAroundBoss("warden", boss, 1, 155, 230);
    spawnAroundBoss("brute", boss, 1, 190, 280);
    spawnAroundBoss("skitter", boss, 5, 130, 270);
    showMilestoneBanner("final", "終幕暴走", "封印圈與護衛同時壓迫，準備收尾", 3.5);
    sfx("level");
  }
}

function updateFinalBossPhaseBreaks(boss) {
  if (!boss?.finalBoss || boss.hp <= 0) return;
  const ratio = boss.hp / (boss.maxHp || 1);
  if (ratio <= 0.66) triggerFinalBossPhaseBreak(boss, 2);
  if (ratio <= 0.33) triggerFinalBossPhaseBreak(boss, 3);
}

function triggerPlayerHurtFeedback(damage = 0, source = "未知傷害") {
  state.hurtFlash = 0.82;
  state.shake = Math.max(state.shake, damage >= 20 ? 10 : 7);
  state.lastHit = { source, damage, t: 2.2 };
  if (state.player) state.player.hurtT = HERO_ANIM.hit;
  sfx("hurt");
  showHint("hurt");
}

function updateEnemies(dt) {
  const p = state.player;
  applyWardenAuras();
  for (const e of [...state.enemies]) {
    e.anim += dt * 9;
    e.hit = Math.max(0, e.hit - dt);
    if (e.finalBoss) updateFinalBossPhaseBreaks(e);
    if (e.burn > 0) {
      e.burn -= dt;
      damageEnemy(e, (2.5 + state.stats.fire.burn * 1.4) * dt, 0, "火系燃燒");
      if (e.hp <= 0) continue;
    }
    if (e.poison > 0) {
      e.poison -= dt;
      damageEnemy(e, (1.8 + state.stats.poison.venom * 1.7) * dt, 0, "毒系蝕傷");
      if (e.hp <= 0) continue;
    }
    e.curse = Math.max(0, (e.curse || 0) - dt);
    e.weaken = Math.max(0, (e.weaken || 0) - dt);
    e.slow = Math.max(0, (e.slow || 0) - dt);
    const d = norm(p.x - e.x, p.y - e.y);
    const desired = (e.kind === "mage" || e.kind === "boss" || e.kind === "weaver" || e.kind === "mirror_lantern" || e.kind === "talisman_binder") && dist(e, p) < 360 ? -0.25 : 1;
    const rush = e.kind === "skitter" && dist(e, p) < 220 ? 1.28 : 1;
    const slowFactor = e.slow > 0 ? 0.58 : 1;
    e.x += d.x * e.speed * desired * slowFactor * rush * dt;
    e.y += d.y * e.speed * desired * slowFactor * rush * dt;
    e.x = clamp(e.x, 20, WORLD_W - 20);
    e.y = clamp(e.y, 20, WORLD_H - 20);
    if (e.kind === "mage" || e.kind === "boss") {
      updateEnemyCasting(e, dt);
      if (!(e.castT > 0 || e.specialCast)) {
        e.shoot -= dt;
        if (e.kind === "boss") {
          e.skill -= dt;
          if (e.skill <= 0) {
            queueBossSpecial(e);
          }
        }
        if (!e.specialCast && e.shoot <= 0 && dist(e, p) < 650) {
          queueEnemyShot(e);
        }
      }
    }
    if (e.kind === "weaver") updateWeaver(e, dt);
    if (e.kind === "mirror_lantern") updateMirrorLantern(e, dt);
    if (e.kind === "talisman_binder") updateTalismanBinder(e, dt);
    if (dist(e, p) < e.radius + p.radius && p.invuln <= 0) {
      const contactDamage = e.weaken > 0 ? e.damage * 0.72 : e.damage;
      const shieldBlock = state.stats.holy.shield > 0 ? Math.min(e.damage * 0.35, state.stats.holy.shield * 2) : 0;
      const dealt = Math.max(1, contactDamage - shieldBlock);
      p.hp -= dealt;
      p.invuln = 0.6 + state.stats.hurtGrace;
      if (state.stats.bloodCloak) state.stats.bloodFrenzy = 1.4;
      state.freeze = 0.08;
      triggerPlayerHurtFeedback(dealt, e.kind === "boss" ? "Boss 接觸" : e.kind === "skitter" ? "疾影貼身" : "敵人接觸");
      state.message = "受傷！用 Shift/Space 閃避，吃魂火升級。";
    }
  }
}

function queueEnemyShot(e) {
  const p = state.player;
  const aim = norm(p.x - e.x, p.y - e.y);
  e.castT = e.kind === "boss" ? 0.48 : 0.36;
  e.castMax = e.castT;
  e.castAngle = Math.atan2(aim.y, aim.x);
  e.castKind = "shot";
  e.shoot = e.kind === "boss" ? rand(0.9, 1.5) : rand(1.4, 2.4);
}

function updateEnemyCasting(e, dt) {
  if (e.specialCast) {
    e.specialCast.t -= dt;
    if (e.specialCast.t <= 0) {
      resolveBossSpecial(e, e.specialCast.pattern);
      e.specialCast = null;
    }
  }
  if (e.castT > 0) {
    e.castT -= dt;
    if (e.castT <= 0) fireQueuedEnemyShot(e);
  }
}

function fireQueuedEnemyShot(e) {
  const angle = Number.isFinite(e.castAngle) ? e.castAngle : Math.atan2(state.player.y - e.y, state.player.x - e.x);
  const speed = e.kind === "boss" ? 310 : 250;
  state.enemyBullets.push({
    x: e.x + Math.cos(angle) * e.radius * 0.55,
    y: e.y + Math.sin(angle) * e.radius * 0.55,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    r: e.kind === "boss" ? 13 : 9,
    life: 4.2,
    damage: e.kind === "boss" ? 22 : 14,
    kind: e.kind === "boss" ? "boss" : "mage",
    anim: 0
  });
  e.castT = 0;
  e.castMax = 0;
  e.castKind = null;
  if (Math.random() < 0.35) sfx("shoot");
}

function applyWardenAuras() {
  for (const e of state.enemies) e.guarded = 0;
  for (const warden of state.enemies) {
    if (warden.kind !== "warden") continue;
    for (const e of state.enemies) {
      if (e === warden || e.kind === "boss") continue;
      if (Math.hypot(e.x - warden.x, e.y - warden.y) < 150) e.guarded = Math.max(e.guarded || 0, 0.18);
    }
  }
}

function updateWeaver(e, dt) {
  if (e.conjureCast) {
    e.conjureCast.t -= dt;
    if (e.conjureCast.t <= 0) {
      resolveWeaverConjure(e);
      e.conjureCast = null;
    }
    return;
  }
  e.conjure = (e.conjure ?? rand(4.4, 6.2)) - dt;
  if (e.conjure <= 0 && dist(e, state.player) < 760) {
    queueWeaverConjure(e);
  }
}

function queueWeaverConjure(e) {
  const profile = GAME_CONFIG.enemyProfiles.weaver;
  e.conjureCast = { t: 0.7, max: 0.7 };
  e.conjure = rand(profile.conjureMin, profile.conjureMax);
  addEffect("voidRift", e.x, e.y - 16, 150, 0.42);
  state.message = "召虺正在召喚雜兵：先擊破它";
}

function resolveWeaverConjure(e) {
  const minute = state.time / 60;
  const count = minute > 2.4 ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TWO_PI + Math.random();
    const minion = spawnEnemy(Math.random() < 0.5 ? "skitter" : "ghoul", {
      x: clamp(e.x + Math.cos(a) * 60, 20, WORLD_W - 20),
      y: clamp(e.y + Math.sin(a) * 60, 20, WORLD_H - 20)
    });
    if (minion) {
      minion.summoned = true;
      addEffect("soulSlash", minion.x, minion.y - 10, 88, 0.3);
    }
  }
  sfx("shoot");
}

function updateMirrorLantern(e, dt) {
  if (e.mirrorCast) {
    e.mirrorCast.t -= dt;
    if (e.mirrorCast.t <= 0) {
      resolveMirrorShot(e);
      e.mirrorCast = null;
    }
    return;
  }
  e.mirror = (e.mirror ?? rand(2.8, 3.6)) - dt;
  if (e.mirror <= 0 && dist(e, state.player) < 640) queueMirrorShot(e);
}

function queueMirrorShot(e) {
  const p = state.player;
  const profile = GAME_CONFIG.enemyProfiles.mirror_lantern;
  const aim = norm(p.x - e.x, p.y - e.y);
  const side = Math.random() < 0.5 ? 1 : -1;
  const off = 150;
  e.mirrorCast = {
    t: 0.55,
    max: 0.55,
    ox: clamp(p.x - aim.y * side * off, 20, WORLD_W - 20),
    oy: clamp(p.y + aim.x * side * off, 20, WORLD_H - 20)
  };
  e.mirror = rand(profile.mirrorMin, profile.mirrorMax);
  state.message = "鏡燈使折射符彈：斜向走位閃避";
}

function resolveMirrorShot(e) {
  const p = state.player;
  const c = e.mirrorCast;
  const split = e.hp / e.maxHp < 0.45;
  const base = Math.atan2(p.y - c.oy, p.x - c.ox);
  const spread = split ? [-0.16, 0.16] : [0];
  for (const offset of spread) {
    const angle = base + offset;
    state.enemyBullets.push({
      x: c.ox,
      y: c.oy,
      vx: Math.cos(angle) * 300,
      vy: Math.sin(angle) * 300,
      angle,
      r: 9,
      life: 4,
      damage: split ? 10 : 15,
      kind: "mage",
      source: "鏡燈法彈",
      anim: 0
    });
  }
  addEffect("divineJudgment", c.ox, c.oy - 8, 120, 0.3);
  sfx("shoot");
}

function updateTalismanBinder(e, dt) {
  const profile = GAME_CONFIG.enemyProfiles.talisman_binder;
  e.bindPose = Math.max(0, (e.bindPose || 0) - dt);
  e.bind = (e.bind ?? rand(4.2, 5)) - dt;
  if (e.bind <= 0 && dist(e, state.player) < 680) {
    placeBindSeals(e);
    e.bind = rand(profile.bindMin, profile.bindMax);
  }
}

function placeBindSeals(e) {
  const p = state.player;
  const vel = norm(p.vx || 0.0001, p.vy || 0.0001);
  const perp = { x: -vel.y, y: vel.x };
  for (let i = 0; i < 2; i++) {
    const ahead = 70 + i * 90;
    const jitter = (i === 0 ? -1 : 1) * 46;
    state.hazards.push({
      kind: "bindSeal",
      owner: "enemy",
      x: clamp(p.x + vel.x * ahead + perp.x * jitter, 30, WORLD_W - 30),
      y: clamp(p.y + vel.y * ahead + perp.y * jitter, 30, WORLD_H - 30),
      r: 46,
      life: 3.55,
      warn: 0.55,
      tick: 0,
      damage: 6,
      slow: 0.9
    });
  }
  e.bindPose = 0.6;
  state.message = "縛符師佈下符陣：別踩到減速符";
}

function queueBossSpecial(e) {
  const pattern = Math.random() < 0.55 ? "radial" : "seal";
  e.specialCast = { pattern, t: pattern === "radial" ? 0.78 : 0.52, max: pattern === "radial" ? 0.78 : 0.52 };
  e.skill = rand(4.2, 6.2);
  state.message = pattern === "radial" ? "Boss 正在蓄力：月輪彈幕" : "Boss 正在施咒：怨月封印";
  addEffect(pattern === "radial" ? "divineJudgment" : "voidRift", e.x, e.y - 20, pattern === "radial" ? 190 : 170, 0.45);
}

function resolveBossSpecial(e, pattern) {
  if (pattern === "radial") {
    state.message = "Boss 技：月輪彈幕";
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TWO_PI + state.time * 0.35;
      state.enemyBullets.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * 235,
        vy: Math.sin(a) * 235,
        angle: a,
        r: 10,
        life: 4.2,
        damage: 14,
        kind: "boss",
        anim: i
      });
    }
    addEffect("divineJudgment", e.x, e.y - 20, 210, 0.55);
    state.shake = 8;
    return;
  }
  state.message = "Boss 技：怨月封印";
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * TWO_PI;
    state.hazards.push({
      kind: "bossSeal",
      x: clamp(state.player.x + Math.cos(a) * rand(40, 120), 80, WORLD_W - 80),
      y: clamp(state.player.y + Math.sin(a) * rand(40, 120), 80, WORLD_H - 80),
      r: 92,
      warn: 0.8,
      life: 4.4,
      damage: 13,
      tick: 0
    });
  }
  addEffect("voidRift", e.x, e.y - 12, 190, 0.55);
  state.shake = 7;
}

function updateBullets(dt) {
  for (const b of [...state.bullets]) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    b.anim += dt * 16;
    for (const e of [...state.enemies]) {
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.r) {
        damageEnemy(e, b.damage, 22, damageSourceLabelForBullet(b));
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
      state.player.invuln = 0.55 + state.stats.hurtGrace;
      triggerPlayerHurtFeedback(b.damage, b.source || (b.kind === "boss" ? "Boss 彈幕" : "遠程彈"));
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
      if (state.tutorialProgress) state.tutorialProgress.souls += 1;
      state.pickups.splice(state.pickups.indexOf(s), 1);
    }
  }
}

function updateHazards(dt) {
  const p = state.player;
  for (const h of [...state.hazards]) {
    h.life -= dt;
    h.warn = Math.max(0, h.warn - dt);
    h.tick = Math.max(0, (h.tick || 0) - dt);
    if (h.life <= 0) {
      state.hazards.splice(state.hazards.indexOf(h), 1);
      continue;
    }
    if (h.owner === "player") {
      for (const e of state.enemies) {
        if (Math.hypot(e.x - h.x, e.y - h.y) < h.r + e.radius) {
          e.poison = Math.max(e.poison || 0, 1.4 + state.stats.poison.venom * 0.35);
          e.weaken = Math.max(e.weaken || 0, state.stats.poison.weaken > 0 ? 1.0 : 0);
        }
      }
      continue;
    }
    if (h.warn <= 0 && h.tick <= 0 && Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.radius && p.invuln <= 0) {
      p.hp -= h.damage;
      p.invuln = 0.38 + state.stats.hurtGrace;
      h.tick = 0.75;
      state.freeze = 0.05;
      if (h.slow) p.slowT = Math.max(p.slowT || 0, h.slow);
      triggerPlayerHurtFeedback(h.damage, h.kind === "bossSeal" ? "怨月封印" : h.kind === "bindSeal" ? "縛符陷阱" : "危險區");
    }
  }
  if (state.currentEvent) {
    state.currentEvent.t -= dt;
    if (state.currentEvent.t <= 0) state.currentEvent = null;
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

function renderCamera() {
  return {
    x: Math.round((state.camera.x + (state.camera.shakeX || 0)) * VIEW_SCALE) / VIEW_SCALE,
    y: Math.round((state.camera.y + (state.camera.shakeY || 0)) * VIEW_SCALE) / VIEW_SCALE
  };
}

function worldToScreen(x, y) {
  const cam = renderCamera();
  return { x: (x - cam.x) * VIEW_SCALE, y: (y - cam.y) * VIEW_SCALE };
}

function updateCamera(dt = 1 / 60) {
  const p = state.player || { x: WORLD_W / 2, y: WORLD_H / 2 };
  const targetX = clamp(p.x - W / (2 * VIEW_SCALE), 0, WORLD_W - W / VIEW_SCALE);
  const targetY = clamp(p.y - H / (2 * VIEW_SCALE), 0, WORLD_H - H / VIEW_SCALE);
  const follow = state.mode === "playing" ? 1 - Math.exp(-dt * 16) : 1;
  state.camera.x += (targetX - state.camera.x) * follow;
  state.camera.y += (targetY - state.camera.y) * follow;
  if (state.shake > 0 && settingEnabled("screenShake")) {
    state.camera.shakeX = rand(-state.shake, state.shake);
    state.camera.shakeY = rand(-state.shake, state.shake);
  } else {
    state.camera.shakeX = 0;
    state.camera.shakeY = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  if (state.mode === "menu" || state.mode === "loading" || state.mode === "briefing") {
    drawMenu();
    if (state.mode === "briefing") drawRunBriefing();
    return;
  }
  drawAmbience();
  drawPickups();
  drawEnemyTelegraphs();
  drawBullets();
  drawEnemies();
  drawHazards();
  drawEffects();
  drawPlayer();
  drawOrbitBlades();
  drawDamageText();
  if (state.mode === "playing") drawDamageFeedbackOverlay();
  drawHud();
  if (state.mode === "playing") drawMilestoneBanner();
  if (state.mode === "level") drawLevelUp();
  if (state.mode === "bossReward") drawBossReward();
  if (state.mode === "eventChoice") drawEventChoice();
  if (state.mode === "pause") drawPause();
  if (state.mode === "dead") drawDead();
  if (state.mode === "result") drawResult();
}

function drawBackground() {
  ctx.fillStyle = "#071414";
  ctx.fillRect(0, 0, W, H);
  if (mapBackground.complete && mapBackground.naturalWidth > 0) {
    const cam = renderCamera();
    const worldAspect = WORLD_W / WORLD_H;
    const imageAspect = mapBackground.naturalWidth / mapBackground.naturalHeight;
    let sx = 0;
    let sy = 0;
    let sw = mapBackground.naturalWidth;
    let sh = mapBackground.naturalHeight;
    if (imageAspect > worldAspect) {
      sw = mapBackground.naturalHeight * worldAspect;
      sx = (mapBackground.naturalWidth - sw) / 2;
    } else {
      sh = mapBackground.naturalWidth / worldAspect;
      sy = (mapBackground.naturalHeight - sh) / 2;
    }
    ctx.drawImage(
      mapBackground,
      sx,
      sy,
      sw,
      sh,
      -cam.x * VIEW_SCALE,
      -cam.y * VIEW_SCALE,
      WORLD_W * VIEW_SCALE,
      WORLD_H * VIEW_SCALE
    );
    ctx.fillStyle = "rgba(2, 8, 9, 0.18)";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const tile = 128 * VIEW_SCALE;
  const cam = renderCamera();
  const cx = -Math.round(cam.x * VIEW_SCALE) % tile;
  const cy = -Math.round(cam.y * VIEW_SCALE) % tile;
  for (let y = cy - tile; y < H + tile; y += tile) {
    for (let x = cx - tile; x < W + tile; x += tile) {
      const parity = (Math.floor((x - cx) / tile) + Math.floor((y - cy) / tile)) % 2;
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

function visibleAmbienceNodes() {
  const cam = renderCamera();
  const margin = 260;
  return AMBIENCE_NODES.filter((node) => {
    const sx = (node.x - cam.x) * VIEW_SCALE;
    const sy = (node.y - cam.y) * VIEW_SCALE;
    const r = node.size * VIEW_SCALE;
    return sx > -margin - r && sx < W + margin + r && sy > -margin - r && sy < H + margin + r;
  });
}

function drawAmbience() {
  const nodes = visibleAmbienceNodes();
  if (!nodes.length) return;
  const now = state.time || performance.now() / 1000;
  ctx.save();
  for (const node of nodes) {
    const s = worldToScreen(node.x, node.y);
    const pulse = 0.5 + Math.sin(now * 1.25 + node.phase) * 0.5;
    const driftX = Math.sin(now * 0.38 + node.phase) * 8 * VIEW_SCALE;
    const driftY = Math.cos(now * 0.32 + node.phase) * 5 * VIEW_SCALE;
    if (node.kind === "wisp") {
      const r = node.size * VIEW_SCALE * (0.78 + pulse * 0.24);
      const grd = ctx.createRadialGradient(s.x + driftX, s.y + driftY, 0, s.x + driftX, s.y + driftY, r);
      grd.addColorStop(0, `rgba(126, 218, 194, ${0.18 + pulse * 0.14})`);
      grd.addColorStop(0.38, "rgba(96, 210, 230, 0.08)");
      grd.addColorStop(1, "rgba(96, 210, 230, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(s.x + driftX, s.y + driftY, r, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = `rgba(217, 255, 239, ${0.38 + pulse * 0.22})`;
      ctx.beginPath();
      ctx.arc(s.x + driftX, s.y + driftY, 3.5 * VIEW_SCALE, 0, TWO_PI);
      ctx.fill();
    } else if (node.kind === "rune") {
      const r = node.size * VIEW_SCALE * (0.48 + pulse * 0.05);
      ctx.globalAlpha = 0.1 + pulse * 0.08;
      ctx.strokeStyle = "#7edac2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 0.08 + pulse * 0.08;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TWO_PI + now * 0.18 + node.phase;
        ctx.beginPath();
        ctx.moveTo(s.x + Math.cos(a) * r * 0.42, s.y + Math.sin(a) * r * 0.42);
        ctx.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (node.kind === "mist") {
      ctx.globalAlpha = 0.08 + pulse * 0.04;
      ctx.fillStyle = "#c9f2ff";
      for (let i = 0; i < 3; i++) {
        const ox = Math.sin(now * 0.22 + node.phase + i) * 20 * VIEW_SCALE;
        const oy = (i - 1) * 22 * VIEW_SCALE + Math.cos(now * 0.2 + i) * 6 * VIEW_SCALE;
        ctx.beginPath();
        ctx.ellipse(s.x + ox, s.y + oy, node.size * 0.34 * VIEW_SCALE, node.size * 0.07 * VIEW_SCALE, -0.18, 0, TWO_PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (node.kind === "petal") {
      ctx.globalAlpha = 0.35 + pulse * 0.18;
      ctx.fillStyle = "#d9b5ff";
      for (let i = 0; i < 7; i++) {
        const a = node.phase + i * 1.7 + now * 0.45;
        const px = s.x + Math.cos(a) * node.size * 0.36 * VIEW_SCALE + driftX;
        const py = s.y + Math.sin(a * 0.8) * node.size * 0.18 * VIEW_SCALE + driftY;
        ctx.beginPath();
        ctx.ellipse(px, py, 4 * VIEW_SCALE, 8 * VIEW_SCALE, a, 0, TWO_PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
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

function eliteSheetReady(kind) {
  const sheet = ELITE_SHEETS[kind];
  return Boolean(sheet && sheet.img.complete && sheet.img.naturalWidth > 0);
}

function eliteSheetKey(e) {
  return e.finalBoss ? "final_boss" : e.kind;
}

function eliteActing(e) {
  if (e.kind === "boss") return Boolean(e.castT > 0 || e.specialCast);
  if (e.kind === "weaver") return Boolean(e.conjureCast);
  if (e.kind === "mirror_lantern") return Boolean(e.mirrorCast);
  if (e.kind === "talisman_binder") return (e.bindPose || 0) > 0;
  return false;
}

function drawEliteSprite(kind, row, frame, x, y, size, flip, alpha = 1) {
  const sheet = ELITE_SHEETS[kind];
  const cell = 128;
  const sx = (frame % 12) * cell;
  const sy = row * cell;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sheet.img, sx, sy, cell, cell, -(64 / cell) * size, -(sheet.anchorY / cell) * size, size, size);
  ctx.restore();
}

function heroSheetReady() {
  return heroSprites.complete && heroSprites.naturalWidth > 0;
}

function drawHeroSprite(row, frame, x, y, size, flip, alpha = 1) {
  const cell = 128;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(heroSprites, (frame % 12) * cell, row * cell, cell, cell, -(64 / cell) * size, -(HERO_ANCHOR_Y / cell) * size, size, size);
  ctx.restore();
}

function heroFrameFromTimer(timerT, duration) {
  return Math.min(11, Math.max(0, Math.floor((1 - timerT / duration) * 12)));
}

function drawPlayer() {
  const p = state.player;
  const s = worldToScreen(p.x, p.y);
  const moving = Math.abs(p.vx) + Math.abs(p.vy) > 1;
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
  const animFrame = Math.floor(p.anim) % 12;
  if (heroSheetReady()) {
    let row;
    let frame;
    if ((p.hurtT || 0) > 0) {
      row = HERO_ROWS.hit;
      frame = heroFrameFromTimer(p.hurtT, HERO_ANIM.hit);
    } else if ((p.dashAnimT || 0) > 0) {
      row = HERO_ROWS.dash;
      frame = heroFrameFromTimer(p.dashAnimT, HERO_ANIM.dash);
    } else if ((p.attackT || 0) > 0) {
      row = HERO_ROWS.attack;
      frame = heroFrameFromTimer(p.attackT, HERO_ANIM.attack);
    } else {
      row = moving ? HERO_ROWS.run : HERO_ROWS.idle;
      frame = animFrame;
    }
    drawHeroSprite(row, frame, s.x, s.y, 120 * VIEW_SCALE, p.facing < 0, alpha);
  } else {
    const row = moving ? ROW.heroRun : ROW.heroIdle;
    const anchor = resolveFrameAnchor(row, animFrame, DEFAULT_ANCHOR);
    const flip = row === ROW.heroRun ? p.facing < 0 : p.facing > 0;
    drawSprite(row, animFrame, s.x, s.y, 116 * VIEW_SCALE, flip, 0, alpha, anchor.x, anchor.y);
  }
  drawSummonCompanion(animFrame);
}

function drawSummonCompanion(frame) {
  const c = state.companion;
  if (!c) return;
  const summon = selectedSummon();
  const screen = worldToScreen(c.x, c.y);
  const sx = screen.x;
  const sy = screen.y + Math.sin(performance.now() / 240 + frame) * 3 * VIEW_SCALE;
  const pulse = 1 + (c.pulse || 0) * 0.38;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = summon.color;
  ctx.shadowColor = summon.color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(sx, sy, 13 * pulse * VIEW_SCALE, 0, TWO_PI);
  ctx.fill();
  if (summon.id === "paper_imp") {
    drawUpgradeIcon({ sheet: "tags", row: 4, frame: Math.floor(state.time * 12) % 12, angle: -0.35 }, sx, sy, 34 * VIEW_SCALE);
  } else if (summon.id === "bell_spirit") {
    ctx.strokeStyle = "#fff4d8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 20 * pulse * VIEW_SCALE, 0, TWO_PI);
    ctx.stroke();
    center("♪", sx, sy + 7 * VIEW_SCALE, 18 * VIEW_SCALE, "#fff4d8");
  } else if (summon.id === "shadow_moth") {
    ctx.fillStyle = "rgba(193, 140, 255, 0.42)";
    ctx.beginPath();
    ctx.ellipse(sx - 12 * VIEW_SCALE, sy, 13 * VIEW_SCALE, 22 * VIEW_SCALE, -0.55, 0, TWO_PI);
    ctx.ellipse(sx + 12 * VIEW_SCALE, sy, 13 * VIEW_SCALE, 22 * VIEW_SCALE, 0.55, 0, TWO_PI);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#fff4d8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 21 * pulse * VIEW_SCALE, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(5, 10, 13, 0.75)";
  ctx.beginPath();
  ctx.arc(sx - 4 * VIEW_SCALE, sy - 2 * VIEW_SCALE, 2 * VIEW_SCALE, 0, TWO_PI);
  ctx.arc(sx + 4 * VIEW_SCALE, sy - 2 * VIEW_SCALE, 2 * VIEW_SCALE, 0, TWO_PI);
  ctx.fill();
  if (c.action !== "idle") center(companionActionMark(c.action), sx, sy - 20 * VIEW_SCALE, 12, "#ffe8ad");
  ctx.restore();
}

function companionActionMark(action) {
  if (action === "pull") return "吸";
  if (action === "shot") return "符";
  if (action === "tempo") return "速";
  if (action === "hex") return "咒";
  return "";
}

function drawSkillEffect(kind, frame, x, y, size = 128, angle = 0, alpha = 1) {
  const def = EFFECT_DEFS[kind] || EFFECT_DEFS.fireBurst;
  const image = vfxSheetImage(def.sheet);
  if (!drawVfxFrame(image, def.row, frame, x, y, size, angle, alpha, VFX_CELL)) {
    drawSprite(ROW.fire, frame % 12, x, y, size, false, angle, alpha, 64, 64);
  }
}

function drawUpgradeIcon(icon, x, y, size = 74) {
  if (icon.sheet) {
    const image = vfxSheetImage(icon.sheet);
    const cell = icon.sheet === "icons" ? ICON_CELL : VFX_CELL;
    if (drawVfxFrame(image, icon.row, icon.frame ?? 0, x, y, size, icon.angle ?? 0, 1, cell)) return;
  }
  drawSprite(icon.row, icon.frame, x, y, size, false, icon.angle ?? 0, 1, 64, 64);
}

function drawEffects() {
  for (const fx of state.effects) {
    const s = worldToScreen(fx.x, fx.y);
    const t = clamp(fx.life / fx.maxLife, 0, 1);
    const progress = 1 - t;
    const frame = Math.min(11, Math.floor(progress * 12));
    drawSkillEffect(fx.kind, frame, s.x, s.y, fx.size * VIEW_SCALE * (1 + progress * 0.12), fx.angle, fx.alpha * t);
  }
}

function drawEnemies() {
  for (const e of state.enemies) {
    const s = worldToScreen(e.x, e.y);
    const style = enemyStyle(e);
    const row = style.row;
    const size = style.size;
    const frame = Math.floor(e.anim) % 12;
    const anchor = resolveFrameAnchor(row, frame, { x: 64, y: 127 });
    drawEnemyAura(e, s, size);
    const sheetKey = eliteSheetKey(e);
    if (ELITE_SHEETS[sheetKey] && eliteSheetReady(sheetKey)) {
      const wRow = eliteActing(e) ? ELITE_ROWS.action : e.hit > 0 ? ELITE_ROWS.hit : ELITE_ROWS.idle;
      const flip = e.x > state.player.x;
      if (e.hit > 0) drawEliteSprite(sheetKey, wRow, frame, s.x, s.y, (size + 8) * VIEW_SCALE, flip, 0.45);
      drawEliteSprite(sheetKey, wRow, frame, s.x, s.y, size * VIEW_SCALE, flip, style.alpha);
    } else {
      if (e.hit > 0) drawSprite(row, frame, s.x, s.y, (size + 8) * VIEW_SCALE, e.x > state.player.x, 0, 0.45, anchor.x, anchor.y);
      drawSprite(row, frame, s.x, s.y, size * VIEW_SCALE, e.x > state.player.x, 0, style.alpha, anchor.x, anchor.y);
    }
    if (style.mark) center(style.mark, s.x, s.y - size * 0.48 * VIEW_SCALE, 14, style.color);
    ctx.fillStyle = "#1b0b0b";
    ctx.fillRect(s.x - 22 * VIEW_SCALE, s.y - size * 0.9 * VIEW_SCALE, 44 * VIEW_SCALE, 5 * VIEW_SCALE);
    ctx.fillStyle = style.color;
    ctx.fillRect(s.x - 22 * VIEW_SCALE, s.y - size * 0.9 * VIEW_SCALE, 44 * Math.max(0, e.hp / e.maxHp) * VIEW_SCALE, 5 * VIEW_SCALE);
    drawEnemyStatusIcons(e, s, size);
  }
}

function drawEnemyStatusIcons(e, s, size) {
  const ids = [];
  if (e.burn > 0) ids.push("burn");
  if (e.poison > 0) ids.push("poison");
  if (e.slow > 0) ids.push("slow");
  if (e.curse > 0) ids.push("curse");
  if (!ids.length) return;
  const icon = 18 * VIEW_SCALE;
  const gap = icon + 1;
  let ix = s.x - ((ids.length - 1) * gap) / 2;
  const iy = s.y - size * 0.9 * VIEW_SCALE - icon * 0.75;
  for (const id of ids) {
    drawUiIcon(id, ix, iy, icon);
    ix += gap;
  }
}

function drawEnemyTelegraphs() {
  for (const e of state.enemies) {
    if (e.mirrorCast) {
      const progress = clamp(1 - e.mirrorCast.t / Math.max(0.01, e.mirrorCast.max), 0, 1);
      const es = worldToScreen(e.x, e.y);
      const os = worldToScreen(e.mirrorCast.ox, e.mirrorCast.oy);
      const ps = worldToScreen(state.player.x, state.player.y);
      ctx.save();
      ctx.globalAlpha = 0.35 + progress * 0.4;
      ctx.strokeStyle = "#5eead4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(es.x, es.y - 20 * VIEW_SCALE);
      ctx.lineTo(os.x, os.y);
      ctx.stroke();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2 + progress * 2;
      ctx.beginPath();
      ctx.moveTo(os.x, os.y);
      ctx.lineTo(ps.x, ps.y);
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      ctx.globalAlpha = 0.5 + progress * 0.4;
      ctx.beginPath();
      ctx.arc(os.x, os.y, (6 + progress * 5) * VIEW_SCALE, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }
    if (!(e.castT > 0 || e.specialCast)) continue;
    const s = worldToScreen(e.x, e.y);
    ctx.save();
    if (e.castT > 0) {
      const progress = clamp(1 - e.castT / Math.max(0.01, e.castMax || e.castT), 0, 1);
      const length = (e.kind === "boss" ? 520 : 420) * VIEW_SCALE;
      const width = (e.kind === "boss" ? 15 : 10) * VIEW_SCALE;
      const angle = Number.isFinite(e.castAngle) ? e.castAngle : 0;
      const warnColor = e.kind === "boss" ? "#f0abfc" : "#f9a8d4";
      ctx.translate(s.x, s.y - 34 * VIEW_SCALE);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.18 + progress * 0.42;
      ctx.fillStyle = warnColor;
      ctx.fillRect(0, -width / 2, length, width);
      ctx.globalAlpha = 0.88;
      ctx.strokeStyle = "#fff4d8";
      ctx.lineWidth = Math.max(1, 2 * VIEW_SCALE);
      ctx.beginPath();
      ctx.moveTo(length * progress, -14 * VIEW_SCALE);
      ctx.lineTo(length * progress + 24 * VIEW_SCALE, 0);
      ctx.lineTo(length * progress, 14 * VIEW_SCALE);
      ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.42 + progress * 0.4;
      ctx.strokeStyle = warnColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y - 34 * VIEW_SCALE, (22 + progress * 18) * VIEW_SCALE, 0, TWO_PI);
      ctx.stroke();
    }
    if (e.specialCast) {
      const progress = clamp(1 - e.specialCast.t / Math.max(0.01, e.specialCast.max), 0, 1);
      ctx.globalAlpha = 0.28 + progress * 0.44;
      ctx.strokeStyle = e.specialCast.pattern === "radial" ? "#ffe18a" : "#c084fc";
      ctx.lineWidth = 3;
      const r = (e.specialCast.pattern === "radial" ? 138 : 92) * VIEW_SCALE * (0.72 + progress * 0.3);
      ctx.beginPath();
      ctx.arc(s.x, s.y - 42 * VIEW_SCALE, r, 0, TWO_PI);
      ctx.stroke();
      if (e.specialCast.pattern === "radial") {
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TWO_PI + state.time * 0.35;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - 42 * VIEW_SCALE);
          ctx.lineTo(s.x + Math.cos(a) * r, s.y - 42 * VIEW_SCALE + Math.sin(a) * r);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}

function enemyStyle(enemy) {
  const kind = typeof enemy === "string" ? enemy : enemy.kind;
  if (enemy?.finalBoss) return { row: ROW.brute, size: 178, color: "#ffe18a", alpha: 1, mark: "終" };
  if (kind === "boss") return { row: ROW.brute, size: 154, color: "#d946ef", alpha: 1, mark: "B" };
  if (kind === "brute") return { row: ROW.brute, size: 124, color: "#ff7b32", alpha: 1, mark: "" };
  if (kind === "warden") return { row: ROW.brute, size: 116, color: "#7dd3fc", alpha: 0.95, mark: "護" };
  if (kind === "mage") return { row: ROW.mage, size: 104, color: "#f472b6", alpha: 1, mark: "" };
  if (kind === "weaver") return { row: ROW.mage, size: 120, color: "#a78bfa", alpha: 1, mark: "召" };
  if (kind === "mirror_lantern") return { row: ROW.mage, size: 116, color: "#fbbf24", alpha: 1, mark: "鏡" };
  if (kind === "talisman_binder") return { row: ROW.mage, size: 118, color: "#c4b5fd", alpha: 1, mark: "縛" };
  if (kind === "bomber") return { row: ROW.ghoul, size: 104, color: "#f59e0b", alpha: 1, mark: "爆" };
  if (kind === "skitter") return { row: ROW.ghoul, size: 82, color: "#fb7185", alpha: 1, mark: "" };
  return { row: ROW.ghoul, size: 96, color: "#f04452", alpha: 1, mark: "" };
}

function drawEnemyAura(e, s, size) {
  if (e.finalBoss) {
    ctx.save();
    const pulse = 0.45 + Math.sin(performance.now() / 180) * 0.15;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#ffe18a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y - size * 0.38 * VIEW_SCALE, 62 * VIEW_SCALE, 0, TWO_PI);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#d946ef";
    ctx.beginPath();
    ctx.arc(s.x, s.y - size * 0.36 * VIEW_SCALE, 78 * VIEW_SCALE, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
  if (e.kind === "warden") {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 14 * VIEW_SCALE, 150 * VIEW_SCALE, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }
  if (e.guarded > 0) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "#7dd3fc";
    ctx.beginPath();
    ctx.arc(s.x, s.y - size * 0.42 * VIEW_SCALE, 18 * VIEW_SCALE, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }
  if (e.kind === "bomber") {
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(performance.now() / 120) * 0.08;
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(s.x, s.y - size * 0.36 * VIEW_SCALE, 24 * VIEW_SCALE, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
  if (e.kind === "weaver") {
    ctx.save();
    const charging = e.conjureCast ? 0.24 : 0;
    ctx.globalAlpha = 0.18 + charging + Math.sin(performance.now() / 150) * 0.06;
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y - size * 0.4 * VIEW_SCALE, (e.conjureCast ? 34 : 22) * VIEW_SCALE, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBullets() {
  for (const b of state.bullets) {
    const s = worldToScreen(b.x, b.y);
    drawElementTrail(b, s);
    const row = ELEMENT_VFX_ROW[b.element];
    const frame = Math.floor(b.anim) % 12;
    const size = 86 * state.stats.area * VIEW_SCALE;
    if (Number.isInteger(row)) {
      if (!drawVfxFrame(vfxTags, row, frame, s.x, s.y, size, b.angle, 1, VFX_CELL)) {
        drawSprite(ROW.talismanBlade, frame, s.x, s.y, 62 * state.stats.area * VIEW_SCALE, false, b.angle);
      }
    } else {
      drawSprite(ROW.talismanBlade, frame, s.x, s.y, 62 * state.stats.area * VIEW_SCALE, false, b.angle);
    }
  }
  for (const b of state.enemyBullets) {
    const s = worldToScreen(b.x, b.y);
    const size = (b.kind === "boss" ? 78 : 66) * VIEW_SCALE;
    drawSprite(ROW.fire, Math.floor(b.anim) % 12, s.x, s.y, size, false, b.angle);
    if (b.kind === "boss") {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = "#d946ef";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 18 * VIEW_SCALE, 0, TWO_PI);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawHazards() {
  for (const h of state.hazards) {
    const s = worldToScreen(h.x, h.y);
    const r = h.r * VIEW_SCALE;
    ctx.save();
    ctx.globalAlpha = h.warn > 0 ? 0.28 + Math.sin(performance.now() / 80) * 0.08 : 0.42;
    ctx.fillStyle = h.owner === "player" ? "rgba(95, 239, 56, 0.24)" : h.kind === "bossSeal" ? "rgba(178, 92, 255, 0.34)" : h.kind === "bindSeal" ? "rgba(196, 181, 253, 0.26)" : "rgba(217, 70, 239, 0.28)";
    ctx.strokeStyle = h.owner === "player" ? "#87ef38" : h.warn > 0 ? "#ffe8ad" : h.kind === "bindSeal" ? "#c4b5fd" : "#d946ef";
    ctx.lineWidth = h.warn > 0 ? 3 : 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(s.x, s.y, Math.max(8, r * (h.warn > 0 ? h.warn : 0.18)), 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
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

function vfxSheetImage(name) {
  if (name === "tags") return vfxTags;
  if (name === "bursts") return vfxBursts;
  if (name === "fields") return vfxFields;
  if (name === "icons") return vfxIcons;
  return null;
}

function imageReady(image) {
  return image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
}

function drawVfxFrame(image, row, frame, x, y, size = 128, angle = 0, alpha = 1, cell = VFX_CELL) {
  if (!imageReady(image)) return false;
  const sx = (Math.floor(frame) % 12) * cell;
  const sy = Math.floor(row) * cell;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (angle) ctx.rotate(angle);
  ctx.drawImage(image, sx, sy, cell, cell, -size / 2, -size / 2, size, size);
  ctx.restore();
  return true;
}

function drawPickups() {
  for (const p of state.pickups) {
    const s = worldToScreen(p.x, p.y);
    drawSprite(ROW.soul, Math.floor(p.t * 12) % 12, s.x, s.y, 50 * VIEW_SCALE, false, 0, 1, 64, 64);
  }
}

function drawOrbitBlades() {
  const p = state.player;
  const radius = 42 * state.stats.area;
  for (let i = 0; i < state.stats.blades; i++) {
    const a = state.time * 3.2 + (i / state.stats.blades) * TWO_PI;
    const s = worldToScreen(p.x + Math.cos(a) * radius, p.y + Math.sin(a) * radius);
    drawSprite(ROW.talismanBlade, Math.floor(state.time * 12 + i) % 12, s.x, s.y, 54 * state.stats.area * VIEW_SCALE, false, a);
  }
}

function drawDamageText() {
  if (!settingEnabled("damageNumbers")) return;
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
  const phase = currentStagePhase();
  const readout = combatReadoutSummary();
  const focus = state.storyFocus || storyRunFocus();
  panel(18, 16, 500, 156);
  text(`WAVE ${Math.max(1, Math.ceil(state.kills / 20))}`, 34, 40, 20, "#fff4d8");
  text(`Lv.${state.level}`, 146, 40, 18);
  text(`${state.runType === "garden" ? "月庭" : "培育"} ${state.kills}/${state.targetKills}`, 232, 40, 18, "#d9e3df");
  text(formatTime(state.time), 430, 40, 18, "#ffe8ad");
  bar(34, 66, 184, 12, p.hp / state.stats.maxHp, "#f04452");
  bar(34, 94, 184, 12, p.dashT <= 0 ? 1 : 1 - p.dashT / state.stats.dashCooldown, "#47d7ff");
  bar(248, 94, 230, 12, state.runType === "garden" ? Math.min(1, gardenScore() / Math.max(1, saveData.bestGarden || 3000)) : state.xp / state.xpNeed, "#67f070");
  text("生命", 34, 58, 14);
  text("閃避", 34, 86, 14);
  text(state.runType === "garden" ? `分數 ${gardenScore()}` : `魂火 ${Math.floor(state.xp)}/${state.xpNeed}`, 248, 86, 14);
  const elementIconShown = state.stats.element && drawUiIcon(state.stats.element, 240, 110, 20);
  text(`${elementName(state.stats.element)} · ${selectedEquipment().name}`, elementIconShown ? 256 : 248, 114, 14, elementColor(state.stats.element));
  text(readout.line, 34, 132, 13, elementColor(readout.element));
  text(readout.subline, 248, 132, 13, readout.challenge?.done ? "#ffe18a" : "#a8c8c0");
  text(`主線焦點：${focus.title} ${focus.progress}`, 34, 152, 13, focus.color || "#ffe18a");
  text(fitText(focus.objective, 210, 12), 248, 152, 12, "#a8c8c0");
  if (p.hp / Math.max(1, state.stats.maxHp) < 0.32) text("低生命：拉開距離，保留閃避", 34, 190, 15, "#ffb4a8");
  drawPlayerStatusIcons(p);
  if (state.mode === "playing") {
    drawCombatTracker();
    drawBuildProgressPanel();
    drawCombatRadar();
    drawPhaseBanner(phase);
    drawBossHud();
    drawThreatWarning();
    drawCombatMedals();
  }
  drawSkillDock();
  if (state.mode === "playing") drawPauseButton();
  if (state.mode === "playing") drawChallengeToast();
  if (state.mode === "playing") drawTutorialHint();
  if (state.mode === "playing") drawTutorialQuestPanel();
  if (state.mode === "playing") drawVirtualControls();
  text(state.message, state.mode === "playing" ? 224 : 26, H - 28, 16, "#d8e3df");
}

function drawPlayerStatusIcons(p) {
  let sx = 238;
  const sy = 66;
  const add = (id) => { if (drawUiIcon(id, sx, sy, 22)) sx += 26; };
  if ((p.slowT || 0) > 0) add("slow");
  if (state.stats.holy.shield > 0) add("shield");
  if (p.hp / Math.max(1, state.stats.maxHp) < 0.32) add("health");
}

function drawTutorialQuestPanel() {
  const summary = tutorialQuestSummary();
  const x = 756;
  const y = H - 248;
  const w = 356;
  const h = 88;
  ctx.save();
  ctx.fillStyle = "rgba(5, 13, 16, 0.76)";
  ctx.strokeStyle = "rgba(126, 218, 194, 0.42)";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  text("修行步驟", x + 14, y + 24, 15, "#fff4d8");
  text(`${summary.completed}/${summary.total}`, x + 302, y + 24, 14, summary.completed === summary.total ? "#ffe18a" : "#7edac2");
  summary.rows.forEach((row, i) => {
    const cx = x + 16 + i * 66;
    const done = row.done;
    ctx.fillStyle = done ? "rgba(126, 218, 194, 0.18)" : row.id === summary.active.id ? "rgba(255, 225, 138, 0.13)" : "rgba(255,255,255,0.045)";
    ctx.fillRect(cx, y + 34, 58, 38);
    ctx.strokeStyle = done ? "#7edac2" : row.id === summary.active.id ? "#ffe18a" : "rgba(255,255,255,0.12)";
    ctx.strokeRect(cx + 0.5, y + 34.5, 57, 37);
    center(done ? "✓" : `${row.current}/${row.target}`, cx + 29, y + 50, 11, done ? "#7edac2" : "#ffe18a");
    center(row.label, cx + 29, y + 65, 11, "#fff4d8");
  });
  ctx.restore();
}

function drawThreatWarning() {
  const summary = threatSummary();
  if (!summary.active && summary.level !== "hit") return;
  const x = 18;
  const y = 184;
  const w = 332;
  const h = 72;
  ctx.save();
  ctx.fillStyle = "rgba(5, 10, 13, 0.78)";
  ctx.strokeStyle = summary.color;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = summary.color;
  ctx.fillRect(x, y, 6, h);
  text(summary.title, x + 18, y + 25, 17, "#fff4d8");
  text(fitText(summary.line, 260, 13), x + 18, y + 47, 13, summary.color);
  const counts = `施法 ${summary.casting} · 敵彈 ${summary.bullets} · 區域 ${summary.hazards}`;
  text(counts, x + 18, y + 65, 12, "#a8c8c0");
  drawThreatDirectionIndicators(summary);
  ctx.restore();
}

function drawCombatRadar() {
  const summary = minimapSummary();
  if (!summary.player) return;
  const x = 18;
  const y = 270;
  const w = 182;
  const h = 128;
  const px = (point) => x + 10 + point.x * (w - 20);
  const py = (point) => y + 28 + point.y * (h - 42);
  ctx.save();
  ctx.fillStyle = "rgba(5, 10, 13, 0.72)";
  ctx.strokeStyle = "rgba(126, 218, 194, 0.46)";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  text("雷達", x + 12, y + 20, 14, "#fff4d8");
  text(`敵 ${summary.counts.enemies}`, x + 70, y + 20, 11, "#a8c8c0");
  text(`魂 ${summary.counts.pickups}`, x + 122, y + 20, 11, "#7edac2");
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.strokeRect(x + 10, y + 28, w - 20, h - 42);

  for (const cluster of summary.enemyClusters) {
    ctx.globalAlpha = clamp(0.16 + cluster.count * 0.035, 0.18, 0.46);
    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.arc(px(cluster), py(cluster), clamp(4 + cluster.count * 0.8, 5, 14), 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 0.9;
  for (const pickup of summary.pickups) {
    ctx.fillStyle = "#7edac2";
    ctx.beginPath();
    ctx.arc(px(pickup), py(pickup), 2.2 + Math.min(2, pickup.xp * 0.25), 0, TWO_PI);
    ctx.fill();
  }
  for (const elite of summary.elites) {
    ctx.fillStyle = elite.kind === "mage" ? "#f472b6" : elite.kind === "warden" ? "#7dd3fc" : elite.kind === "weaver" ? "#a78bfa" : elite.kind === "mirror_lantern" ? "#fbbf24" : elite.kind === "talisman_binder" ? "#c4b5fd" : elite.kind === "bomber" ? "#f59e0b" : "#ff7b32";
    ctx.fillRect(px(elite) - 3, py(elite) - 3, 6, 6);
  }
  for (const hazard of summary.hazards) {
    ctx.strokeStyle = hazard.warn > 0 ? "#ffe18a" : "#d946ef";
    ctx.globalAlpha = hazard.warn > 0 ? 0.9 : 0.58;
    ctx.beginPath();
    ctx.arc(px(hazard), py(hazard), hazard.warn > 0 ? 7 : 9, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const boss of summary.bosses) {
    ctx.fillStyle = boss.final ? "#ffe18a" : "#d946ef";
    ctx.strokeStyle = "#fff4d8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px(boss), py(boss), boss.final ? 6 : 5, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#fff4d8";
  ctx.strokeStyle = "#050d10";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px(summary.player), py(summary.player), 4.6, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawThreatDirectionIndicators(summary = threatSummary()) {
  if (!summary.nearest || !state.player) return;
  const s = worldToScreen(summary.nearest.x, summary.nearest.y);
  const offscreen = s.x < 32 || s.x > W - 32 || s.y < 32 || s.y > H - 32;
  if (!offscreen && summary.nearest.distance > 180) return;
  const dx = summary.nearest.x - state.player.x;
  const dy = summary.nearest.y - state.player.y;
  const a = Math.atan2(dy, dx);
  const x = clamp(W / 2 + Math.cos(a) * (W / 2 - 96), 78, W - 78);
  const y = clamp(H / 2 + Math.sin(a) * (H / 2 - 112), 88, H - 118);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = summary.color;
  ctx.strokeStyle = "#fff4d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(-16, -15);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-16, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.rotate(-a);
  center(summary.nearest.label.slice(0, 4), 0, 34, 11, "#fff4d8");
  ctx.restore();
}

function drawDamageFeedbackOverlay() {
  if (!state.player || !state.stats) return;
  const hpRatio = clamp(state.player.hp / Math.max(1, state.stats.maxHp), 0, 1);
  const lowHp = hpRatio < 0.32;
  if (!lowHp && state.hurtFlash <= 0) return;
  ctx.save();
  if (lowHp) {
    const pulse = 0.16 + Math.sin(performance.now() / 150) * 0.05 + (0.32 - hpRatio) * 0.45;
    const grd = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.26, W / 2, H / 2, Math.max(W, H) * 0.68);
    grd.addColorStop(0, "rgba(120, 0, 0, 0)");
    grd.addColorStop(1, `rgba(190, 20, 42, ${clamp(pulse, 0.12, 0.38)})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.hurtFlash > 0) {
    ctx.globalAlpha = clamp(state.hurtFlash, 0, 0.22);
    ctx.fillStyle = "#ff4d64";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = clamp(state.hurtFlash * 1.1, 0, 0.36);
    ctx.strokeStyle = "#fff4d8";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, W - 16, H - 16);
  }
  ctx.restore();
}

function drawBossHud() {
  const summary = bossHudSummary();
  if (!summary) return;
  ctx.save();
  const hudX = 530;
  const hudY = state.milestoneBanner?.t > 0 ? 246 : 126;
  const hudH = summary.finalPhase ? 76 : 58;
  ctx.fillStyle = "rgba(6, 10, 14, 0.82)";
  ctx.strokeStyle = summary.finalBoss ? "#ffe18a" : "#d946ef";
  ctx.lineWidth = 2;
  ctx.fillRect(hudX, hudY, 330, hudH);
  ctx.strokeRect(hudX, hudY, 330, hudH);
  const title = summary.finalBoss ? (summary.count > 1 ? `終局首領 + Boss x${summary.count - 1}` : "終局首領") : summary.count > 1 ? `Boss x${summary.count}` : "Boss";
  text(title, hudX + 16, hudY + 24, 17, summary.finalBoss ? "#ffe18a" : "#fff4d8");
  text(`${summary.hp}/${summary.maxHp}`, hudX + 222, hudY + 24, 13, "#f0d8ff");
  ctx.fillStyle = "#170a1e";
  ctx.fillRect(hudX + 16, hudY + 36, 292, 10);
  const hpColor = summary.ratio < 0.28 ? "#fb7185" : "#d946ef";
  ctx.fillStyle = hpColor;
  ctx.fillRect(hudX + 16, hudY + 36, 292 * summary.ratio, 10);
  if (summary.finalPhase) {
    text(`${summary.finalPhase.label} · ${summary.finalPhase.title}`, hudX + 16, hudY + 59, 12, "#ffe18a");
    text(`下一段：${summary.finalPhase.next}`, hudX + 170, hudY + 59, 12, "#c9d5d2");
    text(`距離 ${summary.nearestDistance}`, hudX + 16, hudY + 72, 11, "#9fb1ad");
  } else {
    text(`距離 ${summary.nearestDistance}`, hudX + 16, hudY + 55, 12, "#c9d5d2");
  }
  ctx.restore();
  drawBossDirection(summary);
}

function drawBossDirection(summary) {
  if (!summary.nearest || !state.player) return;
  const s = worldToScreen(summary.nearest.x, summary.nearest.y);
  if (s.x >= 42 && s.x <= W - 42 && s.y >= 42 && s.y <= H - 42) return;
  const dx = summary.nearest.x - state.player.x;
  const dy = summary.nearest.y - state.player.y;
  const a = Math.atan2(dy, dx);
  const x = clamp(W / 2 + Math.cos(a) * (W / 2 - 72), 62, W - 62);
  const y = clamp(H / 2 + Math.sin(a) * (H / 2 - 78), 82, H - 104);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = "rgba(217, 70, 239, 0.88)";
  ctx.strokeStyle = "#fff4d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(-14, -14);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawVirtualControls() {
  ctx.save();
  const baseX = touchControl.active ? touchControl.startX : 118;
  const baseY = touchControl.active ? touchControl.startY : H - 104;
  ctx.globalAlpha = touchControl.active ? 0.78 : 0.38;
  ctx.fillStyle = "rgba(6, 14, 17, 0.72)";
  ctx.strokeStyle = "#7edac2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(baseX, baseY, 62, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(126, 218, 194, 0.62)";
  ctx.beginPath();
  ctx.arc(touchControl.active ? touchControl.x : baseX, touchControl.active ? touchControl.y : baseY, 26, 0, TWO_PI);
  ctx.fill();

  const dashReady = state.player?.dashT <= 0;
  const dashX = W - 112;
  const dashY = H - 104;
  ctx.globalAlpha = touchControl.lastDashT > 0 ? 0.9 : dashReady ? 0.62 : 0.32;
  ctx.fillStyle = dashReady ? "rgba(255, 232, 173, 0.22)" : "rgba(90, 106, 111, 0.28)";
  ctx.strokeStyle = dashReady ? "#ffe8ad" : "#6f8587";
  ctx.beginPath();
  ctx.arc(dashX, dashY, 54, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  center("閃", dashX, dashY + 10, 28, dashReady ? "#fff4d8" : "#8ea0a2");
  ctx.restore();
}

function drawPauseButton() {
  const x = W - 42;
  const y = 34;
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = "rgba(6, 14, 17, 0.76)";
  ctx.strokeStyle = "#7edac2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff4d8";
  ctx.fillRect(x - 8, y - 10, 5, 20);
  ctx.fillRect(x + 3, y - 10, 5, 20);
  ctx.restore();
}

function drawTutorialHint() {
  const hint = state.tutorialHint;
  if (!hint) return;
  const alpha = clamp(hint.t / Math.min(0.7, hint.maxT), 0, 1);
  ctx.save();
  ctx.globalAlpha = Math.min(1, 0.35 + alpha);
  ctx.fillStyle = "rgba(6, 14, 17, 0.86)";
  ctx.strokeStyle = "#7edac2";
  ctx.lineWidth = 2;
  ctx.fillRect(424, 590, 432, 74);
  ctx.strokeRect(424, 590, 432, 74);
  text(hint.title, 446, 618, 18, "#fff4d8");
  wrap(hint.body, 446, 642, 384, 17, "#d9e3df");
  ctx.restore();
}

function drawPhaseBanner(phase) {
  ctx.save();
  const alert = state.phaseNoticeT > 0;
  ctx.fillStyle = alert ? "rgba(118, 47, 62, 0.78)" : "rgba(5, 10, 13, 0.58)";
  ctx.fillRect(530, 68, 330, 48);
  text(`${phase.name} ${state.phaseIndex + 1}/${STAGE_PHASES.length}`, 544, 90, 16, alert ? "#fff4d8" : "#d9e3df");
  text(phase.objective, 544, 109, 12, alert ? "#ffe8ad" : "#a8c8c0");
  ctx.restore();
}

function drawMilestoneBanner() {
  const banner = state.milestoneBanner;
  if (!banner || banner.t <= 0) return;
  const fadeIn = Math.min(1, (banner.maxT - banner.t) / 0.25);
  const fadeOut = Math.min(1, banner.t / 0.45);
  const alpha = Math.min(fadeIn, fadeOut);
  const pulse = 0.5 + Math.sin(performance.now() / 90) * 0.5;
  const w = 560;
  const h = 92;
  const x = W / 2 - w / 2;
  const y = 142;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(5, 10, 13, 0.82)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = banner.color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.globalAlpha = alpha * (0.18 + pulse * 0.12);
  ctx.fillStyle = banner.color;
  ctx.fillRect(x, y, w, 7);
  ctx.fillRect(x, y + h - 7, w, 7);
  ctx.globalAlpha = alpha;
  center(banner.title, W / 2, y + 40, 28, "#fff4d8");
  center(banner.subtitle, W / 2, y + 68, 16, banner.color);
  ctx.restore();
}

function drawCombatTracker() {
  const tracker = combatTrackerSummary();
  const progress = tracker.challenge;
  const damageFocus = tracker.damageFocus;
  ctx.save();
  ctx.fillStyle = "rgba(5, 10, 13, 0.72)";
  ctx.strokeStyle = state.finalBossActive ? "#ffe18a" : "#40565a";
  ctx.lineWidth = 2;
  ctx.fillRect(876, 72, 288, 136);
  ctx.strokeRect(876, 72, 288, 136);
  text("本局追蹤", 892, 98, 16, "#fff4d8");
  text(tracker.objective, 892, 122, 14, state.finalBossActive ? "#ffe8ad" : "#d9e3df");
  text(tracker.bossLine, 892, 144, 13, tracker.bossLine.includes("Boss") || tracker.bossLine.includes("終局") ? "#ffe18a" : "#a8c8c0");
  text(tracker.danger, 892, 166, 13, tracker.danger.includes("危險") || tracker.danger.includes("預警") || tracker.danger.includes("事件") ? "#ffb4a8" : "#a8c8c0");
  text(`${damageFocus.label}：${fitText(damageFocus.source, 102, 12)}`, 892, 186, 12, damageFocus.color);
  ctx.fillStyle = "#172329";
  ctx.fillRect(1034, 178, 72, 7);
  ctx.fillStyle = damageFocus.color;
  ctx.fillRect(1034, 178, 72 * clamp(damageFocus.percent / 100, 0, 1), 7);
  text(damageFocus.hits ? `${damageFocus.percent}%/${damageFocus.hits}擊` : "待開火", 1114, 186, 11, "#a8c8c0");
  if (progress) {
    text(progress.done ? `${progress.name} 完成 +${progress.reward}` : `${progress.name} ${progress.current}/${progress.target}`, 892, 204, 12, progress.done ? "#ffe8ad" : "#7edac2");
    ctx.fillStyle = "#172329";
    ctx.fillRect(1018, 196, 126, 8);
    ctx.fillStyle = progress.done ? "#ffe18a" : "#7edac2";
    ctx.fillRect(1018, 196, 126 * progress.ratio, 8);
  }
  ctx.restore();
}

function drawBuildProgressPanel() {
  const summary = buildProgressSummary();
  const x = 876;
  const y = state.challengeToast ? 294 : 222;
  const w = 288;
  const h = 112;
  const evo = summary.nextEvolution;
  ctx.save();
  ctx.fillStyle = "rgba(5, 10, 13, 0.72)";
  ctx.strokeStyle = evo?.readyNext ? "#ffe18a" : summary.color;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  text("流派成形", x + 16, y + 24, 16, "#fff4d8");
  text(`${summary.elementName} · 主動 ${summary.activeSlots}/${summary.maxActiveSlots} · 被動 ${summary.passiveCount}`, x + 116, y + 24, 12, summary.color);
  const core = summary.coreSkill ? `${summary.coreSkill.name} Lv.${summary.coreSkill.level}` : "尚未取得核心技能";
  text(fitText(core, 250, 14), x + 16, y + 48, 14, "#d9e3df");
  if (evo) {
    text(evo.readyNext ? "進化前一步" : `進化進度 ${evo.level}/${evo.max}`, x + 16, y + 70, 12, evo.readyNext ? "#ffe18a" : "#a8c8c0");
    text(fitText(`${evo.from} -> ${evo.to}`, 152, 12), x + 118, y + 70, 12, evo.readyNext ? "#ffe18a" : "#7edac2");
    ctx.fillStyle = "#172329";
    ctx.fillRect(x + 16, y + 80, 252, 7);
    ctx.fillStyle = evo.readyNext ? "#ffe18a" : summary.color;
    ctx.fillRect(x + 16, y + 80, 252 * clamp(evo.level / evo.max, 0, 1), 7);
  } else {
    text(summary.evolvedCount ? `已進化 ${summary.evolvedCount} 種` : "尚無可追蹤進化", x + 16, y + 70, 12, summary.evolvedCount ? "#ffe18a" : "#a8c8c0");
  }
  text(fitText(summary.recommendation, 252, 12), x + 16, y + 102, 12, "#ffe8ad");
  ctx.restore();
}

function drawChallengeToast() {
  const toast = state.challengeToast;
  if (!toast) return;
  const alpha = Math.min(1, toast.t / 0.35, (toast.maxT - toast.t) / 0.22 + 0.15);
  const x = 876;
  const y = 198;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = "rgba(14, 18, 16, 0.86)";
  ctx.strokeStyle = "#ffe18a";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, 288, 70);
  ctx.strokeRect(x, y, 288, 70);
  ctx.fillStyle = "rgba(255, 225, 138, 0.16)";
  ctx.fillRect(x, y, 288, 7);
  text(toast.title, x + 16, y + 30, 17, "#fff4d8");
  text(toast.body, x + 16, y + 54, 14, "#ffe18a");
  ctx.restore();
}

function drawCombatMedals() {
  if (!state.combatMedals.length) return;
  const x = 222;
  const baseY = state.milestoneBanner ? 246 : 206;
  ctx.save();
  state.combatMedals.slice(0, 3).forEach((medal, i) => {
    const alpha = Math.min(1, medal.t / 0.45, (medal.maxT - medal.t) / 0.18 + 0.2);
    const y = baseY + i * 58;
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.fillStyle = "rgba(6, 14, 17, 0.82)";
    ctx.strokeStyle = medal.color;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 286, 48);
    ctx.strokeRect(x + 0.5, y + 0.5, 285, 47);
    ctx.fillStyle = medal.color;
    ctx.fillRect(x, y, 6, 48);
    center(medal.kind === "phase" ? "階" : medal.kind === "challenge" ? "委" : medal.kind === "elite" ? "賞" : "記", x + 28, y + 31, 18, medal.color);
    text(fitText(medal.title, 205, 15), x + 52, y + 22, 15, "#fff4d8");
    text(fitText(medal.body, 214, 12), x + 52, y + 40, 12, "#a8c8c0");
  });
  ctx.restore();
}

function combatEventName(id) {
  if (id === "soulRain") return "魂火雨";
  if (id === "spiritRush") return "怨靈急襲";
  if (id === "sealField") return "封印圈";
  if (id === "elitePressure") return "精英壓迫";
  if (id === "focus") return "靜心";
  return "未知";
}

function drawSkillDock() {
  normalizePickedUpgrades();
  const slots = state.pickedUpgrades.slice(0, 5);
  for (let i = 0; i < 5; i++) {
    const x = W - 302 + i * 54;
    const y = 34;
    ctx.save();
    ctx.fillStyle = slots[i] ? "rgba(14, 22, 28, 0.9)" : "rgba(10, 16, 20, 0.62)";
    ctx.strokeStyle = slots[i] ? "#58716d" : "#29383c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 21, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (slots[i]) {
      const icon = upgradeIcon(slots[i].name);
      if (icon) drawUpgradeIcon(icon, x, y, 32);
      center(`${slots[i].level}`, x + 16, y + 20, 12, "#ffe8ad");
    }
  }
}

function drawMenu() {
  const fragment = selectedFragment();
  const equipment = selectedEquipment();
  const claimableCount = claimableMissionList().length;
  ctx.save();
  ctx.fillStyle = "rgba(4, 4, 5, 0.34)";
  ctx.fillRect(0, 0, W, H);
  drawLobbyShrine();
  ctx.restore();

  drawTopProfile();
  drawTopResource(430, 24, "#ffd66b", "體力", "102/160");
  drawTopResource(590, 24, "#ffe18a", "月塵", `${saveData.moonDust}`, "moon_dust");
  drawTopResource(750, 24, "#77f0d2", "碎片", `${saveData.memoryFragments.length}/8`, "memory_shard");
  drawTopIcon(945, 34, "R");
  drawTopIcon(1000, 34, "M");
  drawTopIcon(1055, 34, "S");

  ctx.save();
  const aura = ctx.createRadialGradient(556, 340, 30, 556, 340, 260);
  aura.addColorStop(0, "rgba(244, 231, 190, 0.28)");
  aura.addColorStop(0.52, "rgba(126, 178, 166, 0.10)");
  aura.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(230, 70, 650, 560);
  ctx.restore();
  if (heroSheetReady()) drawHeroSprite(HERO_ROWS.idle, Math.floor(state.time * 6) % 12, 560, 558, 305, false, 1);
  else drawSprite(ROW.heroIdle, 0, 560, 558, 305, false, 0, 1, 67, 122);

  drawBottomDock();
  drawHomeNav(72, 574, "記憶", "◆", state.menuTab === "memory");
  drawHomeNav(176, 574, "屬性", "◇", state.menuTab === "stats");
  drawHomeNav(280, 574, "裝備", "▣", state.menuTab === "equipment");
  drawHomeNav(384, 574, "商店", "▥", state.menuTab === "shop");
  drawHomeNav(488, 574, "召喚", "✦", state.menuTab === "summon");

  drawSideButton(1032, 118, "任務", claimableCount ? `可領 ${claimableCount}` : selectedMissionChoice().title);
  drawSideButton(1032, 204, "狀態", `最高 ${saveData.bestGarden || 0}`);
  drawMissionPicker(800, 318, fragment);
  drawRunPreviewPanel(38, 144);
  drawGrowthDashboardPanel(38, 302);
  drawHomeGuidancePanel(38, 432, 178);
  drawPlayButton(800, 540, fragment);
  if (state.menuTab !== "home") drawMenuTabPanel();

  center(state.mode === "loading" ? "載入素材中..." : "選擇模式後按開始探索，Esc 可在戰鬥中暫停", 716, 666, 18, "#efe7ce");
  text(`裝備：${equipment.name}`, 38, 94, 17, "#fff4d8");
  text(equipment.desc, 38, 118, 15, "#d4dfdc");
}

function drawMenuTabPanel() {
  drawMenuTabScrim();
  panel(610, 120, 375, 390);
  center(menuTabTitle(), 798, 160, 30, "#fff4d8");
  if (state.menuTab === "memory") drawMemoryPanel(638, 198);
  else if (state.menuTab === "stats") drawStatsPanel(638, 198);
  else if (state.menuTab === "equipment") drawEquipmentPanel(638, 198);
  else if (state.menuTab === "missions") drawMissionsPanel(638, 198);
  else if (state.menuTab === "shop") drawShopPanel(638, 198);
  else if (state.menuTab === "summon") drawSummonPanel(638, 198);
  else if (state.menuTab === "records") drawRecordsPanel(638, 198);
  else if (state.menuTab === "settings") drawSettingsPanel(638, 198);
}

function drawMenuTabScrim() {
  ctx.save();
  const grd = ctx.createLinearGradient(560, 0, 1120, 0);
  grd.addColorStop(0, "rgba(3, 8, 10, 0.10)");
  grd.addColorStop(0.18, "rgba(3, 8, 10, 0.62)");
  grd.addColorStop(1, "rgba(3, 8, 10, 0.88)");
  ctx.fillStyle = grd;
  ctx.fillRect(560, 82, 548, 516);
  ctx.fillStyle = "rgba(5, 13, 16, 0.82)";
  ctx.fillRect(596, 104, 410, 428);
  ctx.strokeStyle = "rgba(126, 218, 194, 0.18)";
  ctx.strokeRect(596.5, 104.5, 409, 427);
  ctx.restore();
}

function drawMemoryPanel(x, y) {
  const fragments = saveData.memoryFragments.slice(0, 5);
  if (!fragments.length) {
    wrap("尚未取得記憶碎片。完成一次記憶培育後，會保存本局技能與強度，之後可進入月之庭園挑戰。", x, y, 310, 22, "#d9e3df");
    return;
  }
  const selected = selectedFragment();
  fragments.forEach((fragment, i) => {
    const rowY = y + i * 54;
    ctx.fillStyle = fragment.id === state.selectedFragmentId ? "rgba(126, 218, 194, 0.18)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(x, rowY - 20, 318, 44);
    text(fragment.name, x + 12, rowY, 17, "#fff4d8");
    text(`強度 ${fragment.power}  Lv.${fragment.level}  ${fragment.activeSkills.length} 技能`, x + 12, rowY + 20, 13, "#a8c8c0");
  });
  if (selected) {
    const confirming = state.memoryDeleteConfirmId === selected.id;
    text("選中記憶", x, y + 278, 15, "#ffe8ad");
    text(`${selected.name} · 強度 ${selected.power}`, x + 86, y + 278, 13, "#d9e3df");
    if (confirming) {
      text("刪除後不可復原", x, y + 302, 13, "#ffb4a8");
      button(x, y + 314, 126, 32, "確認刪除");
      button(x + 144, y + 314, 126, 32, "取消");
    } else {
      button(x, y + 314, 270, 32, "刪除選中記憶");
    }
  }
}

function drawStatsPanel(x, y) {
  readableStatRows().forEach(([label, value], i) => {
    const rowY = y + i * 31;
    text(label, x, rowY, 16, "#a8c8c0");
    text(String(value), x + 190, rowY, 16, "#fff4d8");
  });
  wrap(elementBuildSummary(), x, y + 260, 312, 19, elementColor(state.stats?.element));
}

function drawEquipmentPanel(x, y) {
  const selected = selectedEquipment();
  EQUIPMENT.forEach((item, i) => {
    const rowY = y + i * 78;
    ctx.fillStyle = item.id === state.selectedEquipment ? "rgba(126, 218, 194, 0.2)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(x, rowY - 24, 318, 62);
    text(item.name, x + 12, rowY, 18, "#fff4d8");
    wrap(item.desc, x + 12, rowY + 22, 292, 17, "#b9d0ca");
  });
  text("目前加成", x, y + 240, 15, "#ffe8ad");
  text(selected.name, x + 86, y + 240, 14, "#d9e3df");
  const rows = equipmentPreviewRows(selected);
  if (rows.length) {
    rows.slice(0, 4).forEach(([label, value], i) => {
      const bx = x + (i % 2) * 156;
      const by = y + 266 + Math.floor(i / 2) * 24;
      text(label, bx, by, 12, "#a8c8c0");
      text(value, bx + 72, by, 12, value.startsWith("-") ? "#9fd8d0" : "#ffe8ad");
    });
  } else {
    text("此裝備不改變基礎數值", x, y + 266, 13, "#6f8587");
  }
  text("點擊裝備列可切換", x, y + 326, 12, "#6f8587");
}

function drawMissionsPanel(x, y) {
  const claimable = claimableMissionList();
  text(claimable.length ? `可領 ${claimable.length} 項，共 ${claimableMissionReward()} 月塵` : "完成條件後可領月塵", x, y - 18, 14, claimable.length ? "#ffe8ad" : "#a8c8c0");
  MISSIONS.forEach((mission, i) => {
    const rowY = y + i * 52;
    const done = mission.done();
    const claimed = saveData.claimedMissions[mission.id];
    ctx.fillStyle = canClaimMission(mission) ? "rgba(255, 214, 107, 0.18)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(x, rowY - 24, 318, 42);
    text(mission.name, x + 10, rowY - 5, 16, "#fff4d8");
    text(`${mission.desc}  +${mission.reward} 月塵`, x + 10, rowY + 14, 12, "#b9d0ca");
    text(claimed ? "已領" : done ? "可領" : "未達成", x + 268, rowY + 3, 13, done ? "#ffe8ad" : "#6f8587");
  });
  if (claimable.length) {
    button(x, y + 250, 150, 34, "全部領取");
    text(`一次領取 +${claimableMissionReward()} 月塵`, x + 168, y + 272, 13, "#ffe8ad");
  } else {
    text("完成任務後可在這裡一次領取所有獎勵。", x, y + 272, 13, "#6f8587");
  }
}

function drawShopPanel(x, y) {
  const summary = permanentUpgradeSummary();
  text(`月塵 ${saveData.moonDust}  修行 ${summary.totalLevel}/${summary.maxLevel}`, x, y, 17, "#ffe8ad");
  text(summary.affordableCount ? `可升級 ${summary.affordableCount} 項` : "暫無可買升級", x + 204, y, 14, summary.affordableCount ? "#7edac2" : "#8ea0a2");
  if (summary.next) text(`推薦：${summary.next.name}  ${summary.next.cost} 月塵`, x, y + 24, 13, saveData.moonDust >= summary.next.cost ? "#fff4d8" : "#a8c8c0");
  PERMANENT_UPGRADES.forEach((item, i) => {
    const rowY = y + 62 + i * 48;
    const level = upgradeLevel(item.id);
    const maxed = level >= item.max;
    const affordable = saveData.moonDust >= upgradeCost(item);
    ctx.fillStyle = maxed ? "rgba(126, 218, 194, 0.12)" : affordable ? "rgba(255, 214, 107, 0.16)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(x, rowY - 24, 318, 40);
    if (affordable && !maxed) {
      ctx.strokeStyle = "#ffe18a";
      ctx.strokeRect(x, rowY - 24, 318, 40);
    }
    text(`${item.name} ${level}/${item.max}`, x + 10, rowY - 6, 15, "#fff4d8");
    text(item.desc, x + 10, rowY + 12, 12, "#b9d0ca");
    text(maxed ? "滿級" : affordable ? "可升級" : `${upgradeCost(item)}`, x + 258, rowY + 5, 13, affordable || maxed ? "#ffe8ad" : "#6f8587");
  });
  if (summary.affordableCount) {
    button(x, y + 316, 150, 34, "自動修行");
    text("依推薦順序購買可負擔升級", x + 168, y + 338, 13, "#ffe8ad");
  } else {
    text(summary.next ? `下一次修行需要 ${summary.next.cost} 月塵` : "永久修行已完成", x, y + 338, 13, "#6f8587");
  }
}

function drawSummonPanel(x, y) {
  const affordable = affordableLockedSummons();
  const next = nextLockedSummon();
  text(`月塵 ${saveData.moonDust}`, x, y, 18, "#ffe8ad");
  text(affordable.length ? `可締約 ${affordable.length} 名` : next ? `下一名 ${next.cost} 月塵` : "已全數締約", x + 196, y, 14, affordable.length ? "#ffe8ad" : "#a8c8c0");
  SUMMONS.forEach((item, i) => {
    const rowY = y + 48 + i * 62;
    const owned = saveData.unlockedSummons.includes(item.id);
    const selected = selectedSummon().id === item.id;
    ctx.fillStyle = selected ? "rgba(126, 218, 194, 0.22)" : owned ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)";
    ctx.fillRect(x, rowY - 30, 318, 52);
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(x + 22, rowY - 4, 12, 0, TWO_PI);
    ctx.fill();
    text(item.name, x + 48, rowY - 9, 17, "#fff4d8");
    text(item.desc, x + 48, rowY + 12, 12, "#b9d0ca");
    text(selected ? "使用中" : owned ? "選用" : `${item.cost}`, x + 254, rowY + 5, 13, owned || saveData.moonDust >= item.cost ? "#ffe8ad" : "#6f8587");
  });
  if (affordable.length) {
    button(x, y + 304, 150, 34, "自動締約");
    text("解鎖可負擔伙伴並選用最新伙伴", x + 168, y + 326, 13, "#ffe8ad");
  } else {
    text(next ? `累積月塵後可締約 ${next.name}` : "所有伙伴都可在戰鬥中提供支援。", x, y + 326, 13, "#6f8587");
  }
}

function drawRecordsPanel(x, y) {
  ctx.fillStyle = "rgba(5, 13, 16, 0.78)";
  ctx.fillRect(x - 18, y - 34, 394, 354);
  ctx.strokeStyle = "rgba(126, 218, 194, 0.28)";
  ctx.strokeRect(x - 17.5, y - 33.5, 393, 353);

  recordTabs().forEach(([id, label], i) => {
    const bx = x + i * 78;
    ctx.fillStyle = state.recordsTab === id ? "#5c7772" : "#172329";
    ctx.fillRect(bx, y - 22, 68, 24);
    center(label, bx + 34, y - 5, 13, "#fff4d8");
  });

  if (state.recordsTab === "overview") {
    const story = storyProgressSummary();
    const tracker = completionTrackerSummary();
    const collection = collectionSummary();
    const rows = [
      ["最高月庭分", saveData.bestGarden || 0],
      ["累積擊殺", saveData.lifetimeKills || 0],
      ["完成培育", saveData.clears || 0],
      ["記憶碎片", `${saveData.memoryFragments.length}/8`],
      ["當前裝備", selectedEquipment().name],
      ["召喚伙伴", selectedSummon().name]
    ];
    rows.forEach(([label, value], i) => {
      text(label, x, y + 24 + i * 27, 14, "#a8c8c0");
      text(String(value), x + 168, y + 24 + i * 27, 14, "#fff4d8");
    });
    text(`主線獎勵 ${story.claimableCount ? `${story.claimableCount} 可領` : "暫無可領"}`, x, y + 196, 15, story.claimableCount ? "#ffe18a" : "#a8c8c0");
    text(`完整度 ${tracker.completed}/${tracker.total} · ${tracker.percent}%`, x + 174, y + 196, 14, "#ffe8ad");
    text(`收藏 ${collection.completed}/${collection.total} · ${collection.percent}%`, x, y + 218, 13, "#7edac2");
    collection.rows.slice(0, 5).forEach((row, i) => {
      const bx = x + 118 + i * 39;
      ctx.fillStyle = row.done ? row.color : "rgba(255,255,255,0.10)";
      ctx.beginPath();
      ctx.arc(bx, y + 214, 7, 0, TWO_PI);
      ctx.fill();
      text(row.label, bx - 12, y + 234, 9, row.done ? row.color : "#6f8587");
    });
    if (story.claimableCount) button(x, y + 240, 150, 32, `領取 +${story.claimableDust}`);
    else text(fitText(story.current.objective, 296, 13), x, y + 250, 13, "#d9e3df");
    story.rows.slice(0, 2).forEach((chapter, i) => {
      const rowY = y + 282 + i * 26;
      const status = chapter.claimable ? "可領" : chapter.claimed ? "已領" : chapter.done ? "完成" : chapter.progress;
      ctx.fillStyle = chapter.claimable ? "rgba(255, 214, 107, 0.14)" : "rgba(255,255,255,0.045)";
      ctx.fillRect(x, rowY - 18, 318, 24);
      text(`${chapter.number}. ${fitText(chapter.title.replace(/^[一二三四五]章：/, ""), 132, 13)}`, x + 10, rowY - 1, 13, "#fff4d8");
      text(status, x + 194, rowY - 1, 12, chapter.claimable ? "#ffe18a" : chapter.claimed ? "#7edac2" : "#a8c8c0");
      text(`+${chapter.rewardDust}`, x + 268, rowY - 1, 12, "#ffe8ad");
    });
    return;
  }

  if (state.recordsTab === "enemies") {
    enemyCodexRows().forEach(([name, desc], i) => {
      const rowY = y + 28 + i * 44;
      text(name, x, rowY, 16, "#ffe8ad");
      wrap(desc, x + 82, rowY, 222, 16, "#d9e3df");
    });
    text(`Boss 節點：${BOSS_NODES.join(" / ")}`, x, y + 304, 14, "#ffe8ad");
    return;
  }

  if (state.recordsTab === "skills") {
    const detail = elementCodexDetail();
    elementCodexRows().forEach(([name, desc], i) => {
      const id = elementCodexMeta()[i]?.id || "fire";
      const by = y + 30 + i * 37;
      const selected = detail.id === id;
      ctx.fillStyle = selected ? "rgba(126, 218, 194, 0.18)" : "rgba(255,255,255,0.05)";
      ctx.fillRect(x, by - 23, 144, 31);
      ctx.strokeStyle = selected ? elementColor(id) : "rgba(180,220,215,0.16)";
      ctx.strokeRect(x + 0.5, by - 22.5, 143, 30);
      text(`${name}系`, x + 12, by - 3, 15, elementColor(id));
      text(desc.split("，")[0], x + 58, by - 3, 12, selected ? "#fff4d8" : "#a8c8c0");
    });

    const dx = x + 166;
    text(detail.label, dx, y + 28, 24, detail.color);
    text(detail.role, dx + 92, y + 28, 15, "#ffe8ad");
    text("核心", dx, y + 62, 13, "#a8c8c0");
    text(detail.unlock.name, dx + 52, y + 62, 15, "#fff4d8");
    wrap(compactCodexText(detail.unlock.desc, 24), dx, y + 86, 210, 14, "#d9e3df");
    text("三條分支", dx, y + 126, 13, "#a8c8c0");
    detail.branches.forEach((branch, i) => {
      const rowY = y + 154 + i * 42;
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.fillRect(dx, rowY - 24, 218, 34);
      drawUpgradeIcon(branch.name, dx + 18, rowY - 6, 34);
      text(branch.name, dx + 42, rowY - 10, 14, "#fff4d8");
      text(compactCodexText(branch.desc, 17), dx + 42, rowY + 7, 11, "#a8c8c0");
    });
    if (detail.evolution) {
      text("滿級進化", dx, y + 286, 13, "#d6a33f");
      text(`${detail.evolution.from} -> ${detail.evolution.name}`, dx + 80, y + 286, 13, "#ffe8ad");
    }
    wrap(detail.advice, x, y + 318, 306, 15, "#ffe8ad");
    return;
  }

  ruleCodexRows().forEach((line, i) => {
    wrap(line, x, y + 32 + i * 58, 308, 17, i === 0 ? "#ffe8ad" : "#d9e3df");
  });
}

function drawSettingsPanel(x, y) {
  const mood = musicMoodSummary();
  text("聲音", x, y, 18, "#ffe8ad");
  text(audioMuted ? "音樂與音效：關閉" : "音樂與音效：開啟", x + 86, y, 17, "#d9e3df");
  button(x, y + 18, 144, 40, audioMuted ? "開啟音樂" : "關閉音樂");
  button(x + 162, y + 18, 144, 40, "全螢幕");
  text(`音樂層：${mood.label}  ${mood.bpm} BPM`, x, y + 76, 13, audioMuted ? "#6f8587" : "#7edac2");

  text("可讀性", x, y + 104, 18, "#ffe8ad");
  const readableButtons = [
    ["screenShake", settingEnabled("screenShake") ? "震動：開" : "震動：關"],
    ["damageNumbers", settingEnabled("damageNumbers") ? "傷害數字：開" : "傷害數字：關"],
    ["hints", settingEnabled("hints") ? "提示：開" : "提示：關"]
  ];
  readableButtons.forEach(([, label], i) => {
    const bx = x + (i % 2) * 162;
    const by = y + 124 + Math.floor(i / 2) * 44;
    button(bx, by, 144, 36, label);
  });

  text("操作", x, y + 214, 18, "#ffe8ad");
  const controls = [
    "A/D 或方向鍵：移動",
    "Shift / Space：衝刺閃避",
    "自動攻擊：朝最近敵人發射符咒",
    "觸控：左下拖曳移動，右下閃避",
    "Esc：戰鬥中暫停"
  ];
  controls.forEach((line, i) => text(line, x + 14, y + 242 + i * 20, 13, "#d9e3df"));

  text("存檔", x, y + 360, 18, "#ffe8ad");
  text(`遊玩 ${saveData.runsPlayed || 0} 次  記憶 ${saveData.memoryFragments.length}/8  月塵 ${saveData.moonDust}`, x + 66, y + 360, 13, "#a8c8c0");
  if (state.resetConfirm) {
    text("確認後會清空本機進度", x, y + 386, 13, "#ffb4a8");
    button(x, y + 400, 144, 36, "確認重置");
    button(x + 162, y + 400, 144, 36, "取消");
  } else {
    button(x, y + 400, 306, 36, "重置存檔");
  }
}

function handleSettingsClick(x, y) {
  if (x >= 638 && x <= 782 && y >= 216 && y <= 256) {
    toggleAudioMute();
    draw();
    return;
  }
  if (x >= 800 && x <= 944 && y >= 216 && y <= 256) {
    canvas.requestFullscreen?.();
    state.message = "已送出全螢幕請求";
    draw();
    return;
  }
  const settingsButtons = [
    ["screenShake", 638, 322, 782, 358],
    ["damageNumbers", 800, 322, 944, 358],
    ["hints", 638, 366, 782, 402]
  ];
  for (const [key, x1, y1, x2, y2] of settingsButtons) {
    if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
      toggleGameSetting(key);
      draw();
      return;
    }
  }
  if (!state.resetConfirm && x >= 638 && x <= 944 && y >= 598 && y <= 634) {
    requestSaveReset();
    draw();
    return;
  }
  if (state.resetConfirm && x >= 638 && x <= 782 && y >= 598 && y <= 634) {
    confirmSaveReset();
    draw();
    return;
  }
  if (state.resetConfirm && x >= 800 && x <= 944 && y >= 598 && y <= 634) {
    cancelSaveReset();
    draw();
    return;
  }
  state.message = "設定頁可切換音樂、全螢幕，或管理存檔。";
  draw();
}

function handleRecordsClick(x, y) {
  if (y >= 176 && y <= 200) {
    const index = Math.floor((x - 638) / 78);
    const tab = recordTabs()[index];
    if (tab && x >= 638 + index * 78 && x <= 638 + index * 78 + 68) {
      state.recordsTab = tab[0];
      state.message = `圖鑑：${tab[1]}`;
      draw();
      return;
    }
  }
  if (state.recordsTab === "overview" && x >= 638 && x <= 788 && y >= 438 && y <= 470) {
    claimAllStoryRewards();
    draw();
    return;
  }
  if (state.recordsTab === "skills" && x >= 638 && x <= 782 && y >= 205 && y <= 460) {
    const index = Math.floor((y - 205) / 37);
    const meta = elementCodexMeta()[index];
    if (meta) {
      state.codexElement = meta.id;
      state.message = `流派：${meta.label}系`;
      draw();
      return;
    }
  }
  state.message = "圖鑑可切換概覽、敵人、流派與規則。";
  draw();
}

function handlePauseContentClick(x, y) {
  if (state.pauseTab === "skills") {
    if (x >= 352 && x <= 644 && y >= 258 && y <= 468) {
      const index = Math.floor((y - 258) / 42);
      if (index >= 0 && index < MAX_ACTIVE_SKILLS) {
        const skill = activeSkillsForView()[index];
        state.pauseSkillIndex = index;
        state.message = skill ? `查看技能：${skill.name}` : "這格主動技能尚未取得";
        draw();
        return true;
      }
    }
    if (x >= 352 && x <= 644 && y >= 506 && y <= 590) {
      const index = Math.floor((y - 506) / 28);
      const skill = passiveSkillsForView()[index];
      if (skill) {
        state.pauseSkillIndex = MAX_ACTIVE_SKILLS + index;
        state.message = `查看被動：${skill.name}`;
        draw();
        return true;
      }
    }
  }
  if (state.pauseTab === "settings") {
    if (x >= 352 && x <= 520 && y >= 280 && y <= 318) {
      toggleAudioMute();
      draw();
      return true;
    }
    if (x >= 542 && x <= 710 && y >= 280 && y <= 318) {
      canvas.requestFullscreen?.();
      state.message = "已送出全螢幕請求";
      draw();
      return true;
    }
    const settingButtons = [
      ["screenShake", 352, 332, 520, 368],
      ["damageNumbers", 542, 332, 710, 368],
      ["hints", 732, 332, 900, 368]
    ];
    for (const [key, x1, y1, x2, y2] of settingButtons) {
      if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        toggleGameSetting(key);
        draw();
        return true;
      }
    }
  }
  return false;
}

function drawLobbyShrine() {
  ctx.save();
  const hall = ctx.createLinearGradient(0, 0, 0, H);
  hall.addColorStop(0, "rgba(22, 17, 14, 0.18)");
  hall.addColorStop(0.48, "rgba(94, 74, 49, 0.14)");
  hall.addColorStop(1, "rgba(4, 4, 5, 0.50)");
  ctx.fillStyle = hall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(220, 198, 142, 0.12)";
  ctx.fillRect(470, 58, 176, 470);
  ctx.fillStyle = "rgba(92, 57, 42, 0.18)";
  for (const x of [120, 340, 812, 1040]) {
    ctx.fillRect(x, 42, 34, 520);
    ctx.fillStyle = "rgba(35, 23, 20, 0.18)";
    ctx.fillRect(x - 12, 146, 58, 18);
    ctx.fillStyle = "rgba(92, 57, 42, 0.18)";
  }
  ctx.fillStyle = "rgba(245, 232, 192, 0.10)";
  for (let i = 0; i < 9; i++) {
    const x = 386 + (i % 3) * 58;
    const y = 160 + Math.floor(i / 3) * 54;
    ctx.fillRect(x, y, 34, 42);
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(0, H - 92, W, 92);
  ctx.restore();
}

function drawTopProfile() {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(36, 22, 310, 62);
  ctx.strokeStyle = "#e9eadf";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(62, 53, 24, 0, TWO_PI);
  ctx.stroke();
  center(`${saveData.playerLevel || 1}`, 62, 63, 18, "#fff4d8");
  text("月影貓符師", 96, 49, 18, "#fff4d8");
  text(fragmentLabel(), 96, 72, 13, "#a8e6ba");
  ctx.restore();
}

function fragmentLabel() {
  const fragment = selectedFragment();
  return fragment ? fragment.name : "尚未形成記憶碎片";
}

function drawTopResource(x, y, color, label, value, iconId) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(x, y, 130, 30);
  if (!(iconId && drawUiIcon(iconId, x + 18, y + 15, 26))) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 18, y + 15, 8, 0, TWO_PI);
    ctx.fill();
  }
  text(`${label} ${value}`, x + 34, y + 21, 15, "#f7f1de");
  ctx.restore();
}

function drawTopIcon(x, y, value) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.46)";
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, TWO_PI);
  ctx.fill();
  center(value, x, y + 8, 20, "#fff4d8");
  ctx.restore();
}

function drawEventPanel(x, y, title, desc) {
  ctx.save();
  const grd = ctx.createLinearGradient(x, y, x + 282, y + 84);
  grd.addColorStop(0, "#f1e0b4");
  grd.addColorStop(1, "#566d68");
  ctx.fillStyle = grd;
  ctx.fillRect(x, y, 282, 84);
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.fillRect(x + 8, y + 8, 266, 68);
  text(title, x + 28, y + 34, 17, "#fffdf0");
  text(desc, x + 28, y + 62, 16, "#fffdf0");
  ctx.restore();
}

function drawHomeNav(x, y, label, icon, active) {
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.58;
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(x - 24, y - 32, 72, 78);
  center(icon, x + 12, y + 2, 34, "#ffffff");
  center(label, x + 12, y + 34, 13, "#ffffff");
  ctx.restore();
}

function drawBottomDock() {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
  ctx.fillRect(0, 628, W, 92);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.moveTo(0, 628);
  ctx.lineTo(W, 628);
  ctx.stroke();
  ctx.restore();
}

function drawSideButton(x, y, title, sub) {
  ctx.save();
  ctx.fillStyle = "rgba(239, 241, 234, 0.82)";
  ctx.beginPath();
  ctx.roundRect?.(x, y, 150, 64, 20);
  if (!ctx.roundRect) ctx.fillRect(x, y, 150, 64);
  else ctx.fill();
  text(title, x + 58, y + 28, 18, "#33383a");
  text(sub, x + 58, y + 50, 13, "#62696c");
  center("●", x + 28, y + 42, 30, "#3b4648");
  ctx.restore();
}

function drawGardenBadge(x, y, fragment) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 246, 226, 0.88)";
  ctx.beginPath();
  ctx.arc(x + 58, y + 58, 56, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = fragment ? "#f2c56e" : "#87908f";
  ctx.lineWidth = 4;
  ctx.stroke();
  center("月", x + 58, y + 70, 42, fragment ? "#513a64" : "#596061");
  text(fragment ? "月之庭園" : "未解鎖", x + 8, y + 132, 17, "#fff4d8");
  ctx.restore();
}

function drawMissionPicker(x, y, fragment) {
  const selected = selectedMissionChoice();
  text("選擇模式", x + 6, y - 14, 17, "#fff4d8");
  MISSION_CHOICES.forEach((mission, i) => {
    const rowY = y + i * 58;
    const locked = mission.id === "garden" && !fragment;
    const active = selected.id === mission.id;
    ctx.save();
    ctx.globalAlpha = locked ? 0.55 : 1;
    ctx.fillStyle = active ? "rgba(126, 218, 194, 0.24)" : "rgba(9, 18, 22, 0.78)";
    ctx.strokeStyle = active ? "#7edac2" : "#40565a";
    ctx.lineWidth = active ? 3 : 2;
    ctx.fillRect(x, rowY, 330, 48);
    ctx.strokeRect(x, rowY, 330, 48);
    center(mission.key, x + 24, rowY + 31, 18, active ? "#ffe8ad" : "#a8c8c0");
    text(mission.title, x + 52, rowY + 21, 18, locked ? "#aab2b3" : "#fff4d8");
    text(locked ? "未解鎖：需要記憶碎片" : mission.sub, x + 52, rowY + 39, 12, locked ? "#7b8587" : "#a8c8c0");
    ctx.restore();
  });
}

function drawPlayButton(x, y, fragment) {
  const mission = selectedMissionChoice();
  const locked = !canStartMission(mission.id);
  ctx.save();
  const grd = ctx.createLinearGradient(x, y, x + 330, y + 68);
  grd.addColorStop(0, locked ? "rgba(80, 88, 90, 0.84)" : "rgba(255, 255, 255, 0.88)");
  grd.addColorStop(1, locked ? "rgba(38, 46, 48, 0.84)" : "rgba(178, 190, 126, 0.86)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.roundRect?.(x, y, 330, 68, 34);
  if (!ctx.roundRect) ctx.fillRect(x, y, 330, 68);
  else ctx.fill();
  text(mission.title, x + 36, y + 24, 15, locked ? "#c9d0cf" : "#61706a");
  center(locked ? "未解鎖" : "開始探索", x + 168, y + 48, 30, "#fffdf1");
  text(locked ? "先培育碎片" : `${resolveMissionPreset(mission.id).targetKills} 擊殺`, x + 242, y + 58, 14, locked ? "#c9d0cf" : "#61706a");
  ctx.restore();
}

function drawRunPreviewPanel(x, y) {
  const mission = selectedMissionChoice();
  const preset = resolveMissionPreset(mission.id);
  const fragment = selectedFragment();
  const story = storyProgressSummary();
  const garden = mission.id === "garden" ? gardenMissionPreview(fragment) : null;
  ctx.save();
  ctx.fillStyle = "rgba(7, 13, 16, 0.72)";
  ctx.strokeStyle = "#40565a";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, 332, 144);
  ctx.strokeRect(x, y, 332, 144);
  text("戰鬥前確認", x + 18, y + 30, 19, "#fff4d8");
  text(`模式：${mission.title}`, x + 18, y + 58, 15, "#ffe8ad");
  if (garden) {
    text(`使用：${garden.title}`, x + 18, y + 82, 14, garden.available ? "#d9e3df" : "#ffb4a8");
    text(garden.available ? garden.lines[0] : garden.lines[0], x + 18, y + 106, 14, garden.available ? "#7edac2" : "#d9e3df");
    text(garden.available ? `最高分 ${garden.bestGarden} · 無魂火掉落，直接累積月塵` : garden.lines[1], x + 18, y + 130, 13, "#ffe8ad");
  } else {
    text(`目標：${preset.targetKills} 擊殺後挑戰終局首領`, x + 18, y + 82, 14, "#d9e3df");
    text(`初始生命：${Math.round(makeBaseStats().maxHp)}，無自動回血`, x + 18, y + 106, 14, "#d9e3df");
    text(`主線：${story.current.title} ${story.current.progress}`, x + 18, y + 130, 14, story.completed >= story.total ? "#7edac2" : "#ffe8ad");
  }
  ctx.restore();
}

function drawGrowthDashboardPanel(x, y) {
  const summary = homeDashboardSummary();
  const tracker = completionTrackerSummary();
  const collection = collectionSummary();
  const cards = [
    {
      tab: "missions",
      label: "任務獎勵",
      value: summary.rewards.claimable ? `${summary.rewards.claimable} 可領` : "無可領",
      sub: summary.rewards.claimable ? `+${summary.rewards.moonDust} 月塵` : "完成條件後領取",
      color: summary.rewards.claimable ? "#ffe18a" : "#8ea0a2"
    },
    {
      tab: "shop",
      label: "永久修行",
      value: `${summary.training.totalLevel}/${summary.training.maxLevel}`,
      sub: summary.training.affordable ? `${summary.training.affordable} 項可升級` : summary.training.next ? `${summary.training.next.cost} 月塵` : "已滿級",
      color: summary.training.affordable ? "#7edac2" : "#a8c8c0"
    },
    {
      tab: "summon",
      label: "召喚契約",
      value: `${summary.summon.owned}/${summary.summon.total}`,
      sub: summary.summon.affordable ? `${summary.summon.next} 可解鎖` : summary.summon.next,
      color: summary.summon.affordable ? "#ffe18a" : "#c4d4d0"
    }
  ];
  ctx.save();
  ctx.fillStyle = "rgba(7, 13, 16, 0.76)";
  ctx.strokeStyle = "#40565a";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, 332, 112);
  ctx.strokeRect(x, y, 332, 112);
  text("成長總覽", x + 18, y + 28, 18, "#fff4d8");
  text(`完整度 ${tracker.completed}/${tracker.total} · ${tracker.percent}%`, x + 126, y + 28, 13, "#ffe8ad");
  const barW = 290;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x + 20, y + 42, barW, 7);
  ctx.fillStyle = "#7edac2";
  ctx.fillRect(x + 20, y + 42, barW * clamp(tracker.percent / 100, 0, 1), 7);
  cards.forEach((card, i) => {
    const cx = x + 14 + i * 104;
    const active = state.menuTab === card.tab;
    ctx.fillStyle = active ? "rgba(126, 218, 194, 0.16)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(cx, y + 60, 96, 38);
    ctx.strokeStyle = active ? "#7edac2" : "rgba(255,255,255,0.08)";
    ctx.strokeRect(cx, y + 60, 96, 38);
    text(card.label, cx + 8, y + 76, 11, "#a8c8c0");
    text(card.value, cx + 8, y + 92, 13, card.color);
  });
  text(`收藏 ${collection.percent}% · 下個 ${collection.next.label} ${collection.next.status}`, x + 18, y + 108, 12, "#ffe8ad");
  collection.rows.slice(0, 5).forEach((row, i) => {
    const bx = x + 260 + i * 12;
    ctx.fillStyle = row.done ? row.color : "rgba(255,255,255,0.09)";
    ctx.beginPath();
    ctx.arc(bx, y + 104, 5, 0, TWO_PI);
    ctx.fill();
  });
  ctx.restore();
}

function drawCompletionTrackerRows(x, y, rows, compact = false) {
  rows.forEach((row, i) => {
    const rowY = y + i * (compact ? 42 : 50);
    ctx.fillStyle = row.done ? "rgba(126, 218, 194, 0.13)" : "rgba(255,255,255,0.045)";
    ctx.fillRect(x, rowY - 22, compact ? 276 : 318, compact ? 34 : 40);
    ctx.strokeStyle = row.done ? "rgba(126, 218, 194, 0.42)" : "rgba(255,255,255,0.08)";
    ctx.strokeRect(x + 0.5, rowY - 21.5, compact ? 275 : 317, compact ? 33 : 39);
    text(row.label, x + 10, rowY - 6, compact ? 13 : 15, row.color);
    text(row.progress, x + (compact ? 66 : 78), rowY - 6, compact ? 13 : 15, "#fff4d8");
    text(row.status, x + (compact ? 202 : 244), rowY - 6, compact ? 12 : 13, row.done ? "#7edac2" : row.color);
    text(fitText(row.next, compact ? 190 : 240, compact ? 11 : 12), x + 10, rowY + 10, compact ? 11 : 12, "#a8c8c0");
  });
}

function drawHomeGuidancePanel(x, y, h = 206) {
  const rows = homeGuidanceRows();
  const next = homeNextAction();
  const compact = h < 190;
  const secondary = rows.filter((row) => row.title !== next.title).slice(0, compact ? 2 : 3);
  ctx.save();
  ctx.fillStyle = "rgba(7, 13, 16, 0.76)";
  ctx.strokeStyle = "#40565a";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, 332, h);
  ctx.strokeRect(x, y, 332, h);
  text("下一步推薦", x + 18, y + 28, 19, "#fff4d8");
  text(next.status, x + 248, y + 28, 13, next.color);
  ctx.fillStyle = "rgba(126, 218, 194, 0.13)";
  ctx.fillRect(x + 12, y + 42, 308, compact ? 54 : 62);
  ctx.strokeStyle = next.color;
  ctx.strokeRect(x + 12.5, y + 42.5, 307, compact ? 53 : 61);
  text(next.title, x + 26, y + 64, 16, "#fff4d8");
  text(compactCodexText(next.body, compact ? 28 : 32), x + 26, y + 84, 12, "#a8c8c0");
  center(next.cta, x + 272, y + (compact ? 76 : 80), 13, next.color);
  const start = compact ? 118 : 130;
  secondary.forEach((row, i) => {
    const rowY = y + start + i * 28;
    const active = state.menuTab === row.tab || (row.tab === "home" && state.menuTab === "home");
    ctx.fillStyle = active ? "rgba(126, 218, 194, 0.14)" : "rgba(255,255,255,0.04)";
    ctx.fillRect(x + 12, rowY - 18, 308, 25);
    center(`${i + 1}`, x + 27, rowY + 2, 13, row.color);
    text(row.title, x + 44, rowY - 2, 14, "#fff4d8");
    text(row.status, x + 252, rowY - 2, 12, row.color);
  });
  text("點擊推薦或步驟可直接前往", x + 18, y + h - 12, 12, "#6f8587");
  ctx.restore();
}

function drawBriefingInfoCard(x, y, w, h, title, body, accent = "#7edac2") {
  const lines = Array.isArray(body)
    ? body
    : String(body || "").split(/[。；]/).map((line) => line.trim()).filter(Boolean);
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.055)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(126, 218, 194, 0.16)";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 5, h);
  text(title, x + 18, y + 25, 16, "#fff4d8");
  lines.slice(0, 4).forEach((line, i) => {
    text(fitText(line, w - 36, 13), x + 18, y + 52 + i * 19, 13, i === 0 ? "#fff4d8" : "#b9d0ca");
  });
  ctx.restore();
}

function drawObjectiveCompass(x, y, w, h, compass, compact = false) {
  const rows = compass?.rows || [];
  ctx.save();
  ctx.fillStyle = compact ? "rgba(255,255,255,0.045)" : "rgba(5, 13, 16, 0.72)";
  ctx.strokeStyle = "#40565a";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  text(compass?.title || "本輪目標", x + 16, y + 26, compact ? 17 : 19, "#fff4d8");
  if (!compact && w >= 300) text(fitText(compass?.next?.title || "", w - 156, 13), x + 128, y + 26, 13, compass?.next?.color || "#7edac2");
  rows.slice(0, 3).forEach((row, i) => {
    const rowY = y + (compact ? 48 : 56) + i * (compact ? 48 : 58);
    ctx.fillStyle = row.done ? "rgba(126, 218, 194, 0.13)" : "rgba(255,255,255,0.045)";
    ctx.fillRect(x + 12, rowY - 22, w - 24, compact ? 38 : 46);
    ctx.fillStyle = row.color;
    ctx.fillRect(x + 12, rowY - 22, 4, compact ? 38 : 46);
    text(row.label, x + 26, rowY - 4, 12, "#a8c8c0");
    text(fitText(row.title, compact ? 112 : 134, 14), x + 72, rowY - 4, 14, "#fff4d8");
    text(row.done ? "完成" : row.status, x + w - 84, rowY - 4, 12, row.color);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(x + 72, rowY + 8, w - 168, 5);
    ctx.fillStyle = row.color;
    ctx.fillRect(x + 72, rowY + 8, (w - 168) * clamp(row.ratio || 0, 0, 1), 5);
    if (!compact) text(fitText(row.body, w - 44, 11), x + 26, rowY + 28, 11, "#a8c8c0");
  });
  ctx.restore();
}

function drawRunBriefing() {
  const summary = runBriefingSummary();
  ctx.save();
  ctx.fillStyle = "rgba(1, 5, 7, 0.70)";
  ctx.fillRect(0, 0, W, H);
  panel(224, 82, 832, 548);
  ctx.fillStyle = "rgba(126, 218, 194, 0.08)";
  ctx.fillRect(246, 116, 788, 66);
  text("出擊簡報", 262, 150, 30, "#fff4d8");
  text(`${summary.title} · ${summary.subtitle}`, 434, 148, 18, "#ffe8ad");
  text(summary.locked ? "此模式尚未解鎖" : "確認目標後出發", 862, 150, 15, summary.locked ? "#ffb4a8" : "#7edac2");

  drawObjectiveCompass(250, 206, 260, 210, summary.compass);
  ctx.fillStyle = "rgba(126, 218, 194, 0.08)";
  ctx.fillRect(268, 424, 224, 66);
  text(`裝備：${summary.loadout.equipment}`, 268, 444, 14, "#d9e3df");
  text(`召喚：${summary.loadout.summon}`, 268, 466, 14, "#d9e3df");
  if (sprites.complete) {
    drawSprite(ROW.heroIdle, Math.floor(state.time * 8) % 12, 380, 488, 118, false, 0, 1, 67, 122);
    drawSprite(ROW.ghoul, 0, 306, 492, 58, false, 0, 1, 64, 112);
    drawSprite(ROW.mage, 0, 458, 492, 62, true, 0, 1, 64, 112);
  }

  drawBriefingInfoCard(538, 206, 220, 120, "章節序幕", [summary.story.scene.mood, summary.story.scene.opening, `進度 ${summary.story.progress}`], summary.story.color);
  drawBriefingInfoCard(782, 206, 220, 120, "局內委託", summary.challenge ? [summary.challenge.name, summary.challenge.desc, `完成 +${summary.challenge.reward} 月塵`] : ["本局沒有額外委託"], "#ffe18a");
  drawBriefingInfoCard(538, 350, 220, 120, "戰鬥規則", summary.rules.join("。"), "#7edac2");
  const memoryText = summary.runType === "garden"
    ? summary.loadout.garden?.available
      ? [summary.loadout.garden.title, ...summary.loadout.garden.lines]
      : ["月之庭園需要先取得記憶碎片"]
    : [summary.story.scene.battle, summary.story.scene.success];
  drawBriefingInfoCard(782, 350, 220, 120, summary.runType === "garden" ? "記憶配置" : "攻略提示", memoryText, "#c18cff");

  button(284, 552, 166, 44, "返回");
  button(806, 552, 190, 44, summary.locked ? "未解鎖" : "出發");
  center("Enter 出發 · Esc 返回", W / 2, 610, 15, "#a8c8c0");
  ctx.restore();
}

function stageCard(x, y, w, h, n, title, desc, locked) {
  ctx.save();
  ctx.globalAlpha = locked ? 0.54 : 1;
  const grd = ctx.createLinearGradient(x, y, x + w, y + h);
  grd.addColorStop(0, locked ? "#1b2025" : "#15353a");
  grd.addColorStop(1, locked ? "#0d1115" : "#10202a");
  ctx.fillStyle = grd;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = locked ? "#465056" : "#7db6aa";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  center(n, x + 36, y + 54, 30, "#ffe8ad");
  center(title, x + w / 2, y + 152, 32, "#fff4d8");
  wrap(desc, x + 34, y + 205, w - 68, 24, locked ? "#aab2b3" : "#d9e3df");
  if (!locked && sprites.complete) {
    drawSprite(ROW.heroIdle, 0, x + w - 80, y + 120, 115, false, 0, 1, 64, 112);
    drawSprite(ROW.ghoul, 0, x + 82, y + 262, 82, false, 0, 1, 64, 112);
  }
  if (locked) center("LOCKED", x + w / 2, y + 264, 26, "#eef1f1");
  ctx.restore();
}

function drawLevelUp() {
  const summary = levelChoiceSummary();
  ctx.fillStyle = "rgba(2, 7, 9, 0.66)";
  ctx.fillRect(0, 0, W, H);
  center("選擇符咒分支", W / 2, 120, 36, "#fff4d8");
  center(`Lv.${state.level}  流派：${elementName(state.stats.element)}`, W / 2, 160, 18, "#a8c8c0");
  center(`主動槽 ${summary.activeSlots}/${MAX_ACTIVE_SKILLS}  ·  被動 ${summary.passiveCount}  ·  同名技能會升級，不會重複佔槽`, W / 2, 188, 16, "#ffe8ad");
  drawLevelChoiceBrief(summary);
  for (let i = 0; i < state.options.length; i++) {
    const x = 100 + i * 393;
    card(x, 246, 320, 258, state.options[i], i + 1, summary.recommended?.index === i);
  }
  drawUpgradeSlots(W / 2 - 184, 560);
}

function drawLevelChoiceBrief(summary) {
  const x = 360;
  const y = 202;
  const w = 560;
  const h = 34;
  ctx.save();
  ctx.fillStyle = "rgba(7, 13, 16, 0.82)";
  ctx.strokeStyle = summary.recommended?.decision?.tone || "#7edac2";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  text(summary.headline, x + 18, y + 23, 15, "#fff4d8");
  text(fitText(summary.body, 380, 13), x + 150, y + 23, 13, "#d9e3df");
  if (summary.recommended) center(`推薦 ${summary.recommended.index + 1}`, x + w - 48, y + 23, 13, "#ffe8ad");
  ctx.restore();
}

function drawBossReward() {
  ctx.fillStyle = "rgba(2, 7, 9, 0.72)";
  ctx.fillRect(0, 0, W, H);
  center("Boss 戰利品", W / 2, 116, 38, "#fff4d8");
  center("選擇一個本局強化，戰鬥會在選完後繼續", W / 2, 156, 18, "#a8c8c0");
  for (let i = 0; i < state.bossRewardOptions.length; i++) {
    const x = 100 + i * 393;
    bossRewardCard(x, 220, 320, 252, state.bossRewardOptions[i], i + 1);
  }
  if (state.bossRewardSource) {
    center(`已討伐 Boss  ·  +${state.runRewards.moonDust} 月塵`, W / 2, 548, 18, "#7fe0d4");
  }
}

function drawEventChoice() {
  ctx.fillStyle = "rgba(2, 7, 9, 0.72)";
  ctx.fillRect(0, 0, W, H);
  center("異變抉擇", W / 2, 116, 38, "#fff4d8");
  center("選擇一個局內事件：有收益，也有壓力", W / 2, 156, 18, "#a8c8c0");
  for (let i = 0; i < state.eventChoiceOptions.length; i++) {
    const x = 100 + i * 393;
    eventChoiceCard(x, 220, 320, 252, state.eventChoiceOptions[i], i + 1);
  }
  center("1 / 2 / 3 選擇，選完後戰鬥繼續", W / 2, 548, 18, "#7fe0d4");
}

function eventChoiceCard(x, y, w, h, option, n) {
  const decision = eventChoiceDecision(option);
  const isStory = option.source === "story";
  ctx.fillStyle = "#101b20";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = isStory ? (state.storyFocus?.color || "#ffe18a") : option.event === "focus" ? "#7edac2" : "#d6a33f";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  center(`${n}`, x + 28, y + 34, 24, "#ffe8ad");
  pill(x + w - 154, y + 24, 66, 26, option.type, "#647b79");
  pill(x + w - 82, y + 24, 58, 26, isStory ? "STORY" : "EVENT", isStory ? (state.storyFocus?.color || "#ffe18a") : option.event === "focus" ? "#4b8ca4" : "#d6a33f");
  const icon = eventChoiceIcon(option);
  if (icon) {
    ctx.save();
    ctx.fillStyle = "#061114";
    ctx.strokeStyle = "#7b6542";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 58, y + 92, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawUpgradeIcon(icon, x + 58, y + 92, 78);
  }
  text(option.name, x + 118, y + 88, 24, "#fff4d8");
  text(isStory ? fitText(option.storyTitle || "主線事件", 164, 15) : combatEventName(option.event), x + 118, y + 116, 15, isStory ? (state.storyFocus?.color || "#ffe18a") : option.event === "focus" ? "#7edac2" : "#d6a33f");
  text(fitText(option.desc, w - 142, 13), x + 118, y + 146, 13, "#b9d0ca");
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  ctx.fillRect(x + 18, y + 166, w - 36, 54);
  text(decision.title, x + 30, y + 187, 14, decision.tone);
  text(fitText(decision.body, w - 60, 12), x + 30, y + 207, 12, "#d9e3df");
  text(fitText(decision.risk, w - 44, 12), x + 22, y + h - 20, 12, isStory ? (state.storyFocus?.color || "#ffe18a") : option.event === "focus" || option.event === "sealField" ? "#7fe0d4" : "#ffe8ad");
}

function bossRewardCard(x, y, w, h, reward, n) {
  const decision = bossRewardDecision(reward);
  ctx.fillStyle = "#101b20";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#d6a33f";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  center(`${n}`, x + 28, y + 34, 24, "#ffe8ad");
  pill(x + w - 154, y + 24, 66, 26, reward.family, "#647b79");
  pill(x + w - 82, y + 24, 58, 26, "RUN", "#d6a33f");
  const icon = bossRewardIcon(reward);
  if (icon) {
    ctx.save();
    ctx.fillStyle = "#061114";
    ctx.strokeStyle = "#7b6542";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 58, y + 92, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawUpgradeIcon(icon, x + 58, y + 92, 78);
  }
  text(reward.name, x + 118, y + 88, 24, "#fff4d8");
  text("本局有效，不佔技能槽", x + 118, y + 116, 15, "#d6a33f");
  text(fitText(reward.desc, w - 142, 13), x + 118, y + 146, 13, "#b9d0ca");
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  ctx.fillRect(x + 18, y + 166, w - 36, 54);
  text(decision.title, x + 30, y + 187, 14, decision.tone);
  text(fitText(decision.body, w - 60, 12), x + 30, y + 207, 12, "#d9e3df");
  text("選擇後立即套用", x + 22, y + h - 20, 12, "#7fe0d4");
}

function drawPause() {
  ctx.fillStyle = "rgba(2, 7, 9, 0.72)";
  ctx.fillRect(0, 0, W, H);
  panel(300, 92, 680, 536);
  center("暫停", W / 2, 144, 38, "#fff4d8");
  center("Esc 繼續  ·  1-5 切換頁面", W / 2, 178, 17, "#a8c8c0");
  drawPauseTabs();
  if (state.pauseTab === "skills") drawPauseSkills(352, 242);
  else if (state.pauseTab === "stats") drawPauseStats(352, 242);
  else if (state.pauseTab === "missions") drawPauseMissions(352, 242);
  else if (state.pauseTab === "codex") drawPauseCodex(352, 242);
  else if (state.pauseTab === "settings") drawPauseSettings(352, 242);
  drawPauseActionButtons();
}

function drawPauseActionButtons() {
  button(426, 584, 180, 44, "繼續遊戲");
  button(674, 584, 180, 44, "回主畫面");
}

function pauseTabs() {
  return [
    ["skills", "技能", 336, 198, 104, 34],
    ["stats", "角色", 462, 198, 104, 34],
    ["missions", "任務", 588, 198, 104, 34],
    ["codex", "圖鑑", 714, 198, 104, 34],
    ["settings", "設定", 840, 198, 104, 34]
  ];
}

function drawPauseTabs() {
  for (const [id, label, x, y, w, h] of pauseTabs()) {
    ctx.fillStyle = state.pauseTab === id ? "#5c7772" : "#172329";
    ctx.fillRect(x, y, w, h);
    center(label, x + w / 2, y + 23, 17, "#fff4d8");
  }
}

function drawPauseSkills(x, y) {
  text("主動技能", x, y, 21, "#fff4d8");
  const active = activeSkillsForView();
  const inspected = pauseInspectableSkills();
  const selected = pauseSelectedSkill();
  for (let i = 0; i < MAX_ACTIVE_SKILLS; i++) {
    const skill = active[i];
    const rowY = y + 42 + i * 42;
    const selectedRow = state.pauseSkillIndex === i;
    ctx.fillStyle = selectedRow ? "rgba(126, 218, 194, 0.18)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(x, rowY - 26, 292, 42);
    if (selectedRow) {
      ctx.strokeStyle = "#7fe0d4";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, rowY - 26, 292, 42);
    }
    if (skill) {
      const icon = upgradeIcon(skill.name);
      if (icon) drawUpgradeIcon(icon, x + 24, rowY - 4, 34);
      text(`${skill.name} Lv.${skill.level}`, x + 52, rowY - 8, 16, "#fff4d8");
      text(skill.family, x + 52, rowY + 12, 13, "#a8c8c0");
    } else {
      text("空技能槽", x + 18, rowY - 2, 16, "#6f8587");
    }
  }
  text("被動", x, y + 252, 19, "#fff4d8");
  const passives = passiveSkillsForView();
  if (!passives.length) text("尚未取得被動", x + 18, y + 288, 15, "#6f8587");
  passives.slice(0, 3).forEach((skill, i) => {
    const rowY = y + 288 + i * 28;
    const selectedRow = state.pauseSkillIndex === MAX_ACTIVE_SKILLS + i;
    ctx.fillStyle = selectedRow ? "rgba(126, 218, 194, 0.16)" : "rgba(255,255,255,0.04)";
    ctx.fillRect(x, rowY - 22, 292, 26);
    text(`${skill.name} Lv.${skill.level}`, x + 16, rowY - 4, 15, "#d9e3df");
  });
  if (passives.length > 3) text(`另有 ${passives.length - 3} 項被動`, x + 18, y + 376, 13, "#a8c8c0");

  const detail = skillDetailSummary(selected);
  const dx = x + 340;
  text("技能詳情", dx, y, 21, "#fff4d8");
  panel(dx - 8, y + 28, 288, 292);
  if (selected) {
    const icon = upgradeIcon(selected.name);
    if (icon) drawUpgradeIcon(icon, dx + 30, y + 76, 56);
  }
  text(detail.title, dx + 74, y + 60, 19, detail.color);
  text(detail.subtitle, dx + 74, y + 86, 14, "#a8c8c0");
  wrap(detail.desc, dx + 14, y + 132, 246, 20, "#d9e3df");
  wrap(detail.next, dx + 14, y + 214, 246, 19, "#ffe8ad");
  text(`技能槽 ${active.length}/${MAX_ACTIVE_SKILLS}  可查看 ${inspected.length} 項`, dx + 14, y + 268, 14, "#7fe0d4");
  wrap(elementBuildSummary(), dx + 14, y + 296, 246, 17, elementColor(state.stats.element));
}

function drawPauseStats(x, y) {
  const phase = currentStagePhase();
  text("目前角色數值", x, y, 22, "#fff4d8");
  readableStatRows().forEach(([label, value], i) => {
    const rowY = y + 46 + i * 34;
    text(label, x, rowY, 17, "#a8c8c0");
    text(String(value), x + 220, rowY, 17, "#fff4d8");
  });
  text(`流派：${elementName(state.stats.element)}`, x + 390, y + 46, 18, elementColor(state.stats.element));
  text(`裝備：${selectedEquipment().name}`, x + 390, y + 84, 18, "#ffe8ad");
  text(`階段：${phase.name}`, x + 390, y + 122, 18, "#fff4d8");
  wrap(phase.objective, x + 390, y + 150, 220, 18, "#ffe8ad");
  wrap(selectedEquipment().desc, x + 390, y + 208, 210, 18, "#d9e3df");
  const damage = damageSourceSummary(2);
  text("輸出來源", x + 390, y + 270, 18, "#fff4d8");
  if (!damage.rows.length) {
    text("尚未造成有效傷害", x + 390, y + 300, 14, "#6f8587");
  } else {
    damage.rows.forEach((row, i) => {
      const by = y + 300 + i * 24;
      const barW = Math.max(10, Math.round(108 * row.percent / 100));
      text(fitText(row.name, 92, 14), x + 390, by, 14, "#d9e3df");
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x + 488, by - 12, 108, 8);
      ctx.fillStyle = i === 0 ? "#ffe18a" : "#7fe0d4";
      ctx.fillRect(x + 488, by - 12, barW, 8);
      text(`${row.percent}%`, x + 604, by, 13, "#a8c8c0");
    });
  }
}

function drawPauseMissions(x, y) {
  const phase = currentStagePhase();
  const challenge = runChallengeProgress();
  const story = storyProgressSummary();
  const focus = state.storyFocus || storyRunFocus();
  text("本局目標", x, y, 22, "#fff4d8");
  text(`${selectedMissionChoice().title}：${state.kills}/${state.targetKills} 擊殺`, x, y + 42, 18, "#ffe8ad");
  text(`主線焦點：${focus.title}`, x, y + 74, 17, focus.color || "#ffe18a");
  wrap(focus.battleNote, x, y + 104, 260, 18, "#d9e3df");
  text(`階段：${phase.name}`, x, y + 152, 15, "#a8c8c0");
  if (challenge) {
    text(`本局委託：${challenge.name}`, x, y + 184, 15, challenge.done ? "#ffe8ad" : "#7fe0d4");
    text(`${challenge.current}/${challenge.target}  +${challenge.reward} 月塵`, x, y + 210, 15, "#d9e3df");
  }
  text(`Boss 節點：${BOSS_NODES.join(" / ")}`, x, y + 240, 15, "#ffe8ad");
  text(`終局：${state.finalBossDefeated ? "已擊破" : state.finalBossActive ? "交戰中" : state.kills >= state.targetKills ? "即將現身" : "未達成"}`, x, y + 266, 15, state.finalBossActive ? "#ffe18a" : "#d9e3df");
  text(`已出現：${state.spawnedBossNodes.length ? state.spawnedBossNodes.join(" / ") : "尚未"}`, x, y + 292, 15, "#d9e3df");
  text(`強敵戰利品：Boss ${state.runRewards.bossKills} / 精英 ${state.runRewards.eliteKills} / +${state.runRewards.moonDust} 月塵`, x, y + 318, 14, "#7fe0d4");

  drawObjectiveCompass(x + 340, y, 272, 154, objectiveCompassSummary(), true);
  text(`主線 ${story.completed}/${story.total}：${story.current.reward}`, x + 340, y + 178, 13, "#7fe0d4");
  drawPauseRunLog(x + 340, y + 206, 3);
}

function drawPauseRunLog(x, y, maxRows = 4) {
  const log = runLogSummary();
  text("本局紀錄", x, y, 19, "#fff4d8");
  log.rows.slice(0, maxRows).forEach((row, i) => {
    const by = y + 24 + i * 34;
    ctx.fillStyle = i === 3 && log.threat.active ? "rgba(255, 180, 168, 0.10)" : "rgba(255,255,255,0.045)";
    ctx.fillRect(x, by - 16, 272, 30);
    ctx.fillStyle = row.color;
    ctx.fillRect(x, by - 16, 4, 30);
    text(row.label, x + 12, by - 2, 11, "#a8c8c0");
    text(fitText(row.title, 112, 12), x + 64, by - 2, 12, "#fff4d8");
    text(fitText(row.body, 188, 11), x + 64, by + 13, 11, row.color);
  });
}

function drawPauseCodex(x, y) {
  text("敵人圖鑑", x, y, 22, "#fff4d8");
  const enemies = [
    ["魑魅", "基礎近戰，數量多，用來穩定掉魂火。"],
    ["疾影", "靠近會加速貼身，保持橫向移動。"],
    ["咒師", "遠距離發射彈幕，優先保持距離。"],
    ["爆靈", "死亡會留下爆裂區，擊殺後立刻換位。"],
    ["護衛", "替附近敵人減傷，看到護陣先處理牠。"],
    ["巨怪 / Boss", "高血量壓迫目標，保留閃避處理彈幕。"]
  ];
  enemies.forEach(([name, desc], i) => {
    const rowY = y + 40 + i * 43;
    text(name, x, rowY, 16, "#ffe8ad");
    wrap(desc, x + 96, rowY, 210, 14, "#d9e3df");
  });

  text("技能規則", x + 340, y, 22, "#fff4d8");
  const rules = [
    "主動技能最多 5 種；同一技能重選會升級。",
    "火、水、雷、毒、影、聖、風會打開各自分支。",
    "被動不佔主動技能槽，會另外列入紀錄。",
    "滿級技能會觸發進化，強化該流派核心玩法。",
    "魂火只有靠近後才吸取；聚魂能擴大範圍。",
    "升級畫面會暫停戰鬥，選完才繼續。"
  ];
  rules.forEach((rule, i) => wrap(rule, x + 340, y + 42 + i * 50, 270, 18, i === 0 ? "#ffe8ad" : "#d9e3df"));
}

function drawPauseSettings(x, y) {
  const mood = musicMoodSummary();
  text("操作與設定", x, y, 22, "#fff4d8");
  button(x, y + 38, 168, 38, audioMuted ? "開啟音樂" : "關閉音樂");
  button(x + 190, y + 38, 168, 38, "全螢幕");
  text(`音樂層：${mood.label} / 強度 ${Math.round(mood.intensity * 100)}%`, x + 382, y + 62, 14, audioMuted ? "#6f8587" : "#7fe0d4");
  const settingButtons = [
    ["screenShake", settingEnabled("screenShake") ? "震動：開" : "震動：關"],
    ["damageNumbers", settingEnabled("damageNumbers") ? "傷害數字：開" : "傷害數字：關"],
    ["hints", settingEnabled("hints") ? "提示：開" : "提示：關"]
  ];
  settingButtons.forEach(([, label], i) => {
    const bx = x + i * 190;
    const by = y + 90;
    button(bx, by, 168, 36, label);
  });
  const rows = [
    ["Esc", "暫停 / 繼續"],
    ["Enter", "暫停時回主選單"],
    ["1-5", "切換分頁"],
    ["M", audioMuted ? "音樂：關閉" : "音樂：開啟"],
    ["F", "全螢幕"],
    ["Shift / Space", "衝刺 / 閃避"],
    ["滑鼠", "自動攻擊會朝最近敵人發射"],
    ["觸控", "左下拖曳移動，右下閃避"],
    ["魂火", "靠近後才會吸過來"],
    ["提示", "關鍵規則只會短暫出現"]
  ];
  rows.forEach(([key, value], i) => {
    const col = i >= 5 ? 1 : 0;
    const row = i % 5;
    const bx = x + col * 310;
    const by = y + 148 + row * 42;
    text(key, bx, by, 17, "#ffe8ad");
    wrap(value, bx + 106, by, 170, 17, "#d9e3df");
  });
}

function drawDead() {
  const summary = deathSummary();
  ctx.save();
  ctx.fillStyle = "rgba(1, 5, 7, 0.78)";
  ctx.fillRect(0, 0, W, H);
  panel(270, 108, 740, 504);
  text(summary.title, 320, 166, 42, "#fff4d8");
  text(summary.subtitle, 324, 204, 18, "#ffb4a8");
  text(`死因：${summary.cause}`, 324, 242, 19, "#ffe18a");

  const statRows = [
    ["存活", formatTime(summary.time)],
    ["擊殺", `${summary.kills}`],
    ["等級", `Lv.${summary.level}`],
    ["月塵", `+${summary.moonDust}`],
    ["階段", summary.phaseReached]
  ];
  statRows.forEach(([label, value], i) => {
    const sx = 324 + (i % 3) * 190;
    const sy = 282 + Math.floor(i / 3) * 62;
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.fillRect(sx, sy, 170, 46);
    text(label, sx + 12, sy + 18, 12, "#a8c8c0");
    text(fitText(value, 140, 16), sx + 12, sy + 38, 16, "#fff4d8");
    if (label === "月塵") drawUiIcon("moon_dust", sx + 150, sy + 24, 26);
  });

  text("下局建議", 324, 430, 20, "#fff4d8");
  summary.tips.forEach((tip, i) => {
    text(`${i + 1}. ${fitText(tip, 420, 14)}`, 324, 462 + i * 24, 14, i === 0 ? "#ffe18a" : "#d9e3df");
  });
  text("本局技能", 736, 430, 18, "#fff4d8");
  if (!summary.activeSkills.length) text("尚未取得主動技能", 736, 462, 14, "#8ea0a2");
  summary.activeSkills.slice(0, 4).forEach((skill, i) => {
    const y = 458 + i * 28;
    const icon = upgradeIcon(skill.name);
    if (icon) drawUpgradeIcon(icon, 752, y, 22);
    text(`${skill.name} Lv.${skill.level}`, 772, y + 6, 13, "#d9e3df");
  });

  summary.actions.forEach((action, i) => {
    const bx = 324 + i * 212;
    const by = 548;
    ctx.fillStyle = i === 0 ? "#5c3f23" : "#263338";
    ctx.fillRect(bx, by, 188, 46);
    ctx.strokeStyle = i === 0 ? "#ffe18a" : "#40565a";
    ctx.strokeRect(bx + 0.5, by + 0.5, 187, 45);
    center(action.label, bx + 94, by + 25, 17, "#fff4d8");
    center(action.hint, bx + 94, by + 42, 11, i === 0 ? "#ffe18a" : "#a8c8c0");
  });
  center("Enter 再試一次 · Esc 回庭院", W / 2, 632, 15, "#a8c8c0");
  ctx.restore();
}

function drawResult() {
  const summary = state.lastRunSummary || {
    runType: state.runType,
    cleared: state.cleared,
    time: Math.round(state.time),
    kills: state.kills,
    level: state.level,
    bossNodes: state.spawnedBossNodes,
    phaseReached: currentStagePhase().name,
    finalBossDefeated: state.finalBossDefeated,
    moonDust: 0,
    fragment: null,
    score: state.runType === "garden" ? gardenScore() : 0,
    bestGarden: saveData.bestGarden || 0,
    activeSkills: state.pickedUpgrades,
    passiveSkills: state.passiveUpgrades,
    evolvedSkills: state.evolvedSkills,
    bossBoons: state.bossBoons,
    eventChoices: state.eventChoicesTaken,
    damageSources: damageSourceSummary(6),
    runChallenge: runChallengeSummary(),
    runRewards: state.runRewards,
    storyProgress: storyProgressSummary()
  };
  const claimableCount = claimableMissionList().length;
  const nextActions = resultNextActions(summary);
  const postPlan = postRunPlanSummary(summary);
  const progressRows = runProgressDeltaSummary(summary);
  const story = summary.storyProgress || storyProgressSummary();
  const scene = storySceneSummary(story.current);
  ctx.fillStyle = "#f2f4ee";
  ctx.fillRect(0, 0, W, H);
  drawSprite(ROW.heroIdle, 0, 270, 620, 420, false, 0, 1, 64, 112);
  text(summary.runType === "garden" ? "MOON GARDEN" : summary.cleared ? "MEMORY COMPLETE" : "MEMORY TRACE", 610, 78, 38, "#263338");
  text(summary.runType === "garden" ? `分數 ${summary.score}` : summary.fragment ? `記憶強度 ${summary.fragment.power}` : "未形成記憶碎片", 610, 124, 26, "#263338");
  text(`完成時間 ${formatTime(summary.time)}    擊殺 ${summary.kills}/${state.targetKills}    等級 ${summary.level}`, 610, 162, 17, "#3f4b4f");
  text(`推進階段：${summary.phaseReached || currentStagePhase().name}    終局：${summary.finalBossDefeated ? "已擊破" : "未擊破"}`, 610, 184, 15, "#5c696b");
  drawResultStoryCard(610, 202, 580, 58, scene, story);
  drawRewardStrip(610, 276, summary);
  drawRunProgressDelta(610, 366, progressRows);
  text("本局技能 / 進化", 610, 438, 21, "#263338");
  for (let i = 0; i < Math.min(5, summary.activeSkills.length); i++) {
    const skill = summary.activeSkills[i];
    const y = 462 + i * 22;
    ctx.fillStyle = "#192126";
    ctx.fillRect(610, y, 232, 20);
    const icon = upgradeIcon(skill.name);
    if (icon) drawUpgradeIcon(icon, 632, y + 10, 19);
    text(fitText(`${skill.name} ${skill.level}/5`, 144, 12), 660, y + 15, 12, "#fff4d8");
    text(skill.family, 780, y + 15, 11, "#9fd8d0");
  }
  if (!summary.activeSkills.length) text("尚未取得技能", 610, 478, 17, "#3f4b4f");
  drawResultDamageSources(858, 438, 172, 164, summary);
  drawPostRunPlan(1060, 366, postPlan);
  drawResultNextActions(610, 612, nextActions);
}

function drawRunProgressDelta(x, y, rows) {
  text("本局推進", x, y - 10, 18, "#263338");
  rows.slice(0, 3).forEach((row, i) => {
    const bx = x + i * 144;
    ctx.fillStyle = "rgba(38, 51, 56, 0.09)";
    ctx.fillRect(bx, y, 134, 40);
    ctx.fillStyle = row.color;
    ctx.fillRect(bx, y, 4, 40);
    text(row.label, bx + 12, y + 16, 11, "#5c696b");
    text(fitText(row.title, 72, 13), bx + 54, y + 16, 13, row.color);
    text(fitText(row.body, 106, 11), bx + 12, y + 34, 11, "#263338");
  });
}

function drawPostRunPlan(x, y, rows) {
  text("局後計畫", x, y - 10, 20, "#263338");
  rows.slice(0, 4).forEach((row, i) => {
    const bx = x;
    const by = y + 12 + i * 44;
    ctx.fillStyle = i === 0 ? "rgba(38, 51, 56, 0.12)" : "rgba(38, 51, 56, 0.07)";
    ctx.fillRect(bx, by, 182, 36);
    ctx.fillStyle = row.color;
    ctx.fillRect(bx, by, 5, 36);
    text(row.label, bx + 12, by + 15, 11, "#5c696b");
    text(fitText(row.title, 108, 12), bx + 48, by + 15, 12, "#263338");
    text(row.status, bx + 118, by + 31, 11, row.color);
  });
}

function drawResultDamageSources(x, y, w, h, summary) {
  const damage = summary?.damageSources || { total: 0, rows: [] };
  const advice = resultDamageAdvice(summary);
  text("輸出排行", x, y, 21, "#263338");
  ctx.fillStyle = "rgba(38, 51, 56, 0.09)";
  ctx.fillRect(x, y + 16, w, h - 16);
  ctx.strokeStyle = "rgba(38, 51, 56, 0.18)";
  ctx.strokeRect(x + 0.5, y + 16.5, w - 1, h - 17);
  text(`總傷害 ${damage.total || 0}`, x + 12, y + 40, 12, "#5c696b");
  const rows = (damage.rows || []).slice(0, 3);
  if (!rows.length) {
    text("尚未記錄輸出", x + 12, y + 74, 13, "#5c696b");
    text("下一局造成傷害後會列出技能來源", x + 12, y + 96, 11, "#5c696b");
    text(fitText(advice.title, w - 24, 12), x + 12, y + 126, 12, advice.color);
    text(fitText(advice.body, w - 24, 11), x + 12, y + 144, 11, "#3f4b4f");
    return;
  }
  rows.slice(0, 3).forEach((row, i) => {
    const by = y + 64 + i * 30;
    const color = i === 0 ? "#b87d23" : i === 1 ? "#25756a" : "#4b8ca4";
    const barW = Math.max(8, Math.round((w - 78) * clamp(row.percent / 100, 0, 1)));
    const percentText = row.percent > 0 ? `${row.percent}%` : row.damage > 0 ? "<1%" : "0%";
    const iconId = damageIconId(row.name);
    const nameX = iconId && drawUiIcon(iconId, x + 21, by - 3, 18) ? x + 34 : x + 12;
    text(fitText(row.name, nameX === x + 12 ? 86 : 66, 12), nameX, by, 12, "#263338");
    ctx.fillStyle = "rgba(38, 51, 56, 0.16)";
    ctx.fillRect(x + 12, by + 7, w - 78, 7);
    ctx.fillStyle = color;
    ctx.fillRect(x + 12, by + 7, barW, 7);
    text(percentText, x + w - 54, by + 8, 12, color);
  });
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillRect(x + 10, y + h - 44, w - 20, 1);
  text(fitText(advice.title, w - 24, 12), x + 12, y + h - 25, 12, advice.color);
  text(fitText(advice.body, w - 24, 11), x + 12, y + h - 9, 11, "#3f4b4f");
}

function drawResultHighlights(x, y, highlights) {
  text("本局亮點", x, y - 10, 20, "#263338");
  highlights.forEach((item, i) => {
    const hx = x + i * 144;
    ctx.fillStyle = "rgba(38, 51, 56, 0.10)";
    ctx.fillRect(hx, y, 134, 48);
    ctx.fillStyle = item.color;
    ctx.fillRect(hx, y, 134, 5);
    text(item.label, hx + 10, y + 21, 12, "#5c696b");
    text(fitText(item.title, 78, 13), hx + 52, y + 21, 13, item.color);
    text(fitText(item.body, 112, 12), hx + 10, y + 40, 12, "#263338");
  });
}

function drawResultNextActions(x, y, actions) {
  text("下一步", x, y - 12, 20, "#263338");
  actions.forEach((action, i) => {
    const ax = x + i * 188;
    ctx.fillStyle = "#192126";
    ctx.fillRect(ax, y, 174, 72);
    ctx.fillStyle = action.color;
    ctx.fillRect(ax, y, 174, 7);
    text(fitText(action.title, 148, 14), ax + 12, y + 29, 14, "#fff4d8");
    text(fitText(action.body, 148, 12), ax + 12, y + 50, 12, "#b9d0ca");
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(ax + 108, y + 48, 54, 18);
    center(action.label, ax + 135, y + 62, 11, "#ffe8ad");
  });
}

function drawResultStoryCard(x, y, w, h, scene, story) {
  ctx.save();
  ctx.fillStyle = "rgba(38, 51, 56, 0.10)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(38, 51, 56, 0.22)";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = story.claimableCount ? "#b87d23" : story.completed >= story.total ? "#25756a" : "#4f6864";
  ctx.fillRect(x, y, 5, h);
  text(`主線 ${story.completed}/${story.total} · ${scene.title}`, x + 16, y + 21, 14, "#263338");
  text(fitText(scene.success, w - 32, 13), x + 16, y + 39, 13, "#3f4b4f");
  text(fitText(story.claimableCount ? `可領 ${story.claimableDust} 月塵` : scene.next, w - 32, 12), x + 16, y + 54, 12, story.claimableCount ? "#7b5f1a" : "#5c696b");
  ctx.restore();
}

function drawRewardStrip(x, y, summary) {
  const rewards = [
    ["月塵", `+${summary.moonDust}`, "moon_dust"],
    ["Boss", `${summary.runRewards?.bossKills || 0}`, "boss_key"],
    ["精英", `${summary.runRewards?.eliteKills || 0}`, "summon"],
    [summary.runType === "garden" ? "最高" : "記憶", summary.runType === "garden" ? summary.bestGarden : `${saveData.memoryFragments.length}/8`, "memory_shard"]
  ];
  rewards.forEach(([label, value, iconId], i) => {
    const rx = x + i * 132;
    ctx.fillStyle = i === 2 && summary.fragment ? "#2d5c55" : "#192126";
    ctx.fillRect(rx, y, 122, 76);
    text(label, rx + 12, y + 23, 14, "#9fd8d0");
    wrap(String(value), rx + 12, y + 45, 98, 14, "#fff4d8");
    drawUiIcon(iconId, rx + 100, y + 22, 26);
  });
}

function card(x, y, w, h, opt, n, recommended = false) {
  const intent = upgradeIntent(opt);
  const slotHint = upgradeSlotHint(opt);
  const decision = upgradeDecisionSummary(opt);
  const current = skillLevelForOption(opt);
  const progress = clamp(intent.next / MAX_SKILL_LEVEL, 0, 1);
  ctx.fillStyle = "#101b20";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = recommended ? "#ffe18a" : intent.label === "EVOLVE" ? "#d6a33f" : "#42615e";
  ctx.lineWidth = recommended ? 4 : 3;
  ctx.strokeRect(x, y, w, h);
  if (recommended) {
    ctx.fillStyle = "rgba(255, 225, 138, 0.16)";
    ctx.fillRect(x, y, w, 8);
    pill(x + w - 104, y + 58, 72, 22, "推薦", "#d6a33f");
  }
  center(`${n}`, x + 28, y + 34, 24, "#ffe8ad");
  drawUiIcon(familyIconId(upgradeFamily(opt)), x + w - 170, y + 37, 30);
  pill(x + w - 154, y + 24, 66, 26, upgradeFamily(opt), "#647b79");
  pill(x + w - 82, y + 24, 58, 26, upgradeType(opt), upgradeType(opt) === "ACTIVE" ? "#bb4f45" : "#4b8ca4");
  pill(x + 62, y + 24, 82, 26, intent.label, intent.color);
  const icon = upgradeIcon(opt.name);
  if (icon) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#061114";
    ctx.strokeStyle = "#58716d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 58, y + 84, 43, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawUpgradeIcon(icon, x + 58, y + 84, 78);
  }
  text(opt.name, x + 118, y + 80, 22, "#fff4d8");
  text(upgradeLevelPreview(opt), x + 118, y + 106, 15, intent.color);
  text(fitText(opt.desc, w - 142, 13), x + 118, y + 132, 13, "#b9d0ca");
  ctx.fillStyle = "#172329";
  ctx.fillRect(x + 118, y + 142, w - 148, 8);
  ctx.fillStyle = intent.label === "PASSIVE" ? "#4b8ca4" : intent.color;
  ctx.fillRect(x + 118, y + 142, (w - 148) * progress, 8);
  text(current > 0 ? `目前 Lv.${current}` : "尚未取得", x + 118, y + 166, 12, "#a8c8c0");
  text(intent.detail, x + 210, y + 166, 12, intent.color);
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  ctx.fillRect(x + 18, y + 178, w - 36, 52);
  text(decision.title, x + 30, y + 198, 14, decision.tone);
  text(fitText(decision.body, w - 60, 12), x + 30, y + 218, 12, "#d9e3df");
  text(fitText(slotHint, w - 44, 12), x + 22, y + h - 20, 12, "#7fe0d4");
}

function drawUpgradeSlots(x, y) {
  normalizePickedUpgrades();
  text("目前主動技能槽", x - 12, y - 50, 15, "#ffe8ad");
  for (let i = 0; i < MAX_ACTIVE_SKILLS; i++) {
    const bx = x + i * 92;
    ctx.fillStyle = "rgba(7, 13, 16, 0.92)";
    ctx.strokeStyle = state.pickedUpgrades[i] ? "#7edac2" : "#33454a";
    ctx.lineWidth = 2;
    ctx.fillRect(bx - 34, y - 28, 72, 66);
    ctx.strokeRect(bx - 34, y - 28, 72, 66);
    const skill = state.pickedUpgrades[i];
    if (skill) {
      const icon = upgradeIcon(skill.name);
      if (icon) drawUpgradeIcon(icon, bx, y - 4, 38);
      center(`${skill.level}`, bx + 24, y + 22, 13, "#ffe8ad");
      center(skill.name.slice(0, 3), bx, y + 34, 11, "#a8c8c0");
    } else {
      center("+", bx, y, 24, "#4f6267");
      center("空槽", bx, y + 28, 11, "#6f8587");
    }
  }
}

function pill(x, y, w, h, value, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  center(value, x + w / 2, y + 18, 13, "#fff4d8");
}

function button(x, y, w, h, value) {
  ctx.fillStyle = "#263338";
  ctx.fillRect(x, y, w, h);
  center(value, x + w / 2, y + 35, 24, "#fff4d8");
}

function upgradeIcon(name) {
  if (name.includes("符火加速")) return { sheet: "icons", row: 0, frame: 0 };
  if (name.includes("疾行")) return { sheet: "icons", row: 4, frame: 0 };
  if (name.includes("劍") || name.includes("增傷")) return { sheet: "icons", row: 5, frame: 0 };
  if (name.includes("聚魂")) return { sheet: "icons", row: 6, frame: 0 };
  if (name.includes("護命")) return { sheet: "icons", row: 7, frame: 0 };
  if (name.includes("大符") || name.includes("符紙")) return { sheet: "icons", row: 8, frame: 0 };
  if (name.includes("穿透")) return { sheet: "icons", row: 9, frame: 0 };
  if (name.includes("魂盾")) return { sheet: "icons", row: 10, frame: 0 };
  if (name.includes("火") || name.includes("灼") || name.includes("爆") || name.includes("隕")) return { sheet: "tags", row: 0, frame: 0 };
  if (name.includes("水") || name.includes("寒") || name.includes("霜") || name.includes("冰")) return { sheet: "tags", row: 1, frame: 0 };
  if (name.includes("雷") || name.includes("風暴") || name.includes("連鎖")) return { sheet: "tags", row: 2, frame: 0 };
  if (name.includes("毒") || name.includes("腐")) return { sheet: "tags", row: 3, frame: 0 };
  if (name.includes("影") || name.includes("斬") || name.includes("虛空")) return { sheet: "tags", row: 4, frame: 0 };
  if (name.includes("聖") || name.includes("盾")) return { sheet: "tags", row: 5, frame: 0 };
  if (name.includes("風") || name.includes("疾") || name.includes("旋")) return { sheet: "tags", row: 6, frame: 0 };
  return null;
}

function bossRewardIcon(reward) {
  if (!reward) return null;
  if (reward.id === "sigil_damage") return { sheet: "icons", row: 5, frame: 0 };
  if (reward.id === "sigil_haste") return { sheet: "icons", row: 4, frame: 0 };
  if (reward.id === "sigil_guard") return { sheet: "icons", row: 10, frame: 0 };
  if (reward.id === "sigil_magnet") return { sheet: "icons", row: 6, frame: 0 };
  if (reward.id === "sigil_area") return { sheet: "icons", row: 8, frame: 0 };
  if (reward.id === "sigil_pierce") return { sheet: "icons", row: 9, frame: 0 };
  return upgradeIcon(reward.name);
}

function eventChoiceIcon(option) {
  if (!option) return null;
  if (option.event === "soulRain") return { sheet: "icons", row: 6, frame: 0 };
  if (option.event === "spiritRush") return { sheet: "tags", row: 4, frame: 0 };
  if (option.event === "sealField") return { sheet: "fields", row: 5, frame: 0 };
  if (option.event === "elitePressure") return { sheet: "icons", row: 5, frame: 0 };
  if (option.event === "focus") return { sheet: "icons", row: 4, frame: 0 };
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
  if (state.mode === "briefing") {
    if (x >= 284 && x <= 450 && y >= 552 && y <= 596) {
      closeRunBriefing();
      draw();
      return;
    }
    if (x >= 806 && x <= 996 && y >= 552 && y <= 596) {
      confirmRunBriefing();
      draw();
      return;
    }
    state.message = "確認簡報後按出發，或返回調整模式。";
    draw();
    return;
  }
  if (state.mode === "menu") {
    const inPlay = x >= 800 && x <= 1130 && y >= 540 && y <= 608;
    const missionIndex = x >= 800 && x <= 1130 && y >= 318 && y <= 482 ? Math.floor((y - 318) / 58) : -1;
    const dashboardIndex = x >= 52 && x <= 364 && y >= 362 && y <= 400 ? Math.floor((x - 52) / 104) : -1;
    const guidancePrimary = x >= 50 && x <= 358 && y >= 474 && y <= 528;
    const guidanceIndex = x >= 50 && x <= 358 && y >= 550 && y <= 606 ? Math.floor((y - 550) / 28) : -1;
    const inMission = x >= 1032 && x <= 1182 && y >= 118 && y <= 182;
    const inStatus = x >= 1032 && x <= 1182 && y >= 204 && y <= 268;
    const navTabs = [
      ["memory", 48, 542, 72, 78],
      ["stats", 152, 542, 72, 78],
      ["equipment", 256, 542, 72, 78],
      ["shop", 360, 542, 72, 78],
      ["summon", 464, 542, 72, 78]
    ];
    const topTabs = [
      ["records", 923, 12, 44, 44],
      ["memory", 978, 12, 44, 44],
      ["settings", 1033, 12, 44, 44]
    ];
    for (const [tab, bx, by, bw, bh] of [...navTabs, ...topTabs]) {
      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
        setMenuTab(tab);
        draw();
        return;
      }
    }
    if (dashboardIndex >= 0) {
      const tabs = ["missions", "shop", "summon"];
      const tab = tabs[dashboardIndex];
      if (tab) {
        setMenuTab(tab);
        draw();
        return;
      }
    }
    if (guidancePrimary) {
      runHomeAction();
      draw();
      return;
    }
    if (guidanceIndex >= 0) {
      const next = homeNextAction();
      const row = homeGuidanceRows().filter((item) => item.title !== next.title).slice(0, 2)[guidanceIndex];
      if (row) {
        runHomeAction(row);
        draw();
        return;
      }
    }
    if (missionIndex >= 0 && missionIndex < MISSION_CHOICES.length) {
      selectMission(MISSION_CHOICES[missionIndex].id);
      draw();
    }
    else if (inPlay) {
      startSelectedMission();
      draw();
    }
    else if (inMission) {
      setMenuTab("missions");
      draw();
    }
    else if (inStatus) {
      setMenuTab("stats");
      draw();
    } else if (state.menuTab === "equipment" && x >= 638 && x <= 956 && y >= 174 && y <= 432) {
      const index = Math.floor((y - 174) / 78);
      const item = EQUIPMENT[index];
      if (item) {
        state.selectedEquipment = item.id;
        persistSave();
        state.message = `裝備：${item.name}`;
      }
      draw();
    } else if (state.menuTab === "memory" && state.memoryDeleteConfirmId && x >= 638 && x <= 764 && y >= 512 && y <= 544) {
      confirmDeleteSelectedMemory();
      draw();
    } else if (state.menuTab === "memory" && state.memoryDeleteConfirmId && x >= 782 && x <= 908 && y >= 512 && y <= 544) {
      cancelDeleteMemory();
      draw();
    } else if (state.menuTab === "memory" && !state.memoryDeleteConfirmId && x >= 638 && x <= 908 && y >= 512 && y <= 544) {
      requestDeleteSelectedMemory();
      draw();
    } else if (state.menuTab === "memory" && x >= 638 && x <= 956 && y >= 178 && y <= 450) {
      const index = Math.floor((y - 178) / 54);
      const fragment = saveData.memoryFragments[index];
      if (fragment) {
        state.selectedFragmentId = fragment.id;
        state.memoryDeleteConfirmId = null;
        persistSave();
        state.message = `選擇記憶：${fragment.name}`;
      }
      draw();
    } else if (state.menuTab === "missions" && x >= 638 && x <= 788 && y >= 448 && y <= 482) {
      claimAllMissions();
      draw();
    } else if (state.menuTab === "missions" && x >= 638 && x <= 956 && y >= 174 && y <= 446) {
      const index = Math.floor((y - 174) / 52);
      claimMission(index);
      draw();
    } else if (state.menuTab === "shop" && x >= 638 && x <= 788 && y >= 514 && y <= 548) {
      autoBuyPermanentUpgrades();
      draw();
    } else if (state.menuTab === "shop" && x >= 638 && x <= 956 && y >= 236 && y <= 488) {
      const index = Math.floor((y - 236) / 48);
      buyPermanentUpgrade(index);
      draw();
    } else if (state.menuTab === "summon" && x >= 638 && x <= 788 && y >= 502 && y <= 536) {
      autoUnlockSummons();
      draw();
    } else if (state.menuTab === "summon" && x >= 638 && x <= 956 && y >= 216 && y <= 480) {
      const index = Math.floor((y - 216) / 62);
      buyOrSelectSummon(index);
      draw();
    } else if (state.menuTab === "records") {
      handleRecordsClick(x, y);
    } else if (state.menuTab === "settings") {
      handleSettingsClick(x, y);
    } else if (state.menuTab === "equipment") {
      cycleEquipment();
      draw();
    } else {
      state.message = "請選擇功能，或按 Play 開始。";
      draw();
    }
    return;
  }
  if (state.mode === "pause") {
    if (x >= 426 && x <= 606 && y >= 584 && y <= 628) {
      closePause();
      draw();
      return;
    }
    if (x >= 674 && x <= 854 && y >= 584 && y <= 628) {
      startMenu();
      draw();
      return;
    }
    for (const [tab, , bx, by, bw, bh] of pauseTabs()) {
      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
        state.pauseTab = tab;
        draw();
        return;
      }
    }
    if (handlePauseContentClick(x, y)) return;
    state.message = "選擇分頁、繼續遊戲，或回主畫面。";
    draw();
    return;
  }
  if (state.mode === "dead" || state.mode === "result") {
    if (state.mode === "dead") {
      const buttons = [
        { id: "retry", x: 324, y: 548, w: 188, h: 46 },
        { id: "menu", x: 536, y: 548, w: 188, h: 46 },
        { id: "shop", x: 748, y: 548, w: 188, h: 46 }
      ];
      for (const btn of buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          if (btn.id === "retry") retryLastRun();
          else if (btn.id === "shop") openResultDestination("shop");
          else startMenu();
          draw();
          return;
        }
      }
      return;
    }
    if (state.mode === "result") {
      const actions = resultNextActions(state.lastRunSummary);
      const planRows = postRunPlanSummary(state.lastRunSummary);
      for (let i = 0; i < Math.min(4, planRows.length); i++) {
        const bx = 1060;
        const by = 366 + 12 + i * 44;
        if (x >= bx && x <= bx + 182 && y >= by && y <= by + 36) {
          openResultDestination(planRows[i].tab);
          draw();
          return;
        }
      }
      for (let i = 0; i < actions.length; i++) {
        const bx = 610 + i * 188;
        if (x >= bx && x <= bx + 174 && y >= 602 && y <= 674) {
          const action = actions[i];
          openResultDestination(action.id);
          draw();
          return;
        }
      }
    }
    startMenu();
    return;
  }
  if (state.mode === "level") {
    const cards = [100, 493, 886];
    for (let i = 0; i < cards.length; i++) {
      if (x >= cards[i] && x <= cards[i] + 320 && y >= 220 && y <= 472) chooseUpgrade(i);
    }
    return;
  }
  if (state.mode === "bossReward") {
    const cards = [100, 493, 886];
    for (let i = 0; i < cards.length; i++) {
      if (x >= cards[i] && x <= cards[i] + 320 && y >= 220 && y <= 472) chooseBossReward(i);
    }
    return;
  }
  if (state.mode === "eventChoice") {
    const cards = [100, 493, 886];
    for (let i = 0; i < cards.length; i++) {
      if (x >= cards[i] && x <= cards[i] + 320 && y >= 220 && y <= 472) chooseEventChoice(i);
    }
  }
}

function cycleEquipment() {
  const index = EQUIPMENT.findIndex((item) => item.id === state.selectedEquipment);
  const next = EQUIPMENT[(index + 1) % EQUIPMENT.length];
  state.selectedEquipment = next.id;
  persistSave();
  state.message = `裝備：${next.name}`;
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
  if (k === "escape") {
    if (state.mode === "playing") {
      openPause("skills");
    } else if (state.mode === "pause") {
      closePause();
    } else if (state.mode === "briefing") {
      closeRunBriefing();
    } else if (state.mode === "level") {
      state.mode = "playing";
      state.options = [];
    } else if (state.mode === "menu" && state.menuTab !== "home") {
      state.menuTab = "home";
      draw();
    } else if (state.mode === "dead") {
      startMenu();
      draw();
    }
    return;
  }
  if (state.mode === "pause") {
    if (k === "enter") startMenu();
    else if (k === "1") state.pauseTab = "skills";
    else if (k === "2") state.pauseTab = "stats";
    else if (k === "3") state.pauseTab = "missions";
    else if (k === "4") state.pauseTab = "codex";
    else if (k === "5") state.pauseTab = "settings";
    return;
  }
  if (state.mode === "bossReward" && ["1", "2", "3"].includes(k)) {
    chooseBossReward(Number(k) - 1);
    return;
  }
  if (state.mode === "eventChoice" && ["1", "2", "3"].includes(k)) {
    chooseEventChoice(Number(k) - 1);
    return;
  }
  if (state.mode === "briefing" && k === "enter") {
    confirmRunBriefing();
    draw();
    return;
  }
  if (state.mode === "menu" && k === "enter") startSelectedMission();
  else if (state.mode === "menu" && ["1", "2", "3"].includes(k)) selectMission(MISSION_CHOICES[Number(k) - 1].id);
  else if (state.mode === "menu" && k === "4") setMenuTab("memory");
  else if (state.mode === "menu" && k === "5") cycleEquipment();
  else if (state.mode === "dead" && k === "enter") retryLastRun();
  else if (state.mode === "result" && k === "enter") startMenu();
  else if (state.mode === "level" && ["1", "2", "3"].includes(k)) chooseUpgrade(Number(k) - 1);
  if (k === "m") {
    toggleAudioMute();
    draw();
  }
  if (k === "f") canvas.requestFullscreen?.();
});

window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener("pointermove", (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * W;
  pointer.y = ((e.clientY - r.top) / r.height) * H;
  if (state.mode === "playing" && touchControl.active && e.pointerId === touchControl.pointerId) {
    updateVirtualStick(pointer.x, pointer.y, e.pointerId);
  }
});
canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * W;
  pointer.y = ((e.clientY - r.top) / r.height) * H;
  pointer.down = true;
  canvas.setPointerCapture?.(e.pointerId);
  if (state.mode === "playing") {
    if (isPauseButton(pointer.x, pointer.y)) openPause("skills");
    else if (isDashButton(pointer.x, pointer.y)) queueTouchDash();
    else if (pointer.x < W * 0.46 && pointer.y > H * 0.46) startVirtualStick(pointer.x, pointer.y, e.pointerId);
    return;
  }
  clickAt(pointer.x, pointer.y);
});
canvas.addEventListener("pointerup", (e) => {
  pointer.down = false;
  stopVirtualStick(e.pointerId);
});
canvas.addEventListener("pointercancel", (e) => {
  pointer.down = false;
  stopVirtualStick(e.pointerId);
});

window.render_game_to_text = () => JSON.stringify({
  mode: state.mode,
  menuTab: state.menuTab,
  recordsTab: state.recordsTab,
  codexElement: state.codexElement,
  skillCodex: state.mode === "menu" && state.menuTab === "records" && state.recordsTab === "skills" ? elementCodexDetail() : null,
  pauseTab: state.pauseTab,
  message: state.message,
  time: Number(state.time.toFixed(1)),
  milestoneBanner: state.milestoneBanner ? {
    kind: state.milestoneBanner.kind,
    title: state.milestoneBanner.title,
    subtitle: state.milestoneBanner.subtitle,
    t: Number(state.milestoneBanner.t.toFixed(2))
  } : null,
  player: state.player ? { x: Math.round(state.player.x), y: Math.round(state.player.y), hp: Math.round(state.player.hp), maxHp: Math.round(state.stats.maxHp), hpRatio: Number((state.player.hp / Math.max(1, state.stats.maxHp)).toFixed(2)), hurtFlash: Number(state.hurtFlash.toFixed(2)), lowHp: state.player.hp / Math.max(1, state.stats.maxHp) < 0.32, level: state.level, facing: state.player.facing, heroAnim: { attack: Number((state.player.attackT || 0).toFixed(2)), hit: Number((state.player.hurtT || 0).toFixed(2)), dash: Number((state.player.dashAnimT || 0).toFixed(2)) } } : null,
  enemies: state.enemies.length,
  enemyKinds: state.enemies.reduce((counts, enemy) => {
    counts[enemy.kind] = (counts[enemy.kind] || 0) + 1;
    return counts;
  }, {}),
  boss: bossHudSummary(),
  guardedEnemies: state.enemies.filter((enemy) => enemy.guarded > 0).length,
  rangedEnemies: state.enemies.filter((e) => e.kind === "mage").length,
  summonerEnemies: state.enemies.filter((e) => e.kind === "weaver").length,
  conjuringEnemies: state.enemies.filter((e) => e.conjureCast).length,
  bindSeals: state.hazards.filter((h) => h.kind === "bindSeal").length,
  playerSlowed: state.player ? Number(((state.player.slowT || 0)).toFixed(2)) : 0,
  castingEnemies: state.enemies
    .filter((e) => e.castT > 0 || e.specialCast || e.conjureCast || e.mirrorCast)
    .slice(0, 6)
    .map((e) => ({
      kind: e.finalBoss ? "finalBoss" : e.kind,
      cast: e.castT > 0 ? Number(e.castT.toFixed(2)) : 0,
      conjure: e.conjureCast ? Number(e.conjureCast.t.toFixed(2)) : 0,
      mirror: e.mirrorCast ? Number(e.mirrorCast.t.toFixed(2)) : 0,
      special: e.specialCast ? { pattern: e.specialCast.pattern, t: Number(e.specialCast.t.toFixed(2)) } : null
    })),
  bullets: state.bullets.length,
  enemyBullets: state.enemyBullets.length,
  hazards: state.hazards.length,
  pickups: state.pickups.length,
  pickupSamples: state.pickups.slice(0, 4).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
  effects: state.effects.length,
  ambience: {
    total: AMBIENCE_NODES.length,
    visible: state.mode === "menu" || state.mode === "loading" ? 0 : visibleAmbienceNodes().length,
    kinds: state.mode === "menu" || state.mode === "loading" ? [] : [...new Set(visibleAmbienceNodes().map((node) => node.kind))]
  },
  damageTexts: state.damageText.slice(0, 6).map((t) => ({ text: t.text, amount: Number(t.amount?.toFixed?.(1) ?? t.text), enemyId: t.enemyId ?? null })),
  entityBudget: {
    limits: ENTITY_BUDGETS,
    counts: {
      enemies: state.enemies.filter((enemy) => enemy.kind !== "boss").length,
      bosses: activeBosses().length,
      pickups: state.pickups.length,
      effects: state.effects.length,
      damageText: state.damageText.length,
      enemyBullets: state.enemyBullets.length,
      hazards: state.hazards.length
    },
    stats: state.perfStats
  },
  kills: state.kills,
  targetKills: state.targetKills,
  cleared: state.cleared,
  xp: Number(state.xp.toFixed(1)),
  xpNeed: state.xpNeed,
  magnet: Math.round(state.stats?.magnet ?? 0),
  element: state.stats?.element ?? null,
  elementStats: Object.fromEntries(activeElementStats()),
  runType: state.runType,
  mission: state.mission,
  selectedMission: state.selectedMission,
  selectedMissionTitle: selectedMissionChoice().title,
  runBriefing: state.mode === "briefing" ? runBriefingSummary() : null,
  objectiveCompass: state.mode === "briefing" || state.player ? objectiveCompassSummary(state.mode === "briefing" ? { preview: true } : {}) : null,
  gardenPreview: state.mode === "menu" && state.selectedMission === "garden" ? gardenMissionPreview(selectedFragment()) : null,
  stagePhase: { index: state.phaseIndex, name: currentStagePhase().name, objective: currentStagePhase().objective, notice: Number(state.phaseNoticeT.toFixed(1)) },
  combatTracker: state.player ? combatTrackerSummary() : null,
  combatReadout: state.player ? combatReadoutSummary() : null,
  damageSources: state.player ? damageSourceSummary() : null,
  buildProgress: state.player ? buildProgressSummary() : null,
  threat: state.player ? threatSummary() : null,
  minimap: state.player ? minimapSummary() : null,
  levelChoice: state.mode === "level" ? levelChoiceSummary() : null,
  touchControl: {
    active: touchControl.active,
    dx: Number(touchControl.dx.toFixed(2)),
    dy: Number(touchControl.dy.toFixed(2)),
    dashReady: state.player ? state.player.dashT <= 0 : false,
    dashFlash: Number(touchControl.lastDashT.toFixed(2))
  },
  tutorialHint: state.tutorialHint ? { id: state.tutorialHint.id, title: state.tutorialHint.title, t: Number(state.tutorialHint.t.toFixed(1)) } : null,
  seenHints: Object.keys(state.seenHints),
  tutorialQuest: state.player ? tutorialQuestSummary() : null,
  spawnedBossNodes: state.spawnedBossNodes,
  warnedBossNodes: state.warnedBossNodes,
  finalBossActive: state.finalBossActive,
  finalBossDefeated: state.finalBossDefeated,
  currentEvent: state.currentEvent ? state.currentEvent.id : null,
  eventChoiceOptions: state.eventChoiceOptions.map(eventChoiceSummary).filter(Boolean),
  eventChoiceSource: state.eventChoiceSource,
  eventChoicesTaken: state.eventChoicesTaken.map((item) => ({ ...item })),
  eventCooldown: Number(state.eventT?.toFixed?.(1) ?? 0),
  lastRunSummary: state.lastRunSummary,
  deathSummary: state.mode === "dead" ? deathSummary() : null,
  postRunPlan: state.mode === "result" ? postRunPlanSummary(state.lastRunSummary) : [],
  resultHighlights: state.mode === "result" ? resultHighlights(state.lastRunSummary) : [],
  resultProgressDelta: state.mode === "result" ? runProgressDeltaSummary(state.lastRunSummary) : [],
  resultDamageSources: state.mode === "result" ? state.lastRunSummary?.damageSources || { total: 0, rows: [] } : null,
  resultBuildAdvice: state.mode === "result" ? resultDamageAdvice(state.lastRunSummary) : null,
  resultActions: state.mode === "result" ? resultNextActions(state.lastRunSummary).map((action) => ({ id: action.id, label: action.label, title: action.title })) : [],
  evolvedSkills: state.evolvedSkills.map((item) => item.name),
  selectedEquipment: selectedEquipment().name,
  equipmentPreview: state.mode === "menu" && state.menuTab === "equipment" ? equipmentPreviewRows(selectedEquipment()).map(([label, value]) => ({ label, value })) : [],
  selectedFragment: selectedFragment()?.name ?? null,
  selectedFragmentId: selectedFragment()?.id ?? null,
  memoryDeleteConfirmId: state.memoryDeleteConfirmId,
  memoryFragments: saveData.memoryFragments.length,
  storyProgress: storyProgressSummary(),
  storyScene: storySceneSummary(state.mode === "result" && state.lastRunSummary?.storyProgress ? state.lastRunSummary.storyProgress.current : storyProgressSummary().current),
  completionTracker: completionTrackerSummary(),
  collection: collectionSummary(),
  storyFocus: state.storyFocus,
  homeDashboard: state.mode === "menu" ? homeDashboardSummary() : null,
  homeNextAction: state.mode === "menu" ? homeNextAction() : null,
  homeGuidance: state.mode === "menu" ? homeGuidanceRows().map((row) => ({ title: row.title, status: row.status, tab: row.tab })) : [],
  bestGarden: saveData.bestGarden || 0,
  moonDust: saveData.moonDust,
  lifetimeKills: saveData.lifetimeKills,
  clears: saveData.clears,
  upgrades: saveData.upgrades,
  permanentUpgradeSummary: permanentUpgradeSummary(),
  unlockedSummons: saveData.unlockedSummons,
  selectedSummon: selectedSummon().name,
  companion: state.companion ? {
    summon: selectedSummon().id,
    name: selectedSummon().name,
    x: Math.round(state.companion.x),
    y: Math.round(state.companion.y),
    cooldown: Number(state.companion.cooldown.toFixed(2)),
    action: state.companion.action,
    pulse: Number(state.companion.pulse.toFixed(2))
  } : null,
  claimableMissions: claimableMissionList().map((mission) => mission.name),
  claimableMissionCount: claimableMissionList().length,
  claimableMissionReward: claimableMissionReward(),
  gardenScore: state.player ? gardenScore() : 0,
  runRewards: state.runRewards,
  runChallenge: runChallengeSummary(),
  runChallengeCompleted: state.runChallengeCompleted,
  challengeToast: state.challengeToast ? { title: state.challengeToast.title, body: state.challengeToast.body, reward: state.challengeToast.reward, t: Number(state.challengeToast.t.toFixed(2)) } : null,
  combatMedals: state.combatMedals.map((medal) => ({
    kind: medal.kind,
    title: medal.title,
    body: medal.body,
    t: Number(medal.t.toFixed(2))
  })),
  challengeBonus: state.challengeBonus,
  bossRewardOptions: state.bossRewardOptions.map(bossRewardSummary).filter(Boolean),
  bossRewardSource: state.bossRewardSource,
  bossBoons: state.bossBoons.map((boon) => ({ ...boon })),
  pickedUpgrades: state.pickedUpgrades.map((item) => ({ name: item.name, level: item.level, family: item.family, type: item.type })),
  passiveUpgrades: state.passiveUpgrades.map((item) => ({ name: item.name, level: item.level, family: item.family, type: item.type })),
  pausePanel: state.mode === "pause" ? {
    tab: state.pauseTab,
    damageSources: damageSourceSummary(),
    selectedSkill: skillDetailSummary(pauseSelectedSkill()),
    selectedSkillIndex: state.pauseSkillIndex,
    activeSkills: activeSkillsForView().map((item) => ({ name: item.name, level: item.level, family: item.family })),
    passiveSkills: passiveSkillsForView().map((item) => ({ name: item.name, level: item.level, family: item.family })),
    stats: Object.fromEntries(readableStatRows()),
    runLog: runLogSummary(),
    objectiveCompass: objectiveCompassSummary(),
    storyProgress: storyProgressSummary(),
    missions: MISSIONS.map((mission) => ({ name: mission.name, progress: missionProgress(mission), status: missionStatus(mission), reward: mission.reward })),
    codex: {
      enemies: ["魑魅", "疾影", "咒師", "爆靈", "護衛", "巨怪", "Boss"],
      rules: ["主動技能最多 5 種", "被動不佔槽", "同技能重選升級", "魂火靠近才吸取"]
    },
    controls: ["Esc 或按鈕繼續", "按鈕回主畫面", "點技能查看詳情", "1 技能", "2 角色", "3 任務", "4 圖鑑", "5 設定"],
    settingsActions: ["切換音樂", "全螢幕", "畫面震動", "傷害數字", "戰鬥提示"]
  } : null,
  activeSkillSlots: state.pickedUpgrades.length,
  maxActiveSkillSlots: MAX_ACTIVE_SKILLS,
  viewScale: VIEW_SCALE,
  options: state.options.map(optionSummary),
  sprites: {
    complete: sprites.complete,
    naturalWidth: sprites.naturalWidth,
    naturalHeight: sprites.naturalHeight
  },
  mapBackground: {
    complete: mapBackground.complete,
    naturalWidth: mapBackground.naturalWidth,
    naturalHeight: mapBackground.naturalHeight
  },
  vfx: {
    tags: { complete: vfxTags.complete, naturalWidth: vfxTags.naturalWidth, naturalHeight: vfxTags.naturalHeight },
    bursts: { complete: vfxBursts.complete, naturalWidth: vfxBursts.naturalWidth, naturalHeight: vfxBursts.naturalHeight },
    fields: { complete: vfxFields.complete, naturalWidth: vfxFields.naturalWidth, naturalHeight: vfxFields.naturalHeight },
    icons: { complete: vfxIcons.complete, naturalWidth: vfxIcons.naturalWidth, naturalHeight: vfxIcons.naturalHeight }
  },
  audio: {
    enabled: Boolean(audioCtx),
    muted: audioMuted,
    musicMood: musicMoodSummary()
  },
  settings: {
    resetConfirm: state.resetConfirm,
    audioMuted,
    audio: settingEnabled("audio"),
    screenShake: settingEnabled("screenShake"),
    damageNumbers: settingEnabled("damageNumbers"),
    hints: settingEnabled("hints")
  },
  camera: {
    x: Math.round(state.camera.x),
    y: Math.round(state.camera.y),
    shake: Number(state.shake.toFixed(2)),
    shakeX: Number((state.camera.shakeX || 0).toFixed(2)),
    shakeY: Number((state.camera.shakeY || 0).toFixed(2))
  },
  note: "Player and enemies use survivor-sprites.png. Skill projectiles, hit effects, fields, and upgrade icons use cutout VFX atlases."
});

window.advanceTime = (ms) => {
  fixedMode = true;
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(1 / 60);
  fixedMode = false;
  last = performance.now();
  draw();
};

window.debug_set_setting = (key, value) => {
  setGameSetting(key, value);
  draw();
  return window.render_game_to_text();
};

window.debug_toggle_setting = (key) => {
  toggleGameSetting(key);
  draw();
  return window.render_game_to_text();
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

window.debug_choose_upgrade = (index = 0) => {
  if (state.mode !== "level" || !state.options.length) return null;
  const clamped = Math.max(0, Math.min(state.options.length - 1, Number(index) || 0));
  chooseUpgrade(clamped);
  draw();
  return window.render_game_to_text();
};

window.debug_apply_upgrade = (name, times = 1) => {
  if (!state.player) resetGame();
  const opt = findUpgradeByName(name);
  if (!opt) return null;
  for (let i = 0; i < times; i++) {
    const key = upgradeKey(opt);
    const nextLevel = Math.min(MAX_SKILL_LEVEL, (state.skillLevels[key] || 0) + 1);
    state.skillLevels[key] = nextLevel;
    const targetList = upgradeType(opt) === "ACTIVE" ? state.pickedUpgrades : state.passiveUpgrades;
    const existing = targetList.find((item) => item.key === key);
    if (existing) existing.level = nextLevel;
    else targetList.push({ key, name: opt.name, desc: opt.desc, family: upgradeFamily(opt), type: upgradeType(opt), level: nextLevel });
    opt.apply();
    maybeEvolveSkill(opt, nextLevel);
  }
  draw();
  return window.render_game_to_text();
};

window.debug_apply_element_build = (element = "fire") => {
  if (!state.player) resetGame();
  const namesByElement = {
    fire: ["火系符脈", "灼燒延長", "爆炎符", "隕火印"],
    water: ["水系符脈", "寒流符", "霜環", "冰晶裂片"],
    lightning: ["雷系符脈", "連鎖雷", "雷暴會心", "風暴核心"],
    poison: ["毒系符脈", "猛毒符", "毒霧", "腐蝕印"],
    shadow: ["影系符脈", "暗影咒", "斬魂", "虛空裂隙"],
    holy: ["聖系符脈", "聖印", "金盾", "聖裁"],
    wind: ["風系符脈", "疾風步", "旋風刃", "裂風"]
  };
  for (const name of namesByElement[element] || namesByElement.fire) {
    const opt = findUpgradeByName(name);
    if (!opt) continue;
    const key = upgradeKey(opt);
    const nextLevel = Math.min(MAX_SKILL_LEVEL, (state.skillLevels[key] || 0) + 1);
    state.skillLevels[key] = nextLevel;
    const targetList = upgradeType(opt) === "ACTIVE" ? state.pickedUpgrades : state.passiveUpgrades;
    const existing = targetList.find((item) => item.key === key);
    if (existing) existing.level = nextLevel;
    else targetList.push({ key, name: opt.name, desc: opt.desc, family: upgradeFamily(opt), type: upgradeType(opt), level: nextLevel });
    opt.apply();
    maybeEvolveSkill(opt, nextLevel);
  }
  draw();
  return window.render_game_to_text();
};

window.debug_force_result = () => {
  if (!state.player) resetGame();
  state.kills = state.targetKills;
  state.cleared = true;
  state.mode = "result";
  finalizeRun();
  draw();
  return window.render_game_to_text();
};

window.debug_reset_save = () => {
  localStorage.removeItem(SAVE_KEY);
  saveData = loadSave();
  state.selectedMission = saveData.selectedMission;
  state.selectedEquipment = saveData.selectedEquipment;
  state.selectedFragmentId = saveData.selectedFragmentId;
  startMenu();
  return window.render_game_to_text();
};

window.debug_add_moon_dust = (amount) => {
  saveData.moonDust += Math.max(0, Number(amount) || 0);
  persistSave();
  draw();
  return window.render_game_to_text();
};

window.debug_get_save = () => JSON.stringify(saveData);

window.debug_make_story_claimable = (chapterId = "first_memory") => {
  const chapter = STORY_CHAPTERS.find((item) => item.id === chapterId) || STORY_CHAPTERS[0];
  if (chapter.id === "first_memory") {
    saveData.memoryFragments = saveData.memoryFragments.length ? saveData.memoryFragments : [{
      id: `debug-memory-${Date.now()}`,
      name: "測試記憶",
      power: 120,
      level: 4,
      activeSkills: ["火系符脈"],
      evolvedSkills: [],
      runType: "cultivation"
    }];
    saveData.selectedFragmentId = saveData.memoryFragments[0].id;
  } else if (chapter.id === "first_clear") saveData.clears = Math.max(saveData.clears, 1);
  else if (chapter.id === "hunter") saveData.lifetimeKills = Math.max(saveData.lifetimeKills, 200);
  else if (chapter.id === "companion") {
    if (!saveData.unlockedSummons.includes("paper_imp")) saveData.unlockedSummons.push("paper_imp");
  } else if (chapter.id === "garden") saveData.bestGarden = Math.max(saveData.bestGarden || 0, 3000);
  delete saveData.claimedStoryChapters[chapter.id];
  persistSave();
  startMenu();
  draw();
  return window.render_game_to_text();
};

window.debug_claim_story_rewards = () => {
  const result = claimAllStoryRewards();
  draw();
  return JSON.stringify({ result, state: JSON.parse(window.render_game_to_text()) });
};

window.debug_select_summon = (id = "moon_cat") => {
  const summon = SUMMONS.find((item) => item.id === id) || SUMMONS[0];
  if (!saveData.unlockedSummons.includes(summon.id)) saveData.unlockedSummons.push(summon.id);
  saveData.selectedSummon = summon.id;
  persistSave();
  if (state.player) {
    const hpRatio = state.player.hp / Math.max(1, state.stats.maxHp);
    state.stats = makeBaseStats();
    applyMetaProgression(state.stats);
    selectedEquipment().apply();
    state.player.hp = Math.min(state.stats.maxHp, Math.max(1, hpRatio * state.stats.maxHp));
    state.companion = {
      x: state.player.x + 58,
      y: state.player.y - 58,
      cooldown: 0.1,
      pulse: 1,
      action: "idle"
    };
  }
  draw();
  return window.render_game_to_text();
};

window.debug_select_mission = (id = "default") => {
  if (state.mode !== "menu") startMenu();
  selectMission(id);
  draw();
  return window.render_game_to_text();
};

window.debug_claim_mission = (index = 0) => {
  if (state.mode !== "menu") startMenu();
  claimMission(Number(index) || 0);
  draw();
  return window.render_game_to_text();
};

window.debug_buy_permanent_upgrade = (index = 0) => {
  if (state.mode !== "menu") startMenu();
  setMenuTab("shop");
  buyPermanentUpgrade(Number(index) || 0);
  draw();
  return window.render_game_to_text();
};

window.debug_set_player_position = (x, y) => {
  if (!state.player) resetGame();
  state.player.x = Number(x);
  state.player.y = Number(y);
  state.player.x = clamp(state.player.x, 30, WORLD_W - 30);
  state.player.y = clamp(state.player.y, 30, WORLD_H - 30);
  draw();
  return window.render_game_to_text();
};

window.debug_set_kills = (kills) => {
  if (!state.player) resetGame();
  state.kills = Number(kills) || 0;
  updateBossNodes();
  draw();
  return window.render_game_to_text();
};

window.debug_set_run_challenge = (id = "first_wave") => {
  if (!state.player) resetGame();
  const challenge = RUN_CHALLENGES.find((item) => item.id === id) || RUN_CHALLENGES[0];
  state.runChallenge = challenge;
  state.runChallengeCompleted = false;
  state.challengeToast = null;
  state.challengeBonus = 0;
  draw();
  return window.render_game_to_text();
};

window.debug_set_tutorial_progress = (patch = {}) => {
  if (!state.player) resetGame();
  const data = typeof patch === "string" ? JSON.parse(patch) : patch;
  state.tutorialProgress = {
    moved: Number(data.moved ?? state.tutorialProgress?.moved ?? 0),
    souls: Number(data.souls ?? state.tutorialProgress?.souls ?? 0),
    upgrades: Number(data.upgrades ?? state.tutorialProgress?.upgrades ?? 0)
  };
  draw();
  return window.render_game_to_text();
};

window.debug_complete_run_challenge = () => {
  if (!state.player) resetGame();
  if (!state.runChallenge) state.runChallenge = RUN_CHALLENGES[0];
  if (state.runChallenge.id === "adept_growth") state.level = Math.max(state.level, state.runChallenge.target);
  else if (state.runChallenge.id === "boss_hunt") state.runRewards.bossKills = Math.max(state.runRewards.bossKills, state.runChallenge.target);
  else if (state.runChallenge.id === "elite_breaker") state.runRewards.eliteKills = Math.max(state.runRewards.eliteKills, state.runChallenge.target);
  else if (state.runChallenge.id === "garden_score") {
    state.kills = Math.max(state.kills, Math.ceil(state.runChallenge.target / 45));
    state.time = Math.max(state.time, 1);
  } else {
    state.kills = Math.max(state.kills, state.runChallenge.target);
  }
  updateRunChallengeFeedback(0);
  draw();
  return window.render_game_to_text();
};

window.debug_show_all_vfx = () => {
  if (!state.player) resetGame();
  const kinds = Object.keys(EFFECT_DEFS);
  state.effects = [];
  kinds.forEach((kind, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    addEffect(kind, state.player.x - 260 + col * 130, state.player.y - 180 + row * 130, 130, 1.2, 0, 0.98);
  });
  state.bullets = Object.keys(ELEMENT_VFX_ROW).map((element, i) => ({
    x: state.player.x - 260 + i * 88,
    y: state.player.y + 130,
    vx: 0,
    vy: 0,
    angle: 0,
    r: 8,
    life: 1.2,
    damage: 0,
    pierce: 99,
    element,
    anim: i
  }));
  draw();
  return window.render_game_to_text();
};

window.debug_trigger_event = (event = "sealField") => {
  if (!state.player) resetGame();
  triggerCombatEvent(event);
  draw();
  return window.render_game_to_text();
};

window.debug_show_milestone = (kind = "phase") => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  const presets = {
    phase: ["phase", "伏擊 2/4", "疾影加入怪潮，保持移動避免被包夾"],
    bossWarning: ["bossWarning", "Boss 預警", "再 6 擊殺，保留閃避並清出安全距離"],
    boss: ["boss", "Boss 節點 30", "月庭魑魅現身，注意彈幕與封印圈"],
    final: ["final", "終局首領", "擊破後完成本輪，優先拉開距離"]
  };
  const args = presets[kind] || presets.phase;
  showMilestoneBanner(args[0], args[1], args[2], 3.2);
  draw();
  return window.render_game_to_text();
};

window.debug_push_combat_medal = (kind = "challenge") => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  const presets = {
    challenge: ["challenge", "符咒修行 完成", "結算追加 +14 月塵", "#ffe18a"],
    phase: ["phase", "伏擊階段", "疾影加入怪潮，保持移動", "#7edac2"],
    elite: ["elite", "護衛瓦解", "+1 月塵與魂火爆發", "#7edac2"],
    boss: ["boss", "Boss 討伐", "+12 月塵與魂火爆發", "#d6a33f"]
  };
  pushCombatMedal(...(presets[kind] || presets.challenge));
  draw();
  return window.render_game_to_text();
};

window.debug_record_damage_source = (source = "測試符咒", amount = 100) => {
  if (!state.player) resetGame();
  recordDamageSource(String(source || "測試符咒"), Math.max(1, Number(amount) || 1));
  draw();
  return window.render_game_to_text();
};

window.debug_seed_combat_readability = () => {
  resetGame();
  state.mode = "playing";
  state.damageSources = {};
  state.stats.blades = Math.max(state.stats.blades, 1);
  state.stats.fire.burn = Math.max(state.stats.fire.burn, 2);
  state.stats.poison.venom = Math.max(state.stats.poison.venom, 2);
  if (!saveData.unlockedSummons.includes("shadow_moth")) saveData.unlockedSummons.push("shadow_moth");
  saveData.selectedSummon = "shadow_moth";

  const enemy = spawnEnemy("ghoul", { x: state.player.x + 120, y: state.player.y, hp: 999, maxHp: 999 });
  damageEnemy(enemy, 120, 10, "基礎符咒");
  enemy.burn = 1;
  enemy.poison = 1;
  updateEnemies(0.24);
  damageEnemy(enemy, 88, 5, "旋刃");
  damageEnemy(enemy, 64, 2, selectedSummon().name);
  triggerPlayerHurtFeedback(18, "Boss 法彈");
  state.message = "戰鬥來源已建立：符咒、燃燒、毒傷、旋刃、召喚。";
  draw();
  return window.render_game_to_text();
};

window.debug_damage_player = (amount = 20) => {
  if (!state.player) resetGame();
  const dealt = Math.max(1, Number(amount) || 1);
  state.player.hp = Math.max(1, state.player.hp - dealt);
  state.player.invuln = Math.max(state.player.invuln, 0.55 + state.stats.hurtGrace);
  state.freeze = Math.max(state.freeze, 0.05);
  state.message = "受傷！用 Shift/Space 閃避，吃魂火升級。";
  triggerPlayerHurtFeedback(dealt, "測試傷害");
  draw();
  return window.render_game_to_text();
};

window.debug_force_death = (source = "測試死亡") => {
  if (!state.player) resetGame();
  state.lastHit = { source, damage: Math.max(1, Math.round(state.player.hp || 1)), t: 2.2 };
  state.player.hp = 0;
  state.mode = "dead";
  finalizeRun();
  draw();
  return window.render_game_to_text();
};

window.debug_spawn_boss = () => {
  if (!state.player) resetGame();
  spawnEnemy("boss");
  draw();
  return window.render_game_to_text();
};

window.debug_damage_boss = (amount = 250) => {
  if (!state.player) resetGame();
  const boss = activeBosses()[0] || spawnEnemy("boss");
  damageEnemy(boss, Math.max(1, Number(amount) || 1), 0, "Debug Boss 傷害");
  draw();
  return window.render_game_to_text();
};

window.debug_spawn_final_boss = () => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  const boss = spawnFinalBoss();
  draw();
  return window.render_game_to_text();
};

window.debug_damage_final_boss = (amount = 999999) => {
  if (!state.player) resetGame();
  if (!state.finalBossActive) spawnFinalBoss();
  const boss = activeBosses().find((item) => item.finalBoss) || activeBosses()[0];
  if (boss) damageEnemy(boss, Math.max(1, Number(amount) || 1), 0, "Debug 終局 Boss 傷害");
  draw();
  return window.render_game_to_text();
};

window.debug_set_final_boss_hp_ratio = (ratio = 0.5) => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  if (!state.finalBossActive) spawnFinalBoss();
  const boss = activeBosses().find((item) => item.finalBoss);
  if (boss) {
    boss.hp = Math.max(1, boss.maxHp * clamp(Number(ratio) || 0.5, 0.02, 1));
    updateFinalBossPhaseBreaks(boss);
  }
  draw();
  return window.render_game_to_text();
};

window.debug_choose_boss_reward = (index = 0) => {
  if (state.mode !== "bossReward") return window.render_game_to_text();
  chooseBossReward(Math.max(0, Math.min(2, Math.floor(Number(index) || 0))));
  return window.render_game_to_text();
};

window.debug_open_event_choice = () => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  openEventChoice("debug");
  draw();
  return window.render_game_to_text();
};

window.debug_choose_event_choice = (index = 0) => {
  if (state.mode !== "eventChoice") return window.render_game_to_text();
  chooseEventChoice(Math.max(0, Math.min(2, Math.floor(Number(index) || 0))));
  return window.render_game_to_text();
};

window.debug_spawn_enemy = (kind = "ghoul", count = 1, nearPlayer = false) => {
  if (!state.player) resetGame();
  const total = Math.max(1, Math.min(40, Math.floor(Number(count) || 1)));
  for (let i = 0; i < total; i++) {
    const enemy = spawnEnemy(kind);
    if (nearPlayer && enemy) {
      const angle = (i / total) * TWO_PI;
      const radius = kind === "warden" ? 96 : 122 + (i % 3) * 18;
      enemy.x = clamp(state.player.x + Math.cos(angle) * radius, 40, WORLD_W - 40);
      enemy.y = clamp(state.player.y + Math.sin(angle) * radius, 40, WORLD_H - 40);
    }
  }
  draw();
  return window.render_game_to_text();
};

window.debug_force_enemy_cast = (kind = "mage", special = false) => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  const targetKind = kind === "boss" || kind === "finalBoss" ? "boss" : "mage";
  let enemy = state.enemies.find((item) => item.kind === targetKind && (kind !== "finalBoss" || item.finalBoss));
  if (!enemy) enemy = kind === "finalBoss" ? spawnFinalBoss() : spawnEnemy(targetKind);
  if (enemy) {
    enemy.x = clamp(state.player.x + 320, 80, WORLD_W - 80);
    enemy.y = clamp(state.player.y - 24, 80, WORLD_H - 80);
    if (special && enemy.kind === "boss") queueBossSpecial(enemy);
    else queueEnemyShot(enemy);
  }
  draw();
  return window.render_game_to_text();
};

window.debug_force_weaver_conjure = () => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  let weaver = state.enemies.find((item) => item.kind === "weaver");
  if (!weaver) {
    weaver = spawnEnemy("weaver");
    if (weaver) {
      weaver.x = clamp(state.player.x + 280, 80, WORLD_W - 80);
      weaver.y = clamp(state.player.y - 24, 80, WORLD_H - 80);
    }
  }
  if (weaver) queueWeaverConjure(weaver);
  draw();
  return window.render_game_to_text();
};

window.debug_force_mirror_shot = () => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  let lantern = state.enemies.find((item) => item.kind === "mirror_lantern");
  if (!lantern) {
    lantern = spawnEnemy("mirror_lantern");
    if (lantern) {
      lantern.x = clamp(state.player.x + 300, 80, WORLD_W - 80);
      lantern.y = clamp(state.player.y - 24, 80, WORLD_H - 80);
    }
  }
  if (lantern) queueMirrorShot(lantern);
  draw();
  return window.render_game_to_text();
};

window.debug_force_bind_seals = () => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  let binder = state.enemies.find((item) => item.kind === "talisman_binder");
  if (!binder) {
    binder = spawnEnemy("talisman_binder");
    if (binder) {
      binder.x = clamp(state.player.x + 260, 80, WORLD_W - 80);
      binder.y = clamp(state.player.y - 24, 80, WORLD_H - 80);
    }
  }
  if (binder) placeBindSeals(binder);
  draw();
  return window.render_game_to_text();
};

window.debug_kill_enemy_kind = (kind = "bomber") => {
  if (!state.player) resetGame();
  const enemy = state.enemies.find((item) => item.kind === kind);
  if (enemy) damageEnemy(enemy, enemy.hp + 999, 0, `Debug 擊殺：${kind}`);
  draw();
  return window.render_game_to_text();
};

window.debug_player_anim = (kind = "attack") => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  if (kind === "attack") state.player.attackT = HERO_ANIM.attack;
  else if (kind === "hit") state.player.hurtT = HERO_ANIM.hit;
  else if (kind === "dash") state.player.dashAnimT = HERO_ANIM.dash;
  draw();
  return window.render_game_to_text();
};

window.debug_afflict_enemy = () => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  let enemy = state.enemies.find((item) => item.kind === "ghoul") || spawnEnemy("ghoul");
  if (enemy) {
    enemy.x = clamp(state.player.x + 120, 40, WORLD_W - 40);
    enemy.y = clamp(state.player.y, 40, WORLD_H - 40);
    enemy.burn = 2;
    enemy.poison = 2;
    enemy.slow = 2;
    enemy.curse = 2;
  }
  draw();
  return {
    afflicted: enemy
      ? { burn: enemy.burn, poison: enemy.poison, slow: enemy.slow, curse: enemy.curse }
      : null
  };
};

window.debug_move_player_to_bind_seal = () => {
  if (!state.player) return null;
  const seal = state.hazards.find((h) => h.kind === "bindSeal");
  if (seal) {
    state.player.x = seal.x;
    state.player.y = seal.y;
    state.player.invuln = 0;
  }
  draw();
  return window.render_game_to_text();
};

window.debug_open_pause = (tab = "skills") => {
  if (!state.player) resetGame();
  if (state.mode !== "playing") state.mode = "playing";
  openPause(["skills", "stats", "missions", "codex", "settings"].includes(tab) ? tab : "skills");
  return window.render_game_to_text();
};

window.debug_stress_entities = () => {
  if (!state.player) resetGame();
  for (let i = 0; i < 220; i++) {
    const kind = i % 13 === 0 ? "brute" : i % 7 === 0 ? "mage" : i % 5 === 0 ? "skitter" : "ghoul";
    const enemy = spawnEnemy(kind);
    if (!enemy) continue;
    const angle = (i / 220) * TWO_PI;
    const radius = 170 + (i % 9) * 42;
    enemy.x = clamp(state.player.x + Math.cos(angle) * radius, 40, WORLD_W - 40);
    enemy.y = clamp(state.player.y + Math.sin(angle) * radius, 40, WORLD_H - 40);
  }
  spawnEnemy("boss");
  for (let i = 0; i < 260; i++) {
    const angle = Math.random() * TWO_PI;
    const radius = rand(40, 560);
    addPickup(
      clamp(state.player.x + Math.cos(angle) * radius, 40, WORLD_W - 40),
      clamp(state.player.y + Math.sin(angle) * radius, 40, WORLD_H - 40),
      1 + (i % 3)
    );
  }
  for (let i = 0; i < 140; i++) {
    addEffect(
      i % 3 === 0 ? "fireBurst" : i % 3 === 1 ? "waterBurst" : "lightningBurst",
      clamp(state.player.x + rand(-520, 520), 40, WORLD_W - 40),
      clamp(state.player.y + rand(-340, 340), 40, WORLD_H - 40),
      rand(36, 110),
      rand(0.35, 0.9)
    );
  }
  for (let i = 0; i < 120; i++) {
    state.damageText.push({
      x: state.player.x + rand(-280, 280),
      y: state.player.y + rand(-180, 180),
      text: String(10 + (i % 90)),
      amount: 10 + (i % 90),
      color: i % 2 ? "#f8d37b" : "#7df1ff",
      life: 0.8,
      maxLife: 0.8
    });
  }
  enforceEntityBudgets();
  draw();
  return window.render_game_to_text();
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
