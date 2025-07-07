import { AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Insight, ReviewFilters } from "@/types";

interface UxInsightsProps {
  filters: ReviewFilters;
}

export default function UxInsights({ filters }: UxInsightsProps) {
  const { data: insights, isLoading } = useQuery<Insight[]>({
    queryKey: ["/api/insights", filters?.source, filters?.dateFrom, filters?.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.source && filters.source.length > 0) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters?.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/insights?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      return response.json();
    },
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "low":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const getActionableInsight = (insight: Insight) => {
    const solutions: { [key: string]: { problem: string; solution: string } } = {
      "CCTV 기능 개선": {
        problem: "사용자들이 CCTV 화면 확대/축소, 녹화 영상 재생에서 어려움을 겪고 있음",
        solution: "터치 제스처 개선, 녹화 영상 플레이어 UI 재설계, 화면 확대 버튼 크기 증대"
      },
      "앱 안정성 개선": {
        problem: "앱 튕김과 실행 오류로 인한 사용자 이탈과 불만 증가",
        solution: "메모리 최적화, 크래시 리포팅 강화, 앱 실행 시 안정성 체크 로직 추가"
      },
      "로그인/인증 개선": {
        problem: "자동로그인 미작동과 매번 인증 요구로 인한 사용성 저하",
        solution: "생체인증 도입, 자동로그인 알고리즘 개선, 다중 사용자 세션 관리 시스템"
      },
      "사용성 개선": {
        problem: "가게 등록 과정의 복잡성과 반복적인 설정으로 인한 사용자 부담",
        solution: "원클릭 가게 등록, 설정 마법사 도입, 사용법 가이드 팝업 제공"
      }
    };

    return solutions[insight.title] || {
      problem: insight.description,
      solution: "상세 분석을 통한 맞춤형 해결책 도출 필요"
    };
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#ff0066]" />
          UX 개선 제안
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          실제 사용자 리뷰를 분석하여 도출한 개선 제안사항입니다 (비즈니스 영향도 순으로 정렬)
        </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights?.map((insight) => {
              const actionable = getActionableInsight(insight);
              return (
                <div
                  key={insight.id}
                  className="space-y-4 p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#ff0066]">
                        #{insights?.indexOf(insight) + 1}
                      </span>
                      <h3 className="font-semibold text-base">{insight.title}</h3>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPriorityColor(insight.priority)}`}
                    >
                      {insight.priority === "high" ? "높음" : 
                       insight.priority === "medium" ? "보통" : "낮음"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                        📋 예측되는 문제
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {actionable.problem}
                      </p>
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-[#ff0066] mx-auto" />
                    
                    <div>
                      <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                        💡 해결 방법
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {actionable.solution}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      언급 횟수: <span className="font-medium">{insight.mentionCount}회</span>
                    </p>
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