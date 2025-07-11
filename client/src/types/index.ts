export interface Service {
  id: string;
  name: string;
  googlePlayId: string;
  appleStoreId: string;
  naverBlogId?: string;
  naverCafeId?: string;
  keywords?: string[];
}

export interface ReviewFilters {
  service?: Service;
  source: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ReviewStats {
  total: number;
  positive: number;
  negative: number;
  averageRating: number;
}

export interface PaginatedReviews {
  reviews: Review[];
  total: number;
}

export interface Review {
  id: number;
  userId: string;
  source: string;
  rating: number;
  content: string;
  sentiment: string;
  createdAt: Date;
}

export interface Insight {
  id: number;
  title: string;
  description: string;
  priority: string;
  mentionCount: number;
  trend?: string;
  category: string;
}

export interface WordCloudData {
  id: number;
  word: string;
  frequency: number;
  sentiment: string;
}

export interface CollectResponse {
  message: string;
  success: boolean;
}
