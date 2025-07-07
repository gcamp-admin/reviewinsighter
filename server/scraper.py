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

def scrape_reviews(app_id='com.lguplus.sohoapp', count=100, lang='ko', country='kr'):
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
        print(f"Error scraping reviews: {str(e)}", file=sys.stderr)
        return []

def analyze_sentiments(reviews):
    """
    Analyze sentiment trends and generate insights
    
    Args:
        reviews: List of review dictionaries
        
    Returns:
        Dictionary with insights and word frequency data
    """
    if not reviews:
        return {'insights': [], 'wordCloud': {'positive': [], 'negative': []}}
    
    # Count sentiments
    positive_count = sum(1 for r in reviews if r['sentiment'] == 'positive')
    negative_count = sum(1 for r in reviews if r['sentiment'] == 'negative')
    
    # Generate insights based on review content
    insights = []
    
    # Common negative patterns
    negative_reviews = [r for r in reviews if r['sentiment'] == 'negative']
    if negative_reviews:
        common_issues = []
        for review in negative_reviews:
            content = review['content'].lower()
            if '오류' in content or '버그' in content or '튕김' in content:
                common_issues.append('stability')
            elif '어려움' in content or '복잡' in content or '불편' in content:
                common_issues.append('ui_ux')
            elif '기능' in content or '개선' in content:
                common_issues.append('features')
        
        if common_issues:
            most_common = max(set(common_issues), key=common_issues.count)
            if most_common == 'stability':
                insights.append({
                    'title': '앱 안정성 개선',
                    'description': f'앱 튕김 및 오류 관련 언급이 {common_issues.count("stability")}건 발견됨',
                    'priority': 'high',
                    'mentionCount': common_issues.count("stability"),
                    'trend': 'increasing',
                    'category': 'stability'
                })
            elif most_common == 'ui_ux':
                insights.append({
                    'title': 'UI/UX 개선',
                    'description': f'인터페이스 복잡성 관련 언급이 {common_issues.count("ui_ux")}건 발견됨',
                    'priority': 'medium',
                    'mentionCount': common_issues.count("ui_ux"),
                    'trend': 'stable',
                    'category': 'ui_ux'
                })
    
    # Word frequency analysis with better Korean text processing
    positive_words = {}
    negative_words = {}
    
    # Common Korean keywords for filtering
    common_keywords = {
        'positive': ['좋다', '좋아', '좋음', '만족', '편리', '쉬움', '빠름', '깔끔', '완벽', '추천', '유용', '효과적', '간편'],
        'negative': ['나쁘다', '나빠', '나쁨', '불편', '어려움', '복잡', '느림', '버그', '오류', '문제', '튕김', '실망', '짜증']
    }
    
    for review in reviews:
        content = review['content'].lower()
        
        # Check for specific sentiment keywords
        if review['sentiment'] == 'positive':
            for keyword in common_keywords['positive']:
                if keyword in content:
                    positive_words[keyword] = positive_words.get(keyword, 0) + 1
        else:
            for keyword in common_keywords['negative']:
                if keyword in content:
                    negative_words[keyword] = negative_words.get(keyword, 0) + 1
        
        # Also extract meaningful 2-3 character Korean words
        words = content.split()
        korean_words = [word for word in words if any(ord(char) >= 0xAC00 and ord(char) <= 0xD7A3 for char in word)]
        
        for word in korean_words:
            if len(word) >= 2 and len(word) <= 4:  # Focus on 2-4 character words
                # Remove punctuation
                clean_word = ''.join(char for char in word if ord(char) >= 0xAC00 and ord(char) <= 0xD7A3)
                if len(clean_word) >= 2:
                    if review['sentiment'] == 'positive':
                        positive_words[clean_word] = positive_words.get(clean_word, 0) + 1
                    else:
                        negative_words[clean_word] = negative_words.get(clean_word, 0) + 1
    
    # Convert to word cloud format
    positive_cloud = [{'word': word, 'frequency': freq, 'sentiment': 'positive'} 
                      for word, freq in sorted(positive_words.items(), key=lambda x: x[1], reverse=True)[:20]]
    negative_cloud = [{'word': word, 'frequency': freq, 'sentiment': 'negative'} 
                      for word, freq in sorted(negative_words.items(), key=lambda x: x[1], reverse=True)[:20]]
    
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
        app_id = sys.argv[1] if len(sys.argv) > 1 else 'com.lguplus.sohoapp'
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 100
        
        # Scrape reviews
        reviews_data = scrape_reviews(app_id, count)
        
        # Analyze sentiments and generate insights
        analysis = analyze_sentiments(reviews_data)
        
        # Output results as JSON
        result = {
            'success': True,
            'reviews': reviews_data,
            'analysis': analysis,
            'message': f'{len(reviews_data)}개의 리뷰를 성공적으로 수집했습니다.'
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