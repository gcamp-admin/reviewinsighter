import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WordCloudData, ReviewFilters } from "@/types";

interface EnhancedWordCloudProps {
  filters: ReviewFilters;
  onWordClick?: (word: string) => void;
}

interface D3WordCloudWord {
  text: string;
  size: number;
  frequency: number;
  sentiment: string;
  x?: number;
  y?: number;
  rotate?: number;
}

export default function EnhancedWordCloud({ filters, onWordClick }: EnhancedWordCloudProps) {
  const positiveRef = useRef<SVGSVGElement>(null);
  const negativeRef = useRef<SVGSVGElement>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Positive words query
  const { data: positiveWords, isLoading: positiveLoading, refetch: refetchPositive } = useQuery<WordCloudData[]>({
    queryKey: ["/api/wordcloud/positive", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.service?.id) params.append("serviceId", filters.service.id);
      if (filters?.source?.length) filters.source.forEach(s => params.append("source", s));
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      
      const response = await fetch(`/api/wordcloud/positive?${params}`);
      if (!response.ok) throw new Error("Failed to fetch positive words");
      return response.json();
    },
    enabled: !!filters?.service?.id,
    staleTime: 0,
    cacheTime: 0,
  });

  // Negative words query
  const { data: negativeWords, isLoading: negativeLoading, refetch: refetchNegative } = useQuery<WordCloudData[]>({
    queryKey: ["/api/wordcloud/negative", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.service?.id) params.append("serviceId", filters.service.id);
      if (filters?.source?.length) filters.source.forEach(s => params.append("source", s));
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      
      const response = await fetch(`/api/wordcloud/negative?${params}`);
      if (!response.ok) throw new Error("Failed to fetch negative words");
      return response.json();
    },
    enabled: !!filters?.service?.id,
    staleTime: 0,
    cacheTime: 0,
  });

  const createWordCloud = (words: WordCloudData[], svgRef: React.RefObject<SVGSVGElement>, sentiment: "positive" | "negative") => {
    if (!words || words.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 300;
    const maxFreq = Math.max(...words.map(w => w.frequency));
    
    // Color scales
    const colorScale = sentiment === "positive" 
      ? d3.scaleLinear<string>()
          .domain([1, maxFreq])
          .range(["#86efac", "#15803d"]) // light green to dark green
      : d3.scaleLinear<string>()
          .domain([1, maxFreq])
          .range(["#fca5a5", "#dc2626"]); // light red to dark red

    // Prepare words for d3-cloud
    const cloudWords: D3WordCloudWord[] = words.slice(0, 15).map(word => ({
      text: word.word,
      size: Math.max(12, Math.min(32, (word.frequency / maxFreq) * 24 + 8)),
      frequency: word.frequency,
      sentiment: word.sentiment
    }));

    // Create word cloud layout
    const layout = cloud()
      .size([width, height])
      .words(cloudWords)
      .padding(5)
      .rotate(() => (Math.random() - 0.5) * 60)
      .font("Inter, sans-serif")
      .fontSize(d => d.size)
      .on("end", draw);

    layout.start();

    function draw(words: D3WordCloudWord[]) {
      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

      const wordElements = g.selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", d => `${d.size}px`)
        .style("font-family", "Inter, sans-serif")
        .style("font-weight", d => d.frequency > maxFreq * 0.7 ? "700" : d.frequency > maxFreq * 0.4 ? "600" : "400")
        .style("fill", d => colorScale(d.frequency))
        .style("cursor", "pointer")
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 0.8)
            .style("font-weight", "700");
          
          // Show tooltip
          const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .text(`${d.text}: ${d.frequency}회 언급`);
          
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("font-weight", d => d.frequency > maxFreq * 0.7 ? "700" : d.frequency > maxFreq * 0.4 ? "600" : "400");
          
          d3.selectAll(".tooltip").remove();
        })
        .on("click", function(event, d) {
          setSelectedWord(d.text);
          onWordClick?.(d.text);
          
          // Highlight selected word
          g.selectAll("text")
            .style("opacity", 0.3);
          d3.select(this)
            .style("opacity", 1)
            .style("font-weight", "700");
        });

      // Add animation
      wordElements
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .style("opacity", 1);
    }
  };

  useEffect(() => {
    if (positiveWords && positiveWords.length > 0) {
      createWordCloud(positiveWords, positiveRef, "positive");
    }
  }, [positiveWords]);

  useEffect(() => {
    if (negativeWords && negativeWords.length > 0) {
      createWordCloud(negativeWords, negativeRef, "negative");
    }
  }, [negativeWords]);

  const handleRefresh = () => {
    refetchPositive();
    refetchNegative();
    setSelectedWord(null);
  };

  if (!filters?.service?.id) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">☁️</span>
            고급 감정 워드클라우드
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          단어 크기는 언급 빈도를 나타내며, 클릭하면 해당 키워드로 필터링됩니다
        </p>
        {selectedWord && (
          <div className="bg-blue-50 p-2 rounded-md">
            <p className="text-sm text-blue-800">
              선택된 키워드: <strong>{selectedWord}</strong>
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Positive Word Cloud */}
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-4 flex items-center">
              <ThumbsUp className="w-4 h-4 mr-2" />
              긍정 키워드 ({positiveWords?.length || 0}개)
            </h4>
            <div className="bg-green-50 p-4 rounded-lg min-h-[300px] flex items-center justify-center">
              {positiveLoading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mb-4"></div>
                  <p className="text-sm text-green-600">긍정 키워드 분석 중...</p>
                </div>
              ) : positiveWords && positiveWords.length > 0 ? (
                <svg ref={positiveRef} className="w-full h-full max-w-[400px] max-h-[300px]"></svg>
              ) : (
                <p className="text-sm text-muted-foreground">긍정 키워드가 없습니다</p>
              )}
            </div>
          </div>

          {/* Negative Word Cloud */}
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-4 flex items-center">
              <ThumbsDown className="w-4 h-4 mr-2" />
              부정 키워드 ({negativeWords?.length || 0}개)
            </h4>
            <div className="bg-red-50 p-4 rounded-lg min-h-[300px] flex items-center justify-center">
              {negativeLoading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600 mb-4"></div>
                  <p className="text-sm text-red-600">부정 키워드 분석 중...</p>
                </div>
              ) : negativeWords && negativeWords.length > 0 ? (
                <svg ref={negativeRef} className="w-full h-full max-w-[400px] max-h-[300px]"></svg>
              ) : (
                <p className="text-sm text-muted-foreground">부정 키워드가 없습니다</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}