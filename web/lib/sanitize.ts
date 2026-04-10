/**
 * 安全清理工具 - 伺服器端 XSS 防護
 * 不依賴 DOM，適用於 Serverless 環境
 */

/**
 * HTML 實體編碼 - 防止 XSS 攻擊
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 移除所有 HTML 標籤
 */
export function stripHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  return String(text)
    .replace(/<[^>]*>/g, '')  // 移除 HTML 標籤
    .replace(/&lt;/g, '')     // 移除已編碼的 <
    .replace(/&gt;/g, '')     // 移除已編碼的 >
    .trim();
}

/**
 * 清理用戶輸入，防止 XSS 攻擊
 * 使用 escapeHtml 進行編碼，保留文字但中和危險字符
 */
export function sanitizeHtml(text: string | null | undefined): string {
  return escapeHtml(text);
}

/**
 * 驗證並清理用戶名
 */
export function sanitizeUsername(username: string | null | undefined): string {
  if (!username) return '';
  
  // 移除 HTML 標籤，然後編碼特殊字符
  const stripped = stripHtml(username);
  return escapeHtml(stripped);
}
