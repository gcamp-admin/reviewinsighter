import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeReviewSentimentWithGPT, analyzeReviewSentimentBatch } from "./openai_analysis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getReviewsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  source: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
    if (typeof val === 'string') return [val];
    return val;
  }),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const collectReviewsSchema = z.object({
  appId: z.string().optional().default('com.lguplus.sohoapp'),
  appIdApple: z.string().optional().default('1571096278'),
  count: z.coerce.number().min(1).max(500).optional().default(100),
  sources: z.array(z.enum(['google_play', 'app_store', 'naver_blog', 'naver_cafe'])).optional().default(['google_play']),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get reviews with pagination and filtering
  app.get("/api/reviews", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Handle source parameter (can be string or array)
      let source: string[] | undefined;
      if (req.query.source) {
        const sourceParam = req.query.source;
        if (Array.isArray(sourceParam)) {
          source = sourceParam.map(s => String(s));
        } else {
          source = [String(sourceParam)];
        }
      }
      
      // Handle date parameters
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      // Handle sentiment parameter
      const sentiment = req.query.sentiment as string;
      
      // Handle service ID parameter
      const serviceId = req.query.serviceId as string;
      
      const filters = {
        serviceId: serviceId || undefined,
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sentiment: sentiment && sentiment !== "all" ? sentiment : undefined
      };

      const result = await storage.getReviews(page, limit, filters);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid query parameters" });
    }
  });

  // Get review statistics (with filtering support)
  app.get("/api/reviews/stats", async (req, res) => {
    try {
      // Handle source parameter (can be string or array)
      let source: string[] | undefined;
      if (req.query.source) {
        const sourceParam = req.query.source;
        if (Array.isArray(sourceParam)) {
          source = sourceParam.map(s => String(s));
        } else {
          source = [String(sourceParam)];
        }
      }
      
      // Handle date parameters
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      // Handle sentiment parameter
      const sentiment = req.query.sentiment as string;
      
      // Handle service ID parameter
      const serviceId = req.query.serviceId as string;
      
      const filters = {
        serviceId: serviceId || undefined,
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sentiment: sentiment && sentiment !== "all" ? sentiment : undefined
      };

      const stats = await storage.getReviewStats(filters);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get review statistics" });
    }
  });

  // Get UX insights (with filtering support)
  app.get("/api/insights", async (req, res) => {
    try {
      // Handle source parameter (can be string or array)
      let source: string[] | undefined;
      if (req.query.source) {
        const sourceParam = req.query.source;
        if (Array.isArray(sourceParam)) {
          source = sourceParam.map(s => String(s));
        } else {
          source = [String(sourceParam)];
        }
      }
      
      // Handle date parameters
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      const serviceId = req.query.serviceId as string | undefined;
      
      const filters = {
        serviceId: serviceId || undefined,
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const insights = await storage.getInsights(filters);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to get insights" });
    }
  });

  // Get word cloud data (with filtering support)
  app.get("/api/wordcloud/:sentiment", async (req, res) => {
    try {
      const { sentiment } = req.params;
      const validSentiments = ['positive', 'negative', '긍정', '부정'];
      if (!validSentiments.includes(sentiment)) {
        return res.status(400).json({ error: "Invalid sentiment. Must be 'positive', 'negative', '긍정', or '부정'" });
      }
      
      // Handle source parameter (can be string or array)
      let source: string[] | undefined;
      if (req.query.source) {
        const sourceParam = req.query.source;
        if (Array.isArray(sourceParam)) {
          source = sourceParam.map(s => String(s));
        } else {
          source = [String(sourceParam)];
        }
      }
      
      // Handle date parameters
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      const serviceId = req.query.serviceId as string | undefined;
      
      const filters = {
        serviceId: serviceId || undefined,
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };
      
      const wordCloudData = await storage.getWordCloudData(sentiment, filters);
      res.json(wordCloudData);
    } catch (error) {
      res.status(500).json({ error: "Failed to get word cloud data" });
    }
  });

  // Collect reviews endpoint with Python scraper
  app.post("/api/reviews/collect", async (req, res) => {
    try {
      // Parse the new JSON structure with filtering support
      const { selectedService, selectedChannels, appId, appIdApple, count, serviceId, serviceName, startDate, endDate } = req.body;
      
      // Convert selectedChannels to sources array
      const sources = [];
      if (selectedChannels?.googlePlay) sources.push('google_play');
      if (selectedChannels?.appleStore) sources.push('app_store');
      if (selectedChannels?.naverBlog) sources.push('naver_blog');
      if (selectedChannels?.naverCafe) sources.push('naver_cafe');
      
      // Use the original schema for validation but with converted sources
      const validatedData = collectReviewsSchema.parse({
        appId: appId || 'com.lguplus.sohoapp',
        appIdApple: appIdApple || '1571096278',
        count: count || 500,
        sources: sources.length > 0 ? sources : ['google_play']
      });
      
      // Clear existing analysis data for this service when collecting new reviews
      if (serviceId) {
        await storage.clearAnalysisData(serviceId);
      }
      
      if (validatedData.sources.length === 0) {
        return res.status(400).json({ 
          error: "At least one source must be selected",
          message: "최소 하나의 스토어를 선택해주세요."
        });
      }

      // Run Python scraper with multiple sources and filtering
      const scraperPath = path.join(__dirname, 'scraper.py');
      const sourcesStr = validatedData.sources.join(',');
      
      // Build command line arguments with filtering parameters
      const args = [
        scraperPath,
        validatedData.appId,
        validatedData.appIdApple,
        validatedData.count.toString(),
        sourcesStr,
        serviceId || '',
        selectedService || serviceName || '',
        startDate || '',
        endDate || ''
      ];
      
      console.log(`Running Python scraper with filters: ${args.join(' ')}`);
      const pythonProcess = spawn('python3', args);
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          console.error('Python scraper error:', stderr);
          return res.status(500).json({ 
            error: "Scraper execution failed",
            message: "리뷰 수집 중 오류가 발생했습니다."
          });
        }
        
        try {
          const result = JSON.parse(stdout);
          
          if (!result.success) {
            return res.status(500).json({
              error: result.error,
              message: result.message
            });
          }
          
          // Store collected reviews with serviceId
          const storedReviews = [];
          for (const reviewData of result.reviews) {
            const review = await storage.createReview({
              ...reviewData,
              serviceId: serviceId || null,
              appId: reviewData.source === 'google_play' ? appId : appIdApple
            });
            storedReviews.push(review);
          }
          
          // Update sentiment analysis for reviews using optimized batch processing
          if (storedReviews.length > 0) {
            try {
              // Extract review texts for batch processing
              const reviewTexts = storedReviews.map(review => review.content);
              
              // Call GPT batch sentiment analysis endpoint
              const sentimentResponse = await fetch('http://localhost:5000/api/gpt-sentiment-batch', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  texts: reviewTexts
                })
              });
              
              if (sentimentResponse.ok) {
                const sentimentData = await sentimentResponse.json();
                // Update reviews with sentiment analysis results
                for (let i = 0; i < storedReviews.length; i++) {
                  const sentiment = sentimentData.sentiments[i];
                  await storage.updateReview(storedReviews[i].id, { sentiment });
                }
                console.log(`Batch sentiment analysis completed for ${storedReviews.length} reviews`);
              } else {
                console.error('Batch sentiment analysis failed, falling back to individual analysis');
                // Fallback to individual analysis
                for (const review of storedReviews) {
                  try {
                    const individualResponse = await fetch('http://localhost:5000/api/gpt-sentiment', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        text: review.content
                      })
                    });
                    
                    if (individualResponse.ok) {
                      const sentimentData = await individualResponse.json();
                      await storage.updateReview(review.id, { sentiment: sentimentData.sentiment });
                    }
                  } catch (error) {
                    console.error(`Failed to analyze sentiment for review ${review.id}:`, error);
                  }
                }
              }
            } catch (error) {
              console.error('Batch sentiment analysis error:', error);
            }
          }
          
          // Don't store insights and word cloud data from scraper
          // They will be generated dynamically from the collected reviews
          
          res.json({
            success: true,
            message: `${result.reviews.length}개의 리뷰를 성공적으로 수집했습니다.`,
            reviewsCount: result.reviews.length,
            insightsCount: result.analysis?.insights?.length || 0,
            selectedService: selectedService,
            selectedChannels: selectedChannels,
            sources: validatedData.sources
          });
          
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          res.status(500).json({
            error: "Failed to parse scraper output",
            message: "수집 결과 처리 중 오류가 발생했습니다."
          });
        }
      });
      
    } catch (error) {
      console.error('Collect reviews error:', error);
      res.status(500).json({ 
        error: "Failed to collect reviews",
        message: "리뷰 수집 중 오류가 발생했습니다."
      });
    }
  });

  // AI Analysis endpoint - separate from collection
  app.post("/api/analyze", async (req, res) => {
    try {
      const { serviceId, serviceName, source, dateFrom, dateTo, analysisType } = req.body;
      
      // Get existing reviews for analysis
      const existingReviews = await storage.getReviews(1, 1000, { 
        serviceId: serviceId,
        source: source,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined
      });
      
      if (existingReviews.reviews.length === 0) {
        return res.status(400).json({ success: false, message: "분석할 리뷰가 없습니다. 먼저 리뷰를 수집해주세요." });
      }
      
      // Convert reviews to format expected by scraper
      const reviewsForAnalysis = existingReviews.reviews.map(review => ({
        userId: review.userId,
        source: review.source,
        rating: review.rating,
        content: review.content,
        sentiment: review.sentiment,
        createdAt: review.createdAt.toISOString(),
      }));
      
      // Run analysis on existing reviews based on analysis type
      const analysisFunction = analysisType === 'wordcloud' ? 'extract_korean_words_advanced' : 'analyze_sentiments';
      const pythonProcess = spawn("python", ["-c", `
import sys
import json
sys.path.append('server')
from scraper import analyze_sentiments, extract_korean_words_advanced

# Read reviews and analysis type from input
reviews_data = json.loads(sys.argv[1])
analysis_type = sys.argv[2] if len(sys.argv) > 2 else 'full'

if analysis_type == 'wordcloud':
    # Extract word cloud data only
    positive_reviews = [r for r in reviews_data if r.get('sentiment') == '긍정']
    negative_reviews = [r for r in reviews_data if r.get('sentiment') == '부정']
    
    positive_words = extract_korean_words_advanced([r['content'] for r in positive_reviews], 'positive', 10) if positive_reviews else []
    negative_words = extract_korean_words_advanced([r['content'] for r in negative_reviews], 'negative', 10) if negative_reviews else []
    
    result = {
        'wordCloud': {
            'positive': positive_words,
            'negative': negative_words
        }
    }
elif analysis_type == 'heart':
    # Generate HEART insights only
    result = analyze_sentiments(reviews_data)
    # Remove word cloud data from result
    if 'wordCloud' in result:
        del result['wordCloud']
else:
    # Full analysis (backward compatibility)
    result = analyze_sentiments(reviews_data)

print(json.dumps(result, ensure_ascii=False))
      `, JSON.stringify(reviewsForAnalysis), analysisType || 'full']);
      
      let output = "";
      let error = "";
      
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
      });
      
      pythonProcess.on("close", async (code) => {
        if (code !== 0) {
          console.error("Python analysis error:", error);
          return res.status(500).json({ success: false, message: "AI 분석 중 오류가 발생했습니다." });
        }
        
        try {
          const result = JSON.parse(output);
          
          let insightsStored = 0;
          let wordCloudStored = 0;
          
          // Store insights (only for heart analysis or full analysis)
          if (result.insights && result.insights.length > 0 && (analysisType === 'heart' || !analysisType)) {
            // For HEART analysis, use GPT-based analysis
            if (analysisType === 'heart') {
              try {
                const { analyzeHeartFrameworkWithGPT } = await import('./openai_analysis');
                const gptInsights = await analyzeHeartFrameworkWithGPT(reviewsForAnalysis);
                
                for (const insight of gptInsights) {
                  try {
                    await storage.createInsight({
                      title: insight.title,
                      description: `**HEART 항목**: ${insight.category}\n**문제 요약**: ${insight.problem_summary}\n**UX 개선 제안**: ${insight.ux_suggestions}\n**우선순위**: ${insight.priority.toUpperCase()}`,
                      priority: insight.priority,
                      mentionCount: insight.mention_count,
                      trend: insight.trend,
                      category: insight.category,
                      serviceId: serviceId,
                    });
                    insightsStored++;
                  } catch (err) {
                    console.error("Error storing GPT insight:", err);
                  }
                }
              } catch (gptError) {
                console.error("GPT analysis failed, falling back to Python analysis:", gptError);
                // Fallback to Python analysis
                for (const insight of result.insights) {
                  try {
                    await storage.createInsight({
                      title: insight.title,
                      description: insight.description,
                      priority: insight.priority,
                      mentionCount: insight.mentionCount,
                      trend: insight.trend,
                      category: insight.category,
                      serviceId: serviceId,
                    });
                    insightsStored++;
                  } catch (err) {
                    console.error("Error storing insight:", err);
                  }
                }
              }
            } else {
              // For full analysis, use Python analysis
              for (const insight of result.insights) {
                try {
                  await storage.createInsight({
                    title: insight.title,
                    description: insight.description,
                    priority: insight.priority,
                    mentionCount: insight.mentionCount,
                    trend: insight.trend,
                    category: insight.category,
                    serviceId: serviceId,
                  });
                  insightsStored++;
                } catch (err) {
                  console.error("Error storing insight:", err);
                }
              }
            }
          }
          
          // Store word cloud data (only for wordcloud analysis or full analysis)
          if (analysisType === 'wordcloud' || !analysisType) {
            // For wordcloud analysis, use GPT-based analysis
            if (analysisType === 'wordcloud') {
              try {
                const { generateWordCloudWithGPT } = await import('./openai_analysis');
                const gptWordCloud = await generateWordCloudWithGPT(reviewsForAnalysis);
                
                // Store positive words
                for (const wordData of gptWordCloud.positive) {
                  try {
                    await storage.createWordCloudData({
                      word: wordData.word,
                      frequency: wordData.frequency,
                      sentiment: "긍정",
                      serviceId: serviceId,
                    });
                    wordCloudStored++;
                  } catch (err) {
                    console.error("Error storing GPT positive word cloud data:", err);
                  }
                }
                
                // Store negative words
                for (const wordData of gptWordCloud.negative) {
                  try {
                    await storage.createWordCloudData({
                      word: wordData.word,
                      frequency: wordData.frequency,
                      sentiment: "부정",
                      serviceId: serviceId,
                    });
                    wordCloudStored++;
                  } catch (err) {
                    console.error("Error storing GPT negative word cloud data:", err);
                  }
                }
              } catch (gptError) {
                console.error("GPT word cloud analysis failed, falling back to Python analysis:", gptError);
                // Fallback to Python analysis
                if (result.wordCloud) {
                  const allWordCloudData = [
                    ...(result.wordCloud.positive || []),
                    ...(result.wordCloud.negative || [])
                  ];
                  
                  for (const wordData of allWordCloudData) {
                    try {
                      await storage.createWordCloudData({
                        word: wordData.word,
                        frequency: wordData.frequency,
                        sentiment: wordData.sentiment,
                        serviceId: serviceId,
                      });
                      wordCloudStored++;
                    } catch (err) {
                      console.error("Error storing word cloud data:", err);
                    }
                  }
                }
              }
            } else if (result.wordCloud) {
              // For full analysis, use Python analysis
              const allWordCloudData = [
                ...(result.wordCloud.positive || []),
                ...(result.wordCloud.negative || [])
              ];
              
              for (const wordData of allWordCloudData) {
                try {
                  await storage.createWordCloudData({
                    word: wordData.word,
                    frequency: wordData.frequency,
                    sentiment: wordData.sentiment,
                    serviceId: serviceId,
                  });
                  wordCloudStored++;
                } catch (err) {
                  console.error("Error storing word cloud data:", err);
                }
              }
            }
          }
          
          // Generate appropriate response message based on analysis type
          let responseMessage = '';
          if (analysisType === 'wordcloud') {
            responseMessage = `${wordCloudStored}개의 감정 워드를 생성했습니다.`;
          } else if (analysisType === 'heart') {
            responseMessage = `${insightsStored}개의 UX 개선 제안을 생성했습니다.`;
          } else {
            responseMessage = `${insightsStored}개의 UX 개선 제안과 ${wordCloudStored}개의 감정 워드를 생성했습니다.`;
          }
          
          res.json({
            success: true,
            message: responseMessage,
            insightsCount: insightsStored,
            wordCloudCount: wordCloudStored,
            analysisType: analysisType
          });
        } catch (parseError) {
          console.error("Error parsing Python analysis output:", parseError);
          res.status(500).json({ success: false, message: "AI 분석 결과 처리 중 오류가 발생했습니다." });
        }
      });
    } catch (error) {
      console.error("Error in analyze endpoint:", error);
      res.status(500).json({ success: false, message: "AI 분석 중 오류가 발생했습니다." });
    }
  });

  // GPT Sentiment Analysis endpoint
  app.post("/api/gpt-sentiment", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }
      
      const sentiment = await analyzeReviewSentimentWithGPT(text);
      
      res.json({
        sentiment: sentiment,
        text: text
      });
    } catch (error) {
      console.error('GPT sentiment analysis error:', error);
      res.status(500).json({ error: "Failed to analyze sentiment" });
    }
  });

  // GPT Batch Sentiment Analysis endpoint
  app.post("/api/gpt-sentiment-batch", async (req, res) => {
    try {
      const { texts } = req.body;
      
      if (!Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: "Texts must be a non-empty array" });
      }
      
      if (texts.some(text => typeof text !== 'string')) {
        return res.status(400).json({ error: "All texts must be strings" });
      }
      
      const sentiments = await analyzeReviewSentimentBatch(texts);
      
      res.json({
        sentiments: sentiments,
        count: texts.length
      });
    } catch (error) {
      console.error('GPT batch sentiment analysis error:', error);
      res.status(500).json({ error: "Failed to analyze sentiments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
