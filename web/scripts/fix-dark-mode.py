#!/usr/bin/env python3
"""
批量修復日夜間模式支援
為所有 .tsx 檔案添加 dark: 前綴
"""

import os
import re
import sys

BASE_DIR = "/home/winson/.openclaw/workspace/web"

# Patterns to fix - 從最特定的到最通用的
PATTERNS = [
    # Background gradients
    (r'bg-gradient-to-b from-gray-900 to-gray-800', 
     'bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'),
    
    (r'bg-gradient-to-br from-gray-900 to-gray-800', 
     'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'),
    
    (r'bg-gradient-to-br from-gray-900/80 to-gray-800/50', 
     'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/80 dark:to-gray-800/50'),
    
    (r'bg-gradient-to-br from-gray-900/50 to-gray-800/50', 
     'bg-gradient-to-br from-white/90 to-gray-50/80 dark:from-gray-900/50 dark:to-gray-800/50'),
    
    # Semi-transparent backgrounds
    (r'bg-gray-900/50', 'bg-white/80 dark:bg-gray-900/50'),
    (r'bg-gray-900/30', 'bg-white/60 dark:bg-gray-900/30'),
    (r'bg-gray-900/80', 'bg-white/90 dark:bg-gray-900/80'),
    (r'bg-gray-900/90', 'bg-white/95 dark:bg-gray-900/90'),
    (r'bg-gray-900/40', 'bg-white/70 dark:bg-gray-900/40'),
    (r'bg-gray-900/60', 'bg-white/85 dark:bg-gray-900/60'),
    (r'bg-gray-900/20', 'bg-white/50 dark:bg-gray-900/20'),
    
    (r'bg-gray-800/50', 'bg-gray-100 dark:bg-gray-800/50'),
    (r'bg-gray-800/30', 'bg-gray-100/70 dark:bg-gray-800/30'),
    (r'bg-gray-800/80', 'bg-gray-200 dark:bg-gray-800/80'),
    
    (r'bg-gray-700/50', 'bg-gray-200 dark:bg-gray-700/50'),
    
    # Solid backgrounds
    (r'bg-gray-950', 'bg-white dark:bg-gray-950'),
    (r'bg-gray-900', 'bg-gray-50 dark:bg-gray-900'),
    (r'bg-gray-800', 'bg-gray-100 dark:bg-gray-800'),
    (r'bg-gray-700', 'bg-gray-200 dark:bg-gray-700'),
    
    # Borders
    (r'border-gray-800', 'border-gray-200 dark:border-gray-800'),
    (r'border-gray-700', 'border-gray-300 dark:border-gray-700'),
    (r'border-gray-900', 'border-gray-100 dark:border-gray-900'),
    
    # Text colors - 需要特別小心處理
    (r'text-gray-100', 'text-gray-900 dark:text-gray-100'),
    (r'text-gray-200', 'text-gray-800 dark:text-gray-200'),
    (r'text-gray-300', 'text-gray-600 dark:text-gray-300'),
    (r'text-gray-400', 'text-gray-500 dark:text-gray-400'),
]

def process_file(filepath):
    """處理單個檔案"""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    
    content = original
    changes = []
    
    for pattern, replacement in PATTERNS:
        # 使用字面值替換（不是正則）
        count = content.count(pattern)
        if count > 0:
            content = content.replace(pattern, replacement)
            changes.append(f"  {pattern} -> {replacement} ({count}次)")
    
    # 特別處理 text-white - 需要確認它不在 dark: 後面
    # 使用更謹慎的方法
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        # 如果這行有 text-white 但沒有 dark:text-white
        if 'text-white' in line and 'dark:text-white' not in line:
            # 檢查是否在 className 中
            if 'className=' in line:
                # 替換 text-white 為 text-gray-900 dark:text-white
                # 但要小心不要替換已經有 dark: 前綴的
                line = re.sub(r'(?<!dark:)text-white(?!\\)', 'text-gray-900 dark:text-white', line)
        new_lines.append(line)
    content = '\n'.join(new_lines)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, changes
    return False, []

def main():
    fixed_count = 0
    total_files = 0
    
    # 處理所有 tsx 檔案
    for root, dirs, files in os.walk(BASE_DIR):
        # 跳過不需要的目錄
        if any(skip in root for skip in ['node_modules', '.next', 'scripts']):
            continue
        
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                
                # 檢查是否包含深色模式顏色但沒有 dark: 前綴
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                has_dark_colors = ('bg-gray-900' in content or 
                                  'bg-gray-800' in content or
                                  'from-gray-900' in content or
                                  'to-gray-900' in content)
                has_dark_prefix = 'dark:' in content
                
                if has_dark_colors and not has_dark_prefix:
                    total_files += 1
                    fixed, changes = process_file(filepath)
                    if fixed:
                        fixed_count += 1
                        rel_path = filepath.replace(BASE_DIR, '')
                        print(f"✅ {rel_path}")
                        for change in changes[:3]:  # 只顯示前3個變更
                            print(change)
                        if len(changes) > 3:
                            print(f"  ... 還有 {len(changes)-3} 個變更")
    
    print(f"\n總計: 修復了 {fixed_count} 個檔案")

if __name__ == '__main__':
    main()
