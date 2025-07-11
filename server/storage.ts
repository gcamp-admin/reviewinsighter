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
  
  // Clear analysis data when new reviews are collected
  clearAnalysisData(serviceId: string): Promise<void>;
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
    
    // Start with empty data - all data will come from collected reviews
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
        const dateFrom = new Date(filters.dateFrom);
        filteredReviews = filteredReviews.filter(review => 
          new Date(review.createdAt) >= dateFrom
        );
      }
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        // Set time to end of day for dateTo
        dateTo.setHours(23, 59, 59, 999);
        filteredReviews = filteredReviews.filter(review => 
          new Date(review.createdAt) <= dateTo
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
        const dateFrom = new Date(filters.dateFrom);
        filteredReviews = filteredReviews.filter(review => 
          new Date(review.createdAt) >= dateFrom
        );
      }
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        // Set time to end of day for dateTo
        dateTo.setHours(23, 59, 59, 999);
        filteredReviews = filteredReviews.filter(review => 
          new Date(review.createdAt) <= dateTo
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
    // Check for duplicate reviews based on userId, content, and source
    const existingReview = Array.from(this.reviews.values()).find(review => 
      review.userId === insertReview.userId &&
      review.content === insertReview.content &&
      review.source === insertReview.source
    );
    
    if (existingReview) {
      console.log(`Skipping duplicate review from ${insertReview.userId}: ${insertReview.content.substring(0, 50)}...`);
      return existingReview;
    }
    
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

    // Return only insights stored from Python analysis - no hardcoded generation
    let filteredInsights = Array.from(this.insights.values());

    if (filters) {
      if (filters.serviceId) {
        filteredInsights = filteredInsights.filter(insight => 
          insight.serviceId === filters.serviceId
        );
      }
    }

    return filteredInsights;
  }

  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const id = this.currentInsightId++;
    const insight: Insight = { ...insertInsight, id, trend: insertInsight.trend || null };
    this.insights.set(id, insight);
    return insight;
  }

  async getWordCloudData(sentiment: string, filters?: { serviceId?: string, source?: string[], dateFrom?: Date, dateTo?: Date }): Promise<WordCloudData[]> {
    // Return stored word cloud data from Python analysis instead of generating dynamically
    let filteredWordCloudData = Array.from(this.wordCloudData.values());

    // Filter by sentiment first
    filteredWordCloudData = filteredWordCloudData.filter(data => data.sentiment === sentiment);

    if (filters) {
      if (filters.serviceId) {
        filteredWordCloudData = filteredWordCloudData.filter(data => 
          data.serviceId === filters.serviceId
        );
      }
      // Note: source and date filtering is not applicable to word cloud data
      // as it's generated from the analysis of all reviews within the original analysis date range
    }

    // Sort by frequency and return top 10 as requested
    return filteredWordCloudData
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  async createWordCloudData(insertData: InsertWordCloudData): Promise<WordCloudData> {
    const id = this.currentWordCloudId++;
    const data: WordCloudData = { ...insertData, id };
    this.wordCloudData.set(id, data);
    return data;
  }

  // Clear analysis data when new reviews are collected
  async clearAnalysisData(serviceId: string): Promise<void> {
    console.log(`Clearing analysis data for service: ${serviceId}`);
    
    // Clear ALL insights and word cloud data for now (since old data doesn't have serviceId)
    const beforeInsights = this.insights.size;
    const beforeWordCloud = this.wordCloudData.size;
    
    this.insights.clear();
    this.wordCloudData.clear();
    
    console.log(`Cleared ${beforeInsights} insights and ${beforeWordCloud} word cloud items`);
  }
}

export const storage = new MemStorage();
