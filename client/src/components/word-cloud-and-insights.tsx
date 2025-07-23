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

      const response = await fetch(`/api/wordcloud/긍정?${params}&t=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch positive words");
      }
      return response.json();
    },
    enabled: true,
    staleTime: 0,
    cacheTime: 0,
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

      const response = await fetch(`/api/wordcloud/부정?${params}&t=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch negative words");
      }
      return response.json();
    },
    enabled: true,
    staleTime: 0,
    cacheTime: 0,
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

      const response = await fetch(`/api/insights?${params}&t=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      return response.json();
    },
    enabled: true,
    staleTime: 0,
    cacheTime: 0,
  });

  console.log("WordCloud component - positiveWords:", positiveWords);
  console.log("WordCloud component - negativeWords:", negativeWords);
  console.log("WordCloud component - insights:", insights);
  console.log("WordCloud component - activeSection:", activeSection);

  const renderWordCloud = (words: any[], title: string, isPositive: boolean) => {
    if (words.length === 0) return null;
    
    const maxFrequency = Math.max(...words.map(w => w.frequency));
    const minFrequency = Math.min(...words.map(w => w.frequency));
    
    // 빈도수 기준으로 정렬 (높은 순)
    const sortedWords = [...words].sort((a, b) => b.frequency - a.frequency);
    
    // 충돌 감지 함수 (글자 길이와 크기 고려)
    const checkCollision = (pos1: any, pos2: any, word1: string, word2: string, size1: number, size2: number) => {
      const padding = 30; // 최소 간격 증가
      
      // 글자 길이를 고려한 박스 크기 계산
      const char1Width = word1.length * (size1 * 0.6); // 한글 평균 너비
      const char2Width = word2.length * (size2 * 0.6);
      
      const box1 = {
        left: pos1.left - char1Width / 2,
        right: pos1.left + char1Width / 2,
        top: pos1.top - size1 / 2,
        bottom: pos1.top + size1 / 2
      };
      
      const box2 = {
        left: pos2.left - char2Width / 2,
        right: pos2.left + char2Width / 2,
        top: pos2.top - size2 / 2,
        bottom: pos2.top + size2 / 2
      };
      
      // 박스 충돌 검사
      const horizontalOverlap = box1.right + padding > box2.left && box2.right + padding > box1.left;
      const verticalOverlap = box1.bottom + padding > box2.top && box2.bottom + padding > box1.top;
      
      return horizontalOverlap && verticalOverlap;
    };
    
    // 위치 계산 및 충돌 회피
    const calculatePositions = () => {
      const positions: any[] = [];
      const containerWidth = 100; // 퍼센트 기준
      const containerHeight = 100;
      
      sortedWords.slice(0, 10).forEach((word, index) => {
        const fontSize = minFrequency === maxFrequency 
          ? 24 
          : 12 + ((word.frequency - minFrequency) / (maxFrequency - minFrequency)) * 36;
        
        const frequencyRatio = (word.frequency - minFrequency) / (maxFrequency - minFrequency);
        
        let position: { top: number; left: number };
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
          if (frequencyRatio > 0.7) {
            // 높은 빈도: 중앙 근처
            position = {
              top: 45 + (Math.random() - 0.5) * 20,
              left: 50 + (Math.random() - 0.5) * 20
            };
          } else if (frequencyRatio > 0.4) {
            // 중간 빈도: 중앙 주변
            const angle = (index * 45 + Math.random() * 30) * Math.PI / 180;
            const radius = 25 + Math.random() * 15;
            position = {
              top: 50 + radius * Math.sin(angle),
              left: 50 + radius * Math.cos(angle)
            };
          } else {
            // 낮은 빈도: 방사형으로 모서리 근처
            const angle = (index * 40 + Math.random() * 30) * Math.PI / 180;
            const radius = 35 + Math.random() * 20;
            position = {
              top: 50 + radius * Math.sin(angle),
              left: 50 + radius * Math.cos(angle)
            };
          }
          
          // 경계 체크
          position.top = Math.max(15, Math.min(85, position.top));
          position.left = Math.max(15, Math.min(85, position.left));
          
          // 충돌 체크
          const hasCollision = positions.some(pos => 
            checkCollision(position, pos.position, word.word, pos.word.word, fontSize, pos.fontSize)
          );
          
          if (!hasCollision) {
            positions.push({ word, position, fontSize, index });
            break;
          }
          
          attempts++;
        } while (attempts < maxAttempts);
        
        // 최대 시도 후에도 충돌이 있으면 강제 배치
        if (attempts >= maxAttempts) {
          positions.push({ word, position, fontSize, index });
        }
      });
      
      return positions;
    };
    
    const wordPositions = calculatePositions();
    
    return (
      <Card className="glassmorphism-card glow-indigo-hover card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Cloud className="w-5 h-5 mr-2" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[400px] overflow-hidden px-4 py-6">
            {wordPositions.map(({ word, position, fontSize, index }) => {
              const color = isPositive 
                ? ['#2ECC71', '#27AE60', '#58D68D', '#48C9B0'][index % 4] // 초록색 계열
                : ['#E74C3C', '#C0392B', '#EC7063', '#F1948A'][index % 4]; // 빨간색 계열
              
              return (
                <div
                  key={index}
                  className="absolute group transition-all duration-300 hover:scale-110 cursor-pointer select-none"
                  style={{ 
                    top: `${position.top}%`,
                    left: `${position.left}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <span
                    className="font-medium"
                    style={{ 
                      fontSize: `${fontSize}px`,
                      color: color,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      fontWeight: word.frequency > maxFrequency * 0.7 ? 'bold' : 'normal',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {word.word}
                  </span>
                  
                  {/* 마우스 오버 시 빈도 표시 말풍선 */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {word.frequency}번 언급
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
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

  // Don't render anything if no data is available
  if (positiveWords.length === 0 && negativeWords.length === 0 && insights.length === 0) {
    return null;
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
          {insights.map((insight: any, index: number) => (
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
                {/* 문제 상황 요약 */}
                {insight.problem_summary && (
                  <div className="space-y-2 bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <h4 className="font-semibold text-red-800 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      문제 상황 요약
                    </h4>
                    <div className="text-red-700 text-sm leading-relaxed">
                      <p>{insight.problem_summary}</p>
                    </div>
                  </div>
                )}

                {/* 타사 UX 벤치마킹 */}
                {insight.competitor_benchmark && (
                  <div className="space-y-2 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-800 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      타사 UX 벤치마킹
                    </h4>
                    <div className="text-blue-700 text-sm leading-relaxed">
                      <p>{insight.competitor_benchmark}</p>
                    </div>
                  </div>
                )}

                {/* UX 개선 제안 */}
                <div className="space-y-2 p-4 rounded-lg border-l-4 border-gray-400">
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    UX 개선 제안
                  </h4>
                  <div className="text-gray-700 leading-relaxed">
                    {Array.isArray(insight.ux_suggestions) ? (
                      <ul className="space-y-2">
                        {insight.ux_suggestions.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    ) : Array.isArray(insight.description) ? (
                      <ul className="space-y-2">
                        {insight.description.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-line text-sm">{insight.description}</p>
                    )}
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
                  <span className="text-purple-600 font-bold text-2xl">H</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">왜 HEART 분석을 하나요?</h2>
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
                  이렇게 분석하면, 리뷰 속 불편함이 구체적인 UX 개선 항목으로 드러납니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}