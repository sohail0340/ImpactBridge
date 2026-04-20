import { Router } from "express";
import { db } from "@workspace/db";
import { commentsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { GetProblemCommentsParams, CreateCommentBody } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const parsed = GetProblemCommentsParams.safeParse({ id: (req.params as { id?: string }).id });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const comments = await db.select().from(commentsTable)
    .where(eq(commentsTable.problemId, parsed.data.id))
    .orderBy(asc(commentsTable.createdAt));

  res.json(comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    authorAvatar: c.authorAvatar ?? undefined,
  })));
});

router.post("/", async (req, res) => {
  const idParsed = GetProblemCommentsParams.safeParse({ id: (req.params as { id?: string }).id });
  const bodyParsed = CreateCommentBody.safeParse(req.body);
  if (!idParsed.success || !bodyParsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [comment] = await db.insert(commentsTable).values({
    problemId: idParsed.data.id,
    content: bodyParsed.data.content,
    author: "You",
  }).returning();

  res.status(201).json({ ...comment, createdAt: comment.createdAt.toISOString() });
});

export default router;
