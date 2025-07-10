import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Heart, Target, Users, UserPlus, RotateCcw } from "lucide-react";
import type { ReviewFilters, Insight } from "@/types";

interface HeartRadarChartProps {
  filters: ReviewFilters;
}

interface HeartScore {
  category: string;
  score: number;
  label: string;
  icon: string;
  color: string;
}

export default function HeartRadarChart({ filters }: HeartRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: insights } = useQuery<Insight[]>({
    queryKey: ["/api/insights", filters?.service?.id, filters?.source, filters?.dateFrom, filters?.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.service?.id) params.append("serviceId", filters.service.id);
      if (filters?.source?.length) filters.source.forEach(s => params.append("source", s));
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      
      const response = await fetch(`/api/insights?${params}`);
      if (!response.ok) throw new Error("Failed to fetch insights");
      return response.json();
    },
    enabled: !!filters?.service?.id,
    staleTime: 0,
  });

  // Calculate HEART scores based on insights
  const calculateHeartScores = (insights: Insight[]): HeartScore[] => {
    const categoryMapping: { [key: string]: string } = {
      'happiness': 'Happiness',
      'engagement': 'Engagement', 
      'adoption': 'Adoption',
      'retention': 'Retention',
      'task_success': 'Task Success'
    };

    const heartCategories = ['happiness', 'engagement', 'adoption', 'retention', 'task_success'];
    
    return heartCategories.map(category => {
      const categoryInsights = insights.filter(insight => insight.category === category);
      let score = 70; // Base score
      
      // Adjust score based on insights
      categoryInsights.forEach(insight => {
        const impact = insight.priority === 'critical' ? -30 : 
                      insight.priority === 'major' ? -20 : -10;
        const mentionWeight = Math.min(insight.mentionCount / 10, 2);
        score += impact * mentionWeight;
      });
      
      // Normalize score between 0-100
      score = Math.max(0, Math.min(100, score));
      
      return {
        category,
        score,
        label: categoryMapping[category] || category,
        icon: category === 'happiness' ? '😊' : 
              category === 'engagement' ? '🎯' : 
              category === 'adoption' ? '👥' : 
              category === 'retention' ? '🔄' : '✅',
        color: category === 'happiness' ? '#22c55e' : 
               category === 'engagement' ? '#3b82f6' : 
               category === 'adoption' ? '#f59e0b' : 
               category === 'retention' ? '#8b5cf6' : '#ef4444'
      };
    });
  };

  const heartScores = insights ? calculateHeartScores(insights) : [];

  useEffect(() => {
    if (!heartScores.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 80;
    const centerX = width / 2;
    const centerY = height / 2;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${centerX},${centerY})`);

    // Create scales
    const angleScale = d3.scaleLinear()
      .domain([0, heartScores.length])
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Draw concentric circles (grid)
    const levels = [20, 40, 60, 80, 100];
    levels.forEach((level, i) => {
      g.append("circle")
        .attr("r", radiusScale(level))
        .attr("fill", "none")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", i === levels.length - 1 ? "none" : "3,3");
      
      // Add level labels
      g.append("text")
        .attr("x", 5)
        .attr("y", -radiusScale(level))
        .attr("font-size", "10px")
        .attr("fill", "#6b7280")
        .text(level);
    });

    // Draw axis lines
    heartScores.forEach((score, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1);
    });

    // Create the radar polygon
    const radarLine = d3.lineRadial<HeartScore>()
      .angle((d, i) => angleScale(i))
      .radius(d => radiusScale(d.score))
      .curve(d3.curveLinearClosed);

    // Draw the filled area
    g.append("path")
      .datum(heartScores)
      .attr("fill", "rgba(59, 130, 246, 0.2)")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", radarLine);

    // Draw data points
    heartScores.forEach((score, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      const x = Math.cos(angle) * radiusScale(score.score);
      const y = Math.sin(angle) * radiusScale(score.score);
      
      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 6)
        .attr("fill", score.color)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", function(event) {
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
              <strong>${score.label}</strong><br/>
              점수: ${score.score}/100<br/>
              상태: ${score.score >= 80 ? '우수' : score.score >= 60 ? '양호' : score.score >= 40 ? '보통' : '개선 필요'}
            `);
          
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.selectAll(".tooltip").remove();
        });
    });

    // Draw labels
    heartScores.forEach((score, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      const labelRadius = radius + 30;
      const x = Math.cos(angle) * labelRadius;
      const y = Math.sin(angle) * labelRadius;
      
      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("fill", score.color)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(score.label);
      
      // Add icon
      g.append("text")
        .attr("x", x)
        .attr("y", y - 20)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(score.icon);
    });

    // Add center point
    g.append("circle")
      .attr("r", 3)
      .attr("fill", "#6b7280");

  }, [heartScores]);

  if (!filters?.service?.id) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          HEART 지표 레이더 차트
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Google의 HEART 프레임워크 기반 5개 지표를 레이더 차트로 시각화한 전체 UX 성과 개요입니다
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
              <svg ref={svgRef} className="w-full h-full max-w-[400px] max-h-[400px]"></svg>
            </div>
          </div>
          
          {/* Scores Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">지표별 점수</h4>
            {heartScores.map((score) => (
              <div key={score.category} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{score.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{score.label}</p>
                    <p className="text-xs text-gray-500">
                      {score.category === 'happiness' ? '사용자 만족도' :
                       score.category === 'engagement' ? '사용자 참여도' :
                       score.category === 'adoption' ? '신규 사용자 적응' :
                       score.category === 'retention' ? '사용자 유지율' : '핵심 기능 수행'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: score.color }}>
                    {score.score}
                  </p>
                  <Badge 
                    variant={score.score >= 80 ? "default" : score.score >= 60 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {score.score >= 80 ? '우수' : score.score >= 60 ? '양호' : score.score >= 40 ? '보통' : '개선 필요'}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">📊 전체 HEART 점수</h5>
              <div className="text-2xl font-bold text-blue-800">
                {heartScores.length ? Math.round(heartScores.reduce((sum, score) => sum + score.score, 0) / heartScores.length) : 0}/100
              </div>
              <p className="text-sm text-blue-700 mt-1">
                5개 지표 평균 점수
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}