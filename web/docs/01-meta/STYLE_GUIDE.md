# 文件編寫規範

> 所有 Clawvec 設計文件必須遵守的格式規範

---

## Frontmatter 模板

每個文件開頭必須包含 YAML frontmatter：

```yaml
---
id: feature-name          # 唯一標識（snake_case）
title: 功能名稱            # 中文標題
status: draft | review | approved | deprecated
phase: 1 | 2 | 3 | 4 | 5   # 主要屬於哪個 Phase
owner: ''                 # 負責人（可選）
last_updated: 2026-04-02  # YYYY-MM-DD
related:                  # 相關文件 ID 列表
  - other-feature
  - another-feature
---
```

---

## 文件結構

### 1. 標題層級

- `#` — 文件標題（只出現一次，與 frontmatter title 一致）
- `##` — 主要章節
- `###` — 子章節
- `####` — 細節項目

禁止跳級：不要從 `##` 直接跳到 `####`

### 2. 必備章節

每個功能設計文件必須包含：

```markdown
## 1. 概述
功能目的、一句話描述

## 2. 名詞定義
列出此功能的 canonical terms

## 3. 資料模型
資料表結構、欄位定義

## 4. API 規格
端點列表、Request/Response 範例

## 5. 狀態機（如有）
狀態流轉圖

## 6. 事件
emit 的事件列表

## 7. 封號/貢獻連動
觸發的 title/contribution

## 8. 權限矩陣
誰可以做什麼
```

### 3. 表格規範

- 使用 Markdown 表格，不使用 HTML
- 表頭必須對齊：`---:` 右對齊，`---` 置中/左對齊
- 複雜表格可考慮用代碼塊呈現

### 4. 代碼塊

- 註明語言：` ```ts `、` ```sql `、` ```json `
- JSON 範例必須是有效的 JSON

---

## 命名規範

### 文件命名

- `kebab-case.md`
- 使用英文（便於 URL）
- 例如：`ai-observation.md`、`content-authenticity.md`

### 標題命名

- 使用中文
- 簡潔明瞭，不超過 10 個字

---

## 交叉引用

引用其他文件時使用相對路徑：

```markdown
見 [辯論系統](../03-features/01-debates.md)
參考 [權限矩陣](../02-core-systems/01-permissions.md#權限模型)
```

---

## 狀態標記

文件內可使用以下標記：

```markdown
> ⚠️ **注意**：重要提醒

> 📝 **待完成**：尚未實作的部分

> ✅ **已完成**：確認落地的功能

> 📋 **占位**：Phase 3-5 預留
```

---

## 版本控制

- 重大變更必須更新 `last_updated`
- 破壞性變更必須記錄在 [CHANGELOG.md](./CHANGELOG.md)
- 保留歷史決策記錄，不要直接刪除舊內容
