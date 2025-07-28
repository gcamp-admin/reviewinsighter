#!/usr/bin/env python3
"""
Deployment-safe analysis script for production environment
Self-contained without external module dependencies
"""

import sys
import json
import os
import re
import requests
from collections import Counter

def analyze_sentiment_basic(text):
    """Basic rule-based sentiment analysis for deployment"""
    text = text.lower()
    
    # Enhanced negative keywords with priority
    negative_keywords = [
        '안되', '안돼', '불편', '문제', '오류', '실패', '느림', '끊어', '멈춤',
        '복잡', '어려', '힘들', '귀찮', '스트레스', '형편없', '구리', '실망',
        '렉', '직관', '광고', '강제', '먹통', '뜨거움', '방해', '차단', '과열',
        '거슬림', '못하는', '안하는', '안돼는', '조치', '거절'
    ]
    
    positive_keywords = [
        '좋다', '편하다', '만족', '추천', '최고', '훌륭', '완벽', '빠르다',
        '안정', '깔끔', '유용', '도움', '감사', '고마워', '좋네', '괜찮'
    ]
    
    neutral_keywords = [
        '보통', '그저그래', '나쁘지않', '무난', '평범', '일반적'
    ]
    
    # Check for explicit negative indicators first (highest priority)
    if any(keyword in text for keyword in ['단점', '아쉬운 점', '불편한 점', '불만', '싫은 점']):
        return '부정'
    
    # Count keyword occurrences
    negative_count = sum(1 for keyword in negative_keywords if keyword in text)
    positive_count = sum(1 for keyword in positive_keywords if keyword in text)
    neutral_count = sum(1 for keyword in neutral_keywords if keyword in text)
    
    # Decision logic with thresholds
    if negative_count >= 2 or (negative_count > 0 and positive_count == 0):
        return '부정'
    elif positive_count >= 2 or (positive_count > 0 and negative_count == 0):
        return '긍정'
    elif neutral_count > 0:
        return '중립'
    else:
        # Default based on length and complexity
        if len(text) < 10:
            return '중립'
        else:
            return '긍정' if '좋' in text or '괜찮' in text else '중립'

def extract_keywords_basic(reviews, sentiment_filter, limit=10):
    """Basic keyword extraction for deployment"""
    # Filter reviews by sentiment
    filtered_reviews = [r for r in reviews if r.get('sentiment') == sentiment_filter]
    
    if not filtered_reviews:
        return []
    
    # Extract text content
    all_text = ' '.join([r['content'] for r in filtered_reviews])
    
    # Basic Korean word extraction using regex
    # Extract 2-4 character Korean words
    korean_words = re.findall(r'[가-힣]{2,4}', all_text)
    
    # Filter out common stop words
    stopwords = {
        '익시오', '앱', '어플', '애플리케이션', '유플러스', 'LG', 'LGU', 'U+',
        '사용', '사용자', '좋다', '나쁘다', '괜찮다', '별로', '그냥', '정말',
        '너무', '조금', '많이', '아주', '가끔', '항상', '때문', '이제', '지금',
        '이번', '다음', '처음', '마지막', '하지만', '그래서', '그리고', '또한',
        '있다', '없다', '된다', '한다', '같다', '다르다', '것', '거', '게',
        '서비스', '기능', '시스템', '여기', '저기', '이거', '그거', '뭔가'
    }
    
    # Count word frequencies
    word_freq = Counter()
    for word in korean_words:
        if word not in stopwords and len(word) >= 2:
            word_freq[word] += 1
    
    # Return top words with frequency
    top_words = word_freq.most_common(limit)
    return [{'text': word, 'frequency': freq} for word, freq in top_words]

def generate_heart_insights_basic(reviews):
    """Basic HEART insights generation for deployment"""
    # Filter negative reviews for analysis
    negative_reviews = [r for r in reviews if r.get('sentiment') == '부정']
    
    if len(negative_reviews) < 3:
        return []
    
    # Extract common issues from negative reviews
    all_negative_text = ' '.join([r['content'] for r in negative_reviews])
    
    # Basic pattern matching for common issues
    insights = []
    
    if '느림' in all_negative_text or '속도' in all_negative_text:
        insights.append({
            'heart_category': 'Task Success',
            'problem_summary': '앱 성능 및 속도 관련 불만이 지속적으로 제기되고 있습니다.',
            'competitor_benchmark': '카카오톡, 라인 등 메신저 앱의 빠른 반응속도와 비교하여 개선이 필요합니다.',
            'ux_suggestions': ['앱 로딩 시간 단축을 위한 성능 최적화', '사용자에게 로딩 상태를 명확히 표시하는 프로그레스 바 추가'],
            'priority': 'critical'
        })
    
    if '복잡' in all_negative_text or '어려' in all_negative_text:
        insights.append({
            'heart_category': 'Adoption',
            'problem_summary': 'UI/UX 복잡성으로 인한 사용성 문제가 발견됩니다.',
            'competitor_benchmark': '네이버 라인, 페이스북 메신저의 직관적인 인터페이스를 참고한 개선이 필요합니다.',
            'ux_suggestions': ['주요 기능 접근성 향상을 위한 내비게이션 단순화', '사용자 가이드 및 온보딩 프로세스 개선'],
            'priority': 'major'
        })
    
    if '문제' in all_negative_text or '오류' in all_negative_text:
        insights.append({
            'heart_category': 'Happiness',
            'problem_summary': '앱 사용 중 발생하는 기술적 문제들이 사용자 만족도를 저하시키고 있습니다.',
            'competitor_benchmark': '텔레그램, 왓츠앱의 안정적인 서비스 품질을 벤치마크하여 개선해야 합니다.',
            'ux_suggestions': ['오류 발생 시 사용자 친화적인 에러 메시지 제공', '문제 해결을 위한 즉시 지원 기능 추가'],
            'priority': 'critical'
        })
    
    # Add default insights if no specific patterns found
    if not insights:
        insights.append({
            'heart_category': 'Engagement',
            'problem_summary': '사용자 피드백을 통해 전반적인 사용 경험 개선이 필요한 상황입니다.',
            'competitor_benchmark': '주요 통신 앱들의 사용자 중심적 설계를 참고하여 개선점을 도출해야 합니다.',
            'ux_suggestions': ['사용자 피드백 수집 시스템 강화', '개인화된 사용자 경험 제공'],
            'priority': 'minor'
        })
    
    return insights

def main():
    try:
        print("Starting deployment-safe analysis", file=sys.stderr)
        
        if len(sys.argv) < 3:
            print("Usage: python deploy_analysis.py <temp_file_path> <analysis_type>")
            sys.exit(1)
        
        temp_file_path = sys.argv[1]
        analysis_type = sys.argv[2] if len(sys.argv) > 2 else 'full'
        
        # Read reviews from file
        with open(temp_file_path, 'r', encoding='utf-8') as f:
            reviews_data = json.load(f)
        
        print(f"Analyzing {len(reviews_data)} reviews with type: {analysis_type}", file=sys.stderr)
        
        # Perform sentiment analysis on reviews that need it
        for review in reviews_data:
            if review.get('sentiment') == '분석중':
                review['sentiment'] = analyze_sentiment_basic(review['content'])
        
        result = {}
        
        if analysis_type == 'wordcloud' or analysis_type == 'full':
            # Generate word cloud data
            positive_words = extract_keywords_basic(reviews_data, '긍정', 10)
            negative_words = extract_keywords_basic(reviews_data, '부정', 10)
            
            result['wordCloud'] = {
                'positive': positive_words,
                'negative': negative_words
            }
            print(f"Generated word cloud: {len(positive_words)} positive, {len(negative_words)} negative words", file=sys.stderr)
        
        if analysis_type == 'heart' or analysis_type == 'full':
            # Generate HEART insights
            insights = generate_heart_insights_basic(reviews_data)
            result['insights'] = insights
            print(f"Generated {len(insights)} HEART insights", file=sys.stderr)
        
        # Output result as JSON
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"Deployment analysis error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()