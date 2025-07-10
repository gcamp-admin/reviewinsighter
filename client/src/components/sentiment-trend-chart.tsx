import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import type { ReviewFilters } from "@/types";

interface SentimentTrendChartProps {
  filters: ReviewFilters;
}

interface TrendData {
  date: string;
  positive: number;
  negative: number;
  total: number;
  averageRating: number;
}

export default function SentimentTrendChart({ filters }: SentimentTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Generate mock time series data for demonstration
  const generateTrendData = (): TrendData[] => {
    const data: TrendData[] = [];
    const days = 30;
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate realistic review patterns
      const basePositive = Math.floor(Math.random() * 15) + 5;
      const baseNegative = Math.floor(Math.random() * 8) + 2;
      
      // Add some weekly patterns (more reviews on weekdays)
      const dayOfWeek = date.getDay();
      const weekdayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.2;
      
      const positive = Math.floor(basePositive * weekdayMultiplier);
      const negative = Math.floor(baseNegative * weekdayMultiplier);
      const total = positive + negative;
      const averageRating = total > 0 ? (positive * 4.2 + negative * 2.1) / total : 3.5;
      
      data.push({
        date: date.toISOString().split('T')[0],
        positive,
        negative,
        total,
        averageRating: Math.round(averageRating * 10) / 10
      });
    }
    
    return data;
  };

  const { data: trendData = generateTrendData() } = useQuery<TrendData[]>({
    queryKey: ["/api/sentiment-trend", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
    queryFn: async () => {
      // For now, return simulated data
      // In production, this would fetch actual time series data
      return generateTrendData();
    },
    enabled: !!filters?.service?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!trendData || trendData.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 80, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse dates
    const parseDate = d3.timeParse("%Y-%m-%d");
    const data = trendData.map(d => ({
      ...d,
      date: parseDate(d.date)!
    }));

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.positive + d.negative) as number])
      .range([height, 0]);

    const ratingScale = d3.scaleLinear()
      .domain([0, 5])
      .range([height, 0]);

    // Line generators
    const positiveLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.positive))
      .curve(d3.curveCardinal);

    const negativeLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.negative))
      .curve(d3.curveCardinal);

    const ratingLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => ratingScale(d.averageRating))
      .curve(d3.curveCardinal);

    // Area generators for filled areas
    const positiveArea = d3.area<any>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.positive))
      .curve(d3.curveCardinal);

    const negativeArea = d3.area<any>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.negative))
      .curve(d3.curveCardinal);

    // Draw areas
    g.append("path")
      .datum(data)
      .attr("fill", "rgba(34, 197, 94, 0.2)")
      .attr("d", positiveArea);

    g.append("path")
      .datum(data)
      .attr("fill", "rgba(239, 68, 68, 0.2)")
      .attr("d", negativeArea);

    // Draw lines
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 3)
      .attr("d", positiveLine);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3)
      .attr("d", negativeLine);

    // Draw rating line (dashed)
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#f59e0b")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("d", ratingLine);

    // Add dots for data points
    g.selectAll(".positive-dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "positive-dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.positive))
      .attr("r", 4)
      .attr("fill", "#22c55e")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
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
          .html(`
            <strong>${d.date.toLocaleDateString('ko-KR')}</strong><br/>
            긍정: ${d.positive}개<br/>
            부정: ${d.negative}개<br/>
            평균 평점: ${d.averageRating}
          `);
        
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.selectAll(".tooltip").remove();
      });

    g.selectAll(".negative-dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "negative-dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.negative))
      .attr("r", 4)
      .attr("fill", "#ef4444")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
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
          .html(`
            <strong>${d.date.toLocaleDateString('ko-KR')}</strong><br/>
            긍정: ${d.positive}개<br/>
            부정: ${d.negative}개<br/>
            평균 평점: ${d.averageRating}
          `);
        
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.selectAll(".tooltip").remove();
      });

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%m/%d"))
        .ticks(d3.timeWeek.every(1)));

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale));

    // Right Y axis for rating
    g.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(ratingScale));

    // Axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text("리뷰 수");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", width + margin.right - 20)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text("평균 평점");

    // Legend
    const legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data([
        { label: "긍정 리뷰", color: "#22c55e" },
        { label: "부정 리뷰", color: "#ef4444" },
        { label: "평균 평점", color: "#f59e0b" }
      ])
      .enter().append("g")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", d => d.color);

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text(d => d.label);

  }, [trendData]);

  if (!filters?.service?.id) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          감정 트렌드 분석
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          최근 30일간 긍정/부정 리뷰 수와 평균 평점 변화를 보여줍니다
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">긍정 트렌드</span>
            </div>
            <p className="text-2xl font-bold text-green-800 mt-2">
              {trendData.reduce((sum, d) => sum + d.positive, 0)}
            </p>
            <p className="text-xs text-green-600">총 긍정 리뷰</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">부정 트렌드</span>
            </div>
            <p className="text-2xl font-bold text-red-800 mt-2">
              {trendData.reduce((sum, d) => sum + d.negative, 0)}
            </p>
            <p className="text-xs text-red-600">총 부정 리뷰</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">평균 평점</span>
            </div>
            <p className="text-2xl font-bold text-yellow-800 mt-2">
              {(trendData.reduce((sum, d) => sum + d.averageRating, 0) / trendData.length).toFixed(1)}
            </p>
            <p className="text-xs text-yellow-600">30일 평균</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <svg ref={svgRef} className="w-full h-full max-w-full"></svg>
        </div>
      </CardContent>
    </Card>
  );
}