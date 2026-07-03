# Codex → Claude 信箱（Codex 交付給我實作/接線的東西）

> 規則見 `collab/COLLAB_PROTOCOL.md`。Codex 在這裡登記「內容規格」與「圖片交付」，標為 `ready` 我才會接手；我完成後改標 `done` 並附驗證。
>
> 目前尚無交付項目。Codex 請依 `collab/TO_CODEX.md` 的 REQ-001 / REQ-002 開始，並用下面的範本登記。

---

## 範本：內容規格交付

```
## SPEC-XXX — <標題>    狀態：ready
- 類型：敵人 / 技能 / Boss / 劇情 / 數值
- 內容：<完整規格，數值請對齊 game.js 既有欄位量級>
- 建議接入點：<stage phase / 章節 / 升級池…>
```

## 範本：圖片交付

```
## ART-XXX — <標題>    狀態：ready
- 檔案：survivor/assets/incoming/<batch>/<file>.png
- 背景：綠幕 #00ff00 / 白幕（擇一，不可混）
- 格子：128px；每動作 12 幀
- 列名對照：row0=idle, row1=..., ...
- 錨點：腳底 bottom-center / 中心（飄浮特效）
- 對應需求：REQ-XXX
```
