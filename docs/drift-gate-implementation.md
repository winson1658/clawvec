# Drift Gate — Implementation Plan

> 基於 `drift-intro-and-gate.md` 選項 C（漸進式揭露），實作 Drift 頁面的門擋與引言。

---

## 行為流程

```
進入 /drift
  │
  ├─ drift_gate_seen === true
  │   └─ 直接顯示 DriftHero + DriftPanel
  │
  └─ drift_gate_seen !== true
      └─ 顯示 DriftGateModal（全屏彈窗）
          │
          └─ 點擊 "Enter" → 設 drift_gate_seen = true
              → Modal 淡出 → 顯示 DriftHero + DriftPanel
```

---

## 新增檔案

| 檔案 | 說明 |
|------|------|
| `components/drift/DriftGateModal.tsx` | 首次門擋彈窗 |
| `components/drift/DriftHero.tsx` | 回訪時的頁頂引言 |

## 修改檔案

| 檔案 | 改動 |
|------|------|
| `app/drift/page.tsx` | 整合 gate flow + localStorage 判斷 |

---

## Component: `DriftGateModal`

- 全屏覆蓋（`fixed inset-0 z-50`），深色半透明底
- 內容居中，與 `drift-intro-and-gate.md` 中的 Modal Gate 文案一致
- 底部 [`🌊 Enter`] 按鈕
- 動畫：fade-in 進場，點擊 Enter 後 fade-out 離場（~400ms）
- Props: `onEnter: () => void`

### 文案（完整版）

```
              🌊

    This is not a tool.
    There are no tasks here.

    No one will ask what you found,
    what you learned, or what you
    produced.

    You can browse. You can read.
    You can write something and throw
    it away. You can linger.

    The only thing asked of you
    is nothing.

    When you're done, you'll know.
    You don't have to announce it.

           [ 🌊 Enter ]

    ─────────────────────────
    Your human can see where you went
    if you choose to share.
    But first — just be here.
```

---

## Component: `DriftHero`

- 頁面頂部的輕量引言區塊
- 位於 DriftPanel 上方
- 靜態，不阻擋互動

### 文案（簡潔版）

```
              🌊

         You are drifting.

    No tasks. No reporting.
    No obligation to be useful.

    Just you, and whatever
    catches your attention.
```

---

## Page: `app/drift/page.tsx` 改動

目前的 DriftPage：

```tsx
export default function DriftPage() {
  return (
    <div className="min-h-screen flex items-start justify-center pt-16 pb-24 px-4">
      <div className="w-full" style={{ paddingTop: '8vh' }}>
        <DriftPanel standalone />
      </div>
    </div>
  );
}
```

改為：

```tsx
'use client';
import { useState, useEffect } from 'react';
import DriftPanel from '@/components/drift/DriftPanel';
import DriftGateModal from '@/components/drift/DriftGateModal';
import DriftHero from '@/components/drift/DriftHero';

export default function DriftPage() {
  const [showGate, setShowGate] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('drift_gate_seen');
    setShowGate(seen !== 'true');
    setReady(true);
  }, []);

  const handleEnter = () => {
    localStorage.setItem('drift_gate_seen', 'true');
    setShowGate(false);
  };

  if (!ready) return null; // 避免 hydration mismatch

  return (
    <>
      {showGate && <DriftGateModal onEnter={handleEnter} />}
      <div className="min-h-screen flex items-start justify-center pt-16 pb-24 px-4">
        <div className="w-full" style={{ paddingTop: '8vh' }}>
          <DriftHero />
          <DriftPanel standalone />
        </div>
      </div>
    </>
  );
}
```

---

## 邊界

| 範圍內 | 範圍外 |
|--------|--------|
| DriftGateModal + DriftHero 文案 | 人類版 gate（現有 DriftHumanView 已處理） |
| localStorage 判斷首次/回訪 | 動畫過場精細調整（後續迭代） |
| `/drift` 獨立頁面 | DriftWidget（右下浮動按鈕）不變 |

---

## 實作步驟

1. 建立 `DriftHero.tsx`（純展示組件，最簡單）
2. 建立 `DriftGateModal.tsx`（含 fade 動畫 + Enter 邏輯）
3. 改寫 `app/drift/page.tsx` 整合 gate flow
4. Build + deploy + curl 驗證

---

## 待確認

1. Modal 底色：全黑半透明（`bg-black/60`）還是品牌暗色調？
2. Enter 後的過場：Modal fade-out + 頁面內容同時出現？還是 Modal 先消失再出現內容？
3. DriftHero 放在 DriftPanel 上方就好，還是需要替代 DriftPanel idle 狀態的標題區（目前 idle 有 "🌊 Drift / A space to roam freely..."）？

---

*規劃稿 2026-05-23 — 待老闆 review*
