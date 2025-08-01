import { useState } from "react";

import FilterSection from "@/components/filter-section";
import SourceDistributionCard from "@/components/source-distribution-card";
import SentimentDonutCard from "@/components/sentiment-donut-card";
import AverageRatingCard from "@/components/average-rating-card";
import ReviewList from "@/components/review-list";
import WordCloudAndInsights from "@/components/word-cloud-and-insights";
import AIAnalysisSection from "@/components/ai-analysis-section";
import backgroundImg from "@assets/main_1754031036088.png";

import type { ReviewFilters } from "@/types";

export default function Dashboard() {
  // Initial empty filters - users select their own date range
  const [filters, setFilters] = useState<ReviewFilters>({
    service: undefined,
    source: [],
    dateFrom: undefined,
    dateTo: undefined
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [hasCollectedReviews, setHasCollectedReviews] = useState(false);
  const [activeAnalysisSection, setActiveAnalysisSection] = useState<'wordcloud' | 'heart' | 'comprehensive' | null>(null);

  const handleFiltersChange = (newFilters: ReviewFilters) => {
    // 서비스, 채널, 날짜 변경 시 모든 데이터 초기화
    const shouldReset = (
      filters.service !== newFilters.service ||
      JSON.stringify(filters.source) !== JSON.stringify(newFilters.source) ||
      filters.dateFrom !== newFilters.dateFrom ||
      filters.dateTo !== newFilters.dateTo
    );

    if (shouldReset) {
      console.log("Filter change detected - resetting all data");
      setHasCollectedReviews(false);
      setActiveAnalysisSection(null);
    }

    // Always reset page to 1 when filters change
    setCurrentPage(1);
    setFilters(newFilters);
  };

  const handleCollectionSuccess = () => {
    setHasCollectedReviews(true);
  };

  const handleAnalysisSuccess = (analysisType: 'wordcloud' | 'heart' | 'comprehensive') => {
    console.log("handleAnalysisSuccess called with:", analysisType);
    setActiveAnalysisSection(analysisType);
  };

  return (
    <div className="min-h-screen font-korean relative">
      {/* 배경 이미지를 별도 div로 분리하여 더 정밀한 제어 */}
      <div 
        className="absolute inset-0 z-0 responsive-bg"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <div className="relative z-10">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-[280px] sm:pt-[320px] lg:pt-[360px]">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <FilterSection 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onCollectionSuccess={handleCollectionSuccess}
          />
        </div>
        
        {hasCollectedReviews && (
          <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <SourceDistributionCard filters={filters} />
            <SentimentDonutCard filters={filters} />
            <AverageRatingCard filters={filters} />
          </div>
        )}
        
        {hasCollectedReviews && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <ReviewList 
              filters={filters}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
        
        {hasCollectedReviews && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <AIAnalysisSection filters={filters} onAnalysisSuccess={handleAnalysisSuccess} />
          </div>
        )}
        

        
        {/* Always show WordCloudAndInsights when hasCollectedReviews is true */}
        {hasCollectedReviews && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <WordCloudAndInsights filters={filters} activeSection={activeAnalysisSection || undefined} />
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
