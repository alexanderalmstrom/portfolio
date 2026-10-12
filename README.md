# alexanderalmstrom.com

1. Copy `.env.example` to `.env` and replace the corresponding values for Contentful space id and access token.

## Install

Install dependencies.

```bash
pnpm install
```

## Development

Run the Vite dev server on port 3000.

```bash
pnpm run dev
```

Type check the TypeScript sources.

```bash
pnpm run typecheck
```

## Build

Create a `build` directory with bundled assets.

```bash
pnpm run build
```

## Server

A static node express server for testing. Requires `pnpm run build` first, since it serves the `build` directory.

```bash
pnpm run start
```

## Migrations

Changes to the Contentful content model live in `migrations`. Running one requires a Contentful management token.

```bash
npx contentful-cli space migration --space-id <space_id> --environment-id master --management-token <token> migrations/0_0_2.js
```

## Deploy to Vercel

Pushes to `master` deploy to production and every other branch gets a preview deployment, through the Vercel Git integration. The build settings live in `vercel.json`, and the Contentful variables from `.env.example` have to be set in the Vercel project.

To deploy by hand, install the Vercel CLI.

```bash
npm install vercel -g
```

Deploy a preview, or pass `--prod` for production.

```bash
vercel
```
