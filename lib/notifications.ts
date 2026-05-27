import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function createNotification(input: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  link?: string;
}) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
