#!/usr/bin/env python3
"""
icrawler 图片搜索桥接脚本
支持 Bing 和 Baidu 图片搜索

用法:
    python image_search.py <engine> <keyword> [max_num]
    
参数:
    engine: bing | baidu
    keyword: 搜索关键词
    max_num: 最大下载数量（默认 10）

返回:
    JSON 格式: {"files": [...], "temp_dir": "..."}
"""

import sys
import json
import tempfile
import os
import logging

# 禁用 icrawler 的日志输出（避免干扰 JSON 输出）
logging.getLogger('icrawler').setLevel(logging.ERROR)

from icrawler.builtin import BingImageCrawler, BaiduImageCrawler


def search_images(engine: str, keyword: str, max_num: int = 10) -> dict:
    """
    搜索图片并下载到临时目录
    
    Args:
        engine: 搜索引擎 (bing | baidu)
        keyword: 搜索关键词
        max_num: 最大下载数量
        
    Returns:
        dict: {"files": [文件路径列表], "temp_dir": "临时目录路径"}
    """
    # 创建临时目录
    temp_dir = tempfile.mkdtemp(prefix=f"icrawler_{engine}_")
    
    # 根据引擎选择爬虫
    if engine == 'bing':
        crawler = BingImageCrawler(
            storage={'root_dir': temp_dir},
            log_level=logging.ERROR
        )
    elif engine == 'baidu':
        crawler = BaiduImageCrawler(
            storage={'root_dir': temp_dir},
            log_level=logging.ERROR
        )
    else:
        raise ValueError(f"Unknown engine: {engine}. Supported: bing, baidu")
    
    # 执行爬取
    crawler.crawl(keyword=keyword, max_num=max_num)
    
    # 收集下载的文件
    files = []
    if os.path.exists(temp_dir):
        for filename in sorted(os.listdir(temp_dir)):
            filepath = os.path.join(temp_dir, filename)
            if os.path.isfile(filepath):
                # 获取文件大小
                size = os.path.getsize(filepath)
                files.append({
                    "path": filepath,
                    "filename": filename,
                    "size": size
                })
    
    return {
        "success": True,
        "engine": engine,
        "keyword": keyword,
        "requested": max_num,
        "downloaded": len(files),
        "files": files,
        "temp_dir": temp_dir
    }


def main():
    """主函数：解析命令行参数并执行搜索"""
    if len(sys.argv) < 3:
        error_result = {
            "success": False,
            "error": "Usage: python image_search.py <engine> <keyword> [max_num]",
            "engines": ["bing", "baidu"]
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)
    
    engine = sys.argv[1].lower()
    keyword = sys.argv[2]
    max_num = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    
    try:
        result = search_images(engine, keyword, max_num)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "engine": engine,
            "keyword": keyword
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)


if __name__ == '__main__':
    main()
