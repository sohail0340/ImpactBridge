import { Router } from "express";
import { db } from "@workspace/db";
import { updatesTable, updateVerificationsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { GetProblemUpdatesParams, CreateProblemUpdateBody } from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../middlewares/auth";

const router = Router({ mergeParams: true });

router.get("/", optionalAuth, async (req, res) => {
  const parsed = GetProblemUpdatesParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const updates = await db.select().from(updatesTable)
    .where(eq(updatesTable.problemId, parsed.data.id))
    .orderBy(desc(updatesTable.createdAt));

  let verifiedByMe = new Set<number>();
  if (req.user && updates.length > 0) {
    const myVotes = await db.select({ updateId: updateVerificationsTable.updateId })
      .from(updateVerificationsTable)
      .where(eq(updateVerificationsTable.userId, req.user.id));
    verifiedByMe = new Set(myVotes.map((v) => v.updateId));
  }

  res.json(updates.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    imageUrl: u.imageUrl ?? undefined,
    authorAvatar: u.authorAvatar ?? undefined,
    verifiedByMe: verifiedByMe.has(u.id),
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const idParsed = GetProblemUpdatesParams.safeParse({ id: req.params.id });
  const bodyParsed = CreateProblemUpdateBody.safeParse(req.body);
  if (!idParsed.success || !bodyParsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const author = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user!.id) });

  const [update] = await db.insert(updatesTable).values({
    problemId: idParsed.data.id,
    content: bodyParsed.data.content,
    author: author?.name ?? "Community Member",
    authorAvatar: author?.avatarUrl ?? null,
    imageUrl: bodyParsed.data.imageUrl ?? null,
  }).returning();

  res.status(201).json({ ...update, createdAt: update.createdAt.toISOString() });
});

const VerifyParams = z.object({
  problemId: z.coerce.number().int().positive(),
  updateId: z.coerce.number().int().positive(),
});

router.post("/:updateId/verify", requireAuth, async (req, res) => {
  const parsed = VerifyParams.safeParse({
    problemId: req.params.id,
    updateId: req.params.updateId,
  });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  // Scope: update must belong to the problem in the URL
  const update = await db.query.updatesTable.findFirst({
    where: and(
      eq(updatesTable.id, parsed.data.updateId),
      eq(updatesTable.problemId, parsed.data.problemId),
    ),
  });
  if (!update) { res.status(404).json({ error: "Update not found" }); return; }

  // Conflict-safe insert via unique constraint on (updateId, userId)
  try {
    await db.insert(updateVerificationsTable).values({
      updateId: parsed.data.updateId,
      userId: req.user!.id,
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "23505") {
      res.status(409).json({ error: "Already verified", verifiedCount: update.verifiedCount, verifiedByMe: true });
      return;
    }
    throw e;
  }

  const [updated] = await db.update(updatesTable)
    .set({ verifiedCount: sql`${updatesTable.verifiedCount} + 1` })
    .where(eq(updatesTable.id, parsed.data.updateId))
    .returning();

  res.json({ verifiedCount: updated.verifiedCount, verifiedByMe: true });
});

export default router;
