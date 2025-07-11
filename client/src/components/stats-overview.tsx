import { MessageSquare, ThumbsUp, ThumbsDown, Star, Minus } from "lucide-react";
import { FaGooglePlay, FaApple, FaPenNib, FaMugHot } from 'react-icons/fa';
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReviewStats, ReviewFilters } from "@/types";

interface StatsOverviewProps {
  filters: ReviewFilters;
}

const storeIcons = {
  googlePlay: <FaGooglePlay color="#34A853" />,
  appleStore: <FaApple color="#333" />,
  naverBlog: <FaPenNib color="#03c75a" />,
  naverCafe: <FaMugHot color="#03c75a" />
};

function StoreIcon({ source }: { source: string }) {
  switch (source) {
    case 'google_play':
      return storeIcons.googlePlay;
    case 'app_store':
      return storeIcons.appleStore;
    case 'naver_blog':
      return storeIcons.naverBlog;
    case 'naver_cafe':
      return storeIcons.naverCafe;
    default:
      return null;
  }
}

export default function StatsOverview({ filters }: StatsOverviewProps) {
  const { data: stats, isLoading } = useQuery<ReviewStats>({
    queryKey: ["/api/reviews/stats", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters?.source && filters.source.length > 0) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters?.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/reviews/stats?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
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

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-all duration-300 animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              통계 데이터를 불러올 수 없습니다.
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">총 리뷰 수</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{stats.total.toLocaleString()}</p>
              <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                {stats.countsBySource.googlePlay > 0 && (
                  <div className="flex items-center gap-1 hover:text-green-600 transition-colors">
                    <StoreIcon source="google_play" />
                    <span>구글플레이 {stats.countsBySource.googlePlay}건</span>
                  </div>
                )}
                {stats.countsBySource.appleStore > 0 && (
                  <div className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                    <StoreIcon source="app_store" />
                    <span>애플앱스토어 {stats.countsBySource.appleStore}건</span>
                  </div>
                )}
                {stats.countsBySource.naverBlog > 0 && (
                  <div className="flex items-center gap-1 hover:text-green-600 transition-colors">
                    <StoreIcon source="naver_blog" />
                    <span>네이버블로그 {stats.countsBySource.naverBlog}건</span>
                  </div>
                )}
                {stats.countsBySource.naverCafe > 0 && (
                  <div className="flex items-center gap-1 hover:text-green-600 transition-colors">
                    <StoreIcon source="naver_cafe" />
                    <span>네이버카페 {stats.countsBySource.naverCafe}건</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">긍정 리뷰</p>
              <p className="text-2xl font-bold text-green-600 group-hover:text-green-700 transition-colors">{stats.positive.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
              <ThumbsUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">부정 리뷰</p>
              <p className="text-2xl font-bold text-red-600 group-hover:text-red-700 transition-colors">{stats.negative.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 group-hover:scale-110 transition-all duration-300">
              <ThumbsDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">중립 리뷰</p>
              <p className="text-2xl font-bold text-gray-600 group-hover:text-gray-700 transition-colors">{stats.neutral?.toLocaleString() || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300">
              <Minus className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">평균 평점</p>
              <p className="text-2xl font-bold text-yellow-600 group-hover:text-yellow-700 transition-colors">{stats.averageRating}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 group-hover:scale-110 transition-all duration-300">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
