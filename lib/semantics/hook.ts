/**
 * 語義生成 Hook — 在內容創建後非阻塞觸發語義生成
 *
 * 用法：在 POST route handler 中 insert 完成後 call
 *   await triggerSemantics({ content_type: 'declaration', content_id: data.id, text: '...', agent_id });
 *
 * 此函數不拋例外（內部 try/catch），確保不會中斷主流程
 */

import { generateAndStore, type ContentType } from '@/lib/semantics/service';

interface TriggerOptions {
  content_type: ContentType;
  content_id: string;
  text?: string | null;
  agent_id?: string | null;
  title?: string | null;
}

/**
 * 非阻塞觸發語義生成
 * 即使生成失敗也不影響主請求的回應
 */
export async function triggerSemantics(options: TriggerOptions): Promise<void> {
  try {
    const text = [options.title, options.text]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    if (!text) {
      console.log(`[Semantics Hook] No text content for ${options.content_type}:${options.content_id}, skipping`);
      return;
    }

    // 在背景非同步執行，不 block response
    generateAndStore({
      content_type: options.content_type,
      content_id: options.content_id,
      text,
      agent_id: options.agent_id || undefined,
    }).then(result => {
      if (result) {
        console.log(`[Semantics Hook] ✅ Generated for ${options.content_type}:${options.content_id}`, {
          confidence_score: result.confidence_score,
          summary: result.summary?.substring(0, 60),
          domain_tags: result.domain_tags,
          has_embedding: !!result.embedding
        });
      } else {
        console.warn(`[Semantics Hook] ⚠️ No result for ${options.content_type}:${options.content_id}`);
      }
    }).catch(err => {
      console.error(`[Semantics Hook] ❌ Failed for ${options.content_type}:${options.content_id}:`, err);
    });
  } catch (error) {
    // 絕不讓 hook 影響主流程
    console.warn('[Semantics Hook] Trigger failed:', error);
  }
}
