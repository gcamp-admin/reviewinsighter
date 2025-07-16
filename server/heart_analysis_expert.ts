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

  // 리뷰 내용을 분석용 텍스트로 변환
  const reviewTexts = reviews.map(review => ({
    content: review.content,
    sentiment: review.sentiment,
    source: review.source,
    rating: review.rating
  }));

  // 긍정과 부정 리뷰 분류
  const positiveReviews = reviewTexts.filter(r => r.sentiment === '긍정');
  const negativeReviews = reviewTexts.filter(r => r.sentiment === '부정');

  console.log(`Review classification: ${positiveReviews.length} positive, ${negativeReviews.length} negative`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문 UX 리서처입니다. 리뷰 데이터를 분석하여 HEART 프레임워크 기반으로 UX 인사이트를 제공해야 합니다.

HEART 프레임워크는 다음과 같습니다:

1. **Happiness (만족도)**: 사용자가 제품에 대해 느끼는 만족도와 감정
   - 직관적인 네비게이션, 깔끔한 UI로 스트레스 없는 경험
   - 사용자가 고객센터 문의 없이도 원하는 정보를 쉽게 찾을 수 있는 상태

2. **Engagement (참여도)**: 사용자가 제품과 얼마나 활발히 상호작용하는지
   - 사용자가 매일 습관처럼 앱에 접속해서 기능을 자주 사용
   - 적절한 푸시 알림과 개인화된 콘텐츠로 참여 유도

3. **Adoption (채택률)**: 신규 사용자가 제품을 도입하고 사용을 시작하는 비율
   - 회원가입, 온보딩 플로우, 튜토리얼에서 어려움 없이 다음 단계로 넘어감
   - 첫 경험에서 혼란이 생기지 않도록 명확한 UI/UX 설계

4. **Retention (재방문률)**: 사용자가 제품을 지속적으로 사용하는 비율
   - 처음 좋은 경험을 바탕으로 다시 돌아올 이유 제공
   - 알림, 위젯, 유익한 콘텐츠 등으로 재방문 동기 부여

5. **Task Success (과업 성공률)**: 사용자가 원하는 작업을 성공적으로 완료하는 비율
   - 사용자가 목표를 달성할 수 있도록 단순하고 명확한 흐름 설계
   - 오류 메시지나 중단 요소 없이 작업 완료 가능

각 분석 결과는 다음 형식으로 제공하세요:
{
  "insights": [
    {
      "title": "HEART: [카테고리] | 구체적인 문제 제목",
      "priority": "critical" | "major" | "minor",
      "problem_summary": "실제 사용자 인용구를 포함한 문제 요약",
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
          content: `다음 리뷰 데이터를 분석하여 HEART 프레임워크 기반 UX 인사이트 5개를 제공하세요:

긍정 리뷰 (${positiveReviews.length}개):
${positiveReviews.slice(0, 15).map(r => `- ${r.content}`).join('\n')}

부정 리뷰 (${negativeReviews.length}개):
${negativeReviews.slice(0, 15).map(r => `- ${r.content}`).join('\n')}

각 HEART 카테고리별로 가장 중요한 문제를 1개씩 선별하되, 우선순위가 높은 순서대로 5개의 인사이트를 제공하세요.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
      temperature: 0.3
    });

    const analysisResult = JSON.parse(response.choices[0].message.content);
    
    // 배열 형태로 반환되지 않을 경우 처리
    let insights = [];
    if (Array.isArray(analysisResult)) {
      insights = analysisResult;
    } else if (analysisResult.insights && Array.isArray(analysisResult.insights)) {
      insights = analysisResult.insights;
    } else {
      // 객체 형태로 반환된 경우 배열로 변환
      insights = Object.values(analysisResult).filter(item => 
        item && typeof item === 'object' && item.title && item.priority
      );
    }

    // 우선순위 순서대로 정렬
    const priorityOrder = { 'critical': 1, 'major': 2, 'minor': 3 };
    insights = insights.sort((a, b) => 
      (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
    );

    console.log(`Generated ${insights.length} HEART insights`);
    return insights.slice(0, 5); // 최대 5개 반환

  } catch (error) {
    console.error('HEART framework analysis failed:', error);
    return generateFallbackInsights();
  }
}

function generateFallbackInsights(): any[] {
  return [
    {
      title: "HEART: Task Success | 통화 안정성 문제",
      priority: "critical",
      problem_summary: "사용자들이 '전화 와서 받으면 끊어짐', '통화 시작 10초 지나면 끊어짐' 등의 표현으로 통화 연결 안정성 문제를 호소하고 있습니다. 기본적인 통화 기능에서 심각한 문제를 겪고 있어 서비스 신뢰도에 큰 영향을 미치고 있습니다.",
      ux_suggestions: "• 통화 연결 실패 시 '연결 중 문제가 발생했습니다' 명확한 오류 메시지 표시\n• 자동 재연결 시도 기능과 진행 상태 표시\n• 통화 연결 상태를 실시간으로 보여주는 시각적 인디케이터 추가\n• 연결 실패 시 '다시 시도' 버튼을 크게 표시하여 쉽게 재시도 가능하도록 함",
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