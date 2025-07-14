import { useState } from "react";
import { Filter, Search, Loader2, Smartphone, Apple, Brain, Globe, MessageCircle } from "lucide-react";
import { FaGooglePlay, FaApple, FaPenNib, FaMugHot } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReviewFilters, CollectResponse, Service } from "@/types";

interface FilterSectionProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  onCollectionSuccess?: () => void;
}

const SERVICES: Service[] = [
  {
    id: "ixio",
    name: "익시오",
    googlePlayId: "com.lguplus.aicallagent",
    appleStoreId: "6503931858",
    keywords: ["익시오", "ixio", "익시o", "ixi오", "LG익시오", "U+익시오", "유플러스익시오"]
  },
  {
    id: "ai-bizcall",
    name: "AI비즈콜",
    googlePlayId: "com.uplus.ubizai",
    appleStoreId: "6503284354",
    keywords: ["ai비즈콜", "에이아이비즈콜", "LG비즈콜", "유플러스비즈콜", "U+비즈콜"]
  },
  {
    id: "soho-package",
    name: "SOHO우리가게패키지",
    googlePlayId: "com.lguplus.sohoapp",
    appleStoreId: "1571096278",
    keywords: ["우리가게패키지", "LG우리가게", "U+우리가게", "유플러스우리가게", "유플러스소호패키지"]
  }
];

export default function FilterSection({ filters, onFiltersChange, onCollectionSuccess }: FilterSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [localFilters, setLocalFilters] = useState(filters);
  const [collectionProgress, setCollectionProgress] = useState(0);
  const [collectionStep, setCollectionStep] = useState("");

  const collectReviewsMutation = useMutation({
    mutationFn: async (): Promise<CollectResponse> => {
      // Reset progress
      setCollectionProgress(0);
      setCollectionStep("수집 준비 중...");
      
      // Validate required fields
      if (!localFilters.service) {
        throw new Error('서비스를 선택해주세요');
      }
      if (!localFilters.source || localFilters.source.length === 0) {
        throw new Error('스토어를 선택해주세요');
      }
      
      // 📅 리뷰 수집 시에도 날짜 범위 검증 추가
      if (localFilters.dateFrom && localFilters.dateTo) {
        // 종료 날짜가 시작 날짜보다 앞서지 않도록 검증
        if (localFilters.dateTo < localFilters.dateFrom) {
          throw new Error('날짜 범위가 유효하지 않습니다. 종료 날짜는 시작 날짜보다 앞설 수 없습니다.');
        }
        
        // 종료 날짜가 미래 날짜가 아닌지 검증
        if (localFilters.dateTo > new Date()) {
          throw new Error('종료 날짜는 오늘 날짜보다 이후 날짜를 선택할 수 없습니다.');
        }
        
        // 📅 날짜 범위 최대 31일 제한
        const timeDifference = localFilters.dateTo.getTime() - localFilters.dateFrom.getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        if (daysDifference > 31) {
          throw new Error('수집 기간은 최대 31일까지만 설정할 수 있습니다.');
        }
      }
      
      const payload = {
        selectedService: localFilters.service.name,
        selectedChannels: {
          googlePlay: localFilters.source.includes('google_play'),
          appleStore: localFilters.source.includes('app_store'),
          naverBlog: localFilters.source.includes('naver_blog'),
          naverCafe: localFilters.source.includes('naver_cafe')
        },
        appId: localFilters.service.googlePlayId,
        appIdApple: localFilters.service.appleStoreId,
        count: 500,
        sources: localFilters.source,
        serviceId: localFilters.service.id,
        serviceName: localFilters.service.name,
        startDate: localFilters.dateFrom?.toISOString(),
        endDate: localFilters.dateTo?.toISOString(),
      };
      
      console.log('Collection payload:', payload);
      
      // Set progress steps
      setCollectionProgress(20);
      setCollectionStep("선택된 스토어에서 리뷰 수집 중...");
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCollectionProgress(prev => {
          if (prev < 80) {
            return prev + 10;
          }
          return prev;
        });
      }, 2000);
      
      try {
        const response = await apiRequest("POST", "/api/reviews/collect", payload);
        clearInterval(progressInterval);
        setCollectionProgress(90);
        setCollectionStep("감정 분석 중...");
        
        const result = await response.json();
        
        setCollectionProgress(100);
        setCollectionStep("수집 완료!");
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Collection success data:', data);
      
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
        description: `${data.selectedService || localFilters.service?.name} - ${sourcesText}에서 ${data.message}`,
      });
      
      // Reset progress
      setTimeout(() => {
        setCollectionProgress(0);
        setCollectionStep("");
      }, 2000);
      
      // Only invalidate reviews and stats, not analysis data
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/stats"] });
      
      // Call the callback to show reviews after successful collection
      if (onCollectionSuccess) {
        onCollectionSuccess();
      }
    },
    onError: (error: any) => {
      setCollectionProgress(0);
      setCollectionStep("");
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
      
      // 종료 날짜가 미래 날짜가 아닌지 검증
      if (endDate > new Date()) {
        throw new Error('종료 날짜는 오늘 날짜보다 이후 날짜를 선택할 수 없습니다.');
      }
      
      // 📅 [2] 날짜 범위 최대 31일 제한
      const timeDifference = endDate.getTime() - localFilters.dateFrom.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
      if (daysDifference > 31) {
        throw new Error('분석 기간은 최대 31일까지만 설정할 수 있습니다.');
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

  // Check if date range exceeds 31 days
  const isDateRangeExceeded = localFilters.dateTo && localFilters.dateFrom && (() => {
    const timeDifference = localFilters.dateTo.getTime() - localFilters.dateFrom.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    return daysDifference > 31;
  })();

  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  // Get today's date in YYYY-MM-DD format for max attribute
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Check if end date is in the future
  const isEndDateInFuture = localFilters.dateTo && localFilters.dateTo > new Date();

  // Combined validation for date range issues
  const hasDateRangeError = isDateRangeInvalid || isEndDateInFuture || isDateRangeExceeded;

  return (
    <Card className="mb-8 hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            리뷰 수집 필터
          </CardTitle>

        </div>
        <CardDescription className="text-gray-600">
          스토어와 날짜를 선택하여 리뷰를 필터링하세요 (구글 플레이스토어, 애플 앱스토어, 네이버 블로그, 네이버 카페 지원)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Row 1: Service Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">서비스 선택 <span className="text-red-500">*</span></Label>
            <Select
              value={localFilters.service?.id || ""}
              onValueChange={(value) => {
                const selectedService = SERVICES.find(s => s.id === value);
                const newFilters = { 
                  ...localFilters, 
                  service: selectedService,
                  source: [] // No channels selected by default
                };
                setLocalFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              <SelectTrigger className="w-full min-w-[300px]">
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

          {/* Row 2: Store Selection (Checkboxes) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">수집 채널 선택 <span className="text-red-500">*</span></Label>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 group">
                <Checkbox 
                  id="google-play"
                  checked={localFilters.source.includes("google_play")}
                  onCheckedChange={(checked) => handleSourceChange("google_play", checked as boolean)}
                />
                <Label htmlFor="google-play" className="flex items-center space-x-2 cursor-pointer hover:text-green-600 transition-colors duration-300">
                  <FaGooglePlay className="w-4 h-4 text-green-600 group-hover:scale-110 transform transition-transform duration-300" />
                  <span className="text-sm">Google Play Store</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 group">
                <Checkbox 
                  id="app-store"
                  checked={localFilters.source.includes("app_store")}
                  onCheckedChange={(checked) => handleSourceChange("app_store", checked as boolean)}
                />
                <Label htmlFor="app-store" className="flex items-center space-x-2 cursor-pointer hover:text-gray-800 transition-colors duration-300">
                  <FaApple className="w-4 h-4 text-gray-600 group-hover:scale-110 transform transition-transform duration-300" />
                  <span className="text-sm">Apple App Store</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 group">
                <Checkbox 
                  id="naver-blog"
                  checked={localFilters.source.includes("naver_blog")}
                  onCheckedChange={(checked) => handleSourceChange("naver_blog", checked as boolean)}
                />
                <Label htmlFor="naver-blog" className="flex items-center space-x-2 cursor-pointer hover:text-green-600 transition-colors duration-300">
                  <FaPenNib className="w-4 h-4 text-green-500 group-hover:scale-110 transform transition-transform duration-300" />
                  <span className="text-sm">Naver Blog</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 group">
                <Checkbox 
                  id="naver-cafe"
                  checked={localFilters.source.includes("naver_cafe")}
                  onCheckedChange={(checked) => handleSourceChange("naver_cafe", checked as boolean)}
                />
                <Label htmlFor="naver-cafe" className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors duration-300">
                  <FaMugHot className="w-4 h-4 text-blue-500 group-hover:scale-110 transform transition-transform duration-300" />
                  <span className="text-sm">Naver Cafe</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Row 3: Date Range */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">수집 기간 선택</Label>
              <span className="text-xs text-amber-600">(최대 31일)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date-from" className="text-sm text-gray-600">시작 날짜 <span className="text-red-500">*</span></Label>
                <Input
                  id="date-from"
                  type="date"
                  value={formatDateForInput(localFilters.dateFrom)}
                  onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                  className={`w-full min-w-[200px] ${hasDateRangeError ? 'border-red-500' : ''}`}
                  placeholder="분석 시작 날짜를 선택하세요"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date-to" className="text-sm text-gray-600">종료 날짜 <span className="text-red-500">*</span></Label>
                <Input
                  id="date-to"
                  type="date"
                  value={formatDateForInput(localFilters.dateTo)}
                  onChange={(e) => handleDateChange('dateTo', e.target.value)}
                  max={getTodayDateString()}
                  className={`w-full min-w-[200px] ${hasDateRangeError ? 'border-red-500' : ''}`}
                  placeholder="분석 종료 날짜를 선택하세요"
                />
              </div>
            </div>
            {isDateRangeInvalid && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ 종료 날짜는 시작 날짜보다 뒤에 있어야 합니다
              </p>
            )}
            {isEndDateInFuture && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ 종료 날짜는 오늘 날짜보다 이후 날짜를 선택할 수 없습니다
              </p>
            )}
            {isDateRangeExceeded && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ 수집 기간은 최대 31일까지만 설정할 수 있습니다
              </p>
            )}
            
            {/* 날짜 범위 안내 메시지 */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 효과적인 리뷰 수집을 위한 팁:</p>
              <ul className="text-xs space-y-1 ml-2">
                <li>• 최근 1-2주 범위로 설정하면 가장 많은 리뷰를 수집할 수 있습니다</li>
                <li>• 익시오 앱의 경우 2025-07-12 ~ 2025-07-13 범위에 최신 리뷰가 있습니다</li>
                <li>• 너무 오래된 날짜 범위는 리뷰가 적을 수 있습니다</li>
              </ul>
            </div>
          </div>

          {/* Progress Bar */}
          {collectReviewsMutation.isPending && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">수집 진행 상황</span>
                <span className="text-sm text-gray-500">{collectionProgress}%</span>
              </div>
              <Progress value={collectionProgress} className="h-2" />
              {collectionStep && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">{collectionStep}</span>
                </div>
              )}
            </div>
          )}

          {/* Row 4: Review Collection Button */}
          <div className="pt-2">
            <Button 
              onClick={() => collectReviewsMutation.mutate()}
              disabled={collectReviewsMutation.isPending || !localFilters.service || localFilters.source.length === 0 || !localFilters.dateFrom || !localFilters.dateTo || hasDateRangeError}
              className="w-full bg-gradient-to-r from-[#7CF3C4] to-[#5DE3A8] hover:from-[#6BE3B5] hover:to-[#4CD499] text-black px-6 py-3 text-lg font-semibold disabled:opacity-50 hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:hover:scale-100"
              size="lg"
            >
              {collectReviewsMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  <span className="animate-pulse">수집 중...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-3 group-hover:scale-110 transform transition-transform duration-300" />
                  리뷰 수집
                </>
              )}
            </Button>
          </div>

          {/* Error Messages */}
          <div className="space-y-1">
            {!localFilters.service && (
              <p className="text-xs text-red-500">
                서비스를 먼저 선택해주세요
              </p>
            )}
            {localFilters.service && localFilters.source.length === 0 && (
              <p className="text-xs text-red-500">
                최소 하나의 스토어를 선택해주세요
              </p>
            )}
            {localFilters.service && localFilters.source.length > 0 && !localFilters.dateTo && (
              <p className="text-xs text-red-500">
                종료 날짜를 선택해주세요
              </p>
            )}
            {isDateRangeInvalid && (
              <p className="text-xs text-red-500">
                종료 날짜는 시작 날짜보다 뒤에 있어야 합니다
              </p>
            )}
            {isDateRangeExceeded && (
              <p className="text-xs text-red-500">
                수집 기간은 최대 31일까지만 설정할 수 있습니다
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
