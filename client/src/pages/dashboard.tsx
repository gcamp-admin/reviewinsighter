import { useState } from "react";
import Header from "@/components/header";
import FilterSection from "@/components/filter-section";
import StatsOverview from "@/components/stats-overview";
import ReviewList from "@/components/review-list";
import WordCloud from "@/components/word-cloud";
import UxInsights from "@/components/ux-insights";
import type { ReviewFilters } from "@/types";

export default function Dashboard() {
  const [filters, setFilters] = useState<ReviewFilters>({
    source: ["google_play", "app_store"],
    dateFrom: new Date("2024-01-01"),
    dateTo: new Date("2024-01-15")
  });

  const [currentPage, setCurrentPage] = useState(1);

  const handleFiltersChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className="min-h-screen bg-gray-50 font-korean">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterSection 
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        
        <StatsOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ReviewList 
              filters={filters}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
          
          <div className="space-y-8">
            <WordCloud />
            <UxInsights />
          </div>
        </div>
      </main>
    </div>
  );
}
