import { pgTable, serial, integer, text, real, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { problemsTable } from "./problems";

export const ngoJoinApplicationsTable = pgTable(
  "ngo_join_applications",
  {
    id: serial("id").primaryKey(),
    problemId: integer("problem_id").notNull().references(() => problemsTable.id),
    ngoUserId: integer("ngo_user_id").notNull().references(() => usersTable.id),
    planDescription: text("plan_description").notNull(),
    estimatedCost: real("estimated_cost").notNull().default(0),
    timelineValue: integer("timeline_value").notNull().default(1),
    timelineUnit: text("timeline_unit").notNull().default("months"),
    requiredResources: text("required_resources").notNull().default(""),
    status: text("status").notNull().default("pending"),
    reviewedById: integer("reviewed_by_id"),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqPerNgoProblem: uniqueIndex("ngo_join_app_uniq").on(t.problemId, t.ngoUserId),
  }),
);

export type NgoJoinApplication = typeof ngoJoinApplicationsTable.$inferSelect;
