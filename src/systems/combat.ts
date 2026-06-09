import type { ProgressState } from "./progression";

export type PlayerStats = {
  maxHp: number;
  damage: number;
  moveSpeed: number;
  jumpSpeed: number;
  maxStamina: number;
  staminaRegen: number;
};

export function buildPlayerStats(progress: ProgressState): PlayerStats {
  return {
    maxHp: 110 + progress.vitality * 24,
    damage: 18 + progress.blade * 7,
    moveSpeed: 235 + progress.tempo * 12,
    jumpSpeed: 520 + progress.tempo * 10,
    maxStamina: 100 + progress.tempo * 12,
    staminaRegen: 26 + progress.tempo * 4
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
