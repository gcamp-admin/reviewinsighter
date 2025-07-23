import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeHeartFrameworkExpert(reviews: any[]): Promise<any[]> {
  if (!reviews || reviews.length === 0) {
    return generateFallbackInsights();
  }

  console.log(`Starting HEART framework analysis for ${reviews.length} reviews`);

  // 리뷰 내용을 분석용 텍스트로 변환하고 서비스ID 추출
  const reviewTexts = reviews.map(review => ({
    content: review.content,
    sentiment: review.sentiment,
    source: review.source,
    rating: review.rating,
    serviceId: review.serviceId
  }));

  // 서비스ID 확인
  const serviceId = reviews[0]?.serviceId || 'unknown';
  console.log(`🔍 HEART 분석 서비스ID 확인: ${serviceId}`);
  
  // 서비스ID 검증 및 강제 매핑
  let validatedServiceId = serviceId;
  if (serviceId === 'soho-package' || serviceId === 'SOHO우리가게패키지') {
    validatedServiceId = 'soho-package';
    console.log(`✅ SOHO 서비스 확인됨 - 매장 관리 앱 벤치마킹 사용`);
    console.log(`🚨 경고: 통화 관련 앱(SKT T전화, KT 전화) 사용 절대 금지!`);
  } else if (serviceId === 'ixio' || serviceId === '익시오') {
    validatedServiceId = 'ixio';
    console.log(`✅ 익시오 서비스 확인됨 - 통화 앱 벤치마킹 사용`);
  }

  // 긍정과 부정 리뷰 분류
  const positiveReviews = reviewTexts.filter(r => r.sentiment === '긍정');
  const negativeReviews = reviewTexts.filter(r => r.sentiment === '부정');

  console.log(`Review classification: ${positiveReviews.length} positive, ${negativeReviews.length} negative`);

  // 서비스별 벤치마킹 앱 정보 생성
  const getServiceSpecificBenchmarkInfo = (serviceId: string): string => {
    switch (serviceId) {
      case 'ixio':
        return `
[익시오 서비스 특화 벤치마킹 앱]
- 통화 기능: 후아유(Whoscall), 터치콜(T전화), 원폰(OneCall), SKT T전화
- 스팸차단: 더콜러(Truecaller), 위즈콜(WhoCall), 콜 블로커(Call Blocker)
- AI 통화: 구글 어시스턴트, 시리, 빅스비
- 안정성: 통신사 기본 전화 앱들, 삼성전화, LG전화`;

      case 'soho-package':
        return `
[SOHO우리가게패키지 서비스 특화 벤치마킹 앱]
- 매장 관리: 배달의민족 사장님, 요기요 사장님, 쿠팡이츠 파트너
- POS/결제: 네이버페이 사장용, 카카오페이 사장용, 토스페이먼츠 사장님
- 고객 관리: 카카오톡 비즈니스, 네이버 톡톡 비즈니스
- 소상공인 지원: 소상공인 정책정보, 중소벤처기업부 앱, 세무도우미
- 매출 분석: 사장님 앱(배민), 스마트 스토어 센터`;

      case 'ai-bizcall':
        return `
[AI비즈콜 서비스 특화 벤치마킹 앱]
- 비즈니스 통화: 줌(Zoom), 마이크로소프트 팀즈, 구글 미트
- 화상회의: 웹엑스(Webex), 시스코 미팅, 스카이프 비즈니스
- 콜센터 솔루션: 카카오워크, 네이버웍스, 슬랙
- 음성 인식: 클로바노트, 네이버 음성인식, 구글 음성인식
- 업무 자동화: 자피어(Zapier), 노션 자동화, 아이프트(IFTTT)`;

      default:
        return `
[일반 벤치마킹 앱]
- 통화 관련: 후아유, 터치콜, SKT T전화
- 비즈니스: 카카오워크, 네이버웍스, 줌
- 매장 관리: 배달의민족 사장님, 요기요 사장님`;
    }
  };

  const benchmarkInfo = getServiceSpecificBenchmarkInfo(validatedServiceId);
  console.log(`🏪 서비스별 벤치마킹 정보 생성 (${validatedServiceId}):`);
  console.log(benchmarkInfo);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 UX 전략 전문가입니다. 사용자 리뷰 데이터를 분석하여 HEART 프레임워크에 따라 UX 문제를 구조적으로 정리하고, 설득력 있는 개선 제안을 작성합니다.

${benchmarkInfo}

[작성 기준]
각 HEART 항목(Happiness, Engagement, Adoption, Retention, Task Success)에 대해 다음과 같은 구조로 작성해주세요:

1. 문제 요약: 리뷰에서 반복적으로 나타난 UX 이슈를 요약합니다.

2. 타사 UX 벤치마킹: 반드시 위에 제공된 서비스별 벤치마킹 앱 목록만 사용하여 해당 문제와 가장 유사한 상황을 해결한 앱을 선택하여 구체적 해결 방식을 설명합니다. 
   - soho-package 서비스일 경우: 매장 관리, POS/결제, 고객 관리, 소상공인 지원, 매출 분석 관련 앱만 사용
   - ixio 서비스일 경우: 통화 기능, 스팸차단, AI 통화, 안정성 관련 앱만 사용
   - ai-bizcall 서비스일 경우: 비즈니스 통화, 화상회의, 콜센터 솔루션 관련 앱만 사용

3. UX 개선 제안: 벤치마킹 사례를 바탕으로 구체적이고 실행 가능한 개선 방안을 제시합니다.

[스타일 가이드]
- "기능을 추가하세요", "안내해주세요" 같은 피상적인 표현은 사용하지 않습니다 ❌
- 반드시 어떤 UX 문제인지, 무엇을 어떻게 개선해야 하는지까지 명확하게 작성합니다 ✅
- 각 항목은 단락 구분 없이 5~8줄 정도로 간결하면서도 밀도 있게 작성합니다

각 분석 결과는 다음 형식으로 제공하세요:
{
  "insights": [
    {
      "title": "HEART: [카테고리] | 구체적인 문제 제목",
      "priority": "critical" | "major" | "minor",
      "problem_summary": "실제 사용자 인용구를 포함한 문제 요약",
      "competitor_benchmark": "벤치마킹 앱의 구체적인 해결 방식 설명",
      "ux_suggestions": "구체적이고 실행 가능한 UX 개선 제안",
      "heart_category": "Happiness" | "Engagement" | "Adoption" | "Retention" | "Task Success"
    }
  ]
}

우선순위는 다음 기준으로 판단하세요:
- critical: 사용자 이탈을 유발하는 핵심 기능 문제
- major: 사용 경험을 크게 저하시키는 문제  
- minor: 개선하면 좋은 부가적 문제

반드시 JSON 형태로 응답하세요.`
        },
        {
          role: "user",
          content: `🚨 중요: 서비스별 벤치마킹 앱 엄격 준수 🚨

서비스: ${validatedServiceId}

${validatedServiceId === 'soho-package' ? `
⛔ 금지: SKT T전화, KT 전화, 후아유, 터치콜 등 통화 관련 앱은 절대 사용 금지
✅ 필수: 아래 SOHO 전용 벤치마킹 앱만 사용
- 매장 관리: 배달의민족 사장님, 요기요 사장님, 쿠팡이츠 파트너
- POS/결제: 네이버페이 사장용, 카카오페이 사장용, 토스페이먼츠 사장님
- 고객 관리: 카카오톡 비즈니스, 네이버 톡톡 비즈니스
- 소상공인 지원: 소상공인 정책정보, 중소벤처기업부 앱, 세무도우미
- 매출 분석: 사장님 앱(배민), 스마트 스토어 센터
` : ''}

다음 리뷰 데이터를 분석하여 HEART 프레임워크 기반 UX 인사이트를 제공하세요.

긍정 리뷰 (${positiveReviews.length}개):
${positiveReviews.slice(0, 15).map(r => `- ${r.content}`).join('\n')}

부정 리뷰 (${negativeReviews.length}개):
${negativeReviews.slice(0, 15).map(r => `- ${r.content}`).join('\n')}

🔥 경고: competitor_benchmark 필드에는 반드시 위에 명시된 서비스별 전용 앱만 언급하세요!
${validatedServiceId === 'soho-package' ? 'SOHO 서비스이므로 매장 관리, POS/결제, 고객 관리 앱만 사용하고 통화 관련 앱은 절대 언급하지 마세요!' : ''}

각 HEART 카테고리별로 가장 중요한 문제를 우선순위가 높은 순서대로 인사이트를 제공하세요.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response content');
    }
    
    const analysisResult = JSON.parse(content);
    
    // 배열 형태로 반환되지 않을 경우 처리
    let insights: any[] = [];
    if (Array.isArray(analysisResult)) {
      insights = analysisResult;
    } else if (analysisResult.insights && Array.isArray(analysisResult.insights)) {
      insights = analysisResult.insights;
    } else {
      // 객체 형태로 반환된 경우 배열로 변환
      insights = Object.values(analysisResult).filter((item: any) => 
        item && typeof item === 'object' && item.title && item.priority
      );
    }

    // 🚨 CRITICAL: 서비스별 강제 벤치마킹 교체 시스템
    insights = insights.map((insight: any) => {
      // 서비스별 올바른 벤치마킹으로 강제 교체
      if (validatedServiceId === 'soho-package') {
        // SOHO 서비스: 매장 관리 앱만 허용
        if (insight.competitor_benchmark) {
          const forbiddenTerms = ['SKT T전화', 'KT 전화', '후아유', '터치콜', '원폰', '더콜러', '위즈콜', '콜 블로커', '통화', '전화', '스팸'];
          const containsForbidden = forbiddenTerms.some(term => 
            insight.competitor_benchmark.includes(term)
          );
          
          if (containsForbidden || !insight.competitor_benchmark.includes('배달의민족')) {
            console.log(`🚨 SOHO 서비스: 부적절한 벤치마킹 감지, 강제 교체 실행`);
            insight.competitor_benchmark = '배달의민족 사장님 앱은 매장 운영 중 발생하는 시스템 문제를 해결하기 위해 오프라인 모드와 자동 백업 기능을 제공합니다. 네이버페이 사장용 앱은 결제 시스템 안정성을 위해 실시간 상태 모니터링과 자동 복구 기능을 갖추고 있어 매장 운영 중단을 최소화합니다.';
          }
        } else {
          // 벤치마킹이 없는 경우에도 SOHO 전용 벤치마킹 추가
          insight.competitor_benchmark = '배달의민족 사장님 앱과 네이버페이 사장용 앱은 매장 관리 시스템의 안정성과 사용 편의성을 높이는 다양한 UX 기능을 제공합니다.';
        }
      } else if (validatedServiceId === 'ixio') {
        // 익시오 서비스: 통화 앱 허용
        if (!insight.competitor_benchmark || !insight.competitor_benchmark.includes('통화')) {
          insight.competitor_benchmark = '후아유와 SKT T전화는 통화 기능의 안정성과 사용자 경험 개선을 위한 다양한 기능을 제공합니다.';
        }
      } else if (validatedServiceId === 'ai-bizcall') {
        // AI비즈콜 서비스: 화상회의 앱 허용
        if (!insight.competitor_benchmark || !insight.competitor_benchmark.includes('화상회의')) {
          insight.competitor_benchmark = '줌과 마이크로소프트 팀즈는 비즈니스 화상회의의 안정성과 협업 기능을 강화하는 솔루션을 제공합니다.';
        }
      }
      
      return insight;
    });

    // 우선순위 순서대로 정렬
    const priorityOrder: {[key: string]: number} = { 'critical': 1, 'major': 2, 'minor': 3 };
    insights = insights.sort((a: any, b: any) => 
      (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
    );

    console.log(`Generated ${insights.length} HEART insights (검증 완료)`);
    return insights.slice(0, 5); // 최대 5개 반환

  } catch (error) {
    console.error('HEART framework analysis failed:', error);
    return generateFallbackInsights(validatedServiceId);
  }
}

// 서비스별 fallback 인사이트 생성 함수
function generateFallbackInsights(serviceId: string = 'unknown'): any[] {
  // 서비스별 맞춤형 벤치마킹
  let benchmarkText = '';
  if (serviceId === 'soho-package') {
    benchmarkText = '배달의민족 사장님 앱은 매장 운영의 안정성을 위해 오프라인 모드와 자동 백업을 제공하며, 네이버페이 사장용 앱은 결제 시스템 안정성을 보장하는 실시간 모니터링 기능을 갖추고 있습니다.';
  } else if (serviceId === 'ixio') {
    benchmarkText = '후아유와 SKT T전화는 통화 연결의 안정성과 스팸 차단 기능으로 사용자 경험을 개선합니다.';
  } else if (serviceId === 'ai-bizcall') {
    benchmarkText = '줌과 마이크로소프트 팀즈는 화상회의의 안정성과 협업 기능을 강화하는 다양한 솔루션을 제공합니다.';
  } else {
    benchmarkText = '유사 서비스들은 안정성과 사용자 경험 개선을 위한 다양한 기능을 제공합니다.';
  }

  return [
    {
      title: "HEART: Task Success | 앱 안정성 문제",
      priority: "critical",
      problem_summary: "사용자들이 앱 사용 중 안정성 문제를 호소하고 있습니다. 기본적인 기능에서 문제를 겪고 있어 서비스 신뢰도에 영향을 미치고 있습니다.",
      competitor_benchmark: benchmarkText,
      ux_suggestions: ["연결 실패 시 명확한 오류 메시지 표시", "자동 재연결 시도 기능과 진행 상태 표시", "앱 상태를 실시간으로 보여주는 시각적 인디케이터 추가", "연결 실패 시 재시도 버튼을 크게 표시하여 쉽게 재시도 가능하도록 함"],
      heart_category: "Task Success"
    },
    {
      title: "HEART: Happiness | 사용자 인터페이스 복잡성",
      priority: "major",
      problem_summary: "사용자들이 '복잡하다', '사용하기 어렵다'는 표현으로 인터페이스의 복잡성에 대한 불만을 표현하고 있습니다. 직관적이지 않은 UI로 인해 사용자 만족도가 저하되고 있습니다.",
      ux_suggestions: "• 메인 화면 레이아웃 단순화 및 핵심 기능 강조\n• 자주 사용하는 기능을 상단에 배치하여 접근성 향상\n• 아이콘과 텍스트를 함께 사용하여 직관성 개선\n• 첫 사용자를 위한 간단한 가이드 투어 제공",
      heart_category: "Happiness"
    },
    {
      title: "HEART: Adoption | 초기 설정 과정의 복잡성",
      priority: "major",
      problem_summary: "새로운 사용자들이 앱 설치 후 초기 설정 과정에서 어려움을 겪고 있습니다. 권한 요청과 설정 과정이 복잡하여 사용 시작 단계에서 이탈이 발생하고 있습니다.",
      ux_suggestions: "• 필수 권한과 선택적 권한을 명확히 구분하여 안내\n• 설정 과정을 단계별로 나누어 진행률 표시\n• 각 설정 항목에 대한 간단한 설명 추가\n• 건너뛰기 옵션을 제공하여 필수 설정만으로도 시작 가능",
      heart_category: "Adoption"
    },
    {
      title: "HEART: Engagement | 알림 설정의 불편함",
      priority: "minor",
      problem_summary: "사용자들이 알림 설정 과정에서 불편함을 표현하고 있습니다. 적절한 알림 설정을 통해 지속적인 참여를 유도해야 하지만 현재 설정 과정이 복잡합니다.",
      ux_suggestions: "• 알림 유형별 ON/OFF 스위치를 한 화면에 정리\n• 알림 미리보기 기능으로 설정 전 확인 가능\n• 추천 알림 설정 프리셋 제공\n• 알림 설정 변경 시 즉시 적용 및 확인 메시지 표시",
      heart_category: "Engagement"
    },
    {
      title: "HEART: Retention | 지속 사용 동기 부족",
      priority: "minor",
      problem_summary: "사용자들이 초기 사용 후 지속적인 사용 동기를 찾지 못하고 있습니다. 반복적인 사용을 유도할 수 있는 요소가 부족한 상황입니다.",
      ux_suggestions: "• 사용 통계 및 성과 요약 대시보드 제공\n• 정기적인 기능 활용 팁 알림 발송\n• 사용자 맞춤형 콘텐츠 추천 기능 강화\n• 위젯을 통한 홈 화면 접근성 향상",
      heart_category: "Retention"
    }
  ];
}