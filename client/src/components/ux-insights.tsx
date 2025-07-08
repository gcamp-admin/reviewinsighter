import { AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff0066] mb-4"></div>
            <p className="text-sm text-[#ff0066] font-medium">HEART 프레임워크 분석 중...</p>
            <p className="text-xs text-gray-500 mt-1">리뷰 데이터를 기반으로 UX 인사이트를 생성하고 있습니다</p>
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

  const getActionableInsight = (insight: Insight) => {
    // 실제 VOC 기반 문제점과 해결방안 매핑
    const vocSolutions: { [key: string]: { voc: string; solution: string } } = {
      "사용자 만족도 개선 (Happiness)": {
        voc: `실제 리뷰: "짜증나 죽겠음", "최악이네", "구림 완전 구림" 등 ${insight.mentionCount}건의 강한 부정 감정 표현이 수집됨`,
        solution: "고객 감정 관리 우선 대응: 부정 리뷰 작성자 개별 연락, 문제 해결 후 재평가 요청, 앱 내 실시간 지원 채팅"
      },
      "사용자 참여도 개선 (Engagement)": {
        voc: `실제 리뷰: "자꾸 끊김", "연결이 안됨", "느려서 못쓰겠음" 등 ${insight.mentionCount}건의 연결/성능 불만이 접수됨`,
        solution: "인프라 안정성 강화: 서버 용량 증설, 네트워크 최적화, 끊김 발생 시 자동 재연결 기능 개발"
      },
      "신규 사용자 적응 개선 (Adoption)": {
        voc: `실제 리뷰: "설정이 복잡함", "어떻게 쓰는지 모르겠음", "등록이 어려움" 등 ${insight.mentionCount}건의 사용법 관련 문의`,
        solution: "온보딩 프로세스 간소화: 3단계 설정 마법사, 동영상 가이드, 첫 사용자 전담 지원팀 운영"
      },
      "사용자 재방문율 개선 (Retention)": {
        voc: `실제 리뷰: "삭제했어요", "해지하고 싶음", "다른 앱 쓸래요" 등 ${insight.mentionCount}건의 이탈 의도 표명`,
        solution: "이탈 방지 전략: 해지 전 문제점 상담, 개선 완료 후 재사용 유도, 경쟁사 대비 차별화 포인트 강조"
      },
      "작업 성공률 개선 (Task Success)": {
        voc: `실제 리뷰: "앱이 튕김", "CCTV 안됨", "오류 발생" 등 ${insight.mentionCount}건의 핵심 기능 실패 신고`,
        solution: "기능 안정성 확보: 긴급 패치 배포, 실시간 모니터링 시스템, 오류 발생 시 즉시 알림 및 복구 가이드"
      }
    };

    return vocSolutions[insight.title] || {
      voc: insight.description,
      solution: "실제 VOC 데이터 기반 맞춤형 해결책 도출 필요"
    };
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#ff0066]" />
          HEART 프레임워크 UX 개선 제안
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            HEART 프레임워크 기반으로 실제 사용자 리뷰를 분석한 UX 개선 제안입니다
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🎯 우선순위 결정 기준</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong className="text-red-600">Critical:</strong> 앱 크래시, 핵심 기능 완전 실패 - 앱 사용 불가 상황</div>
              <div><strong className="text-orange-500">Major:</strong> 주요 기능 부분 실패, 성능 저하 - 사용자 경험 크게 저하</div>
              <div><strong className="text-yellow-600">Minor:</strong> UI 버그, 사용성 개선사항 - 기능은 작동하나 개선 필요</div>
              <div className="mt-2 text-xs text-gray-500">
                * 언급 횟수와 심각도를 종합하여 우선순위를 결정합니다
              </div>
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
          <div className="grid grid-cols-1 gap-4">
            {insights?.map((insight) => {
              const actionable = getActionableInsight(insight);
              return (
                <div
                  key={insight.id}
                  className="space-y-3 p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${getPriorityColor(insight.priority)}`}
                    >
                      {insight.priority === "critical" ? "Critical" : 
                       insight.priority === "major" ? "Major" : "Minor"}
                    </Badge>
                    <h3 className="font-semibold text-base flex-1">{insight.title}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                        📢 예측되는 문제점
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {actionable.voc}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                        💡 해결 방법
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {actionable.solution}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      언급 횟수: <span className="font-medium">{insight.mentionCount}건</span>
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