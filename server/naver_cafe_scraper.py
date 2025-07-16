#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
네이버 카페 실제 작성일 스크래핑
"""

import requests
import re
from datetime import datetime
from bs4 import BeautifulSoup
import time

def extract_cafe_post_date(cafe_url):
    """
    네이버 카페 글의 실제 작성일을 스크래핑
    
    Args:
        cafe_url: 카페 글 URL
        
    Returns:
        datetime object or None
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        # 세션 사용으로 쿠키 유지
        session = requests.Session()
        session.headers.update(headers)
        
        print(f"카페 URL 접근 시도: {cafe_url}")
        response = session.get(cafe_url, timeout=5)
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code != 200:
            print(f"HTTP 오류: {response.status_code}")
            return None
            
        # 응답 내용 확인
        content = response.text
        print(f"응답 내용 길이: {len(content)} characters")
        
        # BeautifulSoup 파싱
        soup = BeautifulSoup(content, 'html.parser')
        
        # URL에서 직접 날짜 추출 시도 (URL에 날짜가 포함된 경우)
        url_date_match = re.search(r'/(\d{4})(\d{2})(\d{2})', cafe_url)
        if url_date_match:
            year, month, day = url_date_match.groups()
            try:
                return datetime(int(year), int(month), int(day))
            except ValueError:
                pass
        
        # 네이버 카페 실제 글 작성일 패턴들 (우선순위 순서로 배치)
        date_patterns = [
            # 패턴 1: 상대적 날짜 (가장 최근 글)
            r'(\d{1,2})시간\s*전',
            r'(\d{1,2})분\s*전',
            r'어제\s*\d{1,2}:\d{2}',
            r'오늘\s*\d{1,2}:\d{2}',
            # 패턴 2: 최근 날짜 (2020년 이후)
            r'작성일\s*:?\s*(202[0-9])[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})[일]?',
            r'등록일\s*:?\s*(202[0-9])[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})[일]?',
            r'(202[0-9])[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})[일]?\s*\d{1,2}:\d{2}',
            # 패턴 3: 일반적인 최근 날짜
            r'(202[0-9])[.\-/](\d{1,2})[.\-/](\d{1,2})',
            r'(202[0-9])년\s*(\d{1,2})월\s*(\d{1,2})일',
            # 패턴 4: 2010년대 날짜
            r'작성일\s*:?\s*(201[0-9])[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})[일]?',
            r'(201[0-9])[.\-/](\d{1,2})[.\-/](\d{1,2})',
        ]
        
        # HTML 텍스트에서 날짜 추출 (처음 5000자만 사용)
        html_text = soup.get_text()[:5000]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, html_text)
            if matches:
                print(f"패턴 매치: {pattern} -> {matches[:3]}")  # 처음 3개만 출력
                for match in matches[:3]:  # 처음 3개만 시도
                    try:
                        if isinstance(match, tuple) and len(match) == 3:
                            year, month, day = match
                            # 최신 날짜 우선 (2020년 이후만)
                            if int(year) >= 2020:
                                return datetime(int(year), int(month), int(day))
                        elif '시간' in str(match):
                            # 상대적 시간 처리
                            hours = int(re.search(r'(\d+)', str(match)).group(1))
                            return datetime.now() - timedelta(hours=hours)
                        elif '분' in str(match):
                            # 상대적 분 처리
                            minutes = int(re.search(r'(\d+)', str(match)).group(1))
                            return datetime.now() - timedelta(minutes=minutes)
                        elif '어제' in str(match):
                            return datetime.now() - timedelta(days=1)
                        elif '오늘' in str(match):
                            return datetime.now()
                    except (ValueError, AttributeError):
                        continue
        
        # 메타 데이터에서 날짜 추출 시도
        meta_date = soup.find('meta', {'property': 'article:published_time'})
        if meta_date:
            date_str = meta_date.get('content')
            if date_str:
                try:
                    return datetime.fromisoformat(date_str.replace('Z', '+00:00')).replace(tzinfo=None)
                except ValueError:
                    pass
        
        return None
        
    except Exception as e:
        print(f"카페 날짜 추출 오류: {str(e)}")
        return None

def test_cafe_date_extraction():
    """카페 날짜 추출 테스트"""
    from naver_api import search_naver
    
    print("=== 네이버 카페 실제 날짜 추출 테스트 ===")
    cafe_results = search_naver('익시오', 'cafe', 3)
    
    for i, result in enumerate(cafe_results):
        title = result.get('title', '').replace('<b>', '').replace('</b>', '')
        link = result.get('link', '')
        
        print(f"카페 {i+1}:")
        print(f"  제목: {title}")
        print(f"  링크: {link}")
        
        # 실제 작성일 추출
        actual_date = extract_cafe_post_date(link)
        if actual_date:
            print(f"  실제 작성일: {actual_date}")
            print(f"  ISO 형식: {actual_date.isoformat()}Z")
        else:
            print(f"  실제 작성일: 추출 실패")
        print()
        
        # 과도한 요청 방지
        time.sleep(1)

if __name__ == "__main__":
    test_cafe_date_extraction()