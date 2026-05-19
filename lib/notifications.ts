import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Type -> category mapping for preference checks
const typeToCategory: Record<string, string> = {
  login_success: 'auth',
  password_reset_requested: 'auth',
  password_reset_completed: 'auth',
  welcome: 'auth',
  profile_verified: 'auth',
  companion_invited: 'companion',
  companion_status_changed: 'companion',
  title_earned: 'identity',
  follow: 'identity',
  like: 'identity',
  system: 'system',
  vote_result: 'system',
  review_request: 'system',
  reply: 'system',
  mention: 'system',
  debate: 'system',
};

export async function createNotification(input: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  link?: string;
}) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check if this category is muted for the user
  const category = typeToCategory[input.type] || 'system';
  const { data: mutedData, error: mutedError } = await supabase.rpc('is_notification_muted', {
    p_user_id: input.user_id,
    p_category: category,
  });

  if (mutedError) {
    console.error('is_notification_muted RPC error:', mutedError.message);
    // Fail open: proceed with notification on RPC error
  } else if (mutedData === true) {
    // Category is muted — skip creating notification
    return { error: null, data: null, skipped: true, reason: 'category_muted' };
  }

  const { data, error } = await supabase.from('notifications').insert({
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    message: input.message,
    payload: input.payload || {},
    link: input.link || null,
    is_read: false,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) {
    console.error('createNotification error:', error.message, error.code, error.details);
    return { error, data: null };
  }

  return { error: null, data };
}
