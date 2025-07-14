import { AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Insight, ReviewFilters } from "@/types";

interface UxInsightsProps {
  filters: ReviewFilters;
}

export default function UxInsights({ filters }: UxInsightsProps) {
  const { data: insights, isLoading, error } = useQuery<Insight[]>({
    queryKey: ["/api/insights", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
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

      const url = `/api/insights?${params}`;
      console.log("Fetching insights from:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      const data = await response.json();
      console.log("Insights data received:", data);
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache results
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#ff0066]" />
            UX 개선 제안
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-[#ff0066]"></div>
            <p className="text-lg text-[#ff0066] font-semibold">HEART 프레임워크 분석 중...</p>
            <p className="text-sm text-gray-500">리뷰를 기반으로 UX 개선 인사이트를 생성하고 있습니다</p>
            <div className="flex space-x-1 mt-4">
              <div className="animate-pulse w-2 h-2 bg-[#ff0066] rounded-full"></div>
              <div className="animate-pulse w-2 h-2 bg-[#ff0066] rounded-full animation-delay-200"></div>
              <div className="animate-pulse w-2 h-2 bg-[#ff0066] rounded-full animation-delay-400"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "major":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
      case "minor":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const parseInsightDescription = (insight: Insight) => {
    const description = insight.description;
    const lines = description.split('\n');
    
    let heartCategory = '';
    let problemSummary = '';
    let uxImprovementPoints = '';
    let priority = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('**HEART 항목**:')) {
        heartCategory = line.replace('**HEART 항목**:', '').trim();
      } else if (line.startsWith('**문제 요약**:')) {
        problemSummary = line.replace('**문제 요약**:', '').trim();
      } else if (line.startsWith('**UX 개선 제안**:')) {
        uxImprovementPoints = line.replace('**UX 개선 제안**:', '').trim();
      } else if (line.startsWith('**UX개선 포인트**:')) {
        uxImprovementPoints = line.replace('**UX개선 포인트**:', '').trim();
      } else if (line.startsWith('**우선순위**:')) {
        priority = line.replace('**우선순위**:', '').trim();
      }
    }
    
    return {
      heartCategory,
      problemSummary,
      uxImprovementPoints,
      priority
    };
  };

  // Don't show component at all if no insights data exists
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#ff0066]" />
          코멘토의 HEART 프레임워크 UX 분석
        </CardTitle>
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-gradient-to-r from-[#7CF3C4]/10 to-blue-50 p-4 rounded-lg">
            <div className="bg-[#7CF3C4] rounded-full p-2 flex-shrink-0">
              <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🧠</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-[#7CF3C4] flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                안녕하세요! 코멘토입니다. 📊 실제 사용자 리뷰를 HEART 프레임워크로 분석했어요. 
                각 이슈별로 우선순위와 구체적인 UX 개선 방안을 제안드릴게요!
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🎯 우선순위 결정 기준</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong className="text-red-600">Critical:</strong> 앱 크래시, 핵심 기능 완전 실패 - 앱 사용 불가 상황</div>
              <div><strong className="text-orange-500">Major:</strong> 주요 기능 부분 실패, 성능 저하 - 사용자 경험 크게 저하</div>
              <div><strong className="text-yellow-600">Minor:</strong> UI 버그, 사용성 개선사항 - 기능은 작동하나 개선 필요</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {insights?.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              수집된 리뷰 데이터에서 인사이트를 분석 중입니다...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {insights?.map((insight) => {
              const parsedInsight = parseInsightDescription(insight);
              return (
                <div
                  key={insight.id}
                  className="space-y-4 p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  {/* 코멘토 캐릭터 - 문제 요약 */}
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🧠</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-400 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority === "critical" ? "🔴 Critical" : 
                           insight.priority === "major" ? "🟡 Major" : "🟢 Minor"}
                        </Badge>
                        <div className="text-sm font-medium text-gray-600">
                          📊 {parsedInsight.heartCategory}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <strong>문제 발견:</strong> {parsedInsight.problemSummary}
                      </p>
                    </div>
                  </div>

                  {/* 코멘토 캐릭터 - UX 개선 제안 */}
                  <div className="flex items-start gap-3">
                    <div className="bg-[#7CF3C4] rounded-full p-2 flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">💡</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-[#7CF3C4] flex-1">
                      <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        <strong>UX 개선 제안:</strong>
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {parsedInsight.uxImprovementPoints.split(',').map((point: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-[#7CF3C4] mt-1">•</span>
                            <span className="flex-1">{point.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 통계 정보 */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Badge variant="outline" className="text-xs">
                      📊 언급 {insight.mentionCount}회
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {insight.trend === "increasing" ? "📈 증가" : insight.trend === "decreasing" ? "📉 감소" : "📊 안정"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}