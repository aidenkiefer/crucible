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


## Update

Unfortunately, the approach taken (changing the build command to `cd ../.. && pnpm turbo build --filter=@gladiator/web`) and Cursor's attempted fixes after this point did not solve the problem. The same errors continue to appear in the logs.

## Update 2 (2026-02-04)

**New approach:** The issue is that Vercel's file tracing is not finding the Prisma Query Engine binaries in the pnpm monorepo structure, even with `outputFileTracingIncludes` configured.

### Changes made:

1. **Prisma schema output path** (`packages/database/prisma/schema.prisma`):
   - Added `output = "../node_modules/.prisma/client"` to the generator config
   - This places the generated Prisma client in `packages/database/node_modules/.prisma/client/` instead of the pnpm cache
   - Makes the engine binary path more predictable and easier for Next.js to trace

2. **Next.js config** (`apps/web/next.config.js`):
   - Simplified `outputFileTracingIncludes` to point directly to the new output location
   - Changed from complex pnpm cache patterns to single path: `packages/database/node_modules/.prisma/client/**`

3. **Database package postinstall** (`packages/database/package.json`):
   - Added `postinstall` script to ensure Prisma generates after installation
   - Ensures binaries exist before Next.js build runs

### Next steps:
1. Run `pnpm install` in the monorepo root to regenerate Prisma client with new output path
2. Commit changes
3. Push to trigger Vercel rebuild
4. Test Google OAuth flow on staging

### Context

- **Build:** Monorepo build from repo root with Turbo, filtering to `@gladiator/web`.
- **Runtime:** Vercel serverless (Node), auth callback hitting Prisma adapter.
- **Observation:** Prisma still cannot locate the Query Engine for `rhel-openssl-3.0.x` at runtime; the engine file is not present in the deployed function bundle.

### Log excerpts (2026-02-04)

#### 1. NextAuth warning (non-blocking)

```
2026-02-04 05:56:44.258 [warning] [next-auth][warn][TWITTER_OAUTH_2_BETA]
https://next-auth.js.org/warnings#twitter_oauth_2_beta
```

#### 2. Unhandled rejection — Prisma Query Engine not found

```
2026-02-04 05:56:44.389 [error] Unhandled Rejection: PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".

We detected that you are using Next.js, learn how to fix this: https://pris.ly/d/engine-not-found-nextjs.

This is likely caused by a bundler that has not copied "libquery_engine-rhel-openssl-3.0.x.so.node" next to the resulting bundle.
Ensure that "libquery_engine-rhel-openssl-3.0.x.so.node" has been copied next to the bundle or in "../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client".

We would appreciate if you could take the time to share some information with us.
Please help us by answering a few questions: https://pris.ly/engine-not-found-bundler-investigation

The following locations have been searched:
  /var/task/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client
  /var/task/apps/web/.next/server
  /vercel/path0/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client
  /var/task/apps/web/.prisma/client
  /tmp/prisma-engines
    at za (/var/task/apps/web/.next/server/chunks/5298.js:98:756)
    at async Object.loadLibrary (/var/task/apps/web/.next/server/chunks/5298.js:145:10040)
    at async _r.loadEngine (/var/task/apps/web/.next/server/chunks/5298.js:146:448)
    at async _r.instantiateLibrary (/var/task/apps/web/.next/server/chunks/5298.js:145:12506)
2026-02-04 05:56:44.389 [fatal] Node.js process exited with exit status: 128. The logs above can help with debugging the issue.
```

#### 3. Second unhandled rejection (same error)

```
2026-02-04 05:56:44.904 [error] Unhandled Rejection: PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".
...
The following locations have been searched:
  /var/task/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client
  /var/task/apps/web/.next/server
  /vercel/path0/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client
  /var/task/apps/web/.prisma/client
  /tmp/prisma-engines
    at za (/var/task/apps/web/.next/server/chunks/5298.js:98:756)
    ...
2026-02-04 05:56:44.957 [fatal] Node.js process exited with exit status: 128. The logs above can help with debugging the issue.
```

#### 4. Deprecation warning (non-blocking)

```
2026-02-04 05:56:44.930 [error] (node:4) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead. CVEs are not issued for `url.parse()` vulnerabilities.
(Use `node --trace-deprecation ...` to show where the warning was created)
```

#### 5. Later occurrence — same Prisma error + NextAuth adapter / OAuth callback

```
2026-02-04 05:56:48.106 [warning] [next-auth][warn][TWITTER_OAUTH_2_BETA]
https://next-auth.js.org/warnings#twitter_oauth_2_beta
2026-02-04 05:56:48.126 [error] (node:4) [DEP0169] DeprecationWarning: ...
2026-02-04 05:56:48.136 [error] Unhandled Rejection: PrismaClientInitializationError: ...
...
2026-02-04 05:56:48.257 [error] [next-auth][error][adapter_error_getUserByAccount] ...
2026-02-04 05:56:48.257 [error] [next-auth][error][OAUTH_CALLBACK_HANDLER_ERROR] ...
```

#### 6. Full error object from adapter_error_getUserByAccount

```javascript
{
  message: '\n' +
    'Invalid `prisma.account.findUnique()` invocation:\n' +
    '\n' +
    '\n' +
    'Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".\n' +
    '\n' +
    'We detected that you are using Next.js, learn how to fix this: https://pris.ly/d/engine-not-found-nextjs.\n' +
    '\n' +
    'This is likely caused by a bundler that has not copied "libquery_engine-rhel-openssl-3.0.x.so.node" next to the resulting bundle.\n' +
    'Ensure that "libquery_engine-rhel-openssl-3.0.x.so.node" has been copied next to the bundle or in "../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client".\n' +
    '\n' +
    'We would appreciate if you could take the time to share some information with us.\n' +
    'Please help us by answering a few questions: https://pris.ly/engine-not-found-bundler-investigation\n' +
    '\n' +
    'The following locations have been searched:\n' +
    '  /var/task/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client\n' +
    '  /var/task/apps/web/.next/server\n' +
    '  /vercel/path0/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client\n' +
    '  /var/task/apps/web/.prisma/client\n' +
    '  /tmp/prisma-engines',
  stack: 'PrismaClientInitializationError: \n' +
    'Invalid `prisma.account.findUnique()` invocation:\n' +
    '\n' +
    '\n' +
    'Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".\n' +
    '\n' +
    'We detected that you are using Next.js, learn how to fix this: https://pris.ly/d/engine-not-found-nextjs.\n' +
    '\n' +
    'This is likely caused by a bundler that has not copied "libquery_engine-rhel-openssl-3.0.x.so.node" next to the resulting bundle.\n' +
    'Ensure that "libquery_engine-rhel-openssl-3.0.x.so.node" has been copied next to the bundle or in "../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client".\n' +
    '\n' +
    'We would appreciate if you could take the time to share some information with us.\n' +
    'Please help us by answering a few questions: https://pris.ly/engine-not-found-bundler-investigation\n' +
    '\n' +
    'The following locations have been searched:\n' +
    '  /var/task/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client\n' +
    '  /var/task/apps/web/.next/server\n' +
    '  /vercel/path0/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client\n' +
    '  /var/task/apps/web/.prisma/client\n' +
    '  /tmp/prisma-engines\n' +
    '    at $n.handleRequestError (/var/task/apps/web/.next/server/chunks/5298.js:155:7511)\n' +
    '    at $n.handleAndLogRequestError (/var/task/apps/web/.next/server/chunks/5298.js:155:6535)\n' +
    '    at $n.request (/var/task/apps/web/.next/server/chunks/5298.js:155:6219)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)\n' +
    '    at async a (/var/task/apps/web/.next/server/chunks/5298.js:164:9486)\n' +
    '    at async getUserByAccount (/var/task/apps/web/.next/server/chunks/5298.js:165:12175)',
  name: 'PrismaClientInitializationError'
}
```

#### 7. GetUserByAccountError (NextAuth)

- `name: 'GetUserByAccountError'`, `code: undefined`
- Stack: same as above — `getUserByAccount` in auth callback fails due to Prisma engine not found.

#### 8. Process exit

```
2026-02-04 05:56:48.262 [info] (node:4) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously (rejection id: 1)
2026-02-04 05:56:48.262 [fatal] Node.js process exited with exit status: 128. The logs above can help with debugging the issue.
```

### Locations Prisma searched (all runs)

| Path |
|------|
| `/var/task/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client` |
| `/var/task/apps/web/.next/server` |
| `/vercel/path0/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client` |
| `/var/task/apps/web/.prisma/client` |
| `/tmp/prisma-engines` |

Note: `/var/task` is the serverless function’s deployed bundle root; `/vercel/path0` is the build environment path and is not available at runtime.