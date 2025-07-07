import { TrendingUp, Users, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Insight } from "@/types";

export default function UxInsights() {
  const { data: insights, isLoading, error } = useQuery<Insight[]>({
    queryKey: ["/api/insights"],
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">매우 시급</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">중간 우선</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">낮은 우선</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500";
      case "medium":
        return "border-l-4 border-yellow-500";
      case "low":
        return "border-l-4 border-green-500";
      default:
        return "border-l-4 border-gray-300";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-3 h-3 inline mr-1" />;
      case "stable":
        return <Users className="w-3 h-3 inline mr-1" />;
      default:
        return <PlusCircle className="w-3 h-3 inline mr-1" />;
    }
  };

  const getTrendText = (trend?: string, category?: string) => {
    switch (trend) {
      case "increasing":
        return "최근 2주간 35% 증가";
      case "stable":
        return category === "ui_ux" ? "신규 사용자 대부분 언급" : "안정적 수준 유지";
      default:
        return "기존 기능 안정화 후 고려";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UX 개선 인사이트</CardTitle>
          <CardDescription>부정 리뷰 분석 기반 개선 제안</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-l-4 border-gray-200 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UX 개선 인사이트</CardTitle>
          <CardDescription>부정 리뷰 분석 기반 개선 제안</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            인사이트 데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UX 개선 인사이트</CardTitle>
          <CardDescription>부정 리뷰 분석 기반 개선 제안</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            개선 인사이트가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>UX 개선 인사이트</CardTitle>
        <CardDescription>부정 리뷰 분석 기반 개선 제안</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className={`${getPriorityBorder(insight.priority)} pl-4`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                {getPriorityBadge(insight.priority)}
              </div>
              <p className="text-sm text-gray-600">{insight.description}</p>
              <div className="mt-2 text-xs text-gray-500">
                {getTrendIcon(insight.trend)}
                {getTrendText(insight.trend, insight.category)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
