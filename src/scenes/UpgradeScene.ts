import Phaser from "phaser";
import {
  buyUpgrade,
  loadProgress,
  saveProgress,
  upgradeCost,
  type UpgradeId
} from "../systems/progression";

const labels: Record<UpgradeId, { name: string; desc: string }> = {
  vitality: { name: "血符", desc: "提高生命上限，容錯更高。" },
  blade: { name: "刃符", desc: "提高刀傷，Boss 戰更短。" },
  tempo: { name: "步符", desc: "提高速度、跳躍與體力恢復。" }
};

export class UpgradeScene extends Phaser.Scene {
  private panel?: HTMLDivElement;

  constructor() {
    super("UpgradeScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#15171b");
    this.render();
  }

  private render() {
    this.panel?.remove();
    const progress = loadProgress();
    this.panel = document.createElement("div");
    this.panel.className = "screen";
    const rows = (Object.keys(labels) as UpgradeId[])
      .map((id) => {
        const level = progress[id];
        const cost = upgradeCost(id, progress);
        const disabled = progress.coins < cost || level >= 5 ? "disabled" : "";
        const price = level >= 5 ? "MAX" : `${cost} 金符`;
        return `
          <div class="upgrade-row">
            <div>
              <strong>${labels[id].name} Lv.${level}</strong>
              <span>${labels[id].desc}</span>
            </div>
            <button class="btn" data-upgrade="${id}" ${disabled}>${price}</button>
          </div>
        `;
      })
      .join("");
    this.panel.innerHTML = `
      <section class="upgrade-panel">
        <h2>妖市符店</h2>
        <p>目前金符 ${progress.coins}。每次狩獵都會留下永久資源，讓下一輪更狠一點。</p>
        <div class="upgrades">${rows}</div>
        <div class="actions" style="margin-top: 14px">
          <button class="btn" data-action="start">開始狩獵</button>
          <button class="btn secondary" data-action="menu">回主選單</button>
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
    const upgrade = target.dataset.upgrade as UpgradeId | undefined;
    if (upgrade) {
      const progress = loadProgress();
      buyUpgrade(upgrade, progress);
      saveProgress(progress);
      this.render();
      return;
    }

    if (target.dataset.action === "start") {
      this.shutdown();
      this.scene.start("GameScene");
    }
    if (target.dataset.action === "menu") {
      this.shutdown();
      this.scene.start("MenuScene");
    }
  };
}
