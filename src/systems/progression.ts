export type UpgradeId = "vitality" | "blade" | "tempo";

export type ProgressState = {
  coins: number;
  vitality: number;
  blade: number;
  tempo: number;
  bestWave: number;
};

const key = "ghost-market-hunter-save";

const defaults: ProgressState = {
  coins: 0,
  vitality: 0,
  blade: 0,
  tempo: 0,
  bestWave: 0
};

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function saveProgress(state: ProgressState) {
  localStorage.setItem(key, JSON.stringify(state));
}

export function resetProgress() {
  localStorage.removeItem(key);
}

export function upgradeCost(id: UpgradeId, state: ProgressState) {
  const level = state[id];
  const base = id === "vitality" ? 60 : id === "blade" ? 80 : 70;
  return base + level * 55;
}

export function buyUpgrade(id: UpgradeId, state: ProgressState) {
  const cost = upgradeCost(id, state);
  if (state.coins < cost || state[id] >= 5) return false;
  state.coins -= cost;
  state[id] += 1;
  saveProgress(state);
  return true;
}
