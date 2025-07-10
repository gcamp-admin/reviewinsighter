import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Star,
  BarChart3,
  PieChart,
  Activity,
  Award,
  AlertTriangle
} from "lucide-react";
import type { ReviewFilters } from "@/types";

interface CompetitiveAnalysisProps {
  filters: ReviewFilters;
}

interface CompetitorData {
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  sentimentScore: number;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  keyFeatures: string[];
  userDemographic: {
    age: string;
    occupation: string;
    usage: string;
  };
  trendData: Array<{
    month: string;
    rating: number;
    reviews: number;
  }>;
}

export default function CompetitiveAnalysis({ filters }: CompetitiveAnalysisProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // 경쟁사 데이터 시뮬레이션
  const generateCompetitorData = (): CompetitorData[] => {
    const competitors: CompetitorData[] = [
      {
        name: "익시오 (현재 서비스)",
        category: "비즈니스 통화",
        rating: 4.1,
        reviewCount: 2847,
        sentimentScore: 78,
        marketShare: 35,
        strengths: ["AI 통화 요약", "보이스피싱 차단", "통화 녹음"],
        weaknesses: ["통화 연결 불안정", "블루투스 호환성", "통화중 대기 미지원"],
        keyFeatures: ["AI 요약", "녹음 기능", "스팸 차단", "클라우드 백업"],
        userDemographic: {
          age: "30-50대",
          occupation: "사업자, 영업직",
          usage: "업무용 통화"
        },
        trendData: [
          { month: "10월", rating: 4.3, reviews: 2100 },
          { month: "11월", rating: 4.2, reviews: 2350 },
          { month: "12월", rating: 4.0, reviews: 2600 },
          { month: "1월", rating: 4.1, reviews: 2847 }
        ]
      },
      {
        name: "카카오톡 보이스톡",
        category: "메신저 통화",
        rating: 4.5,
        reviewCount: 15672,
        sentimentScore: 85,
        marketShare: 45,
        strengths: ["높은 사용자 기반", "안정적인 연결", "다양한 기능"],
        weaknesses: ["비즈니스 특화 부족", "통화 품질 제한", "데이터 사용량"],
        keyFeatures: ["영상 통화", "메시지 연동", "그룹 통화", "이모티콘"],
        userDemographic: {
          age: "20-40대",
          occupation: "일반 사용자",
          usage: "개인 통화"
        },
        trendData: [
          { month: "10월", rating: 4.4, reviews: 14200 },
          { month: "11월", rating: 4.5, reviews: 14800 },
          { month: "12월", rating: 4.5, reviews: 15200 },
          { month: "1월", rating: 4.5, reviews: 15672 }
        ]
      },
      {
        name: "네이버 라인",
        category: "메신저 통화",
        rating: 4.2,
        reviewCount: 8934,
        sentimentScore: 81,
        marketShare: 20,
        strengths: ["국제 통화", "메시지 연동", "스티커 문화"],
        weaknesses: ["국내 사용자 감소", "비즈니스 기능 부족", "배터리 소모"],
        keyFeatures: ["국제 통화", "메시지", "타임라인", "게임"],
        userDemographic: {
          age: "20-30대",
          occupation: "학생, 직장인",
          usage: "개인 통화"
        },
        trendData: [
          { month: "10월", rating: 4.3, reviews: 8100 },
          { month: "11월", rating: 4.2, reviews: 8400 },
          { month: "12월", rating: 4.1, reviews: 8700 },
          { month: "1월", rating: 4.2, reviews: 8934 }
        ]
      }
    ];
    
    return competitors;
  };

  const { data: competitorData = [] } = useQuery({
    queryKey: ["/api/competitors", filters?.service?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return generateCompetitorData();
    },
    enabled: !!filters?.service?.id,
    staleTime: 5 * 60 * 1000,
  });

  const currentService = competitorData.find(c => c.name.includes("익시오"));
  const competitors = competitorData.filter(c => !c.name.includes("익시오"));

  const getPerformanceColor = (score: number, benchmark: number) => {
    if (score > benchmark) return "text-green-600";
    if (score < benchmark * 0.9) return "text-red-600";
    return "text-yellow-600";
  };

  const getMarketPosition = () => {
    if (!currentService) return "";
    const sorted = competitorData.sort((a, b) => b.marketShare - a.marketShare);
    const position = sorted.findIndex(c => c.name.includes("익시오")) + 1;
    return `${position}위 / ${sorted.length}개사`;
  };

  if (!filters?.service?.id || competitorData.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          경쟁사 비교 분석
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          시장 내 주요 경쟁사와의 성과 비교 및 포지셔닝 분석을 제공합니다
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="performance">성과 비교</TabsTrigger>
            <TabsTrigger value="features">기능 비교</TabsTrigger>
            <TabsTrigger value="insights">전략 인사이트</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 시장 포지션 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">시장 순위</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">
                  {getMarketPosition()}
                </p>
                <p className="text-xs text-blue-600">비즈니스 통화 부문</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">시장 점유율</span>
                </div>
                <p className="text-2xl font-bold text-green-800">
                  {currentService?.marketShare}%
                </p>
                <p className="text-xs text-green-600">전체 시장 대비</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">감정 점수</span>
                </div>
                <p className="text-2xl font-bold text-purple-800">
                  {currentService?.sentimentScore}/100
                </p>
                <p className="text-xs text-purple-600">사용자 만족도</p>
              </div>
            </div>

            {/* 경쟁사 비교 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left">서비스명</th>
                    <th className="border border-gray-200 p-3 text-center">평점</th>
                    <th className="border border-gray-200 p-3 text-center">리뷰 수</th>
                    <th className="border border-gray-200 p-3 text-center">감정 점수</th>
                    <th className="border border-gray-200 p-3 text-center">시장 점유율</th>
                    <th className="border border-gray-200 p-3 text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorData.map((competitor, index) => (
                    <tr key={index} className={competitor.name.includes("익시오") ? "bg-blue-50" : ""}>
                      <td className="border border-gray-200 p-3">
                        <div className="flex items-center gap-2">
                          {competitor.name.includes("익시오") && <Award className="h-4 w-4 text-blue-600" />}
                          <span className="font-medium">{competitor.name}</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {competitor.rating}
                        </div>
                      </td>
                      <td className="border border-gray-200 p-3 text-center">
                        {competitor.reviewCount.toLocaleString()}
                      </td>
                      <td className="border border-gray-200 p-3 text-center">
                        <Badge 
                          variant={competitor.sentimentScore >= 80 ? "default" : competitor.sentimentScore >= 70 ? "secondary" : "destructive"}
                        >
                          {competitor.sentimentScore}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 p-3 text-center">
                        {competitor.marketShare}%
                      </td>
                      <td className="border border-gray-200 p-3 text-center">
                        {competitor.name.includes("익시오") ? (
                          <Badge variant="default">현재 서비스</Badge>
                        ) : (
                          <Badge variant="outline">경쟁사</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 성과 메트릭 */}
              <div className="space-y-4">
                <h3 className="font-medium">주요 성과 지표</h3>
                {currentService && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>앱 스토어 평점</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{currentService.rating}</span>
                        <span className="text-sm text-gray-500">
                          (업계 평균: {(competitorData.reduce((sum, c) => sum + c.rating, 0) / competitorData.length).toFixed(1)})
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>월 리뷰 증가율</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-600">+12.5%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>사용자 만족도</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{currentService.sentimentScore}/100</span>
                        <Badge variant="default">상위 30%</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 경쟁 우위 분석 */}
              <div className="space-y-4">
                <h3 className="font-medium">경쟁 우위 분석</h3>
                {currentService && (
                  <>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">강점 (차별화 요소)</h4>
                      <ul className="space-y-1 text-sm">
                        {currentService.strengths.map((strength, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">약점 (개선 필요)</h4>
                      <ul className="space-y-1 text-sm">
                        {currentService.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitorData.map((competitor, index) => (
                <div key={index} className={`p-4 rounded-lg border ${competitor.name.includes("익시오") ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}>
                  <h3 className="font-medium mb-3">{competitor.name}</h3>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">주요 기능</h4>
                    <ul className="space-y-1 text-sm">
                      {competitor.keyFeatures.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-3">🎯 핵심 기회</h3>
                <ul className="space-y-2 text-sm">
                  <li>• 통화중 대기 기능 추가로 비즈니스 사용자 만족도 향상</li>
                  <li>• 블루투스 호환성 개선으로 차량 사용 환경 최적화</li>
                  <li>• AI 기능 강화로 경쟁사 대비 차별화 포인트 확대</li>
                </ul>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-medium text-orange-800 mb-3">⚠️ 주요 위험</h3>
                <ul className="space-y-2 text-sm">
                  <li>• 카카오톡의 높은 시장 점유율 및 사용자 기반</li>
                  <li>• 통화 연결 안정성 문제로 인한 사용자 이탈</li>
                  <li>• 신규 경쟁사 진입 시 시장 점유율 감소</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">📈 권장 전략</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">단기 전략 (3개월)</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 통화 연결 안정성 개선</li>
                    <li>• 사용자 불만 TOP 3 이슈 해결</li>
                    <li>• 고객 서비스 응답 시간 단축</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">중장기 전략 (6-12개월)</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• AI 기능 고도화 (요약, 분석)</li>
                    <li>• 비즈니스 특화 기능 추가</li>
                    <li>• 기업 대상 B2B 시장 확대</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}