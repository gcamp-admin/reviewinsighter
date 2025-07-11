import { Clock, Settings, Sparkles, TrendingUp, BarChart3 } from "lucide-react";
import logoImg from "@assets/image_1752227192276.png";

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4 group">
            <div className="flex items-center">
              <img 
                src={logoImg} 
                alt="commento.ai Logo" 
                className="h-16 w-auto object-contain group-hover:scale-105 transform transition-all duration-300"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                고객은 이미 말했습니다. 이제는 당신이 들을 차례입니다.
              </p>
              <p className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-300 mt-1">
                당신의 AI UX 멘토, 코멘토!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-300 cursor-pointer group">
              <Clock className="w-4 h-4 group-hover:scale-110 transform transition-transform duration-300" />
              <span className="group-hover:font-medium transition-all duration-300">실시간 리뷰 수집 지원</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 hover:text-purple-600 transition-colors duration-300 cursor-pointer group">
              <TrendingUp className="h-4 w-4 group-hover:scale-110 transform transition-transform duration-300" />
              <span className="group-hover:font-medium transition-all duration-300">실시간 분석</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-300 cursor-pointer group">
              <BarChart3 className="h-4 w-4 group-hover:scale-110 transform transition-transform duration-300" />
              <span className="group-hover:font-medium transition-all duration-300">AI 기반 인사이트</span>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110 transform">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
