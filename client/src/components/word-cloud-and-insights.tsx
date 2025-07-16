import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cloud, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { ReviewFilters } from "@/types";

interface WordCloudAndInsightsProps {
  filters: ReviewFilters;
  activeSection?: string;
}

export default function WordCloudAndInsights({ filters, activeSection }: WordCloudAndInsightsProps) {
  const { data: positiveWords = [], isLoading: positiveLoading } = useQuery({
    queryKey: ["/api/wordcloud", "긍정", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters.source?.length) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/wordcloud/긍정?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch positive words");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  const { data: negativeWords = [], isLoading: negativeLoading } = useQuery({
    queryKey: ["/api/wordcloud", "부정", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters.source?.length) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/wordcloud/부정?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch negative words");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/insights", filters.service?.id, filters.source, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.service?.id) {
        params.append("serviceId", filters.service.id);
      }
      if (filters.source?.length) {
        filters.source.forEach(source => params.append("source", source));
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      const response = await fetch(`/api/insights?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      return response.json();
    },
    enabled: !!filters?.service?.id,
  });

  const renderWordCloud = (words: any[], title: string, colorClass: string) => {
    const maxFrequency = Math.max(...words.map(w => w.frequency));
    
    return (
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Cloud className="w-5 h-5 mr-2" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 min-h-[100px]">
            {words.slice(0, 10).map((word, index) => {
              const fontSize = Math.max(12, Math.min(24, (word.frequency / maxFrequency) * 20 + 12));
              return (
                <span
                  key={index}
                  className={`inline-block px-3 py-1 rounded-full text-white font-medium ${colorClass} transition-all duration-300 hover:scale-110`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {word.word} ({word.frequency})
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'major':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'minor':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'major':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isLoading = positiveLoading || negativeLoading || insightsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Word Cloud Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Cloud className="w-6 h-6 mr-2 text-blue-600" />
          감정 워드클라우드
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderWordCloud(positiveWords, "긍정 키워드", "bg-green-500")}
          {renderWordCloud(negativeWords, "부정 키워드", "bg-red-500")}
        </div>
      </div>

      {/* UX Insights Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-purple-600" />
          HEART 프레임워크 분석
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {insights.map((insight, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    {getPriorityIcon(insight.priority)}
                    <span className="ml-2">{insight.title}</span>
                  </CardTitle>
                  <Badge className={`${getPriorityColor(insight.priority)} border`}>
                    {insight.priority.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">문제 요약</h4>
                  <p className="text-gray-700 leading-relaxed">{insight.problem_summary}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">UX 개선 제안</h4>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {insight.ux_suggestions}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                  <span>언급 횟수: {insight.mention_count}건</span>
                  <span>•</span>
                  <span>트렌드: {insight.trend}</span>
                  <span>•</span>
                  <span>카테고리: {insight.category}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}