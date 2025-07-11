import { useState } from "react";
import { Brain, Loader2, MessageCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReviewFilters } from "@/types";

interface AIAnalysisSectionProps {
  filters: ReviewFilters;
  onAnalysisSuccess: (analysisType: 'wordcloud' | 'heart') => void;
}

export default function AIAnalysisSection({ filters, onAnalysisSuccess }: AIAnalysisSectionProps) {
  const [hasAnalyzedWordCloud, setHasAnalyzedWordCloud] = useState(false);
  const [hasAnalyzedHeart, setHasAnalyzedHeart] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if end date is before start date
  const isDateRangeInvalid = filters.dateTo && filters.dateFrom && filters.dateTo < filters.dateFrom;
  
  // Check if end date is in the future
  const isEndDateInFuture = filters.dateTo && filters.dateTo > new Date();
  
  // Combined validation for date range issues
  const hasDateRangeError = isDateRangeInvalid || isEndDateInFuture;

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

  const analyzeWordCloudMutation = useMutation({
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
      
      // 종료 날짜가 미래 날짜가 아닌지 검증
      if (endDate > new Date()) {
        throw new Error('종료 날짜는 오늘 날짜보다 이후 날짜를 선택할 수 없습니다.');
      }
      
      const payload = {
        serviceId: filters.service.id,
        serviceName: filters.service.name,
        source: filters.source,
        dateFrom: filters.dateFrom,
        dateTo: endDate,
        analysisType: 'wordcloud'
      };
      const response = await apiRequest("POST", "/api/analyze", payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "감정 워드클라우드 분석 완료",
        description: data.message,
      });
      setHasAnalyzedWordCloud(true);
      onAnalysisSuccess('wordcloud');
      // Invalidate word cloud data
      queryClient.invalidateQueries({ queryKey: ["/api/wordcloud"] });
    },
    onError: (error: any) => {
      toast({
        title: "워드클라우드 분석 실패",
        description: error?.message || "감정 워드클라우드 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const analyzeHeartMutation = useMutation({
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
      
      // 종료 날짜가 미래 날짜가 아닌지 검증
      if (endDate > new Date()) {
        throw new Error('종료 날짜는 오늘 날짜보다 이후 날짜를 선택할 수 없습니다.');
      }
      
      const payload = {
        serviceId: filters.service.id,
        serviceName: filters.service.name,
        source: filters.source,
        dateFrom: filters.dateFrom,
        dateTo: endDate,
        analysisType: 'heart'
      };
      const response = await apiRequest("POST", "/api/analyze", payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "HEART 프레임워크 분석 완료",
        description: data.message,
      });
      setHasAnalyzedHeart(true);
      onAnalysisSuccess('heart');
      // Invalidate insights data
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
    },
    onError: (error: any) => {
      toast({
        title: "HEART 분석 실패",
        description: error?.message || "HEART 프레임워크 분석 중 오류가 발생했습니다.",
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
    <Card className="mb-8 hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-600 group-hover:scale-110 transform transition-transform duration-300" />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">AI 분석</span>
        </CardTitle>
        <CardDescription className="text-gray-600">
          수집된 {stats.total}개의 리뷰를 바탕으로 감정 워드클라우드 및 HEART 프레임워크 UX 개선 분석을 실행합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex gap-4 w-full max-w-2xl">
            <Button 
              onClick={() => analyzeWordCloudMutation.mutate()}
              disabled={analyzeWordCloudMutation.isPending || !filters.dateFrom || !filters.dateTo || hasDateRangeError}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 text-lg font-semibold disabled:opacity-50 hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:hover:scale-100"
              size="lg"
            >
              {analyzeWordCloudMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  <span className="animate-pulse">워드클라우드 분석 중...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 mr-3 group-hover:scale-110 transform transition-transform duration-300" />
                  감정 워드클라우드
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => analyzeHeartMutation.mutate()}
              disabled={analyzeHeartMutation.isPending || !filters.dateFrom || !filters.dateTo || hasDateRangeError}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 text-lg font-semibold disabled:opacity-50 hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:hover:scale-100"
              size="lg"
            >
              {analyzeHeartMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  <span className="animate-pulse">HEART 분석 중...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 mr-3 group-hover:scale-110 transform transition-transform duration-300" />
                  HEART 프레임워크 분석
                </>
              )}
            </Button>
          </div>
          
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
          
          {isEndDateInFuture && (
            <p className="text-center text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
              ⚠️ 종료 날짜는 오늘 날짜보다 이후 날짜를 선택할 수 없습니다
            </p>
          )}
          

          
          {(analyzeWordCloudMutation.isPending || analyzeHeartMutation.isPending) && (
            <div className="text-center">
              <p className="text-sm text-purple-600 font-medium mb-2">AI가 리뷰를 분석하고 있습니다...</p>
              <div className="flex justify-center space-x-4 text-xs text-gray-500">
                <span>📊 감정 분석</span>
                <span>🎯 HEART 프레임워크</span>
                <span>☁️ 워드클라우드 생성</span>
              </div>
            </div>
          )}
          
          {(hasAnalyzedWordCloud || hasAnalyzedHeart) && (analyzeWordCloudMutation.isSuccess || analyzeHeartMutation.isSuccess) && (
            <p className="text-center text-sm text-green-600 font-medium">
              ✅ AI 분석이 완료되었습니다. 아래에서 결과를 확인하세요.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}