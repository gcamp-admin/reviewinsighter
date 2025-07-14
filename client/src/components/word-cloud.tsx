import { ThumbsUp, ThumbsDown, Cloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { WordCloudData, ReviewFilters } from "@/types";
import { useEffect, useRef } from "react";
import { KeywordNetwork } from "./keyword-network";

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
    const svgHeight = 500;
    const centerY = svgHeight / 2;
    
    return words.slice(0, 10).map((word, index) => {
      const size = getBubbleSize(word.frequency, maxFreq);
      
      // Better horizontal positioning with spacing
      const x = 100 + (index * 1.5) * (svgWidth - 200) / Math.max(words.length - 1, 1);
      
      // Position based on sentiment (similar to Plotly example)
      let y;
      if (sentiment === "positive") {
        // Above center line, higher frequency words go higher
        y = centerY - 80 - (word.frequency / maxFreq) * 80;
      } else if (sentiment === "negative") {
        // Below center line, higher frequency words go lower
        y = centerY + 80 + (word.frequency / maxFreq) * 80;
      } else {
        // Neutral - near center line with slight variation
        y = centerY + (word.frequency / maxFreq) * 20 - 10;
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
    const svgHeight = 500;
    const centerY = svgHeight / 2;

    return (
      <div className="w-full overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="border border-gray-200 rounded-lg" style={{ backgroundColor: '#2C3E50' }}>
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="positiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#4ECDC4', stopOpacity: 0.9 }} />
              <stop offset="100%" style={{ stopColor: '#44A08D', stopOpacity: 0.9 }} />
            </linearGradient>
            <linearGradient id="negativeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#FF6B6B', stopOpacity: 0.9 }} />
              <stop offset="100%" style={{ stopColor: '#EE5A6F', stopOpacity: 0.9 }} />
            </linearGradient>
            <linearGradient id="neutralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#95A5A6', stopOpacity: 0.9 }} />
              <stop offset="100%" style={{ stopColor: '#7F8C8D', stopOpacity: 0.9 }} />
            </linearGradient>
          </defs>
          
          {/* Title */}
          <text x={svgWidth / 2} y={30} textAnchor="middle" className="fill-white text-xl font-bold" style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}>
            감정 기반 키워드 버블 차트
          </text>
          
          {/* Center dividing line */}
          <line
            x1={50}
            y1={centerY}
            x2={svgWidth - 50}
            y2={centerY}
            stroke="rgba(52, 152, 219, 0.7)"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
          
          {/* Positive label */}
          <text x={60} y={centerY - 100} className="fill-white text-sm font-medium" style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}>
            긍정 키워드
          </text>
          
          {/* Neutral label */}
          <text x={60} y={centerY - 10} className="fill-white text-sm font-medium" style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}>
            중립 키워드
          </text>
          
          {/* Negative label */}
          <text x={60} y={centerY + 120} className="fill-white text-sm font-medium" style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}>
            부정 키워드
          </text>
          
          {/* Positive bubbles */}
          {positiveBubbles.map((bubble, index) => (
            <g key={`positive-${bubble.id}`}>
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={Math.max(bubble.width, bubble.height) / 2}
                fill="url(#positiveGradient)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                className="hover:stroke-white transition-all cursor-pointer"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              <text
                x={bubble.x}
                y={bubble.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={bubble.fontSize}
                className="fill-white font-medium pointer-events-none"
                style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}
              >
                {bubble.word}
              </text>
              <text
                x={bubble.x}
                y={bubble.y + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                className="fill-white pointer-events-none"
                style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}
              >
                {bubble.frequency}회
              </text>
            </g>
          ))}
          
          {/* Neutral bubbles */}
          {neutralBubbles.map((bubble, index) => (
            <g key={`neutral-${bubble.id}`}>
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={Math.max(bubble.width, bubble.height) / 2}
                fill="url(#neutralGradient)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                className="hover:stroke-white transition-all cursor-pointer"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              <text
                x={bubble.x}
                y={bubble.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={bubble.fontSize}
                className="fill-white font-medium pointer-events-none"
                style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}
              >
                {bubble.word}
              </text>
              <text
                x={bubble.x}
                y={bubble.y + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                className="fill-white pointer-events-none"
                style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}
              >
                {bubble.frequency}회
              </text>
            </g>
          ))}
          
          {/* Negative bubbles */}
          {negativeBubbles.map((bubble, index) => (
            <g key={`negative-${bubble.id}`}>
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={Math.max(bubble.width, bubble.height) / 2}
                fill="url(#negativeGradient)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                className="hover:stroke-white transition-all cursor-pointer"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              <text
                x={bubble.x}
                y={bubble.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={bubble.fontSize}
                className="fill-white font-medium pointer-events-none"
                style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}
              >
                {bubble.word}
              </text>
              <text
                x={bubble.x}
                y={bubble.y + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                className="fill-white pointer-events-none"
                style={{ fontFamily: 'Arial, Malgun Gothic, sans-serif' }}
              >
                {bubble.frequency}회
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
    <div className="space-y-6">
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
      
      {/* 키워드 네트워크 섹션 */}
      {!positiveLoading && !negativeLoading && !neutralLoading && hasData && (
        <KeywordNetwork 
          positiveWords={positiveWords || []}
          negativeWords={negativeWords || []}
          neutralWords={neutralWords || []}
          filters={filters}
        />
      )}
    </div>
  );
}
