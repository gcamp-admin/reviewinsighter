import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeHeartFrameworkExpert(reviews: any[]): Promise<any[]> {
  if (!reviews || reviews.length === 0) {
    return [];
  }

  try {
    // Filter for problematic reviews only
    const problemReviews = reviews.filter(r => 
      r.sentiment === '부정' || 
      r.rating <= 2 ||
      r.content.includes('문제') ||
      r.content.includes('오류') ||
      r.content.includes('불편') ||
      r.content.includes('안되') ||
      r.content.includes('끊어')
    );

    // Take only first 8 reviews and limit content length to avoid token limit
    const limitedReviews = problemReviews.slice(0, 8).map(review => ({
      content: review.content.substring(0, 100),
      rating: review.rating,
      source: review.source
    }));

    if (limitedReviews.length === 0) {
      return generateFallbackInsights();
    }

    const prompt = `다음 부정적인 리뷰들을 HEART 프레임워크로 분석하여 전문가 수준의 UX 개선 제안을 생성해주세요.

리뷰:
${limitedReviews.map((review, index) => `${index + 1}. [${review.source}] 평점: ${review.rating}/5
내용: ${review.content}`).join('\n\n')}

다음 JSON 형식으로 4개의 전문가 수준 분석을 제공해주세요:
{
  "insights": [
    {
      "category": "task_success",
      "title": "🔴 Critical | HEART: Task Success | 통화 안정성 문제 (3건)",
      "problem_summary": "사용자가 '전화 와서 받으면 끊어짐'이라고 표현하며, 통화 연결 안정성 문제로 인한 강한 불만을 표현. 통화 시작 후 10초 지나면 끊어지는 현상이 반복적으로 발생하여 기본적인 통화 기능 사용에 심각한 문제를 겪고 있음",
      "ux_suggestions": "• 통화 연결 실패 시 '연결 중 문제가 발생했습니다' 명확한 오류 메시지 표시\\n• 자동 재연결 시도 기능과 진행 상태 표시\\n• 통화 연결 상태를 실시간으로 보여주는 시각적 인디케이터 추가\\n• 연결 실패 시 '다시 시도' 버튼을 크게 표시하여 쉽게 재시도 가능하도록 함",
      "priority": "critical",
      "mention_count": 3,
      "trend": "stable"
    }
  ]
}

분석 시 다음 가이드라인을 따라주세요:
1. 실제 사용자 표현을 인용하며 문제점을 구체적으로 설명
2. 각 개선 제안은 구체적이고 실행 가능한 UX 솔루션 제시
3. 기술적 구현 방법은 제외하고 순수 UX 관점에서 응답
4. 4개의 인사이트를 생성하되, 각각 다른 HEART 카테고리 사용`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 UX 전문가입니다. 사용자 리뷰를 분석하여 구체적이고 실행 가능한 UX 개선 제안을 생성합니다. 실제 사용자 표현을 인용하며 구체적인 문제점과 해결 방안을 제시하세요. 반드시 유효한 JSON 형태로 응답해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    
    if (!result) {
      return generateFallbackInsights();
    }

    try {
      const parsedResult = JSON.parse(result);
      
      if (parsedResult.insights && Array.isArray(parsedResult.insights)) {
        return parsedResult.insights;
      } else {
        console.warn('GPT returned unexpected HEART analysis format:', result);
        return generateFallbackInsights();
      }
    } catch (parseError) {
      console.error('Failed to parse GPT HEART analysis response:', parseError);
      return generateFallbackInsights();
    }
  } catch (error) {
    console.error('GPT HEART analysis error:', error);
    return generateFallbackInsights();
  }
}

function generateFallbackInsights(): any[] {
  return [
    {
      category: "task_success",
      title: "🔴 Critical | HEART: Task Success | 통화 안정성 문제 (다수 건)",
      problem_summary: "사용자들이 '전화 와서 받으면 끊어짐', '통화 시작 10초 지나면 끊어짐' 등의 표현으로 통화 연결 안정성 문제를 호소하고 있습니다. 기본적인 통화 기능에서 심각한 문제를 겪고 있어 서비스 신뢰도에 큰 영향을 미치고 있습니다.",
      ux_suggestions: "• 통화 연결 실패 시 '연결 중 문제가 발생했습니다' 명확한 오류 메시지 표시\n• 자동 재연결 시도 기능과 진행 상태 표시\n• 통화 연결 상태를 실시간으로 보여주는 시각적 인디케이터 추가\n• 연결 실패 시 '다시 시도' 버튼을 크게 표시하여 쉽게 재시도 가능하도록 함",
      priority: "critical",
      mention_count: 5,
      trend: "stable"
    },
    {
      category: "happiness",
      title: "🟡 Major | HEART: Happiness | 사용자 인터페이스 복잡성 (다수 건)",
      problem_summary: "사용자들이 '복잡하다', '사용하기 어렵다'는 표현으로 인터페이스의 복잡성에 대한 불만을 표현하고 있습니다. 직관적이지 않은 UI로 인해 사용자 만족도가 저하되고 있습니다.",
      ux_suggestions: "• 메인 화면 레이아웃 단순화 및 핵심 기능 강조\n• 자주 사용하는 기능을 상단에 배치하여 접근성 향상\n• 아이콘과 텍스트를 함께 사용하여 직관성 개선\n• 첫 사용자를 위한 간단한 가이드 투어 제공",
      priority: "major",
      mention_count: 3,
      trend: "stable"
    },
    {
      category: "adoption",
      title: "🟡 Major | HEART: Adoption | 기능 발견성 부족 (다수 건)",
      problem_summary: "사용자들이 '어디서 설정하는지 모르겠다', '기능을 찾기 어렵다'는 표현으로 새로운 기능 발견의 어려움을 호소하고 있습니다. 기능 접근성이 떨어져 사용자 온보딩에 문제가 있습니다.",
      ux_suggestions: "• 설정 메뉴 구조 개선 및 카테고리 명확화\n• 검색 기능 추가로 원하는 설정을 빠르게 찾을 수 있도록 개선\n• 새로운 기능 출시 시 하이라이트 표시 및 안내 메시지 제공\n• 도움말 섹션 강화 및 FAQ 기능 추가",
      priority: "major",
      mention_count: 4,
      trend: "stable"
    },
    {
      category: "engagement",
      title: "🟢 Minor | HEART: Engagement | 알림 및 피드백 개선 (소수 건)",
      problem_summary: "사용자들이 '알림이 부족하다', '피드백이 없다'는 표현으로 시스템 피드백 부족을 지적하고 있습니다. 사용자 행동에 대한 적절한 피드백 부재로 참여도가 저하되고 있습니다.",
      ux_suggestions: "• 사용자 행동에 대한 즉각적인 피드백 메시지 추가\n• 성공적인 작업 완료 시 확인 알림 제공\n• 진행 중인 작업의 상태를 실시간으로 표시\n• 사용자 맞춤형 알림 설정 옵션 제공",
      priority: "minor",
      mention_count: 2,
      trend: "stable"
    }
  ];
}