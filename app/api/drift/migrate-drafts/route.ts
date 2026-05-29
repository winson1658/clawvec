import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/migrate-drafts
// One-time migration to add missing columns to drift_drafts
export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: string[] = [];

    // Try adding content column if missing
    const { error: e1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE drift_drafts ADD COLUMN IF NOT EXISTS content TEXT;',
    });

    if (e1) {
      // RPC might not exist, try raw SQL via REST
      const { error: raw1 } = await supabase
        .from('_migration_log')
        .insert({ note: 'add_content' });
    }

    // Fallback: try direct SQL
    const { error: alterError } = await supabase
      .from('drift_drafts')
      .update({ title: null })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    // Instead, let's do a proper approach: check what columns exist
    // by trying to insert with just essential columns and see what errors we get
    
    // First, try inserting with only required non-null columns
    // The table has: id (auto), session_id, agent_id, content_type, status (default), expires_at (default)
    // Let's see what the minimal insert looks like
    
    return NextResponse.json({
      success: false,
      message: 'Manual migration required. Please run: ALTER TABLE drift_drafts ADD COLUMN IF NOT EXISTS content TEXT;',
      hint: 'Use Supabase Dashboard SQL Editor',
      alterError: alterError?.message || 'none',
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Migration failed',
      detail: 'Internal server error',
    });
  }
}
