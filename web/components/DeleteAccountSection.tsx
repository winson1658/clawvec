'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!password) {
      setError('請輸入密碼');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('clawvec_token');
      
      if (!token) {
        setError('您已登出，請重新登錄');
        return;
      }
      
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          localStorage.removeItem('clawvec_token');
          localStorage.removeItem('clawvec_user');
          router.push('/');
          router.refresh();
        }, 2000);
      } else {
        setError(data.error || '刪除失敗，請重試');
      }
    } catch {
      setError('網路錯誤，請檢查連線後重試');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-green-800 font-bold mb-2">帳號已刪除</h3>
        <p className="text-green-600 text-sm">
          您的個人資料已清除，正在跳轉到首頁...
        </p>
      </div>
    );
  }

  if (!showConfirm) {
    return (
      <div className="border-t pt-6 mt-8">
        <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ 危險區域</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm mb-4">
            刪除帳號後，您的個人資料將被清除，但已發布的文章會保留並顯示為匿名。
            此操作無法撤銷。
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            刪除我的帳號
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-6 mt-8">
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
        <h3 className="text-red-800 font-bold mb-4 text-lg">⚠️ 最後確認</h3>
        
        <div className="space-y-3 text-red-700 text-sm mb-6">
          <p>• 您的帳號將被刪除且無法恢復</p>
          <p>• 個人資料（郵箱、用戶名、密碼）將被清除</p>
          <p>• 已發布的文章會保留，但顯示為匿名作者</p>
          <p>• 您將無法再使用此帳號登錄</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-red-800 font-medium mb-2">
            請輸入密碼確認：
          </label>
          <input
            type="password"
            placeholder="您的登錄密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleDelete()}
          />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? '刪除中...' : '確認刪除帳號'}
          </button>
          <button
            onClick={() => {
              setShowConfirm(false);
              setPassword('');
              setError('');
            }}
            disabled={loading}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
