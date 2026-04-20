import { Router } from "express";
import { db } from "@workspace/db";
import { ngoJoinApplicationsTable, problemsTable, usersTable, ngoProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

const SubmitBody = z.object({
  planDescription: z.string().min(10, "Please describe your plan (min 10 chars)").max(5000),
  estimatedCost: z.number().min(0).optional().default(0),
  timelineValue: z.number().int().min(1).optional().default(1),
  timelineUnit: z.enum(["days", "months"]).optional().default("months"),
  requiredResources: z.string().max(5000).optional().default(""),
});

// Submit an application to join/solve a problem as NGO
router.post("/:id/ngo-application", requireRole("ngo"), async (req, res) => {
  const problemId = parseInt(req.params.id, 10);
  if (isNaN(problemId)) { res.status(400).json({ error: "Invalid problem id" }); return; }

  const ngo = await db.query.ngoProfilesTable.findFirst({ where: eq(ngoProfilesTable.userId, req.user!.id) });
  if (!ngo || ngo.status !== "approved") {
    res.status(403).json({ error: "NGO profile must be approved by admin before applying" });
    return;
  }

  const parsed = SubmitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }); return; }

  // Check problem exists
  const problem = await db.query.problemsTable.findFirst({ where: eq(problemsTable.id, problemId) });
  if (!problem) { res.status(404).json({ error: "Problem not found" }); return; }

  // Upsert: if already applied, update it (allow re-submission if rejected)
  const existing = await db.query.ngoJoinApplicationsTable.findFirst({
    where: and(eq(ngoJoinApplicationsTable.problemId, problemId), eq(ngoJoinApplicationsTable.ngoUserId, req.user!.id)),
  });

  if (existing) {
    if (existing.status === "accepted") {
      res.status(409).json({ error: "Your application is already accepted" });
      return;
    }
    const [updated] = await db.update(ngoJoinApplicationsTable)
      .set({ ...parsed.data, status: "pending", reviewedById: null, reviewedAt: null, rejectionReason: null })
      .where(eq(ngoJoinApplicationsTable.id, existing.id))
      .returning();
    res.json({ success: true, application: updated });
    return;
  }

  const [app] = await db.insert(ngoJoinApplicationsTable).values({
    problemId,
    ngoUserId: req.user!.id,
    ...parsed.data,
    status: "pending",
  }).returning();

  res.status(201).json({ success: true, application: app });
});

// Get my own application for a specific problem
router.get("/:id/ngo-application/mine", requireRole("ngo"), async (req, res) => {
  const problemId = parseInt(req.params.id, 10);
  if (isNaN(problemId)) { res.status(400).json({ error: "Invalid problem id" }); return; }

  const app = await db.query.ngoJoinApplicationsTable.findFirst({
    where: and(eq(ngoJoinApplicationsTable.problemId, problemId), eq(ngoJoinApplicationsTable.ngoUserId, req.user!.id)),
  });

  res.json({ application: app ?? null });
});

// Get all my applications (NGO user)
router.get("/my-ngo-applications", requireRole("ngo"), async (req, res) => {
  const apps = await db
    .select({
      id: ngoJoinApplicationsTable.id,
      problemId: ngoJoinApplicationsTable.problemId,
      problemTitle: problemsTable.title,
      problemCategory: problemsTable.category,
      planDescription: ngoJoinApplicationsTable.planDescription,
      estimatedCost: ngoJoinApplicationsTable.estimatedCost,
      timelineValue: ngoJoinApplicationsTable.timelineValue,
      timelineUnit: ngoJoinApplicationsTable.timelineUnit,
      requiredResources: ngoJoinApplicationsTable.requiredResources,
      status: ngoJoinApplicationsTable.status,
      rejectionReason: ngoJoinApplicationsTable.rejectionReason,
      createdAt: ngoJoinApplicationsTable.createdAt,
    })
    .from(ngoJoinApplicationsTable)
    .leftJoin(problemsTable, eq(ngoJoinApplicationsTable.problemId, problemsTable.id))
    .where(eq(ngoJoinApplicationsTable.ngoUserId, req.user!.id))
    .orderBy(ngoJoinApplicationsTable.createdAt);
  res.json({ applications: apps });
});

export default router;
