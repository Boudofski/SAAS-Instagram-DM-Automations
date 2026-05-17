# Production Prisma Migration Deploy

Use this runbook when production code depends on a new Prisma migration.

## Rules

- Never run `prisma migrate dev` against production. It is for local development and can create or reset migration state.
- Production migrations must be applied with `prisma migrate deploy`.
- Required environment variable: `DATABASE_URL`.
- Do not paste or commit production database URLs, tokens, or secrets.

## Deploy Migrations

Run against the production database:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Or with the package script:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate:deploy
```

If you are using Vercel-managed environment variables, run the command in an environment where production `DATABASE_URL` is available, or pull it into a temporary local env file and delete that file after use.

## After Migration

1. Confirm the command reports all migrations applied.
2. Redeploy the app so the running code and generated Prisma Client match the schema.
3. Retest the affected production flow.

For the campaign wizard save flow, retest:

- Create campaign with a specific Instagram post and specific keyword.
- Create campaign with any post and any comment.
- Save as draft and activate campaign.

## Optional Vercel Build Integration

For most projects, prefer running `npm run db:migrate:deploy` as an explicit release step before deploying.

If you intentionally want Vercel to apply migrations during deploy, configure the project build command to run migrations before the build only when production `DATABASE_URL` is present:

```bash
npm run db:migrate:deploy && npm run build
```

Use this only if the deployment environment reliably has the production database URL and your team accepts migrations running automatically during deploy.
