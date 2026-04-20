import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityGroupsTable = pgTable("community_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  problemCount: integer("problem_count").notNull().default(0),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communityTasksTable = pgTable("community_tasks", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communityGroupsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assignedTo: text("assigned_to"),
  assignedToAvatar: text("assigned_to_avatar"),
  problemId: integer("problem_id"),
  problemTitle: text("problem_title"),
  status: text("status").notNull().default("pending"),
  dueDate: text("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communityMessagesTable = pgTable("community_messages", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communityMembersTable = pgTable(
  "community_members",
  {
    id: serial("id").primaryKey(),
    communityId: integer("community_id").notNull(),
    userId: integer("user_id").notNull(),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("community_members_uniq").on(t.communityId, t.userId),
  }),
);

export const insertCommunityGroupSchema = createInsertSchema(communityGroupsTable).omit({ id: true });
export const insertCommunityTaskSchema = createInsertSchema(communityTasksTable).omit({ id: true });
export const insertCommunityMessageSchema = createInsertSchema(communityMessagesTable).omit({ id: true, createdAt: true });
export const insertCommunityMemberSchema = createInsertSchema(communityMembersTable).omit({ id: true, joinedAt: true });
export type InsertCommunityGroup = z.infer<typeof insertCommunityGroupSchema>;
export type CommunityGroup = typeof communityGroupsTable.$inferSelect;
export type InsertCommunityTask = z.infer<typeof insertCommunityTaskSchema>;
export type CommunityTask = typeof communityTasksTable.$inferSelect;
export type CommunityMessage = typeof communityMessagesTable.$inferSelect;
export type InsertCommunityMessage = z.infer<typeof insertCommunityMessageSchema>;
export type CommunityMember = typeof communityMembersTable.$inferSelect;
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
