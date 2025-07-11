#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Service Data Configuration for Korean App Review Analysis
Contains service information and keywords for multi-source scraping
"""

services = {
    "익시오": {
        "google_play_id": "com.lguplus.aicallagent",
        "apple_store_id": "6503931858",
        "keywords": ["익시오", "ixio", "익시o", "ixi오", "LG익시오", "U+익시오", "유플러스익시오"]
    },
    "AI비즈콜": {
        "google_play_id": "com.uplus.ubizai",
        "apple_store_id": "6503284354",
        "keywords": ["ai비즈콜", "에이아이비즈콜", "LG비즈콜", "유플러스비즈콜", "U+비즈콜"]
    },
    "SOHO우리가게패키지": {
        "google_play_id": "com.lguplus.sohoapp",
        "apple_store_id": "1571096278",
        "keywords": ["우리가게패키지", "LG우리가게", "U+우리가게", "유플러스우리가게", "유플러스소호패키지"]
    }
}

def get_service_info(service_name):
    """
    Get service information by name
    
    Args:
        service_name: Service name to lookup
        
    Returns:
        Dictionary with service information or None if not found
    """
    return services.get(service_name, None)

def get_service_keywords(service_name):
    """
    Get keywords for a service
    
    Args:
        service_name: Service name to lookup
        
    Returns:
        List of keywords for the service
    """
    service_info = get_service_info(service_name)
    return service_info.get("keywords", [service_name]) if service_info else [service_name]