import Phaser from "phaser";
import { buildPlayerStats, clamp, type PlayerStats } from "../systems/combat";
import { loadProgress, saveProgress, type ProgressState } from "../systems/progression";

type EnemyKind = "imp" | "brute" | "boss";

type Enemy = Phaser.Physics.Arcade.Sprite & {
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  damage: number;
  attackCd: number;
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private charms!: Phaser.Physics.Arcade.Group;
  private stats!: PlayerStats;
  private progress!: ProgressState;
  private hp = 100;
  private stamina = 100;
  private coinsThisRun = 0;
  private wave = 1;
  private attacking = false;
  private attackHitIds = new Set<string>();
  private invulnerableUntil = 0;
  private boss?: Enemy;
  private gameEnded = false;
  private hudRoot?: HTMLDivElement;
  private gameOverOverlay?: HTMLDivElement;
  private message = "方向鍵/A,D 移動，Space 跳躍，J/滑鼠左鍵 攻擊，K 衝刺。";

  constructor() {
    super("GameScene");
  }

  create() {
    this.cleanupDom();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupDom, this);
    this.progress = loadProgress();
    this.stats = buildPlayerStats(this.progress);
    this.hp = this.stats.maxHp;
    this.stamina = this.stats.maxStamina;
    this.coinsThisRun = 0;
    this.wave = 1;
    this.attacking = false;
    this.attackHitIds.clear();
    this.invulnerableUntil = 0;
    this.boss = undefined;
    this.gameEnded = false;
    this.message = "方向鍵/A,D 移動，Space 跳躍，J/滑鼠左鍵 攻擊，K 衝刺。";
    this.setupWorld();
    this.setupPlayer();
    this.setupInput();
    this.spawnWave();
    this.emitHud();
  }

  update(time: number, delta: number) {
    if (this.gameEnded) return;
    const dt = delta / 1000;
    this.updatePlayer(time, dt);
    this.updateEnemies(time, dt);
    this.updateCamera();
    this.stamina = clamp(this.stamina + this.stats.staminaRegen * dt, 0, this.stats.maxStamina);
    if (this.enemies.countActive(true) === 0) this.nextWave();
    this.emitHud();
  }

  private setupWorld() {
    const width = 2400;
    const height = 720;
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);
    this.drawMarket(width, height);

    this.platforms = this.physics.add.staticGroup();
    this.addPlatform(width / 2, 668, width, 112);
    this.addPlatform(450, 515, 240, 34);
    this.addPlatform(980, 430, 260, 34);
    this.addPlatform(1460, 500, 230, 34);
    this.addPlatform(1940, 410, 280, 34);

    this.enemies = this.physics.add.group({ allowGravity: true });
    this.charms = this.physics.add.group({ allowGravity: true });
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.charms, this.platforms);
  }

  private setupPlayer() {
    this.player = this.physics.add.sprite(160, 520, "hero");
    this.player.setScale(0.95);
    this.player.setSize(38, 72);
    this.player.setOffset(61, 70);
    this.player.setCollideWorldBounds(true);
    this.player.play("hero-idle");
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => this.touchEnemy(enemy as Enemy));
    this.physics.add.overlap(this.player, this.charms, (_, charm) => this.collectCharm(charm as Phaser.Physics.Arcade.Sprite));
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,J,K") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on("pointerdown", () => this.tryAttack(this.time.now));
  }

  private updatePlayer(time: number, dt: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = this.cursors.space.isDown || this.cursors.up.isDown || this.keys.W.isDown;
    const dash = this.keys.K.isDown;
    const attack = Phaser.Input.Keyboard.JustDown(this.keys.J);
    const speed = dash && this.stamina > 18 ? this.stats.moveSpeed * 1.65 : this.stats.moveSpeed;

    if (dash && (left || right) && this.stamina > 18) this.stamina = Math.max(0, this.stamina - 72 * dt);
    if (left) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jump && body.blocked.down) {
      this.player.setVelocityY(-this.stats.jumpSpeed);
      this.stamina = Math.max(0, this.stamina - 12);
    }

    if (attack) this.tryAttack(time);

    if (this.attacking) return;
    if (!body.blocked.down) this.player.play("hero-jump", true);
    else if (Math.abs(body.velocity.x) > 5) this.player.play("hero-run", true);
    else this.player.play("hero-idle", true);
  }

  private tryAttack(time: number) {
    if (this.attacking || this.stamina < 18) return;
    this.attacking = true;
    this.attackHitIds.clear();
    this.stamina -= 18;
    this.player.setFrame(0);
    this.player.anims.stop();
    this.spawnSlashVisual();
    this.time.delayedCall(110, () => this.resolveAttack(time));
    this.time.delayedCall(360, () => {
      this.attacking = false;
    });
  }

  private spawnSlashVisual() {
    const facing = this.player.flipX ? -1 : 1;
    const baseX = this.player.x + facing * 46;
    const baseY = this.player.y - 24;
    const slash = this.add.graphics();
    slash.setDepth(8);
    slash.lineStyle(8, 0x9fffee, 0.82);
    slash.beginPath();
    slash.arc(baseX, baseY, 42, facing > 0 ? -0.9 : Math.PI + 0.9, facing > 0 ? 0.65 : Math.PI - 0.65, false);
    slash.strokePath();
    slash.lineStyle(3, 0xf6ffe9, 0.95);
    slash.beginPath();
    slash.arc(baseX, baseY, 49, facing > 0 ? -0.65 : Math.PI + 0.65, facing > 0 ? 0.42 : Math.PI - 0.42, false);
    slash.strokePath();
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => slash.destroy()
    });
  }

  private resolveAttack(time: number) {
    const range = 112;
    const facing = this.player.flipX ? -1 : 1;
    const hitX = this.player.x + facing * 58;
    const hitY = this.player.y;
    const flash = this.add.graphics().fillStyle(0xe8d19b, 0.16).fillEllipse(hitX, hitY - 8, range, 72).setDepth(4);
    this.time.delayedCall(70, () => flash.destroy());

    for (const obj of this.enemies.getChildren()) {
      const enemy = obj as Enemy;
      const id = enemy.getData("id") as string;
      if (!enemy.active || this.attackHitIds.has(id)) continue;
      const inArc = Math.abs(enemy.x - hitX) < range * 0.55 && Math.abs(enemy.y - hitY) < 88;
      const correctSide = Math.sign(enemy.x - this.player.x) === facing || Math.abs(enemy.x - this.player.x) < 34;
      if (inArc && correctSide) {
        this.attackHitIds.add(id);
        this.damageEnemy(enemy, this.stats.damage, time);
      }
    }
  }

  private updateEnemies(time: number, dt: number) {
    for (const obj of this.enemies.getChildren()) {
      const enemy = obj as Enemy;
      if (!enemy.active) continue;
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const dir = Math.sign(this.player.x - enemy.x) || 1;
      const speed = enemy.kind === "boss" ? 80 : enemy.kind === "brute" ? 72 : 118;
      enemy.setVelocityX(dir * speed);
      enemy.setFlipX(dir < 0);
      if (body.blocked.down && enemy.kind !== "boss" && Math.abs(this.player.y - enemy.y) > 90 && Math.random() < dt * 0.85) {
        enemy.setVelocityY(-420);
      }
      if (enemy.kind === "boss") this.updateBoss(enemy, time);
    }
  }

  private updateBoss(enemy: Enemy, time: number) {
    if (time < enemy.attackCd) return;
    enemy.attackCd = time + 1600;
    const projectile = this.physics.add.sprite(enemy.x, enemy.y - 28, "charm", 0);
    projectile.play("charm-spin");
    projectile.setScale(1.5);
    projectile.setVelocity(Math.sign(this.player.x - enemy.x) * 330, -120);
    projectile.setData("damage", 16);
    this.physics.add.collider(projectile, this.platforms, () => projectile.destroy());
    this.physics.add.overlap(projectile, this.player, () => {
      this.takeDamage(projectile.getData("damage"));
      projectile.destroy();
    });
    this.time.delayedCall(3200, () => projectile.destroy());
  }

  private touchEnemy(enemy: Enemy) {
    this.takeDamage(enemy.damage);
  }

  private takeDamage(amount: number) {
    const now = this.time.now;
    if (now < this.invulnerableUntil || this.gameEnded) return;
    this.invulnerableUntil = now + 720;
    this.hp -= amount;
    this.player.setTint(0xff6b6b);
    this.cameras.main.shake(100, 0.006);
    this.time.delayedCall(130, () => this.player.clearTint());
    if (this.hp <= 0) this.endGame(false);
  }

  private damageEnemy(enemy: Enemy, amount: number, time: number) {
    enemy.hp -= amount;
    enemy.setTint(0xfff0a8);
    enemy.setVelocityY(-120);
    enemy.setVelocityX((enemy.x < this.player.x ? -1 : 1) * 220);
    this.time.delayedCall(90, () => enemy.clearTint());
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  private killEnemy(enemy: Enemy) {
    const value = enemy.kind === "boss" ? 120 : enemy.kind === "brute" ? 24 : 14;
    for (let i = 0; i < Math.ceil(value / 14); i++) {
      const charm = this.charms.create(enemy.x + Phaser.Math.Between(-16, 16), enemy.y - 24, "charm", 0) as Phaser.Physics.Arcade.Sprite;
      charm.play("charm-spin");
      charm.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(-260, -120));
      charm.setData("value", i === 0 ? value - (Math.ceil(value / 14) - 1) * 14 : 14);
    }
    enemy.destroy();
    if (enemy.kind === "boss") this.endGame(true);
  }

  private collectCharm(charm: Phaser.Physics.Arcade.Sprite) {
    this.coinsThisRun += charm.getData("value") ?? 10;
    charm.destroy();
  }

  private nextWave() {
    this.wave += 1;
    if (this.wave > 5) {
      this.spawnBoss();
    } else {
      this.message = `第 ${this.wave} 波。妖市正在變吵。`;
      this.spawnWave();
    }
  }

  private spawnWave() {
    const count = 2 + this.wave;
    for (let i = 0; i < count; i++) {
      const kind: EnemyKind = i % 4 === 0 && this.wave > 2 ? "brute" : "imp";
      this.spawnEnemy(kind, 620 + i * 260 + Phaser.Math.Between(-40, 40), 520);
    }
  }

  private spawnBoss() {
    if (this.boss?.active) return;
    this.message = "面具神現身。打倒它，這一夜就算你贏。";
    this.boss = this.spawnEnemy("boss", 1900, 460);
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number) {
    const enemy = this.enemies.create(x, y, kind, 0) as Enemy;
    enemy.kind = kind;
    enemy.maxHp = kind === "boss" ? 360 + this.wave * 30 : kind === "brute" ? 84 : 44;
    enemy.hp = enemy.maxHp;
    enemy.damage = kind === "boss" ? 24 : kind === "brute" ? 18 : 11;
    enemy.attackCd = 0;
    enemy.setData("id", Phaser.Math.RND.uuid());
    enemy.setScale(kind === "boss" ? 1.08 : kind === "brute" ? 1.05 : 0.9);
    enemy.setSize(kind === "boss" ? 104 : kind === "brute" ? 62 : 42, kind === "boss" ? 112 : kind === "brute" ? 76 : 48);
    enemy.play(kind === "boss" ? "boss-idle" : `${kind}-move`);
    return enemy;
  }

  private endGame(won: boolean) {
    if (this.gameEnded) return;
    this.gameEnded = true;
    const reward = this.coinsThisRun + (won ? 160 : 0) + this.wave * 8;
    this.progress.coins += reward;
    this.progress.bestWave = Math.max(this.progress.bestWave, this.wave);
    saveProgress(this.progress);
    this.message = won ? "你帶著金符走出妖市。" : "倒下前，你仍抓住了一些金符。";
    this.emitHud();
    this.showGameOver(won, reward);
  }

  private emitHud() {
    this.ensureHud();
    if (!this.hudRoot) return;
    const hp = Math.max(0, Math.round((this.hp / this.stats.maxHp) * 100));
    const stamina = Math.max(0, Math.round((this.stamina / this.stats.maxStamina) * 100));
    const bossHp = this.boss?.active ? this.boss.hp : 0;
    const bossMaxHp = this.boss?.active ? this.boss.maxHp : 1;
    const boss = bossMaxHp > 0 ? Math.max(0, Math.round((bossHp / bossMaxHp) * 100)) : 0;
    this.hudRoot.innerHTML = `
      <div class="topbar">
        <div class="stat"><span class="label">生命</span><div class="meter"><div class="fill" style="--value:${hp}%"></div></div></div>
        <div class="stat"><span class="label">體力</span><div class="meter"><div class="fill stamina" style="--value:${stamina}%"></div></div></div>
        <div class="stat"><span class="label">Boss</span><div class="meter"><div class="fill boss" style="--value:${boss}%"></div></div></div>
        <div class="stat"><span class="label">金符</span>${this.coinsThisRun}</div>
        <div class="stat"><span class="label">波數</span>${this.wave}</div>
      </div>
      <div></div>
      <div class="bottombar">${this.message}</div>
    `;
  }

  private ensureHud() {
    if (this.hudRoot) return;
    this.hudRoot = document.createElement("div");
    this.hudRoot.className = "hud";
    document.querySelector(".game-shell")!.appendChild(this.hudRoot);
  }

  private showGameOver(won: boolean, coins: number) {
    this.gameOverOverlay?.remove();
    const overlay = document.createElement("div");
    this.gameOverOverlay = overlay;
    overlay.className = "screen";
    overlay.innerHTML = `
      <section class="menu-panel">
        <h2>${won ? "面具神退散" : "夜市吞沒了你"}</h2>
        <p>本輪帶回 ${coins} 金符。升級後再進妖市，會明顯更強。</p>
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
      this.cleanupDom();
      if (action === "retry") this.scene.restart();
      if (action === "upgrade") this.scene.start("UpgradeScene");
      if (action === "menu") this.scene.start("MenuScene");
    });
  }

  private cleanupDom = () => {
    this.hudRoot?.remove();
    this.hudRoot = undefined;
    this.gameOverOverlay?.remove();
    this.gameOverOverlay = undefined;
  };

  private updateCamera() {
    const zoom = this.scale.width < 760 ? 0.86 : 1;
    this.cameras.main.setZoom(zoom);
  }

  private drawMarket(width: number, height: number) {
    const bg = this.add.image(width / 2, height / 2, "market-bg");
    bg.setDisplaySize(width, height);
    bg.setDepth(-20);
    const g = this.add.graphics();
    g.setDepth(-10);
    g.fillStyle(0x0f1114, 0.18).fillRect(0, 0, width, height);
    g.fillStyle(0x101417, 0.58).fillRect(0, 600, width, 110);
  }

  private addPlatform(x: number, y: number, width: number, height = 48) {
    this.drawPlatformVisual(x, y, width, height);
    const platform = this.add.rectangle(x, y, width, height, 0x000000, 0);
    platform.setVisible(false);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
  }

  private drawPlatformVisual(x: number, y: number, width: number, height: number) {
    const left = x - width / 2;
    const top = y - height / 2;
    const g = this.add.graphics();
    g.setDepth(-1);
    g.fillStyle(0x34251e, 0.94).fillRoundedRect(left, top + 8, width, height - 8, 6);
    g.fillStyle(0x6f4935, 0.96).fillRoundedRect(left, top, width, 18, 5);
    g.lineStyle(2, 0x1b1412, 0.7).strokeRoundedRect(left, top, width, height, 6);
    g.lineStyle(1, 0x8fd8bd, 0.18).lineBetween(left, top + 2, left + width, top + 2);
    for (let px = left + 42; px < left + width; px += 56) {
      g.lineStyle(2, 0x1b1412, 0.45).lineBetween(px, top + 2, px - 8, top + height - 6);
    }
  }
}
