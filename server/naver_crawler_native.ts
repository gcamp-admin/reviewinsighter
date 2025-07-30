/**
 * Native TypeScript Naver API crawler for deployment environment
 * Self-contained without Python dependencies
 */

import axios from 'axios';
import { insertReviewSchema } from '../shared/schema';

interface NaverSearchResult {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  postdate?: string;
}

interface NaverApiResponse {
  total: number;
  start: number;
  display: number;
  items: NaverSearchResult[];
}

interface ServiceInfo {
  google_play_id: string;
  apple_store_id: string;
  keywords: string[];
}

function getServiceInfo(serviceName: string): ServiceInfo {
  const services: Record<string, ServiceInfo> = {
    '익시오': {
      google_play_id: 'com.lguplus.ixio',
      apple_store_id: '1483690659',
      keywords: ['익시오', 'ixio', 'LG U+', '유플러스', 'U+', 'uplus']
    },
    'SOHO우리가게패키지': {
      google_play_id: 'com.lguplus.soho',
      apple_store_id: '1234567890',
      keywords: ['우리가게', 'SOHO', 'LG', '유플러스', 'U+']
    },
    'AI비즈콜': {
      google_play_id: 'com.lguplus.aibizcall',
      apple_store_id: '1234567891',
      keywords: ['AI비즈콜', '비즈콜', 'LG', '유플러스']
    }
  };
  return services[serviceName] || services['익시오'];
}

function getServiceId(serviceName: string): string {
  const serviceMapping: Record<string, string> = {
    '익시오': 'ixio',
    'SOHO우리가게패키지': 'soho',
    'AI비즈콜': 'ai-bizcall'
  };
  return serviceMapping[serviceName] || 'ixio';
}

export async function crawlNaverBlog(
  serviceName: string,
  startDate?: string,
  endDate?: string,
  count: number = 50
): Promise<any[]> {
  try {
    console.log(`Native TypeScript Naver Blog crawling for ${serviceName}`);
    
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Naver API credentials not found');
    }
    
    const serviceInfo = getServiceInfo(serviceName);
    const keywords = serviceInfo.keywords;
    const reviews: any[] = [];
    
    // Search for each keyword
    for (const keyword of keywords.slice(0, 3)) {
      try {
        const response = await axios.get('https://openapi.naver.com/v1/search/blog.json', {
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret
          },
          params: {
            query: `"${keyword}"`,
            display: 20,
            sort: 'date'
          },
          timeout: 10000
        });
        
        const data: NaverApiResponse = response.data;
        console.log(`Naver Blog API: ${data.items.length} items for keyword '${keyword}'`);
        
        for (const item of data.items) {
          // Extract user ID from blog URL
          let userId = "unknown_blogger";
          if (item.link.includes('blog.naver.com/')) {
            try {
              userId = item.link.split('blog.naver.com/')[1].split('/')[0];
            } catch {}
          }
          
          const review = {
            content: item.description.replace(/<[^>]+>/g, '').trim(),
            rating: 4.0,
            userId: userId,
            date: new Date().toISOString(),
            source: 'naver_blog',
            sentiment: '분석중',
            serviceId: getServiceId(serviceName),
            link: item.link,
            title: item.title.replace(/<[^>]+>/g, '').trim()
          };
          
          // Only add if content is meaningful
          if (review.content.length > 10) {
            reviews.push(review);
          }
          
          if (reviews.length >= count) break;
        }
        
      } catch (keywordError) {
        console.error(`Error searching for keyword '${keyword}':`, keywordError);
        continue;
      }
      
      if (reviews.length >= count) break;
    }
    
    console.log(`Collected ${reviews.length} Naver Blog reviews`);
    return reviews.slice(0, count);
    
  } catch (error) {
    console.error('Naver Blog crawling error:', error);
    return [];
  }
}

export async function crawlNaverCafe(
  serviceName: string,
  startDate?: string,
  endDate?: string,
  count: number = 50
): Promise<any[]> {
  try {
    console.log(`Native TypeScript Naver Cafe crawling for ${serviceName}`);
    
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Naver API credentials not found');
    }
    
    const serviceInfo = getServiceInfo(serviceName);
    const keywords = serviceInfo.keywords;
    const reviews: any[] = [];
    
    // Search for each keyword
    for (const keyword of keywords.slice(0, 3)) {
      try {
        const response = await axios.get('https://openapi.naver.com/v1/search/cafearticle.json', {
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret
          },
          params: {
            query: `"${keyword}"`,
            display: 20,
            sort: 'date'
          },
          timeout: 10000
        });
        
        const data: NaverApiResponse = response.data;
        console.log(`Naver Cafe API: ${data.items.length} items for keyword '${keyword}'`);
        
        for (const item of data.items) {
          // Extract cafe name from URL
          let cafeName = "unknown_cafe";
          if (item.link.includes('cafe.naver.com/')) {
            try {
              cafeName = item.link.split('cafe.naver.com/')[1].split('/')[0];
            } catch {}
          }
          
          const review = {
            content: item.description.replace(/<[^>]+>/g, '').trim(),
            rating: 3.0,
            userId: cafeName,
            date: new Date().toISOString(),
            source: 'naver_cafe',
            sentiment: '분석중',
            serviceId: getServiceId(serviceName),
            link: item.link,
            title: item.title.replace(/<[^>]+>/g, '').trim()
          };
          
          // Only add if content is meaningful
          if (review.content.length > 10) {
            reviews.push(review);
          }
          
          if (reviews.length >= count) break;
        }
        
      } catch (keywordError) {
        console.error(`Error searching for keyword '${keyword}':`, keywordError);
        continue;
      }
      
      if (reviews.length >= count) break;
    }
    
    console.log(`Collected ${reviews.length} Naver Cafe reviews`);
    return reviews.slice(0, count);
    
  } catch (error) {
    console.error('Naver Cafe crawling error:', error);
    return [];
  }
}

export async function nativeCrawler(
  serviceName: string,
  selectedChannels: any,
  startDate?: string,
  endDate?: string,
  count: number = 100
): Promise<any[]> {
  console.log('Starting native TypeScript crawler');
  
  const allReviews: any[] = [];
  
  try {
    // Crawl Naver Blog if selected
    if (selectedChannels.naverBlog) {
      const blogReviews = await crawlNaverBlog(serviceName, startDate, endDate, count);
      allReviews.push(...blogReviews);
      console.log(`Added ${blogReviews.length} blog reviews`);
    }
    
    // Crawl Naver Cafe if selected
    if (selectedChannels.naverCafe) {
      const cafeReviews = await crawlNaverCafe(serviceName, startDate, endDate, count);
      allReviews.push(...cafeReviews);
      console.log(`Added ${cafeReviews.length} cafe reviews`);
    }
    
    console.log(`Native crawler completed: ${allReviews.length} total reviews`);
    return allReviews;
    
  } catch (error) {
    console.error('Native crawler error:', error);
    return [];
  }
}