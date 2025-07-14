#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Main crawler module for multi-source review collection
"""

from service_data import services
from store_api import crawl_google_play, crawl_apple_store
from naver_api import search_naver
from datetime import datetime

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
        result["google_play"] = crawl_google_play(
            info["google_play_id"], 
            count=review_count,
            start_date=start_date,
            end_date=end_date
        )

    if selected_channels.get("appleStore"):
        result["apple_store"] = crawl_apple_store(
            info["apple_store_id"],
            count=review_count,
            start_date=start_date,
            end_date=end_date
        )

    if selected_channels.get("naverBlog"):
        blog_results = []
        for kw in service_keywords[:3]:  # Limit to top 3 keywords
            naver_blogs = search_naver(kw, search_type="blog", display=review_count//3)
            # Convert to review format
            for blog in naver_blogs:
                # Convert YYYYMMDD to ISO format
                post_date = blog.get("postdate", "20250101")
                try:
                    parsed_date = datetime.strptime(post_date, "%Y%m%d")
                    iso_date = parsed_date.isoformat() + "Z"
                    
                    # Filter by date range if specified
                    if start_date and end_date:
                        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                        if not (start_dt <= parsed_date <= end_dt):
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
                import re
                def clean_html(text):
                    # Remove HTML tags
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
        result["naver_blog"] = blog_results

    if selected_channels.get("naverCafe"):
        cafe_results = []
        for kw in service_keywords[:3]:  # Limit to top 3 keywords
            naver_cafes = search_naver(kw, search_type="cafe", display=review_count//3)
            # Convert to review format
            for cafe in naver_cafes:
                # Convert YYYYMMDD to ISO format and filter by date
                post_date = cafe.get("postdate", "20250101")
                try:
                    parsed_date = datetime.strptime(post_date, "%Y%m%d")
                    iso_date = parsed_date.isoformat() + "Z"
                    
                    # Filter by date range if specified
                    if start_date and end_date:
                        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                        if not (start_dt <= parsed_date <= end_dt):
                            continue  # Skip this review if outside date range
                except:
                    iso_date = "2025-01-01T00:00:00Z"
                    # Skip if we can't parse the date and date filtering is required
                    if start_date and end_date:
                        continue
                
                # Clean content from HTML tags
                title = cafe.get("title", "")
                description = cafe.get("description", "")
                
                # Remove HTML tags from content
                import re
                def clean_html(text):
                    # Remove HTML tags
                    text = re.sub(r'<[^>]+>', '', text)
                    # Decode HTML entities
                    text = text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
                    text = text.replace('&quot;', '"').replace('&#39;', "'")
                    return text.strip()
                
                clean_title = clean_html(title)
                clean_description = clean_html(description)
                
                cafe_review = {
                    "userId": cafe.get("extracted_user_id") or cafe.get("cafename", "Unknown"),
                    "source": "naver_cafe",
                    "serviceId": "ixio",
                    "appId": f"cafe_{cafe.get('cafename', 'unknown')}",
                    "rating": 5,  # Default rating for cafe posts
                    "content": f"{clean_title} {clean_description}",
                    "createdAt": iso_date,  # Use parsed date
                    "link": cafe.get("link", ""),
                    "platform": "naver_cafe"
                }
                cafe_results.append(cafe_review)
        result["naver_cafe"] = cafe_results

    return result


def crawl_google_play(app_id, count=500, start_date=None, end_date=None):
    """
    Crawl Google Play Store reviews with date filtering
    
    Args:
        app_id: Google Play Store app ID
        count: Number of reviews to collect
        start_date: Start date for filtering (ISO format)
        end_date: End date for filtering (ISO format)
        
    Returns:
        List of reviews
    """
    from scraper import scrape_google_play_reviews
    
    # Scrape reviews with date filtering
    reviews = scrape_google_play_reviews(
        app_id, 
        count,
        start_date=start_date,
        end_date=end_date
    )
    print(f"Collected {len(reviews)} reviews from Google Play Store (Date range: {start_date} to {end_date})")
    
    return reviews


def crawl_apple_store(app_id, count=500, start_date=None, end_date=None):
    """
    Crawl Apple App Store reviews with date filtering
    
    Args:
        app_id: Apple App Store app ID
        count: Number of reviews to collect
        start_date: Start date for filtering (ISO format)
        end_date: End date for filtering (ISO format)
        
    Returns:
        List of reviews
    """
    from scraper import scrape_app_store_reviews
    
    # Scrape reviews with date filtering
    reviews = scrape_app_store_reviews(
        app_id, 
        count,
        start_date=start_date,
        end_date=end_date
    )
    print(f"Collected {len(reviews)} reviews from Apple App Store (Date range: {start_date} to {end_date})")
    
    return reviews