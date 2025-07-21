import { useQuery } from "@tanstack/react-query";
import ChannelBarChart from "./channel-bar-chart";

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
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    source?: string[];
    serviceId?: string;
  };
}

export default function SourceDistributionCard({ filters }: Props) {
  // Get filtered reviews to calculate accurate source distribution
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews', 'source-distribution', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '10000');
      params.append('page', '1');
      
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo.toISOString());
      }
      if (filters?.serviceId) {
        params.append('serviceId', filters.serviceId);
      }
      
      const response = await fetch(`/api/reviews?${params}`);
      return response.json();
    },
    enabled: true
  });

  if (!reviewsData?.reviews || reviewsData.reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50 h-full">
        <h3 className="text-heading text-gray-900 mb-6">채널별 분포</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-body text-gray-500">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // Ensure all 4 channels are included, even if they have 0 reviews
  const allChannels: (keyof typeof CHANNEL_NAMES)[] = ['google_play', 'app_store', 'naver_blog', 'naver_cafe'];
  
  const sourceCounts = reviewsData.reviews.reduce((acc: Record<string, number>, review: any) => {
    acc[review.source] = (acc[review.source] || 0) + 1;
    return acc;
  }, {});

  const totalReviews = reviewsData.reviews.length;
  
  const chartData = allChannels.map(channel => ({
    label: CHANNEL_NAMES[channel],
    value: totalReviews > 0 ? ((sourceCounts[channel] || 0) / totalReviews) * 100 : 0,
    color: CHANNEL_COLORS[channel]
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50 h-full">
      <h3 className="text-heading text-gray-900 mb-6">채널별 분포</h3>
      <div className="h-64">
        <ChannelBarChart data={chartData} />
      </div>
    </div>
  );
}