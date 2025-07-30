import { useState } from "react";
import Header from "@/components/header";
import FilterSection from "@/components/filter-section";
import SourceDistributionCard from "@/components/source-distribution-card";
import SentimentDonutCard from "@/components/sentiment-donut-card";
import AverageRatingCard from "@/components/average-rating-card";
import ReviewList from "@/components/review-list";
import WordCloudAndInsights from "@/components/word-cloud-and-insights";
import AIAnalysisSection from "@/components/ai-analysis-section";

import type { ReviewFilters } from "@/types";

export default function Dashboard() {
  // Set default service to 익시오 so users can see existing data immediately
  const [filters, setFilters] = useState<ReviewFilters>({
    service: {
      id: "ixio",
      name: "익시오",
      googlePlayId: "com.lguplus.aicallagent",
      appleStoreId: "6503931858",
      keywords: ["익시오", "ixio", "익시o", "ixi오", "LG익시오", "U+익시오", "유플러스익시오"]
    },
    source: ["googlePlay", "appleStore", "naverBlog", "naverCafe"],
    dateFrom: undefined,
    dateTo: undefined
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [hasCollectedReviews, setHasCollectedReviews] = useState(true); // Set to true to show existing data
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
      setCurrentPage(1);
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-korean">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
  );
}
