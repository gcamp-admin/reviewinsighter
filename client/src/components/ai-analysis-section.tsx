import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReviewFilters } from "@/types";

interface AIAnalysisSectionProps {
  filters: ReviewFilters;
}

export default function AIAnalysisSection({ filters }: AIAnalysisSectionProps) {
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if end date is before start date
  const isDateRangeInvalid = filters.dateTo && filters.dateFrom && filters.dateTo < filters.dateFrom;

  // Check if there are any reviews to analyze
  const { data: stats } = useQuery({
    queryKey: ["/api/reviews/stats", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
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

      const response = await fetch(`/api/reviews/stats?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id, // Only fetch when service is selected
  });

  const analyzeReviewsMutation = useMutation({
    mutationFn: async (): Promise<{ message: string; success: boolean }> => {
      if (!filters.service) {
        throw new Error('서비스를 선택해주세요');
      }
      
      // 📅 [1] 날짜 조건 검증 (필수 입력)
      if (!filters.dateFrom) {
        throw new Error('시작 날짜를 반드시 입력해주세요');
      }
      
      // 종료 날짜도 필수 입력으로 변경
      if (!filters.dateTo) {
        throw new Error('종료 날짜를 반드시 입력해주세요');
      }
      
      let endDate = filters.dateTo;
      
      // 종료 날짜가 시작 날짜보다 앞서지 않도록 검증
      if (endDate < filters.dateFrom) {
        throw new Error('날짜 범위가 유효하지 않습니다. 종료 날짜는 시작 날짜보다 앞설 수 없습니다.');
      }
      
      const payload = {
        serviceId: filters.service.id,
        serviceName: filters.service.name,
        source: filters.source,
        dateFrom: filters.dateFrom,
        dateTo: endDate
      };
      const response = await apiRequest("POST", "/api/analyze", payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI 분석 완료",
        description: data.message,
      });
      setHasAnalyzed(true);
      // Invalidate analysis data
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wordcloud"] });
    },
    onError: (error: any) => {
      toast({
        title: "분석 실패",
        description: error?.message || "AI 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Don't show if no service selected
  if (!filters.service?.id) {
    return null;
  }

  // Don't show if no reviews to analyze
  if (!stats || stats.total === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-600" />
          AI 분석
        </CardTitle>
        <CardDescription>
          수집된 {stats.total}개의 리뷰를 바탕으로 감정 워드클라우드 및 HEART 프레임워크 UX 개선 분석을 실행합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <Button 
            onClick={() => analyzeReviewsMutation.mutate()}
            disabled={analyzeReviewsMutation.isPending || !filters.dateFrom || !filters.dateTo || isDateRangeInvalid}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold disabled:opacity-50"
            size="lg"
          >
            {analyzeReviewsMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                <span className="animate-pulse">AI 분석 중...</span>
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-3" />
                AI 분석
              </>
            )}
          </Button>
          
          {!filters.dateFrom && (
            <p className="text-center text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
              📅 분석을 위해 시작 날짜를 먼저 입력해주세요
            </p>
          )}
          
          {filters.dateFrom && !filters.dateTo && (
            <p className="text-center text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
              📅 분석을 위해 종료 날짜를 입력해주세요
            </p>
          )}
          
          {isDateRangeInvalid && (
            <p className="text-center text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
              ⚠️ 종료 날짜가 시작 날짜보다 앞에 있습니다. 날짜 범위를 다시 확인해주세요
            </p>
          )}
          
          {filters.dateFrom && !hasAnalyzed && !analyzeReviewsMutation.isPending && (
            <p className="text-center text-sm text-gray-600">
              버튼을 클릭하여 감정 워드클라우드와 HEART 프레임워크 분석을 시작하세요
            </p>
          )}
          
          {analyzeReviewsMutation.isPending && (
            <div className="text-center">
              <p className="text-sm text-purple-600 font-medium mb-2">AI가 리뷰를 분석하고 있습니다...</p>
              <div className="flex justify-center space-x-4 text-xs text-gray-500">
                <span>📊 감정 분석</span>
                <span>🎯 HEART 프레임워크</span>
                <span>☁️ 워드클라우드 생성</span>
              </div>
            </div>
          )}
          
          {hasAnalyzed && analyzeReviewsMutation.isSuccess && (
            <p className="text-center text-sm text-green-600 font-medium">
              ✅ AI 분석이 완료되었습니다. 아래에서 결과를 확인하세요.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}