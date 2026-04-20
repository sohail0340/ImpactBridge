import { Router } from "express";
import { db } from "@workspace/db";
import { problemsTable, usersTable, problemMembersTable, ngoProfilesTable } from "@workspace/db";
import { eq, ilike, and, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  ListProblemsQueryParams,
  CreateProblemBody,
  GetProblemParams,
  JoinProblemParams,
  VoteProblemParams,
  VoteProblemBody,
} from "@workspace/api-zod";
import { requireAuth, optionalAuth, requireRole } from "../middlewares/auth";

const router = Router();

const formatProblem = async (problem: typeof problemsTable.$inferSelect) => {
  let postedBy = "Community Member";
  let postedByAvatar: string | undefined;

  if (problem.postedById) {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, problem.postedById) });
    if (user) {
      postedBy = user.name;
      postedByAvatar = user.avatarUrl ?? undefined;
    }
  }

  return {
    id: problem.id,
    title: problem.title,
    description: problem.description,
    category: problem.category,
    location: problem.location,
    status: problem.status,
    imageUrl: problem.imageUrl ?? undefined,
    fundingGoal: problem.fundingGoal,
    fundingRaised: problem.fundingRaised,
    progressPercent: problem.progressPercent,
    joinedCount: problem.joinedCount,
    urgency: problem.urgency,
    verifiedCount: problem.verifiedCount,
    postedBy,
    postedByAvatar,
    createdAt: problem.createdAt.toISOString(),
  };
};

router.get("/", optionalAuth, async (req, res) => {
  const parsed = ListProblemsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  const conditions = [];
  if (params.search) conditions.push(ilike(problemsTable.title, `%${params.search}%`));
  if (params.category) conditions.push(eq(problemsTable.category, params.category));
  if (params.location) conditions.push(ilike(problemsTable.location, `%${params.location}%`));
  if (params.status) conditions.push(eq(problemsTable.status, params.status));

  let orderBy = desc(problemsTable.createdAt);
  if (params.sort === "most_funded") orderBy = desc(problemsTable.fundingRaised);
  else if (params.sort === "most_urgent") orderBy = desc(sql`CASE urgency WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END`);

  const problems = await db.select().from(problemsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy);

  const formatted = await Promise.all(problems.map(formatProblem));

  // If authenticated, decorate with isJoined flag
  if (req.user && problems.length > 0) {
    const ids = problems.map((p) => p.id);
    const rows = await db.select({ problemId: problemMembersTable.problemId })
      .from(problemMembersTable)
      .where(and(eq(problemMembersTable.userId, req.user.id), inArray(problemMembersTable.problemId, ids)));
    const joinedSet = new Set(rows.map((r) => r.problemId));
    formatted.forEach((p) => { (p as typeof p & { isJoined?: boolean }).isJoined = joinedSet.has(p.id); });
  }

  res.json(formatted);
});

router.get("/featured", async (_req, res) => {
  const problems = await db.select().from(problemsTable)
    .orderBy(desc(problemsTable.fundingRaised))
    .limit(6);
  const formatted = await Promise.all(problems.map(formatProblem));
  res.json(formatted);
});

router.get("/me/joined", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(problemMembersTable)
    .innerJoin(problemsTable, eq(problemMembersTable.problemId, problemsTable.id))
    .where(eq(problemMembersTable.userId, req.user!.id))
    .orderBy(desc(problemMembersTable.joinedAt));
  const out = await Promise.all(rows.map((r) => formatProblem(r.problems)));
  res.json(out);
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateProblemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const [problem] = await db.insert(problemsTable).values({
    title: data.title,
    description: data.description,
    category: data.category,
    location: data.location,
    imageUrl: data.imageUrl ?? null,
    fundingGoal: data.fundingGoal,
    fundingRaised: 0,
    progressPercent: 0,
    joinedCount: 0,
    urgency: data.urgency ?? "medium",
    status: "reported",
    postedById: req.user!.id,
  }).returning();

  await db.update(usersTable)
    .set({ problemsCreated: sql`problems_created + 1` })
    .where(eq(usersTable.id, req.user!.id));

  const formatted = await formatProblem(problem);
  res.status(201).json(formatted);
});

router.get("/:id", optionalAuth, async (req, res) => {
  const parsed = GetProblemParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const problem = await db.query.problemsTable.findFirst({ where: eq(problemsTable.id, parsed.data.id) });
  if (!problem) { res.status(404).json({ error: "Not found" }); return; }

  const formatted = await formatProblem(problem);
  let isJoined = false;
  if (req.user) {
    const row = await db.query.problemMembersTable.findFirst({
      where: and(eq(problemMembersTable.problemId, parsed.data.id), eq(problemMembersTable.userId, req.user.id)),
    });
    isJoined = !!row;
  }
  res.json({ ...formatted, isJoined, images: problem.imageUrl ? [problem.imageUrl] : [], updates: [], comments: [], joinedUsers: [] });
});

router.post("/:id/join", requireAuth, async (req, res) => {
  const parsed = JoinProblemParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const problemId = parsed.data.id;
  const userId = req.user!.id;

  const result = await db.transaction(async (tx) => {
    const exists = await tx.query.problemsTable.findFirst({ where: eq(problemsTable.id, problemId) });
    if (!exists) return { notFound: true } as const;

    const inserted = await tx.insert(problemMembersTable)
      .values({ problemId, userId })
      .onConflictDoNothing()
      .returning({ id: problemMembersTable.id });

    if (inserted.length > 0) {
      await tx.update(problemsTable)
        .set({ joinedCount: sql`joined_count + 1` })
        .where(eq(problemsTable.id, problemId));
      return { joined: true, alreadyMember: false } as const;
    }
    return { joined: false, alreadyMember: true } as const;
  });

  if ("notFound" in result) { res.status(404).json({ error: "Problem not found" }); return; }
  res.status(result.joined ? 201 : 200).json(result);
});

router.delete("/:id/join", requireAuth, async (req, res) => {
  const parsed = JoinProblemParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const problemId = parsed.data.id;
  const userId = req.user!.id;

  const result = await db.transaction(async (tx) => {
    const deleted = await tx.delete(problemMembersTable)
      .where(and(eq(problemMembersTable.problemId, problemId), eq(problemMembersTable.userId, userId)))
      .returning({ id: problemMembersTable.id });
    if (deleted.length > 0) {
      await tx.update(problemsTable)
        .set({ joinedCount: sql`GREATEST(0, joined_count - 1)` })
        .where(eq(problemsTable.id, problemId));
      return { left: true, wasMember: true };
    }
    return { left: true, wasMember: false };
  });

  res.json(result);
});

router.post("/:id/vote", requireAuth, async (req, res) => {
  const idParsed = VoteProblemParams.safeParse({ id: req.params.id });
  const bodyParsed = VoteProblemBody.safeParse(req.body);
  if (!idParsed.success || !bodyParsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  if (bodyParsed.data.vote === "verify") {
    await db.update(problemsTable)
      .set({ verifiedCount: sql`verified_count + 1` })
      .where(eq(problemsTable.id, idParsed.data.id));
  }

  res.json({ success: true, message: "Vote recorded" });
});

// NGO claims a problem to solve. Only approved NGOs are allowed.
router.post("/:id/solve-as-ngo", requireRole("ngo", "admin"), async (req, res) => {
  const parsed = GetProblemParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const ngo = await db.query.ngoProfilesTable.findFirst({ where: eq(ngoProfilesTable.userId, req.user!.id) });
  if (req.user!.role !== "admin" && (!ngo || ngo.status !== "approved")) {
    res.status(403).json({ error: "NGO profile must be approved by an admin first" });
    return;
  }

  // If plan details are provided, update the NGO profile with problem-specific plan
  const planBody = z.object({
    planDescription: z.string().max(5000).optional(),
    estimatedCost: z.number().min(0).optional(),
    timelineValue: z.number().int().min(1).optional(),
    timelineUnit: z.enum(["days", "months"]).optional(),
    requiredResources: z.string().max(5000).optional(),
  }).safeParse(req.body);

  if (planBody.success && ngo && planBody.data.planDescription) {
    const { planDescription, estimatedCost, timelineValue, timelineUnit, requiredResources } = planBody.data;
    await db.update(ngoProfilesTable).set({
      ...(planDescription !== undefined && { planDescription }),
      ...(estimatedCost !== undefined && { estimatedCost }),
      ...(timelineValue !== undefined && { timelineValue }),
      ...(timelineUnit !== undefined && { timelineUnit }),
      ...(requiredResources !== undefined && { requiredResources }),
    }).where(eq(ngoProfilesTable.userId, req.user!.id));
  }

  const [updated] = await db.update(problemsTable)
    .set({ status: "in_progress" })
    .where(eq(problemsTable.id, parsed.data.id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Problem not found" }); return; }

  res.json({ success: true, message: "You are now leading this problem. Post updates as you make progress." });
});

export default router;
