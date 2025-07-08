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
            if any(keyword in content for keyword in ['오류', '에러', '버그', '튕김', '꺼짐', '작동안함', '실행안됨', '끊김', '연결안됨', '안들림', '소리안남']):
                heart_analysis['task_success']['issues'].append(content)
                if '튕김' in content or '꺼짐' in content:
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
    
    # Generate insights based on analysis
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
            
            # Generate specific insights with solutions
            if category == 'task_success':
                most_common_issue = max(set(data['details']), key=data['details'].count) if data['details'] else '기능 오류'
                title = "Task Success: 핵심 기능 안정성"
                problem = f"{most_common_issue} {data['details'].count(most_common_issue)}건 발생"
                if most_common_issue == '앱 크래시':
                    solution = "즉시 크래시 로그 분석 및 메모리 관리 개선"
                elif most_common_issue == '네트워크 연결':
                    solution = "네트워크 연결 안정성 개선 및 재시도 로직 추가"
                elif most_common_issue == '음성 기능':
                    solution = "오디오 권한 및 코덱 호환성 점검"
                else:
                    solution = "핵심 기능 QA 테스트 강화 및 버그 수정"
                    
            elif category == 'happiness':
                title = "Happiness: 사용자 만족도 개선"
                strong_complaints = data['details'].count('강한 불만')
                problem = f"사용자 불만 {count}건 (강한 불만 {strong_complaints}건)"
                solution = "불만 사용자 직접 소통, 주요 개선사항 우선 적용"
                
            elif category == 'engagement':
                title = "Engagement: 사용자 참여도 증대"
                problem = f"사용 빈도 저하 {count}건 확인"
                solution = "핵심 기능 접근성 개선, 사용자 맞춤 콘텐츠 제공"
                
            elif category == 'retention':
                title = "Retention: 사용자 유지율 개선"
                problem = f"이탈 위험 사용자 {count}건 감지"
                solution = "이탈 예방 프로그램 운영, 핵심 가치 재강조"
                
            elif category == 'adoption':
                title = "Adoption: 신규 사용자 적응 지원"
                problem = f"사용성 문제 {count}건 접수"
                solution = "온보딩 프로세스 간소화, 가이드 개선"
            
            insights.append({
                'id': insight_id,
                'title': title,
                'description': f"----------------------------------------\nHEART 요소: {category.title().replace('_', ' ')}\n문제 요약: {problem}\n해결 방법: {solution}\n우선순위: {priority_emoji} {priority.title()}\n----------------------------------------",
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
        if len(sys.argv) > 3:
            # Format: python scraper.py google_app_id apple_app_id count sources
            app_id_google = sys.argv[1]
            app_id_apple = sys.argv[2]
            count = int(sys.argv[3])
            sources = sys.argv[4].split(',') if len(sys.argv) > 4 else ['google_play']
        else:
            # Legacy format: python scraper.py app_id count
            app_id_google = sys.argv[1] if len(sys.argv) > 1 else 'com.lguplus.sohoapp'
            app_id_apple = '1571096278'  # Default Apple App Store ID for 우리가게 패키지
            count = int(sys.argv[2]) if len(sys.argv) > 2 else 100
            sources = ['google_play']
        
        # Scrape reviews
        reviews_data = scrape_reviews(app_id_google, app_id_apple, count, sources)
        
        # Analyze sentiments and generate insights
        analysis = analyze_sentiments(reviews_data)
        
        # Output results as JSON
        result = {
            'success': True,
            'reviews': reviews_data,
            'analysis': analysis,
            'message': f'{len(reviews_data)}개의 리뷰를 성공적으로 수집했습니다.',
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