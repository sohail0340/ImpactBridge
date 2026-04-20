import { Router } from "express";
import { db, contributionsTable, problemsTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const CreateBody = z.object({
  problemId: z.number().int().positive(),
  amount: z.number().positive(),
  anonymous: z.boolean().optional().default(false),
  paymentMethod: z.enum(["jazzcash", "easypaisa", "bank", "other"]),
  paymentMethodOther: z.string().max(100).optional(),
  transactionId: z.string().min(1).max(200),
  proofImageUrl: z.string().url().or(z.string().startsWith("/")).optional(),
});

function formatContribution(
  c: typeof contributionsTable.$inferSelect,
  problemTitle: string | null,
) {
  return {
    id: c.id,
    problemId: c.problemId,
    problemTitle: problemTitle ?? "Unknown Problem",
    userId: c.userId,
    amount: c.amount,
    anonymous: c.anonymous,
    paymentMethod: c.paymentMethod,
    paymentMethodOther: c.paymentMethodOther ?? undefined,
    transactionId: c.transactionId,
    proofImageUrl: c.proofImageUrl ?? undefined,
    status: c.status,
    rejectionReason: c.rejectionReason ?? undefined,
    createdAt: c.createdAt.toISOString(),
    reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : undefined,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const rows = await db.select().from(contributionsTable)
    .where(eq(contributionsTable.userId, req.user!.id))
    .orderBy(desc(contributionsTable.createdAt));

  const result = await Promise.all(rows.map(async (c) => {
    const problem = await db.query.problemsTable.findFirst({ where: eq(problemsTable.id, c.problemId) });
    return formatContribution(c, problem?.title ?? null);
  }));

  res.json(result);
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

  const d = parsed.data;
  if (d.paymentMethod === "other" && !d.paymentMethodOther) {
    res.status(400).json({ error: "Please specify your payment method when selecting 'Other'" });
    return;
  }

  const problem = await db.query.problemsTable.findFirst({ where: eq(problemsTable.id, d.problemId) });
  if (!problem) { res.status(404).json({ error: "Problem not found" }); return; }

  const [contribution] = await db.insert(contributionsTable).values({
    problemId: d.problemId,
    userId: req.user!.id,
    amount: d.amount,
    anonymous: d.anonymous ?? false,
    paymentMethod: d.paymentMethod,
    paymentMethodOther: d.paymentMethod === "other" ? d.paymentMethodOther : null,
    transactionId: d.transactionId,
    proofImageUrl: d.proofImageUrl ?? null,
    status: "pending",
  }).returning();

  res.status(201).json(formatContribution(contribution, problem.title));
});

// A contributor can view a single contribution they submitted
router.get("/:id", requireAuth, async (req, res) => {
  const idParam = (req.params as { id?: string }).id ?? "";
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const c = await db.query.contributionsTable.findFirst({ where: eq(contributionsTable.id, id) });
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  if (c.userId !== req.user!.id && req.user!.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const problem = await db.query.problemsTable.findFirst({ where: eq(problemsTable.id, c.problemId) });
  res.json(formatContribution(c, problem?.title ?? null));
});

export default router;
