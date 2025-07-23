#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Store API Integration for Google Play and Apple App Store
"""

import sys
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from google_play_scraper import reviews, Sort

def crawl_google_play(app_id, count=100, lang='ko', country='kr', start_date=None, end_date=None):
    """
    Crawl reviews from Google Play Store with date filtering
    
    Args:
        app_id: Google Play Store app ID
        count: Number of reviews to fetch
        lang: Language code (default: 'ko')
        country: Country code (default: 'kr')
        start_date: Start date for filtering (ISO format)
        end_date: End date for filtering (ISO format)
        
    Returns:
        List of review dictionaries
    """
    try:
        # Fetch reviews from Google Play Store
        result, _ = reviews(
            app_id,
            lang=lang,
            country=country,
            sort=Sort.NEWEST,
            count=count
        )
        
        # Process and clean the data with date filtering
        processed_reviews = []
        for review in result:
            review_date = review['at']
            
            # Apply date filtering if specified
            if start_date and end_date:
                try:
                    # 시작/끝 날짜를 정확히 파싱
                    if 'T' in start_date:
                        start_dt = datetime.fromisoformat(start_date.replace('Z', '')).date()
                    else:
                        start_dt = datetime.fromisoformat(start_date).date()
                    
                    if 'T' in end_date:
                        end_dt = datetime.fromisoformat(end_date.replace('Z', '')).date()
                    else:
                        end_dt = datetime.fromisoformat(end_date).date()
                    
                    # 리뷰 날짜를 정확히 파싱
                    if hasattr(review_date, 'replace'):
                        review_dt = review_date.replace(tzinfo=None).date()
                    else:
                        review_dt = datetime.fromisoformat(str(review_date).replace('Z', '+00:00')).replace(tzinfo=None).date()
                    

                    
                    # 범위 밖이면 건너뛰기
                    if not (start_dt <= review_dt <= end_dt):
                        continue
                except Exception as e:
                    # 날짜 파싱 실패시 리뷰 포함
                    print(f"Date parsing error for review: {e}")
                    pass
            
            processed_review = {
                'userName': review['userName'] if review['userName'] else '익명',
                'score': review['score'],
                'content': review['content'],
                'at': review['at'].isoformat() if review['at'] else datetime.now().isoformat(),
                'reviewId': review.get('reviewId', ''),
                'appVersion': review.get('appVersion', ''),
                'thumbsUpCount': review.get('thumbsUpCount', 0)
            }
            processed_reviews.append(processed_review)
        
        return processed_reviews
        
    except Exception as e:
        print(f"Error crawling Google Play reviews: {str(e)}", file=sys.stderr)
        return []

def crawl_apple_store(app_id, count=100, start_date=None, end_date=None):
    """
    Crawl reviews from Apple App Store with date filtering
    
    Args:
        app_id: Apple App Store app ID
        count: Number of reviews to fetch (RSS feed limitation)
        start_date: Start date for filtering (ISO format)
        end_date: End date for filtering (ISO format)
        
    Returns:
        List of review dictionaries
    """
    try:
        processed_reviews = []
        page = 1
        max_pages = 10  # 최대 10페이지까지 수집
        
        while len(processed_reviews) < count and page <= max_pages:
            # Apple App Store RSS feed for reviews - 여러 페이지 수집
            rss_url = f"https://itunes.apple.com/kr/rss/customerreviews/page={page}/id={app_id}/sortby=mostrecent/xml"
            
            print(f"Fetching Apple Store page {page}")
            
            # Fetch RSS feed
            response = requests.get(rss_url, timeout=10)
            response.raise_for_status()
            
            # Parse XML
            root = ET.fromstring(response.content)
            
            # Define namespaces for Apple RSS feed
            namespaces = {
                'atom': 'http://www.w3.org/2005/Atom',
                'im': 'http://itunes.apple.com/rss'
            }
            
            # Find review entries with proper namespace
            entries = root.findall('.//atom:entry', namespaces)
            print(f"Found {len(entries)} Apple Store entries in page {page}")
            
            # Remove app info entry (first entry is usually app info on page 1)
            if page == 1 and entries:
                entries = entries[1:]
                print(f"After removing app info entry: {len(entries)} entries")
            
            # 이 페이지에서 리뷰가 없으면 중단
            if not entries:
                print(f"No more reviews found on page {page}")
                break
            
            for entry in entries:
                try:
                    # Extract review data with proper namespace
                    title = entry.find('atom:title', namespaces)
                    content = entry.find('atom:content', namespaces)
                    author = entry.find('atom:author/atom:name', namespaces)
                    updated = entry.find('atom:updated', namespaces)
                
                    title_text = title.text if title is not None else ''
                    content_text = content.text if content is not None else ''
                    author_text = author.text if author is not None else '익명'
                    updated_text = updated.text if updated is not None else datetime.now().isoformat()
                    
                    # Extract rating from iTunes rating element
                    rating = 5  # Default rating
                    rating_elem = entry.find('im:rating', namespaces)
                    if rating_elem is not None:
                        try:
                            rating = int(rating_elem.text)
                        except:
                            rating = 5
                    
                    # Parse date
                    try:
                        # Handle different date formats
                        if '-07:00' in updated_text:
                            # PST timezone - keep as is for date comparison
                            review_date = datetime.fromisoformat(updated_text.replace('-07:00', '')).replace(tzinfo=None)
                        elif 'Z' in updated_text:
                            review_date = datetime.fromisoformat(updated_text.replace('Z', '')).replace(tzinfo=None)
                        else:
                            review_date = datetime.fromisoformat(updated_text).replace(tzinfo=None)
                    except:
                        review_date = datetime.now()
                
                    # Apply date filtering if specified
                    if start_date and end_date:
                        try:
                            # 시작/끝 날짜를 정확히 파싱 - string type 확인
                            if isinstance(start_date, str):
                                if 'T' in start_date:
                                    start_dt = datetime.fromisoformat(start_date.replace('Z', '')).date()
                                else:
                                    start_dt = datetime.fromisoformat(start_date).date()
                            else:
                                start_dt = start_date.date() if hasattr(start_date, 'date') else start_date
                        
                            if isinstance(end_date, str):
                                if 'T' in end_date:
                                    end_dt = datetime.fromisoformat(end_date.replace('Z', '')).date()
                                else:
                                    end_dt = datetime.fromisoformat(end_date).date()
                            else:
                                end_dt = end_date.date() if hasattr(end_date, 'date') else end_date
                            
                            print(f"Apple Store date filter: {review_date.date()} vs {start_dt} ~ {end_dt}")
                            
                            # 범위 밖이면 건너뛰기
                            if not (start_dt <= review_date.date() <= end_dt):
                                print(f"  Skipping Apple review: {review_date.date()} outside range")
                                continue
                            else:
                                print(f"  Including Apple review: {review_date.date()} within range")
                        except Exception as e:
                            # 날짜 파싱 실패시 리뷰 포함
                            print(f"Date parsing error for Apple review: {e}")
                            pass
                
                    # Get review ID
                    review_id = entry.find('atom:id', namespaces)
                    review_id_text = review_id.text if review_id is not None else ''
                    
                    processed_review = {
                        'userName': author_text,
                        'score': rating,
                        'content': f"{title_text}\n{content_text}".strip(),
                        'at': review_date.isoformat(),
                        'reviewId': review_id_text,
                        'appVersion': '',
                        'thumbsUpCount': 0
                    }
                    processed_reviews.append(processed_review)
                    
                    # Limit to requested count per page
                    if len(processed_reviews) >= count:
                        break
                        
                except Exception as e:
                    print(f"Error processing Apple Store review entry: {str(e)}", file=sys.stderr)
                    continue
        
            # 페이지 증가
            page += 1
        
        print(f"Apple Store collection completed: {len(processed_reviews)} reviews from {page-1} pages")
        return processed_reviews
        
    except Exception as e:
        print(f"Error crawling Apple Store reviews: {str(e)}", file=sys.stderr)
        return []

# Apple Store 수집 함수는 위에 정의되어 있습니다.