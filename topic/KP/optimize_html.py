#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批次優化 iPAS 資安中級 KP 目錄下的所有 HTML 檔案
將內嵌的 CSS 和 JavaScript 替換為外部檔案引用
"""

import os
import re
from pathlib import Path

# 目標目錄
KP_DIR = r'g:\exam\04_iPAS\84_iPAS_資安\iPAS_資安中級\topic\KP'

def optimize_html_file(file_path):
    """優化單個 HTML 檔案"""
    print(f'處理: {file_path.name}')
    
    # 讀取原始內容
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 備份原始大小
    original_size = len(content)
    
    # 1. 移除 <style> 區塊 (第 7-319 行)
    # 使用正則表達式匹配整個 style 區塊
    style_pattern = r'    <style>.*?    </style>\r?\n'
    content = re.sub(style_pattern, '', content, flags=re.DOTALL)
    
    # 2. 在 </head> 前插入外部 CSS 連結
    css_link = '    <link rel="stylesheet" href="kp_common.css">\n'
    content = content.replace('</head>', css_link + '</head>')
    
    # 3. 移除 <script> 區塊 (通常在 body 結束前)
    # 匹配 <script> 到 </script> 的所有內容
    script_pattern = r'    <script>.*?    </script>\r?\n'
    content = re.sub(script_pattern, '', content, flags=re.DOTALL)
    
    # 4. 在 </body> 前插入外部 JS 連結（使用 defer）
    js_link = '    <script src="kp_common.js" defer></script>\n'
    content = content.replace('</body>', js_link + '</body>')
    
    # 寫入優化後的內容
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    new_size = len(content)
    reduction = original_size - new_size
    percentage = (reduction / original_size) * 100
    
    print(f'  原始大小: {original_size:,} bytes')
    print(f'  優化後: {new_size:,} bytes')
    print(f'  減少: {reduction:,} bytes ({percentage:.1f}%)\n')
    
    return {
        'file': file_path.name,
        'original': original_size,
        'optimized': new_size,
        'reduction': reduction
    }

def main():
    """主函數"""
    kp_path = Path(KP_DIR)
    
    if not kp_path.exists():
        print(f'錯誤: 找不到目錄 {KP_DIR}')
        return
    
    # 找出所有 HTML 檔案（排除可能的備份檔）
    html_files = sorted([
        f for f in kp_path.glob('*.html')
        if not f.name.startswith('.')
    ])
    
    if not html_files:
        print('錯誤: 找不到 HTML 檔案')
        return
    
    print(f'找到 {len(html_files)} 個 HTML 檔案\n')
    print('=' * 70)
    
    results = []
    for html_file in html_files:
        try:
            result = optimize_html_file(html_file)
            results.append(result)
        except Exception as e:
            print(f'錯誤處理 {html_file.name}: {e}\n')
    
    # 顯示總結
    print('=' * 70)
    print('優化總結:\n')
    print(f'{'檔案':<50} {'減少 (%)':>15}')
    print('-' * 70)
    
    total_original = 0
    total_optimized = 0
    
    for r in results:
        percentage = (r['reduction'] / r['original']) * 100
        print(f'{r["file"]:<50} {percentage:>14.1f}%')
        total_original += r['original']
        total_optimized += r['optimized']
    
    total_reduction = total_original - total_optimized
    total_percentage = (total_reduction / total_original) * 100
    
    print('-' * 70)
    print(f'總計:')
    print(f'  原始大小: {total_original:,} bytes')
    print(f'  優化後: {total_optimized:,} bytes')
    print(f'  總減少: {total_reduction:,} bytes ({total_percentage:.1f}%)')
    print('\n✅ 優化完成！')

if __name__ == '__main__':
    main()
