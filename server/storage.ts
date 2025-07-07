import { users, reviews, insights, wordCloudData, type User, type InsertUser, type Review, type InsertReview, type Insight, type InsertInsight, type WordCloudData, type InsertWordCloudData } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getReviews(page: number, limit: number, filters?: { source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<{ reviews: Review[], total: number }>;
  getReviewStats(): Promise<{ total: number, positive: number, negative: number, averageRating: number }>;
  createReview(review: InsertReview): Promise<Review>;
  
  getInsights(): Promise<Insight[]>;
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

  async getReviewStats(): Promise<{ total: number, positive: number, negative: number, averageRating: number }> {
    const allReviews = Array.from(this.reviews.values());
    const total = allReviews.length;
    const positive = allReviews.filter(r => r.sentiment === "positive").length;
    const negative = allReviews.filter(r => r.sentiment === "negative").length;
    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / total;

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

  async getInsights(): Promise<Insight[]> {
    // Generate insights from actual reviews instead of static data
    const allReviews = Array.from(this.reviews.values());
    const negativeReviews = allReviews.filter(review => review.sentiment === "negative");
    
    if (negativeReviews.length === 0) {
      return [];
    }
    
    const insights: Insight[] = [];
    
    // Analyze common issues in negative reviews
    const issuePatterns = {
      stability: /튕김|오류|버그|꺼짐|멈춤|크래시|안정성|문제/g,
      ui_ux: /불편|복잡|어려움|답답|화면|확대|인터페이스/g,
      login: /로그인|인증|접속|연결/g,
      features: /기능|사용|설정|등록/g
    };
    
    const issueCounts = {
      stability: 0,
      ui_ux: 0,
      login: 0,
      features: 0
    };
    
    negativeReviews.forEach(review => {
      const content = review.content;
      Object.entries(issuePatterns).forEach(([category, pattern]) => {
        const matches = content.match(pattern);
        if (matches) {
          issueCounts[category as keyof typeof issueCounts] += matches.length;
        }
      });
    });
    
    // Generate insights based on most common issues
    let insightId = 1;
    
    Object.entries(issueCounts)
      .filter(([, count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Top 3 issues
      .forEach(([category, count]) => {
        let title = "";
        let description = "";
        let priority = "medium";
        
        switch (category) {
          case "stability":
            title = "앱 안정성 개선";
            description = `앱 튕김 및 오류 관련 언급이 ${count}건 발견됨`;
            priority = count > 10 ? "high" : "medium";
            break;
          case "ui_ux":
            title = "UI/UX 개선";
            description = `사용성 및 인터페이스 불편 관련 언급이 ${count}건 발견됨`;
            priority = count > 8 ? "medium" : "low";
            break;
          case "login":
            title = "로그인/인증 개선";
            description = `로그인 및 인증 문제 관련 언급이 ${count}건 발견됨`;
            priority = count > 5 ? "high" : "medium";
            break;
          case "features":
            title = "기능 개선";
            description = `기능 관련 개선 요청이 ${count}건 발견됨`;
            priority = "low";
            break;
        }
        
        insights.push({
          id: insightId++,
          title,
          description,
          priority,
          mentionCount: count,
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
