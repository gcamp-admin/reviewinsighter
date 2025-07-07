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
    // HEART 프레임워크 기반 솔루션 매핑
    const heartSolutions: { [key: string]: { problem: string; solution: string } } = {
      "사용자 만족도 개선 (Happiness)": {
        problem: "강한 부정적 감정과 사용성 불만으로 인한 전반적 만족도 저하",
        solution: "사용자 피드백 수집 강화, 빠른 응답 시스템 구축, 감정적 경험 개선을 위한 마이크로인터랙션 도입"
      },
      "사용자 참여도 개선 (Engagement)": {
        problem: "연결 불안정성과 성능 이슈로 인한 지속적 사용 방해",
        solution: "네트워크 최적화, 로딩 시간 단축, 오프라인 모드 지원, 백그라운드 동기화 개선"
      },
      "신규 사용자 적응 개선 (Adoption)": {
        problem: "복잡한 학습 곡선과 어려운 초기 설정으로 신규 사용자 포기",
        solution: "인터랙티브 튜토리얼 도입, 단계별 온보딩 플로우, 컨텍스트 기반 도움말 시스템"
      },
      "사용자 재방문율 개선 (Retention)": {
        problem: "이탈 의도 표시와 경쟁사 이동 고려로 인한 사용자 손실",
        solution: "개인화된 알림 전략, 핵심 가치 강화, 이탈 방지 인센티브 프로그램, 피드백 루프 구축"
      },
      "작업 성공률 개선 (Task Success)": {
        problem: "핵심 기능 실패와 앱 불안정으로 인한 목표 달성 실패",
        solution: "에러 핸들링 강화, 자동 복구 시스템, 진행상황 저장 기능, 대체 경로 제공"
      }
    };

    return heartSolutions[insight.title] || {
      problem: insight.description,
      solution: "HEART 프레임워크 기반 상세 분석을 통한 맞춤형 해결책 도출 필요"
    };
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#ff0066]" />
          HEART 프레임워크 UX 개선 제안
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          HEART 프레임워크 기반으로 실제 사용자 리뷰를 분석한 UX 개선 제안입니다
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