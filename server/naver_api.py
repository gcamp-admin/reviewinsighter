#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Naver API Integration for Blog and Cafe Search
"""

import requests
import urllib.parse
import sys
import re

import os
NAVER_CLIENT_ID = os.environ.get('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.environ.get('NAVER_CLIENT_SECRET')

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
        # display 값 범위 제한 (1-100)
        safe_display = min(max(1, display), 100)
        url = f"{base_url}?query={query}&display={safe_display}&sort=date"  # 최신순 정렬 추가

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
    try:
        # HTML 제거
        title = strip_html(item.get("title", "")).lower()
        desc = strip_html(item.get("description", "")).lower()
        text = title + " " + desc

        # 1. 강화된 뉴스기사 및 정보성 글 제외
        exclusion_keywords = [
            "뉴스", "기사", "보도", "보도자료", "press", "언론", "미디어", 
            "기자", "취재", "신문", "방송", "뉴스룸", "보도국", "편집부", "news",
            "관련 기사", "속보", "단독", "특보", "일보", "타임즈", "헤럴드",
            # 서평/도서 관련 (네이버 카페에서 흔함)
            "서평", "도서", "책", "독서", "독후감", "리뷰 이벤트", "서평단",
            # 배경화면/테마 관련
            "배경화면", "테마", "다운로드", "라이브 배경화면", "플라밍고",
            # 일반적인 정보성 포스트
            "정보", "소식", "업데이트", "버전", "기능", "특징", "서비스 소개",
            "스펙", "사양", "가격", "요금", "플랜", "구독", "설치", "출시",
            # 홍보/마케팅
            "이벤트", "프로모션", "광고", "홍보", "마케팅", "런칭", "공식",
            "캠페인", "안내", "알림", "공지", "발표"
        ]
        
        if any(keyword in text for keyword in exclusion_keywords):
            return False

        # 2. 서비스 키워드 포함 확인
        if not any(sk.lower() in text for sk in service_keywords):
            return False

        # 3. 강화된 리뷰 지표 확인
        review_indicators = [
            # 사용 경험 관련
            "사용해보니", "써보니", "체험해보니", "테스트해보니", "사용기", "체험기", "사용후기",
            # 평가 관련
            "후기", "리뷰", "평가", "평점", "별점", "만족", "불만족", "만족도",
            # 추천/비추천
            "추천", "비추천", "권장", "비권장", "좋아요", "싫어요", "괜찮아요",
            # 장단점
            "장점", "단점", "아쉬운", "좋은점", "나쁜점", "문제점", "개선점",
            # 감정적 반응
            "편리", "불편", "유용", "도움", "짜증", "답답", "만족스럽", "실망",
            # 구체적인 사용 상황
            "통화", "전화", "녹음", "음성", "보이스피싱", "비서",
            # 일반적인 사용자 리뷰 표현
            "정말", "너무", "완전", "진짜", "솔직히", "개인적으로"
        ]
        
        if not any(indicator in text for indicator in review_indicators):
            return False

        # 4. 길이 제한 (너무 짧으면 제외)
        if len(text) < 30:
            return False

        return True
        
    except Exception as e:
        print(f"Error in review filtering: {e}")
        return False