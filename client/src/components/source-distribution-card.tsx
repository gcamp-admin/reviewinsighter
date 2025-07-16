import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaGooglePlay, FaApple } from 'react-icons/fa';
import { Globe, MessageCircle } from 'lucide-react';

const CHANNEL_ICONS = {
  google_play: FaGooglePlay,
  app_store: FaApple,
  naver_blog: Globe,
  naver_cafe: MessageCircle
};

const CHANNEL_NAMES = {
  google_play: "구글 앱스토어",
  app_store: "애플 앱스토어", 
  naver_blog: "네이버 블로그",
  naver_cafe: "네이버 카페"
};

const CHANNEL_COLORS = {
  google_play: "#4285F4",
  app_store: "#000000",
  naver_blog: "#03C75A",
  naver_cafe: "#FF6B35"
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

  const chartData = Object.entries(sourceCounts).map(([source, count]) => ({
    source,
    name: CHANNEL_NAMES[source] || source,
    count,
    fill: CHANNEL_COLORS[source] || "#8884d8"
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.count}개 리뷰</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">소스별 분포</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              tick={{ fontSize: 11 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((item) => {
          const IconComponent = CHANNEL_ICONS[item.source];
          return (
            <div key={item.source} className="flex items-center text-sm">
              <div 
                className="w-3 h-3 rounded-sm mr-2" 
                style={{ backgroundColor: item.fill }}
              />
              {IconComponent && <IconComponent className="w-4 h-4 mr-1 text-gray-600" />}
              <span className="text-gray-700">{item.name}</span>
              <span className="ml-auto font-medium">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}