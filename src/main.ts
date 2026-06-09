import Phaser from "phaser";
import "./style.css";
import { GameScene } from "./scenes/GameScene";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { UpgradeScene } from "./scenes/UpgradeScene";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="game-shell">
    <div id="game"></div>
  </div>
`;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#111418",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1050 },
      debug: false
    }
  },
  pixelArt: true,
  roundPixels: true,
  scene: [BootScene, MenuScene, GameScene, UpgradeScene]
};

new Phaser.Game(config);
