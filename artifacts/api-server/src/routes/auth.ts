import { Router } from "express";
import { db, usersTable, ngoProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";
import { signToken, requireAuth } from "../middlewares/auth";

const router = Router();

const NgoFields = z.object({
  organization: z.string().min(2).max(200),
  contactNumber: z.string().min(4).max(40),
  planDescription: z.string().max(5000).optional().default(""),
  estimatedCost: z.number().min(0).optional().default(0),
  timelineValue: z.number().int().min(0).optional().default(1),
  timelineUnit: z.enum(["days", "months"]).optional().default("months"),
  requiredResources: z.string().max(5000).optional().default(""),
  previousWorkUrl: z.string().optional(),
  certificateUrl: z.string().optional(),
  agreedToProvideUpdates: z.boolean(),
});

const SignupBody = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(200),
  role: z.enum(["user", "ngo"]).optional().default("user"),
  ngo: NgoFields.optional(),
});

const LoginBody = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

function serializeUser(u: typeof usersTable.$inferSelect) {
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

router.post("/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { name, email, password, role, ngo } = parsed.data;

  if (role === "ngo") {
    if (!ngo) { res.status(400).json({ error: "NGO registration requires organisation details" }); return; }
    if (!ngo.agreedToProvideUpdates) { res.status(400).json({ error: "You must agree to provide updates and proof of work" }); return; }
  }

  const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
  if (existing) { res.status(409).json({ error: "Email already registered" }); return; }

  const passwordHash = await bcrypt.hash(password, 10);
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

  const [user] = await db.insert(usersTable)
    .values({ name, email, passwordHash, role, avatarUrl })
    .returning();

  if (role === "ngo" && ngo) {
    await db.insert(ngoProfilesTable).values({
      userId: user.id,
      organization: ngo.organization,
      contactNumber: ngo.contactNumber,
      planDescription: ngo.planDescription,
      estimatedCost: ngo.estimatedCost,
      timelineValue: ngo.timelineValue,
      timelineUnit: ngo.timelineUnit,
      requiredResources: ngo.requiredResources,
      previousWorkUrl: ngo.previousWorkUrl ?? null,
      certificateUrl: ngo.certificateUrl ?? null,
      agreedToProvideUpdates: ngo.agreedToProvideUpdates,
      status: "pending",
    });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user: serializeUser(user) });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { email, password } = parsed.data;

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
  if (!user || !user.passwordHash) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: serializeUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user!.id) });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ user: serializeUser(user) });
});

export default router;
