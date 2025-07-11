import { useState } from "react";
import Header from "@/components/header";
import FilterSection from "@/components/filter-section";
import StatsOverview from "@/components/stats-overview";
import ReviewList from "@/components/review-list";
import WordCloudAndInsights from "@/components/word-cloud-and-insights";
import AIAnalysisSection from "@/components/ai-analysis-section";
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

  const handleFiltersChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCollectionSuccess = () => {
    setHasCollectedReviews(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-korean">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterSection 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onCollectionSuccess={handleCollectionSuccess}
        />
        
        {hasCollectedReviews && <StatsOverview filters={filters} />}
        
        {hasCollectedReviews && (
          <ReviewList 
            filters={filters}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
        
        {hasCollectedReviews && <AIAnalysisSection filters={filters} />}
        
        {hasCollectedReviews && <WordCloudAndInsights filters={filters} />}
      </main>
    </div>
  );
}
