import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Eye,
  Clock,
  Bell
} from "lucide-react";
import type { ReviewFilters } from "@/types";

interface RealTimeSentimentMonitorProps {
  filters: ReviewFilters;
}

interface SentimentHealth {
  currentScore: number;
  trend: "up" | "down" | "stable";
  trendChange: number;
  criticalIssues: string[];
  recentKeywords: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  lastUpdate: string;
}

export default function RealTimeSentimentMonitor({ filters }: RealTimeSentimentMonitorProps) {
  const [alertCount, setAlertCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // Simulate real-time sentiment monitoring
  const generateSentimentHealth = (): SentimentHealth => {
    const baseScore = 75;
    const randomFluctuation = (Math.random() - 0.5) * 10;
    const currentScore = Math.max(0, Math.min(100, baseScore + randomFluctuation));
    
    const trendChange = (Math.random() - 0.5) * 5;
    const trend = trendChange > 1 ? "up" : trendChange < -1 ? "down" : "stable";
    
    const criticalIssues = currentScore < 60 ? [
      "통화 연결 실패 급증",
      "앱 크래시 신고 증가",
      "사용자 불만 키워드 감지"
    ].slice(0, Math.floor(Math.random() * 3) + 1) : [];
    
    const recentKeywords = [
      "불편해요", "개선", "좋아요", "감사", "문제", "버그", "빠름", "편리"
    ].sort(() => Math.random() - 0.5).slice(0, 5);
    
    const riskLevel = 
      currentScore < 40 ? "critical" :
      currentScore < 60 ? "high" :
      currentScore < 75 ? "medium" : "low";
    
    return {
      currentScore: Math.round(currentScore),
      trend,
      trendChange: Math.round(trendChange * 10) / 10,
      criticalIssues,
      recentKeywords,
      riskLevel,
      lastUpdate: new Date().toLocaleTimeString('ko-KR')
    };
  };

  const { data: sentimentHealth, refetch } = useQuery<SentimentHealth>({
    queryKey: ["/api/sentiment-health", filters?.service?.id],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      return generateSentimentHealth();
    },
    enabled: !!filters?.service?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 0,
  });

  // Blink effect for critical alerts
  useEffect(() => {
    if (sentimentHealth?.riskLevel === "critical") {
      setIsBlinking(true);
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsBlinking(false);
    }
  }, [sentimentHealth?.riskLevel]);

  // Update alert count
  useEffect(() => {
    if (sentimentHealth?.criticalIssues.length) {
      setAlertCount(prev => prev + 1);
    }
  }, [sentimentHealth?.criticalIssues.length]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      default: return "bg-green-500 text-white";
    }
  };

  const getRiskText = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical": return "위험";
      case "high": return "주의";
      case "medium": return "경고";
      default: return "안전";
    }
  };

  if (!filters?.service?.id || !sentimentHealth) {
    return null;
  }

  return (
    <Card className={`mt-8 ${isBlinking ? 'ring-2 ring-red-500' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            실시간 감정 모니터링
            {alertCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alertCount}개 알림
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getRiskColor(sentimentHealth.riskLevel)}>
              {getRiskText(sentimentHealth.riskLevel)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {sentimentHealth.lastUpdate}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          사용자 감정 지수를 실시간으로 모니터링하고 위험 상황을 조기 감지합니다
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Current Sentiment Score */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">현재 지수</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {sentimentHealth.currentScore}
            </div>
            <div className="text-xs text-blue-600">
              100점 만점
            </div>
          </div>

          {/* Trend */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {sentimentHealth.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : sentimentHealth.trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Activity className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-sm font-medium text-gray-700">트렌드</span>
            </div>
            <div className={`text-2xl font-bold ${
              sentimentHealth.trend === "up" ? "text-green-600" :
              sentimentHealth.trend === "down" ? "text-red-600" : "text-gray-600"
            }`}>
              {sentimentHealth.trend === "up" ? "↗" : 
               sentimentHealth.trend === "down" ? "↘" : "→"}
            </div>
            <div className="text-xs text-gray-600">
              {sentimentHealth.trendChange > 0 ? "+" : ""}{sentimentHealth.trendChange}%
            </div>
          </div>

          {/* Risk Level */}
          <div className={`p-4 rounded-lg ${
            sentimentHealth.riskLevel === "critical" ? "bg-gradient-to-br from-red-50 to-red-100" :
            sentimentHealth.riskLevel === "high" ? "bg-gradient-to-br from-orange-50 to-orange-100" :
            sentimentHealth.riskLevel === "medium" ? "bg-gradient-to-br from-yellow-50 to-yellow-100" :
            "bg-gradient-to-br from-green-50 to-green-100"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${
                sentimentHealth.riskLevel === "critical" ? "text-red-600" :
                sentimentHealth.riskLevel === "high" ? "text-orange-600" :
                sentimentHealth.riskLevel === "medium" ? "text-yellow-600" :
                "text-green-600"
              }`} />
              <span className={`text-sm font-medium ${
                sentimentHealth.riskLevel === "critical" ? "text-red-700" :
                sentimentHealth.riskLevel === "high" ? "text-orange-700" :
                sentimentHealth.riskLevel === "medium" ? "text-yellow-700" :
                "text-green-700"
              }`}>위험도</span>
            </div>
            <div className={`text-2xl font-bold ${
              sentimentHealth.riskLevel === "critical" ? "text-red-800" :
              sentimentHealth.riskLevel === "high" ? "text-orange-800" :
              sentimentHealth.riskLevel === "medium" ? "text-yellow-800" :
              "text-green-800"
            }`}>
              {getRiskText(sentimentHealth.riskLevel)}
            </div>
            <div className={`text-xs ${
              sentimentHealth.riskLevel === "critical" ? "text-red-600" :
              sentimentHealth.riskLevel === "high" ? "text-orange-600" :
              sentimentHealth.riskLevel === "medium" ? "text-yellow-600" :
              "text-green-600"
            }`}>
              {sentimentHealth.criticalIssues.length}개 이슈
            </div>
          </div>

          {/* Active Monitoring */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">모니터링</span>
            </div>
            <div className="text-2xl font-bold text-purple-800">
              실시간
            </div>
            <div className="text-xs text-purple-600">
              10초마다 업데이트
            </div>
          </div>
        </div>

        {/* Critical Issues Alert */}
        {sentimentHealth.criticalIssues.length > 0 && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>긴급 상황 감지:</strong>
              <ul className="mt-2 space-y-1">
                {sentimentHealth.criticalIssues.map((issue, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Bell className="h-3 w-3" />
                    {issue}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Keywords */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            최근 24시간 감지된 키워드
          </h4>
          <div className="flex flex-wrap gap-2">
            {sentimentHealth.recentKeywords.map((keyword, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`${
                  ["불편해요", "문제", "버그"].includes(keyword) 
                    ? "border-red-200 text-red-700 bg-red-50"
                    : "border-green-200 text-green-700 bg-green-50"
                }`}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <div>
            마지막 업데이트: {sentimentHealth.lastUpdate}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            실시간 모니터링 활성화
          </div>
        </div>
      </CardContent>
    </Card>
  );
}