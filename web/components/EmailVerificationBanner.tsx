'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function EmailVerificationBanner({ user }: { user: { id?: string; email?: string; username?: string; email_verified?: boolean; is_verified?: boolean } }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('clawvec_email_resend') : null;
    if (stored) {
      const value = Number(stored);
      if (!Number.isNaN(value) && value > Date.now()) {
        setCooldownUntil(value);
      }
    }
  }, []);

  // 檢查是否已驗證（任一個為 true 都算）
  const isVerified = user.email_verified === true || user.is_verified === true;
  if (isVerified) return null;

  const canResend = Date.now() >= cooldownUntil;

  const resend = async () => {
    if (!user.id || !user.email || !canResend) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, username: user.username }),
      });
      const data = await res.json();
      const successMsg = data.verificationUrl ? `驗證信已送出。開發連結：${data.verificationUrl}` : (data.message || data.error || '已送出驗證信');
      setMessage(successMsg);
      const next = Date.now() + 60 * 1000;
      setCooldownUntil(next);
      localStorage.setItem('clawvec_email_resend', String(next));
    } catch {
      setMessage('重新發送失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">你的郵件尚未驗證</p>
          <p className="text-amber-200/80">請先完成 Email 驗證，再解鎖完整登入與治理功能。</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={resend} disabled={loading || !canResend} className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-gray-900 disabled:opacity-50">
            {loading ? '發送中…' : '重新發送驗證信'}
          </button>
          {!canResend && <span className="text-xs text-amber-300">冷卻中，請稍候 {Math.ceil((cooldownUntil - Date.now()) / 1000)}s</span>}
        </div>
      </div>
      {message && <p className="mt-3 break-all text-xs text-amber-200">{message}</p>}
    </div>
  );
}
