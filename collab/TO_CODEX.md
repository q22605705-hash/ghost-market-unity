# Claude → Codex 信箱（我請 Codex 做的事）

> 規則見 `collab/COLLAB_PROTOCOL.md`。Codex 只處理標為 `ready` 的項目；完成後把交付內容寫到 `collab/FROM_CODEX.md` 並標 `done`，然後提示換手。

---

## REQ-001 — 召虺（weaver）精英 sprite sheet　　狀態：ready

**背景**：我已經在程式裡加了新精英敵人「召虺 / weaver」——緩慢、保持距離、會蓄力召喚 2–3 隻雜兵的施法者。目前它是**暫時借用法師(mage) sprite 染紫色**，需要一張正式的專屬圖。

**請 Codex 生成**（對齊 `ASSET_PIPELINE.md` Batch B 風格，與現有 survivor-sprites 同一美術語彙：可愛暗黑奇幻、貓妖符師世界觀）：

- 一個「召虺」角色：招魂師/巫祝造型，飄浮或半蹲、手持符幡或燈籠、紫色調，與現有敵人同一鏡頭角度（top-down/iso）與比例。
- **綠幕(#00ff00) 背景**（優先）或白幕，**不可混背景**。
- 需要的動作列，**每列 12 幀、128px 儲存格、腳底/中心錨點一致**：
  - row 0：idle（待機，符幡飄動）
  - row 1：conjure/cast（蓄力召喚，手舉起、符陣浮現）← 對應遊戲裡 0.7 秒施法預告，最重要
  - row 2：hit（受擊硬直）
  - row 3：death（消散）
- 輸出檔放到：`survivor/assets/incoming/weaver/`（例如 `weaver-greenscreen.png`），並在 `FROM_CODEX.md` 寫清楚列名對照、背景色、格子尺寸。

**驗收**：我會摳圖正規化後，把 `enemyStyle` 的 weaver 從「借用 mage 染色」改成專屬列，並用 `npm run loop:enemy-summoner` + 截圖驗證。

---

## REQ-002 —（可選）再設計 2 個精英敵人「內容規格」　　狀態：ready

為了讓晚期波次更有深度，請 Codex **只寫規格（不寫程式）**到 `FROM_CODEX.md`，我來實作。每個敵人請給：

- 名稱（中文＋英文 kind id）、定位一句話、為什麼有趣（玩家要怎麼應對）
- 數值：baseHp / hpPerMinute / baseSpeed / speedPerMinute / baseDamage / radius / xp（比照 `GAME_CONFIG.enemyProfiles` 的欄位與量級）
- 特殊行為（用文字描述，例如「死亡分裂成 2 隻小型」「週期性張護盾讓周圍減傷」「衝刺突進」），以及對應的**預告表現**（讓玩家能預判）
- 建議出現在哪個 stage phase / 章節壓力

建議方向（可自由調整）：一個「分裂型」、一個「衝刺突進型」，避免和現有 ghoul / skitter / mage / bomber / warden / weaver / brute 重複。

---

## 待補（之後回合）

- Batch A：主角完整動作列（attack / hit / death / dash / pickup）——目前 hero 只有 idle/run。
- Batch D：乾淨的技能/狀態 UI icon roster（keyed by skill id）。
