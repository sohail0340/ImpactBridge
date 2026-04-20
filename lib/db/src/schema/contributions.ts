import { pgTable, serial, integer, real, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { problemsTable } from "./problems";

export const contributionsTable = pgTable("contributions", {
  id: serial("id").primaryKey(),
  problemId: integer("problem_id").references(() => problemsTable.id).notNull(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  amount: real("amount").notNull(),
  anonymous: boolean("anonymous").notNull().default(false),
  // Payment details captured when the contributor submits for review.
  paymentMethod: text("payment_method").notNull().default("bank"),
  paymentMethodOther: text("payment_method_other"),
  transactionId: text("transaction_id").notNull().default(""),
  proofImageUrl: text("proof_image_url"),
  // Admin moderation state: pending | approved | rejected.
  status: text("status").notNull().default("pending"),
  reviewedById: integer("reviewed_by_id"),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContributionSchema = createInsertSchema(contributionsTable).omit({ id: true });
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributionsTable.$inferSelect;
