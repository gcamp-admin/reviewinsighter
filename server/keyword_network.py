#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
키워드 네트워크 분석 및 클러스터링 모듈
"""

import re
import json
import math
import sys
from collections import defaultdict, Counter
from itertools import combinations
import requests

# Use regex-based approach for better compatibility
USE_KONLPY = False

def extract_keywords_from_reviews(reviews, min_freq=1):
    """
    리뷰에서 키워드를 추출하고 빈도 계산
    
    Args:
        reviews: 리뷰 리스트
        min_freq: 최소 빈도
        
    Returns:
        키워드 빈도 딕셔너리
    """
    try:
        keyword_freq = Counter()
        
        # 불용어 리스트 (앱 관련 일반적인 단어들)
        stopwords = {
            '익시오', '앱', '어플', '애플리케이션', '앱스', '어플리케이션', '유플러스', 'LG',
            '사용', '사용자', '아직', '이번', '조금', '정말', '너무', '그냥', '다시',
            '하지만', '그래서', '그리고', '또한', '이것', '그것', '이제', '다음',
            '처음', '마지막', '지금', '오늘', '내일', '어제', '하루', '시간',
            '무엇', '어떤', '어디', '언제', '누구', '어떻게', '왜', '얼마나',
            '거의', '많이', '조금', '전혀', '항상', '때때로', '가끔', '자주',
            '빨리', '천천히', '쉽게', '어렵게', '좋게', '나쁘게', '잘못',
            '계속', '중단', '시작', '끝', '중간', '앞', '뒤', '위', '아래',
            '특히', '주로', '대부분', '일부', '전부', '모든', '각각', '서로',
            '있다', '없다', '된다', '안된다', '한다', '안한다', '같다', '다르다',
            '보다', '말다', '가다', '오다', '살다', '죽다', '먹다', '마시다',
            '것', '거', '게', '수', '데', '지', '해', '해서', '하여', '하고',
            '했다', '할', '함', '한', '해야', '하면', '하니', '하자', '하여야',
            '사람', '분', '님', '자', '씨', '개', '명', '번', '회', '차'
        }
        
        for review in reviews:
            content = review.get('content', '')
            
            # 정규식 기반 키워드 추출
            nouns = extract_keywords_regex(content)
            
            # 키워드 필터링 및 정제
            for noun in nouns:
                # 길이 필터링 (2-8자)
                if len(noun) < 2 or len(noun) > 8:
                    continue
                    
                # 불용어 제거
                if noun in stopwords:
                    continue
                    
                # 숫자만 있는 경우 제거
                if noun.isdigit():
                    continue
                    
                # 특수문자 제거
                if re.search(r'[^가-힣a-zA-Z0-9]', noun):
                    continue
                    
                keyword_freq[noun] += 1
        
        # 최소 빈도 이상의 키워드만 반환
        filtered_keywords = {k: v for k, v in keyword_freq.items() if v >= min_freq}
        

        
        return filtered_keywords
        
    except Exception as e:
        return {}

def extract_keywords_regex(text):
    """
    정규식 기반 키워드 추출 (KoNLPy 대안)
    
    Args:
        text: 분석할 텍스트
        
    Returns:
        키워드 리스트
    """
    keywords = []
    
    # 특정 키워드 패턴 추가 (앱 관련)
    app_keywords = [
        '통화', '연결', '끊김', '음성', '화질', '소리', '볼륨', '진동',
        '로딩', '속도', '느림', '빠름', '반응', '지연', '멈춤', '튕김',
        '인터페이스', '화면', '버튼', '메뉴', '아이콘', '디자인', '레이아웃',
        '기능', '설정', '옵션', '편의', '사용성', '직관', '복잡', '간단',
        '배터리', '발열', '과열', '소모', '충전', '성능', '메모리',
        '업데이트', '버전', '오류', '버그', '문제', '개선', '수정',
        '보안', '안전', '인증', '로그인', '비밀번호', '개인정보',
        '알림', '푸시', '메시지', '경고', '안내', '표시', '출력',
        '품질', '안정', '시간', '크기', '터치', '정확', '데이터',
        '녹음', '재인증', '번거', '유용', '만족', '어려', '걱정',
        '깔끔', '헷갈', '편리', '강화', '안심', '불편', '좋음',
        '나쁨', '문제점', '개선점', '장점', '단점', '효과', '결과'
    ]
    
    # 키워드 직접 검색
    for keyword in app_keywords:
        if keyword in text:
            keywords.append(keyword)
    
    # 간단한 한글 명사 패턴 추가
    korean_words = re.findall(r'[가-힣]{2,6}', text)
    for word in korean_words:
        # 동사/형용사 어미 제거
        word = re.sub(r'(하다|되다|이다|았다|었다|했다|든다|ㄴ다|다가|다고|다는|다면|다고|다네|다니|다만|다보니|다시|다음|다음에|다음엔|다음은|다음이|다음을|다음으로|다음에는|다음에도|다음에만|다음에서|다음에야|다음에는|다음에도|다음에만|다음에서|다음에야)$', '', word)
        word = re.sub(r'(습니다|ㅂ니다|이에요|예요|해요|세요|네요|데요|군요|구나|구만|구먼|구려|구나|구만|구먼|구려)$', '', word)
        
        if len(word) >= 2 and word not in ['하지', '그런', '이런', '저런', '그래', '이래', '저래', '아니', '맞음', '틀림']:
            keywords.append(word)
    
    return list(set(keywords))  # 중복 제거

def calculate_cooccurrence(reviews, keywords, window_size=10):
    """
    키워드 간 동시 출현 빈도 계산
    
    Args:
        reviews: 리뷰 리스트
        keywords: 키워드 리스트
        window_size: 윈도우 크기
        
    Returns:
        동시 출현 행렬
    """
    cooccurrence = defaultdict(lambda: defaultdict(int))
    
    for review in reviews:
        content = review.get('content', '')
        words = content.split()
        
        # 윈도우 내에서 키워드 동시 출현 계산
        for i, word1 in enumerate(words):
            if word1 in keywords:
                for j in range(max(0, i-window_size), min(len(words), i+window_size+1)):
                    word2 = words[j]
                    if word2 in keywords and word1 != word2:
                        cooccurrence[word1][word2] += 1
    
    return cooccurrence

def calculate_pmi(cooccurrence, keyword_freq, total_words):
    """
    PMI(Pointwise Mutual Information) 계산
    
    Args:
        cooccurrence: 동시 출현 행렬
        keyword_freq: 키워드 빈도
        total_words: 전체 단어 수
        
    Returns:
        PMI 행렬
    """
    pmi_matrix = defaultdict(lambda: defaultdict(float))
    
    for word1 in cooccurrence:
        for word2 in cooccurrence[word1]:
            if word1 != word2:
                # P(word1, word2)
                p_xy = cooccurrence[word1][word2] / total_words
                
                # P(word1) * P(word2)
                p_x = keyword_freq[word1] / total_words
                p_y = keyword_freq[word2] / total_words
                
                # PMI 계산
                if p_x > 0 and p_y > 0 and p_xy > 0:
                    pmi = math.log(p_xy / (p_x * p_y))
                    pmi_matrix[word1][word2] = max(0, pmi)  # 음수 PMI는 0으로
    
    return pmi_matrix

def create_network_data(keywords, cooccurrence, pmi_matrix, min_edge_weight=1):
    """
    네트워크 데이터 생성
    
    Args:
        keywords: 키워드 빈도 딕셔너리
        cooccurrence: 동시 출현 행렬
        pmi_matrix: PMI 행렬
        min_edge_weight: 최소 엣지 가중치
        
    Returns:
        네트워크 데이터 (nodes, edges)
    """
    # 상위 30개 키워드만 선택
    top_keywords = dict(sorted(keywords.items(), key=lambda x: x[1], reverse=True)[:30])
    
    # 노드 데이터 생성
    nodes = []
    for keyword, freq in top_keywords.items():
        nodes.append({
            'id': keyword,
            'label': keyword,
            'size': freq,
            'frequency': freq
        })
    
    # 엣지 데이터 생성
    edges = []
    edge_id = 0
    
    for word1 in top_keywords:
        for word2 in top_keywords:
            if word1 != word2 and word1 in cooccurrence and word2 in cooccurrence[word1]:
                cooc_count = cooccurrence[word1][word2]
                pmi_score = pmi_matrix[word1][word2]
                
                if cooc_count >= min_edge_weight:
                    edges.append({
                        'id': edge_id,
                        'source': word1,
                        'target': word2,
                        'weight': cooc_count,
                        'pmi': pmi_score
                    })
                    edge_id += 1
    
    return nodes, edges

def simple_clustering(nodes, edges, min_cluster_size=3):
    """
    간단한 클러스터링 알고리즘 (연결된 컴포넌트 기반)
    
    Args:
        nodes: 노드 리스트
        edges: 엣지 리스트
        min_cluster_size: 최소 클러스터 크기
        
    Returns:
        클러스터 정보가 포함된 노드 리스트
    """
    # 그래프 구성
    graph = defaultdict(set)
    for edge in edges:
        graph[edge['source']].add(edge['target'])
        graph[edge['target']].add(edge['source'])
    
    # 연결된 컴포넌트 찾기
    visited = set()
    clusters = []
    
    def dfs(node, cluster):
        if node in visited:
            return
        visited.add(node)
        cluster.append(node)
        for neighbor in graph[node]:
            dfs(neighbor, cluster)
    
    for node_data in nodes:
        node = node_data['id']
        if node not in visited:
            cluster = []
            dfs(node, cluster)
            if len(cluster) >= min_cluster_size:
                clusters.append(cluster)
    
    # 클러스터 정보를 노드에 추가
    cluster_colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9']
    
    for i, node_data in enumerate(nodes):
        node_data['cluster'] = -1  # 기본값: 클러스터 없음
        node_data['color'] = '#CCCCCC'  # 기본 색상
        
        for cluster_idx, cluster in enumerate(clusters):
            if node_data['id'] in cluster:
                node_data['cluster'] = cluster_idx
                node_data['color'] = cluster_colors[cluster_idx % len(cluster_colors)]
                break
    
    return nodes, clusters

def generate_cluster_labels_with_gpt(clusters, keywords):
    """
    GPT를 사용하여 클러스터 라벨 생성
    
    Args:
        clusters: 클러스터 리스트
        keywords: 키워드 빈도 딕셔너리
        
    Returns:
        클러스터 라벨 딕셔너리
    """
    cluster_labels = {}
    
    for cluster_idx, cluster in enumerate(clusters):
        # 클러스터 내 키워드들을 빈도순으로 정렬
        cluster_keywords = sorted(cluster, key=lambda x: keywords.get(x, 0), reverse=True)
        
        try:
            # GPT API 호출
            response = requests.post(
                'http://localhost:5000/api/generate-cluster-label',
                json={'keywords': cluster_keywords[:10]},  # 상위 10개만
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                cluster_labels[cluster_idx] = data.get('label', f'클러스터 {cluster_idx + 1}')
            else:
                cluster_labels[cluster_idx] = f'클러스터 {cluster_idx + 1}'
                
        except Exception as e:
            cluster_labels[cluster_idx] = f'클러스터 {cluster_idx + 1}'
    
    return cluster_labels

def analyze_keyword_network(reviews, method='cooccurrence'):
    """
    키워드 네트워크 분석 메인 함수
    
    Args:
        reviews: 리뷰 리스트
        method: 분석 방법 ('cooccurrence' 또는 'pmi')
        
    Returns:
        네트워크 분석 결과
    """
    if len(reviews) < 10:
        return {
            'error': '데이터 부족',
            'message': '네트워크 분석을 위해서는 최소 10개 이상의 리뷰가 필요합니다.'
        }
    

    
    # 1. 키워드 추출
    keywords = extract_keywords_from_reviews(reviews)
    if len(keywords) < 3:
        return {
            'error': '키워드 부족',
            'message': '분석할 키워드가 부족합니다. 더 많은 리뷰가 필요합니다.'
        }
    
    # 2. 동시 출현 계산
    cooccurrence = calculate_cooccurrence(reviews, keywords)
    
    # 3. PMI 계산 (필요한 경우)
    total_words = sum(len(review.get('content', '').split()) for review in reviews)
    pmi_matrix = calculate_pmi(cooccurrence, keywords, total_words)
    
    # 4. 네트워크 데이터 생성
    nodes, edges = create_network_data(keywords, cooccurrence, pmi_matrix)
    
    if len(edges) < 3:
        return {
            'error': '연결 부족',
            'message': '키워드 간 연결이 부족합니다. 더 다양한 리뷰가 필요합니다.'
        }
    
    # 5. 클러스터링
    nodes, clusters = simple_clustering(nodes, edges)
    
    # 6. 클러스터 라벨 생성
    cluster_labels = generate_cluster_labels_with_gpt(clusters, keywords)
    
    return {
        'nodes': nodes,
        'edges': edges,
        'clusters': clusters,
        'cluster_labels': cluster_labels,
        'stats': {
            'total_keywords': len(keywords),
            'total_nodes': len(nodes),
            'total_edges': len(edges),
            'total_clusters': len(clusters)
        }
    }

def main():
    """메인 함수 - 명령줄 인자로 실행"""
    try:
        # 명령줄 인자 처리
        if len(sys.argv) < 2:
            # 테스트 데이터
            test_reviews = [
                {'content': '앱이 너무 느려요. 로딩 시간이 오래 걸리고 버그가 많습니다.'},
                {'content': '통화 품질이 좋지 않고 끊김 현상이 자주 발생합니다.'},
                {'content': '사용하기 편리하고 기능이 많아서 만족합니다.'},
                {'content': '인터페이스가 복잡하고 메뉴를 찾기 어렵습니다.'},
                {'content': '배터리 소모가 심하고 앱이 자주 멈춥니다.'}
            ]
            
            result = analyze_keyword_network(test_reviews)
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return
        
        # JSON 인자 파싱
        args_str = sys.argv[1]
        args = json.loads(args_str)
        
        reviews = args.get('reviews', [])
        method = args.get('method', 'cooccurrence')
        
        if not reviews:
            print(json.dumps({
                'error': '데이터 없음',
                'message': '분석할 리뷰 데이터가 없습니다.'
            }, ensure_ascii=False))
            return
        
        # 키워드 네트워크 분석 실행
        result = analyze_keyword_network(reviews, method)
        
        # 결과 출력
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'error': 'JSON 파싱 오류',
            'message': f'입력 데이터를 처리할 수 없습니다: {str(e)}'
        }, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            'error': '분석 오류',
            'message': f'키워드 네트워크 분석 중 오류가 발생했습니다: {str(e)}'
        }, ensure_ascii=False))

if __name__ == "__main__":
    main()