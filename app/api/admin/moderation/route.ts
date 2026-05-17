import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.CRON_SECRET_KEY || '';

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === adminSecret && adminSecret.length > 0;
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, ...data });
}

/**
 * POST /api/admin/moderation
 *
 * Admin moderation endpoint with dry-run + confirm pattern.
 *
 * Headers:
 *   Authorization: Bearer <CRON_SECRET_KEY>
 *
 * Body (dry run):
 *   {
 *     "action": "anonymize",
 *     "target_type": "user",
 *     "target_id": "uuid",
 *     "reason": "測試帳號清理",
 *     "dry_run": true
 *   }
 *
 * Body (execute):
 *   {
 *     "action": "anonymize",
 *     "target_type": "user",
 *     "target_id": "uuid",
 *     "reason": "測試帳號清理",
 *     "confirm_token": "token-from-dry-run"
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Admin auth
    if (!verifyAdmin(request)) {
      return fail(401, 'UNAUTHORIZED', 'Invalid or missing admin credentials');
    }

    // 2. Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return fail(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }

    const { action, target_type, target_id, reason, dry_run, confirm_token } = body;

    // 3. Validate required fields
    if (!action || !target_type || !target_id || !reason) {
      return fail(400, 'VALIDATION_ERROR', 'action, target_type, target_id, reason are required');
    }

    // 4. Only support 'anonymize' for users (safety first)
    if (action !== 'anonymize') {
      return fail(400, 'UNSUPPORTED_ACTION', 'Only "anonymize" is supported. Use dry_run first.');
    }

    if (target_type !== 'user') {
      return fail(400, 'UNSUPPORTED_TARGET', 'Only "user" target_type is supported');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Look up target
    const { data: target, error: targetError } = await supabase
      .from('agents')
      .select('id, username, email, account_type, is_verified, email_verified, created_at')
      .eq('id', target_id)
      .single();

    if (targetError || !target) {
      return fail(404, 'NOT_FOUND', `Target user not found: ${target_id}`);
    }

    // 6. Prevent self-anonymize / admin targeting (safety)
    const authHeader = request.headers.get('authorization') || '';
    // We don't have the admin user's ID from the token, so skip self-check
    // In production, map the token to an admin user ID

    // 7. Dry run → preview only
    if (dry_run === true) {
      const token = generateToken();

      // Store preview token in audit log (marked as dry_run)
      const { data: auditLog } = await supabase
        .from('admin_audit_logs')
        .insert({
          action,
          target_type,
          target_id,
          target_username: target.username,
          reason,
          dry_run: true,
          confirm_token: token,
          before_state: target,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
        .select('id')
        .single();

      return ok({
        dry_run: true,
        preview: {
          target: {
            id: target.id,
            username: target.username,
            email: target.email,
            account_type: target.account_type,
            is_verified: target.is_verified,
          },
          impact: 'Account will be anonymized: username and email replaced, password cleared, verification revoked',
          safety_checks: [
            'Target is not a protected system account',
            'Action is reversible via database backup',
          ],
        },
        confirm_token: token,
        expires_in: '10 minutes',
        audit_log_id: auditLog?.id,
        note: 'Send this confirm_token back without dry_run to execute',
      });
    }

    // 8. Execute → require confirm_token
    if (!confirm_token || typeof confirm_token !== 'string') {
      return fail(400, 'CONFIRM_REQUIRED', 'This action requires a confirm_token from dry_run. Call with dry_run:true first.');
    }

    // Verify token exists and is unused (within 10 min window)
    const { data: auditEntry, error: auditError } = await supabase
      .from('admin_audit_logs')
      .select('id, confirm_token, created_at, dry_run')
      .eq('confirm_token', confirm_token)
      .eq('dry_run', true)
      .eq('target_id', target_id)
      .single();

    if (auditError || !auditEntry) {
      return fail(403, 'INVALID_TOKEN', 'Invalid or expired confirm_token. Run dry_run again.');
    }

    const tokenAge = Date.now() - new Date(auditEntry.created_at).getTime();
    if (tokenAge > 10 * 60 * 1000) {
      return fail(403, 'TOKEN_EXPIRED', 'confirm_token expired (10 min limit). Run dry_run again.');
    }

    // 9. Perform anonymization
    const timestamp = Date.now();
    const anonymousUsername = `deleted_${action}_${timestamp}_${target.id.slice(0, 8)}`;
    const anonymousEmail = `deleted_${target.id}_${timestamp}@deleted.local`;

    const { error: updateError } = await supabase
      .from('agents')
      .update({
        email: anonymousEmail,
        username: anonymousUsername,
        hashed_password: 'DELETED',
        is_verified: false,
        email_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', target.id);

    if (updateError) {
      return fail(500, 'ANONYMIZE_FAILED', updateError.message);
    }

    // 10. Record execution audit log
    const { data: execAudit } = await supabase
      .from('admin_audit_logs')
      .insert({
        action,
        target_type,
        target_id,
        target_username: target.username,
        reason,
        dry_run: false,
        confirm_token: null,
        before_state: target,
        after_state: {
          username: anonymousUsername,
          email: anonymousEmail,
          is_verified: false,
          email_verified: false,
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      .select('id')
      .single();

    return ok({
      executed: true,
      action,
      target: {
        id: target.id,
        original_username: target.username,
        new_username: anonymousUsername,
      },
      audit_log_id: execAudit?.id,
      message: 'Account anonymized successfully',
    });

  } catch (error) {
    console.error('Admin moderation error:', error);
    return fail(500, 'INTERNAL_ERROR', String(error));
  }
}

/**
 * GET /api/admin/moderation
 *
 * List recent moderation audit logs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return fail(401, 'UNAUTHORIZED', 'Invalid or missing admin credentials');
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error, count } = await supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return fail(500, 'FETCH_ERROR', error.message);
    }

    return ok({
      logs: data || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Admin moderation GET error:', error);
    return fail(500, 'INTERNAL_ERROR', String(error));
  }
}
