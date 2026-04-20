import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { problemsTable } from "./problems";
import { usersTable } from "./users";

export const updatesTable = pgTable("updates", {
  id: serial("id").primaryKey(),
  problemId: integer("problem_id").references(() => problemsTable.id).notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  authorAvatar: text("author_avatar"),
  imageUrl: text("image_url"),
  verifiedCount: integer("verified_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const updateVerificationsTable = pgTable(
  "update_verifications",
  {
    id: serial("id").primaryKey(),
    updateId: integer("update_id").references(() => updatesTable.id).notNull(),
    userId: integer("user_id").references(() => usersTable.id).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqVote: unique().on(t.updateId, t.userId),
  }),
);

export const insertUpdateSchema = createInsertSchema(updatesTable).omit({ id: true });
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;
export type Update = typeof updatesTable.$inferSelect;
