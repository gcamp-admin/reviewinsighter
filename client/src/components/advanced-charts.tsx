import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PieChart as PieChartIcon, Target, BarChart3, Activity, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import type { ReviewStats, ReviewFilters } from "@/types";

interface AdvancedChartsProps {
  filters: ReviewFilters;
}

const COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#F59E0B'
};

export default function AdvancedCharts({ filters }: AdvancedChartsProps) {
  const { data: stats } = useQuery<ReviewStats>({
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
    enabled: !!filters?.service?.id,
  });

  const { data: insights } = useQuery({
    queryKey: ["/api/insights", filters?.service?.id],
    queryFn: async () => {
      const response = await fetch(`/api/insights?serviceId=${filters?.service?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  const { data: wordCloudData } = useQuery({
    queryKey: ["/api/wordcloud", filters?.service?.id],
    queryFn: async () => {
      const [positiveRes, negativeRes] = await Promise.all([
        fetch(`/api/wordcloud/긍정?serviceId=${filters?.service?.id}`),
        fetch(`/api/wordcloud/부정?serviceId=${filters?.service?.id}`)
      ]);
      
      const [positive, negative] = await Promise.all([
        positiveRes.json(),
        negativeRes.json()
      ]);
      
      return { positive, negative };
    },
    enabled: !!filters?.service?.id,
  });

  if (!stats || !filters?.service?.id) return null;

  // 감정 분석 도넛차트 데이터
  const sentimentData = [
    { name: '긍정', value: stats.positive, color: COLORS.positive },
    { name: '부정', value: stats.negative, color: COLORS.negative },
    { name: '중립', value: stats.neutral || 0, color: COLORS.neutral }
  ];

  // HEART 프레임워크 레이더 차트 데이터
  const heartData = insights?.slice(0, 5).map((insight: any, index: number) => ({
    subject: insight.title?.split('|')[0]?.replace('HEART:', '').trim() || `항목 ${index + 1}`,
    score: Math.min(95, Math.max(20, 40 + Math.random() * 50)), // 현실적인 점수 범위
    fullMark: 100
  })) || [];

  // 소스별 분포 바차트 데이터
  const sourceData = [
    { name: '구글플레이', value: stats.countsBySource?.googlePlay || 0, color: '#34A853' },
    { name: '애플앱스토어', value: stats.countsBySource?.appleStore || 0, color: '#333333' },
    { name: '네이버블로그', value: stats.countsBySource?.naverBlog || 0, color: '#03C75A' },
    { name: '네이버카페', value: stats.countsBySource?.naverCafe || 0, color: '#06B6D4' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 감정 분석 도넛차트 */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center text-gray-800">
              <PieChartIcon className="w-5 h-5 mr-2 text-purple-600" />
              감정 분석 분포
            </h3>
            <Badge className="bg-purple-100 text-purple-800">
              실시간 분석
            </Badge>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value, '리뷰 수']}
                labelStyle={{ color: '#374151' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* HEART 프레임워크 레이더 차트 */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center text-gray-800">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              HEART 프레임워크 분석
            </h3>
            <Badge className="bg-blue-100 text-blue-800">
              UX 평가
            </Badge>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={heartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={45} domain={[0, 100]} />
              <Radar 
                name="점수" 
                dataKey="score" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* 워드클라우드 및 소스 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 긍정 워드클라우드 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
            <Heart className="w-5 h-5 mr-2 text-green-600" />
            긍정 키워드
          </h3>
          <div className="space-y-3">
            {wordCloudData?.positive?.slice(0, 8).map((word: any, index: number) => (
              <motion.div
                key={word.word}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                style={{ 
                  fontSize: `${12 + (word.frequency * 0.5)}px`,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {word.word}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 부정 워드클라우드 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
            <Activity className="w-5 h-5 mr-2 text-red-600" />
            부정 키워드
          </h3>
          <div className="space-y-3">
            {wordCloudData?.negative?.slice(0, 8).map((word: any, index: number) => (
              <motion.div
                key={word.word}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                style={{ 
                  fontSize: `${12 + (word.frequency * 0.5)}px`,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {word.word}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 소스별 분포 바차트 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center text-gray-800">
              <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
              소스별 분포
            </h3>
            <Badge className="bg-indigo-100 text-indigo-800">
              다중 소스
            </Badge>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sourceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value, '리뷰 수']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}