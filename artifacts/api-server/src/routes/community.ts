import { Router } from "express";
import { db } from "@workspace/db";
import {
  communityGroupsTable,
  communityTasksTable,
  communityMessagesTable,
  communityMembersTable,
  usersTable,
} from "@workspace/db";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, optionalAuth } from "../middlewares/auth";

const router = Router();

router.get("/groups", optionalAuth, async (req, res) => {
  const groups = await db.select().from(communityGroupsTable)
    .where(eq(communityGroupsTable.active, true));

  let memberSet = new Set<number>();
  if (req.user) {
    const memberships = await db
      .select({ communityId: communityMembersTable.communityId })
      .from(communityMembersTable)
      .where(eq(communityMembersTable.userId, req.user.id));
    memberSet = new Set(memberships.map((m) => m.communityId));
  }

  res.json(
    groups.map((g) => ({
      ...g,
      imageUrl: g.imageUrl ?? undefined,
      isMember: memberSet.has(g.id),
    })),
  );
});

router.get("/tasks", async (req, res) => {
  const communityId = req.query.communityId ? Number(req.query.communityId) : undefined;
  const rows = communityId
    ? await db.select().from(communityTasksTable).where(eq(communityTasksTable.communityId, communityId))
    : await db.select().from(communityTasksTable);

  res.json(rows.map((t) => ({
    ...t,
    communityId: t.communityId ?? undefined,
    assignedTo: t.assignedTo ?? undefined,
    assignedToAvatar: t.assignedToAvatar ?? undefined,
    problemId: t.problemId ?? undefined,
    problemTitle: t.problemTitle ?? undefined,
    dueDate: t.dueDate ?? undefined,
  })));
});

function serializeMessage(m: typeof communityMessagesTable.$inferSelect) {
  return {
    id: m.id,
    communityId: m.communityId,
    userId: m.userId,
    userName: m.userName,
    userAvatar: m.userAvatar ?? undefined,
    message: m.message,
    createdAt: m.createdAt.toISOString(),
  };
}

async function ensureGroupExists(id: number) {
  const g = await db.query.communityGroupsTable.findFirst({
    where: eq(communityGroupsTable.id, id),
  });
  return g ?? null;
}

async function isMember(userId: number, communityId: number): Promise<boolean> {
  const row = await db
    .select({ id: communityMembersTable.id })
    .from(communityMembersTable)
    .where(
      and(
        eq(communityMembersTable.userId, userId),
        eq(communityMembersTable.communityId, communityId),
      ),
    )
    .limit(1);
  return row.length > 0;
}

const IdParam = z.object({ id: z.coerce.number().int().positive() });

router.get("/groups/:id/messages", requireAuth, async (req, res) => {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid community id" });
    return;
  }
  const communityId = parsed.data.id;

  const group = await ensureGroupExists(communityId);
  if (!group) {
    res.status(404).json({ error: "Community not found" });
    return;
  }

  if (!(await isMember(req.user!.id, communityId))) {
    res.status(403).json({ error: "Join this community to view its chat." });
    return;
  }

  const rows = await db
    .select()
    .from(communityMessagesTable)
    .where(eq(communityMessagesTable.communityId, communityId))
    .orderBy(asc(communityMessagesTable.createdAt))
    .limit(200);
  res.json(rows.map(serializeMessage));
});

const PostMessageBody = z.object({
  message: z.string().trim().min(1).max(2000),
});

router.post("/groups/:id/messages", requireAuth, async (req, res) => {
  const idParse = IdParam.safeParse(req.params);
  if (!idParse.success) {
    res.status(400).json({ error: "Invalid community id" });
    return;
  }
  const communityId = idParse.data.id;

  const bodyParse = PostMessageBody.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const group = await ensureGroupExists(communityId);
  if (!group) {
    res.status(404).json({ error: "Community not found" });
    return;
  }

  if (!(await isMember(req.user!.id, communityId))) {
    res.status(403).json({ error: "Join this community to post messages." });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, req.user!.id),
  });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const [row] = await db
    .insert(communityMessagesTable)
    .values({
      communityId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl ?? null,
      message: bodyParse.data.message,
    })
    .returning();

  res.status(201).json(serializeMessage(row));
});

router.post("/groups/:id/join", requireAuth, async (req, res) => {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid community id" });
    return;
  }
  const communityId = parsed.data.id;

  const group = await ensureGroupExists(communityId);
  if (!group) {
    res.status(404).json({ error: "Community not found" });
    return;
  }

  // Atomic idempotent join: INSERT ... ON CONFLICT DO NOTHING, then only
  // increment memberCount when the insert actually produced a new row.
  const inserted = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(communityMembersTable)
      .values({ communityId, userId: req.user!.id })
      .onConflictDoNothing({
        target: [communityMembersTable.communityId, communityMembersTable.userId],
      })
      .returning({ id: communityMembersTable.id });

    if (rows.length > 0) {
      await tx
        .update(communityGroupsTable)
        .set({ memberCount: sql`${communityGroupsTable.memberCount} + 1` })
        .where(eq(communityGroupsTable.id, communityId));
    }
    return rows.length > 0;
  });

  res.status(inserted ? 201 : 200).json({
    joined: true,
    alreadyMember: !inserted,
  });
});

router.delete("/groups/:id/join", requireAuth, async (req, res) => {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid community id" });
    return;
  }
  const communityId = parsed.data.id;

  const group = await ensureGroupExists(communityId);
  if (!group) {
    res.status(404).json({ error: "Community not found" });
    return;
  }

  // Atomic idempotent leave: DELETE ... RETURNING tells us whether a row was
  // actually removed, so memberCount is only decremented once per real leave.
  const removed = await db.transaction(async (tx) => {
    const rows = await tx
      .delete(communityMembersTable)
      .where(
        and(
          eq(communityMembersTable.userId, req.user!.id),
          eq(communityMembersTable.communityId, communityId),
        ),
      )
      .returning({ id: communityMembersTable.id });

    if (rows.length > 0) {
      await tx
        .update(communityGroupsTable)
        .set({
          memberCount: sql`GREATEST(${communityGroupsTable.memberCount} - 1, 0)`,
        })
        .where(eq(communityGroupsTable.id, communityId));
    }
    return rows.length > 0;
  });

  res.status(200).json({ joined: false, wasMember: removed });
});

// Suppress unused import warning when no other consumer references it.
void inArray;

export default router;
