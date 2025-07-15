#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Store API Integration for Google Play and Apple App Store
"""

import sys
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
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
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None).date()
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None).date()
                
                # Convert review date to naive datetime
                if hasattr(review_date, 'replace'):
                    review_dt = review_date.replace(tzinfo=None).date()
                else:
                    review_dt = datetime.fromisoformat(review_date.replace('Z', '+00:00')).replace(tzinfo=None).date()
                
                # Skip if outside date range
                if not (start_dt <= review_dt <= end_dt):
                    continue
            
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
        # Apple App Store RSS feed for reviews
        rss_url = f"https://itunes.apple.com/kr/rss/customerreviews/page=1/id={app_id}/sortby=mostrecent/xml"
        
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
        
        processed_reviews = []
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
                    review_date = datetime.fromisoformat(updated_text.replace('Z', '+00:00')).replace(tzinfo=None)
                except:
                    review_date = datetime.now()
                
                # Apply date filtering if specified
                if start_date and end_date:
                    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None).date()
                    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None).date()
                    
                    # Skip if outside date range
                    if not (start_dt <= review_date.date() <= end_dt):
                        continue
                
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
                
                # Limit to requested count
                if len(processed_reviews) >= count:
                    break
                    
            except Exception as e:
                print(f"Error processing Apple Store review entry: {str(e)}", file=sys.stderr)
                continue
        
        return processed_reviews
        
    except Exception as e:
        print(f"Error crawling Apple Store reviews: {str(e)}", file=sys.stderr)
        return []

def crawl_apple_store(app_id, count=100, start_date=None, end_date=None):
    """
    Crawl reviews from Apple App Store with date filtering
    
    Args:
        app_id: Apple App Store app ID
        count: Number of reviews to fetch (limited by RSS feed)
        start_date: Start date for filtering (ISO format)
        end_date: End date for filtering (ISO format)
        
    Returns:
        List of review dictionaries
    """
    try:
        # Construct RSS URL for App Store reviews
        rss_url = f'https://itunes.apple.com/kr/rss/customerreviews/id={app_id}/sortBy=mostRecent/xml'
        
        response = requests.get(rss_url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch App Store reviews: HTTP {response.status_code}", file=sys.stderr)
            return []
        
        root = ET.fromstring(response.content)
        
        # Process reviews (skip first entry which is just metadata)
        processed_reviews = []
        entries = root.findall('.//{http://www.w3.org/2005/Atom}entry')[1:]
        
        for entry in entries[:count]:  # Limit to requested count
            try:
                # Extract review data
                author_elem = entry.find('{http://www.w3.org/2005/Atom}author')
                author = author_elem[0].text if author_elem is not None and len(author_elem) > 0 else '익명'
                
                title_elem = entry.find('{http://www.w3.org/2005/Atom}title')
                title = title_elem.text if title_elem is not None else ''
                
                content_elem = entry.find('{http://www.w3.org/2005/Atom}content')
                content = content_elem.text if content_elem is not None else title  # Use title if no content
                
                rating_elem = entry.find('{http://itunes.apple.com/rss}rating')
                rating = int(rating_elem.text) if rating_elem is not None else 3
                
                updated_elem = entry.find('{http://www.w3.org/2005/Atom}updated')
                created_at = updated_elem.text if updated_elem is not None else datetime.now().isoformat()
                
                # Apply date filtering if specified
                if start_date and end_date:
                    try:
                        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None)
                        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None)
                        
                        # Parse the review date
                        review_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00')).replace(tzinfo=None)
                        
                        # Skip if outside date range
                        if not (start_dt <= review_dt <= end_dt):
                            continue
                    except Exception:
                        # If date parsing fails, skip this review when date filtering is required
                        continue
                
                processed_review = {
                    'userName': author,
                    'score': rating,
                    'content': content,
                    'at': created_at,
                    'title': title
                }
                processed_reviews.append(processed_review)
                
            except Exception as item_error:
                print(f"Error processing App Store item: {str(item_error)}", file=sys.stderr)
                continue
        
        return processed_reviews
        
    except Exception as e:
        print(f"Error crawling App Store reviews: {str(e)}", file=sys.stderr)
        return []