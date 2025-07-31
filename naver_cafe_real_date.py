"""
네이버 카페 실제 날짜 추출 시스템
HTTP 요청과 HTML 파싱을 통해 실제 작성일 추출
"""

import requests
import re
from datetime import datetime, date
from bs4 import BeautifulSoup
import time

def extract_real_cafe_date(cafe_url, timeout=5):
    """
    네이버 카페 URL에서 실제 작성일 추출
    
    Args:
        cafe_url: 카페 글 URL
        timeout: 요청 타임아웃 (초)
        
    Returns:
        datetime.date 객체 또는 None
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # HTTP 요청
        response = requests.get(cafe_url, headers=headers, timeout=timeout)
        response.raise_for_status()
        
        # HTML 파싱
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 날짜 패턴 검색 (다양한 형태의 날짜 형식 지원)
        date_patterns = [
            r'(\d{4})\.(\d{1,2})\.(\d{1,2})',  # 2025.07.16
            r'(\d{4})-(\d{1,2})-(\d{1,2})',   # 2025-07-16
            r'(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일',  # 2025년 7월 16일
            r'(\d{2})\.(\d{1,2})\.(\d{1,2})',  # 25.07.16
        ]
        
        # HTML 텍스트에서 날짜 검색
        html_text = soup.get_text()
        
        for pattern in date_patterns:
            matches = re.findall(pattern, html_text)
            if matches:
                for match in matches:
                    try:
                        if len(match[0]) == 2:  # 2자리 연도
                            year = 2000 + int(match[0])
                        else:
                            year = int(match[0])
                        
                        month = int(match[1])
                        day = int(match[2])
                        
                        # 유효한 날짜인지 확인
                        if 1 <= month <= 12 and 1 <= day <= 31:
                            post_date = date(year, month, day)
                            
                            # 2020년 이후 날짜만 유효하다고 가정
                            if post_date.year >= 2020:
                                print(f"  Real date extracted: {post_date}")
                                return post_date
                                
                    except (ValueError, TypeError):
                        continue
        
        # 메타 태그에서 날짜 검색
        meta_tags = soup.find_all('meta')
        for tag in meta_tags:
            if tag.get('property') == 'article:published_time' or tag.get('name') == 'date':
                date_str = tag.get('content', '')
                if date_str:
                    try:
                        # ISO 형식 날짜 파싱
                        parsed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        return parsed_date.date()
                    except:
                        continue
        
        print(f"  No date found in HTML content")
        return None
        
    except Exception as e:
        print(f"  Error extracting date from {cafe_url}: {e}")
        return None

def filter_cafe_by_real_date(cafe_results, start_date, end_date, max_results=50):
    """
    실제 날짜 추출을 통한 네이버 카페 필터링
    
    Args:
        cafe_results: 네이버 API 결과 리스트
        start_date: 시작 날짜 (datetime.date)
        end_date: 종료 날짜 (datetime.date)
        max_results: 최대 결과 수
        
    Returns:
        필터링된 카페 리뷰 리스트
    """
    filtered_results = []
    processed_count = 0
    
    for cafe in cafe_results:
        if len(filtered_results) >= max_results or processed_count >= 30:  # 최대 30개까지 확인
            break
            
        processed_count += 1
        
        try:
            link = cafe.get("link", "")
            if not link:
                continue
                
            print(f"  Extracting real date from: {link[:50]}...")
            
            # 실제 날짜 추출
            real_date = extract_real_cafe_date(link)
            
            if real_date and start_date <= real_date <= end_date:
                # 뉴스기사 필터링
                title = cafe.get("title", "")
                description = cafe.get("description", "")
                text_content = (title + " " + description).lower()
                
                news_indicators = [
                    "뉴스", "기사", "보도", "보도자료", "press", "뉴스기사", "언론", "미디어", 
                    "기자", "취재", "신문", "방송", "뉴스룸", "보도국", "편집부", "news",
                    "관련 기사", "속보", "단독", "특보", "일보", "타임즈", "헤럴드"
                ]
                
                if any(indicator in text_content for indicator in news_indicators):
                    print(f"  Skipping news article: {title[:50]}...")
                    continue
                
                # HTML 태그 제거 및 엔티티 디코딩
                import re
                clean_title = re.sub(r'<[^>]+>', '', title)
                clean_description = re.sub(r'<[^>]+>', '', description)
                
                clean_title = clean_title.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
                clean_title = clean_title.replace('&quot;', '"').replace('&#39;', "'")
                clean_description = clean_description.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
                clean_description = clean_description.replace('&quot;', '"').replace('&#39;', "'")
                
                # 사용자 ID 추출
                user_id = cafe.get("extracted_user_id") or f"카페_{cafe.get('cafename', 'unknown')}"
                
                cafe_review = {
                    "userId": user_id,
                    "source": "naver_cafe",
                    "serviceId": "ixio",
                    "appId": f"cafe_{cafe.get('cafename', 'unknown')}",
                    "rating": 5,  # 카페 글 기본 평점
                    "content": f"{clean_title} {clean_description}".strip(),
                    "createdAt": real_date.isoformat() + "Z",
                    "link": link,
                    "platform": "naver_cafe"
                }
                
                filtered_results.append(cafe_review)
                print(f"  Added cafe review with real date: {clean_title[:50]}... ({real_date})")
                
            elif real_date:
                print(f"  Skipping cafe post outside date range: {real_date} (not in {start_date} to {end_date})")
            
            # 요청 간 딜레이 (서버 부하 방지)
            time.sleep(0.5)
                
        except Exception as e:
            print(f"  Error processing cafe post: {e}")
            continue
    
    return filtered_results

def test_real_date_extraction():
    """테스트 함수"""
    test_urls = [
        "http://cafe.naver.com/appleiphone/8813704",
        "http://cafe.naver.com/busanjungonara/5839305"
    ]
    
    for url in test_urls:
        print(f"Testing: {url}")
        real_date = extract_real_cafe_date(url)
        print(f"Real date: {real_date}")
        print()

if __name__ == "__main__":
    test_real_date_extraction()