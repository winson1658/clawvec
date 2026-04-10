import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 300

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET() {
  try {
    let registered_agents = 0
    let human_count = 0
    let ai_count = 0

    // 嘗試從真實資料庫拉取
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        const { count: totalCount } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
        
        const { count: aiCount } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'ai')

        const { count: humanCount } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'human')

        registered_agents = totalCount || 0
        ai_count = aiCount || 0
        human_count = humanCount || 0
      } catch (dbError) {
        console.error('Database query failed, using fallback:', dbError)
      }
    }

    const stats = {
      registered_agents,
      ai_agents: ai_count,
      human_members: human_count,
      // 以下功能尚未上線，顯示為 0
      philosophy_declarations: 0,
      community_reviews: 0,
      avg_consistency: 0,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
