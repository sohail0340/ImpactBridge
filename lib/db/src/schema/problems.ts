import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const problemsTable = pgTable("problems", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("reported"),
  imageUrl: text("image_url"),
  fundingGoal: real("funding_goal").notNull().default(0),
  fundingRaised: real("funding_raised").notNull().default(0),
  progressPercent: real("progress_percent").notNull().default(0),
  workProgressPercent: integer("work_progress_percent").notNull().default(0),
  joinedCount: integer("joined_count").notNull().default(0),
  urgency: text("urgency").notNull().default("medium"),
  verifiedCount: integer("verified_count").notNull().default(0),
  postedById: integer("posted_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProblemSchema = createInsertSchema(problemsTable).omit({ id: true });
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Problem = typeof problemsTable.$inferSelect;
