import { ThumbsUp, ThumbsDown, Cloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { WordCloudData, ReviewFilters } from "@/types";
import { useEffect, useRef } from "react";

interface WordCloudProps {
  filters: ReviewFilters;
}

export default function WordCloud({ filters }: WordCloudProps) {
  const { data: positiveWords, isLoading: positiveLoading, error: positiveError } = useQuery<WordCloudData[]>({
    queryKey: ["/api/wordcloud/긍정", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
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

      const url = `/api/wordcloud/긍정?${params}`;
      console.log("Fetching positive word cloud from:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch positive word cloud");
      }
      const data = await response.json();
      console.log("Positive word cloud data received:", data);
      return data;
    },
    enabled: true,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache results
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: negativeWords, isLoading: negativeLoading, error: negativeError } = useQuery<WordCloudData[]>({
    queryKey: ["/api/wordcloud/부정", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
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

      const url = `/api/wordcloud/부정?${params}`;
      console.log("Fetching negative word cloud from:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch negative word cloud");
      }
      const data = await response.json();
      console.log("Negative word cloud data received:", data);
      return data;
    },
    enabled: true,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache results
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: neutralWords, isLoading: neutralLoading, error: neutralError } = useQuery<WordCloudData[]>({
    queryKey: ["/api/wordcloud/중립", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
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

      const url = `/api/wordcloud/중립?${params}`;
      console.log("Fetching neutral word cloud from:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch neutral word cloud");
      }
      const data = await response.json();
      console.log("Neutral word cloud data received:", data);
      return data;
    },
    enabled: true,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache results
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const getBubbleSize = (frequency: number, maxFreq: number) => {
    const ratio = frequency / maxFreq;
    if (ratio > 0.8) return { width: 120, height: 60, fontSize: 18 };
    if (ratio > 0.6) return { width: 100, height: 50, fontSize: 16 };
    if (ratio > 0.4) return { width: 80, height: 40, fontSize: 14 };
    return { width: 60, height: 30, fontSize: 12 };
  };

  const generateBubblePositions = (words: WordCloudData[], sentiment: "positive" | "negative" | "neutral") => {
    if (!words || words.length === 0) return [];
    
    const maxFreq = Math.max(...words.map(w => w.frequency));
    const svgWidth = 800;
    const svgHeight = 400;
    const centerY = svgHeight / 2;
    
    return words.slice(0, 10).map((word, index) => {
      const size = getBubbleSize(word.frequency, maxFreq);
      
      // Random horizontal position with some spacing
      const x = Math.random() * (svgWidth - size.width) + size.width / 2;
      
      // Position based on sentiment
      let y;
      if (sentiment === "positive") {
        // Above center line (top half)
        y = Math.random() * (centerY - size.height - 20) + size.height / 2 + 20;
      } else if (sentiment === "negative") {
        // Below center line (bottom half)
        y = Math.random() * (centerY - size.height - 20) + centerY + 20 + size.height / 2;
      } else {
        // Neutral - on the center line
        y = centerY + (Math.random() - 0.5) * 20; // Small variation around center line
      }
      
      return {
        ...word,
        x,
        y,
        ...size
      };
    });
  };

  const renderBubbleChart = (positiveWords: WordCloudData[], negativeWords: WordCloudData[], neutralWords: WordCloudData[]) => {
    if ((!positiveWords || positiveWords.length === 0) && (!negativeWords || negativeWords.length === 0) && (!neutralWords || neutralWords.length === 0)) {
      return (
        <div className="text-center text-gray-500 py-8">
          키워드 데이터가 없습니다.
        </div>
      );
    }

    const positiveBubbles = generateBubblePositions(positiveWords || [], "positive");
    const negativeBubbles = generateBubblePositions(negativeWords || [], "negative");
    const neutralBubbles = generateBubblePositions(neutralWords || [], "neutral");
    
    const svgWidth = 800;
    const svgHeight = 400;
    const centerY = svgHeight / 2;

    return (
      <div className="w-full overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="border border-gray-200 rounded-lg bg-gray-50">
          {/* Center dividing line */}
          <line
            x1={0}
            y1={centerY}
            x2={svgWidth}
            y2={centerY}
            stroke="#6B7280"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* Positive label */}
          <text x={20} y={30} className="text-sm font-medium fill-green-600">
            긍정 키워드
          </text>
          
          {/* Neutral label */}
          <text x={20} y={centerY - 5} className="text-sm font-medium fill-gray-600">
            중립 키워드
          </text>
          
          {/* Negative label */}
          <text x={20} y={svgHeight - 10} className="text-sm font-medium fill-red-600">
            부정 키워드
          </text>
          
          {/* Positive bubbles */}
          {positiveBubbles.map((bubble, index) => (
            <g key={`positive-${bubble.id}`}>
              <ellipse
                cx={bubble.x}
                cy={bubble.y}
                rx={bubble.width / 2}
                ry={bubble.height / 2}
                fill="#10B981"
                fillOpacity="0.2"
                stroke="#10B981"
                strokeWidth="2"
                className="hover:fill-opacity-30 transition-all cursor-pointer"
              />
              <text
                x={bubble.x}
                y={bubble.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={bubble.fontSize}
                className="fill-green-700 font-medium pointer-events-none"
              >
                {bubble.word}
              </text>
            </g>
          ))}
          
          {/* Neutral bubbles */}
          {neutralBubbles.map((bubble, index) => (
            <g key={`neutral-${bubble.id}`}>
              <ellipse
                cx={bubble.x}
                cy={bubble.y}
                rx={bubble.width / 2}
                ry={bubble.height / 2}
                fill="#6B7280"
                fillOpacity="0.2"
                stroke="#6B7280"
                strokeWidth="2"
                className="hover:fill-opacity-30 transition-all cursor-pointer"
              />
              <text
                x={bubble.x}
                y={bubble.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={bubble.fontSize}
                className="fill-gray-700 font-medium pointer-events-none"
              >
                {bubble.word}
              </text>
            </g>
          ))}
          
          {/* Negative bubbles */}
          {negativeBubbles.map((bubble, index) => (
            <g key={`negative-${bubble.id}`}>
              <ellipse
                cx={bubble.x}
                cy={bubble.y}
                rx={bubble.width / 2}
                ry={bubble.height / 2}
                fill="#EF4444"
                fillOpacity="0.2"
                stroke="#EF4444"
                strokeWidth="2"
                className="hover:fill-opacity-30 transition-all cursor-pointer"
              />
              <text
                x={bubble.x}
                y={bubble.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={bubble.fontSize}
                className="fill-red-700 font-medium pointer-events-none"
              >
                {bubble.word}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Always show component - let individual sections handle empty states
  const hasData = (positiveWords && positiveWords.length > 0) || (negativeWords && negativeWords.length > 0) || (neutralWords && neutralWords.length > 0);
  
  console.log("WordCloud render decision:", {
    hasData,
    positiveCount: positiveWords?.length || 0,
    negativeCount: negativeWords?.length || 0,
    neutralCount: neutralWords?.length || 0,
    positiveLoading,
    negativeLoading,
    neutralLoading,
    filters
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>키워드 버블차트</CardTitle>
        <CardDescription>
          긍정 키워드({positiveWords?.length || 0}개) • 부정 키워드({negativeWords?.length || 0}개) • 중립 키워드({neutralWords?.length || 0}개)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {positiveLoading || negativeLoading || neutralLoading ? (
          <div className="bg-gray-50 p-8 rounded-lg min-h-[400px] flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg text-blue-600 font-semibold mb-2">키워드 분석 중...</p>
            <p className="text-sm text-gray-600">리뷰에서 핵심 키워드를 추출하고 있습니다</p>
          </div>
        ) : (
          renderBubbleChart(positiveWords || [], negativeWords || [], neutralWords || [])
        )}
      </CardContent>
    </Card>
  );
}
