import { Router } from "express";
import { db, usersTable, communityMembersTable, problemMembersTable, ngoProfilesTable, contributionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { GetUserParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function publicUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    bio: u.bio ?? undefined,
    avatarUrl: u.avatarUrl ?? undefined,
    location: u.location ?? undefined,
    reputationScore: u.reputationScore,
    problemsCreated: u.problemsCreated,
    problemsSolved: u.problemsSolved,
    totalContributed: u.totalContributed,
    joinedAt: u.joinedAt.toISOString(),
  };
}

router.get("/me", requireAuth, async (req, res) => {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user!.id) });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(publicUser(user));
});

router.get("/me/stats", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [{ c: communityCount }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(communityMembersTable)
    .where(eq(communityMembersTable.userId, userId));

  const [{ c: problemsJoined }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(problemMembersTable)
    .where(eq(problemMembersTable.userId, userId));

  // Only count approved contributions
  const [{ s: totalApproved }] = await db
    .select({ s: sql<number>`COALESCE(SUM(amount),0)::real` })
    .from(contributionsTable)
    .where(and(eq(contributionsTable.userId, userId), eq(contributionsTable.status, "approved")));

  const ngo = await db.query.ngoProfilesTable.findFirst({ where: eq(ngoProfilesTable.userId, userId) });

  // Reputation is derived from real on-platform activity, not a seeded value:
  //   solved a problem → 50, created → 10, joined → 5, every Rs.100 contributed → 1
  const contributed = Number(totalApproved ?? 0);
  const joined = Number(problemsJoined ?? 0);
  const reputationScore =
    user.problemsSolved * 50 +
    user.problemsCreated * 10 +
    joined * 5 +
    Math.floor(contributed / 100);

  res.json({
    activeCommunities: Number(communityCount ?? 0),
    problemsJoined: joined,
    totalContributed: contributed,
    problemsCreated: user.problemsCreated,
    problemsSolved: user.problemsSolved,
    reputationScore,
    role: user.role,
    ngoStatus: ngo?.status ?? null,
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetUserParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, parsed.data.id) });
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(publicUser(user));
});

export default router;
