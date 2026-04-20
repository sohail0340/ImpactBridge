import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import {
  usersTable,
  communityGroupsTable,
  problemsTable,
} from "@workspace/db";
import { eq, count, sql, isNull } from "drizzle-orm";
import { logger } from "./lib/logger";

export async function seedIfEmpty() {
  // ── Check each table independently so re-deploys don't duplicate data ──
  const [{ total: problemCount }] = await db.select({ total: count() }).from(problemsTable);
  const [{ total: communityCount }] = await db.select({ total: count() }).from(communityGroupsTable);

  // Find or create the admin seed user (used as postedById for problems)
  let adminSeedUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, "admin@example.com"),
  });

  if (!adminSeedUser) {
    logger.info("[seed] Creating admin users…");
    const adminHash = await bcrypt.hash("password123", 10);
    const sohailHash = await bcrypt.hash("SohailHarisProject", 10);

    [adminSeedUser] = await db.insert(usersTable).values({
      name: "Admin",
      email: "admin@example.com",
      passwordHash: adminHash,
      role: "admin",
      reputationScore: 100,
    }).returning();

    await db.insert(usersTable).values({
      name: "Sohail Ahmad",
      email: "sohailahmadsalo0340@gmail.com",
      passwordHash: sohailHash,
      role: "admin",
      reputationScore: 100,
    }).onConflictDoNothing();

    logger.info("[seed] Admin users created");
  }

  // ── Communities ──────────────────────────────────────────────────────────
  if (Number(communityCount) === 0) {
    logger.info("[seed] Seeding communities…");
    await db.insert(communityGroupsTable).values([
      {
        name: "Clean Streets Alliance",
        description: "Uniting citizens to tackle waste, sanitation, and road infrastructure problems across the city.",
        category: "Infrastructure",
        memberCount: 248,
        problemCount: 34,
      },
      {
        name: "Safe Schools Network",
        description: "Protecting children's right to quality education by solving school infrastructure and safety issues.",
        category: "Education",
        memberCount: 187,
        problemCount: 22,
      },
      {
        name: "Green City Initiative",
        description: "A community driving environmental solutions — tree planting, pollution control, and park restoration.",
        category: "Environment",
        memberCount: 312,
        problemCount: 41,
      },
      {
        name: "Health for All",
        description: "Bridging gaps in public health access, clean water, and sanitation for underserved communities.",
        category: "Health",
        memberCount: 156,
        problemCount: 19,
      },
      {
        name: "Digital Inclusion Project",
        description: "Bringing internet access and digital literacy to rural and low-income urban communities.",
        category: "Technology",
        memberCount: 93,
        problemCount: 11,
      },
    ]);
    logger.info("[seed] 5 communities created");
  }

  // ── Problems ─────────────────────────────────────────────────────────────
  if (Number(problemCount) === 0) {
    logger.info("[seed] Seeding sample problems…");
    await db.insert(problemsTable).values([
      {
        title: "Pothole blocking school access on MG Road",
        description: "A large pothole has formed on MG Road near the school entrance. Students and parents are forced to go home the long way, damaging vehicles and making the journey dangerous during rain.",
        category: "Roads",
        location: "MG Road, Bangalore, Karnataka",
        imageUrl: "https://images.unsplash.com/photo-1594149929911-78975a43d4f5?w=800&q=80",
        status: "reported",
        urgency: "high",
        fundingGoal: 5000,
        fundingRaised: 1200,
        progressPercent: 24,
        workProgressPercent: 20,
        joinedCount: 14,
        verifiedCount: 7,
        postedById: adminSeedUser!.id,
      },
      {
        title: "Open sewage drain overflowing near residential block",
        description: "An exposed sewage drain in Sector 12 has been overflowing for three weeks, causing health risks for over 300 families. The smell is unbearable and children are falling ill.",
        category: "Sanitation",
        location: "Sector 12, Noida, UP",
        imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
        status: "community_joined",
        urgency: "critical",
        fundingGoal: 12000,
        fundingRaised: 4800,
        progressPercent: 40,
        workProgressPercent: 40,
        joinedCount: 52,
        verifiedCount: 31,
        postedById: adminSeedUser!.id,
      },
      {
        title: "No street lights on Canal Road for 6 months",
        description: "The entire stretch of Canal Road has been without street lights since the last storm. Two accidents have already occurred at night. Residents are scared to walk after dark.",
        category: "Infrastructure",
        location: "Canal Road, Lahore",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        status: "reported",
        urgency: "high",
        fundingGoal: 8000,
        fundingRaised: 0,
        progressPercent: 0,
        workProgressPercent: 0,
        joinedCount: 29,
        verifiedCount: 18,
        postedById: adminSeedUser!.id,
      },
      {
        title: "School toilets unusable — 340 girl students affected",
        description: "The girls' toilets at Government Primary School No. 5 have been broken for over a month. Girls are forced to go home early or skip school entirely. This violates their right to education.",
        category: "Education",
        location: "Model Town, Lahore",
        imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
        status: "in_progress",
        urgency: "critical",
        fundingGoal: 3500,
        fundingRaised: 3500,
        progressPercent: 100,
        workProgressPercent: 60,
        joinedCount: 88,
        verifiedCount: 44,
        postedById: adminSeedUser!.id,
      },
      {
        title: "Illegal dumping site polluting Iqbal Park",
        description: "Garbage is being illegally dumped behind Iqbal Park every night. The pile has grown to over 20 feet. It is attracting pests and polluting the groundwater for surrounding homes.",
        category: "Environment",
        location: "Iqbal Park, Karachi",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=800&q=80",
        status: "reported",
        urgency: "medium",
        fundingGoal: 6000,
        fundingRaised: 900,
        progressPercent: 15,
        workProgressPercent: 0,
        joinedCount: 37,
        verifiedCount: 12,
        postedById: adminSeedUser!.id,
      },
      {
        title: "Broken water pump — village without water for 2 weeks",
        description: "The only hand pump serving Basti Noor Village has broken down. Over 200 villagers are walking 3km daily to fetch water. Women and children are most affected.",
        category: "Water",
        location: "Basti Noor, Multan",
        imageUrl: "https://images.unsplash.com/photo-1594399431770-a67f2b77f4a1?w=800&q=80",
        status: "funding_started",
        urgency: "critical",
        fundingGoal: 15000,
        fundingRaised: 7200,
        progressPercent: 48,
        workProgressPercent: 40,
        joinedCount: 63,
        verifiedCount: 40,
        postedById: adminSeedUser!.id,
      },
      {
        title: "Crumbling boundary wall puts students at risk",
        description: "The perimeter wall of City Boys Secondary School has been crumbling for months. Large sections have already collapsed. Students and teachers are at serious risk.",
        category: "Education",
        location: "Gulberg, Lahore",
        imageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",
        status: "reported",
        urgency: "high",
        fundingGoal: 9000,
        fundingRaised: 2100,
        progressPercent: 23,
        workProgressPercent: 20,
        joinedCount: 41,
        verifiedCount: 20,
        postedById: adminSeedUser!.id,
      },
      {
        title: "Stagnant water breeding mosquitoes in DHA Phase 4",
        description: "A clogged storm drain has created a large pool of stagnant water. Residents report a dramatic rise in mosquitoes, and two dengue cases have already been confirmed nearby.",
        category: "Health",
        location: "DHA Phase 4, Karachi",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
        status: "reported",
        urgency: "critical",
        fundingGoal: 4000,
        fundingRaised: 1500,
        progressPercent: 37,
        workProgressPercent: 20,
        joinedCount: 55,
        verifiedCount: 28,
        postedById: adminSeedUser!.id,
      },
    ]);
    logger.info("[seed] 8 sample problems created");
  }

  // ── Patch any existing problems that have no image ────────────────────────
  const imageMap: Record<string, string> = {
    "Pothole blocking school access on MG Road":
      "https://images.unsplash.com/photo-1594149929911-78975a43d4f5?w=800&q=80",
    "Open sewage drain overflowing near residential block":
      "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
    "No street lights on Canal Road for 6 months":
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    "School toilets unusable — 340 girl students affected":
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "Illegal dumping site polluting Iqbal Park":
      "https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=800&q=80",
    "Broken water pump — village without water for 2 weeks":
      "https://images.unsplash.com/photo-1594399431770-a67f2b77f4a1?w=800&q=80",
    "Crumbling boundary wall puts students at risk":
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",
    "Stagnant water breeding mosquitoes in DHA Phase 4":
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
  };

  const noImageProblems = await db.select({ id: problemsTable.id, title: problemsTable.title })
    .from(problemsTable)
    .where(isNull(problemsTable.imageUrl));

  if (noImageProblems.length > 0) {
    logger.info(`[seed] Patching images on ${noImageProblems.length} problems…`);
    for (const p of noImageProblems) {
      const url = imageMap[p.title];
      if (url) {
        await db.update(problemsTable)
          .set({ imageUrl: url })
          .where(eq(problemsTable.id, p.id));
      }
    }
    logger.info("[seed] Image patch complete ✓");
  }

  if (Number(problemCount) === 0 || Number(communityCount) === 0) {
    logger.info("[seed] Seeding complete ✓");
  }
}
