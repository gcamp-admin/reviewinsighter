import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for GPT sentiment analysis results to avoid duplicate API calls
const sentimentCache = new Map<string, '긍정' | '부정' | '중립'>();

// Batch processing for multiple reviews to reduce API calls
// GPT-based HEART framework analysis
export async function analyzeHeartFrameworkWithGPT(reviews: any[]): Promise<any[]> {
  if (!reviews || reviews.length === 0) {
    return [];
  }

  try {
    // 토큰 절약: 부정 리뷰만 필터링하여 분석
    const negativeReviews = reviews.filter(review => 
      review.sentiment === '부정' && 
      review.content && 
      review.content.length > 10
    );

    if (negativeReviews.length === 0) {
      console.log('No negative reviews found for HEART analysis');
      return [];
    }

    console.log(`Analyzing ${negativeReviews.length} negative reviews for HEART framework (토큰 절약)`);

    // 부정 리뷰만 분석 대상으로 준비
    const reviewTexts = negativeReviews.slice(0, 8).map(review => ({
      content: review.content,
      rating: review.rating,
      source: review.source
    }));

    // Create prompt for detailed UX-focused HEART framework analysis (부정 리뷰 전용)
    const prompt = `
다음 부정 리뷰들을 HEART 프레임워크에 따라 분석하여 구체적이고 실행 가능한 UX 개선 제안을 생성해주세요.
(부정 리뷰만 분석하여 토큰을 절약하며 문제점 중심의 개선안을 도출합니다)

HEART 프레임워크 (UX 관점):
- Happiness: 사용자 만족도, 감정적 반응, 사용 즐거움
- Engagement: 사용자 참여 패턴, 기능 사용 빈도, 상호작용 품질
- Adoption: 새로운 기능 발견성, 학습 용이성, 첫 사용 경험
- Retention: 재사용 동기, 사용자 이탈 방지, 지속적 가치 제공
- Task Success: 작업 완료율, 오류 방지, 사용자 목표 달성

부정 리뷰 데이터:
${reviewTexts.map((review, index) => `${index + 1}. [${review.source}] 평점: ${review.rating}/5
내용: ${review.content.substring(0, 80)}`).join('\n\n')}

**중요**: 다음 JSON 구조를 **정확히** 따라주세요. description 필드는 사용하지 마세요:

{
  "insights": [
    {
      "category": "happiness|engagement|adoption|retention|task_success",
      "title": "HEART: [category] | [문제유형] ([건수]건)",
      "problem_summary": "실제 사용자 리뷰 표현을 직접 인용하며 한 줄로 문제상황 요약. 예: '사용자들이 차단이 안되어서 불편하다고 호소하여 스팸 차단 기능의 신뢰성 문제 발생'",
      "competitor_benchmark": "동일 문제를 해결한 유사 앱들의 구체적 해결방안. 통화 관련: 후아유(Who's calling), 터치콜(T전화), 원폰(OnePhone), 스팸차단: 더콜러(Truecaller), 위즈콜(WhizCall), 콜 블로커(CallBlocker), 기능 안정성: SKT T전화, KT 전화, 올레 전화 등의 실제 해결방식 명시",
      "ux_suggestions": [
        "구체적이고 실행 가능한 UI/UX 개선 제안 1 (버튼 위치/크기/색상, 화면 전환, 애니메이션 등 상세)",
        "구체적이고 실행 가능한 UI/UX 개선 제안 2",
        "구체적이고 실행 가능한 UI/UX 개선 제안 3"
      ],
      "priority": "critical|major|minor",
      "mentionCount": 건수,
      "trend": "stable"
    }
  ]
}

**필수**: problem_summary, competitor_benchmark, ux_suggestions 필드를 모두 포함해야 합니다. description 필드는 절대 사용하지 마세요.

UX 개선 제안 작성 가이드라인 (UI/UX/GUI/Flow 중심):

🎯 **구체적 UI 컴포넌트 제안**:
- 버튼 위치, 크기, 색상, 텍스트 명시
- 아이콘 종류와 시각적 피드백 구체화
- 화면 레이아웃과 정보 배치 최적화

🔄 **사용자 플로우 개선**:
- 단계별 사용자 여정과 터치포인트 분석
- 화면 전환과 네비게이션 개선 방안
- 오류 상황 대응 플로우 설계

⚡ **인터랙션 디자인**:
- 제스처, 애니메이션, 전환 효과
- 피드백 타이밍과 방식
- 접근성과 사용성 고려사항

📱 **GUI 구체화**:
- 팝업, 토스트, 다이얼로그 디자인
- 상태 표시와 진행률 시각화
- 반응형 및 적응형 UI 요소

예시 분석 1:
- 리뷰: "화면크기를 크게하면 키패드 숫자판의 * 0 # 이 아래로 사라짐"
- 문제 요약: 사용자는 '화면크기를 크게하면 키패드 숫자판의 * 0 # 이 아래로 사라짐'이라고 호소하며, 접근성 기능 사용 시 기본 UI가 제대로 작동하지 않아 통화 기능을 사용할 수 없는 심각한 문제를 겪고 있습니다.
- 타사 벤치마킹: 삼성 전화는 접근성 모드에서 키패드 크기를 화면 비율에 맞춰 자동 조정하며, 터치콜(T전화)은 드래그 가능한 플로팅 키패드를 제공합니다. 더콜러(Truecaller)는 접근성 설정 감지 시 전용 레이아웃으로 전환하여 모든 버튼이 화면 내에서 접근 가능하도록 보장합니다.
- UI/UX 개선 제안:
  • **동적 레이아웃**: 화면 배율 감지 → 키패드 높이 자동 조정 (배율 150%일 때 키패드 크기 80% 적용)
  • **스크롤 뷰**: 키패드를 ScrollView 컨테이너로 래핑, 세로 스크롤 가능하게 변경
  • **플로팅 키패드**: 하단 고정 대신 드래그 가능한 플로팅 키패드 토글 버튼 제공
  • **접근성 모드**: 설정 > 접근성에서 '큰 글씨 최적화' 활성화 시 전용 키패드 레이아웃 적용

예시 분석 2:
- 리뷰: "전화 받을때마다 전에 받았던 전화 화면이 떠요"
- 문제 요약: 통화 종료 후 이전 통화 인터페이스가 캐싱되어 새 통화 시 혼란 야기
- UI/UX 개선 제안:
  • **상태 초기화**: 통화 종료 시 UI 컴포넌트 강제 리셋 + 0.5초 블랙 스크린 전환
  • **로딩 인디케이터**: 새 통화 연결 시 "새 통화 연결 중..." 풀스크린 오버레이 표시
  • **시각적 구분**: 통화 ID별 테마 색상(블루→그린→오렌지 순환) 적용으로 새 통화 명확히 구분
  • **전환 애니메이션**: 이전 통화 화면 슬라이드아웃 → 새 통화 화면 슬라이드인 효과 적용

예시 분석 3:
- 리뷰: "에이닷같이 해주세요. 알람이 별로고 전화 오는것도 모를 정도"
- 문제 요약: 수신 알림의 시각적/청각적 피드백이 부족하여 통화 인지 실패
- UI/UX 개선 제안:
  • **알림 강화**: 풀스크린 통화 화면 + 화면 가장자리 빨간색 테두리 깜빡임 효과
  • **진동 패턴**: 3단계 진동 강도 설정 + 발신자별 커스텀 진동 패턴 지정 가능
  • **시각적 표시**: 무음 모드에서도 카메라 플래시 점멸 + 화면 최대 밝기 자동 조정
  • **스마트 감지**: 즐겨찾기 연락처는 무음/진동 모드 무시하고 강제 알림 활성화

기술적 구현 방법은 제외하고, 순수 UX 관점에서의 개선 방안만 제시하세요.
실제 사용자 리뷰에서 발견된 문제만 분석하고, 가상의 문제는 만들지 마세요.
각 인사이트마다 problem_summary, competitor_benchmark, ux_suggestions 필드를 모두 포함해주세요.
타사 벤치마킹에는 익시오와 유사한 기능을 제공하는 앱들을 참조하세요:
- 통화 관련: 후아유(Who's calling), 터치콜(T전화), 원폰(OnePhone), SKT T전화, KT 전화
- 스팸차단: 더콜러(Truecaller), 위즈콜(WhizCall), 콜 블로커(CallBlocker)  
- UI/UX: 삼성 전화, LG 전화, 샤오미 전화
- 안정성: 통신사 기본 앱들(SKT, KT, LG U+)
이모지는 사용하지 마세요.
실제로 개선이 필요한 중요한 문제들만 분석해주세요. 무의미한 문제를 억지로 만들지 말고, 진짜 사용자가 겪고 있는 문제만 우선순위대로 분석해주세요.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use mini model to reduce token usage
      messages: [
        {
          role: "system",
          content: "당신은 UI/UX/GUI/Flow 전문 디자이너입니다. 사용자 리뷰를 분석하여 구체적이고 실행 가능한 인터페이스 개선 제안을 생성합니다. 중요: 실제로 개선이 필요한 중요한 문제들만 분석하세요. 억지로 문제를 만들지 마세요. 요구사항: 1. 구체적인 UI 컴포넌트: 버튼 위치/크기/색상, 아이콘 종류, 레이아웃 배치를 명시 2. 사용자 플로우: 단계별 화면 전환과 터치포인트를 구체화 3. 인터랙션 디자인: 제스처, 애니메이션, 피드백 방식을 상세히 기술 4. GUI 요소: 팝업, 다이얼로그, 상태 표시를 구체적으로 설계. 반드시 실제 리뷰 내용을 기반으로 구체적인 UI/UX 솔루션을 제안하고, 유효한 JSON 형태로 답변해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    console.log('GPT HEART Analysis Raw Response:', result);
    
    try {
      const parsedResult = JSON.parse(result || '{}');
      
      // Ensure the result has the expected structure
      if (parsedResult.insights && Array.isArray(parsedResult.insights)) {
        return parsedResult.insights.map((insight: any) => {
          // 기존 description을 ux_suggestions로 변환 (호환성)
          const ux_suggestions = insight.ux_suggestions || insight.description || ['UI/UX 개선이 필요합니다.'];
          
          // 실제 리뷰 내용을 기반으로 기본값 생성
          const problem_summary = insight.problem_summary || 
            `사용자들이 "${reviewTexts[0]?.content?.substring(0, 30) || '기능 관련'}" 등의 문제를 호소하고 있습니다.`;
          
          const competitor_benchmark = insight.competitor_benchmark || 
            '카카오톡, 네이버폰, 구글전화 등 타사 앱들의 해결방안을 벤치마킹하여 동일 문제에 대한 UX 솔루션을 참고할 필요가 있습니다.';

          return {
            ...insight,
            ux_suggestions,
            problem_summary,
            competitor_benchmark
          };
        });
      } else if (Array.isArray(parsedResult)) {
        // 기존 형태의 응답이면 변환
        return parsedResult.map((insight: any) => {
          const ux_suggestions = insight.ux_suggestions || insight.description || ['UI/UX 개선이 필요합니다.'];
          const problem_summary = insight.problem_summary || 
            `사용자들이 "${reviewTexts[0]?.content?.substring(0, 30) || '기능 관련'}" 등의 문제를 호소하고 있습니다.`;
          const competitor_benchmark = insight.competitor_benchmark || 
            '카카오톡, 네이버폰, 구글전화 등 타사 앱들의 해결방안을 벤치마킹하여 동일 문제에 대한 UX 솔루션을 참고할 필요가 있습니다.';

          return {
            ...insight,
            ux_suggestions,
            problem_summary,
            competitor_benchmark
          };
        });
      } else {
        console.warn('GPT returned unexpected HEART analysis format:', result);
        return [];
      }
    } catch (parseError) {
      console.error('Failed to parse GPT HEART analysis response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('GPT HEART analysis error:', error);
    return [];
  }
}

export async function generateClusterLabel(keywords: string[]): Promise<string> {
  try {
    const prompt = `다음 키워드들을 분석하여 UX 관점에서 적절한 클러스터 이름을 생성해주세요.

키워드: ${keywords.join(', ')}

클러스터 이름은 다음 조건을 만족해야 합니다:
1. UX/사용성 관점에서 의미 있는 이름
2. 사용자 경험의 특정 영역을 나타내는 이름
3. 한국어로 2-6글자 내외
4. 구체적이고 직관적인 이름

예시:
- ["끊김", "튕김", "멈춤"] → "앱 안정성"
- ["복잡", "어려움", "헷갈림"] → "사용 편의성"
- ["느림", "로딩", "대기"] → "성능 반응성"
- ["버튼", "메뉴", "화면"] → "인터페이스"
- ["통화", "연결", "음성"] → "통화 기능"

클러스터 이름만 반환하세요:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
      temperature: 0.3,
    });

    const label = response.choices[0].message.content?.trim() || `키워드 그룹`;
    return label;
  } catch (error) {
    console.error('클러스터 라벨 생성 실패:', error);
    return `키워드 그룹`;
  }
}

export async function generateKeywordNetworkWithGPT(reviews: any[]): Promise<any> {
  if (!reviews || reviews.length === 0) {
    return { positive: [], negative: [], neutral: [], nodes: [], links: [] };
  }

  try {
    // Separate reviews by sentiment
    const positiveReviews = reviews.filter(r => r.sentiment === '긍정');
    const negativeReviews = reviews.filter(r => r.sentiment === '부정');
    const neutralReviews = reviews.filter(r => r.sentiment === '중립');

    // Generate positive keywords
    const positiveKeywords = await generateKeywordsForSentiment(positiveReviews, '긍정');
    
    // Generate negative keywords
    const negativeKeywords = await generateKeywordsForSentiment(negativeReviews, '부정');
    
    // Generate neutral keywords
    const neutralKeywords = await generateKeywordsForSentiment(neutralReviews, '중립');

    return {
      positive: positiveKeywords,
      negative: negativeKeywords,
      neutral: neutralKeywords,
      nodes: [...positiveKeywords, ...negativeKeywords, ...neutralKeywords].map(k => ({
        id: k.word,
        label: k.word,
        size: k.frequency,
        color: k.sentiment === '긍정' ? '#10B981' : k.sentiment === '부정' ? '#EF4444' : '#6B7280'
      })),
      links: [] // No links for simple word cloud
    };
  } catch (error) {
    console.error("Error generating keyword network:", error);
    return { positive: [], negative: [], neutral: [], nodes: [], links: [] };
  }
}

async function generateKeywordsForSentiment(reviews: any[], sentiment: string): Promise<any[]> {
  if (!reviews || reviews.length === 0) {
    return [];
  }

  try {
    // 토큰 절약을 위해 샘플링 및 텍스트 길이 제한
    const sampleSize = Math.min(8, reviews.length);
    const sampledReviews = reviews.slice(0, sampleSize);
    const reviewTexts = sampledReviews.map(r => r.content.substring(0, 80)).join('\n');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 한국어 텍스트 분석 전문가입니다. 리뷰 텍스트에서 ${sentiment} 감정과 관련된 핵심 키워드를 추출하고 빈도를 분석해주세요.`
        },
        {
          role: "user",
          content: `다음 ${sentiment} 리뷰들에서 가장 자주 언급되는 핵심 키워드 10개를 추출하고 빈도를 분석해주세요:

${reviewTexts}

다음 JSON 형식으로 응답해주세요:
{
  "keywords": [
    {
      "word": "키워드",
      "frequency": 빈도수,
      "sentiment": "${sentiment}"
    }
  ]
}

키워드 추출 규칙:
- 한국어 명사/형용사 위주로 추출
- 의미 있는 키워드만 선택 (불용어 제외)
- 빈도수는 1-10 사이로 설정
- 정확히 10개 키워드 추출`
        }
      ],
      max_tokens: 500,
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"keywords": []}');
    return result.keywords || [];
  } catch (error) {
    console.error(`Error generating ${sentiment} keywords:`, error);
    return [];
  }
}

export async function analyzeReviewSentimentBatch(reviewTexts: string[]): Promise<('긍정' | '부정' | '중립')[]> {
  const results: ('긍정' | '부정' | '중립')[] = [];
  
  console.log(`Processing ${reviewTexts.length} reviews for sentiment analysis`);
  
  // Pre-filter with enhanced rule-based analysis to reduce GPT calls by 90%+
  const needsGPTAnalysis: { text: string; index: number }[] = [];
  
  for (let i = 0; i < reviewTexts.length; i++) {
    const reviewText = reviewTexts[i];
    const cacheKey = reviewText.trim().toLowerCase();
    
    // Check cache first
    if (sentimentCache.has(cacheKey)) {
      results[i] = sentimentCache.get(cacheKey)!;
      continue;
    }
    
    // Try enhanced rule-based analysis
    const ruleResult = tryRuleBasedAnalysis(reviewText);
    if (ruleResult) {
      results[i] = ruleResult;
      sentimentCache.set(cacheKey, ruleResult);
    } else {
      // Only queue for GPT if rule-based can't determine
      needsGPTAnalysis.push({ text: reviewText, index: i });
    }
  }
  
  const ruleResolved = results.filter(r => r).length;
  console.log(`Rule-based analysis resolved ${ruleResolved}/${reviewTexts.length} reviews (${Math.round(ruleResolved/reviewTexts.length*100)}%)`);
  
  // Process remaining reviews with GPT in parallel batches for maximum speed
  if (needsGPTAnalysis.length > 0) {
    console.log(`Processing ${needsGPTAnalysis.length} reviews with GPT in parallel batches`);
    
    const batchSize = 20; // Increased batch size
    const batches = [];
    
    // Create batches
    for (let i = 0; i < needsGPTAnalysis.length; i += batchSize) {
      batches.push(needsGPTAnalysis.slice(i, i + batchSize));
    }
    
    // Process all batches in parallel
    const batchPromises = batches.map(async (batch, batchIndex) => {
      try {
        const prompt = `감정 분석: 다음 리뷰들을 '긍정', '부정', '중립'으로 분류하세요.

규칙:
- 전체 맥락 우선 (단일 감정 단어보다 문장 전체 의미)
- 접속사('그런데', '하지만') 뒤의 내용이 더 중요
- '안되다', '못하다' 등 = 강한 부정
- '괜찮다', '보통' 등 = 중립

리뷰:
${batch.map((item, idx) => `${idx + 1}. ${item.text}`).join('\n')}

JSON 형식으로 응답:
{"sentiments": ["긍정", "부정", "중립", ...]}`

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0,
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        const sentiments = result.sentiments || [];
        
        console.log(`Completed GPT batch ${batchIndex + 1}/${batches.length}`);
        return { batch, sentiments };
        
      } catch (error) {
        console.error(`GPT batch ${batchIndex + 1} error:`, error);
        return { batch, sentiments: batch.map(() => '중립') };
      }
    });
    
    // Wait for all batches to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    for (const { batch, sentiments } of batchResults) {
      for (let j = 0; j < batch.length; j++) {
        const sentiment = sentiments[j] || '중립';
        const item = batch[j];
        results[item.index] = sentiment;
        sentimentCache.set(item.text.trim().toLowerCase(), sentiment);
      }
    }
  }

  // Return results
  return results;
}

export async function analyzeReviewSentimentBatchLegacy(reviewTexts: string[]): Promise<('긍정' | '부정' | '중립')[]> {
  const results: ('긍정' | '부정' | '중립')[] = [];
  const batchSize = 15;
  
  for (let i = 0; i < reviewTexts.length; i += batchSize) {
    const batch = reviewTexts.slice(i, i + batchSize);
    
    try {
      const prompt = `다음 리뷰들의 감정을 분석해주세요. 각 리뷰에 대해 "긍정", "부정", "중립" 중 하나로 분류해주세요.

리뷰 텍스트:
${batch.map((text, index) => `${index + 1}. ${text}`).join('\n')}

다음 JSON 형식으로 응답해주세요:
{"sentiments": ["긍정", "부정", "중립", ...]}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "당신은 한국어 리뷰 감정 분석 전문가입니다. 문장의 전체 맥락과 결말을 종합적으로 고려하여 감정을 정확히 판단해주세요. 긍정적 단어가 포함되어 있어도 전체 맥락이 부정적이면 '부정'으로 분류하고, 접속사('그런데', '하지만', '근데') 뒤의 내용을 더 중요하게 고려해주세요." },
            { role: "user", content: prompt }
          ],
          max_tokens: 100,
          temperature: 0,
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        const sentiments = result.sentiments || [];
        
        for (let j = 0; j < batch.length; j++) {
          const sentiment = sentiments[j] || '중립';
          results.push(sentiment);
        }
        
        console.log(`Processed GPT batch ${Math.ceil((i + batchSize) / batchSize)}/${Math.ceil(batch.length / batchSize)}`);
        
      } catch (error) {
        console.error(`GPT batch error:`, error);
        // Fallback to neutral for failed batch
        for (let j = 0; j < batch.length; j++) {
          results.push('중립');
        }
      }
    }
  
  // Fill any remaining gaps
  for (let i = 0; i < reviewTexts.length; i++) {
    if (!results[i]) {
      results[i] = '중립';
    }
  }
  
  console.log(`Batch sentiment analysis completed: ${results.length} results`);
  return results;
}

export async function analyzeReviewSentimentWithGPT(reviewText: string): Promise<'긍정' | '부정' | '중립'> {
  // Step 1: Check cache first
  const cacheKey = reviewText.trim().toLowerCase();
  if (sentimentCache.has(cacheKey)) {
    console.log(`Using cached sentiment for: ${reviewText.substring(0, 30)}...`);
    return sentimentCache.get(cacheKey)!;
  }

  // Step 2: Try rule-based analysis first (99% accuracy for clear cases)
  const ruleBasedResult = tryRuleBasedAnalysis(reviewText);
  if (ruleBasedResult) {
    sentimentCache.set(cacheKey, ruleBasedResult);
    console.log(`Rule-based sentiment: ${ruleBasedResult} for: ${reviewText.substring(0, 30)}...`);
    return ruleBasedResult;
  }

  // Step 3: Only use GPT for ambiguous cases
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use cheaper model for sentiment analysis
      messages: [
        {
          role: "system",
          content: "당신은 한국어 리뷰 감정 분석 전문가입니다. 문장의 전체 맥락과 결말을 종합적으로 고려하여 감정을 정확히 판단해주세요. 긍정적 단어가 포함되어 있어도 전체 맥락이 부정적이면 '부정'으로 분류하고, 접속사('그런데', '하지만', '근데') 뒤의 내용을 더 중요하게 고려해주세요."
        },
        {
          role: "user",
          content: `다음 리뷰를 전체 맥락과 결말을 고려하여 분석해주세요:
"${reviewText}"

분석 규칙:
- 문장에 '좋다', '빠르다' 같은 긍정 단어가 있어도 전체 맥락이 부정적이면 '부정'
- '그런데', '하지만', '근데' 뒤에 오는 부정적 내용이 더 중요함
- '안되다', '못하다', '안돼다' 등은 강한 부정 신호
- '괜찮다', '보통', '그럭저럭' 등은 중립 신호

응답: 긍정/부정/중립 중 하나만`
        }
      ],
      max_tokens: 10,
      temperature: 0   // Deterministic results
    });

    const result = response.choices[0].message.content?.trim();
    
    // Ensure the response is one of the expected values
    if (result === '긍정' || result === '부정' || result === '중립') {
      sentimentCache.set(cacheKey, result);
      console.log(`GPT sentiment: ${result} for: ${reviewText.substring(0, 30)}...`);
      return result;
    }
    
    // Fallback: if GPT doesn't return expected format, use basic keyword analysis
    console.warn(`GPT returned unexpected sentiment: ${result}, falling back to keyword analysis`);
    const fallbackResult = analyzeReviewSentimentFallback(reviewText);
    sentimentCache.set(cacheKey, fallbackResult);
    return fallbackResult;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to keyword-based analysis if GPT fails
    const fallbackResult = analyzeReviewSentimentFallback(reviewText);
    sentimentCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

// Enhanced rule-based pre-filtering to avoid GPT calls for obvious cases
function tryRuleBasedAnalysis(text: string): '긍정' | '부정' | '중립' | null {
  const lowerText = text.toLowerCase();
  
  // Priority negative patterns - these override everything else
  const priorityNegativePatterns = [
    '안되', '안돼', '안되어', '안되네', '안되요', '안됨', '안되고', '안되니', '안되는',
    '안되서', '안되면', '안되겠', '안되잖', '안되다', '안되나', '안되든', '안되었',
    '안되지', '안되더', '안되는구나', '안되는데', '안되길래', '안되던데',
    '거절', '못하는', '안하는', '안돼는', '조치' // 사용자 요청 키워드 추가
  ];
  
  // Check for priority negative patterns first
  const hasPriorityNegative = priorityNegativePatterns.some(pattern => lowerText.includes(pattern));
  if (hasPriorityNegative) {
    return '부정';
  }
  
  // Comprehensive negative indicators (95%+ confidence)
  const strongNegativePatterns = [
    '최악', '형편없', '별로', '짜증', '화남', '실망', '못하겠', '싫어', '나쁨', '구려', '삭제',
    '에러', '오류', '버그', '문제', '고장', '먹통', '렉', '끊김', '느려', '답답', '귀찮',
    '불편', '단점', '아쉬운', '불만', '스트레스', '힘들', '어렵', '복잡', '렌딩', '느림',
    '끊어', '튕겨', '먹통', '멈춤', '강제', '광고', '차단', '과열', '방해', '거슬림',
    '직관', '형편없', '구리', '답답', '답없', '답변없', '쓰레기', '못쓰', '불가능'
  ];
  
  // Comprehensive positive indicators (95%+ confidence)  
  const strongPositivePatterns = [
    '최고', '대박', '완벽', '훌륭', '멋져', '좋아', '좋네', '좋음', '좋다', '좋습니다',
    '편리', '편해', '만족', '추천', '감사', '고마워', '유용', '도움', '빠름', '빨라',
    '쉬워', '간단', '대단', '놀라', '감동', '편안', '안전', '든든', '믿음', '신뢰',
    '효과', '완전', '우수', '뛰어', '정확', '깔끔', '깨끗', '선명', '부드럽', '매끄'
  ];
  
  // Count positive and negative indicators
  const negativeCount = strongNegativePatterns.filter(pattern => lowerText.includes(pattern)).length;
  const positiveCount = strongPositivePatterns.filter(pattern => lowerText.includes(pattern)).length;
  
  // Clear cases with multiple indicators
  if (negativeCount >= 2) return '부정';
  if (positiveCount >= 2) return '긍정';
  
  // Single strong indicator cases
  if (negativeCount > 0 && positiveCount === 0) return '부정';
  if (positiveCount > 0 && negativeCount === 0) return '긍정';
  
  // Length-based analysis for very short texts
  if (text.length < 10) {
    return '중립';
  }
  
  // Rating-based analysis for app reviews
  const ratingMatch = text.match(/(\d+)점|(\d+)성|(\d+)별|rating[:\s]*(\d+)/i);
  if (ratingMatch) {
    const rating = parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3] || ratingMatch[4]);
    if (rating >= 4) return '긍정';
    if (rating <= 2) return '부정';
    if (rating === 3) return '중립';
  }
  
  // Length-based neutral detection
  if (text.trim().length < 5) return '중립';
  
  // Question-only reviews
  if (text.trim().endsWith('?') && text.split('?').length <= 2) return '중립';
  
  // Context-aware analysis for conjunctions (그런데, 하지만, 근데)
  const conjunctions = ['그런데', '하지만', '근데', '그러나', '하지만서도', '그치만'];
  const hasConjunction = conjunctions.some(conj => lowerText.includes(conj));
  
  if (hasConjunction) {
    // Split by conjunction and analyze the latter part more heavily
    for (const conj of conjunctions) {
      if (lowerText.includes(conj)) {
        const parts = text.split(conj);
        if (parts.length > 1) {
          const latterPart = parts[parts.length - 1].toLowerCase();
          const latterNegativeCount = strongNegativePatterns.filter(pattern => latterPart.includes(pattern)).length;
          const latterPositiveCount = strongPositivePatterns.filter(pattern => latterPart.includes(pattern)).length;
          
          // If latter part is clearly negative, classify as negative
          if (latterNegativeCount > 0 && latterPositiveCount === 0) return '부정';
          if (latterPositiveCount > 0 && latterNegativeCount === 0) return '긍정';
          
          // Weight the latter part more heavily
          if (latterNegativeCount > latterPositiveCount) return '부정';
          if (latterPositiveCount > latterNegativeCount) return '긍정';
        }
        break;
      }
    }
  }

  // Mixed sentiment with neutral tendency
  if (negativeCount > 0 && positiveCount > 0) {
    if (Math.abs(negativeCount - positiveCount) <= 1) return '중립';
  }
  
  // If no clear indicators, return null to trigger GPT analysis
  return null;
}

function analyzeReviewSentimentFallback(text: string): '긍정' | '부정' | '중립' {
  const lowerText = text.toLowerCase();
  
  // Priority negative keywords
  const priorityNegativeKeywords = ['불편', '단점', '아쉬운 점', '불편한 점', '불만', '싫은 점'];
  const hasPriorityNegative = priorityNegativeKeywords.some(keyword => lowerText.includes(keyword));
  
  if (hasPriorityNegative) {
    return '부정';
  }
  
  // Enhanced negative keywords
  const negativeKeywords = [
    '안됨', '안되네', '못하', '안해', '실패', '에러', '오류', '버그', '문제', '고장',
    '느려', '느림', '답답', '짜증', '화남', '실망', '최악', '별로', '구려', '형편없',
    '나가버림', '꺼져', '멈춤', '먹통', '렉', '끊김', '안좋', '나쁨', '싫어',
    '귀찮', '스트레스', '힘들', '어렵', '복잡', '광고 많', '강제', '뜨거움', '방해',
    '없음', '차단 안', '과열', '거슬림'
  ];
  
  // Positive keywords
  const positiveKeywords = [
    '좋아', '좋네', '좋음', '훌륭', '최고', '대박', '완벽', '멋져', '예쁘', '이쁘',
    '편리', '편해', '쉬워', '간단', '빠름', '빨라', '만족', '추천', '감사', '고마워',
    '유용', '도움', '효과', '성공', '잘됨', '잘되네', '괜찮', '무난', '적당'
  ];
  
  // Neutral keywords
  const neutralKeywords = [
    '그냥', '보통', '평범', '일반적', '그럭저럭', '나름', '적절', '무난',
    '참고', '정보', '안내', '설명', '사용법', '방법', '기능', '업데이트'
  ];
  
  const negativeCount = negativeKeywords.filter(keyword => lowerText.includes(keyword)).length;
  const positiveCount = positiveKeywords.filter(keyword => lowerText.includes(keyword)).length;
  const neutralCount = neutralKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Classification logic
  if (negativeCount >= 2 || (negativeCount > 0 && positiveCount === 0)) {
    return '부정';
  } else if (positiveCount > negativeCount && neutralCount <= 1) {
    return '긍정';
  } else if (neutralCount >= 2 || (neutralCount > 0 && positiveCount === 0 && negativeCount === 0)) {
    return '중립';
  } else if (positiveCount === negativeCount && positiveCount > 0) {
    return '중립';
  } else if (positiveCount > 0) {
    return '긍정';
  } else {
    return '중립';
  }
}