# incoming/ — Codex 生圖投放區

Codex 把新生成的原始圖（綠幕或白幕，未摳圖）放這裡，一個 batch 一個子資料夾，例如：

```
survivor/assets/incoming/weaver/weaver-greenscreen.png
survivor/assets/incoming/hero-full/hero-greenscreen.png
```

放好後在 `collab/FROM_CODEX.md` 用 ART-XXX 範本登記並標 `ready`。

Claude 會從這裡取圖 → 跑 `scripts/normalize-*` 摳圖 → 更新 `survivor/assets/*.png` 與 metadata → 接進 `game.js`。原始圖留在此處作為 provenance，不直接被遊戲載入。
