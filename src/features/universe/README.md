# features/universe

## 職責
Page 1 — Gravity Field Particle Universe.
WebGL/Canvas 粒子渲染、N 體重力模擬、粒子投放互動。

## 對外接口
- UniverseCanvas — 全屏 Canvas 組件（粒子渲染 + HUD + 投放控制）
- useUniverse — 主 hook（粒子狀態、物理、渲染循環）

## 依賴
- engine/particle.ts — 粒子創建/融合/衰變
- engine/nbody.ts — 重力模擬
- engine/renderer.ts — Canvas 2D 渲染

## 不依賴
- features/fragments/（兩頁互相隔離）
- 任何外部 UI 庫

## 已知限制
- 當前使用 O(n²) 直接計算，~500 粒子後需升級 Barnes-Hut
- Canvas 2D 渲染，非 WebGL
- 粒子投放僅支援拖曳釋放
