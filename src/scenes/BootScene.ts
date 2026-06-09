import Phaser from "phaser";
import { artManifest } from "../generated/artManifest";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    for (const key of ["hero", "imp", "brute", "boss"] as const) {
      const meta = artManifest[key];
      this.load.spritesheet(key, meta.texture, {
        frameWidth: meta.frameWidth,
        frameHeight: meta.frameHeight,
        margin: 0,
        spacing: 0
      });
    }
    this.load.image("market-bg", artManifest.market.texture);
    this.load.image("platform-art", artManifest.platform.texture);
  }

  create() {
    this.createGeneratedSheets();
    this.createSpriteAnimations();
    this.scene.start("MenuScene");
  }

  private createSpriteAnimations() {
    const make = (texture: string, key: string, row: number, frameRate: number, repeat: number) => {
      this.anims.create({
        key: `${texture}-${key}`,
        frames: this.anims.generateFrameNumbers(texture, {
          start: row * 12,
          end: row * 12 + 11
        }),
        frameRate,
        repeat
      });
    };

    make("hero", "idle", artManifest.hero.animations.idle.row, artManifest.hero.animations.idle.fps, -1);
    make("hero", "run", artManifest.hero.animations.run.row, artManifest.hero.animations.run.fps, -1);
    make("hero", "attack", artManifest.hero.animations.attack.row, artManifest.hero.animations.attack.fps, 0);
    make("hero", "jump", artManifest.hero.animations.jump.row, artManifest.hero.animations.jump.fps, -1);
    make("imp", "move", artManifest.imp.animations.move.row, artManifest.imp.animations.move.fps, -1);
    make("brute", "move", artManifest.brute.animations.move.row, artManifest.brute.animations.move.fps, -1);
    make("boss", "idle", artManifest.boss.animations.idle.row, artManifest.boss.animations.idle.fps, -1);
  }

  private createGeneratedSheets() {
    this.makeCharmSheet();
  }

  private makeCharmSheet() {
    const cell = 28;
    const canvas = this.textures.createCanvas("charm", cell * 12, cell);
    const ctx = canvas!.getContext();
    for (let i = 0; i < 12; i++) {
      const x = i * cell;
      ctx.fillStyle = "#e8d19b";
      ctx.fillRect(x + 8, 3, 12, 19);
      ctx.fillStyle = "#e24d4d";
      ctx.fillRect(x + 10, 7 + (i % 3), 8, 2);
      ctx.fillRect(x + 12, 12, 4, 7);
    }
    canvas!.refresh();
    this.textures.get("charm").add("__BASE", 0, 0, 0, cell * 12, cell);
    for (let i = 0; i < 12; i++) this.textures.get("charm").add(i, 0, i * cell, 0, cell, cell);
    this.anims.create({
      key: "charm-spin",
      frames: this.anims.generateFrameNumbers("charm", { start: 0, end: 11 }),
      frameRate: 12,
      repeat: -1
    });
  }
}
