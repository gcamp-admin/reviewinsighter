import { useState } from "react";
import ModernDashboard from "@/components/modern-dashboard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, BarChart3 } from "lucide-react";
import type { ReviewFilters } from "@/types";

// 기본 필터 설정
const defaultFilters: ReviewFilters = {
  service: { id: "ixio", name: "익시오" },
  source: ["google_play", "app_store", "naver_blog", "naver_cafe"],
  dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
  dateTo: new Date()
};

export default function ModernDashboardPage() {
  const [filters] = useState<ReviewFilters>(defaultFilters);

  return (
    <div className="min-h-screen">
      {/* 네비게이션 헤더 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  기본 대시보드로 돌아가기
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h1 className="text-xl font-semibold text-gray-900">모던 UX 대시보드</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">실시간 분석 활성화</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 대시보드 */}
      <ModernDashboard filters={filters} />
    </div>
  );
}