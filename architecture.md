# Architecture

## Overview

- Stack: TanStack Start (React 19 + TanStack Router) with SSR and server functions.
- Build tooling: Vite with Nitro and TanStack plugins.
- Data and state: TanStack Query for client cache and server integration.
- Persistence: PostgreSQL via `pg` Pool and Drizzle ORM.
- Styling: Tailwind CSS v4 with tokens in `src/styles.css`.

## Runtime layout

- Entry shell/layout: `src/routes/__root.tsx` defines document head, global layout, and devtools panels.
- File-based routing: route files under `src/routes` generate `src/routeTree.gen.ts`.
- Client-side navigation: `@tanstack/react-router` `Link` components are used in `src/components/Header.tsx`.
- Server-side logic: `createServerFn` and route `server.handlers` are used in demo routes.

## Data layer

- Database pool: `src/db/pool.ts` reads `DATABASE_URL` and creates a `pg` Pool.
- Drizzle client: `src/db/index.ts` wraps the pool and exports `db`.
- Schema: `src/db/schema.ts` defines a single `todos` table for demos.
- Migrations and init: `drizzle/` contains migrations; `db/init.sql` initializes demo tables.

## Auth

- Server config: `src/lib/auth.ts` sets up Better Auth with TanStack Start cookies.
- Client hook: `src/lib/auth-client.ts` exports `authClient` for session and sign-in.
- UI integration: `src/integrations/better-auth/header-user.tsx` renders session controls in the header.

## State and data fetching

- Query client: `src/integrations/tanstack-query/root-provider.tsx` creates and provides `QueryClient`.
- Devtools: `src/integrations/tanstack-query/devtools.tsx` wires TanStack Query panels into the root layout.

## Styling

- Global styles and tokens: `src/styles.css` uses Tailwind v4, defines color tokens and base layer.
- UI scaffolding: `src/components/Header.tsx` includes the demo navigation and auth control.

## Build and tooling

- Vite configuration: `vite.config.ts` enables TanStack Start, Nitro, React, Tailwind, and path aliases.
- Scripts: `package.json` includes `dev`, `build`, `test`, `lint`, `format`, and Drizzle workflows.

## Demo and scaffold areas (likely removable for `prd.json` implementation)

- Demo routes: `src/routes/demo/**` are framework demos (server functions, SSR, API routes, Drizzle, Neon, Better Auth).
- Demo homepage: `src/routes/index.tsx` is a TanStack Start marketing page, not habit-specific.
- Demo API endpoints: `src/routes/demo/api.names.ts` and `src/routes/demo/api.tq-todos.ts` are sample APIs.
- Demo data and tables: `src/data/demo.punk-songs.ts`, `src/db/schema.ts` (todos), and `db/init.sql` are demo-only.
- Demo navigation: `src/components/Header.tsx` links to demo pages and exposes Better Auth demo entry.
- Devtools panels: `@tanstack/react-devtools` and query/router devtools in `src/routes/__root.tsx` are typically removed or gated in production.

## Notes for `prd.json` work

- `prd.json` outlines habit-tracker features that will replace the demo routes and data model.
- Expect to introduce habit-centric tables, server functions/APIs, and new routes under `src/routes`.
- Any demo-related files can be deleted once feature routes and data flows are in place.
