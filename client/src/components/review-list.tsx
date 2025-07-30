import { useState } from "react";
import { Smartphone, Apple, Star, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Eye, Filter, Minus, Download } from "lucide-react";
import { FaGooglePlay, FaApple, FaPenNib, FaMugHot } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import type { ReviewFilters, PaginatedReviews } from "@/types";
import * as XLSX from 'xlsx';

interface ReviewListProps {
  filters: ReviewFilters;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const storeIcons = {
  googlePlay: <FaGooglePlay color="#34A853" size={14} />,
  appleStore: <FaApple color="#333" size={14} />,
  naverBlog: <FaPenNib color="#03c75a" size={14} />,
  naverCafe: <FaMugHot color="#03c75a" size={14} />
};

function StoreIcon({ source }: { source: string }) {
  switch (source) {
    case 'google_play':
      return storeIcons.googlePlay;
    case 'app_store':
    case 'apple_store':
      return storeIcons.appleStore;
    case 'naver_blog':
      return storeIcons.naverBlog;
    case 'naver_cafe':
      return storeIcons.naverCafe;
    default:
      return null;
  }
}

export default function ReviewList({ filters, currentPage, onPageChange }: ReviewListProps) {
  const [sortOrder, setSortOrder] = useState("newest");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const limit = 5;

  const { data, isLoading, error } = useQuery<PaginatedReviews>({
    queryKey: ["/api/reviews", currentPage, limit, filters?.service?.id, filters.source, filters.dateFrom, filters.dateTo, sentimentFilter, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: limit.toString(),
      });
      
      if (filters?.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      
      // 소스 필터 적용 - 프론트엔드 이름을 백엔드 형식으로 변환
      const sourceMapping: Record<string, string> = {
        'googlePlay': 'google_play',
        'appleStore': 'app_store',
        'naverBlog': 'naver_blog',
        'naverCafe': 'naver_cafe'
      };
      
      if (sourceFilter !== "all") {
        const mappedSource = sourceMapping[sourceFilter] || sourceFilter;
        params.append("source", mappedSource);
      } else if (filters.source && filters.source.length > 0) {
        filters.source.forEach(source => {
          const mappedSource = sourceMapping[source] || source;
          params.append("source", mappedSource);
        });
      }
      
      if (filters.dateFrom) {
        params.append("startDate", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("endDate", filters.dateTo.toISOString());
      }
      if (sentimentFilter && sentimentFilter !== "all") {
        params.append("sentiment", sentimentFilter);
      }

      const url = `/api/reviews?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const result = await response.json();
      return result;
    },
    enabled: !!filters?.service?.id, // Only fetch when service is selected
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 2000, // Simple 2 second polling
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Don't show anything when no service is selected
  if (!filters?.service?.id) {
    return null;
  }

  console.log('Component data:', { data, hasData: !!data, reviews: data?.reviews?.length });
  
  // Check if there are any reviews with "분석중" status
  const hasAnalyzingReviews = data?.reviews?.some((review: any) => review.sentiment === "분석중") || false;
  
  // Filter reviews locally based on sentiment
  const filteredReviews = data?.reviews?.filter((review: any) => {
    if (sentimentFilter === "all") return true;
    return review.sentiment === sentimentFilter;
  }) || [];
  
  // 네이버 카페 리뷰가 포함되어 있는지 확인
  const hasNaverCafeReviews = filteredReviews.some((review: any) => review.source === "naver_cafe");
  
  console.log('Filtered reviews:', { total: filteredReviews.length, sentimentFilter, hasNaverCafeReviews });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
    }).replace(/\//g, ".");
  };

  const getSourceIcon = (source: string) => {
    return <StoreIcon source={source} />;
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case "google_play":
        return "구글플레이스토어";
      case "apple_store":
        return "애플앱스토어";
      case "naver_blog":
        return "네이버블로그";
      case "naver_cafe":
        return "네이버카페";
      default:
        return source;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    if (sentiment === "긍정") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 font-medium">긍정</Badge>;
    } else if (sentiment === "부정") {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-medium">부정</Badge>;
    } else if (sentiment === "분석중") {
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 font-medium">분석중</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 font-medium">중립</Badge>;
    }
  };

  // 전체 리뷰 데이터를 가져와서 엑셀 다운로드
  const downloadExcel = async () => {
    console.log('Excel download started - fetching all reviews with filters');
    
    try {
      // 전체 리뷰 데이터 가져오기 (페이지네이션 없이)
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "10000"); // 충분히 큰 수로 설정
      
      if (filters?.service?.id) {
        params.append("service", filters.service.id);
      }
      
      if (filters.source && filters.source.length > 0) {
        filters.source.forEach(source => {
          params.append("source", source);
        });
      }
      
      if (filters.dateFrom) {
        params.append("startDate", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("endDate", filters.dateTo.toISOString());
      }
      
      // 감정 필터 적용
      if (sentimentFilter && sentimentFilter !== "all") {
        params.append("sentiment", sentimentFilter);
      }

      const url = `/api/reviews?${params}`;
      console.log('Fetching all reviews from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch all reviews");
      }
      
      const allData = await response.json();
      console.log('All reviews fetched:', { total: allData.reviews.length });
      
      if (!allData.reviews || allData.reviews.length === 0) {
        console.log('No reviews to download');
        alert('다운로드할 리뷰 데이터가 없습니다.');
        return;
      }

      // 엑셀 데이터 구성
      const excelData = allData.reviews.map((review: any) => ({
        '채널': getSourceName(review.source),
        '날짜': formatDate(review.createdAt),
        '이름/ID': review.userId,
        '내용': review.content,
        '별점': (review.source === "google_play" || review.source === "app_store") ? review.rating : '',
        '감정분석': review.sentiment || '분석중'
      }));

      console.log('Excel data prepared:', { rowCount: excelData.length });

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 15 }, // 채널
        { wch: 12 }, // 날짜
        { wch: 20 }, // 이름/ID
        { wch: 50 }, // 내용
        { wch: 8 },  // 별점
        { wch: 12 }  // 감정분석
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, '리뷰데이터');

      // 파일명 생성 (날짜 정보 수정)
      const startDate = filters?.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : '시작일미지정';
      const endDate = filters?.dateTo ? filters.dateTo.toISOString().split('T')[0] : '종료일미지정';
      const filename = `commento_${startDate}_${endDate}.xlsx`;

      console.log('Downloading file:', filename, 'with', excelData.length, 'reviews');

      // 파일 다운로드
      XLSX.writeFile(workbook, filename);
      
      console.log('Excel download completed successfully');
    } catch (error) {
      console.error('Excel download failed:', error);
      alert('엑셀 파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-heading text-gray-900">리뷰 목록</CardTitle>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            리뷰 데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <Card className="bg-white border border-gray-200/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-heading text-gray-900 flex items-center gap-2">
              <span>리뷰 목록</span>
              <span className="text-body text-gray-500">
                {data?.total ? `총 ${data.total}개` : ""}
              </span>
            </CardTitle>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
              {/* 필터 적용 상태 표시 */}
              {(sentimentFilter !== "all" || sourceFilter !== "all") && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">필터 적용 중:</span>
                  <div className="flex items-center gap-2">
                    {sentimentFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        {sentimentFilter === "긍정" ? "긍정" : sentimentFilter === "부정" ? "부정" : "중립"}
                      </Badge>
                    )}
                    {sourceFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        {getSourceName(sourceFilter)}
                      </Badge>
                    )}
                    <button
                      onClick={() => {
                        setSentimentFilter("all");
                        setSourceFilter("all");
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      필터 초기화
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                {/* 감정 필터 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">감정</span>
                  <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>전체</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="긍정">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span>긍정</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="부정">
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                          <span>부정</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="중립">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-gray-600" />
                          <span>중립</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 채널 필터 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">채널</span>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>전체</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="google_play">
                        <div className="flex items-center gap-2">
                          <FaGooglePlay className="h-4 w-4 text-green-600" />
                          <span>구글 플레이</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="app_store">
                        <div className="flex items-center gap-2">
                          <FaApple className="h-4 w-4 text-gray-800" />
                          <span>애플 앱스토어</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="naver_blog">
                        <div className="flex items-center gap-2">
                          <FaPenNib className="h-4 w-4 text-green-600" />
                          <span>네이버 블로그</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="naver_cafe">
                        <div className="flex items-center gap-2">
                          <FaMugHot className="h-4 w-4 text-green-600" />
                          <span>네이버 카페</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            선택한 조건에 맞는 리뷰가 없습니다.
            {sourceFilter === "naver_blog" && (
              <div className="mt-2 text-sm">
                이 날짜 범위에는 네이버 블로그 리뷰가 없습니다. 다른 채널을 선택해보세요.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(data.total / limit);
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, data.total);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">리뷰 목록</span>
            <span className="text-sm text-muted-foreground">
              {data?.total ? `총 ${data.total}개` : ""}
            </span>
          </CardTitle>
          

          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            {/* 필터 적용 상태 표시 */}
            {(sentimentFilter !== "all" || sourceFilter !== "all") && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">필터 적용 중:</span>
                <div className="flex items-center gap-2">
                  {sentimentFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {sentimentFilter === "긍정" ? "긍정" : sentimentFilter === "부정" ? "부정" : "중립"}
                    </Badge>
                  )}
                  {sourceFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {getSourceName(sourceFilter)}
                    </Badge>
                  )}
                  <button
                    onClick={() => {
                      setSentimentFilter("all");
                      setSourceFilter("all");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              {/* 감정 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">감정</span>
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>전체</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="긍정">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        <span>긍정</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="부정">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        <span>부정</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="중립">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-gray-600" />
                        <span>중립</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 채널 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">채널</span>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>전체</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="google_play">
                      <div className="flex items-center gap-2">
                        <FaGooglePlay className="h-4 w-4 text-green-600" />
                        <span>구글 플레이</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="app_store">
                      <div className="flex items-center gap-2">
                        <FaApple className="h-4 w-4 text-gray-800" />
                        <span>애플 앱스토어</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="naver_blog">
                      <div className="flex items-center gap-2">
                        <FaPenNib className="h-4 w-4 text-green-600" />
                        <span>네이버 블로그</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="naver_cafe">
                      <div className="flex items-center gap-2">
                        <FaMugHot className="h-4 w-4 text-green-600" />
                        <span>네이버 카페</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 엑셀 다운로드 버튼 */}
              <Button
                onClick={downloadExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                엑셀 다운로드
              </Button>

              
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {filteredReviews.map((review) => (
            <div key={review.id} className="p-4 hover:bg-gradient-to-r hover:from-gray-50/70 hover:to-blue-50/70 transition-all duration-200 rounded-lg border border-gray-200/50 hover:border-blue-300/50 hover:shadow-sm group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-sm group-hover:scale-105 transform transition-transform duration-200">{getSourceIcon(review.source)}</span>
                  <span className="text-caption text-gray-600 group-hover:text-gray-800 transition-colors min-w-16">{getSourceName(review.source)}</span>
                  <span className="text-body font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{review.userId}</span>
                  <span className="text-caption text-gray-500 group-hover:text-gray-700 transition-colors">{formatDate(review.createdAt)}</span>
                  {/* Show rating for app stores only */}
                  {(review.source === "google_play" || review.source === "app_store") && (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-1">⭐</span>
                      <span className="text-xs text-gray-500">{review.rating}</span>
                    </div>
                  )}
                </div>
                <div className="group-hover:scale-105 transform transition-transform duration-200">
                  {getSentimentBadge(review.sentiment)}
                </div>
              </div>
              <div className="text-body text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors">
                <span>
                  {review.content.length > 150 ? review.content.slice(0, 150) + '...' : review.content}
                </span>
                {/* Add link for Naver reviews */}
                {(review.source === 'naver_blog' || review.source === 'naver_cafe') && (review as any).link && (
                  <span className="ml-2">
                    <a 
                      href={(review as any).link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs underline hover:bg-blue-50 px-1 py-0.5 rounded transition-all duration-200"
                    >
                      원문 보기 →
                    </a>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* AI Analysis Disclaimer */}
        <div className="mt-4 mb-3 px-4 py-3 text-caption text-gray-500 bg-gradient-to-r from-gray-50/80 to-blue-50/80 rounded-lg border border-gray-200/50">
          ※ 본 리뷰의 감정 분석은 AI 모델로 자동 처리되며, 일부 결과에는 오차가 포함될 수 있습니다.
          {hasNaverCafeReviews && (
            <div className="mt-2 text-gray-500">
              ※ 네이버 카페 API 제약으로 표시된 날짜와 실제 작성 날짜가 다를 수 있습니다. 정확한 날짜는 '원문 보기'를 통해 확인하세요.
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50">
          <div className="text-caption text-gray-500">
            {(() => {
              const totalPages = data.pages || Math.ceil(data.total / limit);
              const startItem = (currentPage - 1) * limit + 1;
              const endItem = Math.min(currentPage * limit, data.total);
              return (
                <>
                  총 <span className="font-medium text-gray-700">{data.total.toLocaleString()}</span>개 중{" "}
                  <span className="font-medium text-gray-700">{startItem}-{endItem}</span>개 표시
                </>
              );
            })()}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* 첫 페이지 */}
            {currentPage > 3 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 h-8"
                >
                  1
                </Button>
                {currentPage > 4 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
              </>
            )}
            
            {/* 현재 페이지 근처 */}
            {(() => {
              const pagesToShow = [];
              const totalPages = data.pages || Math.ceil(data.total / limit);
              let startPage, endPage;
              
              if (totalPages <= 7) {
                // 전체 페이지가 7개 이하면 모두 표시
                startPage = 1;
                endPage = totalPages;
              } else {
                // 현재 페이지 기준으로 앞뒤 2개씩 표시
                if (currentPage <= 4) {
                  startPage = 1;
                  endPage = 5;
                } else if (currentPage >= totalPages - 3) {
                  startPage = totalPages - 4;
                  endPage = totalPages;
                } else {
                  startPage = currentPage - 2;
                  endPage = currentPage + 2;
                }
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pagesToShow.push(
                  <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(i)}
                    className={currentPage === i ? "bg-primary hover:bg-primary/90 h-8" : "hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 h-8"}
                  >
                    {i}
                  </Button>
                );
              }
              
              return pagesToShow;
            })()}
            
            {/* 마지막 페이지 */}
            {(() => {
              const totalPages = data.pages || Math.ceil(data.total / limit);
              return currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 h-8"
                  >
                    {totalPages}
                  </Button>
                </>
              );
            })()}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === (data.pages || Math.ceil(data.total / limit))}
              className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 h-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
