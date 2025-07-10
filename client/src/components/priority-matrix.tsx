import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Target, 
  ArrowRight, 
  Users, 
  Clock, 
  Zap,
  CheckCircle,
  Circle
} from "lucide-react";
import type { ReviewFilters, Insight } from "@/types";

interface PriorityMatrixProps {
  filters: ReviewFilters;
}

interface MatrixItem {
  id: string;
  title: string;
  description: string;
  impact: number; // 1-10 (비즈니스 임팩트)
  effort: number; // 1-10 (구현 복잡도)
  userCount: number; // 영향받는 사용자 수
  priority: "critical" | "major" | "minor";
  category: string;
  selected: boolean;
}

const QUADRANTS = [
  { name: "Quick Wins", color: "bg-green-100 border-green-300", textColor: "text-green-800" },
  { name: "Major Projects", color: "bg-blue-100 border-blue-300", textColor: "text-blue-800" },
  { name: "Fill-ins", color: "bg-yellow-100 border-yellow-300", textColor: "text-yellow-800" },
  { name: "Thankless Tasks", color: "bg-gray-100 border-gray-300", textColor: "text-gray-800" }
];

export default function PriorityMatrix({ filters }: PriorityMatrixProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

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

  // Convert insights to matrix items
  const matrixItems: MatrixItem[] = insights?.map((insight, index) => ({
    id: insight.id.toString(),
    title: insight.title.replace(/🔴|🟡|🟢|Critical|Major|Minor|\|/g, '').trim(),
    description: insight.description.split('\n')[0] || '',
    impact: insight.priority === 'critical' ? 9 : insight.priority === 'major' ? 7 : 5,
    effort: Math.floor(Math.random() * 8) + 2, // Random effort score for demo
    userCount: insight.mentionCount,
    priority: insight.priority as "critical" | "major" | "minor",
    category: insight.category,
    selected: false
  })) || [];

  // Determine quadrant based on impact and effort
  const getQuadrant = (impact: number, effort: number) => {
    if (impact >= 7 && effort <= 5) return 0; // Quick Wins
    if (impact >= 7 && effort > 5) return 1; // Major Projects
    if (impact < 7 && effort <= 5) return 2; // Fill-ins
    return 3; // Thankless Tasks
  };

  // Calculate ROI score
  const calculateROI = (impact: number, effort: number, userCount: number) => {
    const baseROI = (impact * userCount) / Math.max(effort, 1);
    return Math.round(baseROI * 10) / 10;
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getSelectedItemsStats = () => {
    const selected = matrixItems.filter(item => selectedItems.includes(item.id));
    const totalImpact = selected.reduce((sum, item) => sum + item.impact, 0);
    const totalEffort = selected.reduce((sum, item) => sum + item.effort, 0);
    const totalUsers = selected.reduce((sum, item) => sum + item.userCount, 0);
    
    return {
      count: selected.length,
      totalImpact: Math.round(totalImpact / Math.max(selected.length, 1)),
      totalEffort: Math.round(totalEffort / Math.max(selected.length, 1)),
      totalUsers,
      estimatedROI: selected.length > 0 ? calculateROI(totalImpact, totalEffort, totalUsers) : 0
    };
  };

  if (!filters?.service?.id || !matrixItems.length) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          우선순위 매트릭스 (임팩트 vs 구현 복잡도)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          비즈니스 임팩트와 구현 복잡도를 기준으로 개선 작업의 우선순위를 시각화합니다
        </p>
      </CardHeader>
      <CardContent>
        {/* Selection Summary */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">선택된 개선 항목 분석</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-600">선택된 항목</p>
                <p className="text-lg font-bold text-blue-800">{getSelectedItemsStats().count}개</p>
              </div>
              <div>
                <p className="text-blue-600">평균 임팩트</p>
                <p className="text-lg font-bold text-blue-800">{getSelectedItemsStats().totalImpact}/10</p>
              </div>
              <div>
                <p className="text-blue-600">평균 복잡도</p>
                <p className="text-lg font-bold text-blue-800">{getSelectedItemsStats().totalEffort}/10</p>
              </div>
              <div>
                <p className="text-blue-600">예상 ROI</p>
                <p className="text-lg font-bold text-blue-800">{getSelectedItemsStats().estimatedROI}</p>
              </div>
            </div>
          </div>
        )}

        {/* Matrix Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {QUADRANTS.map((quadrant, quadrantIndex) => (
            <div
              key={quadrantIndex}
              className={`${quadrant.color} rounded-lg p-4 min-h-[300px] border-2 border-dashed`}
            >
              <h3 className={`font-medium ${quadrant.textColor} mb-3`}>
                {quadrant.name}
                <span className="text-xs font-normal ml-2">
                  ({matrixItems.filter(item => getQuadrant(item.impact, item.effort) === quadrantIndex).length}개)
                </span>
              </h3>
              
              <div className="space-y-2">
                {matrixItems
                  .filter(item => getQuadrant(item.impact, item.effort) === quadrantIndex)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedItems.includes(item.id) 
                          ? 'ring-2 ring-blue-500 border-blue-300' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleItemSelect(item.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="ml-2">
                          {selectedItems.includes(item.id) ? (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={item.priority === 'critical' ? 'destructive' : 
                                   item.priority === 'major' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.priority}
                          </Badge>
                          <span className="text-gray-500">
                            <Users className="h-3 w-3 inline mr-1" />
                            {item.userCount}명
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <span>💥{item.impact}</span>
                          <span>⚡{item.effort}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">ROI 점수</span>
                          <span className="font-medium text-gray-900">
                            {calculateROI(item.impact, item.effort, item.userCount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Axis Labels */}
        <div className="relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-700">
            높은 임팩트
          </div>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-700">
            낮은 임팩트
          </div>
          <div className="absolute top-1/2 -left-16 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-700">
            낮은 복잡도
          </div>
          <div className="absolute top-1/2 -right-16 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-700">
            높은 복잡도
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">매트릭스 가이드</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-green-700 mb-2">🎯 Quick Wins (우선 실행)</h5>
              <p className="text-gray-600">높은 임팩트 + 낮은 복잡도</p>
              <p className="text-gray-600">즉시 실행 가능한 고효율 개선사항</p>
            </div>
            <div>
              <h5 className="font-medium text-blue-700 mb-2">🏗️ Major Projects (계획적 실행)</h5>
              <p className="text-gray-600">높은 임팩트 + 높은 복잡도</p>
              <p className="text-gray-600">전략적 계획이 필요한 핵심 프로젝트</p>
            </div>
            <div>
              <h5 className="font-medium text-yellow-700 mb-2">⚡ Fill-ins (여유시간 활용)</h5>
              <p className="text-gray-600">낮은 임팩트 + 낮은 복잡도</p>
              <p className="text-gray-600">다른 작업 사이에 처리 가능한 개선사항</p>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">❌ Thankless Tasks (최후순위)</h5>
              <p className="text-gray-600">낮은 임팩트 + 높은 복잡도</p>
              <p className="text-gray-600">투입 대비 효과가 낮은 작업</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}