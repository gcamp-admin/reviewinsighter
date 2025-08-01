import { useQuery } from "@tanstack/react-query";
import ChannelBarChart from "./channel-bar-chart";
import type { ReviewFilters } from "@/types";

const CHANNEL_NAMES = {
  google_play: "구글 앱스토어",
  app_store: "애플 앱스토어", 
  naver_blog: "네이버 블로그",
  naver_cafe: "네이버 카페"
};

const CHANNEL_COLORS = {
  google_play: "#10B981", // 브랜드 그린
  app_store: "#4F46E5", // 브랜드 인디고  
  naver_blog: "#7CF3C4", // 브랜드 메인
  naver_cafe: "#6B7280" // 중립 그레이
};

interface Props {
  filters?: ReviewFilters;
}

export default function SourceDistributionCard({ filters }: Props) {
  // Use stats endpoint to get accurate source distribution data
  const { data: statsData } = useQuery({
    queryKey: ['/api/reviews/stats', 'source-distribution', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo.toISOString());
      }
      if (filters?.service?.id) {
        params.append('serviceId', filters.service.id);
      }
      
      const response = await fetch(`/api/reviews/stats?${params}`);
      return response.json();
    },
    enabled: true
  });

  if (!statsData || statsData.total === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20 h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">채널별 분포</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-body text-gray-500">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // Use stats data which already provides accurate source counts
  const sourceCounts = {
    google_play: statsData.countsBySource?.googlePlay || 0,
    app_store: statsData.countsBySource?.appleStore || 0,
    naver_blog: statsData.countsBySource?.naverBlog || 0,
    naver_cafe: statsData.countsBySource?.naverCafe || 0
  };

  const totalReviews = statsData.total;
  
  // Ensure all 4 channels are included, even if they have 0 reviews
  const allChannels: (keyof typeof CHANNEL_NAMES)[] = ['google_play', 'app_store', 'naver_blog', 'naver_cafe'];
  
  const chartData = allChannels.map(channel => ({
    label: CHANNEL_NAMES[channel],
    value: totalReviews > 0 ? (sourceCounts[channel] / totalReviews) * 100 : 0,
    color: CHANNEL_COLORS[channel]
  }));

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20 h-full flex flex-col">
      <h3 className="text-heading text-gray-900 mb-6">채널별 분포</h3>
      <div className="flex-1 flex flex-col">
        <ChannelBarChart data={chartData} />
      </div>
    </div>
  );
}