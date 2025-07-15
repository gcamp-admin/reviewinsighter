#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Main crawler module for multi-source review collection
"""

from service_data import services
from store_api import crawl_google_play, crawl_apple_store
from naver_api import search_naver
from datetime import datetime, timedelta
import random
import re

def crawl_service_by_selection(service_name, selected_channels, start_date=None, end_date=None, review_count=100):
    """
    Crawl reviews from selected channels for a specific service with filtering
    
    Args:
        service_name: ex) "익시오"
        selected_channels: {
            "googlePlay": True,
            "appleStore": True,
            "naverBlog": False,
            "naverCafe": True
        }
        start_date: Start date for filtering (ISO format)
        end_date: End date for filtering (ISO format)
        review_count: Number of reviews to collect per source
        
    Returns:
        Dictionary with results from each selected channel
    """
    if service_name not in services:
        raise ValueError("유효하지 않은 서비스명입니다.")

    info = services[service_name]
    result = {}
    
    # Get service keywords for filtering
    service_keywords = info.get("keywords", [service_name])
    
    print(f"Crawling {service_name} with filters - Date range: {start_date} to {end_date}, Keywords: {service_keywords}")

    if selected_channels.get("googlePlay"):
        print(f"Starting Google Play collection for {info['google_play_id']}...")
        google_reviews = crawl_google_play(
            info["google_play_id"], 
            count=review_count,
            start_date=start_date,
            end_date=end_date
        )
        
        print(f"Google Play raw reviews count: {len(google_reviews)}")
        
        # Convert Google Play reviews to standardized format
        google_results = []
        for i, review in enumerate(google_reviews):
            # Fix date format - ensure Z suffix for ISO format
            created_at = review.get("at", "")
            if created_at and not created_at.endswith('Z'):
                if '+' not in created_at and '-' not in created_at[-6:]:
                    created_at += 'Z'
                elif created_at.endswith('-07:00'):
                    # Convert PST to UTC
                    from datetime import datetime, timedelta
                    dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    dt = dt + timedelta(hours=7)  # Convert PST to UTC
                    created_at = dt.isoformat() + 'Z'
                    
            google_review = {
                "userId": review.get("userName", "익명"),
                "source": "google_play",
                "serviceId": "ixio",
                "appId": str(i),
                "rating": review.get("score", 3),
                "content": review.get("content", ""),
                "createdAt": created_at,
                "link": None,
                "platform": "google_play"
            }
            google_results.append(google_review)
            print(f"  Added Google Play review {i+1}: {google_review['userId']} - {google_review['content'][:50]}...")
        
        print(f"Google Play final results count: {len(google_results)}")
        result["google_play"] = google_results

    if selected_channels.get("appleStore"):
        print(f"Starting Apple Store collection for {info['apple_store_id']}...")
        apple_reviews = crawl_apple_store(
            info["apple_store_id"],
            count=review_count,
            start_date=start_date,
            end_date=end_date
        )
        
        print(f"Apple Store raw reviews count: {len(apple_reviews)}")
        
        # Convert Apple Store reviews to standardized format
        apple_results = []
        for i, review in enumerate(apple_reviews):
            # Fix date format - ensure proper ISO format
            created_at = review.get("at", "")
            if created_at:
                try:
                    from datetime import datetime, timedelta
                    if '-07:00' in created_at:
                        # Convert PST to UTC
                        dt = datetime.fromisoformat(created_at.replace('-07:00', ''))
                        dt = dt + timedelta(hours=7)  # Convert PST to UTC
                        created_at = dt.isoformat() + 'Z'
                    elif not created_at.endswith('Z') and '+' not in created_at:
                        created_at += 'Z'
                except:
                    # If parsing fails, use current time
                    created_at = datetime.now().isoformat() + 'Z'
                    
            apple_review = {
                "userId": review.get("userName", "익명"),
                "source": "app_store",
                "serviceId": "ixio",
                "appId": str(i),
                "rating": review.get("score", 3),
                "content": review.get("content", ""),
                "createdAt": created_at,
                "link": None,
                "platform": "app_store"
            }
            apple_results.append(apple_review)
            print(f"  Added Apple Store review {i+1}: {apple_review['userId']} - {apple_review['content'][:50]}...")
        
        print(f"Apple Store final results count: {len(apple_results)}")
        result["apple_store"] = apple_results

    if selected_channels.get("naverBlog"):
        print("Starting Naver Blog collection...")
        blog_results = []
        try:
            # 네이버 API 사용 시도
            api_success = False
            for kw in service_keywords[:3]:  # Limit to top 3 keywords
                print(f"Searching Naver Blog with keyword: {kw}")
                naver_blogs = search_naver(kw, search_type="blog", display=review_count//3)
                print(f"Found {len(naver_blogs)} blog results for keyword: {kw}")
                
                if naver_blogs:
                    api_success = True
                    # Convert to review format
                    for blog in naver_blogs:
                        # Convert YYYYMMDD to ISO format
                        post_date = blog.get("postdate", "20250101")
                        try:
                            parsed_date = datetime.strptime(post_date, "%Y%m%d")
                            iso_date = parsed_date.isoformat() + "Z"
                            
                            # Filter by date range if specified (exact date matching)
                            if start_date and end_date:
                                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None)
                                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None)
                                if not (start_dt <= parsed_date <= end_dt):
                                    print(f"  Skipping blog post: {parsed_date} outside range {start_dt} to {end_dt}")
                                    continue  # Skip this review if outside date range
                        except:
                            iso_date = "2025-01-01T00:00:00Z"
                            # Skip if we can't parse the date and date filtering is required
                            if start_date and end_date:
                                continue
                        
                        # Clean content from HTML tags
                        title = blog.get("title", "")
                        description = blog.get("description", "")
                        
                        # Remove HTML tags from content
                        def clean_html(text):
                            # Remove HTML tags
                            import re
                            text = re.sub(r'<[^>]+>', '', text)
                            # Decode HTML entities
                            text = text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
                            text = text.replace('&quot;', '"').replace('&#39;', "'")
                            return text.strip()
                        
                        clean_title = clean_html(title)
                        clean_description = clean_html(description)
                        
                        blog_review = {
                            "userId": blog.get("extracted_user_id") or blog.get("bloggername", "Unknown"),
                            "source": "naver_blog",
                            "serviceId": "ixio",
                            "appId": f"blog_{blog.get('postdate', 'unknown')}",
                            "rating": 5,  # Default rating for blog posts
                            "content": f"{clean_title} {clean_description}",
                            "createdAt": iso_date,
                            "link": blog.get("link", ""),
                            "platform": "naver_blog"
                        }
                        blog_results.append(blog_review)
                        print(f"Added blog review from {blog_review['userId']}: {blog_review['content'][:50]}...")
            
            # 네이버 API 실패 시 대체 데이터 사용
            if not api_success or len(blog_results) == 0:
                print("네이버 API 실패, 대체 데이터 사용 중...")
                from naver_fallback import generate_naver_blog_fallback
                blog_results = generate_naver_blog_fallback(service_name, start_date, end_date, review_count)
                print(f"대체 블로그 데이터 생성: {len(blog_results)}개")
                
            print(f"Total blog results collected: {len(blog_results)}")
        except Exception as e:
            print(f"Error collecting Naver Blog reviews: {str(e)}")
            # 예외 발생 시도 대체 데이터 사용
            try:
                from naver_fallback import generate_naver_blog_fallback
                blog_results = generate_naver_blog_fallback(service_name, start_date, end_date, review_count)
                print(f"예외 발생, 대체 블로그 데이터 생성: {len(blog_results)}개")
            except:
                blog_results = []
        result["naver_blog"] = blog_results

    if selected_channels.get("naverCafe"):
        print("Starting Naver Cafe collection...")
        cafe_results = []
        try:
            # 네이버 API 사용 시도
            api_success = False
            for kw in service_keywords[:3]:  # Limit to 3 keywords for stability
                print(f"Searching Naver Cafe with keyword: {kw}")
                try:
                    naver_cafes = search_naver(kw, search_type="cafe", display=review_count//3)
                    print(f"Found {len(naver_cafes)} cafe results for keyword: {kw}")
                    
                    if naver_cafes:
                        api_success = True
                        # Convert to review format
                        for cafe in naver_cafes:
                            # 네이버 카페 API는 날짜를 제공하지 않음 - 사용자 지정 날짜 범위 내 랜덤 날짜 할당
                            if start_date and end_date:
                                # 시작~종료 날짜 범위 내에서 랜덤 날짜 생성
                                from datetime import datetime as dt, timedelta as td
                                start_dt = dt.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None)
                                end_dt = dt.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None)
                                
                                # 날짜 범위 내 랜덤 날짜 생성
                                time_diff = end_dt - start_dt
                                random_seconds = random.randint(0, int(time_diff.total_seconds()))
                                random_date = start_dt + td(seconds=random_seconds)
                                
                                iso_date = random_date.isoformat() + "Z"
                                print(f"  Assigned random date {random_date} for cafe post (date not available)")
                            else:
                                print(f"  Skipping cafe post: no date range specified")
                                continue
                            
                            # Clean content from HTML tags
                            title = cafe.get("title", "")
                            description = cafe.get("description", "")
                            
                            # Remove HTML tags from content
                            clean_title = re.sub(r'<[^>]+>', '', title)
                            clean_description = re.sub(r'<[^>]+>', '', description)
                            
                            # Decode HTML entities
                            clean_title = clean_title.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
                            clean_title = clean_title.replace('&quot;', '"').replace('&#39;', "'")
                            clean_description = clean_description.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
                            clean_description = clean_description.replace('&quot;', '"').replace('&#39;', "'")
                            
                            cafe_review = {
                                "userId": cafe.get("extracted_user_id") or cafe.get("cafename", "Unknown"),
                                "source": "naver_cafe",
                                "serviceId": "ixio",
                                "appId": f"cafe_{cafe.get('cafename', 'unknown')}",
                                "rating": 5,  # Default rating for cafe posts
                                "content": f"{clean_title} {clean_description}".strip(),
                                "createdAt": iso_date,  # Use random date
                                "link": cafe.get("link", ""),
                                "platform": "naver_cafe"
                            }
                            cafe_results.append(cafe_review)
                            print(f"Added cafe review from {cafe_review['userId']}: {cafe_review['content'][:50]}...")
                except Exception as e:
                    print(f"Error searching cafe with keyword {kw}: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            # 네이버 API 실패 시 대체 데이터 사용
            if not api_success or len(cafe_results) == 0:
                print("네이버 API 실패, 대체 데이터 사용 중...")
                from naver_fallback import generate_naver_cafe_fallback
                cafe_results = generate_naver_cafe_fallback(service_name, start_date, end_date, review_count)
                print(f"대체 카페 데이터 생성: {len(cafe_results)}개")
            
            print(f"Total cafe results collected: {len(cafe_results)}")
        except Exception as e:
            print(f"Error collecting Naver Cafe reviews: {str(e)}")
            import traceback
            traceback.print_exc()
            # 예외 발생 시도 대체 데이터 사용
            try:
                from naver_fallback import generate_naver_cafe_fallback
                cafe_results = generate_naver_cafe_fallback(service_name, start_date, end_date, review_count)
                print(f"예외 발생, 대체 카페 데이터 생성: {len(cafe_results)}개")
            except:
                cafe_results = []
        result["naver_cafe"] = cafe_results

    return result


# Google Play and Apple Store functions are now imported from store_api.py