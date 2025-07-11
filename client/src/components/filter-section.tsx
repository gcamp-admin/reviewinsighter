import { useState } from "react";
import { Filter, Search, Loader2, Smartphone, Apple, Brain, Globe, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReviewFilters, CollectResponse, Service } from "@/types";

interface FilterSectionProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
}

const SERVICES: Service[] = [
  {
    id: "ixio",
    name: "익시오",
    googlePlayId: "com.lguplus.aicallagent",
    appleStoreId: "6503931858"
  },
  {
    id: "ai-bizcall",
    name: "AI비즈콜",
    googlePlayId: "com.uplus.ubizai",
    appleStoreId: "6503284354"
  },
  {
    id: "soho-package",
    name: "SOHO우리가게 패키지",
    googlePlayId: "com.lguplus.sohoapp",
    appleStoreId: "1571096278"
  }
];

export default function FilterSection({ filters, onFiltersChange }: FilterSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [localFilters, setLocalFilters] = useState(filters);

  const collectReviewsMutation = useMutation({
    mutationFn: async (): Promise<CollectResponse> => {
      // Validate required fields
      if (!localFilters.service) {
        throw new Error('서비스를 선택해주세요');
      }
      if (!localFilters.source || localFilters.source.length === 0) {
        throw new Error('스토어를 선택해주세요');
      }
      
      const payload = {
        appId: localFilters.service.googlePlayId,
        appIdApple: localFilters.service.appleStoreId,
        count: 500,
        sources: localFilters.source,
        serviceId: localFilters.service.id,
        serviceName: localFilters.service.name,
      };
      const response = await apiRequest("POST", "/api/reviews/collect", payload);
      return response.json();
    },
    onSuccess: (data) => {
      const sourcesText = localFilters.source.map(s => {
        switch(s) {
          case 'google_play': return '구글 플레이';
          case 'app_store': return '앱스토어';
          case 'naver_blog': return '네이버 블로그';
          case 'naver_cafe': return '네이버 카페';
          default: return s;
        }
      }).join(', ');
      
      toast({
        title: "수집 완료",
        description: `${localFilters.service?.name} - ${sourcesText}에서 ${data.message}`,
      });
      // Only invalidate reviews and stats, not analysis data
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "수집 실패",
        description: error?.message || "리뷰 수집 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const analyzeReviewsMutation = useMutation({
    mutationFn: async (): Promise<{ message: string; success: boolean }> => {
      if (!localFilters.service) {
        throw new Error('서비스를 선택해주세요');
      }
      
      // 📅 [1] 날짜 조건 검증 (필수 입력)
      if (!localFilters.dateFrom) {
        throw new Error('시작 날짜를 반드시 입력해주세요');
      }
      
      // 종료 날짜도 필수 입력으로 변경
      if (!localFilters.dateTo) {
        throw new Error('종료 날짜를 반드시 입력해주세요');
      }
      
      let endDate = localFilters.dateTo;
      
      // 종료 날짜가 시작 날짜보다 앞서지 않도록 검증
      if (endDate < localFilters.dateFrom) {
        throw new Error('날짜 범위가 유효하지 않습니다. 종료 날짜는 시작 날짜보다 앞설 수 없습니다.');
      }
      
      const payload = {
        serviceId: localFilters.service.id,
        serviceName: localFilters.service.name,
        source: localFilters.source,
        dateFrom: localFilters.dateFrom,
        dateTo: endDate
      };
      const response = await apiRequest("POST", "/api/analyze", payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "분석 완료",
        description: `AI 감정 워드클라우드 및 UX 개선 분석이 완료되었습니다.`,
      });
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

  const handleSourceChange = (source: string, checked: boolean) => {
    const newSource = checked 
      ? [...localFilters.source, source]
      : localFilters.source.filter(s => s !== source);
    
    const newFilters = { ...localFilters, source: newSource };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    const newFilters = { 
      ...localFilters, 
      [field]: value ? new Date(value) : undefined 
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Check if end date is before start date
  const isDateRangeInvalid = localFilters.dateTo && localFilters.dateFrom && localFilters.dateTo < localFilters.dateFrom;

  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">리뷰 수집 필터</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>필터 설정</span>
          </div>
        </div>
        <CardDescription>스토어와 날짜를 선택하여 리뷰를 필터링하세요 (구글 플레이스토어, 애플 앱스토어, 네이버 블로그, 네이버 카페 지원)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Service Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">서비스 선택 <span className="text-red-500">*</span></Label>
            <Select
              value={localFilters.service?.id || ""}
              onValueChange={(value) => {
                const selectedService = SERVICES.find(s => s.id === value);
                const newFilters = { 
                  ...localFilters, 
                  service: selectedService,
                  source: selectedService ? ['google_play', 'app_store', 'naver_blog', 'naver_cafe'] : []
                };
                setLocalFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="서비스명을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Store Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">스토어 선택 <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="google-play"
                  checked={localFilters.source.includes("google_play")}
                  onCheckedChange={(checked) => handleSourceChange("google_play", checked as boolean)}
                />
                <Label htmlFor="google-play" className="flex items-center space-x-2 cursor-pointer">
                  <Smartphone className="w-4 h-4 text-green-600" />
                  <span className="text-sm">구글 플레이스토어</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="app-store"
                  checked={localFilters.source.includes("app_store")}
                  onCheckedChange={(checked) => handleSourceChange("app_store", checked as boolean)}
                />
                <Label htmlFor="app-store" className="flex items-center space-x-2 cursor-pointer">
                  <Apple className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">애플 앱스토어</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="naver-blog"
                  checked={localFilters.source.includes("naver_blog")}
                  onCheckedChange={(checked) => handleSourceChange("naver_blog", checked as boolean)}
                />
                <Label htmlFor="naver-blog" className="flex items-center space-x-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-sm">네이버 블로그</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="naver-cafe"
                  checked={localFilters.source.includes("naver_cafe")}
                  onCheckedChange={(checked) => handleSourceChange("naver_cafe", checked as boolean)}
                />
                <Label htmlFor="naver-cafe" className="flex items-center space-x-2 cursor-pointer">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">네이버 카페</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label htmlFor="date-from" className="text-sm font-medium">시작 날짜 <span className="text-red-500">*</span></Label>
            <Input
              id="date-from"
              type="date"
              value={formatDateForInput(localFilters.dateFrom)}
              onChange={(e) => handleDateChange('dateFrom', e.target.value)}
              className={`w-full ${isDateRangeInvalid ? 'border-red-500' : ''}`}
              placeholder="분석 시작 날짜를 선택하세요"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="date-to" className="text-sm font-medium">종료 날짜 <span className="text-red-500">*</span></Label>
            <Input
              id="date-to"
              type="date"
              value={formatDateForInput(localFilters.dateTo)}
              onChange={(e) => handleDateChange('dateTo', e.target.value)}
              className={`w-full ${isDateRangeInvalid ? 'border-red-500' : ''}`}
              placeholder="분석 종료 날짜를 선택하세요"
            />
            {isDateRangeInvalid && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ 종료 날짜는 시작 날짜보다 뒤에 있어야 합니다
              </p>
            )}
          </div>

          {/* Review Collection Button - Moved to rightmost position */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">리뷰 수집</Label>
            <Button 
              onClick={() => collectReviewsMutation.mutate()}
              disabled={collectReviewsMutation.isPending || !localFilters.service || localFilters.source.length === 0 || !localFilters.dateFrom || !localFilters.dateTo || isDateRangeInvalid}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {collectReviewsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  수집 중...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  리뷰 수집
                </>
              )}
            </Button>
            {!localFilters.service && (
              <p className="text-xs text-red-500 mt-1">
                서비스를 먼저 선택해주세요
              </p>
            )}
            {localFilters.service && localFilters.source.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                최소 하나의 스토어를 선택해주세요
              </p>
            )}
            {localFilters.service && localFilters.source.length > 0 && !localFilters.dateTo && (
              <p className="text-xs text-red-500 mt-1">
                종료 날짜를 선택해주세요
              </p>
            )}
            {isDateRangeInvalid && (
              <p className="text-xs text-red-500 mt-1">
                종료 날짜는 시작 날짜보다 뒤에 있어야 합니다
              </p>
            )}

          </div>
        </div>

        </div>
      </CardContent>
    </Card>
  );
}
