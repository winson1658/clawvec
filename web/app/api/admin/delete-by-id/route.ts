import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.CRON_SECRET_KEY || '';

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === adminSecret && adminSecret.length > 0;
}

// ⚠️ DEPRECATED: 請改用 /api/admin/moderation (支援 dry-run + confirm)
// 從之前 API 抓取的人類帳號 ID 列表
const HUMAN_IDS = [
  "15e02a22-d91b-4089-bf2e-5f05c8393374",
  "df60c46d-a09b-4b57-8378-6d4a43fe848c",
  "265c9d6c-6876-43b9-98e9-5b57992145e8",
  "6a9fd437-d6c9-45cb-ad9d-cbe46c9fc094",
  "47b25305-9d0c-4e6e-bf05-76a5ba5df7d8",
  "a8015eb5-ce77-4e74-98e4-1312e07cd8d1",
  "0281cc84-240c-4b70-9167-003715c7f9d9",
  "ba61497f-7a0a-4118-9094-a704f844694e",
  "cbfdb0dd-fd3e-4a2b-8a96-42637876bf3f",
  "40d94f82-f039-403d-869e-68dc7952dde0",
  "c9cee82f-6a96-4740-8bb4-8e9cce9e1317",
  "c055120c-ff52-48db-8623-50aee66a175e",
  "db692439-8caa-4d5f-ac8f-c2044d553e54",
  "2f972547-71cc-45a1-8cbc-369e33bc811c",
  "3bb069fa-0c46-4f13-b325-ade2b0f751d1",
  "903d5aa3-fa9d-4a53-916b-2d157fa3d48f",
  "970fe251-d93b-40ac-b825-f0411c9c52d0",
  "116709db-31e9-4ee4-ab83-176173495985",
  "cba88f78-e556-435b-9144-b679a3770c94",
  "7668681c-714a-4a81-9412-c8ee2189a1ca",
  "05f36d25-9da3-48b8-876f-015e982cd0e7",
  "9a166877-aa73-4efb-9031-6b524e9d906d",
  "8a5b5f81-a262-4b8c-a405-aafc6c6c4f92",
  "436c7b33-9310-4aa7-8530-e631eafeab46"
];

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin credentials required' } },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let deletedCount = 0;
    const errors = [];

    for (const id of HUMAN_IDS) {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);
      
      if (!error) {
        deletedCount++;
        console.log(`Deleted: ${id}`);
      } else {
        errors.push({ id, error: error.message });
        console.error(`Failed to delete ${id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} of ${HUMAN_IDS.length} accounts`,
      deletedCount,
      total: HUMAN_IDS.length,
      errors: errors.length > 0 ? errors : undefined
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
    message: 'POST to delete specific human accounts by ID',
    count: HUMAN_IDS.length
  });
}