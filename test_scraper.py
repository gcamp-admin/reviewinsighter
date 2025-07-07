#!/usr/bin/env python3
"""
Test script to verify the scraper works correctly
"""

import requests
import json
import time

def test_api_endpoint():
    """Test the API endpoint for collecting reviews"""
    url = "http://localhost:5000/api/reviews/collect"
    
    payload = {
        "appId": "com.lguplus.sohoapp",
        "appIdApple": "1571096278",
        "count": 10,
        "sources": ["google_play", "app_store"]
    }
    
    print("Testing review collection API...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ API endpoint test passed!")
            return True
        else:
            print("❌ API endpoint test failed!")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def test_reviews_endpoint():
    """Test getting reviews after collection"""
    url = "http://localhost:5000/api/reviews"
    
    print("\nTesting reviews retrieval...")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total reviews: {data['total']}")
            print(f"Reviews in page: {len(data['reviews'])}")
            
            if data['reviews']:
                print("Sample review:")
                sample = data['reviews'][0]
                print(f"  User: {sample['userId']}")
                print(f"  Rating: {sample['rating']}")
                print(f"  Content: {sample['content'][:100]}...")
                print(f"  Sentiment: {sample['sentiment']}")
            
            print("✅ Reviews retrieval test passed!")
            return True
        else:
            print("❌ Reviews retrieval test failed!")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Review Collection System")
    print("=" * 50)
    
    # Test API endpoint
    api_success = test_api_endpoint()
    
    if api_success:
        # Wait a bit for data to be processed
        time.sleep(2)
        
        # Test reviews endpoint
        reviews_success = test_reviews_endpoint()
        
        if reviews_success:
            print("\n🎉 All tests passed! Review collection system is working.")
        else:
            print("\n⚠️  API collection works but reviews retrieval failed.")
    else:
        print("\n❌ API collection failed. Check server logs.")