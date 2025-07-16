import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

const SENTIMENT_COLORS = {
  긍정: "#4F46E5", // 버튼 톤에 맞춘 보라색
  부정: "#764ba2", // 버튼 톤에 맞춘 진보라색
  중립: "#9CA3AF"
};

const SENTIMENT_ICONS = {
  긍정: ThumbsUp,
  부정: ThumbsDown,
  중립: Minus
};

interface Props {
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    source?: string[];
    serviceId?: string;
  };
}

export default function SentimentDonutCard({ filters }: Props) {
  // Get filtered reviews to calculate accurate sentiment distribution
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews', 'sentiment-distribution', filters],
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">감정 분석</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // Count sentiments from actual reviews
  const sentimentCounts = reviewsData.reviews.reduce((acc, review) => {
    acc[review.sentiment] = (acc[review.sentiment] || 0) + 1;
    return acc;
  }, { '긍정': 0, '부정': 0, '중립': 0 });

  const chartData = [
    { name: '긍정', value: sentimentCounts['긍정'], color: SENTIMENT_COLORS.긍정 },
    { name: '부정', value: sentimentCounts['부정'], color: SENTIMENT_COLORS.부정 },
    { name: '중립', value: sentimentCounts['중립'], color: SENTIMENT_COLORS.중립 }
  ];

  const total = sentimentCounts['긍정'] + sentimentCounts['부정'] + sentimentCounts['중립'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value}개 ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">감정 분석</h3>
      
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-500">총 리뷰</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {chartData.map((item) => {
          const IconComponent = SENTIMENT_ICONS[item.name];
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <IconComponent className="w-4 h-4 mr-1 text-gray-600" />
                <span className="text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{item.value}</span>
                <span className="text-gray-500">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}