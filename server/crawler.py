#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Main crawler module for multi-source review collection
"""

from service_data import services
from store_api import crawl_google_play, crawl_apple_store
from naver_api import search_naver, extract_user_id_from_url
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
            count=1000,  # 더 많은 리뷰를 가져와서 날짜 필터링
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
            count=100,  # 더 많은 리뷰를 가져와서 날짜 필터링
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
                try:
                    naver_blogs = search_naver(kw, search_type="blog", display=review_count//3, start_date=start_date, end_date=end_date)
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
                                
                                # Filter by date range if specified (date only comparison)
                                if start_date and end_date:
                                    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None).date()
                                    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None).date()
                                    blog_date = parsed_date.date()
                                    if not (start_dt <= blog_date <= end_dt):
                                        print(f"  Skipping blog post: {blog_date} outside range {start_dt} to {end_dt}")
                                        continue  # Skip this review if outside date range
                            except:
                                # Skip if we can't parse the date and date filtering is required
                                if start_date and end_date:
                                    print(f"  Skipping blog post: unparseable date {post_date}")
                                    continue
                                else:
                                    iso_date = "2025-01-01T00:00:00Z"
                            
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
                            
                            # Extract user ID from URL
                            user_id = extract_user_id_from_url(
                                blog.get("bloggerlink", ""),
                                blog.get("link", ""),
                                "blog"
                            ) or blog.get("bloggername", "Unknown")
                            
                            blog_review = {
                                "userId": user_id,
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
                
                except Exception as e:
                    print(f"Error searching Naver Blog with keyword {kw}: {e}")
                    continue
            
            # 네이버 API 실패 시 빈 결과 반환
            if not api_success or len(blog_results) == 0:
                print("네이버 블로그 API 실패 - 유효한 API 키가 필요합니다")
                blog_results = []
                
            print(f"Total blog results collected: {len(blog_results)}")
        except Exception as e:
            print(f"Error collecting Naver Blog reviews: {str(e)}")
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
                    naver_cafes = search_naver(kw, search_type="cafe", display=review_count//3, start_date=start_date, end_date=end_date)
                    print(f"Found {len(naver_cafes)} cafe results for keyword: {kw}")
                    
                    if naver_cafes:
                        api_success = True
                        
                        # 날짜 필터링 적용 - 데이터 무결성 원칙 준수
                        if start_date and end_date:
                            print(f"  네이버 카페 API는 날짜 정보를 제공하지 않습니다.")
                            print(f"  데이터 무결성 원칙에 따라 날짜 필터링 시 네이버 카페 수집을 건너뜁니다.")
                            print(f"  정확한 날짜 정보 없이는 수집하지 않습니다.")
                            # 네이버 카페는 날짜 필터링 시 수집하지 않음
                        else:
                            # 날짜 필터링 없는 경우 모든 카페 글 수집
                            for cafe in naver_cafes:
                                # 뉴스기사 필터링 체크 (네이버 카페에서 뉴스기사 제외)
                                title = cafe.get("title", "")
                                description = cafe.get("description", "")
                                text_content = (title + " " + description).lower()
                                
                                # 뉴스기사 제외 키워드 체크
                                news_indicators = [
                                    "뉴스", "기사", "보도", "보도자료", "press", "뉴스기사", "언론", "미디어", 
                                    "기자", "취재", "신문", "방송", "뉴스룸", "보도국", "편집부", "news",
                                    "관련 기사", "속보", "단독", "특보", "일보", "타임즈", "헤럴드"
                                ]
                                
                                if any(indicator in text_content for indicator in news_indicators):
                                    print(f"  Skipping news article: {title[:50]}...")
                                    continue
                                
                                # 날짜 필터링 없는 경우 현재 날짜 사용
                                from datetime import datetime as dt
                                current_date = dt.now()
                                iso_date = current_date.isoformat() + "Z"
                                print(f"  Using current date: {current_date.date()}")
                                
                                # Clean content from HTML tags
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
                                    "createdAt": iso_date,  # Use current date
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
            
            # 네이버 API 실패 시 빈 결과 반환
            if not api_success or len(cafe_results) == 0:
                print("네이버 API 실패 - 유효한 API 키가 필요합니다")
                cafe_results = []
            
            print(f"Total cafe results collected: {len(cafe_results)}")
        except Exception as e:
            print(f"Error collecting Naver Cafe reviews: {str(e)}")
            import traceback
            traceback.print_exc()
            cafe_results = []
        result["naver_cafe"] = cafe_results

    return result


# Google Play and Apple Store functions are now imported from store_api.py