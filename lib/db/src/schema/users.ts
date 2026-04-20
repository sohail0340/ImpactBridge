import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("user"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  location: text("location"),
  reputationScore: integer("reputation_score").notNull().default(0),
  problemsCreated: integer("problems_created").notNull().default(0),
  problemsSolved: integer("problems_solved").notNull().default(0),
  totalContributed: real("total_contributed").notNull().default(0),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
