import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  source: text("source").notNull(), // "google_play" or "app_store"
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  sentiment: text("sentiment").notNull(), // "positive" or "negative"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // "high", "medium", "low"
  mentionCount: integer("mention_count").notNull(),
  trend: text("trend"), // "increasing", "decreasing", "stable"
  category: text("category").notNull(), // "stability", "ui_ux", "features"
});

export const wordCloudData = pgTable("word_cloud_data", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  frequency: integer("frequency").notNull(),
  sentiment: text("sentiment").notNull(), // "positive" or "negative"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  source: true,
  rating: true,
  content: true,
  sentiment: true,
}).extend({
  createdAt: z.string().optional(),
});

export const insertInsightSchema = createInsertSchema(insights).pick({
  title: true,
  description: true,
  priority: true,
  mentionCount: true,
  trend: true,
  category: true,
});

export const insertWordCloudSchema = createInsertSchema(wordCloudData).pick({
  word: true,
  frequency: true,
  sentiment: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insights.$inferSelect;

export type InsertWordCloudData = z.infer<typeof insertWordCloudSchema>;
export type WordCloudData = typeof wordCloudData.$inferSelect;
