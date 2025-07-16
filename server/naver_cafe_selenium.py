"""
네이버 카페 Selenium 기반 날짜 필터링 스크래핑
사용자가 제공한 날짜 기반 필터링 코드를 활용한 실제 카페 글 수집
"""

import sys
import datetime
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import requests
from urllib.parse import urljoin, urlparse
import json

def create_chrome_driver():
    """Chrome 드라이버 설정"""
    options = Options()
    options.add_argument("--headless")  # UI 없이 실행
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    
    # 이미지 로딩 비활성화로 속도 향상
    prefs = {"profile.managed_default_content_settings.images": 2}
    options.add_experimental_option("prefs", prefs)
    
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.service import Service
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        return driver
    except Exception as e:
        print(f"Chrome 드라이버 생성 실패: {e}")
        # 기본 드라이버 시도
        try:
            driver = webdriver.Chrome(options=options)
            return driver
        except Exception as e2:
            print(f"기본 Chrome 드라이버도 실패: {e2}")
            return None

def scrape_naver_cafe_with_date_filter(keyword, start_date, end_date, max_results=50):
    """
    네이버 카페에서 날짜 필터링된 글 수집
    
    Args:
        keyword: 검색 키워드
        start_date: 시작 날짜 (YYYY-MM-DD)
        end_date: 종료 날짜 (YYYY-MM-DD)
        max_results: 최대 결과 수
        
    Returns:
        List of cafe posts with date filtering
    """
    driver = create_chrome_driver()
    if not driver:
        return []
        
    try:
        # 날짜 파싱
        if isinstance(start_date, str):
            TARGET_START = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        else:
            TARGET_START = start_date
            
        if isinstance(end_date, str):
            TARGET_END = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        else:
            TARGET_END = end_date
            
        print(f"네이버 카페 날짜 필터링 수집: {TARGET_START} ~ {TARGET_END}")
        
        results = []
        
        # 네이버 카페 검색 URL
        search_url = f"https://search.naver.com/search.naver?where=article&query={keyword}&sm=tab_jum&start=1"
        
        driver.get(search_url)
        time.sleep(2)
        
        # 검색 결과 처리
        page = 1
        while len(results) < max_results and page <= 5:  # 최대 5페이지
            try:
                # 검색 결과 항목들 찾기
                search_items = driver.find_elements(By.CSS_SELECTOR, "div.bx")
                
                for item in search_items:
                    if len(results) >= max_results:
                        break
                        
                    try:
                        # 제목과 링크 추출
                        title_element = item.find_element(By.CSS_SELECTOR, "h2.title a")
                        title = title_element.text.strip()
                        link = title_element.get_attribute("href")
                        
                        # 카페 관련 정보 추출
                        cafe_info = item.find_element(By.CSS_SELECTOR, "a.sub_txt")
                        cafe_name = cafe_info.text.strip()
                        
                        # 날짜 정보 추출
                        date_element = item.find_element(By.CSS_SELECTOR, "span.sub_time")
                        date_text = date_element.text.strip()
                        
                        # 날짜 파싱
                        post_date = parse_naver_date(date_text)
                        
                        # 날짜 필터링 적용
                        if post_date and TARGET_START <= post_date <= TARGET_END:
                            # 본문 내용 추출 (요약)
                            try:
                                content_element = item.find_element(By.CSS_SELECTOR, "div.total_wrap")
                                content = content_element.text.strip()
                            except:
                                content = title  # 본문을 찾을 수 없으면 제목 사용
                            
                            # 사용자 ID 추출
                            user_id = extract_user_id_from_cafe_link(link)
                            
                            cafe_post = {
                                "userId": user_id,
                                "source": "naver_cafe",
                                "serviceId": "ixio",
                                "appId": f"cafe_{cafe_name}",
                                "rating": 5,  # 카페 글 기본 평점
                                "content": f"{title} {content}".strip(),
                                "createdAt": post_date.isoformat() + "Z",
                                "link": link,
                                "platform": "naver_cafe"
                            }
                            
                            results.append(cafe_post)
                            print(f"  Added cafe post: {title[:50]}... ({post_date})")
                        
                        elif post_date:
                            print(f"  Skipped post outside date range: {post_date}")
                            
                    except Exception as e:
                        print(f"  Error processing search item: {e}")
                        continue
                
                # 다음 페이지로 이동
                page += 1
                next_page_url = f"https://search.naver.com/search.naver?where=article&query={keyword}&sm=tab_jum&start={((page-1)*10)+1}"
                driver.get(next_page_url)
                time.sleep(2)
                
            except Exception as e:
                print(f"페이지 {page} 처리 중 오류: {e}")
                break
                
        print(f"네이버 카페 수집 완료: {len(results)}개")
        return results
        
    except Exception as e:
        print(f"네이버 카페 스크래핑 오류: {e}")
        return []
    finally:
        driver.quit()

def parse_naver_date(date_text):
    """네이버 날짜 텍스트를 datetime.date 객체로 변환"""
    try:
        # 다양한 날짜 형식 처리
        if "분 전" in date_text or "시간 전" in date_text:
            return datetime.date.today()
        elif "일 전" in date_text:
            days_ago = int(re.search(r'(\d+)일 전', date_text).group(1))
            return datetime.date.today() - datetime.timedelta(days=days_ago)
        elif "." in date_text:
            # YYYY.MM.DD 형식
            date_match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_text)
            if date_match:
                year, month, day = date_match.groups()
                return datetime.date(int(year), int(month), int(day))
        elif "/" in date_text:
            # MM/DD 형식 (현재 년도 가정)
            date_match = re.search(r'(\d{1,2})/(\d{1,2})', date_text)
            if date_match:
                month, day = date_match.groups()
                return datetime.date(datetime.date.today().year, int(month), int(day))
                
        return None
    except Exception as e:
        print(f"날짜 파싱 오류: {date_text} - {e}")
        return None

def extract_user_id_from_cafe_link(link):
    """카페 링크에서 사용자 ID 추출"""
    try:
        if "cafe.naver.com" in link:
            # 카페 이름 추출
            cafe_match = re.search(r'cafe\.naver\.com/([^/]+)', link)
            if cafe_match:
                return f"카페_{cafe_match.group(1)}"
        return "Unknown"
    except Exception as e:
        print(f"사용자 ID 추출 오류: {e}")
        return "Unknown"

def test_cafe_scraping():
    """테스트 함수"""
    start_date = "2025-06-30"
    end_date = "2025-06-30"
    
    results = scrape_naver_cafe_with_date_filter("익시오", start_date, end_date, max_results=10)
    
    print(f"\n=== 테스트 결과 ===")
    print(f"수집된 카페 글: {len(results)}개")
    
    for i, post in enumerate(results, 1):
        print(f"{i}. {post['userId']} - {post['content'][:50]}...")
        print(f"   날짜: {post['createdAt']}")
        print(f"   링크: {post['link']}")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        start_input = sys.argv[1]  # 예: 2025-07-01
        end_input = sys.argv[2]    # 예: 2025-07-10
        keyword = sys.argv[3] if len(sys.argv) > 3 else "익시오"
        
        results = scrape_naver_cafe_with_date_filter(keyword, start_input, end_input)
        
        # JSON 출력
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        test_cafe_scraping()