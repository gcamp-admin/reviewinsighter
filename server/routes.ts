import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

const getReviewsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  source: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
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

  // Collect reviews endpoint (placeholder for future implementation)
  app.post("/api/reviews/collect", async (req, res) => {
    try {
      // Simulate collection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      res.json({ message: "리뷰 수집이 완료되었습니다.", success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to collect reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
