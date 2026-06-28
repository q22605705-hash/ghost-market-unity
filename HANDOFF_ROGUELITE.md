# 肉鴿手遊專案交接摘要

更新時間：2026-06-21

## 專案定位

目前主線不是早期 Phaser 橫向動作版，也不是 `UnityProject`，而是 `survivor/` 下的瀏覽器 2D 割草 Roguelite 原型。遊戲方向是 `貓符月影` / `Ghost Market` 類型：俯視角割草、魂火經驗、元素流派、Boss 節點、終局 Boss、局外成長、記憶碎片與任務推進。

`UnityProject/` 仍保留 Unity 2D 動作 Roguelite 框架，已曾用 Unity `6000.0.40f1` CLI 編譯出 `GhostMarket.dll`。但最近多輪工作都集中在 `survivor/game.js`，後續若要快速推完整遊戲內容，應優先沿用 `survivor` 線。

## 舊對話主要脈絡

- 最初從「Steam 2D 成功作品」分析切入，標竿包含 Cuphead / Terraria。
- 先做過一版瀏覽器橫向動作原型，含 GPT 綠幕角色、Luma Key、主選單、升級、Boss、重新開始流程；後來因攻擊圖疊影、重開卡住等問題，轉向重做。
- 曾建立 Unity 2D 框架：玩家狀態機、移動、跳躍、閃避、三段攻擊、技能入口、hitstop、擊退、受擊無敵、房間與存檔格式。
- 之後主戰場轉為 `survivor` 俯視角割草版，並部署到 GitHub Pages：`https://q22605705-hash.github.io/ghost-market-unity/`。

## 目前已落地的核心內容

- 戰鬥：自動符咒、元素分支、被動、召喚同伴、旋刃、敵方彈幕、危險區、Boss、終局 Boss。
- 成長：升級三選一、技能升級/進化、Boss reward、事件抉擇、本局委託、局外月塵升級、召喚解鎖、任務領獎。
- 內容結構：短局割草、狂潮試煉、月之庭園、故事章節焦點、故事事件、記憶碎片與收藏進度。
- 可讀性：戰鬥追蹤器、Boss HUD、威脅摘要、雷達、教學任務、目標羅盤、暫停頁紀錄、結算推進摘要。
- 視覺/體驗：GPT 透明 spritesheet、技能 VFX 圖集、場景背景、動態音樂、氛圍層、戰鬥獎章、低血量提示、傷害數字、可關閉震動/提示/傷害字。
- QA 方式：大量功能透過 `render_game_to_text` 暴露狀態，並用 Playwright / Browser 測試確認無 console error、無 failed request。

## 目前工作樹狀態

主要未提交修改集中在：

- `survivor/game.js`
- `survivor/index.html`
- `survivor/assets/survivor-sprites.png`
- `progress.md`
- 本交接檔 `HANDOFF_ROGUELITE.md`

另外有大量歷史截圖、playtest JSON、素材暫存與工具輸出是 untracked。不要隨意清掉，除非先確認哪些是要保留的證據、哪些只是暫存。

## 這次接續已完成

- 依使用者指定讀取 `PROJECT_INDEX.md`、`manifest.csv`，並分批抽讀 `rollout-2026-06-09...` 的 chunk 檔，沒有讀原始 JSONL，也沒有寫回 Codex sessions。
- 比對現有專案後確認最後一輪未收尾功能是「輸出來源可讀性」。
- 確認 `damageSources` 已接入 `damageEnemy`、Pause > Stats、`render_game_to_text`。
- 補上 debug 傷害來源標籤，避免 QA 傷害被歸為「未標記傷害」：
  - `debug_damage_boss` -> `Debug Boss 傷害`
  - `debug_damage_final_boss` -> `Debug 終局 Boss 傷害`
  - `debug_kill_enemy_kind` -> `Debug 擊殺：kind`
- 將這輪狀態追加到 `progress.md`。

## 已驗證

- `node --check survivor/game.js`
- `npx.cmd tsc --pretty false`
- `git diff --check -- survivor/game.js survivor/index.html progress.md`
- 本機 HTTP + Playwright：
  - 開啟 `http://127.0.0.1:8094/?v=handoff-damage-readout`
  - 呼叫 `debug_spawn_boss` / `debug_damage_boss(321)`
  - 呼叫 `debug_spawn_final_boss` / `debug_damage_final_boss(123)`
  - `render_game_to_text().damageSources` 正確回報總傷害 `444`，兩個來源分別為 321 / 123。
  - 無 console error、無 failed request。

## 建議下一步

1. 先決定要不要整理工作樹：目前 untracked 測試證據非常多，可先列出要保留的 playtest 圖與 JSON，再把真正暫存搬到 `tmp/` 或加入忽略規則。
2. 下一個產品向功能建議做「局內輸出統計視覺化延伸」：結算頁加入本局前 3 輸出來源、最高單次傷害/命中數，讓玩家知道流派強弱。
3. 再往後可做「內容密度」：更多敵人/Boss 模式、更多故事章節事件、技能進化圖鑑獎勵，這比再加面板更能提升完整度。
