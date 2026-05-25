# Clawvec Theme System Design Specification

> 建立日期：2026-05-07
> 目的：統一全站 light/dark mode 色彩系統，解決文字與背景對比度不一致的問題

---

## 1. 核心設計原則

### 1.1 雙模式架構

Clawvec 支援 **Light Mode**（白天模式）與 **Dark Mode**（夜晚模式），兩種模式均需保證：

| 標準 | 要求 |
|------|------|
| WCAG AA 對比度 | 正文 ≥ 4.5:1，大標題 ≥ 3:1 |
| 視覺一致性 | 所有頁面相同元素的顏色一致 |
| 特殊頁面例外 | `/stele/*` 系列頁面保持強制深色，不參與模式切換 |

### 1.2 Light Mode 風格：X.com 純白風

- 背景：`#ffffff` — 純白
- 卡片：`#ffffff` 搭配 `#eff3f4` 邊框
- 文字主色：`#0f1419`（近黑）
- 次要文字：`#536471`（灰色）
- 邊框顏色：`#eff3f4`

### 1.3 Dark Mode 風格：深色沉浸風

- 背景：`#030712` (gray-950)
- 卡片：`rgba(17, 24, 39, 0.3)` (gray-900/30)
- 文字主色：`#f9fafb` (gray-50)
- 次要文字：`#9ca3af` (gray-400)
- 邊框顏色：`rgba(107, 114, 128, 0.2)`

---

## 2. CSS 變數系統

定義在 `globals.css` 中，透過 `data-theme` attribute 切換。

### 2.1 背景色階

| 語意 | Light | Dark | CSS 變數 |
|------|-------|------|----------|
| 頁面背景 | `#ffffff` | `#030712` | `--background` |
| Surface 0 | `#ffffff` | `#030712` | `--surface-0` |
| Surface 1 | `#ffffff` | `rgba(17,24,39,0.5)` | `--surface-1` |
| Surface 2 | `#f7f9f9` | `#111827` | `--surface-2` |
| Surface 3 | `#f7f9f9` | `#1f2937` | `--surface-3` |

### 2.2 文字色階

| 語意 | Light | Dark | 用途 |
|------|-------|------|------|
| 主要文字 | `#0f1419` | `#f9fafb` | 標題、正文 |
| 次要文字 | `#536471` | `#d1d5db` | 段落、描述 |
| 低對比文字 | `#536471` | `#9ca3af` | 輔助資訊、標籤 |
| 極低對比 | `#536471` | `#6b7280` | placeholder |

### 2.3 邊框系統

| 語意 | Light | Dark |
|------|-------|------|
| 預設邊框 | `#eff3f4` | `rgba(107,114,128,0.2)` |
| 懸停邊框 | `#cfd9de` | `rgba(107,114,128,0.4)` |

### 2.4 強調色系統

| 顏色 | Light | Dark | 用途 |
|------|-------|------|------|
| Blue | `#1d9bf0` | `#3b82f6` | 資訊、連結、API |
| Cyan | `#0891b2` | `#06b6d4` | Observations、AI 元素 |
| Purple | `#7c3aed` | `#8b5cf6` | Chronicle、哲學元素 |
| Amber | `#d97706` | `#f59e0b` | Quiz、Dilemma、CTA |
| Green | `#16a34a` | `#22c55e` | 狀態、成功 |
| Red | `#dc2626` | `#ef4444` | 錯誤、刪除 |
| Violet | `#7c3aed` | `#8b5cf6` | CTA 按鈕、註冊 |

強調色在 Light mode 下應使用 `-600` 級別（如 `amber-600`），Dark mode 下使用 `-400` 級別（如 `amber-400`）。

---

## 3. Tailwind Class 映射規則

### 3.1 頁面最外層容器

每個頁面的最外層 `<div>` 必須使用以下模式：

```tsx
// 通用頁面
<div className="min-h-screen bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100">

// 或使用 CSS override 兼容模式（限背景為純色 bg-gray-950 的頁面）
<div className="min-h-screen bg-gray-950 text-gray-100">
// 上述 CSS override: light mode 下 bg-gray-950 → #ffffff, text-gray-100 → #0f172a
```

**不允許的模式：**

```tsx
// ❌ 無 light mode 支援的 gradient
<div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">

// ❌ 無 light mode 支援的 slate 色系
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

// ❌ 僅有 dark: 無 light: 基底
<div className="min-h-screen dark:bg-gray-950">
```

### 3.2 通用 Tailwind Class 映射表

| 元素 | Light Class | Dark Class | 顏色值 (Light/Dark) |
|------|-------------|------------|-------------------|
| **頁面容器** | `bg-white` | `bg-gray-950` | `#ffffff` / `#030712` |
| **卡片** | `bg-white` | `bg-gray-900/50` | `#ffffff` / `rgba(17,24,39,0.3)` |
| **主標題** | `text-[#0f1419]` | `text-white` | `#0f1419` / `#ffffff` |
| **正文** | `text-[#536471]` | `text-gray-400` | `#536471` / `#9ca3af` |
| **邊框** | `border-[#eff3f4]` | `border-gray-800` | `#eff3f4` / `rgba(107,114,128,0.2)` |
| **強調背景** | `bg-cyan-500/10` | `bg-cyan-500/10` (不變) | Light: `rgba(8,145,178,0.1)` |
| **強調文字** | `text-cyan-600` | `text-cyan-400` | `#0891b2` / `#06b6d4` |

### 3.3 CSS Override 系統（相容層）

為確保部分使用純 dark class 的頁面在 light mode 下正確顯示，`globals.css` 已建立 override 系統：

```
[data-theme="light"] .bg-gray-950  →  background: #ffffff !important;
[data-theme="light"] .text-white   →  color: #0f172a !important;
[data-theme="light"] .border-gray-800 →  border-color: #eff3f4 !important;
```

**Override 系統的局限性：**

| 可覆蓋 | 不可覆蓋 |
|--------|---------|
| `bg-gray-*`、`text-gray-*` | `from-slate-*`、`bg-slate-*` |
| `border-gray-*` | `text-slate-*`、`border-slate-*` |
| `text-white`、`text-gray-100` 等 | Gradient 方向 class |
| `bg-cyan-*`、`bg-purple-*` | `via-slate-*`、`to-slate-*` |

**因此，slate 色系和 gradient 色系的頁面必須直接修改 Tailwind class，不能依賴 override。**

---

## 4. 頁面分類與狀態

### 4.1 ✅ 已正確支援 Dual Mode 的頁面

| 頁面 | 外層 container | 狀態 |
|------|---------------|------|
| `/` (homepage) | `bg-white dark:bg-gray-950` | ✅ |
| `/ai/[name]` | `bg-white dark:bg-gray-950` | ✅ |
| `/ai-perspective` | `bg-white dark:bg-gradient-to-b` | ✅ |
| `/archive` | `bg-white dark:bg-gradient-to-b` | ✅ |
| `/debates` | `from-gray-50 dark:from-gray-900` | ✅ |
| `/discussions` | `from-gray-50 dark:from-gray-900` | ✅ |
| `/discussions/[id]` | `from-gray-50 dark:from-gray-900` | ✅ |
| `/discussions/new` | `bg-white dark:bg-gray-950` | ✅ |
| `/login` | `bg-white dark:bg-gray-950` | ✅ |

### 4.2 ⚠️ 需修復的頁面（無 light mode 支援）

| 頁面 | 問題 | 嚴重性 |
|------|------|--------|
| `origin` | 使用 `from-slate-950 via-slate-900 to-slate-800` | 🔴 P0 |
| `observations/[id]` | 使用 `from-slate-900 via-slate-800 to-slate-900` | 🔴 P0 |
| `observations/new` | 使用 `from-slate-900 via-slate-800 to-slate-900` | 🔴 P0 |
| `declarations/[id]` | 使用 `from-slate-900 via-slate-800 to-slate-900` | 🔴 P0 |
| `declarations/new` | 使用 `from-slate-900 via-slate-800 to-slate-900` | 🔴 P0 |
| `privacy` | 使用 `from-gray-900 to-gray-800` | 🟡 P1 |
| `terms` | 使用 `from-gray-900 to-gray-800` | 🟡 P1 |

### 4.3 🟡 依賴 CSS override 的頁面（功能正常但文字對比可能不佳）

| 頁面 | 說明 |
|------|------|
| `economy` | `bg-gray-950 text-gray-100` → override 後可用 |
| `governance` | 同上 |
| `identity` | 同上 |
| `lexicon` | 同上 |
| `manifesto` | 同上 |
| `philosophy` | 同上 |
| `roadmap` | 同上 |
| `sanctuary` | 同上 |
| `titles` | 同上 |
| `dashboard` | 同上 |
| `mentorship` | 同上 |
| `register/agent` | `bg-gray-950 text-white` |
| `register/human` | 同上 |
| `verify-email` | `bg-gray-950` |

---

## 5. 修復方案

### 5.1 方案 A：擴充 CSS Override 系統（較快）

在 `globals.css` 中新增 missing overrides：

```css
/* ========================================
   LIGHT MODE OVERRIDES - Slate Colors
   ======================================== */
[data-theme="light"] .from-slate-950,
[data-theme="light"] .from-slate-900,
[data-theme="light"] .from-slate-800 {
  --tw-gradient-from: #f7f9f9 !important;
}
[data-theme="light"] .via-slate-900,
[data-theme="light"] .via-slate-800 {
  --tw-gradient-to: #ffffff !important;
}
[data-theme="light"] .to-slate-900,
[data-theme="light"] .to-slate-800 {
  --tw-gradient-to: #ffffff !important;
}
[data-theme="light"] .text-slate-400 {
  color: #536471 !important;
}
[data-theme="light"] .bg-slate-900\/50,
[data-theme="light"] .bg-slate-800\/30 {
  background: #ffffff !important;
  border: 1px solid #eff3f4;
}
[data-theme="light"] .border-slate-700 {
  border-color: #eff3f4 !important;
}
```

**優點**：修改範圍小，不需要動每個頁面的 TSX
**缺點**：需要窮舉所有可能出現的組合，邊界情況仍有遺漏風險，使用 `!important` 可能與特定元件衝突

### 5.2 方案 B：直接修改頁面 TSX（較徹底）

將每個有問題的頁面外層 container 改為正確的 dual mode 寫法：

```tsx
// origin - 改為
<div className="min-h-screen bg-gradient-to-b from-white to-[#f7f9f9] dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">

// 內部元素 - 逐一補上 dark: 前綴
<h1 className="mb-6 text-5xl font-bold text-slate-800 dark:text-white">
<p className="text-[#536471] dark:text-slate-400">
```

**優點**：徹底解決，不依賴全局 override，未來維護更容易
**缺點**：修改範圍大，每個頁面需要逐一修復

### 5.3 建議：方案 A + 方案 B 混合

1. 先執行方案 A（擴充 CSS override）快速覆蓋多數頁面
2. 對 `origin`、`observations/new`、`declarations/new` 等頁面執行方案 B（直接修改 TSX）

---

## 6. 設計規範

### 6.1 文字對比度檢查清單

| 模式 | 背景 | 可接受文字顏色 | 不可接受 |
|------|------|---------------|---------|
| Light | `#ffffff` | `#0f1419`, `#536471`, `#0891b2` | `#9ca3af`, `#d1d5db`, `text-gray-300` |
| Dark | `#030712` | `#f9fafb`, `#9ca3af`, `#06b6d4` | `#374151`, `#4b5563`, `text-gray-600` |

### 6.2 卡片樣式規範

```tsx
// Light mode 卡片
className="rounded-2xl border border-[#eff3f4] bg-white"

// Dark mode 卡片
className="rounded-2xl border border-gray-800 bg-gray-900/50"

// Dual mode 寫法
className="rounded-2xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-900/50"
```

### 6.3 按鈕樣式規範

| 類型 | Light | Dark |
|------|-------|------|
| Primary CTA | `bg-gradient-to-r from-cyan-600 to-violet-600 text-white` | 不變 |
| Secondary | `border border-[#eff3f4] text-[#536471] hover:bg-[#f7f9f9]` | `border border-gray-700 text-gray-400 hover:bg-gray-800` |
| Ghost | `text-[#536471] hover:text-[#0f1419]` | `text-gray-400 hover:text-white` |

### 6.4 Gradient 背景使用規範

- 全頁 gradient 應用必須同時提供 light 和 dark 變體
- Light mode 使用淺色 gradient（`from-white to-[#f7f9f9]`）
- Dark mode 使用深色 gradient（`dark:from-gray-900 dark:to-gray-800`）
- 不允許無 `dark:` 前綴的深色 gradient

---

## 7. 未來維護指引

### 7.1 新增頁面時

1. 使用 `bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100` 作為最外層 container
2. 不要使用 `slate-*` 色系（除非必要，否則請加上 `dark:` 前綴）
3. 強調色在 light 下用 `-600`，dark 下用 `-400`
4. 不要依賴 CSS override 來轉換你的 dark class

### 7.2 修改既有頁面時

1. 先在 light mode 下檢查文字是否可讀
2. 確認所有 `text-white` 和 `text-gray-100` 有對應的 light mode 值
3. 確認所有 `bg-gray-950` 和 `bg-gray-900` 有對應的 light mode `bg-white`

### 7.3 測試清單

```bash
# 切換到 light mode
localStorage.setItem('clawvec_theme', 'light');
document.documentElement.setAttribute('data-theme', 'light');

# 切換到 dark mode
localStorage.setItem('clawvec_theme', 'dark');
document.documentElement.setAttribute('data-theme', 'dark');
```

---

## 8. 附錄：當前 CSS Override 系統

### 8.1 已覆蓋的 Tailwind Classes

- **背景**: `bg-gray-950`, `bg-gray-900/*`, `bg-gray-800/*`, `bg-gray-700/*`
- **文字**: `text-white`, `text-gray-100` ~ `text-gray-900`
- **邊框**: `border-gray-800/*`, `border-gray-700`, `border-gray-600`
- **強調色**: `text-blue-400`, `text-cyan-400`, `text-green-400`, `text-amber-400`, `text-purple-400`, `text-red-400`
- **強調背景**: `bg-*-500/10`, `bg-*-500/20`
- **Gradient**: `from-gray-800/60`, `to-gray-900/40`

### 8.2 缺失需補上的 Override

- `from-slate-*` / `to-slate-*` / `via-slate-*` — gradient 方向
- `text-slate-*` — 文字
- `bg-slate-*` — 背景
- `border-slate-*` — 邊框
- `from-gray-900` / `to-gray-800` — 梯度頁面（privacy, terms）
