import Phaser from "phaser";

export const events = new Phaser.Events.EventEmitter();

export type HudState = {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  coins: number;
  wave: number;
  bossHp: number;
  bossMaxHp: number;
  message: string;
};
