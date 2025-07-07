import { Store, Clock, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">우리가게 패키지</h1>
              <p className="text-sm text-gray-500">리뷰 분석 대시보드</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>실시간 리뷰 수집 지원</span>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
