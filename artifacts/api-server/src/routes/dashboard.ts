import { Router } from "express";
import { db } from "@workspace/db";
import { problemsTable, contributionsTable, notificationsTable, problemMembersTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const me = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });

  // Only count approved contributions toward the money stat. Pending ones
  // are awaiting admin review, so surfacing them would double-count.
  const approved = await db.select().from(contributionsTable)
    .where(and(eq(contributionsTable.userId, userId), eq(contributionsTable.status, "approved")))
    .orderBy(desc(contributionsTable.createdAt));
  const totalContributed = approved.reduce((acc, c) => acc + c.amount, 0);

  const myProblems = await db.select().from(problemsTable)
    .where(eq(problemsTable.postedById, userId))
    .orderBy(desc(problemsTable.createdAt));

  const joinedCountRows = await db.select().from(problemMembersTable)
    .where(eq(problemMembersTable.userId, userId));

  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(10);

  const contributionDetails = await Promise.all(approved.slice(0, 5).map(async (c) => {
    const problem = await db.query.problemsTable.findFirst({ where: eq(problemsTable.id, c.problemId) });
    return {
      ...c,
      problemTitle: problem?.title ?? "Unknown Problem",
      createdAt: c.createdAt.toISOString(),
    };
  }));

  res.json({
    totalContributions: totalContributed,
    problemsJoined: joinedCountRows.length,
    problemsCreated: myProblems.length,
    reputationScore: me?.reputationScore ?? 0,
    myProblems: myProblems.map((p) => ({
      ...p,
      postedBy: me?.name ?? "You",
      createdAt: p.createdAt.toISOString(),
    })),
    myContributions: contributionDetails,
    notifications: notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
  });
});

export default router;
