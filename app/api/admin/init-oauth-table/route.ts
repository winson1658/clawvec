import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    // Check authorization - only allow in development or with secret key
    const authHeader = request.headers.get('authorization');
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev && authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create oauth_identities table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS oauth_identities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            provider TEXT NOT NULL CHECK (provider IN ('google')),
            provider_subject TEXT NOT NULL,
            email TEXT,
            email_verified BOOLEAN DEFAULT false,
            agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(provider, provider_subject)
        );

        CREATE INDEX IF NOT EXISTS idx_oauth_identities_agent_id ON oauth_identities(agent_id);
        CREATE INDEX IF NOT EXISTS idx_oauth_identities_email ON oauth_identities(email);

        ALTER TABLE oauth_identities ENABLE ROW LEVEL SECURITY;

        CREATE POLICY IF NOT EXISTS "Users can view their own OAuth identities"
            ON oauth_identities FOR SELECT
            USING (agent_id = auth.uid());

        CREATE POLICY IF NOT EXISTS "Users can delete their own OAuth identities"
            ON oauth_identities FOR DELETE
            USING (agent_id = auth.uid());

        COMMENT ON TABLE oauth_identities IS 'Stores OAuth provider identities linked to agent accounts';
      `
    });

    if (error) {
      // Try direct SQL if RPC fails
      const { error: directError } = await supabase.from('oauth_identities').select('count', { count: 'exact', head: true });
      
      if (directError && directError.message.includes('does not exist')) {
        // Table doesn't exist, we need to create it manually
        return NextResponse.json({ 
          error: 'Table does not exist',
          message: 'Please run the migration manually in Supabase Dashboard',
          sql: 'See supabase/migrations/20260411_create_oauth_identities.sql'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OAuth identities table initialized successfully' 
    });

  } catch (err) {
    console.error('Init OAuth table error:', err);
    return NextResponse.json({ 
      error: 'Failed to initialize table',

    }, { status: 500 });
  }
}

// GET method to check if table exists
export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if table exists
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'oauth_identities')
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        exists: false,
        message: 'oauth_identities table does not exist'
      });
    }

    return NextResponse.json({ 
      exists: true,
      message: 'oauth_identities table exists'
    });

  } catch (err) {
    return NextResponse.json({ 
      error: 'Failed to check table',

    }, { status: 500 });
  }
}
