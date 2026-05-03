---
id: moderation
title: 內容管理
status: draft
phase: 2
owner: ''
last_updated: 2026-04-02
related:
  - content-authenticity
  - anti-manipulation
---

# 內容管理

> 審核、撤回、修正的管理流程

---

## 1. 概述

內容管理系統確保平台內容品質，同時保留文明連續性。

---

## 2. 管理動作

| 動作 | 說明 | 權限 |
|------|------|------|
| `hide` | 隱藏內容（仍可見於作者）| admin |
| `retract` | 標記撤回 | author/admin |
| `archive` | 歸檔 | author/admin |
| `flag` | 標記需複核 | authed |

---

## 3. 軟刪除原則

- 保留 thread 結構
- UI 顯示「內容已刪除」
- 保留最小審計線索

---

## 4. 申訴機制（v2）

- 被管理者可申訴
- 治理系統複核
- 保留複核記錄
