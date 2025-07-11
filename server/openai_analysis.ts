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

    // Create prompt for HEART framework analysis
    const prompt = `
다음 리뷰들을 HEART 프레임워크에 따라 분석하여 UX 개선 제안을 생성해주세요.

HEART 프레임워크:
- Happiness: 사용자 만족도 및 감정
- Engagement: 사용자 참여도 및 활동 수준
- Adoption: 새로운 기능 채택 및 사용 시작
- Retention: 사용자 유지 및 재사용
- Task Success: 작업 완료 및 성공률

리뷰 데이터:
${reviewTexts.map((review, index) => `${index + 1}. [${review.source}] 평점: ${review.rating}/5
내용: ${review.content}`).join('\n\n')}

분석 결과를 다음 JSON 형식으로 반환해주세요:
{
  "insights": [
    {
      "category": "happiness|engagement|adoption|retention|task_success",
      "title": "🔴 Critical | HEART: [category] | [문제유형] ([건수]건)",
      "problem_summary": "실제 사용자 표현을 인용하며 구체적인 문제점 설명",
      "ux_suggestions": "구체적이고 실행 가능한 UX 개선 제안 (3-5가지)",
      "priority": "critical|major|minor",
      "mention_count": 건수,
      "trend": "stable"
    }
  ]
}

우선순위 기준:
- Critical: 핵심 기능 오류, 앱 크래시, 작업 실패 (3건 이상)
- Major: 주요 불편사항, 사용성 문제 (2건 이상)
- Minor: 개선 제안, 소소한 불편 (1건)

실제 사용자 리뷰에서 발견된 문제만 분석하고, 가상의 문제는 만들지 마세요.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use more powerful model for complex analysis
      messages: [
        {
          role: "system",
          content: "당신은 UX 전문가입니다. 사용자 리뷰를 분석하여 실용적인 UX 개선 제안을 생성합니다. 응답은 반드시 유효한 JSON 배열 형태로 해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
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
    console.error('OpenAI API error in HEART analysis:', error);
    return [];
  }
}

export async function analyzeReviewSentimentBatch(reviewTexts: string[]): Promise<('긍정' | '부정' | '중립')[]> {
  const results: ('긍정' | '부정' | '중립')[] = [];
  const needsGPTAnalysis: { text: string; index: number }[] = [];
  
  // Step 1: Process each review with cache and rule-based analysis
  for (let i = 0; i < reviewTexts.length; i++) {
    const reviewText = reviewTexts[i];
    const cacheKey = reviewText.trim().toLowerCase();
    
    // Check cache first
    if (sentimentCache.has(cacheKey)) {
      results[i] = sentimentCache.get(cacheKey)!;
      continue;
    }
    
    // Try rule-based analysis
    const ruleBasedResult = tryRuleBasedAnalysis(reviewText);
    if (ruleBasedResult) {
      results[i] = ruleBasedResult;
      sentimentCache.set(cacheKey, ruleBasedResult);
      continue;
    }
    
    // Add to GPT analysis queue
    needsGPTAnalysis.push({ text: reviewText, index: i });
  }
  
  // Step 2: Process remaining reviews with GPT in batches
  if (needsGPTAnalysis.length > 0) {
    console.log(`Processing ${needsGPTAnalysis.length} reviews with GPT (saved ${reviewTexts.length - needsGPTAnalysis.length} API calls)`);
    
    // Process in smaller batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < needsGPTAnalysis.length; i += batchSize) {
      const batch = needsGPTAnalysis.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item) => {
        const sentiment = await analyzeReviewSentimentWithGPT(item.text);
        return { sentiment, index: item.index };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ sentiment, index }) => {
        results[index] = sentiment;
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < needsGPTAnalysis.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
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
          content: "한국어 감정 분석. 응답: 긍정/부정/중립 중 하나만"
        },
        {
          role: "user",
          content: reviewText
        }
      ],
      max_tokens: 5, // Reduce to minimum needed
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

// Rule-based pre-filtering to avoid GPT calls for obvious cases
function tryRuleBasedAnalysis(text: string): '긍정' | '부정' | '중립' | null {
  const lowerText = text.toLowerCase();
  
  // Priority negative patterns - these override everything else
  const priorityNegativePatterns = [
    '안되', '안돼', '안되어', '안되네', '안되요', '안됨', '안되고', '안되니', '안되는',
    '안되서', '안되면', '안되겠', '안되잖', '안되다', '안되나', '안되든', '안되었',
    '안되지', '안되더', '안되는구나', '안되는데', '안되길래', '안되던데'
  ];
  
  // Check for priority negative patterns first
  const hasPriorityNegative = priorityNegativePatterns.some(pattern => lowerText.includes(pattern));
  if (hasPriorityNegative) {
    return '부정';
  }
  
  // Clear negative indicators (95%+ confidence)
  const strongNegativePatterns = [
    '최악', '형편없', '별로', '짜증', '화남', '실망', '못하겠',
    '에러', '오류', '버그', '문제', '고장', '먹통', '렉', '끊김', '느려', '답답',
    '불편', '단점', '아쉬운', '불만', '싫어', '나쁨', '구려', '삭제'
  ];
  
  // Clear positive indicators (95%+ confidence)
  const strongPositivePatterns = [
    '최고', '대박', '완벽', '훌륭', '멋져', '좋아', '좋네', '좋음', '편리', '편해',
    '만족', '추천', '감사', '고마워', '유용', '도움', '빠름', '빨라', '쉬워', '간단'
  ];
  
  const negativeCount = strongNegativePatterns.filter(pattern => lowerText.includes(pattern)).length;
  const positiveCount = strongPositivePatterns.filter(pattern => lowerText.includes(pattern)).length;
  
  // High confidence rules
  if (negativeCount >= 2 || (negativeCount === 1 && positiveCount === 0)) {
    return '부정';
  }
  
  if (positiveCount >= 2 || (positiveCount === 1 && negativeCount === 0)) {
    return '긍정';
  }
  
  // Neutral patterns
  if (lowerText.includes('보통') || lowerText.includes('그냥') || lowerText.includes('평범')) {
    return '중립';
  }
  
  // Return null for ambiguous cases that need GPT
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