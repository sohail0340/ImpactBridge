import { Router } from "express";
import { db, contributionsTable, problemsTable, usersTable, ngoProfilesTable, communityGroupsTable, communityMembersTable, communityTasksTable, ngoJoinApplicationsTable } from "@workspace/db";
import { and, eq, desc, sql, ilike, or, count } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.use(requireAdmin);

function parseId(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ---- Dashboard Stats ----
router.get("/stats", async (_req, res) => {
  const [[usersRow], [problemsRow], [contribsRow], [pendingNgoRow], [communityRow], [pendingContribRow], [ngoUsersRow], [activeProblemsRow]] = await Promise.all([
    db.select({ total: count() }).from(usersTable),
    db.select({ total: count() }).from(problemsTable),
    db.select({ total: count(), sum: sql<number>`COALESCE(SUM(amount), 0)` }).from(contributionsTable).where(eq(contributionsTable.status, "approved")),
    db.select({ total: count() }).from(ngoProfilesTable).where(eq(ngoProfilesTable.status, "pending")),
    db.select({ total: count() }).from(communityGroupsTable),
    db.select({ total: count() }).from(contributionsTable).where(eq(contributionsTable.status, "pending")),
    db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "ngo")),
    db.select({ total: count() }).from(problemsTable).where(eq(problemsTable.status, "in_progress")),
  ]);

  res.json({
    totalUsers: usersRow.total,
    totalNgos: ngoUsersRow.total,
    totalProblems: problemsRow.total,
    totalCommunities: communityRow.total,
    totalApprovedContributions: contribsRow.total,
    totalFundsRaised: Number(contribsRow.sum),
    pendingNgoApplications: pendingNgoRow.total,
    pendingContributions: pendingContribRow.total,
    activeProblems: activeProblemsRow.total,
  });
});

// ---- Users Management ----
router.get("/users", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;

  const conditions = [];
  if (search) conditions.push(or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`)));
  if (role) conditions.push(eq(usersTable.role, role));

  const rows = await db.select().from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.joinedAt));

  res.json(rows.map((u) => ({
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
  })));
});

router.patch("/users/:id/role", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = z.object({ role: z.enum(["user", "ngo", "admin"]) }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid role" }); return; }
  const [updated] = await db.update(usersTable).set({ role: body.data.role }).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ success: true, user: { id: updated.id, role: updated.role } });
});

router.delete("/users/:id", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  if (id === req.user!.id) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ success: true });
});

// ---- Problems Management ----
router.get("/problems", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const conditions = [];
  if (search) conditions.push(ilike(problemsTable.title, `%${search}%`));
  if (status) conditions.push(eq(problemsTable.status, status));

  const rows = await db.select().from(problemsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(problemsTable.createdAt));

  const out = await Promise.all(rows.map(async (p) => {
    let postedByName = "Community Member";
    let postedByEmail = "";
    if (p.postedById) {
      const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, p.postedById) });
      if (user) { postedByName = user.name; postedByEmail = user.email; }
    }
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      location: p.location,
      status: p.status,
      imageUrl: p.imageUrl ?? undefined,
      fundingGoal: p.fundingGoal,
      fundingRaised: p.fundingRaised,
      progressPercent: p.progressPercent,
      joinedCount: p.joinedCount,
      urgency: p.urgency,
      verifiedCount: p.verifiedCount,
      postedByName,
      postedByEmail,
      postedById: p.postedById ?? undefined,
      createdAt: p.createdAt.toISOString(),
    };
  }));

  res.json(out);
});

router.post("/problems/:id/approve", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const existing = await db.query.problemsTable.findFirst({ where: eq(problemsTable.id, id) });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status === "rejected") {
    await db.update(problemsTable).set({ status: "reported" }).where(eq(problemsTable.id, id));
  }
  res.json({ success: true, message: "Problem is now visible" });
});

router.post("/problems/:id/reject", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db.update(problemsTable)
    .set({ status: "rejected" })
    .where(eq(problemsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true, message: "Problem hidden from public view" });
});

router.post("/problems", async (req, res) => {
  const body = z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(10),
    category: z.string().min(1),
    location: z.string().min(2),
    urgency: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    fundingGoal: z.number().min(0).default(0),
    imageUrl: z.string().url().optional().or(z.literal("")),
    status: z.string().default("reported"),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid input", details: body.error.issues }); return; }

  const [problem] = await db.insert(problemsTable).values({
    title: body.data.title,
    description: body.data.description,
    category: body.data.category,
    location: body.data.location,
    urgency: body.data.urgency,
    fundingGoal: body.data.fundingGoal,
    imageUrl: body.data.imageUrl || undefined,
    status: body.data.status,
    postedById: req.user!.id,
  }).returning();

  await db.update(usersTable).set({ problemsCreated: sql`problems_created + 1` }).where(eq(usersTable.id, req.user!.id));

  res.status(201).json(problem);
});

router.delete("/problems/:id", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(problemsTable).where(eq(problemsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// ---- Communities ----
function serializeCommunity(g: typeof communityGroupsTable.$inferSelect) {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    memberCount: g.memberCount,
    problemCount: g.problemCount,
    category: g.category,
    imageUrl: g.imageUrl ?? undefined,
    active: g.active,
    createdAt: g.createdAt.toISOString(),
  };
}

function serializeTask(t: typeof communityTasksTable.$inferSelect) {
  return {
    id: t.id,
    communityId: t.communityId ?? undefined,
    title: t.title,
    description: t.description,
    assignedTo: t.assignedTo ?? undefined,
    status: t.status,
    dueDate: t.dueDate ?? undefined,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/communities", async (_req, res) => {
  const groups = await db.select().from(communityGroupsTable).orderBy(desc(communityGroupsTable.memberCount));
  const tasks = await db.select().from(communityTasksTable).orderBy(desc(communityTasksTable.createdAt));

  const recentMembers = await db.select({
    communityId: communityMembersTable.communityId,
    userId: communityMembersTable.userId,
    joinedAt: communityMembersTable.joinedAt,
    userName: usersTable.name,
    userAvatar: usersTable.avatarUrl,
  })
    .from(communityMembersTable)
    .innerJoin(usersTable, eq(communityMembersTable.userId, usersTable.id))
    .orderBy(desc(communityMembersTable.joinedAt));

  const out = groups.map((g) => {
    const members = recentMembers.filter((m) => m.communityId === g.id);
    const groupTasks = tasks.filter((t) => t.communityId === g.id);
    return {
      ...serializeCommunity(g),
      recentMembers: members.slice(0, 5).map((m) => ({
        userId: m.userId,
        userName: m.userName,
        userAvatar: m.userAvatar ?? undefined,
        joinedAt: m.joinedAt.toISOString(),
      })),
      tasks: groupTasks.map(serializeTask),
    };
  });

  res.json(out);
});

router.post("/communities", async (req, res) => {
  const body = z.object({
    name: z.string().min(3).max(120),
    description: z.string().min(10),
    category: z.string().min(1),
    memberCount: z.number().int().min(0).default(0),
    problemCount: z.number().int().min(0).default(0),
    imageUrl: z.string().url().optional().or(z.literal("")),
    active: z.boolean().default(true),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid input", details: body.error.issues }); return; }

  const [community] = await db.insert(communityGroupsTable).values({
    name: body.data.name,
    description: body.data.description,
    category: body.data.category,
    memberCount: body.data.memberCount,
    problemCount: body.data.problemCount,
    imageUrl: body.data.imageUrl || undefined,
    active: body.data.active,
  }).returning();

  res.status(201).json(serializeCommunity(community));
});

router.put("/communities/:id", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = z.object({
    name: z.string().min(3).max(120).optional(),
    description: z.string().min(10).optional(),
    category: z.string().min(1).optional(),
    memberCount: z.number().int().min(0).optional(),
    problemCount: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    active: z.boolean().optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid input", details: body.error.issues }); return; }

  const updates: Record<string, unknown> = {};
  if (body.data.name !== undefined) updates.name = body.data.name;
  if (body.data.description !== undefined) updates.description = body.data.description;
  if (body.data.category !== undefined) updates.category = body.data.category;
  if (body.data.memberCount !== undefined) updates.memberCount = body.data.memberCount;
  if (body.data.problemCount !== undefined) updates.problemCount = body.data.problemCount;
  if (body.data.imageUrl !== undefined) updates.imageUrl = body.data.imageUrl || null;
  if (body.data.active !== undefined) updates.active = body.data.active;

  const [updated] = await db.update(communityGroupsTable).set(updates as Parameters<typeof communityGroupsTable.$inferSelect>[0]).where(eq(communityGroupsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Community not found" }); return; }
  res.json(serializeCommunity(updated));
});

router.delete("/communities/:id", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(communityGroupsTable).where(eq(communityGroupsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Community not found" }); return; }
  res.json({ success: true });
});

// ---- Community Tasks ----
router.get("/communities/:id/tasks", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const tasks = await db.select().from(communityTasksTable).where(eq(communityTasksTable.communityId, id)).orderBy(desc(communityTasksTable.createdAt));
  res.json(tasks.map(serializeTask));
});

router.post("/communities/:id/tasks", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(5),
    assignedTo: z.string().optional().or(z.literal("")),
    status: z.enum(["pending", "in_progress", "done"]).default("pending"),
    dueDate: z.string().optional().or(z.literal("")),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid input", details: body.error.issues }); return; }

  const [task] = await db.insert(communityTasksTable).values({
    communityId: id,
    title: body.data.title,
    description: body.data.description,
    assignedTo: body.data.assignedTo || undefined,
    status: body.data.status,
    dueDate: body.data.dueDate || undefined,
  }).returning();

  res.status(201).json(serializeTask(task));
});

router.put("/communities/:id/tasks/:taskId", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  const taskId = parseId((req.params as { taskId?: string }).taskId);
  if (id === null || taskId === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(5).optional(),
    assignedTo: z.string().optional().or(z.literal("")),
    status: z.enum(["pending", "in_progress", "done"]).optional(),
    dueDate: z.string().optional().or(z.literal("")),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid input", details: body.error.issues }); return; }

  const updates: Record<string, unknown> = {};
  if (body.data.title !== undefined) updates.title = body.data.title;
  if (body.data.description !== undefined) updates.description = body.data.description;
  if (body.data.assignedTo !== undefined) updates.assignedTo = body.data.assignedTo || null;
  if (body.data.status !== undefined) updates.status = body.data.status;
  if (body.data.dueDate !== undefined) updates.dueDate = body.data.dueDate || null;

  const [updated] = await db.update(communityTasksTable).set(updates as Parameters<typeof communityTasksTable.$inferSelect>[0])
    .where(and(eq(communityTasksTable.id, taskId), eq(communityTasksTable.communityId, id)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(serializeTask(updated));
});

router.delete("/communities/:id/tasks/:taskId", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  const taskId = parseId((req.params as { taskId?: string }).taskId);
  if (id === null || taskId === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(communityTasksTable)
    .where(and(eq(communityTasksTable.id, taskId), eq(communityTasksTable.communityId, id)))
    .returning();
  if (!deleted) { res.status(404).json({ error: "Task not found" }); return; }
  res.json({ success: true });
});

// ---- Contributions ----
router.get("/contributions", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "pending";
  const rows = await db.select().from(contributionsTable)
    .where(eq(contributionsTable.status, status))
    .orderBy(desc(contributionsTable.createdAt));

  const out = await Promise.all(rows.map(async (c) => {
    const [problem, user] = await Promise.all([
      db.query.problemsTable.findFirst({ where: eq(problemsTable.id, c.problemId) }),
      db.query.usersTable.findFirst({ where: eq(usersTable.id, c.userId) }),
    ]);
    return {
      id: c.id,
      problemId: c.problemId,
      problemTitle: problem?.title ?? "Unknown",
      userId: c.userId,
      userName: user?.name ?? "Unknown",
      userEmail: user?.email ?? "",
      amount: c.amount,
      paymentMethod: c.paymentMethod,
      paymentMethodOther: c.paymentMethodOther ?? undefined,
      transactionId: c.transactionId,
      proofImageUrl: c.proofImageUrl ?? undefined,
      status: c.status,
      rejectionReason: c.rejectionReason ?? undefined,
      createdAt: c.createdAt.toISOString(),
    };
  }));

  res.json(out);
});

router.post("/contributions/:id/approve", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const applied = await db.transaction(async (tx) => {
      const [updated] = await tx.update(contributionsTable)
        .set({ status: "approved", reviewedById: req.user!.id, reviewedAt: new Date(), rejectionReason: null })
        .where(and(eq(contributionsTable.id, id), eq(contributionsTable.status, "pending")))
        .returning();
      if (!updated) return null;
      await tx.update(problemsTable)
        .set({
          fundingRaised: sql`funding_raised + ${updated.amount}`,
          progressPercent: sql`LEAST(100, (funding_raised + ${updated.amount}) * 100.0 / NULLIF(funding_goal, 0))`,
        })
        .where(eq(problemsTable.id, updated.problemId));
      await tx.update(usersTable)
        .set({ totalContributed: sql`total_contributed + ${updated.amount}` })
        .where(eq(usersTable.id, updated.userId));
      return updated;
    });
    if (!applied) {
      const existing = await db.query.contributionsTable.findFirst({ where: eq(contributionsTable.id, id) });
      if (!existing) { res.status(404).json({ error: "Not found" }); return; }
      res.status(409).json({ error: `Cannot approve a contribution that is already ${existing.status}` });
      return;
    }
    res.json({ success: true, message: "Contribution approved and applied to problem" });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/contributions/:id/reject", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = z.object({ reason: z.string().min(1).max(500) }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "A rejection reason is required" }); return; }
  const [updated] = await db.update(contributionsTable)
    .set({ status: "rejected", reviewedById: req.user!.id, reviewedAt: new Date(), rejectionReason: body.data.reason })
    .where(and(eq(contributionsTable.id, id), eq(contributionsTable.status, "pending")))
    .returning();
  if (!updated) {
    const existing = await db.query.contributionsTable.findFirst({ where: eq(contributionsTable.id, id) });
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    res.status(409).json({ error: `Cannot reject a contribution that is already ${existing.status}` });
    return;
  }
  res.json({ success: true, message: "Contribution rejected" });
});

// ---- NGO applications ----
router.get("/ngos", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "pending";
  const rows = await db.select().from(ngoProfilesTable)
    .where(eq(ngoProfilesTable.status, status))
    .orderBy(desc(ngoProfilesTable.createdAt));

  const out = await Promise.all(rows.map(async (n) => {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, n.userId) });
    return {
      id: n.id,
      userId: n.userId,
      userName: user?.name ?? "Unknown",
      userEmail: user?.email ?? "",
      organization: n.organization,
      contactNumber: n.contactNumber,
      planDescription: n.planDescription,
      estimatedCost: n.estimatedCost,
      timelineValue: n.timelineValue,
      timelineUnit: n.timelineUnit,
      requiredResources: n.requiredResources,
      previousWorkUrl: n.previousWorkUrl ?? undefined,
      certificateUrl: n.certificateUrl ?? undefined,
      agreedToProvideUpdates: n.agreedToProvideUpdates,
      status: n.status,
      rejectionReason: n.rejectionReason ?? undefined,
      createdAt: n.createdAt.toISOString(),
    };
  }));

  res.json(out);
});

router.post("/ngos/:id/approve", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db.update(ngoProfilesTable)
    .set({ status: "approved", reviewedById: req.user!.id, reviewedAt: new Date(), rejectionReason: null })
    .where(and(eq(ngoProfilesTable.id, id), eq(ngoProfilesTable.status, "pending")))
    .returning();
  if (!updated) {
    const existing = await db.query.ngoProfilesTable.findFirst({ where: eq(ngoProfilesTable.id, id) });
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    res.status(409).json({ error: `Cannot approve an application that is already ${existing.status}` });
    return;
  }
  res.json({ success: true, message: "NGO approved" });
});

router.post("/ngos/:id/reject", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = z.object({ reason: z.string().min(1).max(500) }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "A rejection reason is required" }); return; }
  const [updated] = await db.update(ngoProfilesTable)
    .set({ status: "rejected", reviewedById: req.user!.id, reviewedAt: new Date(), rejectionReason: body.data.reason })
    .where(and(eq(ngoProfilesTable.id, id), eq(ngoProfilesTable.status, "pending")))
    .returning();
  if (!updated) {
    const existing = await db.query.ngoProfilesTable.findFirst({ where: eq(ngoProfilesTable.id, id) });
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    res.status(409).json({ error: `Cannot reject an application that is already ${existing.status}` });
    return;
  }
  res.json({ success: true, message: "NGO rejected" });
});

// ---- Problem Work Progress ----
router.put("/problems/:id/work-progress", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = z.object({ workProgressPercent: z.number().int().min(0).max(100) }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "workProgressPercent must be 0–100" }); return; }
  const pct = body.data.workProgressPercent;
  const statusMap: Record<number, string> = { 0: "reported", 20: "community_joined", 40: "funding_started", 60: "in_progress", 80: "completed" };
  const thresholds = [0, 20, 40, 60, 80];
  const statusKey = thresholds.reduce((acc, t) => pct >= t ? t : acc, 0);
  const newStatus = statusMap[statusKey];
  const [updated] = await db.update(problemsTable)
    .set({ workProgressPercent: pct, status: newStatus })
    .where(eq(problemsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Problem not found" }); return; }
  res.json({ success: true, workProgressPercent: updated.workProgressPercent, status: updated.status });
});

// ---- NGO Join Applications ----
router.get("/ngo-applications", async (_req, res) => {
  const apps = await db
    .select({
      id: ngoJoinApplicationsTable.id,
      problemId: ngoJoinApplicationsTable.problemId,
      problemTitle: problemsTable.title,
      problemCategory: problemsTable.category,
      ngoUserId: ngoJoinApplicationsTable.ngoUserId,
      ngoName: usersTable.name,
      planDescription: ngoJoinApplicationsTable.planDescription,
      estimatedCost: ngoJoinApplicationsTable.estimatedCost,
      timelineValue: ngoJoinApplicationsTable.timelineValue,
      timelineUnit: ngoJoinApplicationsTable.timelineUnit,
      requiredResources: ngoJoinApplicationsTable.requiredResources,
      status: ngoJoinApplicationsTable.status,
      rejectionReason: ngoJoinApplicationsTable.rejectionReason,
      createdAt: ngoJoinApplicationsTable.createdAt,
      reviewedAt: ngoJoinApplicationsTable.reviewedAt,
    })
    .from(ngoJoinApplicationsTable)
    .leftJoin(problemsTable, eq(ngoJoinApplicationsTable.problemId, problemsTable.id))
    .leftJoin(usersTable, eq(ngoJoinApplicationsTable.ngoUserId, usersTable.id))
    .orderBy(desc(ngoJoinApplicationsTable.createdAt));
  res.json({ applications: apps });
});

router.post("/ngo-applications/:id/accept", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db.update(ngoJoinApplicationsTable)
    .set({ status: "accepted", reviewedById: req.user!.id, reviewedAt: new Date(), rejectionReason: null })
    .where(eq(ngoJoinApplicationsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Application not found" }); return; }
  res.json({ success: true });
});

router.post("/ngo-applications/:id/reject", async (req, res) => {
  const id = parseId((req.params as { id?: string }).id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = z.object({ reason: z.string().min(1).max(500).optional() }).safeParse(req.body);
  const reason = body.success ? (body.data.reason ?? "") : "";
  const [updated] = await db.update(ngoJoinApplicationsTable)
    .set({ status: "rejected", reviewedById: req.user!.id, reviewedAt: new Date(), rejectionReason: reason })
    .where(eq(ngoJoinApplicationsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Application not found" }); return; }
  res.json({ success: true });
});

export default router;
