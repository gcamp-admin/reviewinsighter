import WordCloud from "@/components/word-cloud";
import UxInsights from "@/components/ux-insights";
import type { ReviewFilters } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface WordCloudAndInsightsProps {
  filters: ReviewFilters;
}

export default function WordCloudAndInsights({ filters }: WordCloudAndInsightsProps) {
  // Check if there's any analysis data to show
  const { data: positiveWords } = useQuery({
    queryKey: ["/api/wordcloud/positive", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
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

      const response = await fetch(`/api/wordcloud/positive?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch positive word cloud");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id, // Only fetch when service is selected
  });

  const { data: negativeWords } = useQuery({
    queryKey: ["/api/wordcloud/negative", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
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

      const response = await fetch(`/api/wordcloud/negative?${params}`);
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

  if (!hasWordCloudData && !hasInsightsData) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <WordCloud filters={filters} />
      <UxInsights filters={filters} />
    </div>
  );
}