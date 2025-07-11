#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Main crawler module for multi-source review collection
"""

from service_data import services
from store_api import crawl_google_play, crawl_apple_store
from naver_api import search_naver

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
            service_keywords=service_keywords,
            start_date=start_date,
            end_date=end_date
        )

    if selected_channels.get("appleStore"):
        result["apple_store"] = crawl_apple_store(
            info["apple_store_id"],
            count=review_count,
            service_keywords=service_keywords,
            start_date=start_date,
            end_date=end_date
        )

    if selected_channels.get("naverBlog"):
        blog_results = []
        for kw in service_keywords[:3]:  # Limit to top 3 keywords
            blog_results.extend(search_naver(kw, search_type="blog", display=review_count//3))
        result["naver_blog"] = blog_results

    if selected_channels.get("naverCafe"):
        cafe_results = []
        for kw in service_keywords[:3]:  # Limit to top 3 keywords
            cafe_results.extend(search_naver(kw, search_type="cafe", display=review_count//3))
        result["naver_cafe"] = cafe_results

    return result