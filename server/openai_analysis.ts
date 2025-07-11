import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeReviewSentimentWithGPT(reviewText: string): Promise<'긍정' | '부정' | '중립'> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional Korean sentiment analysis assistant. Analyze the given review text and respond only with one of these exact words: 긍정, 부정, 중립. Consider the overall tone, context, and emotional expression in Korean language patterns."
        },
        {
          role: "user",
          content: `이 리뷰의 감정을 분석해주세요:\n\n"${reviewText}"`
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    });

    const result = response.choices[0].message.content?.trim();
    
    // Ensure the response is one of the expected values
    if (result === '긍정' || result === '부정' || result === '중립') {
      return result;
    }
    
    // Fallback: if GPT doesn't return expected format, use basic keyword analysis
    console.warn(`GPT returned unexpected sentiment: ${result}, falling back to keyword analysis`);
    return analyzeReviewSentimentFallback(reviewText);
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to keyword-based analysis if GPT fails
    return analyzeReviewSentimentFallback(reviewText);
  }
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