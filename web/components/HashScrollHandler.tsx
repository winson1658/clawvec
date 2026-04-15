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

function scrollToSection(hash: string) {
  // 去掉 query string，只取純 hash（例如 #auth?mode=login → auth）
  const id = hash.replace(/^#/, '').split('?')[0];
  if (!id || !VALID_SECTION_IDS.includes(id)) return;

  const element = document.getElementById(id);
  if (!element) return;

  // 為 dynamic import 的內容預留載入時間
  const doScroll = () => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 如果元素還在載入，稍後再試一次
  requestAnimationFrame(() => {
    doScroll();
    // 再補一次，應對動態內容撐開高度後的位置偏移
    setTimeout(doScroll, 250);
  });
}

export default function HashScrollHandler() {
  useEffect(() => {
    // 只在 hashchange 時處理（mount 時交給瀏覽器原生行為）
    const handleHashChange = () => {
      scrollToSection(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
}
