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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(cafe_url, headers=headers, timeout=10)
        if response.status_code != 200:
            return None
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 네이버 카페 날짜 패턴들 시도
        date_patterns = [
            # 패턴 1: 작성일 텍스트 찾기
            r'작성일\s*:\s*(\d{4}\.\d{2}\.\d{2})',
            r'(\d{4}\.\d{2}\.\d{2})\s*\d{2}:\d{2}',
            # 패턴 2: ISO 형식
            r'(\d{4}-\d{2}-\d{2})',
            # 패턴 3: 년.월.일 형식
            r'(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)',
        ]
        
        # HTML 텍스트에서 날짜 추출
        html_text = soup.get_text()
        
        for pattern in date_patterns:
            matches = re.findall(pattern, html_text)
            if matches:
                date_str = matches[0]
                try:
                    # 다양한 형식 파싱
                    if '.' in date_str:
                        return datetime.strptime(date_str, '%Y.%m.%d')
                    elif '-' in date_str:
                        return datetime.strptime(date_str, '%Y-%m-%d')
                    elif '년' in date_str:
                        # 년월일 형식 처리
                        date_str = re.sub(r'[년월일\s]', '', date_str)
                        if len(date_str) == 8:
                            return datetime.strptime(date_str, '%Y%m%d')
                except ValueError:
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