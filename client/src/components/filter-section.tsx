import { useState } from "react";
import { Filter, Search, Loader2, Smartphone, Apple, Brain, Globe, MessageCircle, Grid3X3, PenLine, Coffee, CheckCircle, Play, Calendar, Check } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
        description: `${localFilters.service?.name} - ${sourcesText}에서 ${data.message}`,
      });
      
      // Reset progress
      setTimeout(() => {
        setCollectionProgress(0);
        setCollectionStep("");
      }, 2000);
      
      // Update filters with the collected service information
      onFiltersChange(localFilters);
      
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

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string | Date | null) => {
    const newFilters = { 
      ...localFilters, 
      [field]: value ? (typeof value === 'string' ? new Date(value) : value) : undefined 
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
        <CardTitle className="text-lg bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          서비스 추가, 리뷰 수집 필터
        </CardTitle>
        <CardDescription className="text-gray-600">분석하고 싶은 서비스, 수집채널과 수집기간을 선택 후 '리뷰 수집' 버튼을 클릭하세요</CardDescription>
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

          {/* Row 2: Channel Selection (Modern Cards) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">리뷰 수집 채널을 선택하세요 <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: "google_play", name: "구글 앱스토어", icon: Play },
                { id: "app_store", name: "애플앱스토어", icon: Apple },
                { id: "naver_blog", name: "네이버블로그", icon: PenLine },
                { id: "naver_cafe", name: "네이버카페", icon: Coffee },
              ].map((channel) => {
                const isActive = localFilters.source.includes(channel.id);
                const IconComponent = channel.icon;
                return (
                  <div
                    key={channel.id}
                    onClick={() => handleSourceChange(channel.id, !isActive)}
                    className={`relative w-full p-4 rounded-xl border text-center cursor-pointer transition 
                      ${isActive ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"} 
                      hover:shadow-md`}
                  >
                    <div className="text-gray-700 flex flex-col items-center justify-center space-y-2">
                      <IconComponent className="w-6 h-6" />
                      <span className="text-sm">{channel.name}</span>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full z-10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 3: Date Range */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">수집 기간 선택</Label>
            </div>
            <div className="date-picker-grid">
              <div style={{ width: '100%' }}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  시작 날짜 <span className="text-red-500">*</span>
                </label>
                <div className="relative" style={{ width: '100%' }}>
                  <DatePicker
                    selected={localFilters.dateFrom}
                    onChange={(date) => handleDateChange('dateFrom', date)}
                    placeholderText="년-월-일"
                    dateFormat="yyyy-MM-dd"
                    openToDate={new Date()}
                    className={`w-full p-2 pl-4 pr-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${hasDateRangeError ? 'border-red-500' : ''}`}
                    wrapperClassName="w-full"
                    popperPlacement="bottom-start"
                    showIcon={false}
                    onFocus={(e) => e.target.click()}
                  />
                </div>
              </div>
              <div style={{ width: '100%' }}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  종료 날짜 <span className="text-red-500">*</span>
                </label>
                <div className="relative" style={{ width: '100%' }}>
                  <DatePicker
                    selected={localFilters.dateTo}
                    onChange={(date) => handleDateChange('dateTo', date)}
                    placeholderText="년-월-일"
                    dateFormat="yyyy-MM-dd"
                    maxDate={new Date()}
                    openToDate={new Date()}
                    className={`w-full p-2 pl-4 pr-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${hasDateRangeError ? 'border-red-500' : ''}`}
                    wrapperClassName="w-full"
                    popperPlacement="bottom-start"
                    showIcon={false}
                    onFocus={(e) => e.target.click()}
                  />
                </div>
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
            
            

          </div>



          {/* Row 4: Review Collection Button */}
          <div className="flex flex-col items-center space-y-3 pt-2">
            <Button 
              onClick={() => collectReviewsMutation.mutate()}
              disabled={collectReviewsMutation.isPending || !localFilters.service || localFilters.source.length === 0 || !localFilters.dateFrom || !localFilters.dateTo || hasDateRangeError}
              className="w-full gradient-bg hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] text-white px-6 py-3 text-lg font-semibold disabled:opacity-50 hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:hover:scale-100"
              size="lg"
            >
              {collectReviewsMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  <span className="animate-pulse">수집 중... {collectionProgress}%</span>
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
          <div className="space-y-1 text-center">
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
