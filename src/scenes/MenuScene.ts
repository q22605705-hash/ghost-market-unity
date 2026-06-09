import Phaser from "phaser";
import { loadProgress, resetProgress } from "../systems/progression";

export class MenuScene extends Phaser.Scene {
  private panel?: HTMLDivElement;

  constructor() {
    super("MenuScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#14191d");
    this.drawBackdrop();
    const progress = loadProgress();
    this.panel = document.createElement("div");
    this.panel.className = "screen";
    this.panel.innerHTML = `
      <section class="menu-panel">
        <h1>妖市獵人</h1>
        <p>白日攢符、夜入妖市。斬開十二幀的刀光，打倒市場深處的面具神，帶著金符回來升級。</p>
        <p>金符 ${progress.coins} ｜ 最深波數 ${progress.bestWave}</p>
        <div class="actions">
          <button class="btn" data-action="start">開始狩獵</button>
          <button class="btn secondary" data-action="upgrade">升級</button>
          <button class="btn secondary" data-action="reset">重置存檔</button>
        </div>
      </section>
    `;
    document.querySelector(".game-shell")!.appendChild(this.panel);
    this.panel.addEventListener("click", this.onClick);
  }

  shutdown() {
    this.panel?.removeEventListener("click", this.onClick);
    this.panel?.remove();
  }

  private onClick = (event: Event) => {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;
    if (!action) return;
    if (action === "start") {
      this.shutdown();
      this.scene.start("GameScene");
    }
    if (action === "upgrade") {
      this.shutdown();
      this.scene.start("UpgradeScene");
    }
    if (action === "reset") {
      resetProgress();
      this.shutdown();
      this.scene.restart();
    }
  };

  private drawBackdrop() {
    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "market-bg");
    bg.setDisplaySize(this.scale.width, this.scale.height);
    const g = this.add.graphics();
    const w = this.scale.width;
    const h = this.scale.height;
    g.fillStyle(0x08090b, 0.48).fillRect(0, 0, w, h);
    g.fillStyle(0x08090b, 0.28).fillRect(0, h * 0.56, w, h * 0.44);
  }
}
