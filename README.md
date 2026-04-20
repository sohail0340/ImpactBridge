# ImpactBridge

**A social impact platform where citizens report local problems, gather communities, crowdfund solutions, and track verified progress.**

Built by **Learndev** — turning community frustration into real, measurable change.

---

## What is ImpactBridge?

ImpactBridge connects citizens with their communities to collectively solve local problems — broken roads, polluted parks, failing infrastructure, and more. Anyone can report a problem, gather supporters, crowdfund a fix, and follow every rupee and milestone until it's resolved.

We believe accountability is the missing ingredient in civic action. ImpactBridge makes it unavoidable.

---

## Features

- **Report Problems** — Citizens submit local issues with photos, location, and cost estimates
- **Community Support** — Neighbours join, verify, and back the issues they care about
- **Transparent Crowdfunding** — Every donation tracked; full financial visibility
- **Progress Tracking** — Photo updates, milestone logs, and admin-verified progress
- **NGO Applications** — Organizations apply to lead solutions on specific problems
- **5 Active Communities** — Green Cities, Road Warriors, Education First, Health for All, Digital Inclusion
- **Admin Panel** — Full control over problems, users, NGO approvals, and progress updates
- **Role-based Access** — Citizens, NGOs, and admins each have tailored dashboards

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Drizzle ORM |
| Auth | Session-based with bcrypt |
| Package Manager | pnpm (monorepo workspace) |
| Deployment | Cloud-hosted, production-ready |

---

## Project Structure

```
ImpactBridge/
├── artifacts/
│   ├── api-server/          # Express REST API
│   │   └── src/
│   │       ├── routes/      # Auth, problems, NGOs, admin, etc.
│   │       ├── middlewares/
│   │       └── seed.ts      # Database seeding
│   └── impact-bridge/       # React + Vite frontend
│       └── src/
│           ├── pages/       # Home, Explore, Profile, Dashboard, Admin
│           ├── components/  # ProblemCard, Navbar, etc.
│           └── services/    # API client
├── lib/
│   ├── db/                  # Drizzle schema & migrations
│   └── api-client/          # Shared API types
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/sohail0340/ImpactBridge.git
cd ImpactBridge

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Fill in: DATABASE_URL, SESSION_SECRET

# Push database schema
pnpm --filter @workspace/db run db:push

# Start development servers
pnpm --filter @workspace/api-server run dev &
pnpm --filter @workspace/impact-bridge run dev
```

The API runs on port 8080 and the frontend on port 18227 by default.

---

## Team

**Learndev**

| Name | Role |
|---|---|
| **Sohail Ahmad** | Full-Stack Developer |
| **Haris Ahmad** | Full-Stack Developer |

We're two developers who believe technology should make civic life better — not just easier. ImpactBridge is our attempt to prove that.

---

## License

MIT — free to use, modify, and distribute.
