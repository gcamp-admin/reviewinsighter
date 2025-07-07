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

  async getReviews(page: number, limit: number, filters?: { source?: string[], dateFrom?: Date, dateTo?: Date, sentiment?: string }): Promise<{ reviews: Review[], total: number }> {
    let filteredReviews = Array.from(this.reviews.values());

    if (filters) {
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

  async getReviewStats(filters?: { source?: string[], dateFrom?: Date, dateTo?: Date, sentiment?: string }): Promise<{ total: number, positive: number, negative: number, averageRating: number }> {
    let filteredReviews = Array.from(this.reviews.values());

    if (filters) {
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
      createdAt: typeof insertReview.createdAt === 'string' ? new Date(insertReview.createdAt) : new Date()
    };
    this.reviews.set(id, review);
    console.log(`Created review ${id}: ${review.userId} - ${review.content.substring(0, 50)}...`);
    return review;
  }

  async getInsights(filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<Insight[]> {
    // Generate insights from filtered reviews instead of all reviews
    let filteredReviews = Array.from(this.reviews.values());

    if (filters) {
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
        patterns: /짜증|불만|실망|화남|최악|구림|답답|별로|안좋|싫어|나쁨/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      engagement: {
        patterns: /자주|매번|계속|끊김|연결|접속|시간|느림|속도/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      adoption: {
        patterns: /처음|새로|어려움|복잡|모르겠|설치|설정|가입|등록/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      retention: {
        patterns: /삭제|해지|그만|안쓸|바꿀|돌아가|이전|다른/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      task_success: {
        patterns: /오류|에러|실패|안됨|튕김|꺼짐|작동|기능|문제|불가능/gi,
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
          
          // Extract specific issues for HEART framework
          if (category === 'happiness') {
            if (content.match(/짜증|화남|최악/gi)) {
              analysis.specificIssues.push('강한 부정 감정');
            }
            if (content.match(/답답|불편/gi)) {
              analysis.specificIssues.push('사용성 불만');
            }
          } else if (category === 'engagement') {
            if (content.match(/끊김|연결/gi)) {
              analysis.specificIssues.push('연결 안정성');
            }
            if (content.match(/느림|속도/gi)) {
              analysis.specificIssues.push('성능 이슈');
            }
          } else if (category === 'adoption') {
            if (content.match(/어려움|복잡/gi)) {
              analysis.specificIssues.push('학습 곡선');
            }
            if (content.match(/설정|등록/gi)) {
              analysis.specificIssues.push('초기 설정');
            }
          } else if (category === 'retention') {
            if (content.match(/삭제|해지/gi)) {
              analysis.specificIssues.push('이탈 의도');
            }
            if (content.match(/다른|바꿀/gi)) {
              analysis.specificIssues.push('경쟁사 이동');
            }
          } else if (category === 'task_success') {
            if (content.match(/오류|에러|실패/gi)) {
              analysis.specificIssues.push('기능 실패');
            }
            if (content.match(/튕김|꺼짐/gi)) {
              analysis.specificIssues.push('앱 안정성');
            }
          }
        }
      });
    });
    
    // Generate specific, actionable insights with business priority order
    let insightId = 1;
    
    // HEART 프레임워크 우선순위 (UX 영향도 기준)
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
        let priority = "medium";
        
        switch (category) {
          case "happiness":
            title = "사용자 만족도 개선 (Happiness)";
            if (uniqueIssues.includes('강한 부정 감정')) {
              description = "사용자 불만 해소 - 강한 부정적 감정 표현을 보이는 사용자 대상 개선";
            } else if (uniqueIssues.includes('사용성 불만')) {
              description = "사용 편의성 개선 - 답답함과 불편함을 해소하는 UX 개선";
            } else {
              description = `전반적 만족도 개선 필요 - ${analysis.count}건의 부정적 감정 표현`;
            }
            priority = analysis.count > 8 ? "high" : "medium";
            break;
            
          case "engagement":
            title = "사용자 참여도 개선 (Engagement)";
            if (uniqueIssues.includes('연결 안정성')) {
              description = "연결 안정성 강화 - 끊김 현상으로 인한 사용 중단 방지";
            } else if (uniqueIssues.includes('성능 이슈')) {
              description = "성능 최적화 - 느린 속도로 인한 사용자 이탈 방지";
            } else {
              description = `참여도 향상 필요 - ${analysis.count}건의 사용 지속성 관련 문제`;
            }
            priority = analysis.count > 6 ? "high" : "medium";
            break;
            
          case "adoption":
            title = "신규 사용자 적응 개선 (Adoption)";
            if (uniqueIssues.includes('학습 곡선')) {
              description = "사용법 단순화 - 복잡함으로 인한 신규 사용자 포기 방지";
            } else if (uniqueIssues.includes('초기 설정')) {
              description = "온보딩 개선 - 초기 설정 과정의 복잡성 해소";
            } else {
              description = `신규 사용자 경험 개선 - ${analysis.count}건의 학습 관련 문제`;
            }
            priority = analysis.count > 4 ? "medium" : "low";
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
            priority = analysis.count > 3 ? "high" : "medium";
            break;
            
          case "task_success":
            title = "작업 성공률 개선 (Task Success)";
            if (uniqueIssues.includes('기능 실패')) {
              description = "핵심 기능 안정화 - 오류로 인한 작업 실패 방지";
            } else if (uniqueIssues.includes('앱 안정성')) {
              description = "앱 안정성 강화 - 튕김/종료로 인한 작업 중단 방지";
            } else {
              description = `작업 완료율 향상 - ${analysis.count}건의 실행 실패 문제`;
            }
            priority = "high"; // Task Success는 항상 높은 우선순위
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
    
    // Sort by priority first (high > medium > low), then by mentionCount
    const priorityOrder = { high: 3, medium: 2, low: 1 };
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

  async getWordCloudData(sentiment: string, filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<WordCloudData[]> {
    // Generate word cloud from filtered reviews instead of all reviews
    let filteredReviews = Array.from(this.reviews.values());

    if (filters) {
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
    const wordFrequency: { [key: string]: number } = {};
    
    sentimentFilteredReviews.forEach(review => {
      const content = review.content.toLowerCase();
      // Extract Korean words (2-4 characters)
      const koreanWords = content.match(/[가-힣]{2,4}/g) || [];
      
      koreanWords.forEach(word => {
        // Filter out common words and focus on meaningful terms
        if (!['것을', '이것', '그것', '때문', '에서', '으로', '에게', '한테', '처럼', '같이', '하고', '해서'].includes(word)) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });
    
    // Convert to WordCloudData format and get top 20
    const wordCloudData: WordCloudData[] = Object.entries(wordFrequency)
      .filter(([word, freq]) => freq > 1) // Only words mentioned more than once
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
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
