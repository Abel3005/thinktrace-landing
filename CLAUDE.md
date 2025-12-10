# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThinkTrace is an AI-powered capability assessment and improvement service landing page built with Next.js 16, React 19, TypeScript, and Supabase. The application is in Korean (ko) and focuses on evaluating and improving users' AI utilization capabilities through process-based assessment.

## Development Commands

```bash
# Install dependencies
npm install

# Development server (runs on http://localhost:3000 by default)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Tech Stack Architecture

### Core Framework
- **Next.js 16** with App Router (React Server Components by default)
- **React 19** with React 19.2.0
- **TypeScript** with strict mode enabled
- **Tailwind CSS 4** with postcss

### Authentication & Database
- **Supabase** for authentication and database
  - Uses SSR package (`@supabase/ssr`) for server/client split
  - Client: `lib/supabase/client.ts` - singleton pattern for browser
  - Server: `lib/supabase/server.ts` - creates per-request instances
  - Middleware handles auth state and route protection

### UI Components
- **shadcn/ui** (New York style variant) with Radix UI primitives
- Components configured in `components.json` with path aliases
- Icons from **lucide-react**
- Theme support via **next-themes** (dark mode default)

### Project Structure

```
app/
  ├── layout.tsx          # Root layout with Korean locale, dark theme default
  ├── page.tsx            # Landing page with feature showcase
  ├── login/page.tsx      # Login page
  ├── signup/page.tsx     # Signup page
  └── dashboard/page.tsx  # Protected dashboard (server component)

components/
  ├── auth/               # Authentication forms (client components)
  ├── dashboard/          # Dashboard-specific components
  └── ui/                 # shadcn/ui components

lib/
  ├── supabase/
  │   ├── client.ts       # Browser client (singleton)
  │   └── server.ts       # Server client (per-request)
  └── utils.ts            # cn() utility for className merging

middleware.ts             # Route protection and auth redirect logic
```

## Important Implementation Details

### Authentication Flow
- **Middleware** (`middleware.ts`) handles authentication at routes: `/dashboard/*`, `/login`, `/signup`
- Protected routes: `/dashboard/*` redirects to `/login` if not authenticated
- Authenticated users accessing `/login` or `/signup` redirect to `/dashboard`
- Uses Supabase auth with cookie-based session management

### Client vs Server Components
- **Server Components** (default): `app/dashboard/page.tsx`, `app/layout.tsx`
  - Use `getSupabaseServerClient()` from `lib/supabase/server.ts`
  - Can directly query database and check auth state
- **Client Components**: Auth forms, interactive UI components
  - Marked with `"use client"` directive
  - Use `getSupabaseBrowserClient()` from `lib/supabase/client.ts`

### Database Schema
The dashboard expects these Supabase tables:
- `users` table with fields: `id`, `api_key`, and other user data
- `user_statistics` table with `user_id` foreign key for stats display

### Path Aliases
- `@/*` maps to project root (configured in `tsconfig.json` and `components.json`)
- Example: `@/components/ui/button`, `@/lib/utils`

### Build Configuration
- TypeScript build errors are ignored (`ignoreBuildErrors: true` in `next.config.mjs`)
- Images are unoptimized for deployment flexibility

### Environment Variables
Required in `.env` (not checked into git):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Adding New Features

### Adding a Protected Route
1. Create page in `app/` directory
2. Add route pattern to `middleware.ts` config matcher
3. Use `getSupabaseServerClient()` to check auth in server components

### Adding UI Components
Use shadcn/ui CLI with the New York style variant already configured:
```bash
npx shadcn@latest add <component-name>
```

### Creating Client Components
1. Add `"use client"` directive at top
2. Use `getSupabaseBrowserClient()` for Supabase operations
3. Handle loading/error states explicitly

## Styling Conventions
- Uses Tailwind utility classes with dark mode by default
- Common patterns: `bg-card/30 backdrop-blur-sm` for glassmorphic effects
- Border styling: `border-border/50`
- Text: `text-muted-foreground` for secondary text
