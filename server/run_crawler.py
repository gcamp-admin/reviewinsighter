#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Crawler runner script for Node.js integration
"""

import sys
import json
import requests
from datetime import datetime
from crawler import crawl_service_by_selection

def main():
    try:
        # Parse command line arguments
        if len(sys.argv) < 2:
            print("Usage: python run_crawler.py <crawler_args_json>")
            sys.exit(1)
        
        # Parse crawler arguments
        crawler_args_str = sys.argv[1]
        crawler_args = json.loads(crawler_args_str)
        
        service_name = crawler_args.get('service_name', '익시오')
        selected_channels = crawler_args.get('selected_channels', {})
        start_date = crawler_args.get('start_date')
        end_date = crawler_args.get('end_date')
        review_count = crawler_args.get('review_count', 100)
        
        print(f"Starting crawler for {service_name}")
        print(f"Channels: {selected_channels}")
        print(f"Date range: {start_date} to {end_date}")
        print(f"Review count: {review_count}")
        
        # Run the crawler
        results = crawl_service_by_selection(
            service_name=service_name,
            selected_channels=selected_channels,
            start_date=start_date,
            end_date=end_date,
            review_count=review_count
        )
        
        # Process and send reviews to Node.js API
        total_reviews = 0
        for source, reviews in results.items():
            if isinstance(reviews, list):
                print(f"Processing {len(reviews)} reviews from {source}")
                
                # Process each review
                for review in reviews:
                    try:
                        # Prepare review data for API
                        review_data = {
                            'userId': review.get('userName', review.get('title', '익명')),
                            'content': review.get('content', review.get('description', '')),
                            'rating': review.get('score', 0),
                            'source': source,
                            'createdAt': review.get('at', review.get('pubDate', datetime.now().isoformat())),
                            'serviceId': 'ixio',
                            'appId': review.get('reviewId', str(total_reviews))
                        }
                        
                        # Send to Node.js API
                        response = requests.post(
                            'http://localhost:5000/api/reviews/create',
                            json=review_data,
                            headers={'Content-Type': 'application/json'}
                        )
                        
                        if response.status_code == 200:
                            print(f"Created review {total_reviews + 1}: {review_data['userId'][:20]} - {review_data['content'][:50]}...")
                            total_reviews += 1
                        else:
                            print(f"Failed to create review: {response.status_code}")
                            
                    except Exception as e:
                        print(f"Error processing review: {e}")
                        continue
        
        print(f"Successfully processed {total_reviews} reviews")
        
        # Perform batch sentiment analysis if reviews were collected
        if total_reviews > 0:
            print("Starting batch sentiment analysis...")
            
            # Get all reviews for sentiment analysis
            reviews_response = requests.get('http://localhost:5000/api/reviews?limit=1000')
            if reviews_response.status_code == 200:
                reviews_data = reviews_response.json()
                review_texts = [review['content'] for review in reviews_data.get('reviews', [])]
                
                if review_texts:
                    # Perform batch sentiment analysis
                    sentiment_response = requests.post(
                        'http://localhost:5000/api/gpt-sentiment-batch',
                        json={'texts': review_texts},
                        headers={'Content-Type': 'application/json'}
                    )
                    
                    if sentiment_response.status_code == 200:
                        sentiment_data = sentiment_response.json()
                        print(f"Batch sentiment analysis completed for {len(review_texts)} reviews")
                    else:
                        print(f"Sentiment analysis failed: {sentiment_response.status_code}")
        
        print("Crawler completed successfully")
        
    except Exception as e:
        print(f"Crawler error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()