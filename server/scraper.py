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
        
        # Only analyze negative sentiment reviews for problems
        if rating < 4:
            # Task Success - Core functionality problems
            if any(keyword in content for keyword in ['오류', '에러', '버그', '튕', '꺼짐', '작동안함', '실행안됨', '끊김', '연결안됨', '안들림', '소리안남', '안됨', '안되', '크래시', '종료', '재시작']):
                heart_analysis['task_success']['issues'].append(content)
                if '튕' in content or '꺼짐' in content or '크래시' in content:
                    heart_analysis['task_success']['details'].append('앱 크래시')
                elif '연결' in content and ('안됨' in content or '끊김' in content):
                    heart_analysis['task_success']['details'].append('네트워크 연결')
                elif '소리' in content and '안남' in content:
                    heart_analysis['task_success']['details'].append('음성 기능')
                else:
                    heart_analysis['task_success']['details'].append('기능 오류')
            
            # Happiness - User satisfaction issues
            elif any(keyword in content for keyword in ['짜증', '최악', '실망', '화남', '불만', '별로', '구림', '싫어', '답답', '스트레스']):
                heart_analysis['happiness']['issues'].append(content)
                if '최악' in content or '화남' in content:
                    heart_analysis['happiness']['details'].append('강한 불만')
                else:
                    heart_analysis['happiness']['details'].append('만족도 저하')
            
            # Engagement - Usage patterns
            elif any(keyword in content for keyword in ['안써', '사용안함', '재미없', '지루', '흥미없', '별로안쓴', '가끔만']):
                heart_analysis['engagement']['issues'].append(content)
                heart_analysis['engagement']['details'].append('사용 빈도 저하')
            
            # Retention - Churn indicators
            elif any(keyword in content for keyword in ['삭제', '해지', '그만', '안쓸', '다른거', '바꿀', '탈퇴', '포기', '중단']):
                heart_analysis['retention']['issues'].append(content)
                heart_analysis['retention']['details'].append('이탈 위험')
            
            # Adoption - Onboarding difficulties
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
    
    for category, data in heart_analysis.items():
        if data['issues']:
            count = len(data['issues'])
            impact_score = count * impact_weights[category]
            
            # Priority calculation
            if impact_score >= 15 or (category == 'task_success' and count >= 3):
                priority = "critical"
                priority_emoji = "🔴"
            elif impact_score >= 8 or count >= 3:
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
            
            insights.append({
                'id': insight_id,
                'title': title,
                'description': f"📢 예측되는 문제점\n{predicted_problem}\n\n💡 해결 방법\n{realistic_solution}\n\n----------------------------------------\nHEART 요소: {category.title().replace('_', ' ')}\n문제 요약: {problem}\n해결 방법: {solution}\n우선순위: {priority_emoji} {priority.title()}\n----------------------------------------",
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
    
    # Stop words to exclude
    stop_words = ['이것', '그것', '저것', '있는', '없는', '같은', '다른', '이런', '그런', '저런', '에서', '으로', '에게', '한테', '에서는', '그리고', '하지만', '그래서', '그런데']
    
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
        
        # Classify by sentiment
        if rating >= 4:  # Positive
            for word in korean_words:
                positive_words[word] = positive_words.get(word, 0) + 1
        else:  # Negative
            for word in korean_words:
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