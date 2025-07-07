import { users, reviews, insights, wordCloudData, type User, type InsertUser, type Review, type InsertReview, type Insight, type InsertInsight, type WordCloudData, type InsertWordCloudData } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getReviews(page: number, limit: number, filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<{ reviews: Review[], total: number }>;
  getReviewStats(filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<{ total: number, positive: number, negative: number, averageRating: number }>;
  createReview(review: InsertReview): Promise<Review>;
  
  getInsights(filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  
  getWordCloudData(sentiment: string): Promise<WordCloudData[]>;
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

  async getReviews(page: number, limit: number, filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<{ reviews: Review[], total: number }> {
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

  async getReviewStats(filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<{ total: number, positive: number, negative: number, averageRating: number }> {
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
    
    // Analyze specific issues and generate actionable insights
    const issueAnalysis = {
      cctv_issues: {
        patterns: /화면|확대|축소|cctv|씨씨티비|녹화|영상|카메라/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      app_crashes: {
        patterns: /튕김|꺼짐|크래시|멈춤|실행|안됨|오류|버그/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      login_auth: {
        patterns: /로그인|인증|접속|연결|끊김|자동로그인|매번/gi,
        count: 0,
        specificIssues: [] as string[]
      },
      ui_usability: {
        patterns: /불편|복잡|어려움|답답|사용|설정|등록/gi,
        count: 0,
        specificIssues: [] as string[]
      }
    };
    
    // Analyze each negative review for specific issues
    negativeReviews.forEach(review => {
      const content = review.content;
      
      // Track which categories this review has already been counted for
      const countedCategories = new Set<string>();
      
      Object.entries(issueAnalysis).forEach(([category, analysis]) => {
        const matches = content.match(analysis.patterns);
        if (matches && !countedCategories.has(category)) {
          // Count each review only once per category
          analysis.count += 1;
          countedCategories.add(category);
          
          // Extract specific issues for actionable insights
          if (category === 'cctv_issues') {
            if (content.includes('화면') && content.includes('확대')) {
              analysis.specificIssues.push('화면 확대/축소 기능');
            }
            if (content.includes('녹화') || content.includes('영상')) {
              analysis.specificIssues.push('녹화 영상 재생');
            }
            if (content.includes('감지') || content.includes('알림')) {
              analysis.specificIssues.push('침입감지 알림');
            }
          } else if (category === 'app_crashes') {
            if (content.includes('튕김') || content.includes('꺼짐')) {
              analysis.specificIssues.push('앱 강제 종료');
            }
            if (content.includes('실행') && content.includes('안됨')) {
              analysis.specificIssues.push('앱 실행 실패');
            }
          } else if (category === 'login_auth') {
            if (content.includes('자동로그인') || content.includes('매번')) {
              analysis.specificIssues.push('자동로그인 미작동');
            }
            if (content.includes('동시') || content.includes('가족')) {
              analysis.specificIssues.push('다중 사용자 접속');
            }
          } else if (category === 'ui_usability') {
            if (content.includes('가게') && content.includes('등록')) {
              analysis.specificIssues.push('가게 등록 과정');
            }
            if (content.includes('복잡') || content.includes('어려움')) {
              analysis.specificIssues.push('사용법 복잡성');
            }
          }
        }
      });
    });
    
    // Generate specific, actionable insights with business priority order
    let insightId = 1;
    
    // Define business priority order (higher number = higher priority)
    const businessPriority = {
      app_crashes: 4,    // 최우선: 앱이 작동하지 않으면 모든 것이 무의미
      login_auth: 3,     // 2순위: 로그인할 수 없으면 앱을 사용할 수 없음
      cctv_issues: 2,    // 3순위: 핵심 기능이지만 일부 기능은 사용 가능
      ui_usability: 1    // 4순위: 불편하지만 사용은 가능
    };
    
    Object.entries(issueAnalysis)
      .filter(([, analysis]) => analysis.count > 0)
      .sort(([categoryA, analysisA], [categoryB, analysisB]) => {
        // 먼저 비즈니스 우선순위로 정렬
        const priorityDiff = businessPriority[categoryB as keyof typeof businessPriority] - 
                           businessPriority[categoryA as keyof typeof businessPriority];
        if (priorityDiff !== 0) return priorityDiff;
        // 같은 우선순위면 언급 횟수로 정렬
        return analysisB.count - analysisA.count;
      })
      .slice(0, 4) // Top 4 most critical issues
      .forEach(([category, analysis]) => {
        const uniqueIssues = Array.from(new Set(analysis.specificIssues));
        
        let title = "";
        let description = "";
        let priority = "medium";
        
        switch (category) {
          case "cctv_issues":
            title = "CCTV 기능 개선";
            if (uniqueIssues.includes('화면 확대/축소 기능')) {
              description = "화면 확대/축소 기능 개선 - 사용자들이 CCTV 화면을 제대로 확대하지 못하는 문제";
            } else if (uniqueIssues.includes('침입감지 알림')) {
              description = "침입감지 알림 기능 개선 - 감지 알림이 제대로 전달되지 않는 문제";
            } else {
              description = `CCTV 관련 기능 개선 필요 - ${analysis.count}건의 문제 보고`;
            }
            // CCTV는 핵심 기능이므로 언급 횟수와 관계없이 중요도가 높음
            priority = analysis.count > 8 ? "high" : "medium";
            break;
            
          case "app_crashes":
            title = "앱 안정성 개선";
            if (uniqueIssues.includes('앱 강제 종료')) {
              description = "앱 튕김 현상 해결 - 사용 중 앱이 강제 종료되는 문제 수정";
            } else if (uniqueIssues.includes('앱 실행 실패')) {
              description = "앱 실행 오류 해결 - 앱이 시작되지 않는 문제 수정";
            } else {
              description = `앱 안정성 개선 필요 - ${analysis.count}건의 크래시 관련 문제`;
            }
            // 앱 크래시는 사용자 이탈에 직접적 영향을 미치므로 항상 최우선
            priority = "high";
            break;
            
          case "login_auth":
            title = "로그인/인증 개선";
            if (uniqueIssues.includes('자동로그인 미작동')) {
              description = "자동로그인 기능 개선 - 매번 로그인해야 하는 불편함 해결";
            } else if (uniqueIssues.includes('다중 사용자 접속')) {
              description = "다중 사용자 접속 지원 - 가족 구성원이 함께 사용할 수 있도록 개선";
            } else {
              description = `인증 시스템 개선 필요 - ${analysis.count}건의 로그인 관련 문제`;
            }
            // 로그인 문제는 앱 사용 자체를 막으므로 높은 우선순위
            priority = analysis.count > 5 ? "high" : "medium";
            break;
            
          case "ui_usability":
            title = "사용성 개선";
            if (uniqueIssues.includes('가게 등록 과정')) {
              description = "가게 등록 과정 간소화 - 매번 가게를 다시 등록해야 하는 문제 해결";
            } else if (uniqueIssues.includes('사용법 복잡성')) {
              description = "사용법 단순화 - 복잡한 인터페이스와 어려운 사용법 개선";
            } else {
              description = `사용성 개선 필요 - ${analysis.count}건의 UI/UX 관련 문제`;
            }
            // 사용성은 중요하지만 앱 사용을 완전히 막지는 않으므로 중간 우선순위
            priority = analysis.count > 15 ? "medium" : "low";
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
    
    return insights;
  }

  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const id = this.currentInsightId++;
    const insight: Insight = { ...insertInsight, id, trend: insertInsight.trend || null };
    this.insights.set(id, insight);
    return insight;
  }

  async getWordCloudData(sentiment: string): Promise<WordCloudData[]> {
    // Generate word cloud from actual reviews instead of static data
    const allReviews = Array.from(this.reviews.values());
    const filteredReviews = allReviews.filter(review => review.sentiment === sentiment);
    
    if (filteredReviews.length === 0) {
      return [];
    }
    
    // Extract Korean words from review content
    const wordFrequency: { [key: string]: number } = {};
    
    filteredReviews.forEach(review => {
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
