import { pgTable, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const problemMembersTable = pgTable(
  "problem_members",
  {
    id: serial("id").primaryKey(),
    problemId: integer("problem_id").notNull(),
    userId: integer("user_id").notNull(),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("problem_members_uniq").on(t.problemId, t.userId),
  }),
);

export type ProblemMember = typeof problemMembersTable.$inferSelect;
