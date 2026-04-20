import { Router } from "express";
import { db } from "@workspace/db";
import { problemsTable, contributionsTable, communityGroupsTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";

const router = Router();

router.get("/overview", async (_req, res) => {
  const [totalProblems] = await db.select({ count: count() }).from(problemsTable);
  const [problemsSolved] = await db.select({ count: count() }).from(problemsTable).where(eq(problemsTable.status, "completed"));
  const [totalFunding] = await db.select({ total: sum(contributionsTable.amount) }).from(contributionsTable);
  const [activeCommunities] = await db.select({ count: count() }).from(communityGroupsTable).where(eq(communityGroupsTable.active, true));

  res.json({
    totalProblems: totalProblems.count,
    problemsSolved: problemsSolved.count,
    totalFundingRaised: Number(totalFunding.total ?? 0),
    activeCommunities: activeCommunities.count,
    volunteersJoined: 1247,
  });
});

export default router;
