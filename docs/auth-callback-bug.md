# Auth callback bug: Google login redirects back to login page on Vercel

## Summary

Google sign-in on the staging Vercel deployment appears to work (redirect to Google, user signs in), but after the OAuth callback the user is sent back to the login page and no session is created. The user record is not created in the database, and Vercel function logs show Prisma and NextAuth errors.

## Symptoms

- **UI:** After clicking “Log in with Google” and completing Google auth, the user is redirected back to the login page with no visible change.
- **Data:** No new user/account is written to the database.
- **Logs:** Prisma “Query Engine not found” and NextAuth adapter/callback errors in Vercel runtime logs.

Confirmed:

- Redirect URIs in Google Cloud Console are set correctly.
- Environment variables in Vercel (e.g. `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`, Google OAuth) are set and appear correct.
- Issue is likely in application/config (e.g. Prisma not available at runtime in the serverless bundle), not in OAuth or env configuration.

## Root cause (from logs)

The failure happens during the NextAuth OAuth callback when the Prisma adapter runs (e.g. `getUserByAccount` / `account.findUnique()`). At that moment, **Prisma cannot find the Query Engine binary** for the Vercel serverless runtime (`rhel-openssl-3.0.x`). The engine file `libquery_engine-rhel-openssl-3.0.x.so.node` is not present in the deployed function bundle, so Prisma throws and the callback fails. As a result, no session is created and the user is effectively sent back to the login page.

This is a **bundling/tracing** issue: in a monorepo, the Prisma client and its native engine live under the repo root `node_modules`, and Next.js’s default file tracing for serverless does not include that path unless configured (e.g. `outputFileTracingRoot` and optionally `outputFileTracingIncludes` in `next.config.js`).

## Vercel log excerpts

### NextAuth / Prisma adapter error

```
[next-auth][error][adapter_error_getUserByAccount]
https://next-auth.js.org/errors#adapter_error_getuserbyaccount

Invalid `prisma.account.findUnique()` invocation:

Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".
...
```

### PrismaClientInitializationError

```
PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".

We detected that you are using Next.js, learn how to fix this: https://pris.ly/d/engine-not-found-nextjs.

This is likely caused by a bundler that has not copied "libquery_engine-rhel-openssl-3.0.x.so.node" next to the resulting bundle.
Ensure that "libquery_engine-rhel-openssl-3.0.x.so.node" has been copied next to the bundle or in "../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client".

The following locations have been searched:
  /var/task/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client
  /var/task/apps/web/.next/server
  /vercel/path0/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client
  /var/task/apps/web/.prisma/client
  /tmp/prisma-engines
```

### Other log lines (non-blocking)

- **TWITTER_OAUTH_2_BETA** — NextAuth warning about Twitter OAuth 2; safe to ignore if only Google is used.
- **DEP0169 `url.parse()` deprecation** — From a dependency; does not cause the callback failure.
- **OAUTH_CALLBACK_HANDLER_ERROR** — Consequence of the Prisma failure during the callback.

## Resolution

1. **Ensure Prisma is generated for Vercel’s runtime**  
   In `packages/database/prisma/schema.prisma`, the generator should include:
   - `binaryTargets = ["native", "rhel-openssl-3.0.x"]`

2. **Ensure the Prisma engine is included in the serverless bundle**  
   In `apps/web/next.config.js`:
   - Set `experimental.outputFileTracingRoot` to the monorepo root (e.g. `path.join(__dirname, '../../')`) so tracing includes the repo root `node_modules`.
   - Optionally set `experimental.outputFileTracingIncludes` so the Prisma client/engine path (e.g. `node_modules/.pnpm/**/.prisma/client/**`) is explicitly included for the auth API route and other API routes that use Prisma.
   - Keep `experimental.serverComponentsExternalPackages: ['@prisma/client', 'prisma']` so Prisma is not bundled and the engine can be loaded from the traced files.

3. **Redeploy**  
   After config changes, redeploy the app on Vercel and retry Google sign-in. The callback should then run without the Prisma engine error and the user/session should be created.

See also: [Vercel deployment guide](guides/vercel-deployment.md), [Prisma + Next.js](https://www.prisma.io/docs/guides/frameworks/nextjs).
