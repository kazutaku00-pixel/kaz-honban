# NihonGo - Japanese Language Lesson Platform

## Project Overview
Online Japanese lesson marketplace connecting students with native Japanese teachers.

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage)
- **Video**: Daily.co (WebRTC)
- **Payments**: Stripe
- **Hosting**: Vercel

## Project Structure
```
src/
├── app/
│   ├── (auth)/      # Login, Signup (public)
│   ├── (student)/   # Student pages (dashboard, teachers, lessons)
│   ├── (teacher)/   # Teacher pages (dashboard, schedule, earnings)
│   ├── (admin)/     # Admin pages (users, approvals)
│   ├── room/[id]/   # Video call room
│   └── api/         # API routes
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Header, Footer
│   ├── teachers/    # Teacher-specific components
│   ├── lessons/     # Lesson-specific components
│   └── video/       # Video call components
├── lib/
│   ├── supabase/    # Supabase client (client.ts, server.ts, middleware.ts)
│   ├── stripe/      # Stripe server client
│   └── daily/       # Daily.co room management
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

## Key Patterns
- Server Components by default, 'use client' only when needed
- Supabase SSR pattern: separate client/server clients
- RLS enforced on all tables
- API routes handle business logic, pages handle display

## Database
- Schema: `supabase/migrations/00001_initial_schema.sql`
- Types: `src/types/database.ts`
- All timestamps in UTC (TIMESTAMPTZ)
- Teacher stats (avg_rating, total_reviews, total_lessons) auto-updated via triggers

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
