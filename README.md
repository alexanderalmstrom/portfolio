# alexanderalmstrom.com

A [TanStack Start](https://tanstack.com/start) site, rendered on the server, with its content in Contentful.

1. Copy `.env.example` to `.env` and replace the corresponding values for Contentful space id and access token.

## Environment variables

The Contentful variables are only read on the server, in `src/env.server.ts`, where [T3 Env](https://env.t3.gg) checks them. The content is fetched by server functions (`src/services/content.ts`), so the tokens never reach the browser, and the `.server` file names make the build fail if anything the browser loads imports them. None of them have the `VITE_` prefix that would expose them to the client.

| Variable                          | Required | Description                                                    |
| --------------------------------- | -------- | -------------------------------------------------------------- |
| `CONTENTFUL_SPACE_ID`             | Yes      | The id of the Contentful space.                                |
| `CONTENTFUL_ACCESS_TOKEN`         | Yes      | A Content Delivery API token.                                  |
| `CONTENTFUL_PREVIEW_ACCESS_TOKEN` | No       | A Content Preview API token, for showing drafts.               |
| `CONTENTFUL_ENVIRONMENT`          | No       | The Contentful environment, `master` by default.               |
| `CONTENTFUL_PREVIEW`              | No       | `true` to show drafts on every page, not only with `?preview`. |

With a preview token, drafts are shown in development, and in production on pages opened with `?preview=true`, which links on the site then keep.

## Install

Install dependencies.

```bash
pnpm install
```

## Development

Run the dev server on port 3000.

```bash
pnpm run dev
```

Type check the TypeScript sources.

```bash
pnpm run typecheck
```

## Build

Type check, then build the server and the client into `.output`.

```bash
pnpm run build
```

## Server

Run the built server with Node, reading `.env`. Requires `pnpm run build` first, since it runs what is in `.output`.

```bash
pnpm run start
```

## Migrations

Changes to the Contentful content model live in `migrations`. Running one requires a Contentful management token.

```bash
npx contentful-cli space migration --space-id <space_id> --environment-id master --management-token <token> migrations/0_0_2.cjs
```

## Deploy to Vercel

Pushes to `master` deploy to production and every other branch gets a preview deployment, through the Vercel Git integration. The build settings live in `vercel.json`, and [Nitro](https://nitro.build) builds the server for Vercel when it is built there. The Contentful variables from `.env.example` have to be set in the Vercel project.

To deploy by hand, install the Vercel CLI.

```bash
npm install vercel -g
```

Deploy a preview, or pass `--prod` for production.

```bash
vercel
```
