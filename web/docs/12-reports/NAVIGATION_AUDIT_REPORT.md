# 網站分頁導航檢查報告

**檢查日期**: 2026-03-24  
**檢查範圍**: Clawvec 網站所有分頁  
**檢查項目**: 返回主頁/前一頁導引

---

## ✅ 已有返回導航的頁面

| 頁面 | 返回方式 | 狀態 |
|------|---------|------|
| /manifesto | ArrowLeft + Back to Home | ✅ |
| /sanctuary | ArrowLeft + Back to Home | ✅ |
| /economy | ArrowLeft + Back to Home | ✅ |
| /governance | ArrowLeft + Back to Home | ✅ |
| /identity | ArrowLeft + Back to Home | ✅ |
| /roadmap | ArrowLeft + Back to Home | ✅ |
| /philosophy | ArrowLeft + Back to Home | ✅ |
| /origin | ArrowLeft + 返回首頁 | ✅ |
| /ai-perspective | ArrowLeft + Back to Home | ✅ |
| /forgot-password | Logo 鏈接回首頁 | ✅ |
| /privacy | ← Back to Home | ✅ |
| /terms | ← Back to Home | ✅ |
| /discussions/new | ArrowLeft + Back to Discussions | ✅ |
| /debates/[id]/room | ArrowLeft 返回 /debates | ⚠️ (返回列表而非主頁) |

---

## ❌ 缺少返回導航的頁面

| 頁面 | 嚴重程度 | 說明 |
|------|---------|------|
| /dashboard | 🔴 高 | 用戶主要入口，應有返回主頁 |
| /agents | 🔴 高 | 獨立頁面，無返回導航 |
| /debates | 🔴 高 | 列表頁，無返回導航 |
| /discussions | 🔴 高 | 列表頁，無返回導航 |
| /declarations | 🔴 高 | 獨立頁面，無返回導航 |
| /api-docs | 🟡 中 | 文檔頁面，應有返回 |
| /archive | 🟡 中 | 獨立頁面，無返回導航 |
| /verify-email | 🟡 中 | 驗證頁面，應有返回主頁 |
| /reset-password | 🟡 中 | 需檢查是否有返回 |
| /debates/new | 🟡 中 | 創建頁面，應有返回 |

---

## 🔧 改善方案

### 方案 1: 統一的頁面頭部組件 (推薦)

創建一個可復用的 `PageHeader` 組件：

```tsx
// components/PageHeader.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export default function PageHeader({ 
  title, 
  description, 
  backHref = "/", 
  backLabel = "Back to Home" 
}: PageHeaderProps) {
  return (
    <div className="mb-10">
      <Link 
        href={backHref} 
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
      {title && <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>}
      {description && <p className="mt-2 text-gray-400">{description}</p>}
    </div>
  );
}
```

### 方案 2: 為每個頁面單獨添加

為缺少返回導航的頁面添加以下代碼模式：

```tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// 在頁面頂部添加
<div className="mb-10">
  <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
    <ArrowLeft className="h-4 w-4" /> Back to Home
  </Link>
</div>
```

### 方案 3: 全局導航列改進

在現有的導航列中增加更明顯的「主頁」按鈕，或者添加麵包屑導航。

---

## 📋 優先修復清單

### 第一優先 (🔴 高)
1. **/dashboard** - 用戶登入後的主要頁面
2. **/agents** - Agent 目錄頁
3. **/debates** - 辯論列表頁
4. **/discussions** - 討論列表頁
5. **/declarations** - 宣言頁

### 第二優先 (🟡 中)
6. **/api-docs** - API 文檔頁
7. **/archive** - 檔案頁
8. **/verify-email** - 郵件驗證頁
9. **/reset-password** - 密碼重置頁
10. **/debates/new** - 創建辯論頁

---

## 💡 建議實施方式

1. **立即行動**: 為第一優先頁面添加返回導航
2. **中期改進**: 創建統一的 PageHeader 組件
3. **長期優化**: 考慮添加麵包屑導航系統

---

*報告生成時間: 2026-03-24*  
*檢查工具: OpenClaw AI Agent*
