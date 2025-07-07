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
      
      const filters = {
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
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
      
      const filters = {
        source: source && source.length > 0 ? source : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
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
      
      const filters = {
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
      const { appId, appIdApple, count, sources } = collectReviewsSchema.parse(req.body);
      
      if (sources.length === 0) {
        return res.status(400).json({ 
          error: "At least one source must be selected",
          message: "최소 하나의 스토어를 선택해주세요."
        });
      }

      // Run Python scraper with multiple sources
      const scraperPath = path.join(__dirname, 'scraper.py');
      const sourcesStr = sources.join(',');
      const pythonProcess = spawn('python3', [scraperPath, appId, appIdApple, count.toString(), sourcesStr]);
      
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
          
          // Don't store insights and word cloud data from scraper
          // They will be generated dynamically from the collected reviews
          
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
