import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { 
  Upload, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Star,
  Heart,
  Activity,
  Target,
  Zap,
  Award,
  CloudUpload,
  FileText,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { ReviewFilters } from "@/types";

interface ModernDashboardProps {
  filters: ReviewFilters;
}

const COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280',
  primary: '#8B5CF6',
  secondary: '#3B82F6',
  accent: '#F59E0B'
};

const HEART_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function ModernDashboard({ filters }: ModernDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState('sentiment');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // 통계 데이터 가져오기
  const { data: stats } = useQuery({
    queryKey: ["/api/reviews/stats", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.service?.id) params.append("serviceId", filters.service.id);
      if (filters?.source?.length) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append("dateTo", filters.dateTo.toISOString());

      const response = await fetch(`/api/reviews/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  // 워드클라우드 데이터 가져오기
  const { data: wordCloudData } = useQuery({
    queryKey: ["/api/wordcloud", filters.service?.id],
    queryFn: async () => {
      const positiveRes = await fetch(`/api/wordcloud/긍정`);
      const negativeRes = await fetch(`/api/wordcloud/부정`);
      
      const positive = positiveRes.ok ? await positiveRes.json() : [];
      const negative = negativeRes.ok ? await negativeRes.json() : [];
      
      return { positive, negative };
    },
    enabled: !!filters?.service?.id,
  });

  // 인사이트 데이터 가져오기
  const { data: insights = [] } = useQuery({
    queryKey: ["/api/insights", filters.service?.id],
    queryFn: async () => {
      const response = await fetch(`/api/insights`);
      if (!response.ok) throw new Error("Failed to fetch insights");
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  // 드롭존 설정
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.txt']
    },
    onDrop: (acceptedFiles) => {
      setUploadedFiles(acceptedFiles);
    }
  });

  // 감정 분석 차트 데이터
  const sentimentData = stats ? [
    { name: '긍정', value: stats.positive, color: COLORS.positive },
    { name: '부정', value: stats.negative, color: COLORS.negative },
    { name: '중립', value: stats.neutral || 0, color: COLORS.neutral }
  ] : [];

  // HEART 프레임워크 레이더 차트 데이터
  const heartData = insights.slice(0, 5).map((insight, index) => ({
    subject: insight.title?.split('|')[0]?.replace('HEART:', '').trim() || `항목 ${index + 1}`,
    score: Math.random() * 100, // 실제 점수 계산 로직으로 대체 필요
    fullMark: 100
  }));

  // 메트릭 카드 데이터
  const metricCards = [
    {
      title: "총 리뷰",
      value: stats?.total || 0,
      icon: MessageSquare,
      color: "from-blue-500 to-blue-600",
      change: "+12%"
    },
    {
      title: "긍정률",
      value: stats ? Math.round((stats.positive / stats.total) * 100) : 0,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      change: "+5%",
      suffix: "%"
    },
    {
      title: "평균 평점",
      value: stats?.averageRating || 0,
      icon: Star,
      color: "from-yellow-500 to-yellow-600",
      change: "+0.2"
    },
    {
      title: "활성 사용자",
      value: Math.floor((stats?.total || 0) * 0.8),
      icon: Users,
      color: "from-purple-500 to-purple-600",
      change: "+8%"
    }
  ];

  // 소스별 리뷰 분포 데이터
  const sourceData = [
    { name: 'Google Play', value: Math.floor((stats?.total || 0) * 0.4), color: '#34D399' },
    { name: 'App Store', value: Math.floor((stats?.total || 0) * 0.3), color: '#60A5FA' },
    { name: 'Naver Blog', value: Math.floor((stats?.total || 0) * 0.2), color: '#F472B6' },
    { name: 'Naver Cafe', value: Math.floor((stats?.total || 0) * 0.1), color: '#FBBF24' }
  ];

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* 헤더 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold glow-text mb-2">
            UX 인사이트 대시보드
          </h1>
          <p className="text-gray-600">
            AI 기반 리뷰 분석으로 사용자 경험을 깊이 이해하세요
          </p>
        </motion.div>

        {/* 메트릭 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="modern-card p-6 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {card.change}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
              <p className="text-3xl font-bold glow-number text-gray-900">
                {card.value.toLocaleString()}{card.suffix || ''}
              </p>
            </motion.div>
          ))}
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 감정 분석 도넛차트 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="chart-container"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center">
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

          {/* HEART 프레임워크 레이더차트 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="chart-container"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center">
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

        {/* 워드클라우드 + 업로드 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 긍정 워드클라우드 */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="modern-card p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-green-600" />
              긍정 키워드
            </h3>
            <div className="space-y-3">
              {wordCloudData?.positive.slice(0, 8).map((word, index) => (
                <motion.div
                  key={word.word}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="wordcloud-bubble bg-green-500 text-white"
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
            className="modern-card p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-red-600" />
              부정 키워드
            </h3>
            <div className="space-y-3">
              {wordCloudData?.negative.slice(0, 8).map((word, index) => (
                <motion.div
                  key={word.word}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="wordcloud-bubble bg-red-500 text-white"
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

          {/* 파일 업로드 */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="modern-card p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CloudUpload className="w-5 h-5 mr-2 text-purple-600" />
              데이터 업로드
            </h3>
            
            <div
              {...getRootProps()}
              className={`upload-zone p-6 text-center cursor-pointer ${
                isDragActive ? 'border-purple-500 bg-purple-50' : ''
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-3 text-purple-400" />
              <p className="text-sm text-gray-600 mb-2">
                {isDragActive ? '파일을 여기에 놓으세요' : '클릭하거나 파일을 드래그하세요'}
              </p>
              <p className="text-xs text-gray-500">
                CSV, JSON, TXT 파일 지원
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* 소스별 분포 바차트 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="chart-container"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
              리뷰 소스별 분포
            </h3>
            <Badge className="bg-indigo-100 text-indigo-800">
              다중 소스 분석
            </Badge>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
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

        {/* 실시간 인사이트 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="modern-card p-6"
        >
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-600" />
            실시간 UX 인사이트
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 6).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <Award className="w-5 h-5 mr-2 text-purple-600" />
                  <Badge variant="outline" className="text-xs">
                    {insight.priority}
                  </Badge>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                  {insight.title?.split('|')[1]?.trim() || '인사이트'}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-3">
                  {insight.problem_summary}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}