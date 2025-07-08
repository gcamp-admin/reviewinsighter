import { users, reviews, insights, wordCloudData, type User, type InsertUser, type Review, type InsertReview, type Insight, type InsertInsight, type WordCloudData, type InsertWordCloudData } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getReviews(page: number, limit: number, filters?: { source?: string[], dateFrom?: Date, dateTo?: Date, sentiment?: string }): Promise<{ reviews: Review[], total: number }>;
  getReviewStats(filters?: { source?: string[], dateFrom?: Date, dateTo?: Date, sentiment?: string }): Promise<{ total: number, positive: number, negative: number, averageRating: number }>;
  createReview(review: InsertReview): Promise<Review>;
  
  getInsights(filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  
  getWordCloudData(sentiment: string, filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<WordCloudData[]>;
  createWordCloudData(data: InsertWordCloudData): Promise<WordCloudData>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reviews: Map<number, Review>;
  private insights: Map<number, Insight>;
  private wordCloudData: Map<number, WordCloudData>;
  private currentUserId: number;
  private currentReviewId: number;
  private currentInsightId: number;
  private currentWordCloudId: number;

  constructor() {
    this.users = new Map();
    this.reviews = new Map();
    this.insights = new Map();
    this.wordCloudData = new Map();
    this.currentUserId = 1;
    this.currentReviewId = 1;
    this.currentInsightId = 1;
    this.currentWordCloudId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // No sample data - all data will come from collected reviews
    console.log("Storage initialized - data will be generated from collected reviews");
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getReviews(page: number, limit: number, filters?: { serviceId?: string, source?: string[], dateFrom?: Date, dateTo?: Date, sentiment?: string }): Promise<{ reviews: Review[], total: number }> {
    let filteredReviews = Array.from(this.reviews.values());

    if (filters) {
      if (filters.serviceId) {
        filteredReviews = filteredReviews.filter(review => 
          review.serviceId === filters.serviceId
        );
      }
      if (filters.source && filters.source.length > 0) {
        filteredReviews = filteredReviews.filter(review => 
          filters.source!.includes(review.source)
        );
      }
      if (filters.dateFrom) {
        filteredReviews = filteredReviews.filter(review => 
          review.createdAt >= filters.dateFrom!
        );
      }
      if (filters.dateTo) {
        filteredReviews = filteredReviews.filter(review => 
          review.createdAt <= filters.dateTo!
        );
      }
      if (filters.sentiment && filters.sentiment !== "all") {
        filteredReviews = filteredReviews.filter(review => 
          review.sentiment === filters.sentiment
        );
      }
    }

    const sortedReviews = filteredReviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

    return {
      reviews: paginatedReviews,
      total: filteredReviews.length
    };
  }

  async getReviewStats(filters?: { serviceId?: string, source?: string[], dateFrom?: Date, dateTo?: Date, sentiment?: string }): Promise<{ total: number, positive: number, negative: number, averageRating: number }> {
    let filteredReviews = Array.from(this.reviews.values());

    if (filters) {
      if (filters.serviceId) {
        filteredReviews = filteredReviews.filter(review => 
          review.serviceId === filters.serviceId
        );
      }
      if (filters.source && filters.source.length > 0) {
        filteredReviews = filteredReviews.filter(review => 
          filters.source!.includes(review.source)
        );
      }
      if (filters.dateFrom) {
        filteredReviews = filteredReviews.filter(review => 
          review.createdAt >= filters.dateFrom!
        );
      }
      if (filters.dateTo) {
        filteredReviews = filteredReviews.filter(review => 
          review.createdAt <= filters.dateTo!
        );
      }
      if (filters.sentiment && filters.sentiment !== "all") {
        filteredReviews = filteredReviews.filter(review => 
          review.sentiment === filters.sentiment
        );
      }
    }

    const total = filteredReviews.length;
    if (total === 0) {
      return { total: 0, positive: 0, negative: 0, averageRating: 0 };
    }
    
    const positive = filteredReviews.filter(r => r.sentiment === "positive").length;
    const negative = filteredReviews.filter(r => r.sentiment === "negative").length;
    const averageRating = filteredReviews.reduce((sum, r) => sum + r.rating, 0) / total;

    return { total, positive, negative, averageRating: Math.round(averageRating * 10) / 10 };
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = { 
      ...insertReview, 
      id,
      serviceId: insertReview.serviceId || null,
      appId: insertReview.appId || null,
      createdAt: typeof insertReview.createdAt === 'string' ? new Date(insertReview.createdAt) : new Date()
    };
    this.reviews.set(id, review);
    console.log(`Created review ${id}: ${review.userId} - ${review.content.substring(0, 50)}...`);
    return review;
  }

  async getInsights(filters?: { serviceId?: string, source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<Insight[]> {
    // Generate insights from filtered reviews instead of all reviews
    let filteredReviews = Array.from(this.reviews.values());

    if (filters) {
      if (filters.serviceId) {
        filteredReviews = filteredReviews.filter(review => 
          review.serviceId === filters.serviceId
        );
      }
      if (filters.source && filters.source.length > 0) {
        filteredReviews = filteredReviews.filter(review => 
          filters.source!.includes(review.source)
        );
      }
      if (filters.dateFrom) {
        filteredReviews = filteredReviews.filter(review => 
          review.createdAt >= filters.dateFrom!
        );
      }
      if (filters.dateTo) {
        filteredReviews = filteredReviews.filter(review => 
          review.createdAt <= filters.dateTo!
        );
      }
    }

    const negativeReviews = filteredReviews.filter(review => review.sentiment === "negative");
    
    if (negativeReviews.length === 0) {
      return [];
    }
    
    const insights: Insight[] = [];
    
    // HEART 프레임워크 기반으로 분석
    const heartAnalysis = {
      happiness: {
        patterns: /블루투스|음질|통화품질|떨어집니다|음성|들리지|목소리|소리|네비게이션|짜증|불만|실망|답답/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      engagement: {
        patterns: /통화중대기|업데이트|언제|기능|요청|개선|추가|만들어주세요|끊김|연결/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      adoption: {
        patterns: /아이폰|설정|이용제한|법인폰|자급제폰|등록|설치|개통폰|법인사업자|처음|어려움|복잡/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      retention: {
        patterns: /삭제|해지|그만|안쓸|바꿀|돌아가|이전|다른/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      task_success: {
        patterns: /전화받자마자|꺼지는|즉시끊어|수신전화|받는순간|전화가|안받아져|끊어짐|받아지지|안됨|오류|실패/gi,
        count: 0,
        specificIssues: [] as string[]
      }
    };
    
    // Analyze each negative review for specific issues
    negativeReviews.forEach(review => {
      const content = review.content;
      
      // Track which categories this review has already been counted for
      const countedCategories = new Set<string>();
      
      Object.entries(heartAnalysis).forEach(([category, analysis]) => {
        const matches = content.match(analysis.patterns);
        if (matches && !countedCategories.has(category)) {
          // Count each review only once per category
          analysis.count += 1;
          countedCategories.add(category);
          
          // Extract specific issues for HEART framework based on actual review content
          if (category === 'happiness') {
            if (content.match(/블루투스|음질|통화품질|네비게이션/gi)) {
              analysis.specificIssues.push('통화 품질 문제');
            }
            if (content.match(/답답|불편|짜증/gi)) {
              analysis.specificIssues.push('사용성 불만');
            }
          } else if (category === 'engagement') {
            if (content.match(/통화중대기|업데이트|언제/gi)) {
              analysis.specificIssues.push('기능 완성도');
            }
            if (content.match(/끊김|연결/gi)) {
              analysis.specificIssues.push('연결 안정성');
            }
          } else if (category === 'adoption') {
            if (content.match(/아이폰|법인폰|자급제폰/gi)) {
              analysis.specificIssues.push('디바이스 호환성');
            }
            if (content.match(/설정|등록|이용제한/gi)) {
              analysis.specificIssues.push('접근성 제한');
            }
          } else if (category === 'retention') {
            if (content.match(/삭제|해지|실망/gi)) {
              analysis.specificIssues.push('사용자 이탈');
            }
            if (content.match(/다른|바꿀/gi)) {
              analysis.specificIssues.push('경쟁사 이동');
            }
          } else if (category === 'task_success') {
            if (content.match(/전화받자마자|꺼지는|즉시끊어|받는순간/gi)) {
              analysis.specificIssues.push('통화 연결 실패');
            }
            if (content.match(/안받아져|끊어짐|받아지지/gi)) {
              analysis.specificIssues.push('수신 기능 오류');
            }
          }
        }
      });
    });
    
    // Generate specific, actionable insights with business priority order
    let insightId = 1;
    
    // HEART 프레임워크 우선순위 (UX 영향도 기준)
    // 우선순위 결정 로직:
    // 1. 언급 횟수 (많을수록 높은 우선순위)
    // 2. 비즈니스 임계성 (기능 실패 > 사용자 이탈 > 만족도 > 참여도 > 온보딩)
    // 3. 최종 우선순위 = 언급 횟수 × 비즈니스 중요도 점수
    const heartPriority = {
      task_success: 5,   // 최우선: 기본 기능이 작동하지 않으면 의미 없음
      retention: 4,      // 2순위: 사용자 이탈 방지가 비즈니스에 직접 영향
      happiness: 3,      // 3순위: 만족도는 장기적 성공의 핵심
      engagement: 2,     // 4순위: 참여도 향상으로 가치 증대
      adoption: 1        // 5순위: 새 사용자 온보딩 개선
    };
    
    Object.entries(heartAnalysis)
      .filter(([, analysis]) => analysis.count > 0)
      .sort(([categoryA, analysisA], [categoryB, analysisB]) => {
        // HEART 우선순위로 정렬
        const priorityDiff = heartPriority[categoryB as keyof typeof heartPriority] - 
                           heartPriority[categoryA as keyof typeof heartPriority];
        if (priorityDiff !== 0) return priorityDiff;
        // 같은 우선순위면 언급 횟수로 정렬
        return analysisB.count - analysisA.count;
      })
      .slice(0, 5) // Top 5 HEART elements
      .forEach(([category, analysis]) => {
        const uniqueIssues = Array.from(new Set(analysis.specificIssues));
        
        let title = "";
        let description = "";
        let priority = "major";
        
        switch (category) {
          case "happiness":
            title = "사용자 만족도 개선 (Happiness)";
            if (uniqueIssues.includes('통화 품질 문제')) {
              description = "통화 품질 개선 - 블루투스 연결 및 음성 품질 관련 불만 해소";
            } else if (uniqueIssues.includes('사용성 불만')) {
              description = "사용 편의성 개선 - 답답함과 불편함을 해소하는 UX 개선";
            } else {
              description = `전반적 만족도 개선 필요 - ${analysis.count}건의 품질 관련 문제`;
            }
            priority = analysis.count > 8 ? "critical" : "major";
            break;
            
          case "engagement":
            title = "사용자 참여도 개선 (Engagement)";
            if (uniqueIssues.includes('기능 완성도')) {
              description = "기능 완성도 향상 - 통화중대기 등 요청 기능 업데이트 필요";
            } else if (uniqueIssues.includes('연결 안정성')) {
              description = "연결 안정성 강화 - 끊김 현상으로 인한 사용 중단 방지";
            } else {
              description = `사용자 참여도 향상 - ${analysis.count}건의 기능 개선 요청`;
            }
            priority = analysis.count > 6 ? "critical" : "major";
            break;
            
          case "adoption":
            title = "신규 사용자 적응 개선 (Adoption)";
            if (uniqueIssues.includes('디바이스 호환성')) {
              description = "사용 접근성 확대 - 아이폰 및 법인폰 사용자 지원 강화";
            } else if (uniqueIssues.includes('접근성 제한')) {
              description = "이용 제한 해소 - 다양한 환경에서의 접근성 개선";
            } else {
              description = `신규 사용자 접근성 개선 - ${analysis.count}건의 호환성 관련 문제`;
            }
            priority = analysis.count > 4 ? "major" : "minor";
            break;
            
          case "retention":
            title = "사용자 재방문율 개선 (Retention)";
            if (uniqueIssues.includes('이탈 의도')) {
              description = "이탈 방지 대책 - 삭제/해지 의도를 보이는 사용자 유지";
            } else if (uniqueIssues.includes('경쟁사 이동')) {
              description = "경쟁력 강화 - 타 서비스 이동 방지를 위한 차별화";
            } else {
              description = `사용자 유지 개선 - ${analysis.count}건의 이탈 관련 언급`;
            }
            priority = analysis.count > 3 ? "critical" : "major";
            break;
            
          case "task_success":
            title = "작업 성공률 개선 (Task Success)";
            if (uniqueIssues.includes('통화 연결 실패')) {
              description = "전화 수신/발신 안정성 향상 - 통화 연결 실패 및 즉시 끊김 현상 해결";
            } else if (uniqueIssues.includes('수신 기능 오류')) {
              description = "통화 기능 신뢰성 강화 - 전화 받기 실패 문제 해결";
            } else {
              description = `핵심 통화 기능 안정화 - ${analysis.count}건의 통화 관련 문제`;
            }
            priority = "critical"; // Task Success는 항상 Critical 우선순위
            break;
        }
        
        insights.push({
          id: insightId++,
          title,
          description,
          priority,
          mentionCount: analysis.count,
          trend: "stable",
          category
        });
      });
    
    // Sort by priority first (critical > major > minor), then by mentionCount
    const priorityOrder = { critical: 3, major: 2, minor: 1 };
    return insights.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return b.mentionCount - a.mentionCount;
    });
  }

  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const id = this.currentInsightId++;
    const insight: Insight = { ...insertInsight, id, trend: insertInsight.trend || null };
    this.insights.set(id, insight);
    return insight;
  }

  async getWordCloudData(sentiment: string, filters?: { serviceId?: string, source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<WordCloudData[]> {
    // Generate word cloud from filtered reviews instead of all reviews
    let filteredReviews = Array.from(this.reviews.values());

    if (filters) {
      if (filters.serviceId) {
        filteredReviews = filteredReviews.filter(review => 
          review.serviceId === filters.serviceId
        );
      }
      if (filters.source && filters.source.length > 0) {
        filteredReviews = filteredReviews.filter(review => 
          filters.source!.includes(review.source)
        );
      }
      if (filters.dateFrom) {
        filteredReviews = filteredReviews.filter(review => 
          review.createdAt >= filters.dateFrom!
        );
      }
      if (filters.dateTo) {
        filteredReviews = filteredReviews.filter(review => 
          review.createdAt <= filters.dateTo!
        );
      }
    }

    const sentimentFilteredReviews = filteredReviews.filter(review => review.sentiment === sentiment);
    
    if (sentimentFilteredReviews.length === 0) {
      return [];
    }
    
    // Extract Korean words from review content
    const wordFrequency = new Map<string, number>();
    
    sentimentFilteredReviews.forEach(review => {
      const content = review.content;
      
      // Extract meaningful Korean words (2+ characters, remove common stopwords)
      const koreanWords = content
        .replace(/[^\uAC00-\uD7AF\u3131-\u3163\u1100-\u11FF\s]/g, ' ') // Keep only Korean characters
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !['그냥', '정말', '너무', '아주', '매우', '좀', '진짜', '완전', '조금', '많이', '잘', '안', '못', '되', '하', '이', '가', '을', '를', '의', '에', '와', '과', '도', '만', '까지', '부터', '로', '으로', '에서', '한테', '께', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'].includes(word));
      
      koreanWords.forEach(word => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
    });
    
    // Convert to WordCloudData format, sorted by frequency
    const wordCloudData: WordCloudData[] = Array.from(wordFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20) // Top 20 words
      .map(([word, frequency], index) => ({
        id: index + 1,
        word,
        frequency,
        sentiment
      }));
    
    return wordCloudData;
  }

  async createWordCloudData(insertData: InsertWordCloudData): Promise<WordCloudData> {
    const id = this.currentWordCloudId++;
    const data: WordCloudData = { ...insertData, id };
    this.wordCloudData.set(id, data);
    return data;
  }
}

export const storage = new MemStorage();
