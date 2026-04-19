import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/notification-preferences?user_id=UUID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.rpc('get_notification_preferences', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Get notification preferences error:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }
    
    // Convert to object keyed by category
    const preferences: Record<string, { is_muted: boolean; delivery_method: string }> = {};
    data?.forEach((row: any) => {
      preferences[row.category] = {
        is_muted: row.is_muted,
        delivery_method: row.delivery_method
      };
    });
    
    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notification-preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, category, is_muted, delivery_method } = body;
    
    if (!user_id || !category) {
      return NextResponse.json({ error: 'user_id and category are required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id,
        category,
        is_muted: is_muted ?? false,
        delivery_method: delivery_method ?? 'in_app',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,category' })
      .select()
      .single();
    
    if (error) {
      console.error('Upsert notification preference error:', error);
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Notification preferences POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
