import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { analyzeReviewSentimentWithGPT, analyzeReviewSentimentBatch, analyzeHeartFrameworkWithGPT, generateClusterLabel } from "./openai_analysis";
import { insertReviewSchema } from "../shared/schema";

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
      const limit = parseInt((req.query.pageSize || req.query.limit) as string) || 5;
      
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
      
      // Handle date parameters - use startDate/endDate parameters
      const dateFrom = (req.query.startDate || req.query.dateFrom) ? new Date((req.query.startDate || req.query.dateFrom) as string) : undefined;
      const dateTo = (req.query.endDate || req.query.dateTo) ? new Date((req.query.endDate || req.query.dateTo) as string) : undefined;
      
      // Handle sentiment parameter
      const sentiment = req.query.sentiment as string;
      
      // Handle service ID parameter  
      const serviceId = (req.query.serviceId || req.query.service) as string;
      
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
      
      // Handle date parameters - use startDate/endDate parameters for stats
      const dateFrom = (req.query.startDate || req.query.dateFrom) ? new Date((req.query.startDate || req.query.dateFrom) as string) : undefined;
      const dateTo = (req.query.endDate || req.query.dateTo) ? new Date((req.query.endDate || req.query.dateTo) as string) : undefined;
      
      // Handle sentiment parameter
      const sentiment = req.query.sentiment as string;
      
      // Handle service ID parameter
      const serviceId = (req.query.serviceId || req.query.service) as string;
      
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
      
      const serviceId = (req.query.serviceId || req.query.service) as string | undefined;
      
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
      const validSentiments = ['positive', 'negative', 'neutral', '긍정', '부정', '중립'];
      if (!validSentiments.includes(sentiment)) {
        return res.status(400).json({ error: "Invalid sentiment. Must be 'positive', 'negative', 'neutral', '긍정', '부정', or '중립'" });
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
      
      const serviceId = (req.query.serviceId || req.query.service) as string | undefined;
      
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

  // Create a new review (for Python crawler)
  app.post("/api/reviews/create", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.json(review);
    } catch (error) {
      console.error('Review creation error:', error);
      res.status(400).json({ error: "Invalid review data" });
    }
  });

  // Collect reviews endpoint with Python scraper
  app.post("/api/reviews/collect", async (req, res) => {
    try {
      // Parse the new JSON structure with filtering support
      const { selectedService, selectedChannels, appId, appIdApple, count, serviceId, serviceName, startDate, endDate } = req.body;
      
      // Convert selectedChannels to sources array
      const sources: string[] = [];
      
      // Handle both array and object formats for selectedChannels
      if (Array.isArray(selectedChannels)) {
        // Array format: ["google_play", "apple_store", ...]
        sources.push(...selectedChannels);
      } else if (selectedChannels && typeof selectedChannels === 'object') {
        // Object format: { googlePlay: true, appleStore: false, ... }
        if (selectedChannels?.googlePlay) sources.push('google_play');
        if (selectedChannels?.appleStore) sources.push('app_store');
        if (selectedChannels?.naverBlog) sources.push('naver_blog');
        if (selectedChannels?.naverCafe) sources.push('naver_cafe');
      }
      
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

      // Run Python crawler with multiple sources and filtering
      const isProduction = process.env.NODE_ENV === 'production';
      const crawlerPath = isProduction 
        ? path.join(process.cwd(), 'run_crawler.py')  // In production, scripts are in root
        : path.join(process.cwd(), 'server/run_crawler.py'); // In development, scripts are in server/
      
      // Build command line arguments with new crawler structure
      const crawlerArgs = {
        serviceName: selectedService || serviceName || '익시오',
        selectedChannels: {
          googlePlay: sources.includes('google_play'),
          appleStore: sources.includes('app_store') || sources.includes('apple_store'),
          naverBlog: sources.includes('naver_blog'),
          naverCafe: sources.includes('naver_cafe')
        },
        startDate: startDate || null,
        endDate: endDate || null,
        count: count || 100
      };
      
      const args = [
        crawlerPath,
        JSON.stringify(crawlerArgs)
      ];
      
      console.log(`Running Python crawler with filters: ${JSON.stringify(crawlerArgs)}`);
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
          // Check if crawler completed successfully
          if (stdout.includes('Crawler completed successfully')) {
            // Get the number of reviews collected from the output
            const reviewCountMatch = stdout.match(/Successfully processed (\d+) reviews/);
            const reviewCount = reviewCountMatch ? parseInt(reviewCountMatch[1]) : 0;
            
            // Get collected reviews from storage
            const { reviews: storedReviews } = await storage.getReviews(1, 1000);
            
            // Check if reviews exist and show date range information
            if (storedReviews.length > 0) {
              const dates = storedReviews
                .map(r => new Date(r.createdAt))
                .filter(date => !isNaN(date.getTime())) // Filter out invalid dates
                .sort((a, b) => a.getTime() - b.getTime());
              
              if (dates.length > 0) {
                const oldestDate = dates[0].toISOString().split('T')[0];
                const newestDate = dates[dates.length - 1].toISOString().split('T')[0];
                console.log(`📅 수집된 리뷰 날짜 범위: ${oldestDate} ~ ${newestDate}`);
              }
            }
            
            // Return success response immediately, then start background sentiment analysis
            let message = `${reviewCount}개의 리뷰를 성공적으로 수집했습니다.`;
            
            // Send immediate response
            res.json({
              success: true,
              message: message,
              reviewsCount: reviewCount,
              insightsCount: 0,
              selectedService: selectedService || { name: serviceName || '익시오' },
              selectedChannels: selectedChannels || {},
              sources: sources
            });
            
            // Start background sentiment analysis AFTER sending response
            if (storedReviews.length > 0) {
              setImmediate(async () => {
                try {
                  console.log('🔄 Starting background sentiment analysis...');
                  
                  // Analyze ALL collected reviews for sentiment, not just filtered ones
                  let reviewsToAnalyze = storedReviews;
                  console.log(`Starting sentiment analysis for ${reviewsToAnalyze.length} total reviews`);
                  
                  // Only analyze reviews that don't already have sentiment analysis
                  reviewsToAnalyze = reviewsToAnalyze.filter(review => review.sentiment === "분석중");
                  console.log(`Found ${reviewsToAnalyze.length} reviews requiring sentiment analysis`);
                  
                  
                  if (reviewsToAnalyze.length > 0) {
                    // Extract review texts for batch processing (only for filtered reviews)
                    const reviewTexts = reviewsToAnalyze.map(review => review.content);
                    const sentiments = await analyzeReviewSentimentBatch(reviewTexts);
                    
                    // Update reviews with sentiment analysis results
                    for (let i = 0; i < reviewsToAnalyze.length; i++) {
                      const sentiment = sentiments[i];
                      await storage.updateReview(reviewsToAnalyze[i].id, { sentiment });
                      console.log(`Updated review ${reviewsToAnalyze[i].id} with sentiment: ${sentiment}`);
                    }
                    console.log(`✅ Batch sentiment analysis completed for ${reviewsToAnalyze.length} reviews`);
                  }
                } catch (error) {
                  console.error('❌ Background sentiment analysis failed:', error);
                }
              });
            }
            
            return;

          } else {
            return res.status(500).json({
              error: "Crawler did not complete successfully",
              message: "크롤링이 완료되지 않았습니다."
            });
          }
          
          console.log("Crawler completed successfully");
          
        } catch (parseError) {
          console.error('Crawler output processing error:', parseError);
          res.status(500).json({
            error: "Failed to process crawler output",
            message: "크롤러 출력 처리 중 오류가 발생했습니다."
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
      
      // Write reviews to temporary file to avoid E2BIG error
      const tempFilePath = path.join(process.cwd(), 'temp_analysis_data.json');
      
      try {
        fs.writeFileSync(tempFilePath, JSON.stringify(reviewsForAnalysis, null, 2));
        
        // Determine the correct Python script path based on environment
        const isProduction = process.env.NODE_ENV === 'production';
        const scriptPath = isProduction 
          ? path.join(process.cwd(), 'analyze_reviews.py')  // In production, scripts are in root
          : path.join(process.cwd(), 'server/analyze_reviews.py'); // In development, scripts are in server/
        
        // Run analysis using Python script file
        const pythonProcess = spawn("python3", [scriptPath, tempFilePath, analysisType || 'full']);
      
        let output = "";
        let error = "";
        
        pythonProcess.stdout.on("data", (data) => {
          output += data.toString();
        });
        
        pythonProcess.stderr.on("data", (data) => {
          error += data.toString();
        });
        
        pythonProcess.on("close", async (code) => {
          // Clean up temp file
          try {
            fs.unlinkSync(tempFilePath);
          } catch (cleanupError) {
            console.warn("Failed to cleanup temp file:", cleanupError);
          }
          
          if (code !== 0) {
            console.error("Python analysis error:", error);
            console.error("Python analysis stdout:", output);
            return res.status(500).json({ success: false, message: `AI 분석 중 오류가 발생했습니다: ${error}` });
          }
        
        try {
          const result = JSON.parse(output);
          
          let insightsStored = 0;
          let wordCloudStored = 0;
          
          // Store insights (only for heart analysis or full analysis)
          if (analysisType === 'heart') {
            try {
              console.log("Starting HEART framework analysis for", reviewsForAnalysis.length, "reviews");
              
              // Use reviews with sentiment classification
              const classifiedReviews = reviewsForAnalysis.map(r => ({
                ...r,
                sentiment: r.sentiment || '중립'
              }));
              
              const positiveCount = classifiedReviews.filter(r => r.sentiment === '긍정').length;
              const negativeCount = classifiedReviews.filter(r => r.sentiment === '부정').length;
              console.log(`Review classification: ${positiveCount} positive, ${negativeCount} negative`);
              
              const { analyzeHeartFrameworkWithGPT } = await import('./openai_analysis');
              const gptInsights = await analyzeHeartFrameworkWithGPT(classifiedReviews);
              
              for (const insight of gptInsights) {
                try {
                  await storage.createInsight({
                    title: insight.title,
                    description: insight.ux_suggestions?.join('\n') || 'UX 개선 제안이 필요합니다.',
                    problem_summary: insight.problem_summary,
                    competitor_benchmark: insight.competitor_benchmark,
                    ux_suggestions: insight.ux_suggestions,
                    priority: insight.priority,
                    mentionCount: 0,
                    trend: 'stable',
                    category: insight.category,
                    serviceId: serviceId,
                  });
                  insightsStored++;
                } catch (err) {
                  console.error("Error storing GPT insight:", err);
                }
              }
              
              console.log("Generated", gptInsights.length, "HEART insights");
                
            } catch (heartError) {
              console.error("HEART analysis failed:", heartError);
              // Use simple fallback analysis
              try {
                const { generateSimpleHeartInsights } = await import('./simple_heart_analysis');
                const simpleInsights = await generateSimpleHeartInsights(reviewsForAnalysis);
                
                for (const insight of simpleInsights) {
                  try {
                    await storage.createInsight({
                      title: insight.title,
                      description: insight.ux_suggestions,
                      priority: insight.priority,
                      mentionCount: insight.mention_count || 0,
                      trend: insight.trend || 'stable',
                      category: insight.category || 'general',
                    });
                    insightsStored++;
                  } catch (err) {
                    console.error("Error storing simple insight:", err);
                  }
                }
              } catch (fallbackError) {
                console.error("All HEART analysis methods failed:", fallbackError);
              }
            }
          } else if (result.insights && result.insights.length > 0) {
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
                });
                insightsStored++;
              } catch (err) {
                console.error("Error storing insight:", err);
              }
            }
          }
          
          // Store word cloud data (only for wordcloud analysis or full analysis)
          if (analysisType === 'wordcloud' || !analysisType) {
            // For wordcloud analysis, use GPT-based analysis
            if (analysisType === 'wordcloud') {
              try {
                console.log("Starting GPT word cloud analysis...");
                const { generateKeywordNetworkWithGPT } = await import('./openai_analysis');
                const gptNetwork = await generateKeywordNetworkWithGPT(reviewsForAnalysis);
                
                if (gptNetwork.positive && gptNetwork.positive.length > 0) {
                  console.log(`Generated ${gptNetwork.positive.length} positive keywords`);
                  // Store positive words
                  for (const wordData of gptNetwork.positive) {
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
                }
                
                if (gptNetwork.negative && gptNetwork.negative.length > 0) {
                  console.log(`Generated ${gptNetwork.negative.length} negative keywords`);
                  // Store negative words
                  for (const wordData of gptNetwork.negative) {
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
                }

                console.log(`Stored ${wordCloudStored} word cloud items via GPT`);
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
          console.error("Python output:", output);
          res.status(500).json({ success: false, message: `AI 분석 결과 처리 중 오류가 발생했습니다: ${String(parseError)}` });
        }
        });
      
      } catch (fileError) {
        console.error("Error writing temp file:", fileError);
        res.status(500).json({ success: false, message: `파일 생성 중 오류가 발생했습니다: ${String(fileError)}` });
      }
    } catch (error) {
      console.error("Error in analyze endpoint:", error);
      res.status(500).json({ success: false, message: `분석 시스템 오류: ${String(error)}` });
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

  // Keyword Network Analysis endpoint
  app.post("/api/keyword-network", async (req, res) => {
    try {
      const { serviceId, dateFrom, dateTo, method = 'cooccurrence' } = req.body;
      
      // Get reviews for the specified period
      const filters = {
        serviceId: serviceId || undefined,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined
      };
      
      const reviewsResult = await storage.getReviews(1, 1000, filters);
      const reviews = reviewsResult.reviews || [];
      
      console.log(`Retrieved ${reviews ? reviews.length : 'undefined'} reviews for keyword network analysis`);
      console.log(`Reviews type: ${Array.isArray(reviews) ? 'array' : typeof reviews}`);
      console.log(`Reviews content:`, reviews);
      
      if (!Array.isArray(reviews)) {
        console.error('Reviews is not an array:', reviews);
        return res.status(500).json({
          error: '데이터 타입 오류',
          message: '리뷰 데이터를 배열로 가져올 수 없습니다.'
        });
      }
      
      if (reviews.length < 5) {
        return res.json({
          error: '데이터 부족',
          message: '키워드 네트워크 분석을 위해서는 최소 5개 이상의 리뷰가 필요합니다. 더 많은 리뷰를 수집하거나 날짜 범위를 확장해주세요.'
        });
      }

      // Use Python-based keyword network analysis
      const analysisPath = path.join(__dirname, 'keyword_network_analysis.py');
      
      // Ensure reviews is an array and has the right structure
      let reviewsArray;
      try {
        reviewsArray = reviews.map(r => ({
          content: r.content,
          sentiment: r.sentiment,
          source: r.source
        }));
      } catch (error) {
        console.error('Error mapping reviews:', error);
        console.error('Reviews data:', reviews);
        return res.status(500).json({
          error: '리뷰 데이터 처리 오류',
          message: '리뷰 데이터를 처리할 수 없습니다.'
        });
      }
      
      // Write reviews to temporary file to avoid E2BIG error
      const tempNetworkFilePath = path.join(process.cwd(), 'temp_network_analysis.json');
      
      try {
        fs.writeFileSync(tempNetworkFilePath, JSON.stringify(reviewsArray, null, 2));
        
        const args = [
          'server/negative_keyword_analysis.py',
          tempNetworkFilePath
        ];
        
        console.log(`Running keyword network analysis for ${reviews.length} reviews`);
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
        // Clean up temp file
        try {
          fs.unlinkSync(tempNetworkFilePath);
        } catch (cleanupError) {
          console.warn("Failed to cleanup temp network file:", cleanupError);
        }
        
        if (code !== 0) {
          console.error('Keyword network analysis error:', stderr);
          console.error('Keyword network analysis stdout:', stdout);
          return res.status(500).json({ 
            error: "분석 실행 실패",
            message: `키워드 네트워크 분석 중 오류가 발생했습니다: ${stderr}`
          });
        }
        
        try {
          const result = JSON.parse(stdout);
          res.json(result);
        } catch (parseError) {
          console.error('Failed to parse keyword network result:', parseError);
          console.error('Network analysis output:', stdout);
          res.status(500).json({ 
            error: "결과 파싱 실패",
            message: `분석 결과를 처리하는 중 오류가 발생했습니다: ${String(parseError)}`
          });
        }
      });
      
      } catch (fileError) {
        console.error("Error writing temp network file:", fileError);
        res.status(500).json({ error: `파일 생성 중 오류가 발생했습니다: ${String(fileError)}` });
      }
      
    } catch (error) {
      console.error('Keyword network analysis error:', error);
      res.status(500).json({ error: `키워드 네트워크 분석 시스템 오류: ${String(error)}` });
    }
  });

  // Generate cluster label endpoint
  app.post("/api/generate-cluster-label", async (req, res) => {
    try {
      const { keywords } = req.body;
      if (!keywords || !Array.isArray(keywords)) {
        return res.status(400).json({ error: "keywords array is required" });
      }

      const label = await generateClusterLabel(keywords);
      res.json({ label });
    } catch (error) {
      console.error('Cluster label generation error:', error);
      res.status(500).json({ error: "Failed to generate cluster label" });
    }
  });

  // Get keyword network data (legacy endpoint)
  app.get("/api/keyword-network/:serviceId", async (req, res) => {
    try {
      const { serviceId } = req.params;
      const networkData = await storage.getKeywordNetwork(serviceId);
      
      res.json(networkData);
    } catch (error) {
      console.error('Error getting keyword network:', error);
      res.status(500).json({ error: "Failed to get keyword network" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
