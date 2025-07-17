import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cloud, TrendingUp, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import type { ReviewFilters } from "@/types";

interface WordCloudAndInsightsProps {
  filters: ReviewFilters;
  activeSection?: string;
}

export default function WordCloudAndInsights({ filters, activeSection }: WordCloudAndInsightsProps) {
  const [isHeartPopupOpen, setIsHeartPopupOpen] = useState(false);
  const { data: positiveWords = [], isLoading: positiveLoading } = useQuery({
    queryKey: ["/api/wordcloud", "긍정", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters.source?.length) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/wordcloud/긍정?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch positive words");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  const { data: negativeWords = [], isLoading: negativeLoading } = useQuery({
    queryKey: ["/api/wordcloud", "부정", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters.source?.length) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/wordcloud/부정?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch negative words");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/insights", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters.source?.length) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/insights?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  const renderWordCloud = (words: any[], title: string, isPositive: boolean) => {
    if (words.length === 0) return null;
    
    const maxFrequency = Math.max(...words.map(w => w.frequency));
    const minFrequency = Math.min(...words.map(w => w.frequency));
    
    // 자유 배치를 위한 랜덤 위치 생성
    const getRandomPosition = (index: number) => {
      const positions = [
        { top: '10%', left: '5%' },
        { top: '25%', left: '60%' },
        { top: '15%', left: '30%' },
        { top: '40%', left: '20%' },
        { top: '50%', left: '70%' },
        { top: '30%', left: '80%' },
        { top: '65%', left: '15%' },
        { top: '70%', left: '50%' },
        { top: '45%', left: '45%' },
        { top: '80%', left: '75%' }
      ];
      return positions[index % positions.length];
    };
    
    return (
      <Card className="glassmorphism-card glow-indigo-hover card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Cloud className="w-5 h-5 mr-2" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[300px] overflow-hidden">
            {words.slice(0, 10).map((word, index) => {
              // 빈도수에 따른 글씨 크기 계산 (16px ~ 40px)
              const fontSize = minFrequency === maxFrequency 
                ? 28 // 모든 빈도가 같으면 중간 크기
                : 16 + ((word.frequency - minFrequency) / (maxFrequency - minFrequency)) * 24;
              
              const position = getRandomPosition(index);
              const color = isPositive 
                ? ['#2ECC71', '#27AE60', '#58D68D', '#48C9B0'][index % 4] // 초록색 계열
                : ['#E74C3C', '#C0392B', '#EC7063', '#F1948A'][index % 4]; // 빨간색 계열
              
              return (
                <span
                  key={index}
                  className="absolute font-medium transition-all duration-300 hover:scale-110 cursor-pointer select-none"
                  style={{ 
                    fontSize: `${fontSize}px`,
                    color: color,
                    top: position.top,
                    left: position.left,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontWeight: word.frequency > maxFrequency * 0.7 ? 'bold' : 'normal'
                  }}
                >
                  {word.word}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'major':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'minor':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'major':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isLoading = positiveLoading || negativeLoading || insightsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Word Cloud Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Cloud className="w-6 h-6 mr-2 text-indigo-600" />
          <span className="gradient-text">감정 워드클라우드</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderWordCloud(positiveWords, "긍정 키워드", true)}
          {renderWordCloud(negativeWords, "부정 키워드", false)}
        </div>
      </div>

      {/* UX Insights Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-purple-600" />
          <span className="gradient-text">HEART 프레임워크 분석</span>
          <span 
            className="ml-4 text-sm text-gray-500 hover:text-[#7CF3C4] cursor-pointer transition-colors duration-300"
            onClick={() => setIsHeartPopupOpen(true)}
          >
            💡 왜 HEART 분석을 하나요?
          </span>
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {insights.map((insight, index) => (
            <Card key={index} className="glassmorphism-card glow-indigo-hover card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    {getPriorityIcon(insight.priority)}
                    <span className="ml-2">{insight.title}</span>
                  </CardTitle>
                  <Badge className={`${getPriorityColor(insight.priority)} border`}>
                    {insight.priority.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">문제 요약</h4>
                  <p className="text-gray-700 leading-relaxed">{insight.problem_summary}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">UX 개선 제안</h4>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {insight.ux_suggestions}
                  </div>
                </div>
                
                
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* HEART 분석 설명 팝업 */}
      {isHeartPopupOpen && (
        <div className="popup-overlay" onClick={() => setIsHeartPopupOpen(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsHeartPopupOpen(false)}
              className="popup-close-btn"
            >
              <X size={24} />
            </button>
            
            {/* 팝업 내용 */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold text-2xl">💡</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">💡 왜 HEART 분석을 하나요?</h2>
              </div>
              
              <div className="text-left space-y-4 text-sm text-gray-600">
                <p>
                  <strong className="text-purple-600">HEART</strong>는 Google이 만든 UX 평가 프레임워크로,<br/>
                  리뷰 내용을 사용자 경험의 5가지 요소로 나눠 분석합니다:
                </p>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 font-bold">H</span>
                    <div>
                      <strong>Happiness</strong> – 얼마나 만족했는지
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 font-bold">E</span>
                    <div>
                      <strong>Engagement</strong> – 얼마나 자주·깊게 사용했는지
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 font-bold">A</span>
                    <div>
                      <strong>Adoption</strong> – 처음 쓸 때 얼마나 잘 적응했는지
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 font-bold">R</span>
                    <div>
                      <strong>Retention</strong> – 다시 돌아올 만큼 좋았는지
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 font-bold">T</span>
                    <div>
                      <strong>Task Success</strong> – 하고자 한 행동을 잘 마쳤는지
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-purple-600 font-medium pt-4 border-t">
                  👉 이렇게 분석하면, 리뷰 속 불편함이 구체적인 UX 개선 항목으로 드러납니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}