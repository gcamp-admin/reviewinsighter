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
              <div className="flex items-center space-x-3">
                {/* 새로운 그라데이션 캐릭터 */}
                <div className="relative">
                  <svg width="64" height="64" viewBox="0 0 64 64" className="group-hover:scale-105 transform transition-all duration-300">
                    <defs>
                      <linearGradient id="characterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c97cff" />
                        <stop offset="100%" stopColor="#f9a4bc" />
                      </linearGradient>
                    </defs>
                    {/* 말풍선 모양 배경 */}
                    <path d="M32 8 C46 8 56 18 56 32 C56 46 46 56 32 56 C28 56 24 55 20 53 L8 58 L13 46 C11 42 8 37 8 32 C8 18 18 8 32 8 Z" fill="url(#characterGradient)" />
                    
                    {/* 안경 */}
                    <circle cx="22" cy="28" r="6" fill="none" stroke="#333" strokeWidth="2.5" />
                    <circle cx="42" cy="28" r="6" fill="none" stroke="#333" strokeWidth="2.5" />
                    <line x1="28" y1="28" x2="36" y2="28" stroke="#333" strokeWidth="2.5" />
                    
                    {/* 눈 */}
                    <circle cx="22" cy="28" r="3" fill="#333" />
                    <circle cx="42" cy="28" r="3" fill="#333" />
                    <circle cx="23" cy="27" r="1" fill="white" />
                    <circle cx="43" cy="27" r="1" fill="white" />
                    
                    {/* 입 */}
                    <path d="M26 38 Q32 44 38 38" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                
                {/* 텍스트 로고 */}
                <div className="text-2xl font-bold text-gray-800">
                  commento.ai
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-300 mt-1">
                고객의 코멘트를 분석해서 UX인사이트를 제공하는 당신의 UX멘토 코멘토!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div 
              className="hidden md:flex items-center space-x-2 text-sm text-gray-500 hover:text-purple-500 transition-colors duration-300 cursor-pointer group"
              onClick={() => setIsPopupOpen(true)}
            >
              <span className="group-hover:font-medium transition-all duration-300">코멘토는 누구?</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 팝업 모달 */}
      {isPopupOpen && (
        <div className="popup-overlay" onClick={() => setIsPopupOpen(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsPopupOpen(false)}
              className="popup-close-btn"
            >
              <X size={24} />
            </button>
            
            {/* 팝업 내용 */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #c97cff, #f9a4bc)' }}>
                  <span className="text-white font-bold text-2xl">AI</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">코멘토는 누구?</h2>
              </div>
              
              <div className="text-left space-y-4 text-sm text-gray-600">
                <p>
                  <strong style={{ background: 'linear-gradient(135deg, #c97cff, #f9a4bc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>코멘토(commento.ai)</strong>는 AI 기반의 리뷰 분석 전문가입니다.
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
                <p className="text-center font-medium pt-4 border-t" style={{ background: 'linear-gradient(135deg, #c97cff, #f9a4bc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  "고객은 이미 말했습니다.<br/>이제는 당신이 들을 차례입니다."
                </p>
                
                <div className="mt-6 pt-4 border-t bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    코멘토 관련 문의사항이 있으실 경우, 아래 담당자에게 연락주시기 바랍니다.<br/>
                    <strong className="text-gray-700">Innovation CoE 최아진</strong> | 
                    <a href="mailto:ahjinchoe@lguplus.co.kr" className="hover:underline ml-1" style={{ background: 'linear-gradient(135deg, #c97cff, #f9a4bc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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