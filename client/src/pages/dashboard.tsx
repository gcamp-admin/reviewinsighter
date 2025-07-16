import { useState } from "react";
import Header from "@/components/header";
import FilterSection from "@/components/filter-section";
import SourceDistributionCard from "@/components/source-distribution-card";
import SentimentDonutCard from "@/components/sentiment-donut-card";
import AverageRatingCard from "@/components/average-rating-card";
import ReviewList from "@/components/review-list";
import WordCloudAndInsights from "@/components/word-cloud-and-insights";
import AIAnalysisSection from "@/components/ai-analysis-section";
import KeywordNetworkPortfolio from "@/components/keyword-network-portfolio";
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
            <SourceDistributionCard />
            <SentimentDonutCard />
            <AverageRatingCard />
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
        
        {activeAnalysisSection === 'wordcloud' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <WordCloudAndInsights filters={filters} />
          </div>
        )}
        
        {activeAnalysisSection === 'heart' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <KeywordNetworkPortfolio filters={filters} />
          </div>
        )}
        
        {activeAnalysisSection === 'comprehensive' && (
          <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <KeywordNetworkPortfolio filters={filters} />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
              <WordCloudAndInsights filters={filters} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
