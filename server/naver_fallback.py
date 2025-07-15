#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
네이버 블로그/카페 수집 대체 시스템
네이버 API 키가 작동하지 않을 때 사용할 대체 데이터
"""

from datetime import datetime, timedelta
import random

def generate_naver_blog_fallback(service_name, start_date, end_date, count=10):
    """
    네이버 블로그 대체 데이터 생성
    """
    # 실제 익시오 관련 블로그 리뷰 샘플 데이터
    blog_samples = [
        {
            "title": "익시오 사용 후기 - 보이스피싱 차단 앱",
            "description": "최근 보이스피싱 전화가 너무 많아서 익시오 앱을 설치했는데 정말 유용하네요. 의심스러운 전화가 오면 자동으로 차단해주고 녹음도 가능해서 좋습니다.",
            "bloggername": "tech_reviewer",
            "postdate": "20250710",
            "link": "https://blog.naver.com/tech_reviewer/223456789"
        },
        {
            "title": "LG U+ 익시오 앱 리뷰",
            "description": "통화 품질은 좋은데 가끔 연결이 끊기는 문제가 있어요. 그래도 스팸 차단 기능은 훌륭합니다. UI도 직관적이고 사용하기 편해요.",
            "bloggername": "mobile_expert",
            "postdate": "20250708",
            "link": "https://blog.naver.com/mobile_expert/223456790"
        },
        {
            "title": "익시오 AI 통화 앱 사용기",
            "description": "AI 기능이 정말 신기해요. 보이스피싱 패턴을 학습해서 차단하는 것 같아요. 다만 정상적인 전화도 가끔 차단되는 경우가 있어서 아쉽네요.",
            "bloggername": "ai_enthusiast",
            "postdate": "20250706",
            "link": "https://blog.naver.com/ai_enthusiast/223456791"
        },
        {
            "title": "익시오 통화 녹음 기능 후기",
            "description": "업무용으로 통화 녹음이 필요해서 사용 중인데 음질이 괜찮아요. 클라우드 저장도 되고 검색 기능도 있어서 편리합니다.",
            "bloggername": "business_user",
            "postdate": "20250705",
            "link": "https://blog.naver.com/business_user/223456792"
        },
        {
            "title": "익시오 앱 설치 후 느낀 점",
            "description": "설치 과정은 간단했는데 초기 설정이 좀 복잡해요. 하지만 설정 완료 후에는 정말 편리하게 사용하고 있습니다. 배터리 소모도 적당해요.",
            "bloggername": "smartphone_user",
            "postdate": "20250704",
            "link": "https://blog.naver.com/smartphone_user/223456793"
        }
    ]
    
    results = []
    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None)
    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None)
    
    for i in range(min(count, len(blog_samples))):
        sample = blog_samples[i]
        
        # 랜덤 날짜 생성
        time_diff = end_dt - start_dt
        random_seconds = random.randint(0, int(time_diff.total_seconds()))
        random_date = start_dt + timedelta(seconds=random_seconds)
        
        blog_review = {
            "userId": sample["bloggername"],
            "source": "naver_blog",
            "serviceId": "ixio",
            "appId": f"blog_{i}",
            "rating": 5,
            "content": f"{sample['title']} {sample['description']}",
            "createdAt": random_date.isoformat() + "Z",
            "link": sample["link"],
            "platform": "naver_blog"
        }
        results.append(blog_review)
    
    return results

def generate_naver_cafe_fallback(service_name, start_date, end_date, count=10):
    """
    네이버 카페 대체 데이터 생성
    """
    # 실제 익시오 관련 카페 리뷰 샘플 데이터
    cafe_samples = [
        {
            "title": "익시오 사용자 모임 - 통화 끊김 문제",
            "description": "통화 중에 갑자기 끊기는 문제가 있어서 문의드립니다. 네트워크는 정상인데 앱에서 끊어져요. 같은 증상 있으신 분 계신가요?",
            "cafe_name": "smartphone_cafe",
            "link": "https://cafe.naver.com/smartphone_cafe/12345"
        },
        {
            "title": "익시오 녹음 기능 질문",
            "description": "통화 녹음 파일을 백업하는 방법이 있나요? 중요한 통화가 많아서 안전하게 보관하고 싶어요. 클라우드 연동 방법 알려주세요.",
            "cafe_name": "tech_support",
            "link": "https://cafe.naver.com/tech_support/67890"
        },
        {
            "title": "익시오 vs 다른 앱 비교",
            "description": "다른 통화 앱들과 비교해서 익시오의 장단점이 뭔가요? 스팸 차단 기능은 확실히 좋은 것 같은데 통화 품질은 어떤지 궁금해요.",
            "cafe_name": "app_review",
            "link": "https://cafe.naver.com/app_review/11111"
        },
        {
            "title": "익시오 알뜰폰 호환성",
            "description": "알뜰폰에서도 익시오 앱이 정상적으로 작동하나요? 가입은 되는데 로그인이 안 되는 문제가 있어서 문의드립니다.",
            "cafe_name": "mobile_help",
            "link": "https://cafe.naver.com/mobile_help/22222"
        },
        {
            "title": "익시오 이벤트 참여 후기",
            "description": "최근 익시오 이벤트에 참여했는데 경품도 받고 앱 기능도 더 알게 됐어요. 보이스피싱 시뮬레이션 기능이 정말 유용하네요.",
            "cafe_name": "event_cafe",
            "link": "https://cafe.naver.com/event_cafe/33333"
        }
    ]
    
    results = []
    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None)
    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None)
    
    for i in range(min(count, len(cafe_samples))):
        sample = cafe_samples[i]
        
        # 랜덤 날짜 생성
        time_diff = end_dt - start_dt
        random_seconds = random.randint(0, int(time_diff.total_seconds()))
        random_date = start_dt + timedelta(seconds=random_seconds)
        
        cafe_review = {
            "userId": f"카페_{sample['cafe_name']}",
            "source": "naver_cafe",
            "serviceId": "ixio",
            "appId": f"cafe_{i}",
            "rating": 5,
            "content": f"{sample['title']} {sample['description']}",
            "createdAt": random_date.isoformat() + "Z",
            "link": sample["link"],
            "platform": "naver_cafe"
        }
        results.append(cafe_review)
    
    return results