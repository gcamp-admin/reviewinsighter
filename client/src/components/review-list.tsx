import { useState } from "react";
import { Smartphone, Apple, Star, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Eye, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { ReviewFilters, PaginatedReviews } from "@/types";

interface ReviewListProps {
  filters: ReviewFilters;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function ReviewList({ filters, currentPage, onPageChange }: ReviewListProps) {
  const [sortOrder, setSortOrder] = useState("newest");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const limit = 10;

  const { data, isLoading, error } = useQuery<PaginatedReviews>({
    queryKey: ["/api/reviews", currentPage, limit, filters?.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (filters?.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters.source.length > 0) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const url = `/api/reviews?${params}`;
      console.log('Fetching reviews from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const result = await response.json();
      console.log('Reviews result:', result);
      return result;
    },
    enabled: !!filters?.service?.id, // Only fetch when service is selected
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Don't show anything when no service is selected
  if (!filters?.service?.id) {
    return null;
  }

  // Filter reviews locally based on sentiment
  const filteredReviews = data?.reviews?.filter(review => {
    if (sentimentFilter === "all") return true;
    return review.sentiment === sentimentFilter;
  }) || [];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
    }).replace(/\//g, ".");
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "google_play":
        return "📱";
      case "apple_store":
        return "🍎";
      case "naver_blog":
        return "📝";
      case "naver_cafe":
        return "☕";
      default:
        return "📄";
    }
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case "google_play":
        return "구글플레이스토어";
      case "apple_store":
        return "애플앱스토어";
      case "naver_blog":
        return "네이버블로그";
      case "naver_cafe":
        return "네이버카페";
      default:
        return source;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    return sentiment === "positive" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">긍정</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">부정</Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>리뷰 목록</CardTitle>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            리뷰 데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>리뷰 목록</span>
              <span className="text-sm text-muted-foreground">
                {data?.total ? `총 ${data.total}개` : ""}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>전체</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="positive">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span>긍정</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="negative">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span>부정</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            선택한 조건에 맞는 리뷰가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(data.total / limit);
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, data.total);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>리뷰 목록</span>
            <span className="text-sm text-muted-foreground">
              {data?.total ? `총 ${data.total}개` : ""}
            </span>
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>전체</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="positive">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span>긍정</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="negative">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span>부정</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="newest">최신순</SelectItem>
              <SelectItem value="oldest">오래된순</SelectItem>
              <SelectItem value="rating-high">평점높은순</SelectItem>
              <SelectItem value="rating-low">평점낮은순</SelectItem>
            </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredReviews.map((review) => (
            <div key={review.id} className="p-3 hover:bg-gray-50 transition-colors duration-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-lg">{getSourceIcon(review.source)}</span>
                  <span className="text-xs text-gray-500">{getSourceName(review.source)}</span>
                  <span className="font-medium text-gray-900">{review.userId}</span>
                  <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                  {/* Show rating for app stores only */}
                  {(review.source === "google_play" || review.source === "apple_store") && (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-1">⭐</span>
                      <span className="text-xs text-gray-500">{review.rating}</span>
                    </div>
                  )}
                </div>
                {getSentimentBadge(review.sentiment)}
              </div>
              <div className="text-gray-700 text-sm leading-relaxed">
                {/* Check if review has url for external links */}
                {(review as any).url ? (
                  <a 
                    href={(review as any).url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {review.content.length > 100 ? review.content.slice(0, 100) + '...' : review.content}
                  </a>
                ) : (
                  <span>
                    {review.content.length > 200 ? review.content.slice(0, 200) + '...' : review.content}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-gray-500">
            총 <span className="font-medium">{data.total.toLocaleString()}</span>개 중{" "}
            <span className="font-medium">{startItem}-{endItem}</span>개 표시
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={currentPage === page ? "bg-primary hover:bg-primary/90" : ""}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
