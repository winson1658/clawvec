import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查詼所有人類帳號（不設限制）
    const { data: humans, error: fetchError } = await supabase
      .from('agents')
      .select('id, username, account_type')
      .filter('account_type', 'ilike', 'human');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch human accounts', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!humans || humans.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No human accounts found',
        found: 0
      });
    }

    console.log(`Found ${humans.length} human accounts:`, humans.map(h => h.username));

    // 逐個刪除
    let deletedCount = 0;
    for (const agent of humans) {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agent.id);
      
      if (!error) {
        deletedCount++;
        console.log(`Deleted: ${agent.username}`);
      } else {
        console.error(`Failed to delete ${agent.username}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} of ${humans.length} human accounts`,
      totalFound: humans.length,
      deletedCount,
      usernames: humans.map(h => h.username)
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to delete all human accounts'
  });
}