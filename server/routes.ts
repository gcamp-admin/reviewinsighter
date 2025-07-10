import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

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
  sources: z.array(z.enum(['google_play', 'app_store'])).optional().default(['google_play']),
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
      if (!["positive", "negative"].includes(sentiment)) {
        return res.status(400).json({ error: "Invalid sentiment. Must be 'positive' or 'negative'" });
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
      const { appId, appIdApple, count, sources } = collectReviewsSchema.parse(req.body);
      const { serviceId, serviceName } = req.body;
      
      // Clear existing analysis data for this service when collecting new reviews
      if (serviceId) {
        await storage.clearAnalysisData(serviceId);
      }
      
      if (sources.length === 0) {
        return res.status(400).json({ 
          error: "At least one source must be selected",
          message: "최소 하나의 스토어를 선택해주세요."
        });
      }

      // Run Python scraper with multiple sources
      const scraperPath = path.join(__dirname, 'scraper.py');
      const sourcesStr = sources.join(',');
      const pythonProcess = spawn('python3', [scraperPath, appId, appIdApple, count.toString(), sourcesStr, serviceId || '', serviceName || '']);
      
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
          for (const reviewData of result.reviews) {
            await storage.createReview({
              ...reviewData,
              serviceId: serviceId || null,
              appId: reviewData.source === 'google_play' ? appId : appIdApple
            });
          }
          
          // Don't store insights and word cloud data from scraper
          // They will be generated dynamically from the collected reviews
          
          res.json({
            success: true,
            message: `${result.reviews.length}개의 리뷰를 성공적으로 수집했습니다.`,
            reviewsCount: result.reviews.length,
            insightsCount: result.analysis?.insights?.length || 0
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
      const { serviceId, serviceName, source, dateFrom, dateTo } = req.body;
      
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
      
      // Run analysis on existing reviews
      const pythonProcess = spawn("python", ["-c", `
import sys
import json
sys.path.append('server')
from scraper import analyze_sentiments

# Read reviews from input
reviews_data = json.loads(sys.argv[1])
result = analyze_sentiments(reviews_data)
print(json.dumps(result, ensure_ascii=False))
      `, JSON.stringify(reviewsForAnalysis)]);
      
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
          
          // Store insights
          if (result.insights && result.insights.length > 0) {
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
          
          // Store word cloud data
          if (result.wordCloud) {
            // Handle both positive and negative word clouds
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
          
          res.json({
            success: true,
            message: `${insightsStored}개의 UX 개선 제안과 ${wordCloudStored}개의 감정 워드를 생성했습니다.`,
            insightsCount: insightsStored,
            wordCloudCount: wordCloudStored
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

  // Export reviews endpoint
  app.get("/api/export/reviews", async (req, res) => {
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
      
      // Handle service ID parameter
      const serviceId = req.query.serviceId as string;
      
      // Handle format parameter
      const format = req.query.format as string || 'csv';
      
      const filters = {
        serviceId: serviceId || undefined,
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      // Get all reviews without pagination for export
      const result = await storage.getReviews(1, 10000, filters);
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="reviews.json"');
        res.json(result.reviews);
      } else if (format === 'csv') {
        // Generate CSV
        const headers = ['ID', 'User ID', 'Source', 'Service ID', 'Rating', 'Content', 'Sentiment', 'Created At'];
        const csvRows = [headers.join(',')];
        
        result.reviews.forEach(review => {
          const row = [
            review.id,
            `"${review.userId}"`,
            review.source,
            review.serviceId || '',
            review.rating,
            `"${review.content.replace(/"/g, '""')}"`,
            review.sentiment,
            review.createdAt.toISOString()
          ];
          csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="reviews.csv"');
        res.send('\uFEFF' + csvContent); // Add BOM for proper UTF-8 encoding
      } else {
        res.status(400).json({ error: 'Unsupported format. Use csv or json.' });
      }
    } catch (error) {
      console.error('Export reviews error:', error);
      res.status(500).json({ error: 'Failed to export reviews' });
    }
  });

  // Export insights endpoint
  app.get("/api/export/insights", async (req, res) => {
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
      
      // Handle service ID parameter
      const serviceId = req.query.serviceId as string;
      
      // Handle format parameter
      const format = req.query.format as string || 'csv';
      
      const filters = {
        serviceId: serviceId || undefined,
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const insights = await storage.getInsights(filters);
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="insights.json"');
        res.json(insights);
      } else if (format === 'csv') {
        // Generate CSV
        const headers = ['ID', 'Title', 'Description', 'Priority', 'Mention Count', 'Trend', 'Category'];
        const csvRows = [headers.join(',')];
        
        insights.forEach(insight => {
          const row = [
            insight.id,
            `"${insight.title}"`,
            `"${insight.description.replace(/"/g, '""')}"`,
            insight.priority,
            insight.mentionCount,
            insight.trend || '',
            insight.category
          ];
          csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="insights.csv"');
        res.send('\uFEFF' + csvContent); // Add BOM for proper UTF-8 encoding
      } else {
        res.status(400).json({ error: 'Unsupported format. Use csv or json.' });
      }
    } catch (error) {
      console.error('Export insights error:', error);
      res.status(500).json({ error: 'Failed to export insights' });
    }
  });

  // Export word cloud data endpoint
  app.get("/api/export/wordcloud", async (req, res) => {
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
      
      // Handle service ID parameter
      const serviceId = req.query.serviceId as string;
      
      // Handle format parameter
      const format = req.query.format as string || 'csv';
      
      const filters = {
        serviceId: serviceId || undefined,
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      // Get both positive and negative word cloud data
      const positiveWords = await storage.getWordCloudData('positive', filters);
      const negativeWords = await storage.getWordCloudData('negative', filters);
      const allWords = [...positiveWords, ...negativeWords];
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="wordcloud.json"');
        res.json({ positive: positiveWords, negative: negativeWords });
      } else if (format === 'csv') {
        // Generate CSV
        const headers = ['ID', 'Word', 'Frequency', 'Sentiment'];
        const csvRows = [headers.join(',')];
        
        allWords.forEach(word => {
          const row = [
            word.id,
            `"${word.word}"`,
            word.frequency,
            word.sentiment
          ];
          csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="wordcloud.csv"');
        res.send('\uFEFF' + csvContent); // Add BOM for proper UTF-8 encoding
      } else {
        res.status(400).json({ error: 'Unsupported format. Use csv or json.' });
      }
    } catch (error) {
      console.error('Export word cloud error:', error);
      res.status(500).json({ error: 'Failed to export word cloud data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
