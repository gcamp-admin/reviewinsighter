import logoImg from "/assets/commento_logo_transparent.png";
import { useState } from "react";
import { X } from "lucide-react";

export default function Header() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
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
            <div 
              className="hidden md:flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-300 cursor-pointer group"
              onClick={() => setIsPopupOpen(true)}
            >
              <span className="group-hover:font-medium transition-all duration-300">코멘토는 누구?</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 팝업 모달 */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-in fade-in-0 zoom-in-95 duration-300">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsPopupOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* 팝업 내용 */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">AI</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">코멘토는 누구?</h2>
              </div>
              
              <div className="text-left space-y-4 text-sm text-gray-600">
                <p>
                  <strong className="text-blue-600">코멘토(commento.ai)</strong>는 AI 기반의 리뷰 분석 전문가입니다.
                </p>
                <p>
                  📊 <strong>전문 분야:</strong> 앱 리뷰, 고객 피드백, 감정 분석
                </p>
                <p>
                  🎯 <strong>역할:</strong> 고객의 목소리를 분석하여 실용적인 UX 개선 제안을 제공
                </p>
                <p>
                  💡 <strong>특징:</strong> HEART 프레임워크 기반 심층 분석 및 키워드 추출
                </p>
                <p className="text-center text-blue-600 font-medium pt-4 border-t">
                  "고객은 이미 말했습니다.<br/>이제는 당신이 들을 차례입니다."
                </p>
                
                <div className="mt-6 pt-4 border-t bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    코멘토 관련 문의사항이 있으실 경우, 아래 담당자에게 연락주시기 바랍니다.<br/>
                    <strong className="text-gray-700">Innovation CoE 최아진</strong> | 
                    <a href="mailto:ahjinchoe@lguplus.co.kr" className="text-blue-600 hover:underline ml-1">
                      ahjinchoe@lguplus.co.kr
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}