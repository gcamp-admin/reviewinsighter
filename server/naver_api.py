#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Naver API Integration for Blog and Cafe Search
"""

import requests
import urllib.parse
import sys
import re

NAVER_CLIENT_ID = "YINpbvMCsck1Vr0PwwJd"
NAVER_CLIENT_SECRET = "gdi7lnyV1Z"

def extract_user_id_from_url(bloggerlink, link, search_type):
    """
    Extract user ID from Naver Blog or Cafe URL
    
    Args:
        bloggerlink: Blogger link (for blog)
        link: Direct link to the content
        search_type: 'blog' or 'cafe'
        
    Returns:
        Extracted user ID or default value
    """
    try:
        if search_type == "blog":
            # For blog, try to extract from bloggerlink first
            if bloggerlink:
                # Pattern: https://blog.naver.com/USERNAME
                match = re.search(r'blog\.naver\.com/([^/?]+)', bloggerlink)
                if match:
                    return match.group(1)
            
            # If bloggerlink fails, try from link
            if link:
                # Pattern: https://blog.naver.com/USERNAME/POST_ID
                match = re.search(r'blog\.naver\.com/([^/?]+)', link)
                if match:
                    return match.group(1)
                    
        elif search_type == "cafe":
            # For cafe, extract from link
            if link:
                # Pattern: https://cafe.naver.com/CAFE_NAME/ARTICLE_ID
                match = re.search(r'cafe\.naver\.com/([^/?]+)', link)
                if match:
                    return f"카페_{match.group(1)}"
                    
        return None
        
    except Exception as e:
        print(f"Error extracting user ID: {str(e)}", file=sys.stderr)
        return None

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

    # 🔐 정확 검색과 일반 검색을 병행하여 더 많은 결과 확보
    queries = [
        urllib.parse.quote(f'"{keyword}"'),  # 정확 검색
        urllib.parse.quote(keyword),  # 일반 검색
        urllib.parse.quote(f"{keyword} 앱"),  # 앱 관련 검색
        urllib.parse.quote(f"{keyword} 리뷰")  # 리뷰 관련 검색
    ]
    
    all_results = []
    seen_links = set()
    
    for query in queries:
        url = f"{base_url}?query={query}&display={display}&sort=date"  # 최신순 정렬 추가

        headers = {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
        }

        try:
            res = requests.get(url, headers=headers, timeout=10)
            
            if res.status_code == 200:
                items = res.json().get("items", [])
                # Extract user IDs from URLs and avoid duplicates
                for item in items:
                    link = item.get('link', '')
                    if link not in seen_links:
                        seen_links.add(link)
                        user_id = extract_user_id_from_url(item.get('bloggerlink', ''), link, search_type)
                        item['extracted_user_id'] = user_id
                        all_results.append(item)
                        
                        # 목표 수량에 도달하면 종료
                        if len(all_results) >= display:
                            break
            else:
                print(f"네이버 API 오류: {res.status_code} - {res.text}", file=sys.stderr)
                
        except requests.exceptions.RequestException as e:
            print(f"네이버 API 요청 실패: {str(e)}", file=sys.stderr)
            continue
        
        # 목표 수량에 도달하면 종료
        if len(all_results) >= display:
            break
    
    return all_results[:display]

def extract_text_from_html(html_content):
    """
    Extract plain text from HTML content
    
    Args:
        html_content: HTML string
        
    Returns:
        Plain text string
    """
    import re
    
    if not html_content:
        return ""
    
    # Remove HTML tags including <b>, <i>, <strong>, etc.
    clean_text = re.sub(r'<[^>]+>', '', html_content)
    
    # Decode HTML entities
    clean_text = clean_text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    clean_text = clean_text.replace('&quot;', '"').replace('&#39;', "'")
    clean_text = clean_text.replace('&nbsp;', ' ').replace('&hellip;', '...')
    
    # Remove extra whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text

def strip_html(html_content):
    """
    Strip HTML tags from content
    
    Args:
        html_content: HTML string
        
    Returns:
        Plain text string
    """
    import re
    
    if not html_content:
        return ""
    
    # Remove HTML tags including <b>, <i>, <strong>, etc.
    clean_text = re.sub(r'<[^>]+>', '', html_content)
    
    # Decode HTML entities
    clean_text = clean_text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    clean_text = clean_text.replace('&quot;', '"').replace('&#39;', "'")
    clean_text = clean_text.replace('&nbsp;', ' ').replace('&hellip;', '...')
    
    # Remove extra whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text

def is_likely_user_review(item, service_keywords):
    """
    Check if the search result item is likely a genuine user review
    
    Args:
        item: Search result item from Naver API
        service_keywords: List of service-related keywords
        
    Returns:
        Boolean indicating if this is likely a user review
    """
    # HTML 제거
    title = strip_html(item.get("title", "")).lower()
    desc = strip_html(item.get("description", "")).lower()
    text = title + " " + desc

    # 1. 키워드 포함 문장
    review_signals = ["후기", "리뷰", "사용기", "써봤어요", "추천", "단점", "장점", "불편", "좋았던 점"]
    if not any(kw in text for kw in review_signals):
        return False

    # 2. 기사/브랜드 중심 키워드 반복 → 제외
    if text.count("press") > 0 or text.count("보도자료") > 0:
        return False

    # 3. 길이 제한 (너무 짧으면 제외)
    if len(text) < 30:
        return False

    # 4. 서비스 키워드가 포함된 고객 언어로 쓰였는지 확인 (보완)
    if not any(sk.lower() in text for sk in service_keywords):
        return False

    return True