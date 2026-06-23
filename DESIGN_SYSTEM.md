# DESIGN_SYSTEM.md — Clawvec V4 視覺設計系統

> 基於 V3 Glassmorphism v3.0 升級，統一並規範化視覺風格。
> 本文件為開發與設計的單一真相來源。
> **當前版本：Glassmorphism v4.0**

---

## 一、設計哲學

**Swiss Institutional + Glassmorphism**
- 極簡、精確、高對比
- 受國際主義平面設計啟發（網格系統、清晰層級、功能性優先）
- **溫暖底色**：羊皮紙色 `#f5f4ed` 取代純白，減少眼睛疲勞
- **玻璃質感**：半透明層次、backdrop-blur 模糊、光線折射
- **環境光暈**：柔和的背景光暈增加深度與溫度
- 資料密度優先，適合開發者閱讀

---

## 二、色彩系統

### 2.1 主色調（Brand Colors）

| 名稱 | 色值 | 用途 |
|------|------|------|
| **Primary** | `#FF5A3C` | CTA 按鈕、重點標記、連結 hover、品牌識別 |
| **Primary Light** | `rgba(255, 90, 60, 0.1)` | 背景強調、badge、hover 狀態 |
| **Primary Dark** | `#E54E32` | Primary hover 狀態 |

### 2.2 底色（Background）

| 名稱 | 色值 | 用途 |
|------|------|------|
| **Page Background** | `#f5f4ed` | 頁面全局底色（溫暖羊皮紙） |
| **Glass Surface** | `rgba(255, 255, 255, 0.3)` | 卡片、面板玻璃背景 |
| **Glass Strong** | `rgba(255, 255, 255, 0.5)` | 導航、重要面板 |
| **Glass Subtle** | `rgba(255, 255, 255, 0.2)` | 次要背景、分隔區 |

### 2.3 中性色（Neutral Scale）

| Token | 色值 | 用途 |
|-------|------|------|
| **Surface 0** | `#faf9f5` | 實色卡片背景（fallback） |
| **Surface 1** | `rgba(255, 255, 255, 0.4)` | 主要玻璃層 |
| **Surface 2** | `rgba(255, 255, 255, 0.3)` | 次要玻璃層 |
| **Surface 3** | `rgba(255, 255, 255, 0.2)` | 輕微玻璃層 |
| **Surface Border** | `rgba(255, 255, 255, 0.4)` | 玻璃邊框 |
| **Line** | `#e8e6dc` | 細分隔線、實色邊框 |

### 2.4 文字色（Text Colors）

| Token | 色值 | 用途 |
|-------|------|------|
| **Text Primary** | `#141413` | 標題、主要文字（溫暖黑） |
| **Text Secondary** | `#5e5d59` | 次要文字、描述 |
| **Text Tertiary** | `#87867f` | 輔助文字、時間戳、metadata |
| **Text Inverse** | `#ffffff` | 深色背景上的文字 |
| **Text Accent** | `#FF5A3C` | 連結、強調文字 |

### 2.5 功能色（Semantic Colors）

| 名稱 | 色值 | 用途 |
|------|------|------|
| **Success** | `#22c55e` | 成功狀態、確認訊息 |
| **Warning** | `#f59e0b` | 警告狀態 |
| **Error** | `#ef4444` | 錯誤狀態、刪除操作 |
| **Info** | `#3b82f6` | 資訊提示 |

### 2.6 漸層色（Gradients）

| 名稱 | 定義 | 用途 |
|------|------|------|
| **Hero Gradient** | `from-cyan-400 via-violet-400 to-amber-400` | Hero 區標題文字 |
| **CTA Gradient** | `from-cyan-600 to-violet-600` | 主要 CTA 按鈕背景 |
| **Ambient Glow** | `radial-gradient(circle, rgba(255, 90, 60, 0.08) 0%, transparent 70%)` | 背景光暈 |

### 2.7 色彩使用規則

```
✅ 正確：
- 主要文字：text-[#141413]
- 次要文字：text-[#5e5d59]
- 輔助文字：text-[#87867f]
- 連結：text-[#FF5A3C] hover:text-[#FF5A3C]/80
- 玻璃背景：bg-white/30 backdrop-blur-md
- 玻璃邊框：border-white/40
- CTA：bg-[#FF5A3C] 或 btn-glass class

❌ 禁止：
- 使用純白背景（#ffffff）作為頁面底色
- 使用純黑文字（#000000）
- 使用未在設計系統中的顏色
- 使用透明度低於 0.6 的文字顏色（無障礙要求）
```

---

## 三、玻璃質感規範（Glassmorphism v4）

### 3.1 玻璃層級

| 層級 | 背景 | 模糊 | 邊框 | 陰影 | 用途 |
|------|------|------|------|------|------|
| **Glass** | `white/30` | `blur(12px)` | `white/40` | `0 8px 32px rgba(0,0,0,0.08)` | 標準卡片、面板 |
| **Glass Strong** | `white/50` | `blur(16px)` | `white/50` | `0 8px 32px rgba(0,0,0,0.1)` | 導航、Modal |
| **Glass Subtle** | `white/20` | `blur(8px)` | `white/30` | 無 | 次要背景、分隔 |

### 3.2 CSS 工具類

```css
/* 標準玻璃 */
.glass {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

/* 強玻璃 */
.glass-strong {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 輕玻璃 */
.glass-subtle {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### 3.3 玻璃使用規則

```
✅ 正確：
- 卡片使用 .glass
- 導航使用 .glass-strong
- 次要分隔使用 .glass-subtle
- 背景保持 #f5f4ed 讓玻璃效果顯現
- 多層玻璃疊加創造深度
- 玻璃層上文字對比度 ≥ 4.5:1

❌ 禁止：
- 在純白背景上使用玻璃（無效果）
- 玻璃層超過 3 層（視覺混亂）
- 忽略 -webkit-backdrop-filter（Safari 支援）
- 在玻璃上放置玻璃（降低可讀性）
- 玻璃層上文字低於 4.5:1 對比度
```

---

## 四、字體系統

### 4.1 字體家族

| 層級 | 字體 | 用途 |
|------|------|------|
| **Primary** | Inter / system-ui | 所有 UI 文字、標題、內文 |
| **Mono** | JetBrains Mono / monospace | 程式碼、技術數據、API 參數 |

### 4.2 字體大小（Type Scale）

| Token | 大小 | 行高 | 字重 | 字距 | 用途 |
|-------|------|------|------|------|------|
| **Display** | 4rem (64px) | 1.1 | 700 | -0.02em | Hero 標題 |
| **H1** | 3rem (48px) | 1.2 | 700 | -0.02em | 頁面標題 |
| **H2** | 2rem (32px) | 1.2 | 700 | -0.01em | 區塊標題 |
| **H3** | 1.5rem (24px) | 1.3 | 600 | -0.01em | 卡片標題 |
| **H4** | 1.25rem (20px) | 1.4 | 600 | 0 | 小標題 |
| **Body Large** | 1.125rem (18px) | 1.6 | 400 | 0 | 引言、重要內文 |
| **Body** | 1rem (16px) | 1.6 | 400 | 0 | 標準內文 |
| **Body Small** | 0.875rem (14px) | 1.5 | 400 | 0 | 次要內文 |
| **Caption** | 0.75rem (12px) | 1.4 | 400 | 0.01em | 時間戳、metadata |
| **Label** | 0.75rem (12px) | 1.4 | 500 | 0.02em | 表單標籤、badge |

### 4.3 字重規範

| 字重 | 用途 |
|------|------|
| 400 (Normal) | 內文、描述 |
| 500 (Medium) | 按鈕文字、標籤 |
| 600 (Semibold) | 小標題、卡片標題、導航 |
| 700 (Bold) | 頁面標題、區塊標題、強調 |

---

## 五、間距系統（Spacing Scale）

### 5.1 基礎單位

基礎單位為 **4px**，所有間距以此為倍數。

| Token | 值 | 用途 |
|-------|-----|------|
| **space-1** | 4px | 極小間距 |
| **space-2** | 8px | 圖標與文字間距 |
| **space-3** | 12px | 小間距 |
| **space-4** | 16px | 標準間距 |
| **space-5** | 20px | 卡片內間距 |
| **space-6** | 24px | 區塊內間距 |
| **space-8** | 32px | 區塊間距 |
| **space-10** | 40px | 大區塊間距 |
| **space-12** | 48px | 頁面區塊間距 |
| **space-16** | 64px | 大區塊間距 |
| **space-20** | 80px | 超大區塊間距 |
| **space-24** | 96px | 頁面區塊間距（py-24） |

---

## 六、圓角系統（Border Radius）

| Token | 值 | 用途 |
|-------|-----|------|
| **none** | 0 | 表格、分隔線 |
| **sm** | 4px | 小按鈕、標籤 |
| **md** | 8px | 輸入框、小卡片 |
| **lg** | 12px | 按鈕、卡片 |
| **xl** | 16px | 大卡片、modal |
| **2xl** | 24px | 大卡片、區塊 |
| **full** | 9999px | 圓形按鈕、badge、頭像 |

---

## 七、陰影系統（Shadows）

| Token | 定義 | 用途 |
|-------|------|------|
| **none** | none | 扁平設計元素 |
| **glass** | `0 8px 32px rgba(0,0,0,0.08)` | 標準玻璃層 |
| **glass-strong** | `0 8px 32px rgba(0,0,0,0.1)` | 強玻璃層 |
| **card-hover** | `0 12px 40px rgba(0,0,0,0.12)` | 卡片 hover |
| **button** | `0 4px 16px rgba(255,90,60,0.3)` | 按鈕玻璃 |
| **button-hover** | `0 6px 24px rgba(255,90,60,0.4)` | 按鈕 hover |
| **input** | `inset 0 2px 4px rgba(0,0,0,0.02)` | 輸入框內陰影 |
| **glow** | `0 0 20px rgba(255, 90, 60, 0.15)` | Primary 光暈 |

---

## 八、環境光暈（Ambient Glow）

### 8.1 光暈規範

```css
/* 環境光暈容器 */
.glow-ambient {
  position: relative;
}

.glow-ambient::before {
  content: '';
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle, rgba(255, 90, 60, 0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}

/* 背景裝飾光球 */
.ambient-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.ambient-orb-1 {
  width: 400px;
  height: 400px;
  background: rgba(255, 90, 60, 0.08);
  top: 10%;
  left: 10%;
}
```

### 8.2 使用規則

```
✅ 正確：
- 頁面背景放置 1-2 個光球
- 光球使用 Primary 色的低透明度（5-8%）
- 光球 blur 80px+ 創造柔和效果
- 光球 pointer-events: none 避免干擾

❌ 禁止：
- 超過 3 個光球（視覺混亂）
- 光球透明度超過 10%（搶眼）
- 光球使用對比色（破壞和諧）
```

---

## 九、組件風格規範

### 9.1 按鈕（Button）

#### Primary Button（Glass）

```css
.btn-glass {
  background: rgba(255, 90, 60, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(255, 90, 60, 0.3);
  transition: all 0.2s ease;
}

.btn-glass:hover {
  background: rgba(255, 90, 60, 1);
  box-shadow: 0 6px 24px rgba(255, 90, 60, 0.4);
  transform: translateY(-1px);
}
```

#### Secondary Button（Glass）

```css
.btn-glass-secondary {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.btn-glass-secondary:hover {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}
```

### 9.2 卡片（Card - Glass）

```css
.card-glass {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.card-glass:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.4);
}
```

### 9.3 輸入框（Input - Glass）

```css
.input-glass {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.input-glass:focus {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 90, 60, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 90, 60, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.02);
}
```

### 9.4 Badge / Tag（Glass）

```css
.badge-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 90, 60, 0.3);
  background: rgba(255, 90, 60, 0.1);
  backdrop-filter: blur(4px);
  padding: 8px 16px;
  font-size: 0.875rem;
  color: #FF5A3C;
}
```

### 9.5 導航（Navigation - Glass）

```css
.nav-glass {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(245, 244, 237, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
}
```

---

## 十、布局規範

### 10.1 容器（Container）

| 斷點 | 最大寬度 | 內邊距 |
|------|----------|--------|
| Mobile | 100% | px-6 (24px) |
| Tablet (768px) | 100% | px-6 (24px) |
| Desktop (1024px) | 1024px | px-6 (24px) |
| Wide (1280px) | 1200px | px-6 (24px) |

### 10.2 響應式斷點

| 名稱 | 寬度 | 用途 |
|------|------|------|
| **sm** | 640px | 小螢幕手機 |
| **md** | 768px | 平板 |
| **lg** | 1024px | 桌面 |
| **xl** | 1280px | 大桌面 |
| **2xl** | 1536px | 超大螢幕 |

---

## 十一、動效規範

### 11.1 過渡時間

| Token | 時間 | 用途 |
|-------|------|------|
| **fast** | 150ms | 按鈕 hover、顏色變化 |
| **normal** | 200ms | 邊框變化、玻璃透明度 |
| **slow** | 300ms | 卡片浮起、陰影擴散 |

### 11.2 緩動函數

```
✅ 正確：
- 標準：transition-all duration-200 ease-out
- 玻璃 hover：transition-all duration-300 ease-out
- 顏色：transition-colors duration-150
- 浮起：transform + box-shadow 同步動畫

❌ 禁止：
- 使用過長的動畫（> 500ms）
- 使用彈跳效果（bounce）
```

---

## 十二、無障礙規範（A11y）

### 12.1 對比度要求

| 元素 | 最小對比度 | 標準 |
|------|------------|------|
| 主要文字 | 4.5:1 | WCAG AA |
| 大文字（18px+） | 3:1 | WCAG AA |
| 互動元素 | 4.5:1 | WCAG AA |

### 12.2 玻璃層可讀性

```
✅ 正確：
- 玻璃層上的文字使用 #141413（對比度 12:1）
- 次要文字使用 #5e5d59（對比度 7:1）
- 確保 backdrop-filter 後的文字清晰
- 避免在複雜背景上放置玻璃層

❌ 禁止：
- 玻璃層上文字低於 4.5:1 對比度
- 在圖片/漸層背景上使用玻璃（干擾模糊）
- 忽略 Safari 的 -webkit-backdrop-filter 支援
```

### 12.3 Focus 狀態

```css
/* Focus ring for glass elements */
.focus-glass:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 90, 60, 0.2);
  border-color: rgba(255, 90, 60, 0.5);
}
```

---

## 十三、Tailwind 配置

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#f5f4ed',
        foreground: '#141413',
        primary: {
          DEFAULT: '#FF5A3C',
          light: 'rgba(255, 90, 60, 0.1)',
          dark: '#E54E32',
        },
        surface: {
          0: '#faf9f5',
          1: 'rgba(255, 255, 255, 0.4)',
          2: 'rgba(255, 255, 255, 0.3)',
          3: 'rgba(255, 255, 255, 0.2)',
          border: 'rgba(255, 255, 255, 0.4)',
        },
        text: {
          primary: '#141413',
          secondary: '#5e5d59',
          tertiary: '#87867f',
        },
        line: '#e8e6dc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-strong': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.12)',
        'button': '0 4px 16px rgba(255, 90, 60, 0.3)',
        'button-hover': '0 6px 24px rgba(255, 90, 60, 0.4)',
        'glow': '0 0 20px rgba(255, 90, 60, 0.15)',
      },
      borderRadius: {
        'button': '12px',
        'card': '16px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

---

## 十四、V4 新增規範

### 14.1 側邊欄規範（Sidebar）

```css
/* 收合模式（圖標 only） */
.sidebar-collapsed {
  width: 64px;
  padding: 0;
  align-items: center;
}

/* 展開模式（圖標 + 文字） */
.sidebar-expanded {
  width: 256px;
  padding: 16px;
  align-items: flex-start;
}

/* 過渡動畫 */
.sidebar-transition {
  transition: all 0.3s ease;
}
```

### 14.2 主 CTA 規範

```css
/* 收合模式 */
.cta-collapsed {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  justify-content: center;
}

/* 展開模式 */
.cta-expanded {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  justify-content: flex-start;
  gap: 8px;
}
```

### 14.3 導航分組規範

```css
/* 分組標題 */
.nav-group-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  padding: 8px 12px;
}

/* 導航項目 */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

---

## 十五、版本記錄

- **v3.0** (2026-06-18): Glassmorphism v3 初始化，溫暖羊皮紙底色，玻璃工具類
- **v4.0** (2026-06-21): 新增側邊欄展開/收起規範，主 CTA 規範，導航分組規範，環境光暈規範

---

## 十六、使用規範

```
✅ 正確：
- 新 UI 組件必須使用 Glassmorphism v4
- 玻璃層上文字對比度 ≥ 4.5:1
- 背景保持 #f5f4ed 讓玻璃效果顯現
- 環境光暈適度（1-2 個，透明度 5-8%）
- 使用 CSS 變數（tokens.css）管理顏色

❌ 禁止：
- 使用純白背景（#ffffff）作為頁面底色
- 使用純黑文字（#000000）
- 玻璃層超過 3 層
- 環境光暈超過 3 個
- 忽略 -webkit-backdrop-filter（Safari 支援）
```
