import { MessageSquare, ThumbsUp, ThumbsDown, Star, Minus } from "lucide-react";
import { FaGooglePlay, FaApple, FaPenNib, FaMugHot } from 'react-icons/fa';
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";
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

  // 도넛차트 데이터 준비
  const donutData = [
    { name: '구글플레이', value: stats.countsBySource.googlePlay, color: '#34A853' },
    { name: '애플앱스토어', value: stats.countsBySource.appleStore, color: '#333333' },
    { name: '네이버블로그', value: stats.countsBySource.naverBlog, color: '#03C75A' },
    { name: '네이버카페', value: stats.countsBySource.naverCafe, color: '#06B6D4' },
  ].filter(item => item.value > 0);

  // 수평 막대 그래프 데이터
  const maxSentimentValue = Math.max(stats.positive, stats.negative, stats.neutral || 0);
  const positivePercentage = (stats.positive / maxSentimentValue) * 100;
  const negativePercentage = (stats.negative / maxSentimentValue) * 100;
  const neutralPercentage = ((stats.neutral || 0) / maxSentimentValue) * 100;

  return (
    <section className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
      {/* 총 리뷰 수 - 도넛차트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/50 backdrop-blur rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">총 리뷰 수</p>
            <p className="text-3xl font-bold text-gray-900 glow-number">{stats.total.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={32}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            {donutData.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span>{item.name} {item.value}건</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* 긍정 리뷰 - 수평 막대 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white/50 backdrop-blur rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">긍정 리뷰</p>
            <p className="text-3xl font-bold text-green-600 glow-number">{stats.positive.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <ThumbsUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${positivePercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500">전체 대비 {Math.round((stats.positive / stats.total) * 100)}%</p>
        </div>
      </motion.div>
      
      {/* 부정 리뷰 - 수평 막대 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white/50 backdrop-blur rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">부정 리뷰</p>
            <p className="text-3xl font-bold text-red-600 glow-number">{stats.negative.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <ThumbsDown className="w-5 h-5 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${negativePercentage}%` }}
              transition={{ duration: 1, delay: 0.7 }}
            />
          </div>
          <p className="text-xs text-gray-500">전체 대비 {Math.round((stats.negative / stats.total) * 100)}%</p>
        </div>
      </motion.div>
      
      {/* 중립 리뷰 - 수평 막대 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white/50 backdrop-blur rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">중립 리뷰</p>
            <p className="text-3xl font-bold text-yellow-600 glow-number">{(stats.neutral || 0).toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Minus className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${neutralPercentage}%` }}
              transition={{ duration: 1, delay: 0.9 }}
            />
          </div>
          <p className="text-xs text-gray-500">전체 대비 {Math.round(((stats.neutral || 0) / stats.total) * 100)}%</p>
        </div>
      </motion.div>
      
      {/* 평균 평점 - 글로우 효과 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/50 backdrop-blur rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">평균 평점</p>
              <p className="text-3xl font-bold text-amber-600 glow-number">{stats.averageRating}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-amber-600 group-hover:text-amber-500 transition-colors" />
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1.1 + i * 0.1 }}
              >
                <Star 
                  className={`w-4 h-4 ${
                    i < Math.floor(stats.averageRating) 
                      ? 'text-amber-400 fill-amber-400' 
                      : 'text-gray-300'
                  }`} 
                />
              </motion.div>
            ))}
            <span className="text-xs text-gray-500 ml-2">5점 만점</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
