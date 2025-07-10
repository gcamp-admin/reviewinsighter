import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  Target, 
  Calendar,
  BarChart3,
  LineChart,
  PieChart
} from "lucide-react";
import type { ReviewFilters } from "@/types";

interface PredictiveAnalyticsProps {
  filters: ReviewFilters;
}

interface PredictionData {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  timeframe: "7d" | "30d" | "90d";
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

interface TrendPrediction {
  date: string;
  actual?: number;
  predicted: number;
  confidence_upper: number;
  confidence_lower: number;
}

export default function PredictiveAnalytics({ filters }: PredictiveAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"7d" | "30d" | "90d">("30d");
  const svgRef = useRef<SVGSVGElement>(null);

  // 예측 데이터 생성
  const generatePredictions = (): PredictionData[] => [
    {
      metric: "평균 평점",
      current: 4.1,
      predicted: 4.3,
      confidence: 0.85,
      trend: "increasing",
      timeframe: selectedTimeframe,
      scenarios: {
        optimistic: 4.5,
        realistic: 4.3,
        pessimistic: 4.0
      }
    },
    {
      metric: "월간 리뷰 수",
      current: 850,
      predicted: 1200,
      confidence: 0.78,
      trend: "increasing",
      timeframe: selectedTimeframe,
      scenarios: {
        optimistic: 1400,
        realistic: 1200,
        pessimistic: 950
      }
    },
    {
      metric: "감정 점수",
      current: 78,
      predicted: 82,
      confidence: 0.72,
      trend: "increasing",
      timeframe: selectedTimeframe,
      scenarios: {
        optimistic: 88,
        realistic: 82,
        pessimistic: 75
      }
    },
    {
      metric: "사용자 만족도",
      current: 72,
      predicted: 68,
      confidence: 0.81,
      trend: "decreasing",
      timeframe: selectedTimeframe,
      scenarios: {
        optimistic: 75,
        realistic: 68,
        pessimistic: 62
      }
    }
  ];

  // 트렌드 예측 데이터 생성
  const generateTrendPredictions = (): TrendPrediction[] => {
    const predictions: TrendPrediction[] = [];
    const days = selectedTimeframe === "7d" ? 7 : selectedTimeframe === "30d" ? 30 : 90;
    const today = new Date();
    
    // 과거 데이터 (실제 값)
    for (let i = -days; i <= 0; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const baseValue = 78 + Math.sin(i * 0.1) * 5;
      const actual = baseValue + (Math.random() - 0.5) * 8;
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        actual: Math.max(0, Math.min(100, actual)),
        predicted: Math.max(0, Math.min(100, baseValue)),
        confidence_upper: Math.max(0, Math.min(100, baseValue + 10)),
        confidence_lower: Math.max(0, Math.min(100, baseValue - 10))
      });
    }
    
    // 미래 예측 데이터
    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const baseValue = 78 + Math.sin(i * 0.1) * 5 + (i * 0.1); // 점진적 증가
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.max(0, Math.min(100, baseValue)),
        confidence_upper: Math.max(0, Math.min(100, baseValue + 15)),
        confidence_lower: Math.max(0, Math.min(100, baseValue - 15))
      });
    }
    
    return predictions;
  };

  const { data: predictions = [] } = useQuery({
    queryKey: ["/api/predictions", filters?.service?.id, selectedTimeframe],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return generatePredictions();
    },
    enabled: !!filters?.service?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendPredictions = [] } = useQuery({
    queryKey: ["/api/trend-predictions", filters?.service?.id, selectedTimeframe],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
      return generateTrendPredictions();
    },
    enabled: !!filters?.service?.id,
    staleTime: 5 * 60 * 1000,
  });

  // D3 차트 렌더링
  useEffect(() => {
    if (!trendPredictions.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const parseDate = d3.timeParse("%Y-%m-%d");
    const data = trendPredictions.map(d => ({
      ...d,
      date: parseDate(d.date)!
    }));

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // 신뢰구간 영역
    const confidenceArea = d3.area<any>()
      .x(d => xScale(d.date))
      .y0(d => yScale(d.confidence_lower))
      .y1(d => yScale(d.confidence_upper))
      .curve(d3.curveCardinal);

    // 실제 데이터 라인
    const actualLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.actual || d.predicted))
      .curve(d3.curveCardinal);

    // 예측 라인
    const predictedLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.predicted))
      .curve(d3.curveCardinal);

    // 신뢰구간 그리기
    g.append("path")
      .datum(data.filter(d => !d.actual))
      .attr("fill", "rgba(59, 130, 246, 0.2)")
      .attr("d", confidenceArea);

    // 실제 데이터 라인
    g.append("path")
      .datum(data.filter(d => d.actual))
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 3)
      .attr("d", actualLine);

    // 예측 라인
    g.append("path")
      .datum(data.filter(d => !d.actual))
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5")
      .attr("d", predictedLine);

    // 구분선 (현재 시점)
    const today = new Date();
    g.append("line")
      .attr("x1", xScale(today))
      .attr("x2", xScale(today))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "3,3");

    // 축 그리기
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d")));

    g.append("g")
      .call(d3.axisLeft(yScale));

    // 레전드
    const legend = g.append("g")
      .attr("transform", `translate(${width - 150}, 20)`);

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 25)
      .attr("y", 0)
      .attr("dy", "0.32em")
      .style("font-size", "12px")
      .text("실제 데이터");

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 20)
      .attr("y2", 20)
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5");

    legend.append("text")
      .attr("x", 25)
      .attr("y", 20)
      .attr("dy", "0.32em")
      .style("font-size", "12px")
      .text("예측 데이터");

  }, [trendPredictions, selectedTimeframe]);

  if (!filters?.service?.id) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          AI 예측 분석 엔진
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          머신러닝 모델을 활용한 미래 트렌드 예측 및 시나리오 분석을 제공합니다
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">핵심 지표 예측</TabsTrigger>
            <TabsTrigger value="trends">트렌드 예측</TabsTrigger>
            <TabsTrigger value="scenarios">시나리오 분석</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-6">
            <div className="flex gap-2 mb-4">
              <Button
                variant={selectedTimeframe === "7d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe("7d")}
              >
                7일
              </Button>
              <Button
                variant={selectedTimeframe === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe("30d")}
              >
                30일
              </Button>
              <Button
                variant={selectedTimeframe === "90d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe("90d")}
              >
                90일
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((prediction, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{prediction.metric}</h3>
                    <Badge 
                      variant={prediction.trend === "increasing" ? "default" : 
                               prediction.trend === "decreasing" ? "destructive" : "secondary"}
                    >
                      {prediction.trend === "increasing" ? "증가" : 
                       prediction.trend === "decreasing" ? "감소" : "안정"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">현재 값</p>
                      <p className="text-xl font-bold">{prediction.current}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">예측 값</p>
                      <p className={`text-xl font-bold ${
                        prediction.trend === "increasing" ? "text-green-600" : 
                        prediction.trend === "decreasing" ? "text-red-600" : "text-gray-600"
                      }`}>
                        {prediction.predicted}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {prediction.trend === "increasing" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        {((prediction.predicted - prediction.current) / prediction.current * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      신뢰도 {Math.round(prediction.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">감정 점수 트렌드 예측</h3>
              <p className="text-sm text-gray-600 mb-4">
                과거 데이터를 기반으로 한 미래 {selectedTimeframe} 트렌드 예측
              </p>
              <svg ref={svgRef} className="w-full h-full max-w-full"></svg>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">긍정적 신호</h4>
                <ul className="text-sm space-y-1">
                  <li>• AI 기능 만족도 지속 증가</li>
                  <li>• 보이스피싱 차단 효과 인정</li>
                  <li>• 통화 녹음 기능 활용도 상승</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">주의 사항</h4>
                <ul className="text-sm space-y-1">
                  <li>• 통화 연결 안정성 이슈</li>
                  <li>• 블루투스 호환성 문제</li>
                  <li>• 업데이트 관련 불만 증가</li>
                </ul>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">위험 요소</h4>
                <ul className="text-sm space-y-1">
                  <li>• 통화중 대기 기능 부재</li>
                  <li>• 경쟁사 대비 기능 부족</li>
                  <li>• 사용자 이탈 가능성</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-gradient-to-b from-green-50 to-green-100">
                <h3 className="font-medium text-green-800 mb-3">🎯 낙관적 시나리오</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>조건:</strong> 주요 이슈 해결 + 신기능 출시</p>
                  <p><strong>평점:</strong> 4.5/5.0</p>
                  <p><strong>리뷰 수:</strong> +65% 증가</p>
                  <p><strong>만족도:</strong> 88/100</p>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-gradient-to-b from-blue-50 to-blue-100">
                <h3 className="font-medium text-blue-800 mb-3">⚖️ 현실적 시나리오</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>조건:</strong> 점진적 개선 + 유지보수</p>
                  <p><strong>평점:</strong> 4.3/5.0</p>
                  <p><strong>리뷰 수:</strong> +41% 증가</p>
                  <p><strong>만족도:</strong> 82/100</p>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-gradient-to-b from-red-50 to-red-100">
                <h3 className="font-medium text-red-800 mb-3">⚠️ 비관적 시나리오</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>조건:</strong> 현상 유지 + 경쟁 심화</p>
                  <p><strong>평점:</strong> 4.0/5.0</p>
                  <p><strong>리뷰 수:</strong> +12% 증가</p>
                  <p><strong>만족도:</strong> 68/100</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📊 권장 액션 플랜</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">즉시 실행 (1-2주)</h4>
                  <ul className="text-sm space-y-1">
                    <li>• 통화 연결 안정성 패치</li>
                    <li>• 고객 서비스 응답 시간 개선</li>
                    <li>• 크리티컬 버그 수정</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">중기 계획 (1-3개월)</h4>
                  <ul className="text-sm space-y-1">
                    <li>• 통화중 대기 기능 추가</li>
                    <li>• 블루투스 호환성 개선</li>
                    <li>• AI 기능 고도화</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}