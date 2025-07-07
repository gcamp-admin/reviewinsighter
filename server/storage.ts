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
    // Sample reviews
    const sampleReviews = [
      {
        userId: "김*호",
        source: "google_play",
        rating: 4,
        content: "우리가게 패키지 정말 좋아요! 매장 관리가 훨씬 편해졌고, 고객 관리도 체계적으로 할 수 있어서 만족스럽습니다. 다만 초기 설정이 조금 복잡했지만 익숙해지니 괜찮네요.",
        sentiment: "positive",
        createdAt: new Date("2024-01-15")
      },
      {
        userId: "이*진",
        source: "app_store",
        rating: 2,
        content: "앱이 자주 튕겨서 정말 불편해요. 주문 관리하다가 갑자기 꺼지면 처음부터 다시 해야 하는데 너무 스트레스 받습니다. 빨리 안정성 문제 해결해주세요.",
        sentiment: "negative",
        createdAt: new Date("2024-01-14")
      },
      {
        userId: "박*수",
        source: "google_play",
        rating: 5,
        content: "카페 사장입니다. 메뉴 관리부터 주문 접수까지 모든 기능이 직관적이고 사용하기 편해요. 특히 매출 통계 기능이 정말 유용합니다. 강력 추천!",
        sentiment: "positive",
        createdAt: new Date("2024-01-13")
      }
    ];

    sampleReviews.forEach(review => {
      const id = this.currentReviewId++;
      this.reviews.set(id, {
        id,
        ...review,
        createdAt: review.createdAt
      });
    });

    // Sample insights
    const sampleInsights = [
      {
        title: "앱 안정성 개선",
        description: "앱 튕김 및 크래시 문제가 가장 많이 언급됨 (73건)",
        priority: "high",
        mentionCount: 73,
        trend: "increasing",
        category: "stability"
      },
      {
        title: "UI/UX 개선",
        description: "복잡한 인터페이스 및 학습 곡선 관련 (45건)",
        priority: "medium",
        mentionCount: 45,
        trend: "stable",
        category: "ui_ux"
      },
      {
        title: "기능 확장",
        description: "추가 기능 요청 및 통합 개선 (28건)",
        priority: "low",
        mentionCount: 28,
        trend: "stable",
        category: "features"
      }
    ];

    sampleInsights.forEach(insight => {
      const id = this.currentInsightId++;
      this.insights.set(id, { id, ...insight });
    });

    // Sample word cloud data
    const positiveWords = [
      { word: "편리", frequency: 45 },
      { word: "좋음", frequency: 32 },
      { word: "만족", frequency: 38 },
      { word: "깔끔", frequency: 18 },
      { word: "유용", frequency: 28 },
      { word: "추천", frequency: 35 },
      { word: "직관적", frequency: 22 },
      { word: "효율적", frequency: 25 },
      { word: "간편", frequency: 20 },
      { word: "완벽", frequency: 15 }
    ];

    const negativeWords = [
      { word: "버그", frequency: 42 },
      { word: "느림", frequency: 28 },
      { word: "튕김", frequency: 35 },
      { word: "복잡", frequency: 18 },
      { word: "불편", frequency: 30 },
      { word: "오류", frequency: 25 },
      { word: "어려움", frequency: 15 },
      { word: "실망", frequency: 20 }
    ];

    [...positiveWords.map(w => ({ ...w, sentiment: "positive" })), 
     ...negativeWords.map(w => ({ ...w, sentiment: "negative" }))].forEach(word => {
      const id = this.currentWordCloudId++;
      this.wordCloudData.set(id, { id, ...word });
    });
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
      createdAt: new Date()
    };
    this.reviews.set(id, review);
    return review;
  }

  async getInsights(): Promise<Insight[]> {
    return Array.from(this.insights.values());
  }

  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const id = this.currentInsightId++;
    const insight: Insight = { ...insertInsight, id };
    this.insights.set(id, insight);
    return insight;
  }

  async getWordCloudData(sentiment: string): Promise<WordCloudData[]> {
    return Array.from(this.wordCloudData.values()).filter(
      data => data.sentiment === sentiment
    );
  }

  async createWordCloudData(insertData: InsertWordCloudData): Promise<WordCloudData> {
    const id = this.currentWordCloudId++;
    const data: WordCloudData = { ...insertData, id };
    this.wordCloudData.set(id, data);
    return data;
  }
}

export const storage = new MemStorage();
