import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

const SENTIMENT_COLORS = {
  긍정: "#10B981",
  부정: "#EF4444", 
  중립: "#6B7280"
};

const SENTIMENT_ICONS = {
  긍정: ThumbsUp,
  부정: ThumbsDown,
  중립: Minus
};

export default function SentimentDonutCard() {
  const { data: stats } = useQuery({
    queryKey: ['/api/reviews/stats'],
    enabled: true
  });

  if (!stats) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">감정 분석</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: '긍정', value: stats.positive, color: SENTIMENT_COLORS.긍정 },
    { name: '부정', value: stats.negative, color: SENTIMENT_COLORS.부정 },
    { name: '중립', value: stats.neutral, color: SENTIMENT_COLORS.중립 }
  ];

  const total = stats.positive + stats.negative + stats.neutral;

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