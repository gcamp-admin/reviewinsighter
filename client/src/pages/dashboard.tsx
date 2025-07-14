import { useState } from "react";
import Header from "@/components/header";
import FilterSection from "@/components/filter-section";
import StatsOverview from "@/components/stats-overview";
import ReviewList from "@/components/review-list";
import WordCloudAndInsights from "@/components/word-cloud-and-insights";
import AIAnalysisSection from "@/components/ai-analysis-section";
import { KeywordNetwork } from "@/components/keyword-network";
import type { ReviewFilters } from "@/types";

export default function Dashboard() {
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
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCollectionSuccess = () => {
    setHasCollectedReviews(true);
  };

  const handleAnalysisSuccess = (analysisType: 'wordcloud' | 'heart' | 'comprehensive') => {
    setActiveAnalysisSection(analysisType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-korean">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <FilterSection 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onCollectionSuccess={handleCollectionSuccess}
          />
        </div>
        
        {hasCollectedReviews && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <StatsOverview filters={filters} />
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
        
        {hasCollectedReviews && activeAnalysisSection && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 space-y-4">
            {activeAnalysisSection === 'wordcloud' && (
              <KeywordNetwork 
                serviceId={filters.service?.id || "익시오"}
                className="mb-4"
              />
            )}
            {activeAnalysisSection === 'heart' && (
              <WordCloudAndInsights 
                filters={filters}
                activeSection={activeAnalysisSection}
              />
            )}
            {activeAnalysisSection === 'comprehensive' && (
              <>
                <KeywordNetwork 
                  serviceId={filters.service?.id || "익시오"}
                  className="mb-4"
                />
                <WordCloudAndInsights 
                  filters={filters}
                  activeSection={'heart'}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
