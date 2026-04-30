'use client';

import { useEffect } from 'react';

export default function SteleTheme() {
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const originalBodyBg = body.style.backgroundColor;
    const originalHtmlBg = html.style.backgroundColor;
    const originalBodyColor = body.style.color;
    
    body.style.backgroundColor = '#0A0A0A';
    html.style.backgroundColor = '#0A0A0A';
    body.style.color = '#E8E4DC';
    
    return () => {
      body.style.backgroundColor = originalBodyBg;
      html.style.backgroundColor = originalHtmlBg;
      body.style.color = originalBodyColor;
    };
  }, []);

  return null;
}
