#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
부정 리뷰 기반 키워드 네트워크 분석 시스템
- 부정 리뷰만 필터링하여 키워드 추출
- 상위 20개 키워드 기반 네트워크 생성
- GPT를 통한 UX 중심 클러스터링
- 포트폴리오 스타일 시각화 데이터 생성
"""

import re
import json
import math
import sys
import os
import requests
from collections import defaultdict, Counter
from itertools import combinations
from typing import Dict, List, Tuple, Any

def extract_negative_keywords(reviews: List[Dict]) -> Dict[str, int]:
    """
    부정 리뷰에서만 키워드를 추출하고 상위 20개 선택
    """
    # 부정 리뷰만 필터링 (더 관대한 조건)
    negative_reviews = []
    for r in reviews:
        sentiment = r.get('sentiment', '').strip()
        content = r.get('content', '')
        
        # 감정이 부정이거나, 명확한 부정 표현이 있는 리뷰 포함
        if (sentiment == '부정' or 
            '불편' in content or '안되' in content or '안돼' in content or 
            '문제' in content or '오류' in content or '실패' in content or
            '느림' in content or '끊어' in content or '멈춤' in content or
            '복잡' in content or '어려' in content or '힘들' in content):
            negative_reviews.append(r)
    
    if not negative_reviews:
        return {}
    
    print(f"부정 리뷰 {len(negative_reviews)}개에서 키워드 추출 중...", file=sys.stderr)
    
    keyword_freq = Counter()
    
    # 불용어 리스트 (제외할 단어들)
    stopwords = {
        '익시오', '앱', '어플', '애플리케이션', '유플러스', 'LG', 'LGU', 'U+',
        '사용', '사용자', '좋다', '나쁘다', '괜찮다', '별로', '그냥', '정말',
        '너무', '조금', '많이', '아주', '가끔', '항상', '때문', '이제', '지금',
        '이번', '다음', '처음', '마지막', '하지만', '그래서', '그리고', '또한',
        '수', '있다', '없다', '된다', '한다', '같다', '다르다', '것', '거', '게',
        '서비스', '기능', '시스템'
    }
    
    for review in negative_reviews:
        content = review.get('content', '')
        
        # 한글 키워드 추출 (2-6자)
        korean_words = re.findall(r'[가-힣]{2,6}', content)
        
        for word in korean_words:
            # 불용어 제거
            if word in stopwords:
                continue
                
            # 의미있는 키워드만 선택
            if is_meaningful_keyword(word):
                keyword_freq[word] += 1
    
    # 상위 20개 키워드만 선택
    top_keywords = dict(keyword_freq.most_common(20))
    
    print(f"상위 20개 키워드 선택: {list(top_keywords.keys())}", file=sys.stderr)
    
    return top_keywords

def is_meaningful_keyword(word: str) -> bool:
    """
    의미있는 키워드인지 판단
    """
    # UX 관련 키워드 (문제점, 감정, 기능 관련)
    meaningful_keywords = {
        # 문제 관련
        '오류', '버그', '문제', '에러', '실패', '작동', '멈춤', '충돌', '끊어짐',
        '안되', '안돼', '안됨', '불가', '차단', '제한', '금지', '거부',
        # 감정 표현
        '불편', '불만', '답답', '짜증', '화남', '실망', '후회', '스트레스',
        '귀찮', '복잡', '어려', '힘들', '형편없', '구리', '최악', '렉',
        # 기능 관련
        '통화', '전화', '연결', '수신', '발신', '녹음', '음성', '소리',
        '화면', '버튼', '메뉴', '설정', '배터리', '메모리', '속도', '느림',
        '빠름', '반응', '처리', '로딩', '시간', '대기', '지연'
    }
    
    # 직접 매칭
    if word in meaningful_keywords:
        return True
    
    # 부분 매칭
    for keyword in meaningful_keywords:
        if keyword in word or word in keyword:
            return True
    
    # 한글 2글자 이상이면 포함 (더 관대하게)
    if len(word) >= 2 and all(ord('가') <= ord(c) <= ord('힣') for c in word):
        return True
    
    return False

def calculate_cooccurrence_matrix(reviews: List[Dict], keywords: Dict[str, int], window_size: int = 5) -> Dict[Tuple[str, str], int]:
    """
    키워드 간 공동 등장 빈도 계산
    """
    cooccurrence = defaultdict(int)
    keyword_set = set(keywords.keys())
    
    # 부정 리뷰만 사용
    negative_reviews = [r for r in reviews if r.get('sentiment', '').strip() == '부정']
    
    for review in negative_reviews:
        content = review.get('content', '')
        words = re.findall(r'[가-힣]{2,6}', content)
        
        # 키워드만 필터링
        review_keywords = [w for w in words if w in keyword_set]
        
        # 윈도우 내 키워드 쌍 계산
        for i, word1 in enumerate(review_keywords):
            for j in range(i + 1, min(i + window_size + 1, len(review_keywords))):
                word2 = review_keywords[j]
                if word1 != word2:
                    pair = tuple(sorted([word1, word2]))
                    cooccurrence[pair] += 1
    
    return dict(cooccurrence)

def calculate_pmi(cooccurrence: Dict[Tuple[str, str], int], keyword_freq: Dict[str, int], total_words: int) -> Dict[Tuple[str, str], float]:
    """
    PMI (Pointwise Mutual Information) 계산
    """
    pmi_scores = {}
    
    for (word1, word2), cooc_count in cooccurrence.items():
        if cooc_count < 2:  # 최소 공동 등장 빈도
            continue
            
        # PMI 계산
        p_xy = cooc_count / total_words
        p_x = keyword_freq[word1] / total_words
        p_y = keyword_freq[word2] / total_words
        
        if p_x > 0 and p_y > 0:
            pmi = math.log(p_xy / (p_x * p_y))
            if pmi > 0:  # 양의 PMI만 사용
                pmi_scores[(word1, word2)] = pmi
    
    return pmi_scores

def gpt_clustering_analysis(keywords: Dict[str, int]) -> List[Dict]:
    """
    GPT를 통한 UX 중심 클러스터링
    """
    if not keywords:
        return []
    
    # 키워드 리스트 준비
    keyword_list = list(keywords.keys())
    
    # GPT 프롬프트 생성
    prompt = f"""
    당신은 UX 전문가입니다. 다음 부정 리뷰에서 추출된 키워드들을 분석하여 
    UX 사용성 중심의 문제 유형으로 2-4개 클러스터로 분류해주세요.

    키워드: {', '.join(keyword_list)}

    각 클러스터에 대해 다음 형식으로 응답해주세요:
    {{
        "clusters": [
            {{
                "name": "기기 호환성 문제",
                "keywords": ["통화", "연결", "끊어짐"]
            }},
            {{
                "name": "설정의 복잡성",
                "keywords": ["설정", "메뉴", "복잡"]
            }}
        ]
    }}

    클러스터명은 UX 관점에서 명확하고 구체적이어야 합니다.
    """
    
    try:
        if requests is not None:
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {os.environ.get("OPENAI_API_KEY")}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'gpt-4o-mini',
                    'messages': [
                        {'role': 'system', 'content': '당신은 UX 전문가입니다.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    'response_format': {'type': 'json_object'},
                    'max_tokens': 500,
                    'temperature': 0.3
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                clusters_data = json.loads(content)
                return clusters_data.get('clusters', [])
        
        # GPT 실패시 기본 클러스터링
        return create_fallback_clusters(keywords)
        
    except Exception as e:
        print(f"GPT 클러스터링 실패: {e}", file=sys.stderr)
        return create_fallback_clusters(keywords)

def create_fallback_clusters(keywords: Dict[str, int]) -> List[Dict]:
    """
    GPT 실패시 기본 클러스터링
    """
    # 키워드를 빈도순으로 정렬
    sorted_keywords = sorted(keywords.items(), key=lambda x: x[1], reverse=True)
    
    # 간단한 클러스터 생성
    clusters = []
    cluster_size = max(3, len(sorted_keywords) // 3)
    
    for i in range(0, len(sorted_keywords), cluster_size):
        cluster_keywords = [kw for kw, _ in sorted_keywords[i:i+cluster_size]]
        if cluster_keywords:
            cluster_name = f"문제 유형 {len(clusters) + 1}"
            clusters.append({
                'name': cluster_name,
                'keywords': cluster_keywords
            })
    
    return clusters

def create_portfolio_visualization_data(keywords: Dict[str, int], clusters: List[Dict], pmi_scores: Dict[Tuple[str, str], float]) -> Dict[str, Any]:
    """
    포트폴리오 스타일 시각화 데이터 생성
    """
    # 클러스터 색상 팔레트 (파스텔 톤)
    cluster_colors = [
        '#FFE5E5',  # 연한 분홍
        '#E5F3FF',  # 연한 파랑
        '#E5FFE5',  # 연한 초록
        '#FFF5E5',  # 연한 주황
        '#F0E5FF',  # 연한 보라
        '#E5FFF5'   # 연한 민트
    ]
    
    nodes = []
    edges = []
    cluster_info = []
    
    # 클러스터별 노드 생성
    for cluster_idx, cluster in enumerate(clusters):
        cluster_name = cluster['name']
        cluster_keywords = cluster['keywords']
        
        # 클러스터 정보 저장
        cluster_info.append({
            'id': cluster_idx,
            'name': cluster_name,
            'color': cluster_colors[cluster_idx % len(cluster_colors)],
            'keywords': cluster_keywords,
            'keyword_count': len(cluster_keywords)
        })
        
        # 클러스터 내 키워드 노드 생성
        for keyword in cluster_keywords:
            if keyword in keywords:
                nodes.append({
                    'id': keyword,
                    'label': keyword,
                    'size': min(50, max(20, keywords[keyword] * 10)),  # 빈도에 따른 크기
                    'frequency': keywords[keyword],
                    'cluster': cluster_idx,
                    'color': cluster_colors[cluster_idx % len(cluster_colors)]
                })
    
    # 엣지 생성 (PMI 기반)
    for (word1, word2), pmi in pmi_scores.items():
        if pmi > 0.1:  # 임계값 설정
            edges.append({
                'source': word1,
                'target': word2,
                'weight': pmi,
                'width': min(5, max(1, pmi * 2))  # PMI에 따른 선 굵기
            })
    
    return {
        'nodes': nodes,
        'edges': edges,
        'clusters': cluster_info,
        'stats': {
            'total_nodes': len(nodes),
            'total_edges': len(edges),
            'total_clusters': len(clusters),
            'analysis_type': 'negative_reviews'
        }
    }

def analyze_negative_keyword_network(reviews: List[Dict]) -> Dict[str, Any]:
    """
    부정 리뷰 기반 키워드 네트워크 분석 메인 함수
    """
    try:
        print("부정 리뷰 기반 키워드 네트워크 분석 시작...", file=sys.stderr)
        print(f"전체 리뷰 수: {len(reviews)}", file=sys.stderr)
        
        # 부정 리뷰 개수 확인
        negative_reviews = [r for r in reviews if r.get('sentiment', '').strip() == '부정']
        print(f"부정 리뷰 수: {len(negative_reviews)}", file=sys.stderr)
        
        # 1. 부정 리뷰에서 상위 20개 키워드 추출
        keywords = extract_negative_keywords(reviews)
        
        if not keywords:
            print("부정 리뷰에서 키워드를 찾을 수 없습니다.", file=sys.stderr)
            print("감정 분포:", {
                sentiment: len([r for r in reviews if r.get('sentiment', '').strip() == sentiment])
                for sentiment in ['긍정', '부정', '중립']
            }, file=sys.stderr)
            return {
                'nodes': [],
                'edges': [],
                'clusters': [],
                'stats': {
                    'total_nodes': 0,
                    'total_edges': 0,
                    'total_clusters': 0,
                    'analysis_type': 'negative_reviews',
                    'total_reviews': len(reviews),
                    'negative_reviews': len(negative_reviews)
                }
            }
        
        # 2. 키워드 간 공동 등장 분석
        cooccurrence = calculate_cooccurrence_matrix(reviews, keywords)
        
        # 3. PMI 계산
        total_words = sum(keywords.values())
        pmi_scores = calculate_pmi(cooccurrence, keywords, total_words)
        
        # 4. GPT 클러스터링
        clusters = gpt_clustering_analysis(keywords)
        
        # 5. 포트폴리오 스타일 시각화 데이터 생성
        visualization_data = create_portfolio_visualization_data(keywords, clusters, pmi_scores)
        
        print(f"분석 완료: {len(keywords)}개 키워드, {len(clusters)}개 클러스터", file=sys.stderr)
        
        return visualization_data
        
    except Exception as e:
        print(f"분석 오류: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {
            'nodes': [],
            'edges': [],
            'clusters': [],
            'stats': {
                'total_nodes': 0,
                'total_edges': 0,
                'total_clusters': 0,
                'analysis_type': 'negative_reviews'
            }
        }

def main():
    """
    메인 함수
    """
    if len(sys.argv) != 2:
        print("Usage: python negative_keyword_analysis.py <reviews_file_path>", file=sys.stderr)
        sys.exit(1)
    
    reviews_file_path = sys.argv[1]
    
    try:
        # 리뷰 데이터 로드
        with open(reviews_file_path, 'r', encoding='utf-8') as f:
            reviews = json.load(f)
        
        # 분석 실행
        result = analyze_negative_keyword_network(reviews)
        
        # 결과 출력
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # 임시 파일 정리
        try:
            os.remove(reviews_file_path)
        except:
            pass
        
    except Exception as e:
        import traceback
        print(f"Error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()