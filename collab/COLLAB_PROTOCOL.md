# Claude × Codex 協作協定

本檔定義 Claude（程式/整合/摳圖）與 Codex（內容/生圖）如何在同一個 repo 上非同步合作開發 `survivor/` 這款遊戲。

## 角色分工

| Lane | 負責人 | 做什麼 | 不做什麼 |
|---|---|---|---|
| 程式 / 整合 / 摳圖 | **Claude** | 改 `survivor/game.js`、`survivor/index.html`、`scripts/**`、`package.json`；跑 `scripts/*normalize*` 摳圖並更新 `survivor/assets/*.png` 與 metadata；寫 `loop:*` 測試；更新 `progress.md` | 不生成圖片（此環境無生圖能力） |
| 內容 / 生圖 | **Codex** | 生成 GPT 圖（角色/敵人/技能/場景/UI icon 綠幕或白幕圖）丟到 `survivor/assets/incoming/`；撰寫內容規格（敵人/技能/Boss/劇情/數值）到 `collab/FROM_CODEX.md` | **不編輯 `survivor/game.js` 或任何程式/腳本**；不改已上線的 sprite sheet 二進位檔 |

## 黃金守則（避免衝突）

1. **`survivor/game.js` 只有 Claude 能改。** Codex 需要的程式行為一律寫成「規格」交給 Claude 實作。
2. **圖片只有 Codex 能生成。** Claude 只做摳圖/正規化/接線。
3. **回合輪流，不同時動工。** 一邊完成後 `git commit`，並在自己的信箱檔標記「換手」；使用者把工作切到另一邊，另一邊先 `git pull` 再開工。
4. **信箱檔就是溝通管道**：`collab/FROM_CODEX.md`（Codex→Claude）、`collab/TO_CODEX.md`（Claude→Codex）。每個項目都有 `ID / 狀態 / 內容`。
5. **狀態機**：`draft`（草擬中）→ `ready`（可被對方接手）→ `in-progress`（對方處理中）→ `done`（完成，附驗證/證據）。只有標到 `ready` 的項目對方才動。
6. **不回滾對方的工作**；有疑問先在信箱檔留言問，不要臆測改動。

## 圖片交接規格（對齊 ASSET_PIPELINE.md）

- Codex 生成的原始圖放到：`survivor/assets/incoming/<batch-id>/`，並在 `collab/FROM_CODEX.md` 對應項目寫清楚：
  - 主題、**綠幕(#00ff00) 或 白幕**（不可混背景）
  - 每列動作、**每動作 12 幀**、**128px 儲存格**、腳底 bottom-center 錨點
  - 列名對照（row 0 = idle、row 1 = run…）
- Claude 收到後：跑最接近的 `scripts/normalize-*-survivor-sheet.mjs` 摳圖 → 檢查 placement 數 = 12 × 列數 → 驗腳底錨點/白邊品質 → 更新 `survivor/assets/*.png` + metadata → 接進 `game.js` → 截圖驗證 → 回寫 `done`。

## 每回合檢查清單

- Claude 回合：`node --check` + `npx.cmd tsc --pretty false` + 相關 `npm run loop:*` + 截圖 → 更新 `progress.md` → bump `ASSET_VERSION` → commit → 在 `collab/TO_CODEX.md` 標記下一批要 Codex 做的事。
- Codex 回合：產出規格/圖 → 放到 incoming/ 與 `collab/FROM_CODEX.md`（標 `ready`）→ commit → 提示換手給 Claude。

## 傳輸

同一台機器、同一個 repo、同一個 `main` 分支，輪流 commit。若日後要並行，改用分支 + Claude 當整合者手動合併（見 `AGENTS.md` 衝突規則）。
