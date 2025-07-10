#!/usr/bin/env python3
"""
Google Play Store Review Scraper for 우리가게 패키지
"""

import json
import sys
import requests
from datetime import datetime
from google_play_scraper import Sort, reviews
import pandas as pd
import xml.etree.ElementTree as ET

def scrape_google_play_reviews(app_id='com.lguplus.sohoapp', count=100, lang='ko', country='kr'):
    """
    Scrape reviews from Google Play Store
    
    Args:
        app_id: Google Play Store app ID
        count: Number of reviews to fetch
        lang: Language code (default: 'ko')
        country: Country code (default: 'kr')
        
    Returns:
        List of review dictionaries
    """
    try:
        # Fetch reviews from Google Play Store
        result, _ = reviews(
            app_id,
            lang=lang,
            country=country,
            sort=Sort.NEWEST,
            count=count
        )
        
        # Process and clean the data
        processed_reviews = []
        for review in result:
            # Simple sentiment analysis based on score
            sentiment = "positive" if review['score'] >= 4 else "negative"
            
            processed_review = {
                'userId': review['userName'] if review['userName'] else '익명',
                'source': 'google_play',
                'rating': review['score'],
                'content': review['content'],
                'sentiment': sentiment,
                'createdAt': review['at'].isoformat() if review['at'] else datetime.now().isoformat()
            }
            processed_reviews.append(processed_review)
        
        return processed_reviews
        
    except Exception as e:
        print(f"Error scraping Google Play reviews: {str(e)}", file=sys.stderr)
        return []

def scrape_app_store_reviews(app_id='1571096278', count=100):
    """
    Scrape reviews from Apple App Store
    
    Args:
        app_id: Apple App Store app ID
        count: Number of reviews to fetch (limited by RSS feed)
        
    Returns:
        List of review dictionaries
    """
    try:
        # Construct RSS URL for App Store reviews
        rss_url = f'https://itunes.apple.com/kr/rss/customerreviews/id={app_id}/sortBy=mostRecent/xml'
        
        response = requests.get(rss_url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch App Store reviews: HTTP {response.status_code}", file=sys.stderr)
            return []
        
        root = ET.fromstring(response.content)
        
        # Process reviews (skip first entry which is just metadata)
        processed_reviews = []
        entries = root.findall('.//{http://www.w3.org/2005/Atom}entry')[1:]
        
        for entry in entries[:count]:  # Limit to requested count
            try:
                # Extract review data
                author_elem = entry.find('{http://www.w3.org/2005/Atom}author')
                author = author_elem[0].text if author_elem is not None and len(author_elem) > 0 else '익명'
                
                title_elem = entry.find('{http://www.w3.org/2005/Atom}title')
                title = title_elem.text if title_elem is not None else ''
                
                content_elem = entry.find('{http://www.w3.org/2005/Atom}content')
                content = content_elem.text if content_elem is not None else title  # Use title if no content
                
                rating_elem = entry.find('{http://itunes.apple.com/rss}rating')
                rating = int(rating_elem.text) if rating_elem is not None else 3
                
                updated_elem = entry.find('{http://www.w3.org/2005/Atom}updated')
                created_at = updated_elem.text if updated_elem is not None else datetime.now().isoformat()
                
                # Simple sentiment analysis based on rating
                sentiment = "positive" if rating >= 4 else "negative"
                
                processed_review = {
                    'userId': author,
                    'source': 'app_store',
                    'rating': rating,
                    'content': content,
                    'sentiment': sentiment,
                    'createdAt': created_at
                }
                processed_reviews.append(processed_review)
                
            except Exception as entry_error:
                print(f"Error processing App Store review entry: {entry_error}", file=sys.stderr)
                continue
        
        return processed_reviews
        
    except Exception as e:
        print(f"Error scraping App Store reviews: {str(e)}", file=sys.stderr)
        return []

def scrape_reviews(app_id_google='com.lguplus.sohoapp', app_id_apple='1571096278', count=100, sources=['google_play']):
    """
    Scrape reviews from multiple sources
    
    Args:
        app_id_google: Google Play Store app ID
        app_id_apple: Apple App Store app ID
        count: Number of reviews to fetch per source
        sources: List of sources to scrape from
        
    Returns:
        List of review dictionaries
    """
    all_reviews = []
    
    if 'google_play' in sources:
        google_reviews = scrape_google_play_reviews(app_id_google, count)
        all_reviews.extend(google_reviews)
        print(f"Collected {len(google_reviews)} reviews from Google Play", file=sys.stderr)
    
    if 'app_store' in sources:
        apple_reviews = scrape_app_store_reviews(app_id_apple, count)
        all_reviews.extend(apple_reviews)
        print(f"Collected {len(apple_reviews)} reviews from App Store", file=sys.stderr)
    
    return all_reviews

def analyze_sentiments(reviews):
    """
    Enhanced HEART framework analysis with dynamic insights generation
    
    Args:
        reviews: List of review dictionaries
        
    Returns:
        Dictionary with insights and word frequency data
    """
    if not reviews:
        return {'insights': [], 'wordCloud': {'positive': [], 'negative': []}}
    
    print(f"Starting enhanced HEART analysis on {len(reviews)} reviews...", file=sys.stderr)
    
    # Debug: Print review ratings
    ratings = [review.get('rating', 3) for review in reviews]
    print(f"Review ratings: {ratings}", file=sys.stderr)
    negative_count = sum(1 for r in ratings if r < 4)
    positive_count = sum(1 for r in ratings if r >= 4)
    print(f"Negative reviews: {negative_count}, Positive reviews: {positive_count}", file=sys.stderr)
    
    # HEART framework analysis with detailed issue tracking
    heart_analysis = {
        'task_success': {'issues': [], 'details': []},
        'happiness': {'issues': [], 'details': []},
        'engagement': {'issues': [], 'details': []},
        'adoption': {'issues': [], 'details': []},
        'retention': {'issues': [], 'details': []}
    }
    
    # Pattern matching for specific issues
    for review in reviews:
        content = review['content'].lower()
        rating = review.get('rating', 3)
        user_id = review.get('userId', 'Unknown')
        
        # Analyze ALL reviews regardless of rating to capture nuanced feedback
        # Even high-rated reviews can contain specific complaints and improvement suggestions
        
        # Task Success - Core functionality problems (check regardless of rating)
        if any(keyword in content for keyword in ['오류', '에러', '버그', '튕', '꺼짐', '작동안함', '실행안됨', '끊김', '연결안됨', '안들림', '소리안남', '안됨', '안되', '크래시', '종료', '재시작', '문제', '불편', '안받아지', '받아지지', '실행되지', '작동하지', '끊어지', '끊긴다', '당황스러운', '기다려야', '슬라이드', '백그라운드', '자동으로', '넘어가지', '계속', '볼륨버튼', '진동', '꺼지면', '좋겠네요', '차량', '블투', '통화종료', '음악재생', '스팸정보', '딸려와서', '번호확인', '기다려야']):
            heart_analysis['task_success']['issues'].append(content)
            if '튕' in content or '꺼짐' in content or '크래시' in content:
                heart_analysis['task_success']['details'].append('앱 크래시')
            elif '연결' in content and ('안됨' in content or '끊김' in content):
                heart_analysis['task_success']['details'].append('네트워크 연결')
            elif '소리' in content and '안남' in content:
                heart_analysis['task_success']['details'].append('음성 기능')
            elif '볼륨버튼' in content or '진동' in content:
                heart_analysis['task_success']['details'].append('하드웨어 제어')
            elif '백그라운드' in content or '자동으로' in content:
                heart_analysis['task_success']['details'].append('백그라운드 처리')
            elif '스팸정보' in content or '슬라이드' in content:
                heart_analysis['task_success']['details'].append('UI 표시 문제')
            elif '통화' in content or '전화' in content:
                heart_analysis['task_success']['details'].append('통화 기능')
            else:
                heart_analysis['task_success']['details'].append('기능 오류')
        
        # Happiness - User satisfaction issues (check regardless of rating)
        elif any(keyword in content for keyword in ['짜증', '최악', '실망', '화남', '불만', '별로', '구림', '싫어', '답답', '스트레스', '당황스러운', '불편', '기다려야', '문제']):
            heart_analysis['happiness']['issues'].append(content)
            if '최악' in content or '화남' in content:
                heart_analysis['happiness']['details'].append('강한 불만')
            elif '당황스러운' in content or '불편' in content:
                heart_analysis['happiness']['details'].append('사용자 경험 저하')
            else:
                heart_analysis['happiness']['details'].append('만족도 저하')
        
        # Engagement - Usage patterns (check regardless of rating)
        elif any(keyword in content for keyword in ['안써', '사용안함', '재미없', '지루', '흥미없', '별로안쓴', '가끔만', '좋지만', '하지만', '그런데', '다만', '아쉬운', '더', '추가', '개선', '향상', '좋겠네요']):
            heart_analysis['engagement']['issues'].append(content)
            if '좋지만' in content or '하지만' in content or '좋겠네요' in content:
                heart_analysis['engagement']['details'].append('개선 제안')
            else:
                heart_analysis['engagement']['details'].append('사용 빈도 저하')
        
        # Retention - Churn indicators (check regardless of rating)
        elif any(keyword in content for keyword in ['삭제', '해지', '그만', '안쓸', '다른거', '바꿀', '탈퇴', '포기', '중단']):
            heart_analysis['retention']['issues'].append(content)
            heart_analysis['retention']['details'].append('이탈 위험')
        
        # Adoption - Onboarding difficulties (check regardless of rating)
        elif any(keyword in content for keyword in ['어려움', '복잡', '모르겠', '헷갈', '어떻게', '설명부족', '사용법', '가이드', '도움말']):
            heart_analysis['adoption']['issues'].append(content)
            heart_analysis['adoption']['details'].append('사용성 문제')
    
    # Generate insights based on actual review content analysis
    insights = []
    insight_id = 1
    
    # Business impact weights
    impact_weights = {
        'task_success': 5,  # Critical - core functionality
        'retention': 4,     # High - user churn
        'happiness': 3,     # Medium - satisfaction
        'engagement': 2,    # Low-Medium - usage
        'adoption': 1       # Low - onboarding
    }
    
    # Debug: Print heart analysis results
    print(f"Heart analysis results:", file=sys.stderr)
    for category, data in heart_analysis.items():
        print(f"  {category}: {len(data['issues'])} issues", file=sys.stderr)
        if data['issues']:
            print(f"    First issue: {data['issues'][0][:50]}...", file=sys.stderr)
    
    for category, data in heart_analysis.items():
        if data['issues']:
            count = len(data['issues'])
            impact_score = count * impact_weights[category]
            
            # Priority calculation (more lenient thresholds)
            if impact_score >= 10 or (category == 'task_success' and count >= 2):
                priority = "critical"
                priority_emoji = "🔴"
            elif impact_score >= 4 or count >= 2:
                priority = "major"
                priority_emoji = "🟠"
            else:
                priority = "minor"
                priority_emoji = "🟢"
            
            # Analyze actual review content to identify specific problems and solutions
            actual_issues = []
            for issue_text in data['issues']:
                # Extract key phrases and issues from actual reviews
                if '크래시' in issue_text or '꺼져' in issue_text or '꺼지' in issue_text or '튕겨' in issue_text or '튕김' in issue_text or '나가버림' in issue_text:
                    actual_issues.append('앱 크래시/강제 종료')
                elif ('전화' in issue_text or '통화' in issue_text) and ('끊어' in issue_text or '받' in issue_text or '안됨' in issue_text or '끊김' in issue_text):
                    actual_issues.append('통화 기능 오류')
                elif '통화중대기' in issue_text or ('통화중' in issue_text and '대기' in issue_text):
                    actual_issues.append('통화중대기 기능 부재')
                elif '애플워치' in issue_text or ('워치' in issue_text and ('호환' in issue_text or '안됨' in issue_text or '안되' in issue_text)):
                    actual_issues.append('애플워치 호환성 문제')
                elif '블루투스' in issue_text or ('에어팟' in issue_text and ('이상한' in issue_text or '소리' in issue_text)):
                    actual_issues.append('블루투스/에어팟 호환성 문제')
                elif '통화연결음' in issue_text or ('연결음' in issue_text and '시끄러' in issue_text):
                    actual_issues.append('통화연결음 관련 문제')
                elif '업데이트' in issue_text and ('문제' in issue_text or '안됨' in issue_text or '왜' in issue_text):
                    actual_issues.append('업데이트 관련 문제')
                elif '알뜰폰' in issue_text or ('가입하고' in issue_text and '안된다' in issue_text):
                    actual_issues.append('알뜰폰 지원 문제')
                elif '031' in issue_text or '070' in issue_text or '050' in issue_text or ('전화해도' in issue_text and '기록' in issue_text and '안' in issue_text):
                    actual_issues.append('특정 번호 기록 누락 문제')
                elif '볼륨버튼' in issue_text or ('볼륨' in issue_text and '버튼' in issue_text and '진동' in issue_text):
                    actual_issues.append('볼륨버튼 진동 제어 문제')
                elif '백그라운드' in issue_text and ('계속' in issue_text or '실행' in issue_text) and ('음악' in issue_text or '재생' in issue_text):
                    actual_issues.append('백그라운드 앱 종료 문제')
                elif '스팸정보' in issue_text or ('스팸' in issue_text and '정보' in issue_text and '딸려와서' in issue_text):
                    actual_issues.append('스팸 정보 표시 문제')
                elif '슬라이드' in issue_text and ('번호확인' in issue_text or '기다려야' in issue_text):
                    actual_issues.append('UI 슬라이드 표시 문제')
                elif '당황스러운' in issue_text or ('당황' in issue_text and '경험' in issue_text):
                    actual_issues.append('사용자 경험 혼란')
                elif '차량' in issue_text and ('블투' in issue_text or '블루투스' in issue_text) and '통화종료' in issue_text:
                    actual_issues.append('차량 블루투스 연동 문제')
                elif '전화' in issue_text and ('안받아지' in issue_text or '받아지지' in issue_text or '잘안받아지' in issue_text):
                    actual_issues.append('전화 수신 불가 문제')
                elif '연락처' in issue_text and ('검색' in issue_text or '조회' in issue_text or '안보입니다' in issue_text or '못해요' in issue_text):
                    actual_issues.append('연락처 검색/조회 불가')
                elif '차단' in issue_text and ('자동' in issue_text or '가족' in issue_text or '해제' in issue_text):
                    actual_issues.append('자동 차단 오류')
                elif '전화' in issue_text and ('끊긴다' in issue_text or '끊김' in issue_text or '일림' in issue_text):
                    actual_issues.append('통화 끊김/알림 실패')
                elif '애플워치' in issue_text or ('워치' in issue_text and '호환' in issue_text):
                    actual_issues.append('애플워치 호환성 문제')
                elif '버벅' in issue_text or ('아이폰' in issue_text and '프로' in issue_text and '버벅' in issue_text):
                    actual_issues.append('성능 저하 (최신 기기)')
                elif '단축번호' in issue_text or ('단축' in issue_text and '설정' in issue_text):
                    actual_issues.append('단축번호 설정 오류')
                elif '로그인' in issue_text or '인증' in issue_text or '로그' in issue_text:
                    actual_issues.append('로그인/인증 문제')
                elif '느림' in issue_text or '지연' in issue_text:
                    actual_issues.append('성능 저하')
                elif '연결' in issue_text or '네트워크' in issue_text or '접속' in issue_text:
                    actual_issues.append('네트워크 연결 문제')
                elif '블루투스' in issue_text or '음질' in issue_text or '소리' in issue_text:
                    actual_issues.append('오디오 품질 문제')
                elif '업데이트' in issue_text or '개선' in issue_text:
                    actual_issues.append('업데이트 관련 문제')
                elif '기기' in issue_text or '폰' in issue_text or '호환' in issue_text:
                    actual_issues.append('기기 호환성 문제')
                elif '불편' in issue_text or '복잡' in issue_text or '어려움' in issue_text:
                    actual_issues.append('사용성 문제')
                elif '삭제' in issue_text or '해지' in issue_text or '그만' in issue_text:
                    actual_issues.append('서비스 중단 의도')
                elif '법인' in issue_text or '이용제한' in issue_text or '제한' in issue_text:
                    actual_issues.append('이용 제한 문제')
                elif '검색' in issue_text or '조회' in issue_text or '찾기' in issue_text:
                    actual_issues.append('검색/조회 기능 오류')
                else:
                    actual_issues.append('기타 문제')
            
            # Find most common actual issue
            if actual_issues:
                most_common_issue = max(set(actual_issues), key=actual_issues.count)
                issue_count = actual_issues.count(most_common_issue)
            else:
                most_common_issue = '기타 문제'
                issue_count = count
            
            # Generate specific problems and solutions based on actual review content
            if category == 'task_success':
                title = "Task Success: 핵심 기능 안정성"
                problem = f"{most_common_issue} {issue_count}건 발생"
                
                if most_common_issue == '앱 크래시/강제 종료':
                    solution = "크래시 로그 분석 및 메모리 누수 수정, 안정성 테스트 강화"
                elif most_common_issue == '통화 기능 오류':
                    solution = "통화 연결 로직 개선, 권한 관리 최적화, 통화 품질 테스트"
                elif most_common_issue == '통화중대기 기능 부재':
                    solution = "통화중대기 기능 개발, 콜센터 시스템 연동, 대기음 설정 기능 추가"
                elif most_common_issue == '애플워치 호환성 문제':
                    solution = "WatchOS 연동 API 업데이트, 워치 전용 UI/UX 개발, 거절/승인 버튼 추가"
                elif most_common_issue == '블루투스/에어팟 호환성 문제':
                    solution = "블루투스 오디오 코덱 최적화, 에어팟 프로필 지원 확대, 음성 라우팅 개선"
                elif most_common_issue == '통화연결음 관련 문제':
                    solution = "연결음 볼륨 조절 기능 추가, 사용자 맞춤 연결음 설정, 무음 모드 지원"
                elif most_common_issue == '알뜰폰 지원 문제':
                    solution = "알뜰폰 통신사 지원 확대, 인증 시스템 개선, 호환성 테스트 강화"
                elif most_common_issue == '특정 번호 기록 누락 문제':
                    solution = "통화 기록 DB 최적화, 모든 번호 형태 지원, 기록 누락 모니터링 시스템 구축"
                elif most_common_issue == '볼륨버튼 진동 제어 문제':
                    solution = "하드웨어 버튼 이벤트 처리 개선, 진동 제어 옵션 추가, 사용자 설정 기능 확대"
                elif most_common_issue == '백그라운드 앱 종료 문제':
                    solution = "통화 종료 시 백그라운드 앱 자동 종료 로직 추가, 오디오 세션 관리 개선"
                elif most_common_issue == '스팸 정보 표시 문제':
                    solution = "스팸 정보 표시 UI 개선, 슬라이드 애니메이션 속도 조절, 번호 우선 표시 옵션"
                elif most_common_issue == 'UI 슬라이드 표시 문제':
                    solution = "텍스트 슬라이드 속도 설정 기능, 정적 표시 모드 옵션, 사용자 맞춤 설정"
                elif most_common_issue == '사용자 경험 혼란':
                    solution = "직관적인 UI/UX 재설계, 사용자 가이드 개선, 예상치 못한 동작 방지"
                elif most_common_issue == '차량 블루투스 연동 문제':
                    solution = "차량 블루투스 프로파일 호환성 개선, 통화 종료 시 오디오 세션 정리 자동화"
                elif most_common_issue == '전화 수신 불가 문제':
                    solution = "전화 수신 알고리즘 개선, 네트워크 상태 체크 강화, 권한 관리 최적화"
                elif most_common_issue == '연락처 검색/조회 불가':
                    solution = "연락처 DB 인덱싱 재구축, 검색 알고리즘 최적화, 권한 관리 점검"
                elif most_common_issue == '자동 차단 오류':
                    solution = "차단 알고리즘 로직 수정, 가족/지인 번호 화이트리스트 기능 추가"
                elif most_common_issue == '통화 끊김/알림 실패':
                    solution = "통화 연결 안정성 강화, 푸시 알림 시스템 점검, 백그라운드 처리 개선"
                elif most_common_issue == '애플워치 호환성 문제':
                    solution = "WatchOS 연동 API 업데이트, 워치 전용 UI/UX 개발, 거절/승인 버튼 추가"
                elif most_common_issue == '성능 저하 (최신 기기)':
                    solution = "최신 iOS 최적화, 메모리 사용량 분석 및 개선, GPU 렌더링 최적화"
                elif most_common_issue == '단축번호 설정 오류':
                    solution = "단축번호 API 로직 재작성, 설정 저장/불러오기 기능 개선"
                elif most_common_issue == '로그인/인증 문제':
                    solution = "인증 서버 안정성 개선, 토큰 관리 시스템 점검"
                elif most_common_issue == '성능 저하':
                    solution = "UI 렌더링 최적화, 백그라운드 처리 개선"
                elif most_common_issue == '네트워크 연결 문제':
                    solution = "네트워크 재시도 로직 추가, 오프라인 모드 지원"
                elif most_common_issue == '오디오 품질 문제':
                    solution = "오디오 코덱 최적화, 블루투스 호환성 개선"
                elif most_common_issue == '검색/조회 기능 오류':
                    solution = "검색 인덱스 최적화, 조회 쿼리 성능 개선, 데이터 캐싱 강화"
                elif most_common_issue == '이용 제한 문제':
                    solution = "법인 사용자 정책 검토, 이용 제한 조건 완화, 사용자 권한 관리 개선"
                else:
                    solution = "핵심 기능 QA 테스트 강화, 버그 수정 프로세스 개선"
                    
            elif category == 'happiness':
                title = "Happiness: 사용자 만족도 개선"
                problem = f"{most_common_issue} {issue_count}건으로 인한 사용자 불만"
                
                if most_common_issue == '앱 크래시/강제 종료':
                    solution = "크래시 로그 분석 및 메모리 누수 수정, 안정성 테스트 강화"
                elif most_common_issue == '로그인/인증 문제':
                    solution = "인증 서버 안정성 개선, 토큰 관리 시스템 점검"
                elif most_common_issue == '애플워치 호환성 문제':
                    solution = "WatchOS 연동 API 업데이트, 워치 전용 UI/UX 개발, 거절/승인 버튼 추가"
                elif most_common_issue == '성능 저하 (최신 기기)':
                    solution = "최신 iOS 최적화, 메모리 사용량 분석 및 개선, GPU 렌더링 최적화"
                elif most_common_issue == '자동 차단 오류':
                    solution = "차단 알고리즘 로직 수정, 가족/지인 번호 화이트리스트 기능 추가"
                elif most_common_issue == '사용성 문제':
                    solution = "UI/UX 개선, 사용자 피드백 반영한 인터페이스 재설계"
                elif most_common_issue == '성능 저하':
                    solution = "앱 성능 최적화, 로딩 시간 단축, 반응성 개선"
                elif most_common_issue == '기기 호환성 문제':
                    solution = "다양한 기기 테스트 확대, 호환성 매트릭스 구축"
                else:
                    solution = "사용자 만족도 조사 실시, 주요 불만 사항 우선 해결"
                
            elif category == 'engagement':
                title = "Engagement: 사용자 참여도 증대"
                problem = f"{most_common_issue} {issue_count}건으로 인한 사용 빈도 저하"
                
                if most_common_issue == '업데이트 관련 문제':
                    solution = "정기적인 기능 업데이트, 사용자 요청 기능 우선 개발"
                elif most_common_issue == '사용성 문제':
                    solution = "핵심 기능 접근성 개선, 직관적인 네비게이션 제공"
                else:
                    solution = "사용자 참여를 높이는 새로운 기능 추가, 개인화 서비스 강화"
                
            elif category == 'retention':
                title = "Retention: 사용자 유지율 개선"
                problem = f"{most_common_issue} {issue_count}건으로 인한 이탈 위험"
                
                if most_common_issue == '서비스 중단 의도':
                    solution = "이탈 예방 프로그램 운영, 고객 서비스 강화, 핵심 가치 재강조"
                elif most_common_issue == '앱 크래시/강제 종료':
                    solution = "크래시 로그 분석 및 메모리 누수 수정, 안정성 테스트 강화"
                elif most_common_issue == '로그인/인증 문제':
                    solution = "인증 서버 안정성 개선, 토큰 관리 시스템 점검"
                elif most_common_issue == '연락처 검색/조회 불가':
                    solution = "연락처 DB 인덱싱 재구축, 검색 알고리즘 최적화, 권한 관리 점검"
                elif most_common_issue == '자동 차단 오류':
                    solution = "차단 알고리즘 로직 수정, 가족/지인 번호 화이트리스트 기능 추가"
                elif most_common_issue == '통화 끊김/알림 실패':
                    solution = "통화 연결 안정성 강화, 푸시 알림 시스템 점검, 백그라운드 처리 개선"
                elif most_common_issue == '애플워치 호환성 문제':
                    solution = "WatchOS 연동 API 업데이트, 워치 전용 UI/UX 개발, 거절/승인 버튼 추가"
                elif most_common_issue == '성능 저하 (최신 기기)':
                    solution = "최신 iOS 최적화, 메모리 사용량 분석 및 개선, GPU 렌더링 최적화"
                elif most_common_issue == '사용성 문제':
                    solution = "사용자 온보딩 개선, 지속적인 가치 제공 방안 마련"
                else:
                    solution = "사용자 유지율 분석, 맞춤형 리텐션 전략 수립"
                
            elif category == 'adoption':
                title = "Adoption: 신규 사용자 적응 지원"
                problem = f"{most_common_issue} {issue_count}건으로 인한 신규 사용자 적응 어려움"
                
                if most_common_issue == '앱 크래시/강제 종료':
                    solution = "크래시 로그 분석 및 메모리 누수 수정, 안정성 테스트 강화"
                elif most_common_issue == '로그인/인증 문제':
                    solution = "인증 서버 안정성 개선, 토큰 관리 시스템 점검"
                elif most_common_issue == '사용성 문제':
                    solution = "온보딩 프로세스 간소화, 단계별 가이드 제공, 튜토리얼 개선"
                elif most_common_issue == '기기 호환성 문제':
                    solution = "다양한 기기 지원 확대, 설치 가이드 개선"
                else:
                    solution = "신규 사용자 경험 최적화, 초기 사용 장벽 제거"
            
            # Generate realistic problem prediction and solution based on HEART category
            predicted_problem = ""
            realistic_solution = ""
            
            if category == 'task_success':
                if most_common_issue == '통화 기능 오류':
                    predicted_problem = "통화 연결 실패로 인한 핵심 기능 수행 불가"
                    realistic_solution = "통화 연결 로직 점검, VoIP 서버 안정성 강화, 네트워크 상태별 대응 로직 개발"
                elif most_common_issue == '로그인/인증 문제':
                    predicted_problem = "로그인 실패로 인한 서비스 접근 불가"
                    realistic_solution = "인증 서버 모니터링 강화, 다중 인증 방식 제공, 로그인 실패 시 명확한 안내 메시지"
                elif most_common_issue == '통화중대기 기능 부재':
                    predicted_problem = "통화중대기 미지원으로 인한 업무 효율성 저하"
                    realistic_solution = "통화중대기 기능 개발, 멀티태스킹 지원, 콜센터 시스템 연동"
                elif most_common_issue == '애플워치 호환성 문제':
                    predicted_problem = "웨어러블 기기 미지원으로 인한 접근성 제한"
                    realistic_solution = "WatchOS 연동 개발, 워치 전용 UI 구현, 하드웨어 버튼 지원"
                elif most_common_issue == '블루투스/에어팟 호환성 문제':
                    predicted_problem = "오디오 기기 호환성 문제로 인한 사용자 경험 저하"
                    realistic_solution = "블루투스 프로파일 지원 확대, 오디오 코덱 최적화, 기기별 테스트"
                elif most_common_issue == '통화연결음 관련 문제':
                    predicted_problem = "연결음 볼륨/설정 문제로 인한 사용자 불편"
                    realistic_solution = "연결음 개인화 기능, 볼륨 조절 옵션, 무음 모드 지원"
                elif most_common_issue == '알뜰폰 지원 문제':
                    predicted_problem = "MVNO 미지원으로 인한 사용자 접근성 제한"
                    realistic_solution = "알뜰폰 통신사 지원 확대, 인증 시스템 개선, 호환성 검증"
                elif most_common_issue == '특정 번호 기록 누락 문제':
                    predicted_problem = "통화 기록 누락으로 인한 업무 추적 어려움"
                    realistic_solution = "통화 기록 DB 최적화, 모든 번호 형태 지원, 실시간 기록 검증"
                elif most_common_issue == '볼륨버튼 진동 제어 문제':
                    predicted_problem = "하드웨어 버튼 제어 문제로 인한 사용자 조작 불편"
                    realistic_solution = "하드웨어 이벤트 처리 개선, 진동 제어 옵션 추가"
                elif most_common_issue == '백그라운드 앱 종료 문제':
                    predicted_problem = "통화 종료 후 백그라운드 프로세스 미정리로 인한 시스템 리소스 점유"
                    realistic_solution = "통화 종료 시 백그라운드 앱 자동 종료, 오디오 세션 관리 개선"
                elif most_common_issue == '스팸 정보 표시 문제':
                    predicted_problem = "스팸 정보 슬라이드 표시로 인한 번호 확인 지연"
                    realistic_solution = "스팸 정보 표시 UI 개선, 번호 우선 표시 옵션 제공"
                elif most_common_issue == 'UI 슬라이드 표시 문제':
                    predicted_problem = "텍스트 슬라이드 애니메이션으로 인한 정보 확인 지연"
                    realistic_solution = "슬라이드 속도 조절, 정적 표시 모드 옵션 추가"
                elif most_common_issue == '사용자 경험 혼란':
                    predicted_problem = "예상치 못한 앱 동작으로 인한 사용자 혼란 및 스트레스"
                    realistic_solution = "직관적인 UI/UX 재설계, 사용자 가이드 개선"
                elif most_common_issue == '차량 블루투스 연동 문제':
                    predicted_problem = "차량 블루투스 연동 불안정으로 인한 음성 통화 후 오디오 세션 문제"
                    realistic_solution = "차량 블루투스 호환성 개선, 오디오 세션 정리 자동화"
                elif most_common_issue == '전화 수신 불가 문제':
                    predicted_problem = "전화 수신 실패로 인한 중요 통화 누락 위험"
                    realistic_solution = "수신 알고리즘 개선, 네트워크 상태 체크 강화"
                else:
                    predicted_problem = "핵심 기능 오류로 인한 작업 완료 불가"
                    realistic_solution = "기능별 안정성 테스트 강화, 오류 발생 시 복구 메커니즘 구축"
                    
            elif category == 'happiness':
                if most_common_issue == '사용성 문제':
                    predicted_problem = "직관적이지 않은 UI/UX로 인한 사용자 스트레스"
                    realistic_solution = "사용자 테스트 실시, 네비게이션 구조 단순화, 주요 기능 접근성 개선"
                elif most_common_issue == '성능 저하':
                    predicted_problem = "앱 로딩 지연으로 인한 사용자 답답함"
                    realistic_solution = "코드 최적화, 이미지 압축, 캐싱 전략 개선, 로딩 인디케이터 추가"
                else:
                    predicted_problem = "사용자 기대와 실제 경험 간의 괴리"
                    realistic_solution = "사용자 피드백 정기 수집, 핵심 불만 사항 우선 해결, UX 개선 프로세스 구축"
                    
            elif category == 'engagement':
                if most_common_issue == '사용성 문제':
                    predicted_problem = "복잡한 기능 구조로 인한 사용자 참여도 감소"
                    realistic_solution = "핵심 기능 접근성 개선, 개인화 알림 설정, 사용 패턴 분석 기반 기능 추천"
                else:
                    predicted_problem = "재방문 동기 부족으로 인한 사용 빈도 저하"
                    realistic_solution = "푸시 알림 개인화, 사용자별 맞춤 콘텐츠 제공, 정기적 업데이트 및 이벤트 진행"
                    
            elif category == 'retention':
                if most_common_issue == '앱 크래시/강제 종료':
                    predicted_problem = "앱 안정성 문제로 인한 사용자 이탈"
                    realistic_solution = "크래시 로그 분석 및 버그 수정, 안정성 테스트 강화, 긴급 패치 프로세스 구축"
                elif most_common_issue == '로그인/인증 문제':
                    predicted_problem = "반복적인 로그인 실패로 인한 재방문율 감소"
                    realistic_solution = "자동 로그인 기능 개선, 소셜 로그인 연동, 비밀번호 찾기 프로세스 간소화"
                else:
                    predicted_problem = "지속적인 가치 제공 실패로 인한 사용자 이탈"
                    realistic_solution = "사용자 생명주기별 맞춤 서비스 제공, 재방문 유도 알림 최적화"
                    
            elif category == 'adoption':
                if most_common_issue == '사용성 문제':
                    predicted_problem = "복잡한 인터페이스로 인한 신규 사용자 온보딩 이탈"
                    realistic_solution = "온보딩 플로우 단순화, 단계별 가이드 제공, 필수 기능 중심 튜토리얼 구성"
                elif most_common_issue == '로그인/인증 문제':
                    predicted_problem = "인증 오류로 인한 신규 사용자 유입 실패"
                    realistic_solution = "간편 회원가입 옵션 제공, 인증 과정 최소화, 설정 자동화 기능 강화"
                else:
                    predicted_problem = "핵심 가치 이해 부족으로 인한 초기 이탈률 증가"
                    realistic_solution = "핵심 기능 우선 노출, 사용자 유형별 맞춤 온보딩, 첫 성공 경험 보장"
            
            # Extract actual user quotes from reviews for more authentic problem descriptions
            user_quotes = []
            for issue_text in data['issues'][:3]:  # Get first 3 issues for quotes
                # Extract meaningful quotes (first 50 chars)
                if len(issue_text) > 50:
                    quote = issue_text[:50] + "..."
                else:
                    quote = issue_text
                user_quotes.append(f'"{quote}"')
            
            quotes_text = " / ".join(user_quotes) if user_quotes else "사용자 피드백 분석 결과"
            
            # Create more detailed, UX-researcher style description
            heart_category_ko = {
                'task_success': '핵심 기능 수행',
                'happiness': '사용자 만족도', 
                'engagement': '사용자 참여도',
                'retention': '사용자 유지율',
                'adoption': '신규 사용자 적응'
            }
            
            description = f"""**HEART 항목**: {heart_category_ko.get(category, category)}
**문제 요약**: {quotes_text}에서 드러나는 {predicted_problem}
**해결 방안**: {realistic_solution}
**기술적 구현**: {solution}
**우선순위**: {priority.upper()}"""

            insights.append({
                'id': insight_id,
                'title': f"{priority_emoji} {priority.title()} | {most_common_issue} ({count}건)",
                'description': description,
                'priority': priority,
                'mentionCount': count,
                'trend': 'stable',
                'category': category
            })
            insight_id += 1
    
    # Sort by priority and impact
    priority_order = {'critical': 3, 'major': 2, 'minor': 1}
    insights.sort(key=lambda x: (priority_order[x['priority']], x['mentionCount']), reverse=True)
    
    # Limit to top 5 insights
    insights = insights[:5]
    
    # Enhanced Korean word frequency analysis (limit to top 10 each)
    positive_words = {}
    negative_words = {}
    
    # Stop words to exclude (including neutral terms)
    stop_words = ['이것', '그것', '저것', '있는', '없는', '같은', '다른', '이런', '그런', '저런', '에서', '으로', '에게', '한테', '에서는', '그리고', '하지만', '그래서', '그런데', '입니다', '합니다', '했습니다', '있습니다', '됩니다', '없습니다', '이에요', '예요', '라고', '이라고', '하는', '하고', '해서', '해도', '때문에', '그냥', '정말', '진짜', '너무', '아주', '매우', '좀', '조금', '많이', '잘', '못', '안', '제가', '저는', '나는', '우리', '저희', '그게', '그거', '이거', '저거', '여기', '거기', '저기', '때', '후', '전', '지금', '오늘', '내일', '어제', '요즘', '최근', '이번', '다음', '위해', '위하여', '위한', '한번', '두번', '세번', '먼저', '다시', '또', '또한', '그리고', '그래서', '그런데', '하지만', '그러나', '그러면', '그러므로', '따라서', '만약', '만일', '경우', '때문', '덕분', '덕에', '말고', '말구', '외에', '빼고', '제외', '포함', '추가', '업데이트', '버전', '기능', '서비스', '시스템', '프로그램', '소프트웨어', '하드웨어', '인터페이스', '사용자', '고객', '회원', '계정', '로그인', '회원가입', '설정', '환경', '상황', '상태', '정보', '데이터', '내용', '방법', '방식', '형태', '종류', '타입', '사이트', '홈페이지', '웹사이트', '페이지', '화면', '창', '버튼', '메뉴', '링크', '아이콘', '이미지', '사진', '파일', '폴더', '디렉토리', '경로', '주소', '번호', '코드', '값', '변수', '매개변수', '파라미터', '옵션', '선택', '항목', '리스트', '목록', '테이블', '표', '차트', '그래프', '도표', '문서', '텍스트', '글', '글자', '문자', '단어', '문장', '단락', '제목', '부제목', '헤더', '풋터', '메인', '서브', '좌측', '우측', '상단', '하단', '중앙', '가운데', '왼쪽', '오른쪽', '위쪽', '아래쪽', '앞쪽', '뒤쪽', '안쪽', '바깥쪽', '내부', '외부', '전체', '부분', '일부', '전부', '모든', '각각', '개별', '공통', '일반', '특별', '특수', '기본', '표준', '고급', '초급', '중급', '상급', '최고', '최저', '최대', '최소', '최신', '최근', '이전', '과거', '현재', '미래', '다음', '이후', '이전', '지난', '올해', '작년', '내년', '이달', '지난달', '다음달', '이번주', '지난주', '다음주', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '주말', '주중', '평일', '휴일', '공휴일', '방학', '개학', '시작', '종료', '완료', '진행', '처리', '작업', '업무', '일', '과제', '문제', '해결', '답', '질문', '요청', '신청', '접수', '등록', '가입', '탈퇴', '해지', '해제', '취소', '삭제', '제거', '추가', '변경', '수정', '편집', '저장', '백업', '복원', '복구', '복사', '붙여넣기', '잘라내기', '선택', '클릭', '더블클릭', '우클릭', '터치', '스와이프', '드래그', '드롭', '스크롤', '확대', '축소', '회전', '이동', '위치', '크기', '높이', '너비', '길이', '폭', '깊이', '두께', '무게', '색상', '색깔', '빨간색', '파란색', '노란색', '초록색', '검은색', '흰색', '회색', '보라색', '주황색', '분홍색', '갈색', '금색', '은색', '투명', '불투명', '밝은', '어두운', '진한', '연한', '선명한', '흐린', '깨끗한', '더러운', '새로운', '낡은', '오래된', '최신의', '구식의', '현대의', '전통적인', '일반적인', '특별한', '독특한', '유일한', '흔한', '드문', '많은', '적은', '큰', '작은', '높은', '낮은', '빠른', '느린', '쉬운', '어려운', '간단한', '복잡한', '단순한', '정확한', '부정확한', '올바른', '잘못된', '맞는', '틀린', '좋은', '나쁜', '우수한', '열등한', '완벽한', '불완전한', '성공한', '실패한', '효과적인', '비효과적인', '유용한', '무용한', '필요한', '불필요한', '중요한', '사소한', '주요한', '부차적인', '핵심적인', '부수적인', '직접적인', '간접적인', '명확한', '불명확한', '구체적인', '추상적인', '현실적인', '이상적인', '가능한', '불가능한', '확실한', '불확실한', '안전한', '위험한', '공개적인', '비공개적인', '공식적인', '비공식적인', '정식의', '임시의', '영구적인', '일시적인', '지속적인', '일회성의', '반복적인', '단발성의', '연속적인', '불연속적인', '자동적인', '수동적인', '능동적인', '수동적인', '적극적인', '소극적인', '긍정적인', '부정적인', '낙관적인', '비관적인', '희망적인', '절망적인', '만족스러운', '불만족스러운', '행복한', '불행한', '즐거운', '괴로운', '기쁜', '슬픈', '웃긴', '재미있는', '지루한', '흥미로운', '놀라운', '당연한', '예상된', '예상치못한', '익숙한', '낯선', '편한', '불편한', '자연스러운', '어색한', '정상적인', '비정상적인', '일반적인', '특별한', '보통의', '평범한', '독특한', '특이한']
    
    # Define positive and negative keywords for better classification
    positive_keywords = ['좋', '만족', '훌륭', '우수', '뛰어난', '완벽', '최고', '추천', '감사', '고마워', '도움', '편리', '쉬운', '간편', '빠른', '정확', '안정', '신뢰', '성공', '효과', '유용', '필요', '중요', '핵심', '보이스피싱', '막아', '요약', '텍스트', '유용하고', '좋아요', '감사합니다', '만족', '편리', '도움', '개선', '향상', '발전', '성장', '증가', '상승', '올라', '높아', '강화', '보강', '개선', '향상', '완성', '달성', '성취', '해결', '극복', '이겨', '성공', '승리', '우승', '최고', '1등', '으뜸', '최상', '최우수', '우수', '훌륭', '뛰어난', '완벽', '이상적', '완전', '전체', '모든', '다', '전부', '완전히', '정말', '진짜', '참', '확실', '명확', '분명', '틀림없이', '당연히', '물론', '역시', '예상대로', '기대한대로', '바라던대로', '원하던대로', '필요한대로', '적절한', '알맞은', '적합한', '맞는', '올바른', '정확한', '정말', '진짜', '참', '확실', '명확', '분명', '틀림없이', '당연히', '물론', '역시', '예상대로', '기대한대로', '바라던대로', '원하던대로', '필요한대로', '적절한', '알맞은', '적합한', '맞는', '올바른', '정확한']
    
    negative_keywords = ['나쁜', '안좋', '불만', '문제', '오류', '에러', '버그', '실패', '안됨', '안되', '못해', '어려운', '복잡', '느린', '끊어', '끊김', '튕김', '크래시', '멈춤', '중단', '지연', '늦', '실망', '화나', '짜증', '스트레스', '불편', '귀찮', '번거롭', '힘들', '어렵', '복잡', '헷갈', '혼란', '애매', '불분명', '불안', '걱정', '우려', '의심', '의문', '궁금', '모르', '몰라', '모름', '헷갈', '혼란', '애매', '불분명', '불안', '걱정', '우려', '의심', '의문', '궁금', '모르', '몰라', '모름', '통화', '수발신', '한번에', '안되고', '목소리랑', '따로', '아이디', '만들어야', '탈회조차', '마음대로', '못하는', '어플', '전화연결이', '예고없이', '끈어짐은', '기본이고', '시끄러워죽겠습니다', '바꿉시다', '통화연결음좀', '끊어지고', '끊김', '튕김', '안됨', '실패', '오류', '에러', '버그', '문제', '불편', '어려움', '복잡', '느림', '지연', '중단', '정지', '멈춤', '크래시', '다운', '죽음', '꺼짐', '종료', '나감', '빠짐', '탈출', '이탈', '포기', '중단', '해지', '취소', '삭제', '제거', '없앰', '버림', '던짐', '흘림', '떨어뜨림', '놓침', '잃음', '상실', '손실', '피해', '손해', '타격', '충격', '쇼크', '놀람', '당황', '혼란', '어지러움', '헷갈림', '착각', '실수', '잘못', '틀림', '오해', '오류', '잘못된', '틀린', '부정확한', '잘못된', '비정상적인', '이상한', '수상한', '의심스러운', '불안한', '걱정스러운', '우려스러운', '두려운', '무서운', '공포스러운', '끔찍한', '참혹한', '비참한', '슬픈', '울적한', '우울한', '침울한', '답답한', '막막한', '절망적인', '포기하고싶은', '그만두고싶은', '때려치우고싶은', '관두고싶은', '치우고싶은', '던지고싶은', '버리고싶은', '삭제하고싶은', '해지하고싶은', '취소하고싶은', '반납하고싶은', '환불받고싶은', '돌려받고싶은']
    
    import re
    
    for review in reviews:
        content = review['content']
        rating = review.get('rating', 3)
        
        # Clean Korean text
        cleaned = re.sub(r'[^\w\s가-힣]', ' ', content)
        words = cleaned.split()
        
        # Filter meaningful Korean words
        korean_words = []
        for word in words:
            word = word.strip()
            if len(word) >= 2 and not word.isdigit() and word not in stop_words:
                # Check if word contains Korean characters
                if any(ord(char) >= 0xAC00 and ord(char) <= 0xD7A3 for char in word):
                    korean_words.append(word)
        
        # Classify by sentiment - analyze content regardless of rating to capture nuanced feedback
        # Positive words (from positive context or expressions)
        for word in korean_words:
            if (word in ['좋아요', '만족', '편리', '유용', '도움', '감사', '최고', '완벽', '훌륭', '추천', '좋은', '좋다', '좋음', '괜찮', '잘됨', '잘되', '성공', '안정', '빠름', '정확', '깔끔', '간편', '쉬움', '쉽다', '쉬운', '보이스피싱', '막아줘서', '요약', '텍스트', '잘사용', '사용하고', '있습니다'] or
                '좋' in word or '만족' in word or '편리' in word or '유용' in word or '도움' in word or '감사' in word or '최고' in word or '완벽' in word or '훌륭' in word or '추천' in word or '보이스피싱' in word):
                positive_words[word] = positive_words.get(word, 0) + 1
        
        # Negative words (from problematic context or expressions)
        for word in korean_words:
            if (word in ['문제', '오류', '안됨', '끊김', '불편', '어려움', '느림', '튕김', '크래시', '실패', '짜증', '최악', '버그', '에러', '안되', '못함', '안함', '실망', '화남', '답답', '스트레스', '귀찮', '번거롭', '힘들', '어렵', '복잡', '헷갈', '혼란', '불안', '걱정', '의심', '통화중대기', '연결안됨', '끊어짐', '업데이트', '안됩니까', '끊어지고', '쓰레기어플', '애플워치', '호환', '안되는', '부재중', '빈번함', '블루투스', '네비게이션', '통화연결음', '시끄러워죽겠습니다', '바꿉시다', '볼륨버튼', '진동', '꺼지면', '당황스러운', '백그라운드', '계속실행', '자동으로', '넘어가지', '스팸정보', '딸려와서', '슬라이드', '번호확인', '기다려야', '차량', '블투', '안받아지', '받아지지'] or
                '문제' in word or '오류' in word or '안됨' in word or '끊김' in word or '불편' in word or '어려움' in word or '느림' in word or '튕김' in word or '크래시' in word or '실패' in word or '짜증' in word or '최악' in word or '버그' in word or '에러' in word or '안되' in word or '못함' in word or '통화' in word or '연결' in word or '끊어' in word or '당황' in word or '백그라운드' in word or '스팸' in word or '슬라이드' in word):
                negative_words[word] = negative_words.get(word, 0) + 1
    
    # Convert to word cloud format (top 10 each as requested)
    positive_cloud = [{'word': word, 'frequency': freq, 'sentiment': 'positive'} 
                      for word, freq in sorted(positive_words.items(), key=lambda x: x[1], reverse=True)[:10]]
    negative_cloud = [{'word': word, 'frequency': freq, 'sentiment': 'negative'} 
                      for word, freq in sorted(negative_words.items(), key=lambda x: x[1], reverse=True)[:10]]
    
    print(f"Generated {len(insights)} HEART insights, {len(positive_cloud)} positive words, {len(negative_cloud)} negative words", file=sys.stderr)
    
    return {
        'insights': insights,
        'wordCloud': {
            'positive': positive_cloud,
            'negative': negative_cloud
        }
    }

def main():
    """Main function to run the scraper"""
    try:
        # Parse command line arguments
        analyze_mode = '--analyze' in sys.argv
        
        if analyze_mode:
            # Remove --analyze flag from arguments
            args = [arg for arg in sys.argv[1:] if arg != '--analyze']
            
            if len(args) >= 3:
                # Format: python scraper.py --analyze google_app_id apple_app_id count sources
                app_id_google = args[0]
                app_id_apple = args[1]
                count = int(args[2])
                sources = args[3].split(',') if len(args) > 3 else ['google_play']
            else:
                # Legacy format: python scraper.py --analyze app_id count
                app_id_google = args[0] if len(args) > 0 else 'com.lguplus.sohoapp'
                app_id_apple = '1571096278'
                count = int(args[1]) if len(args) > 1 else 100
                sources = ['google_play']
        else:
            if len(sys.argv) > 3:
                # Format: python scraper.py google_app_id apple_app_id count sources
                app_id_google = sys.argv[1]
                app_id_apple = sys.argv[2]
                count = int(sys.argv[3])
                sources = sys.argv[4].split(',') if len(sys.argv) > 4 else ['google_play']
            else:
                # Legacy format: python scraper.py app_id count
                app_id_google = sys.argv[1] if len(sys.argv) > 1 else 'com.lguplus.sohoapp'
                app_id_apple = '1571096278'
                count = int(sys.argv[2]) if len(sys.argv) > 2 else 100
                sources = ['google_play']
        
        # Get reviews from specified sources
        reviews_data = scrape_reviews(app_id_google, app_id_apple, count, sources)
        
        if analyze_mode:
            # Perform analysis
            analysis_result = analyze_sentiments(reviews_data)
            result = {
                'success': True,
                'message': f'{len(reviews_data)}개의 리뷰를 분석했습니다.',
                'reviewCount': len(reviews_data),
                'insights': analysis_result['insights'],
                'wordCloud': analysis_result['wordCloud']
            }
        else:
            # Always include analysis for collection
            analysis_result = analyze_sentiments(reviews_data)
            result = {
                'success': True,
                'reviews': reviews_data,
                'reviewCount': len(reviews_data),
                'message': f'{len(reviews_data)}개의 리뷰를 성공적으로 수집했습니다.',
                'analysis': analysis_result,
                'sources': sources,
                'counts': {
                    'google_play': len([r for r in reviews_data if r['source'] == 'google_play']),
                    'app_store': len([r for r in reviews_data if r['source'] == 'app_store'])
                }
            }
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'message': '리뷰 수집 중 오류가 발생했습니다.'
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()