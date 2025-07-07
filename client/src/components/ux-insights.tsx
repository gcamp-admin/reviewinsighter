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
    // HEART 프레임워크 기반 현실적 솔루션 매핑 (필터링된 데이터 기반)
    const heartSolutions: { [key: string]: { problem: string; solution: string } } = {
      "사용자 만족도 개선 (Happiness)": {
        problem: `현재 ${insight.mentionCount}명의 사용자가 강한 부정 감정을 표현하고 있으며, 이는 곧 평점 하락과 리뷰 악화로 이어질 위험이 높음`,
        solution: "1주 내 사용자 피드백 대응팀 운영, 부정 리뷰 대상 개별 연락 및 문제 해결, 앱 내 실시간 도움말 채팅 기능 추가"
      },
      "사용자 참여도 개선 (Engagement)": {
        problem: `${insight.mentionCount}건의 연결/성능 문제로 사용자들이 실제 업무(CCTV 모니터링, 가게 관리)에 차질을 겪고 있어 일상 사용 포기 위험`,
        solution: "서버 인프라 즉시 점검, 네트워크 안정성 모니터링 대시보드 구축, 끊김 발생 시 자동 재연결 기능 개발"
      },
      "신규 사용자 적응 개선 (Adoption)": {
        problem: `${insight.mentionCount}명이 초기 설정에서 어려움을 겪어 앱 삭제 또는 사용 포기로 이어질 가능성이 높음`,
        solution: "3단계 간편 설정 마법사 개발, 첫 실행 시 개인 맞춤형 가이드 제공, 고객센터 원클릭 연결 버튼 추가"
      },
      "사용자 재방문율 개선 (Retention)": {
        problem: `${insight.mentionCount}명이 이미 삭제/해지 의도를 표명했으며, 이는 실제 고객 이탈로 직결되어 매출 손실 발생`,
        solution: "이탈 의도 고객 대상 할인 혜택 제공, 문제점 개선 완료 시 개별 안내, 경쟁사 대비 차별화 기능 홍보"
      },
      "작업 성공률 개선 (Task Success)": {
        problem: `${insight.mentionCount}건의 핵심 기능 실패로 사용자들이 실제 가게 운영, CCTV 모니터링 업무를 완료하지 못해 비즈니스 임팩트 발생`,
        solution: "긴급 버그 수정 패치 배포, 기능별 성공률 모니터링 시스템 구축, 실패 시 대체 방법 안내 팝업 제공"
      }
    };

    return heartSolutions[insight.title] || {
      problem: insight.description,
      solution: "현재 필터링된 데이터 기반 상세 분석을 통한 맞춤형 해결책 도출 필요"
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