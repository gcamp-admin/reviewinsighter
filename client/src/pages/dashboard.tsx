import { useState } from "react";
import Header from "@/components/header";
import FilterSection from "@/components/filter-section";
import StatsOverview from "@/components/stats-overview";
import ReviewList from "@/components/review-list";
import WordCloudAndInsights from "@/components/word-cloud-and-insights";
import AIAnalysisSection from "@/components/ai-analysis-section";
import RealTimeSentimentMonitor from "@/components/real-time-sentiment-monitor";
import SentimentTrendChart from "@/components/sentiment-trend-chart";
import EnhancedWordCloud from "@/components/enhanced-word-cloud";
import HeartRadarChart from "@/components/heart-radar-chart";
import PriorityMatrix from "@/components/priority-matrix";
import AnomalyDetection from "@/components/anomaly-detection";
import CompetitiveAnalysis from "@/components/competitive-analysis";
import PredictiveAnalytics from "@/components/predictive-analytics";
import AutoReportGenerator from "@/components/auto-report-generator";
import type { ReviewFilters } from "@/types";

export default function Dashboard() {
  const [filters, setFilters] = useState<ReviewFilters>({
    service: undefined,
    source: [],
    dateFrom: undefined,
    dateTo: undefined
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const handleFiltersChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleWordClick = (word: string) => {
    setSelectedKeyword(word);
    // In a real application, you would filter reviews by this keyword
    console.log("Selected keyword:", word);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-korean">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterSection 
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        
        {/* Real-time Monitoring */}
        <RealTimeSentimentMonitor filters={filters} />
        
        <StatsOverview filters={filters} />
        
        {/* Enhanced Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
            <SentimentTrendChart filters={filters} />
          </div>
          <div>
            <HeartRadarChart filters={filters} />
          </div>
        </div>
        
        {/* Enhanced Word Cloud */}
        <EnhancedWordCloud filters={filters} onWordClick={handleWordClick} />
        
        {/* Priority Matrix */}
        <PriorityMatrix filters={filters} />
        
        {/* Advanced Analytics */}
        <AnomalyDetection filters={filters} />
        
        <CompetitiveAnalysis filters={filters} />
        
        <PredictiveAnalytics filters={filters} />
        
        <AutoReportGenerator filters={filters} />
        
        <ReviewList 
          filters={filters}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
        
        <AIAnalysisSection filters={filters} />
        
        <WordCloudAndInsights filters={filters} />
      </main>
    </div>
  );
}
