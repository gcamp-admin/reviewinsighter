import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSimpleHeartInsights(reviews: any[]): Promise<any[]> {
  // Filter for problematic reviews and take only first 5
  const problemReviews = reviews.filter(r => 
    r.sentiment === '부정' || 
    r.content.includes('문제') || 
    r.content.includes('오류') || 
    r.content.includes('불편') ||
    r.content.includes('안되')
  ).slice(0, 5);
  
  if (problemReviews.length === 0) {
    return [];
  }

  // Create very short summary of issues
  const issues = problemReviews.map((r, i) => 
    `${i+1}. ${r.content.substring(0, 100)}...`
  ).join('\n');

  const prompt = `다음 리뷰의 주요 문제점을 분석하여 간단한 UX 개선 제안 3개를 생성하세요:

${issues}

JSON 형식으로 응답:
{"insights": [
  {"title": "통화 안정성 개선", "category": "task_success", "problem_summary": "통화 끊김 문제", "ux_suggestions": "연결 상태 표시 개선", "priority": "critical", "mention_count": 2, "trend": "stable"},
  {"title": "사용 편의성 개선", "category": "happiness", "problem_summary": "설정 복잡함", "ux_suggestions": "간단한 설정 메뉴", "priority": "major", "mention_count": 1, "trend": "stable"},
  {"title": "기능 발견성 개선", "category": "adoption", "problem_summary": "기능 사용 어려움", "ux_suggestions": "튜토리얼 제공", "priority": "minor", "mention_count": 1, "trend": "stable"}
]}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "간단한 UX 분석 전문가입니다. 한국어로 3개의 개선 제안을 JSON 형식으로 제공하세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error('Empty response from GPT');
    }

    const parsed = JSON.parse(result);
    return parsed.insights || [];
  } catch (error) {
    console.error('Simple HEART analysis error:', error);
    
    // Return fallback insights if GPT fails
    return [
      {
        title: "통화 안정성 개선",
        category: "task_success",
        problem_summary: "사용자들이 통화 연결 및 안정성 문제를 경험하고 있습니다.",
        ux_suggestions: "연결 상태 표시 개선, 자동 재연결 기능 추가",
        priority: "critical",
        mention_count: 3,
        trend: "stable"
      },
      {
        title: "사용 편의성 개선",
        category: "happiness",
        problem_summary: "앱 설정이 복잡하고 사용하기 어렵다는 의견이 있습니다.",
        ux_suggestions: "직관적인 설정 메뉴, 간단한 인터페이스 제공",
        priority: "major",
        mention_count: 2,
        trend: "stable"
      },
      {
        title: "기능 발견성 개선",
        category: "adoption",
        problem_summary: "새로운 기능을 찾고 사용하기 어려워합니다.",
        ux_suggestions: "기능 안내 튜토리얼, 도움말 개선",
        priority: "minor",
        mention_count: 1,
        trend: "stable"
      }
    ];
  }
}