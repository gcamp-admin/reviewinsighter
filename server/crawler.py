#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Main crawler module for multi-source review collection
"""

from service_data import services
from store_api import crawl_google_play, crawl_apple_store
from naver_api import search_naver

def crawl_service_by_selection(service_name, selected_channels):
    """
    Crawl reviews from selected channels for a specific service
    
    Args:
        service_name: ex) "익시오"
        selected_channels: {
            "googlePlay": True,
            "appleStore": True,
            "naverBlog": False,
            "naverCafe": True
        }
        
    Returns:
        Dictionary with results from each selected channel
    """
    if service_name not in services:
        raise ValueError("유효하지 않은 서비스명입니다.")

    info = services[service_name]
    result = {}

    if selected_channels.get("googlePlay"):
        result["google_play"] = crawl_google_play(info["google_play_id"])

    if selected_channels.get("appleStore"):
        result["apple_store"] = crawl_apple_store(info["apple_store_id"])

    if selected_channels.get("naverBlog"):
        blog_results = []
        for kw in info["keywords"]:
            blog_results.extend(search_naver(kw, search_type="blog"))
        result["naver_blog"] = blog_results

    if selected_channels.get("naverCafe"):
        cafe_results = []
        for kw in info["keywords"]:
            cafe_results.extend(search_naver(kw, search_type="cafe"))
        result["naver_cafe"] = cafe_results

    return result