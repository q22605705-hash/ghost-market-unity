import Phaser from "phaser";
import { events, type HudState } from "../systems/events";

export class HudScene extends Phaser.Scene {
  private root?: HTMLDivElement;
  private gameOverOverlay?: HTMLDivElement;

  constructor() {
    super("HudScene");
  }

  create() {
    this.cleanup();
    this.root = document.createElement("div");
    this.root.className = "hud";
    document.querySelector(".game-shell")!.appendChild(this.root);
    events.on("hud", this.render, this);
    events.on("game-over", this.onGameOver, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  private cleanup() {
    events.off("hud", this.render, this);
    events.off("game-over", this.onGameOver, this);
    this.root?.remove();
    this.root = undefined;
    this.gameOverOverlay?.remove();
    this.gameOverOverlay = undefined;
  }

  private render(state: HudState) {
    if (!this.root) return;
    const hp = Math.max(0, Math.round((state.hp / state.maxHp) * 100));
    const stamina = Math.max(0, Math.round((state.stamina / state.maxStamina) * 100));
    const boss = state.bossMaxHp > 0 ? Math.max(0, Math.round((state.bossHp / state.bossMaxHp) * 100)) : 0;
    this.root.innerHTML = `
      <div class="topbar">
        <div class="stat"><span class="label">生命</span><div class="meter"><div class="fill" style="--value:${hp}%"></div></div></div>
        <div class="stat"><span class="label">體力</span><div class="meter"><div class="fill stamina" style="--value:${stamina}%"></div></div></div>
        <div class="stat"><span class="label">Boss</span><div class="meter"><div class="fill boss" style="--value:${boss}%"></div></div></div>
        <div class="stat"><span class="label">金符</span>${state.coins}</div>
        <div class="stat"><span class="label">波數</span>${state.wave}</div>
      </div>
      <div></div>
      <div class="bottombar">${state.message}</div>
    `;
  }

  private onGameOver = (payload: { won: boolean; coins: number }) => {
    this.gameOverOverlay?.remove();
    const overlay = document.createElement("div");
    this.gameOverOverlay = overlay;
    overlay.className = "screen";
    overlay.innerHTML = `
      <section class="menu-panel">
        <h2>${payload.won ? "面具神退散" : "夜市吞沒了你"}</h2>
        <p>本輪帶回 ${payload.coins} 金符。升級後再進妖市，會明顯更強。</p>
        <div class="actions">
          <button class="btn" data-action="upgrade">升級</button>
          <button class="btn secondary" data-action="retry">再打一場</button>
          <button class="btn secondary" data-action="menu">主選單</button>
        </div>
      </section>
    `;
    document.querySelector(".game-shell")!.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      const action = (event.target as HTMLElement).dataset.action;
      if (!action) return;
      const sceneManager = this.game.scene;
      this.cleanup();
      if (action === "retry") {
        window.setTimeout(() => {
          sceneManager.stop("HudScene");
          sceneManager.stop("GameScene");
          sceneManager.start("GameScene");
        }, 0);
      }
      if (action === "upgrade") {
        window.setTimeout(() => {
          sceneManager.stop("HudScene");
          sceneManager.stop("GameScene");
          sceneManager.start("UpgradeScene");
        }, 0);
      }
      if (action === "menu") {
        window.setTimeout(() => {
          sceneManager.stop("HudScene");
          sceneManager.stop("GameScene");
          sceneManager.start("MenuScene");
        }, 0);
      }
    });
  };
}
