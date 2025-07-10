import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Shield,
  Target,
  Clock,
  Eye,
  AlertCircle
} from "lucide-react";
import type { ReviewFilters } from "@/types";

interface AnomalyDetectionProps {
  filters: ReviewFilters;
}

interface Anomaly {
  id: string;
  type: "sudden_drop" | "sudden_spike" | "pattern_change" | "keyword_emergence";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  detected_at: string;
  metric: string;
  current_value: number;
  expected_value: number;
  deviation_percentage: number;
  confidence: number;
  affected_users: number;
  suggested_actions: string[];
  timeline: Array<{
    timestamp: string;
    value: number;
    expected: number;
  }>;
}

export default function AnomalyDetection({ filters }: AnomalyDetectionProps) {
  const [selectedAnomaly, setSelectedAnomaly] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // 실시간 이상 감지 데이터 시뮬레이션
  const generateAnomalies = (): Anomaly[] => {
    const anomalies: Anomaly[] = [];
    
    // 감정 점수 급락 이상
    if (Math.random() > 0.7) {
      anomalies.push({
        id: "anomaly-1",
        type: "sudden_drop",
        severity: "high",
        title: "감정 점수 급락 감지",
        description: "최근 4시간 동안 평균 감정 점수가 예상치보다 25% 급락했습니다.",
        detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metric: "sentiment_score",
        current_value: 65,
        expected_value: 87,
        deviation_percentage: -25.3,
        confidence: 0.94,
        affected_users: 1247,
        suggested_actions: [
          "고객 서비스팀에 즉시 알림 전송",
          "최근 앱 업데이트 롤백 검토",
          "사용자 피드백 긴급 수집"
        ],
        timeline: Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(Date.now() - (12 - i) * 20 * 60 * 1000).toISOString(),
          value: 87 - (i > 8 ? (i - 8) * 5.5 : 0),
          expected: 87
        }))
      });
    }

    // 특정 키워드 급증
    if (Math.random() > 0.6) {
      anomalies.push({
        id: "anomaly-2",
        type: "keyword_emergence",
        severity: "medium",
        title: "부정 키워드 급증",
        description: "'연결 오류' 키워드가 평상시보다 340% 증가했습니다.",
        detected_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        metric: "keyword_frequency",
        current_value: 44,
        expected_value: 10,
        deviation_percentage: 340,
        confidence: 0.88,
        affected_users: 892,
        suggested_actions: [
          "네트워크 인프라 점검",
          "서버 상태 모니터링 강화",
          "사용자 대상 공지사항 발행"
        ],
        timeline: Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(Date.now() - (12 - i) * 20 * 60 * 1000).toISOString(),
          value: i > 6 ? 10 + (i - 6) * 6 : 10,
          expected: 10
        }))
      });
    }

    // 리뷰 패턴 변화
    if (Math.random() > 0.8) {
      anomalies.push({
        id: "anomaly-3",
        type: "pattern_change",
        severity: "low",
        title: "리뷰 패턴 변화",
        description: "평상시와 다른 시간대에 리뷰 활동이 증가하고 있습니다.",
        detected_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        metric: "review_pattern",
        current_value: 78,
        expected_value: 45,
        deviation_percentage: 73.3,
        confidence: 0.76,
        affected_users: 324,
        suggested_actions: [
          "사용자 행동 패턴 분석",
          "마케팅 캠페인 효과 검토",
          "지역별 사용 현황 확인"
        ],
        timeline: Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(Date.now() - (12 - i) * 20 * 60 * 1000).toISOString(),
          value: i > 4 ? 45 + (i - 4) * 4 : 45,
          expected: 45
        }))
      });
    }

    return anomalies;
  };

  const { data: anomalies = [], refetch } = useQuery({
    queryKey: ["/api/anomalies", filters?.service?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
      return generateAnomalies();
    },
    enabled: !!filters?.service?.id && isMonitoring,
    refetchInterval: 30000, // 30초마다 검사
    staleTime: 0,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500 text-white border-red-600";
      case "high": return "bg-orange-500 text-white border-orange-600";
      case "medium": return "bg-yellow-500 text-white border-yellow-600";
      default: return "bg-blue-500 text-white border-blue-600";
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case "sudden_drop": return <TrendingDown className="h-4 w-4" />;
      case "sudden_spike": return <TrendingUp className="h-4 w-4" />;
      case "pattern_change": return <Target className="h-4 w-4" />;
      case "keyword_emergence": return <Zap className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sudden_drop": return "급락";
      case "sudden_spike": return "급증";
      case "pattern_change": return "패턴 변화";
      case "keyword_emergence": return "키워드 급증";
      default: return "기타";
    }
  };

  if (!filters?.service?.id) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            지능형 이상 감지 시스템
            {anomalies.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {anomalies.length}개 감지
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={isMonitoring ? "text-green-600 border-green-300" : ""}
            >
              <Eye className="h-4 w-4 mr-1" />
              {isMonitoring ? "모니터링 중" : "일시 정지"}
            </Button>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              30초마다 검사
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          AI가 리뷰 데이터의 비정상적인 패턴을 실시간으로 감지하고 조기 경고를 제공합니다
        </p>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-medium text-green-800 mb-2">모든 지표가 정상입니다</h3>
            <p className="text-sm text-green-600">
              현재 감지된 이상 현상이 없습니다. 시스템이 지속적으로 모니터링 중입니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <Alert key={anomaly.id} className="border-l-4 border-l-red-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getAnomalyIcon(anomaly.type)}
                        <span className="font-medium">{anomaly.title}</span>
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeLabel(anomaly.type)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">
                        {anomaly.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                        <div>
                          <p className="text-gray-500">현재 값</p>
                          <p className="font-semibold">{anomaly.current_value}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">예상 값</p>
                          <p className="font-semibold">{anomaly.expected_value}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">편차</p>
                          <p className={`font-semibold ${anomaly.deviation_percentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {anomaly.deviation_percentage > 0 ? '+' : ''}{anomaly.deviation_percentage}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">신뢰도</p>
                          <p className="font-semibold">{Math.round(anomaly.confidence * 100)}%</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">권장 조치 사항</h4>
                        <ul className="text-sm space-y-1">
                          {anomaly.suggested_actions.map((action, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="ml-4 text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(anomaly.detected_at).toLocaleString('ko-KR')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        영향 사용자: {anomaly.affected_users.toLocaleString()}명
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* 통계 요약 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">높은 위험도</h4>
            <p className="text-2xl font-bold text-red-900">
              {anomalies.filter(a => a.severity === "high" || a.severity === "critical").length}
            </p>
            <p className="text-xs text-red-600">즉시 조치 필요</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">중간 위험도</h4>
            <p className="text-2xl font-bold text-yellow-900">
              {anomalies.filter(a => a.severity === "medium").length}
            </p>
            <p className="text-xs text-yellow-600">지속 관찰</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">낮은 위험도</h4>
            <p className="text-2xl font-bold text-blue-900">
              {anomalies.filter(a => a.severity === "low").length}
            </p>
            <p className="text-xs text-blue-600">참고 사항</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}