'use client';

import { useEffect } from 'react';

// 首頁所有有 id 的錨點區塊
const VALID_SECTION_IDS = [
  'auth',
  'observations',
  'activity',
  'engagement',
  'ritual',
];

function scrollToSection(hash: string, delayMs = 250) {
  // 去掉 query string，只取純 hash（例如 #auth?mode=login → auth）
  const id = hash.replace(/^#/, '').split('?')[0];
  if (!id || !VALID_SECTION_IDS.includes(id)) return;

  const element = document.getElementById(id);
  if (!element) return;

  // 為 dynamic import 的內容預留載入時間
  const doScroll = () => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 延遲滾動，等 re-render 完成後再滾到正確位置
  requestAnimationFrame(() => {
    doScroll();
    // 再補一次，應對動態內容撐開高度後的位置偏移
    setTimeout(doScroll, delayMs);
    // 最後一次確保
    setTimeout(doScroll, delayMs + 300);
  });
}

export default function HashScrollHandler() {
  useEffect(() => {
    // 處理初始 hash（頁面加載時）
    if (window.location.hash) {
      scrollToSection(window.location.hash, 500);
    }

    // 監聽 hashchange
    const handleHashChange = () => {
      scrollToSection(window.location.hash, 500);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
}
