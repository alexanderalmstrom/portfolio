import { createEnv } from '@t3-oss/env-core'
import * as z from 'zod'

// The environment of the server, checked when the server first reads it.
// None of it is meant for the browser, so there is no client part, and the
// .server name keeps the file out of the client bundle (see Import Protection
// in the TanStack Start docs): importing it from code that ends up there
// fails the build.
export const env = createEnv({
  server: {
    CONTENTFUL_SPACE_ID: z.string(),
    CONTENTFUL_ACCESS_TOKEN: z.string(),
    // Without it there are no drafts to show (see isPreview).
    CONTENTFUL_PREVIEW_ACCESS_TOKEN: z.string().optional(),
    CONTENTFUL_ENVIRONMENT: z.string().default('master'),
    // Shows drafts on every page, rather than only on those opened with
    // ?preview in the address.
    CONTENTFUL_PREVIEW: z.stringbool().default(false),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
