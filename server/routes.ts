import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";

const getReviewsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  source: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const collectReviewsSchema = z.object({
  appId: z.string().optional().default('com.lguplus.sohoapp'),
  count: z.coerce.number().min(1).max(500).optional().default(100),
  sources: z.array(z.enum(['google_play', 'app_store'])).optional().default(['google_play']),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get reviews with pagination and filtering
  app.get("/api/reviews", async (req, res) => {
    try {
      const { page, limit, source, dateFrom, dateTo } = getReviewsSchema.parse(req.query);
      
      const filters = {
        source: source && source.length > 0 ? source : undefined,
        dateFrom,
        dateTo
      };

      const result = await storage.getReviews(page, limit, filters);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid query parameters" });
    }
  });

  // Get review statistics
  app.get("/api/reviews/stats", async (req, res) => {
    try {
      const stats = await storage.getReviewStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get review statistics" });
    }
  });

  // Get UX insights
  app.get("/api/insights", async (req, res) => {
    try {
      const insights = await storage.getInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to get insights" });
    }
  });

  // Get word cloud data
  app.get("/api/wordcloud/:sentiment", async (req, res) => {
    try {
      const { sentiment } = req.params;
      if (!["positive", "negative"].includes(sentiment)) {
        return res.status(400).json({ error: "Invalid sentiment. Must be 'positive' or 'negative'" });
      }
      
      const wordCloudData = await storage.getWordCloudData(sentiment);
      res.json(wordCloudData);
    } catch (error) {
      res.status(500).json({ error: "Failed to get word cloud data" });
    }
  });

  // Collect reviews endpoint with Python scraper
  app.post("/api/reviews/collect", async (req, res) => {
    try {
      const { appId, count, sources } = collectReviewsSchema.parse(req.body);
      
      // Only Google Play is supported for now
      if (!sources.includes('google_play')) {
        return res.status(400).json({ 
          error: "Currently only Google Play Store is supported",
          message: "현재 구글 플레이스토어만 지원됩니다."
        });
      }

      // Run Python scraper
      const scraperPath = path.join(__dirname, 'scraper.py');
      const pythonProcess = spawn('python3', [scraperPath, appId, count.toString()]);
      
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
          
          // Store collected reviews
          for (const reviewData of result.reviews) {
            await storage.createReview(reviewData);
          }
          
          // Store insights
          for (const insightData of result.analysis.insights) {
            await storage.createInsight(insightData);
          }
          
          // Store word cloud data
          for (const wordData of result.analysis.wordCloud.positive) {
            await storage.createWordCloudData(wordData);
          }
          for (const wordData of result.analysis.wordCloud.negative) {
            await storage.createWordCloudData(wordData);
          }
          
          res.json({
            success: true,
            message: result.message,
            reviewsCount: result.reviews.length,
            insightsCount: result.analysis.insights.length
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

  const httpServer = createServer(app);
  return httpServer;
}
