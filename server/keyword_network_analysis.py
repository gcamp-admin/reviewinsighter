#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
완전히 재구현된 키워드 네트워크 분석 시스템
- 리뷰 데이터로부터 키워드 추출
- 키워드 간 공동 등장 분석 (Co-occurrence) 및 PMI 계산
- 커뮤니티 탐지 기반 클러스터링
- GPT를 통한 UX 인사이트 중심 클러스터 라벨링
- 시각화를 위한 네트워크 데이터 생성
"""

import re
import json
import math
import sys
import os
from collections import defaultdict, Counter
from itertools import combinations
from typing import Dict, List, Tuple, Any

# NetworkX 설치 확인
try:
    import networkx as nx
except ImportError:
    print("NetworkX not installed. Installing basic graph functionality.", file=sys.stderr)
    # NetworkX 없이 기본 그래프 기능으로 대체
    nx = None

# requests 설치 확인
try:
    import requests
except ImportError:
    print("Requests not installed. Using basic HTTP functionality.", file=sys.stderr)
    requests = None

def extract_meaningful_keywords(reviews: List[Dict]) -> Dict[str, int]:
    """
    리뷰에서 의미있는 키워드를 추출하고 빈도를 계산
    """
    # 한국어 형태소 분석 대신 정규식 기반 키워드 추출
    keyword_freq = Counter()
    
    # 서비스 관련 불용어 (제외할 단어들)
    stopwords = {
        '익시오', '앱', '어플', '애플리케이션', '유플러스', 'LG', 'LGU', 'U+',
        '사용', '사용자', '좋다', '나쁘다', '괜찮다', '별로', '그냥', '정말',
        '너무', '조금', '많이', '아주', '가끔', '항상', '때문', '이제', '지금',
        '이번', '다음', '처음', '마지막', '하지만', '그래서', '그리고', '또한',
        '수', '있다', '없다', '된다', '한다', '같다', '다르다', '것', '거', '게',
        '서비스', '기능', '시스템', '개발', '업데이트', '버전', '설정', '화면',
        '메뉴', '버튼', '클릭', '터치', '선택', '입력', '출력', '실행', '종료'
    }
    
    for review in reviews:
        content = review.get('content', '')
        
        # 한글 명사 추출 (2-6자)
        korean_words = re.findall(r'[가-힣]{2,6}', content)
        
        # 의미있는 키워드 필터링
        for word in korean_words:
            # 불용어 제거
            if word in stopwords:
                continue
                
            # 의미있는 키워드 판별 (기술적 용어, 감정 표현, 기능 관련)
            if is_meaningful_keyword(word):
                keyword_freq[word] += 1
    
    # 최소 빈도 1 이상인 키워드만 선택 (더 관대하게)
    return {k: v for k, v in keyword_freq.items() if v >= 1}

def is_meaningful_keyword(word: str) -> bool:
    """
    키워드가 의미있는지 판단 (더 관대한 기준)
    """
    # 길이 제한 (2-6자)
    if len(word) < 2 or len(word) > 6:
        return False
    
    # 숫자만 있는 경우 제외
    if word.isdigit():
        return False
    
    # 의미있는 키워드 카테고리 (포함하는 방식으로 변경)
    meaningful_keywords = {
        # 통화 관련
        '통화', '전화', '연결', '끊김', '끊어', '수신', '발신', '벨소리',
        # 기능 관련
        '기능', '녹음', '음성', '소리', '볼륨', '알림', '메시지', '문자',
        # 품질 관련
        '품질', '속도', '느림', '빠름', '안정', '불안', '깨끗', '선명',
        # 오류 관련
        '오류', '버그', '문제', '에러', '실패', '작동', '멈춤', '충돌',
        # 사용성 관련
        '편리', '불편', '쉬움', '어려', '복잡', '간단', '직관', '사용',
        # 감정 표현
        '만족', '불만', '좋음', '나쁨', '훌륭', '최고', '최악', '답답',
        '스트레스', '도움', '유용', '쓸모', '필요', '개선', '수정',
        # UI/UX 관련
        '화면', '버튼', '메뉴', '설정', '디자인', '인터페이스', '레이아웃',
        # 성능 관련
        '빠름', '느림', '지연', '반응', '처리', '로딩', '시간', '대기'
    }
    
    # 직접 매칭
    if word in meaningful_keywords:
        return True
    
    # 부분 매칭 (키워드가 포함된 경우)
    for keyword in meaningful_keywords:
        if keyword in word or word in keyword:
            return True
    
    # 한글 2글자 이상이면 일단 포함 (너무 제한적이지 않도록)
    if len(word) >= 2 and all(ord('가') <= ord(c) <= ord('힣') for c in word):
        return True
    
    return False

def calculate_cooccurrence_matrix(reviews: List[Dict], keywords: Dict[str, int], window_size: int = 5) -> Dict[Tuple[str, str], int]:
    """
    키워드 간 공동 등장 빈도 계산
    """
    cooccurrence = defaultdict(int)
    keyword_set = set(keywords.keys())
    
    for review in reviews:
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

def simple_clustering_fallback(keywords: Dict[str, int], pmi_scores: Dict[Tuple[str, str], float]) -> List[List[str]]:
    """
    NetworkX 없이 기본 클러스터링
    """
    # 빈도 기반 간단한 클러스터링
    sorted_keywords = sorted(keywords.items(), key=lambda x: x[1], reverse=True)
    
    # 상위 키워드들을 클러스터로 분류
    clusters = []
    cluster_size = max(3, len(sorted_keywords) // 3)
    
    for i in range(0, len(sorted_keywords), cluster_size):
        cluster = [kw for kw, _ in sorted_keywords[i:i+cluster_size]]
        if cluster:
            clusters.append(cluster)
    
    return clusters

def detect_communities(keywords: Dict[str, int], pmi_scores: Dict[Tuple[str, str], float]) -> List[List[str]]:
    """
    NetworkX를 사용한 커뮤니티 탐지 (없으면 기본 클러스터링 사용)
    """
    if nx is None:
        # NetworkX 없이 기본 클러스터링
        return simple_clustering_fallback(keywords, pmi_scores)
    
    # 네트워크 그래프 생성
    G = nx.Graph()
    
    # 노드 추가
    for keyword, freq in keywords.items():
        G.add_node(keyword, frequency=freq)
    
    # 엣지 추가 (PMI 기반)
    for (word1, word2), pmi in pmi_scores.items():
        if pmi > 0.1:  # PMI 임계값
            G.add_edge(word1, word2, weight=pmi)
    
    # 커뮤니티 탐지
    try:
        import networkx.algorithms.community as nx_comm
        communities = list(nx_comm.greedy_modularity_communities(G))
        
        # 커뮤니티를 리스트로 변환
        community_list = []
        for community in communities:
            if len(community) >= 2:  # 최소 2개 이상의 키워드
                community_list.append(list(community))
        
        return community_list
    except:
        # 네트워크 기반 클러스터링 실패시 빈도 기반 그룹화
        return [list(keywords.keys())]

def generate_cluster_labels_with_gpt(communities: List[List[str]], keyword_freq: Dict[str, int]) -> Dict[int, str]:
    """
    GPT를 사용하여 각 클러스터에 UX 인사이트 중심의 라벨 생성
    """
    labels = {}
    
    for i, community in enumerate(communities):
        # 커뮤니티 내 키워드들을 빈도순으로 정렬
        sorted_keywords = sorted(community, key=lambda x: keyword_freq[x], reverse=True)
        top_keywords = sorted_keywords[:8]  # 상위 8개 키워드
        
        try:
            # GPT API 호출 (requests 사용 가능한 경우)
            if requests is not None:
                response = requests.post(
                    'http://localhost:5000/api/generate-cluster-label',
                    json={'keywords': top_keywords},
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    generated_label = result.get('label', f'클러스터 {i+1}').strip('"')
                    # UX 인사이트 중심으로 라벨 정제
                    labels[i] = clean_cluster_label(generated_label, top_keywords)
                else:
                    labels[i] = generate_fallback_label(top_keywords)
            else:
                # requests 없이 fallback 라벨 생성
                labels[i] = generate_fallback_label(top_keywords)
        except:
            # GPT 호출 실패시 대표 키워드 기반 라벨 생성
            labels[i] = generate_fallback_label(top_keywords)
    
    return labels

def clean_cluster_label(label: str, keywords: List[str]) -> str:
    """
    GPT가 생성한 라벨을 UX 인사이트 관점으로 정제
    """
    # 너무 긴 라벨을 줄임
    if len(label) > 12:
        # 키워드 기반으로 축약
        if any(k in label for k in ['통화', '전화', '연결']):
            return '통화 품질'
        elif any(k in label for k in ['화면', '버튼', '설정']):
            return 'UI/UX 개선'
        elif any(k in label for k in ['오류', '문제', '버그']):
            return '기능 안정성'
        elif any(k in label for k in ['편리', '불편', '사용']):
            return '사용성 개선'
        else:
            return label[:10] + '...'
    
    return label

def generate_fallback_label(keywords: List[str]) -> str:
    """
    GPT 호출 실패시 키워드 기반 라벨 생성
    """
    if not keywords:
        return '기타'
    
    # 대표 키워드 기반 카테고리 분류
    primary_keyword = keywords[0]
    
    if any(k in primary_keyword for k in ['통화', '전화', '연결', '수신', '발신']):
        return '통화 기능'
    elif any(k in primary_keyword for k in ['화면', '버튼', '메뉴', '설정']):
        return 'UI 요소'
    elif any(k in primary_keyword for k in ['오류', '문제', '버그', '실패']):
        return '안정성 문제'
    elif any(k in primary_keyword for k in ['음성', '소리', '녹음', '볼륨']):
        return '음성 품질'
    elif any(k in primary_keyword for k in ['편리', '불편', '사용', '조작']):
        return '사용성'
    else:
        return f'{primary_keyword} 관련'

def create_network_visualization_data(
    keywords: Dict[str, int],
    pmi_scores: Dict[Tuple[str, str], float],
    communities: List[List[str]],
    cluster_labels: Dict[int, str]
) -> Dict[str, Any]:
    """
    시각화를 위한 네트워크 데이터 생성
    """
    # 키워드를 클러스터에 매핑
    keyword_to_cluster = {}
    for cluster_id, community in enumerate(communities):
        for keyword in community:
            keyword_to_cluster[keyword] = cluster_id
    
    # 노드 데이터 생성
    nodes = []
    max_freq = max(keywords.values()) if keywords else 1
    
    for keyword, freq in keywords.items():
        cluster_id = keyword_to_cluster.get(keyword, 0)
        node = {
            'id': keyword,
            'label': keyword,
            'size': max(10, int(30 * freq / max_freq)),  # 빈도에 따른 크기
            'frequency': freq,
            'cluster': cluster_id
        }
        nodes.append(node)
    
    # 엣지 데이터 생성
    edges = []
    edge_id = 0
    max_pmi = max(pmi_scores.values()) if pmi_scores else 1
    
    for (word1, word2), pmi in pmi_scores.items():
        if pmi > 0.1:  # PMI 임계값
            edge = {
                'id': edge_id,
                'source': word1,
                'target': word2,
                'weight': max(1, int(10 * pmi / max_pmi)),  # PMI에 따른 가중치
                'pmi': pmi
            }
            edges.append(edge)
            edge_id += 1
    
    # 클러스터 데이터 생성
    clusters = []
    for cluster_id, community in enumerate(communities):
        cluster = {
            'id': cluster_id,
            'keywords': community,
            'size': len(community),
            'label': cluster_labels.get(cluster_id, f'클러스터 {cluster_id+1}')
        }
        clusters.append(cluster)
    
    return {
        'nodes': nodes,
        'edges': edges,
        'clusters': clusters,
        'stats': {
            'total_nodes': len(nodes),
            'total_edges': len(edges),
            'total_clusters': len(clusters)
        }
    }

def analyze_keyword_network(reviews: List[Dict]) -> Dict[str, Any]:
    """
    키워드 네트워크 분석 메인 함수
    """
    if not reviews:
        return {
            'nodes': [],
            'edges': [],
            'clusters': [],
            'stats': {'total_nodes': 0, 'total_edges': 0, 'total_clusters': 0}
        }
    
    # print(f"Starting keyword network analysis for {len(reviews)} reviews")
    
    # 1. 키워드 추출
    keywords = extract_meaningful_keywords(reviews)
    # 디버깅 정보 제거
    
    if len(keywords) < 3:
        return {
            'nodes': [],
            'edges': [],
            'clusters': [],
            'stats': {'total_nodes': 0, 'total_edges': 0, 'total_clusters': 0},
            'message': '키워드가 부족하여 네트워크 분석을 수행할 수 없습니다. 더 많은 리뷰를 수집하거나 날짜 범위를 확장해주세요.'
        }
    
    # 2. 공동 등장 분석
    total_words = sum(keywords.values())
    cooccurrence = calculate_cooccurrence_matrix(reviews, keywords)
    # print(f"Calculated co-occurrence for {len(cooccurrence)} keyword pairs")
    
    # 3. PMI 계산
    pmi_scores = calculate_pmi(cooccurrence, keywords, total_words)
    # print(f"Calculated PMI for {len(pmi_scores)} keyword pairs")
    
    # 4. 커뮤니티 탐지
    communities = detect_communities(keywords, pmi_scores)
    # print(f"Detected {len(communities)} communities")
    
    # 5. GPT 클러스터 라벨링
    cluster_labels = generate_cluster_labels_with_gpt(communities, keywords)
    # print(f"Generated labels for {len(cluster_labels)} clusters")
    
    # 6. 시각화 데이터 생성
    network_data = create_network_visualization_data(keywords, pmi_scores, communities, cluster_labels)
    
    return network_data

def main():
    """
    명령줄에서 실행 시 사용
    """
    if len(sys.argv) < 2:
        print("Usage: python keyword_network_analysis.py <reviews_file_path>")
        sys.exit(1)
    
    try:
        reviews_file_path = sys.argv[1]
        
        # 파일에서 리뷰 데이터 읽기
        with open(reviews_file_path, 'r', encoding='utf-8') as f:
            reviews = json.load(f)
        
        result = analyze_keyword_network(reviews)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # 임시 파일 정리
        try:
            import os
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