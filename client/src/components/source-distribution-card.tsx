import { useQuery } from "@tanstack/react-query";
import ChannelBarChart from "./channel-bar-chart";

const CHANNEL_NAMES = {
  google_play: "구글 앱스토어",
  app_store: "애플 앱스토어", 
  naver_blog: "네이버 블로그",
  naver_cafe: "네이버 카페"
};

const CHANNEL_COLORS = {
  google_play: "#4F46E5",
  app_store: "#FACC15",
  naver_blog: "#10B981",
  naver_cafe: "#F59E0B"
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
      <div className="bg-white rounded-xl p-6 shadow-sm h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">소스별 분포</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // Group reviews by source - count all reviews, not just current page
  const sourceCounts = reviewsData.reviews.reduce((acc, review) => {
    acc[review.source] = (acc[review.source] || 0) + 1;
    return acc;
  }, {});

  const totalReviews = reviewsData.reviews.length;
  
  const chartData = Object.entries(sourceCounts).map(([source, count]) => ({
    label: CHANNEL_NAMES[source] || source,
    value: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    color: CHANNEL_COLORS[source] || "#8884d8"
  }));

  return <ChannelBarChart data={chartData} />;
}