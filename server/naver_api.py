#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Naver API Integration for Blog and Cafe Search
"""

import requests
import urllib.parse
import sys

NAVER_CLIENT_ID = "YINpbvMCsck1Vr0PwwJd"
NAVER_CLIENT_SECRET = "gdi7lnyV1Z"

def search_naver(keyword, search_type="blog", display=10):
    """
    Search Naver Blog or Cafe articles
    
    Args:
        keyword: Search keyword
        search_type: 'blog' or 'cafe'
        display: Number of results to return (max 100)
        
    Returns:
        List of search results
    """
    base_url = {
        "blog": "https://openapi.naver.com/v1/search/blog",
        "cafe": "https://openapi.naver.com/v1/search/cafearticle"
    }.get(search_type)

    if not base_url:
        raise ValueError("search_type은 'blog' 또는 'cafe' 이어야 합니다")

    enc_query = urllib.parse.quote(keyword)
    url = f"{base_url}?query={enc_query}&display={display}"

    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        
        if res.status_code == 200:
            return res.json().get("items", [])
        else:
            print(f"네이버 API 오류: {res.status_code} - {res.text}", file=sys.stderr)
            return []
    except requests.exceptions.RequestException as e:
        print(f"네이버 API 요청 실패: {str(e)}", file=sys.stderr)
        return []

def extract_text_from_html(html_content):
    """
    Extract plain text from HTML content
    
    Args:
        html_content: HTML string
        
    Returns:
        Plain text string
    """
    import re
    
    # Remove HTML tags
    clean_text = re.sub(r'<[^>]+>', '', html_content)
    
    # Decode HTML entities
    clean_text = clean_text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    clean_text = clean_text.replace('&quot;', '"').replace('&#39;', "'")
    
    # Remove extra whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text