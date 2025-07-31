#!/usr/bin/env python3
"""
HEART Framework Analysis using OpenAI GPT
Enhanced UX expert system for commento.ai
"""

import os
import json
import sys
from typing import List, Dict, Any
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def categorize_reviews_by_heart(reviews: List[Dict]) -> Dict[str, List[str]]:
    """
    HEART 카테고리별로 리뷰를 분류하고 정리
    """
    # 감정별 리뷰 분류
    positive_reviews = [r for r in reviews if r.get('sentiment') == '긍정']
    negative_reviews = [r for r in reviews if r.get('sentiment') == '부정']
    neutral_reviews = [r for r in reviews if r.get('sentiment') == '중립']
    
    # HEART 프레임워크 기반 키워드 매칭
    heart_keywords = {
        "Happiness": ["좋아요", "만족", "예쁘다", "좋네요", "훌륭", "완벽", "최고", "감사", "행복"],
        "Engagement": ["자주", "계속", "매일", "습관", "재미", "흥미", "몰입", "빠져들"],
        "Adoption": ["처음", "시작", "가입", "설치", "온보딩", "첫", "초기", "어려워"],
        "Retention": ["다시", "재방문", "돌아", "계속", "지속", "유지", "꾸준", "알림"],
        "Task Success": ["완료", "성공", "달성", "해결", "찾기", "기능", "작업", "오류", "버그", "실패"]
    }
    
    categorized_reviews = {category: [] for category in heart_keywords.keys()}
    
    # 각 리뷰를 HEART 카테고리별로 분류
    for review in reviews:
        content = review.get('content', '').lower()
        
        # 각 카테고리별로 키워드 매칭
        for category, keywords in heart_keywords.items():
            if any(keyword in content for keyword in keywords):
                categorized_reviews[category].append(review['content'])
    
    return categorized_reviews

def generate_heart_analysis(heart_key: str, reviews: List[str]) -> str:
    """
    특정 HEART 카테고리에 대한 전문가 분석 생성
    """
    if not reviews:
        return f"HEART: {heart_key} | 분석할 리뷰가 없습니다."
    
    # GPT 시스템 프롬프트
    system_prompt = """당신은 UX 전략 전문가입니다. 사용자 리뷰 데이터를 분석하여 HEART 프레임워크에 따라 UX 문제를 구조적으로 정리하고, 설득력 있는 개선 제안을 작성합니다.

[작성 기준]
각 HEART 항목(Happiness, Engagement, Adoption, Retention, Task Success)에 대해 다음과 같은 구조로 작성해주세요:

1. 문제 요약: 리뷰에서 반복적으로 나타난 UX 이슈를 요약합니다.

2. UX 개선 제안: 아래 흐름을 따라 작성합니다.
- 사용자의 실제 행동과 불편(Pain Point)을 구체적으로 설명하고
- 유사 앱/서비스 사례를 간단히 인용해, 이 문제를 어떻게 해결했는지 알려줍니다
- 그 사례를 바탕으로 우리 서비스에 적용할 수 있는 설계 아이디어나 기능 제안을 구체적으로 작성합니다
- 마지막 줄에는 그 개선안이 사용자 경험에 어떤 긍정적 영향을 줄 수 있을지 요약합니다

[스타일 가이드]
- "기능을 추가하세요", "안내해주세요" 같은 피상적인 표현은 사용하지 않습니다 ❌
- 반드시 어떤 UX 문제인지, 무엇을 어떻게 개선해야 하는지까지 명확하게 작성합니다 ✅
- 각 항목은 단락 구분 없이 5~8줄 정도로 간결하면서도 밀도 있게 작성합니다

[예시 출력 문장]

HEART: Adoption | 온보딩 경험 문제  
신규 사용자가 처음 앱에 진입했을 때 주요 기능의 흐름을 이해하지 못하고 "어디서부터 시작해야 할지 모르겠다"는 리뷰가 반복적으로 나타났습니다. 이는 초기 사용 경험 설계가 충분하지 않아 사용자 이탈 가능성이 높은 상황입니다.  
Duolingo는 첫 진입 시 1개의 간단한 문제를 바로 풀게 하여 '내가 할 수 있다'는 인식을 빠르게 제공합니다. Notion은 예시 페이지를 자동 생성하여 사용자가 처음부터 구조를 이해할 수 있도록 돕습니다.  
이 앱에서도 첫 진입 시, 주요 기능을 간단히 체험할 수 있는 가상 시나리오(예: 샘플 리뷰 업로드 → 분석 결과 보기)를 자동 제공하면 초기 이탈률을 줄일 수 있습니다.  
이렇게 하면 사용자는 앱을 '배워야 할 도구'가 아닌 '당장 쓸 수 있는 도구'로 인식하게 됩니다."""

    # 사용자 프롬프트 생성 (f-string에서 백슬래시 문제 해결)
    review_text = '"\n- "'.join(reviews[:10])
    user_prompt = f"""다음은 HEART: {heart_key} 관련 사용자 리뷰입니다:\n- "{review_text}"\n\n위 리뷰를 기반으로 전문가처럼 HEART 분석을 작성해주세요."""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.5,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error generating analysis for {heart_key}: {e}", file=sys.stderr)
        return f"HEART: {heart_key} | 분석 생성 중 오류가 발생했습니다."

def analyze_heart_framework_comprehensive(reviews: List[Dict]) -> List[Dict]:
    """
    전체 HEART 프레임워크 분석 실행
    """
    if not reviews:
        return []
    
    print(f"Starting comprehensive HEART analysis for {len(reviews)} reviews")
    
    # 리뷰를 HEART 카테고리별로 분류
    categorized_reviews = categorize_reviews_by_heart(reviews)
    
    insights = []
    
    # 각 HEART 카테고리별로 분석 수행
    for heart_category, review_list in categorized_reviews.items():
        if review_list:  # 해당 카테고리에 리뷰가 있는 경우만
            print(f"Analyzing {heart_category} with {len(review_list)} reviews")
            
            analysis_text = generate_heart_analysis(heart_category, review_list)
            
            # 우선순위 판단 (키워드 기반)
            priority = "minor"
            if any(keyword in analysis_text.lower() for keyword in ["치명적", "심각", "이탈", "중단"]):
                priority = "critical"
            elif any(keyword in analysis_text.lower() for keyword in ["불편", "문제", "오류", "실패"]):
                priority = "major"
            
            insight = {
                "title": f"HEART: {heart_category} | UX 분석",
                "priority": priority,
                "problem_summary": analysis_text.split('\n')[0] if '\n' in analysis_text else analysis_text[:200],
                "ux_suggestions": analysis_text,
                "heart_category": heart_category
            }
            
            insights.append(insight)
    
    return insights

def main():
    """메인 실행 함수"""
    if len(sys.argv) != 2:
        print("Usage: python heart_analysis_python.py <reviews_json_file>", file=sys.stderr)
        sys.exit(1)
    
    reviews_file = sys.argv[1]
    
    try:
        with open(reviews_file, 'r', encoding='utf-8') as f:
            reviews = json.load(f)
        
        # HEART 분석 실행
        insights = analyze_heart_framework_comprehensive(reviews)
        
        # 결과 출력
        result = {"insights": insights}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"Error in HEART analysis: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()