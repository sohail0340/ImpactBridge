import { pgTable, serial, integer, text, real, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const ngoProfilesTable = pgTable(
  "ngo_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    organization: text("organization").notNull(),
    contactNumber: text("contact_number").notNull(),
    planDescription: text("plan_description").notNull(),
    estimatedCost: real("estimated_cost").notNull(),
    timelineValue: integer("timeline_value").notNull(),
    timelineUnit: text("timeline_unit").notNull(), // "days" | "months"
    requiredResources: text("required_resources").notNull(),
    previousWorkUrl: text("previous_work_url"),
    certificateUrl: text("certificate_url"),
    agreedToProvideUpdates: boolean("agreed_to_provide_updates").notNull().default(false),
    // Admin moderation: pending | approved | rejected
    status: text("status").notNull().default("pending"),
    reviewedById: integer("reviewed_by_id"),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userUniq: uniqueIndex("ngo_profiles_user_uniq").on(t.userId),
  }),
);

export type NgoProfile = typeof ngoProfilesTable.$inferSelect;
