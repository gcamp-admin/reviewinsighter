import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Mail
} from "lucide-react";
import type { ReviewFilters } from "@/types";

interface AutoReportGeneratorProps {
  filters: ReviewFilters;
}

interface ReportConfig {
  type: "weekly" | "monthly" | "quarterly";
  format: "pdf" | "html" | "email";
  recipients: string[];
  sections: string[];
  autoSchedule: boolean;
  nextScheduled?: string;
}

interface GeneratedReport {
  id: string;
  title: string;
  type: string;
  generatedAt: string;
  status: "generating" | "completed" | "failed";
  downloadUrl?: string;
  summary: {
    totalReviews: number;
    averageRating: number;
    sentimentScore: number;
    keyInsights: string[];
  };
}

export default function AutoReportGenerator({ filters }: AutoReportGeneratorProps) {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: "weekly",
    format: "pdf",
    recipients: [],
    sections: ["overview", "trends", "insights", "recommendations"],
    autoSchedule: false
  });
  
  const { toast } = useToast();

  // 생성된 보고서 목록 조회
  const { data: reports = [], refetch } = useQuery<GeneratedReport[]>({
    queryKey: ["/api/reports", filters?.service?.id],
    queryFn: async () => {
      // 시뮬레이션 데이터
      return [
        {
          id: "report-1",
          title: "익시오 주간 리뷰 분석 보고서",
          type: "weekly",
          generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
          downloadUrl: "/reports/weekly-2025-01-08.pdf",
          summary: {
            totalReviews: 147,
            averageRating: 4.1,
            sentimentScore: 78,
            keyInsights: [
              "통화 연결 안정성 개선 필요",
              "AI 기능 만족도 증가",
              "블루투스 호환성 이슈 지속"
            ]
          }
        },
        {
          id: "report-2",
          title: "익시오 월간 종합 분석 보고서",
          type: "monthly",
          generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
          downloadUrl: "/reports/monthly-2025-01.pdf",
          summary: {
            totalReviews: 582,
            averageRating: 4.2,
            sentimentScore: 81,
            keyInsights: [
              "전반적 사용자 만족도 향상",
              "경쟁사 대비 AI 기능 우위",
              "통화중 대기 기능 요구 증가"
            ]
          }
        }
      ];
    },
    enabled: !!filters?.service?.id,
    staleTime: 30 * 1000,
  });

  // 보고서 생성 뮤테이션
  const generateReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 시뮬레이션
      return {
        id: `report-${Date.now()}`,
        title: `익시오 ${config.type === 'weekly' ? '주간' : config.type === 'monthly' ? '월간' : '분기별'} 보고서`,
        type: config.type,
        generatedAt: new Date().toISOString(),
        status: "generating" as const,
        summary: {
          totalReviews: 0,
          averageRating: 0,
          sentimentScore: 0,
          keyInsights: []
        }
      };
    },
    onSuccess: () => {
      toast({
        title: "보고서 생성 시작",
        description: "보고서가 생성되고 있습니다. 완료되면 알림을 받으실 수 있습니다.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "보고서 생성 실패",
        description: "보고서 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate(reportConfig);
  };

  const downloadReport = (report: GeneratedReport) => {
    // 실제 구현에서는 보고서 다운로드 로직
    toast({
      title: "보고서 다운로드",
      description: `${report.title}을 다운로드합니다.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generating":
        return <Badge variant="outline" className="text-yellow-600">생성 중</Badge>;
      case "completed":
        return <Badge variant="default" className="text-green-600">완료</Badge>;
      case "failed":
        return <Badge variant="destructive">실패</Badge>;
      default:
        return <Badge variant="secondary">알 수 없음</Badge>;
    }
  };

  if (!filters?.service?.id) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          AI 자동 보고서 생성
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          주요 메트릭과 인사이트를 포함한 전문적인 분석 보고서를 자동으로 생성합니다
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 보고서 생성 설정 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                보고서 설정
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">보고서 유형</label>
                  <Select value={reportConfig.type} onValueChange={(value: any) => setReportConfig({...reportConfig, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">주간 보고서</SelectItem>
                      <SelectItem value="monthly">월간 보고서</SelectItem>
                      <SelectItem value="quarterly">분기별 보고서</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">출력 형식</label>
                  <Select value={reportConfig.format} onValueChange={(value: any) => setReportConfig({...reportConfig, format: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="email">이메일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">포함할 섹션</label>
                  <div className="space-y-2">
                    {[
                      { id: "overview", label: "개요 및 요약" },
                      { id: "trends", label: "트렌드 분석" },
                      { id: "insights", label: "주요 인사이트" },
                      { id: "recommendations", label: "개선 권장사항" },
                      { id: "competitive", label: "경쟁사 분석" }
                    ].map(section => (
                      <label key={section.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={reportConfig.sections.includes(section.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReportConfig({
                                ...reportConfig,
                                sections: [...reportConfig.sections, section.id]
                              });
                            } else {
                              setReportConfig({
                                ...reportConfig,
                                sections: reportConfig.sections.filter(s => s !== section.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{section.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isPending}
                  className="w-full"
                >
                  {generateReportMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      보고서 생성
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 생성된 보고서 목록 */}
          <div className="lg:col-span-2">
            <h3 className="font-medium mb-4">생성된 보고서</h3>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          {new Date(report.generatedAt).toLocaleDateString('ko-KR')}
                        </span>
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                    
                    {report.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        다운로드
                      </Button>
                    )}
                  </div>
                  
                  {report.status === "completed" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">총 리뷰</p>
                        <p className="font-semibold">{report.summary.totalReviews}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">평균 평점</p>
                        <p className="font-semibold">{report.summary.averageRating}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">감정 점수</p>
                        <p className="font-semibold">{report.summary.sentimentScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">주요 인사이트</p>
                        <p className="font-semibold">{report.summary.keyInsights.length}개</p>
                      </div>
                    </div>
                  )}
                  
                  {report.status === "completed" && report.summary.keyInsights.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">주요 발견사항:</p>
                      <ul className="text-sm space-y-1">
                        {report.summary.keyInsights.slice(0, 3).map((insight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              
              {reports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>아직 생성된 보고서가 없습니다.</p>
                  <p className="text-sm">좌측 설정에서 보고서를 생성해보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 자동 스케줄링 설정 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">자동 생성 스케줄링</h4>
          <p className="text-sm text-blue-700 mb-3">
            정기적으로 보고서를 자동 생성하고 이메일로 전송받을 수 있습니다.
          </p>
          <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reportConfig.autoSchedule}
                onChange={(e) => setReportConfig({...reportConfig, autoSchedule: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm">자동 생성 활성화</span>
            </label>
            
            {reportConfig.autoSchedule && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  다음 생성 예정: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}