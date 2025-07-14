#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
네이버 API 날짜 필드 정확성 테스트
"""

from naver_api import search_naver
import json
from datetime import datetime

def test_naver_date_parsing():
    """네이버 API 날짜 파싱 테스트"""
    
    print("=== 네이버 블로그 날짜 테스트 ===")
    blog_results = search_naver('익시오', 'blog', 5)
    
    for i, result in enumerate(blog_results):
        title = result.get('title', '').replace('<b>', '').replace('</b>', '')
        postdate = result.get('postdate', '')
        link = result.get('link', '')
        
        print(f"블로그 {i+1}:")
        print(f"  제목: {title}")
        print(f"  원본 날짜: {postdate}")
        
        if postdate and len(postdate) == 8 and postdate.isdigit():
            try:
                parsed_date = datetime.strptime(postdate, "%Y%m%d")
                print(f"  파싱된 날짜: {parsed_date}")
                print(f"  ISO 형식: {parsed_date.isoformat()}Z")
            except Exception as e:
                print(f"  날짜 파싱 실패: {e}")
        else:
            print(f"  날짜 파싱 불가: 형식 오류")
        print(f"  링크: {link}")
        print()
    
    print("\n=== 네이버 카페 날짜 테스트 ===")
    cafe_results = search_naver('익시오', 'cafe', 5)
    
    for i, result in enumerate(cafe_results):
        title = result.get('title', '').replace('<b>', '').replace('</b>', '')
        postdate = result.get('postdate', '')
        link = result.get('link', '')
        
        print(f"카페 {i+1}:")
        print(f"  제목: {title}")
        print(f"  원본 날짜: {postdate}")
        
        if postdate and len(postdate) == 8 and postdate.isdigit():
            try:
                parsed_date = datetime.strptime(postdate, "%Y%m%d")
                print(f"  파싱된 날짜: {parsed_date}")
                print(f"  ISO 형식: {parsed_date.isoformat()}Z")
            except Exception as e:
                print(f"  날짜 파싱 실패: {e}")
        else:
            print(f"  날짜 파싱 불가: API에서 날짜 미제공")
        print(f"  링크: {link}")
        print()

if __name__ == "__main__":
    test_naver_date_parsing()