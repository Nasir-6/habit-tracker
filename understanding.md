# Understanding TanStack Start + Router in This Repo

This is a quick, practical guide to how TanStack Start and TanStack Router are wired up in this codebase. It focuses on the files you will touch and the flow of requests through the app.

## Mental model

- TanStack Start is a full-stack React framework. It lets you build UI routes and server logic in the same file tree.
- TanStack Router provides file-based routing. Each file in `src/routes` maps to a URL.
- Server logic can live in route files using `createServerFn` (RPC-style) or `server.handlers` (API routes).
- The framework generates `src/routeTree.gen.ts`, which the router uses at runtime.

## Key files and what they do

- `src/routes/__root.tsx`: Root layout and HTML shell. Global UI goes here (header, devtools, styles).
- `src/routes/index.tsx`: The current home route (`/`). This is a placeholder for the habit tracker.
- `src/router.tsx`: Builds the router using the generated route tree and sets up Query integration.
- `src/routeTree.gen.ts`: Auto-generated route map. Never edit manually.
- `vite.config.ts`: Enables TanStack Start and other build plugins.

## How file-based routing works

- Each file under `src/routes` becomes a route.
- File name controls the URL path. Examples:
  - `src/routes/index.tsx` -> `/`
  - `src/routes/api/auth/$.ts` -> `/api/auth/*` (splat)
- The router builds a tree from the filesystem (see `src/routeTree.gen.ts`).

## Route files: the minimum shape

Most route files look like this:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/some/path')({
  component: MyComponent,
  loader: async () => {
    // optional data loading
  },
})

function MyComponent() {
  return <div>Hello</div>
}
```

The `createFileRoute` path must match the file location. TanStack Router validates this.

## Loaders and data

- `loader` runs before the route renders.
- Use `Route.useLoaderData()` to read loader results inside the component.
- Loader examples will be added alongside habit routes.

## Server functions (RPC-style)

- `createServerFn` creates a server-only function you can call from the client.
- Server function examples will be added alongside habit routes.
- Pattern:

```tsx
const getTodos = createServerFn({ method: 'GET' }).handler(async () => {
  // server-only code
})

const addTodo = createServerFn({ method: 'POST' })
  .inputValidator((data: { title: string }) => data)
  .handler(async ({ data }) => {
    // server-only code
  })
```

## API routes

- You can create API endpoints inside the route tree using `server.handlers`.
- API route examples will be added alongside habit routes.
- Pattern:

```tsx
export const Route = createFileRoute('/api/example')({
  server: {
    handlers: {
      GET: () => json(['Alice', 'Bob']),
    },
  },
})
```

## SSR and the root layout

- The root route defines the HTML document and global layout.
- `src/routes/__root.tsx` includes `<HeadContent />`, `<Scripts />`, and global components.
- Anything rendered in the root appears on every page.

## TanStack Query integration

- `src/integrations/tanstack-query/root-provider.tsx` creates a `QueryClient`.
- `src/router.tsx` creates a router and wires SSR query integration.
- `src/routes/__root.tsx` mounts the devtools panels.

## Where to add new habit tracker features

- UI routes go in `src/routes` (for example: `src/routes/today.tsx`).
- Shared UI components go in `src/components`.
- Server logic can live in routes using `createServerFn` or `server.handlers`.
- Database tables live in `src/db/schema.ts` and migrations in `drizzle/`.

If you want, I can add a “first real route” example for the habit tracker so you can follow a concrete path from route -> loader -> server fn -> db.
