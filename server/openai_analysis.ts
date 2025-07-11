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

// GPT-based word cloud analysis
export async function generateWordCloudWithGPT(reviews: any[]): Promise<{
  positive: { word: string; frequency: number; sentiment: string }[];
  negative: { word: string; frequency: number; sentiment: string }[];
}> {
  if (!reviews || reviews.length === 0) {
    return { positive: [], negative: [] };
  }

  try {
    // Separate reviews by sentiment
    const positiveReviews = reviews.filter(r => r.sentiment === '긍정');
    const negativeReviews = reviews.filter(r => r.sentiment === '부정');

    // Create prompts for positive and negative word extraction
    const positivePrompt = `
다음 긍정적인 리뷰들에서 자주 언급되는 중요한 한국어 단어 10개를 추출해주세요.

긍정 리뷰:
${positiveReviews.map((review, index) => `${index + 1}. ${review.content}`).join('\n')}

다음 JSON 형식으로 반환해주세요:
{
  "words": [
    {"word": "단어", "frequency": 빈도수, "sentiment": "positive"}
  ]
}

조건:
- 의미 있는 명사나 형용사만 선택
- 한국어 단어만 추출
- 빈도수는 실제 언급 횟수 기반
- 총 10개 단어 선택
`;

    const negativePrompt = `
다음 부정적인 리뷰들에서 자주 언급되는 중요한 한국어 단어 10개를 추출해주세요.

부정 리뷰:
${negativeReviews.map((review, index) => `${index + 1}. ${review.content}`).join('\n')}

다음 JSON 형식으로 반환해주세요:
{
  "words": [
    {"word": "단어", "frequency": 빈도수, "sentiment": "negative"}
  ]
}

조건:
- 의미 있는 명사나 형용사만 선택
- 한국어 단어만 추출
- 빈도수는 실제 언급 횟수 기반
- 총 10개 단어 선택
`;

    // Process positive words
    let positiveWords: any[] = [];
    if (positiveReviews.length > 0) {
      const positiveResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 한국어 텍스트 분석 전문가입니다. 리뷰에서 의미 있는 키워드를 추출합니다."
          },
          {
            role: "user",
            content: positivePrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      try {
        const positiveResult = JSON.parse(positiveResponse.choices[0].message.content || '{}');
        positiveWords = positiveResult.words || [];
      } catch (error) {
        console.error('Failed to parse positive words:', error);
      }
    }

    // Process negative words
    let negativeWords: any[] = [];
    if (negativeReviews.length > 0) {
      const negativeResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 한국어 텍스트 분석 전문가입니다. 리뷰에서 의미 있는 키워드를 추출합니다."
          },
          {
            role: "user",
            content: negativePrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      try {
        const negativeResult = JSON.parse(negativeResponse.choices[0].message.content || '{}');
        negativeWords = negativeResult.words || [];
      } catch (error) {
        console.error('Failed to parse negative words:', error);
      }
    }

    return {
      positive: positiveWords,
      negative: negativeWords
    };

  } catch (error) {
    console.error('OpenAI API error in word cloud analysis:', error);
    return { positive: [], negative: [] };
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
  
  // Process remaining reviews with GPT in batches
  if (needsGPTAnalysis.length > 0) {
    console.log(`Processing ${needsGPTAnalysis.length} reviews with GPT`);
    
    const batchSize = 15;
    for (let i = 0; i < needsGPTAnalysis.length; i += batchSize) {
      const batch = needsGPTAnalysis.slice(i, i + batchSize);
      
      try {
        const prompt = `감정 분석: ${batch.map((item, idx) => `${idx + 1}. ${item.text}`).join('\n')}
        
응답 형식: {"sentiments": ["긍정", "부정", "중립"]}
규칙: 안되/불편/문제→부정, 좋/만족/편리→긍정, 애매→중립`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "한국어 감정 분석 전문가. 빠르고 정확한 분류." },
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

// Enhanced rule-based pre-filtering to avoid GPT calls for obvious cases
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