# ImpactBridge

## Overview

ImpactBridge is a social impact platform where citizens report local community problems, gather communities around them, crowdfund solutions, and track real verified progress. Built as a full-stack React + Vite + Express application in a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 18 + Vite + Tailwind CSS v4 + Wouter (routing)
- **Backend**: Express 5 + Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Icons**: Lucide React

## Artifacts

- **impact-bridge** (`/`) — Main React frontend app
- **api-server** (`/api`) — Express REST API backend

## Pages

- `/` — Home: Hero, How It Works, Featured Problems, Trust section
- `/explore` — Explore Problems with search/filter/sort
- `/problems/:id` — Problem Detail with funding, timeline, community
- `/create` — Create/Report a Problem form
- `/community` — Community groups, chat, tasks
- `/dashboard` — User dashboard with stats
- `/profile` — User profile page
- `/login` — Login page
- `/signup` — Signup page
- `/admin` — Admin panel (admin role required)
  - Dashboard: platform stats overview (users, problems, communities, funds raised, pending actions)
  - Users: full list, search by name/email, filter by role, change role, delete
  - NGO Verification: review applications with documents, approve/reject with reason
  - Problems: list all (including rejected), search, filter by status, hide/restore/delete, create new
  - Communities: full CRUD — create/edit/delete communities; add/edit/delete tasks per community; task accordion with status breakdown
  - Contributions: pending/approved/rejected, payment proof links, approve/reject with reason

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Database Schema

Tables: `users`, `problems`, `contributions`, `updates`, `comments`, `community_groups`, `community_tasks`, `community_messages`, `community_members`, `notifications`

### Community Data (5 Premium Communities)
- **UrbanPulse Collective** (Roads) — 1,247 members, 5 tasks
- **AquaVerity Initiative** (Water) — 589 members, 5 tasks
- **CivicShield Alliance** (Safety) — 2,103 members, 5 tasks
- **StreetFlow Network** (Sanitation) — 743 members, 5 tasks
- **BrightPath Education Hub** (Education) — 1,891 members, 5 tasks

`community_tasks` has a `community_id` FK column so tasks are scoped per community group. The public `/api/community/tasks` endpoint supports `?communityId=` filtering. The Community page filters tasks client-side by selected group.

## Design System

- Primary color: Teal (#10B981 / hsl 168 84% 38%)
- Accent color: Amber (hsl 38 92% 50%)
- Background: Dark navy for hero/navbar, light gray for content
- Font: Inter system-ui

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
