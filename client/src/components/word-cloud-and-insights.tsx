import WordCloud from "@/components/word-cloud";
import UxInsights from "@/components/ux-insights";
import type { ReviewFilters } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface WordCloudAndInsightsProps {
  filters: ReviewFilters;
  activeSection: 'wordcloud' | 'heart';
  showBoth?: boolean;
}

export default function WordCloudAndInsights({ filters, activeSection, showBoth = false }: WordCloudAndInsightsProps) {
  // Check if there's any analysis data to show
  const { data: positiveWords } = useQuery({
    queryKey: ["/api/wordcloud/긍정", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters?.source && filters.source.length > 0) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters?.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/wordcloud/긍정?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch positive word cloud");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id, // Only fetch when service is selected
  });

  const { data: negativeWords } = useQuery({
    queryKey: ["/api/wordcloud/부정", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters?.source && filters.source.length > 0) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters?.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/wordcloud/부정?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch negative word cloud");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id, // Only fetch when service is selected
  });

  const { data: insights } = useQuery({
    queryKey: ["/api/insights", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters?.source && filters.source.length > 0) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters?.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/insights?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id, // Only fetch when service is selected
  });

  // Don't show anything if no service is selected
  if (!filters?.service?.id) {
    return null;
  }

  // Only show the grid if there's any analysis data
  const hasWordCloudData = (positiveWords && positiveWords.length > 0) || (negativeWords && negativeWords.length > 0);
  const hasInsightsData = insights && insights.length > 0;

  // Show content based on active section
  if (showBoth) {
    // 종합 분석 결과: 워드클라우드 먼저, 그 다음 HEART 분석
    return (
      <div className="grid grid-cols-1 gap-8">
        {hasWordCloudData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <WordCloud filters={filters} />
          </div>
        )}
        {hasInsightsData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <UxInsights filters={filters} />
          </div>
        )}
      </div>
    );
  }

  if (activeSection === 'wordcloud') {
    if (!hasWordCloudData) {
      return null;
    }
    return (
      <div className="grid grid-cols-1 gap-8">
        <WordCloud filters={filters} />
      </div>
    );
  } else if (activeSection === 'heart') {
    if (!hasInsightsData) {
      return null;
    }
    return (
      <div className="grid grid-cols-1 gap-8">
        <UxInsights filters={filters} />
      </div>
    );
  }

  return null;
}