#!/usr/bin/env python3
"""
Analysis script for commento.ai
Handles wordcloud and HEART analysis
"""
import sys
import json
import os
import tempfile
import traceback

# Set deployment mode environment for scraper modules
os.environ['DEPLOYMENT'] = 'true'

# Add current directory to Python path for module imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.append('server')

try:
    from scraper import analyze_sentiments, extract_korean_words_advanced
    print("Successfully imported scraper module for analysis", file=sys.stderr)
except ImportError as e:
    print(f"Import error: {e}", file=sys.stderr)
    print(f"Current directory: {os.getcwd()}", file=sys.stderr)
    print(f"Script directory: {os.path.dirname(os.path.abspath(__file__))}", file=sys.stderr)
    print(f"Python path: {sys.path}", file=sys.stderr)
    sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print("Usage: python analyze_reviews.py <temp_file_path> <analysis_type>")
        sys.exit(1)
    
    temp_file_path = sys.argv[1]
    analysis_type = sys.argv[2] if len(sys.argv) > 2 else 'full'
    
    try:
        # Read reviews from file
        with open(temp_file_path, 'r', encoding='utf-8') as f:
            reviews_data = json.load(f)
        
        if analysis_type == 'wordcloud':
            # Extract word cloud data only
            positive_reviews = [r for r in reviews_data if r.get('sentiment') == '긍정']
            negative_reviews = [r for r in reviews_data if r.get('sentiment') == '부정']
            
            positive_words = extract_korean_words_advanced([r['content'] for r in positive_reviews], 'positive', 10) if positive_reviews else []
            negative_words = extract_korean_words_advanced([r['content'] for r in negative_reviews], 'negative', 10) if negative_reviews else []
            
            result = {
                'wordCloud': {
                    'positive': positive_words,
                    'negative': negative_words
                }
            }
        elif analysis_type == 'heart':
            # Generate HEART insights only
            result = analyze_sentiments(reviews_data)
            # Remove word cloud data from result
            if 'wordCloud' in result:
                del result['wordCloud']
        else:
            # Full analysis (backward compatibility)
            result = analyze_sentiments(reviews_data)
        
        # Clean up temp file
        try:
            os.remove(temp_file_path)
        except:
            pass
        
        print(json.dumps(result, ensure_ascii=False))
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()