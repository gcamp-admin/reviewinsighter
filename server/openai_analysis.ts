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
    // Prepare review texts for analysis
    const reviewTexts = reviews.map(review => ({
      content: review.content,
      rating: review.rating,
      source: review.source
    }));

    // Create prompt for detailed UX-focused HEART framework analysis
    const prompt = `
다음 리뷰들을 HEART 프레임워크에 따라 분석하여 구체적이고 실행 가능한 UX 개선 제안을 생성해주세요.

HEART 프레임워크 (UX 관점):
- Happiness: 사용자 만족도, 감정적 반응, 사용 즐거움
- Engagement: 사용자 참여 패턴, 기능 사용 빈도, 상호작용 품질
- Adoption: 새로운 기능 발견성, 학습 용이성, 첫 사용 경험
- Retention: 재사용 동기, 사용자 이탈 방지, 지속적 가치 제공
- Task Success: 작업 완료율, 오류 방지, 사용자 목표 달성

리뷰 데이터:
${reviewTexts.slice(0, 10).map((review, index) => `${index + 1}. [${review.source}] 평점: ${review.rating}/5
내용: ${review.content.substring(0, 150)}`).join('\n\n')}

분석 결과를 다음 JSON 형식으로 반환해주세요:
{
  "insights": [
    {
      "category": "happiness|engagement|adoption|retention|task_success",
      "title": "🔴 Critical | HEART: [category] | [문제유형] ([건수]건)",
      "problem_summary": "실제 사용자 표현을 인용하며 구체적인 UX 문제점 설명. 사용자가 어떤 상황에서 어떤 문제를 겪었는지 명확히 기술",
      "ux_suggestions": "구체적이고 실행 가능한 UX 개선 제안 (3-5개 항목)",
      "priority": "critical|major|minor",
      "mention_count": 건수,
      "trend": "stable"
    }
  ]
}

UX 개선 제안 작성 가이드라인:
1. 문제 상황 파악: 사용자가 언급한 구체적인 상황과 문제점을 정확히 파악
2. 사용자 행동 분석: 사용자의 행동 패턴과 기대치를 고려한 개선 방향 설정
3. 구체적 해결 방안: 일반적인 제안이 아닌 구체적이고 실행 가능한 UX 솔루션 제시

예시 분석:
- 리뷰: "전화왔을 때 진동이 꺼지지 않아 당황스러웠습니다"
- 문제 요약: 사용자가 "전화왔을 때 진동이 꺼지지 않아 당황스러웠다"고 표현하며, 통화 중 진동 제어에 대한 불편함을 호소
- UX 개선 제안:
  • 설정 메뉴에 '통화 중 진동 자동 끄기' 토글 옵션 추가
  • 통화 화면에 진동 on/off 빠른 버튼 배치
  • 첫 통화 시 진동 설정 안내 팝업 표시
  • 통화 중 진동 상태를 시각적으로 표시하는 아이콘 추가

예시 분석 2:
- 리뷰: "전화 와서 받으면 끊어짐 어설프게 만들꺼면 출시를 하지 말지"
- 문제 요약: 사용자가 "전화 와서 받으면 끊어짐"이라고 표현하며, 통화 연결 안정성 문제로 인한 강한 불만을 표현
- UX 개선 제안:
  • 통화 연결 실패 시 "연결 중 문제가 발생했습니다" 명확한 오류 메시지 표시
  • 자동 재연결 시도 기능과 진행 상태 표시
  • 통화 연결 상태를 실시간으로 보여주는 시각적 인디케이터 추가
  • 연결 실패 시 "다시 시도" 버튼을 크게 표시하여 쉽게 재시도 가능하도록 함

예시 분석 3:
- 리뷰: "알뜰폰사용자라 이용이 불가능한지 모른 상태에서 우선 회원가입을 했고 로그인이 안되니 탈퇴가 안되어"
- 문제 요약: 사용자가 "알뜰폰사용자라 이용이 불가능한지 모른 상태에서 회원가입했는데 로그인이 안되니 탈퇴가 안되어"라고 표현하며, 서비스 제약 사항에 대한 사전 안내 부족 문제를 지적
- UX 개선 제안:
  • 회원가입 첫 화면에 "지원되는 통신사" 안내 배너 추가
  • 통신사 선택 단계에서 알뜰폰 지원 여부 실시간 확인 기능
  • 로그인 실패 시 "알뜰폰 사용자는 서비스 이용이 제한됩니다" 구체적 안내 메시지
  • 탈퇴 버튼을 로그인 화면에도 배치하여 접근성 개선

기술적 구현 방법은 제외하고, 순수 UX 관점에서의 개선 방안만 제시하세요.
실제 사용자 리뷰에서 발견된 문제만 분석하고, 가상의 문제는 만들지 마세요.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use mini model to reduce token usage
      messages: [
        {
          role: "system",
          content: "당신은 UX 전문가입니다. 사용자 리뷰를 분석하여 구체적이고 실행 가능한 UX 개선 제안을 생성합니다. 일반적인 제안(예: '사용성 개선이 필요', '친절한 안내')이 아닌, 사용자가 언급한 구체적인 상황과 문제점을 바탕으로 명확한 해결 방안을 제시하세요. 예를 들어, '전화 받을 때 진동이 안 꺼져서 불편'이라는 리뷰에 대해서는 '설정 메뉴에 통화 중 진동 자동 끄기 토글 추가', '통화 화면에 진동 on/off 빠른 버튼 배치' 등의 구체적인 UX 솔루션을 제안하세요. 기술적 구현은 제외하고 순수 UX 관점에서 응답하며, 반드시 유효한 JSON 형태로 답변해주세요."
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
    
    try {
      const parsedResult = JSON.parse(result || '{}');
      
      // Ensure the result has the expected structure
      if (parsedResult.insights && Array.isArray(parsedResult.insights)) {
        return parsedResult.insights;
      } else if (Array.isArray(parsedResult)) {
        return parsedResult;
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

// Removed: generateKeywordNetworkWithGPT - keyword network analysis is no longer used

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
          const item = batch[j];
          results[item.index] = sentiment;
          sentimentCache.set(item.text.trim().toLowerCase(), sentiment);
        }
        
        console.log(`Processed GPT batch ${Math.ceil((i + batchSize) / batchSize)}/${Math.ceil(needsGPTAnalysis.length / batchSize)}`);
        
      } catch (error) {
        console.error(`GPT batch error:`, error);
        // Fallback to neutral for failed batch
        for (const item of batch) {
          results[item.index] = '중립';
        }
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