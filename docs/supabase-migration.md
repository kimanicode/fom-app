# Supabase Migration

This project keeps NestJS as the API layer and Prisma as the ORM. The database move is provider-only: Neon Postgres to Supabase Postgres.

## Recommended connection layout

- `DATABASE_URL`: Supabase pooled runtime URL for Prisma Client
- `DIRECT_URL`: Supabase direct or session-mode URL for Prisma CLI commands and migrations

Recommended values:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
```

If your deployment environment does not support IPv6, use the Supabase session pooler for `DIRECT_URL` instead of the direct host:

```env
DIRECT_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
```

## Current repo audit

- Prisma datasource lives in `apps/api/prisma/schema.prisma`
- Runtime connection bootstraps in `apps/api/src/prisma/prisma.service.ts`
- Current repo uses Prisma migrations in `apps/api/prisma/migrations`
- Current runtime env only defines `DATABASE_URL`
- Neon-specific usage is limited to the current connection string in `apps/api/.env`

## Migration plan

### 1. Prepare Supabase

1. Create a Supabase project in the target region.
2. Set the database password and record the project reference.
3. From Supabase dashboard, copy:
   - transaction pooler URL on port `6543`
   - direct database URL on `db.<project-ref>.supabase.co:5432`
   - session pooler URL on port `5432` if you need IPv4-compatible direct CLI access
4. In Supabase, leave Auth, Realtime, and Storage unused for this migration.

### 2. Freeze writes

1. Pick a short maintenance window.
2. Stop background jobs and writes to the NestJS API.
3. Keep the current Neon database available for rollback.

### 3. Export Neon schema and data

Use `pg_dump` against the current Neon database.

Schema and data in custom format:

```powershell
pg_dump --format=custom --no-owner --no-privileges --dbname "$env:NEON_DATABASE_URL" --file fom-neon.backup
```

Optional plain SQL export:

```powershell
pg_dump --format=plain --no-owner --no-privileges --dbname "$env:NEON_DATABASE_URL" --file fom-neon.sql
```

### 4. Initialize Supabase schema

Preferred path on a new empty Supabase database:

```powershell
$env:DATABASE_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
$env:DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
pnpm -C apps/api prisma migrate deploy
pnpm -C apps/api prisma generate
```

Why this order:

- `migrate deploy` preserves the repo migration history
- schema creation stays aligned with Prisma's `_prisma_migrations` table

### 5. Import data into Supabase

If you used custom format:

```powershell
pg_restore --no-owner --no-privileges --clean --if-exists --data-only --dbname "$env:SUPABASE_DIRECT_URL" fom-neon.backup
```

If you used plain SQL:

```powershell
psql "$env:SUPABASE_DIRECT_URL" -f fom-neon.sql
```

If importing into a schema already created by Prisma migrations, prefer `--data-only` for `pg_restore` to avoid conflicting DDL.

### 6. Validate database state

Run:

```powershell
pnpm db:status
pnpm -C apps/api prisma migrate status
pnpm -C apps/api prisma db seed
```

Seeding is only safe if your seed file is idempotent for the target data set. In this repo it uses `upsert` for sample records and tags, so review whether you want sample users on production before running it.

### 7. Update application env vars

Set these in `apps/api/.env` and in your deployment secret store:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="..."
PORT=4000
PRISMA_CONNECT_RETRIES=5
PRISMA_CONNECT_RETRY_DELAY_MS=3000
```

### 8. Cut over and validate app behavior

1. Deploy API with the new env vars.
2. Start the API and inspect startup logs for sanitized database targets.
3. Check:

```powershell
curl http://localhost:4000/health
```

4. Verify key flows:
   - auth signup and login
   - feed load
   - quest creation
   - quest join
   - chat fetch/send
   - notifications
   - profile read/update

## Commands summary

```powershell
pnpm install
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:status
pnpm -C apps/api build
pnpm -C apps/api start
curl http://localhost:4000/health
```

## Supabase + Prisma gotchas

- Supabase direct connections are IPv6 by default. If your runtime or CI does not support IPv6, use Supavisor session mode for `DIRECT_URL`.
- Prisma migrations should not use the transaction pooler URL on port `6543`.
- When using the pooled runtime URL, add `pgbouncer=true`.
- Keep Prisma as the only database access layer unless you later choose to adopt Supabase-specific features.
- Supabase Row Level Security does not affect Prisma unless you intentionally route app traffic through Supabase API layers instead of direct Postgres.

## Rollback plan

1. Keep Neon untouched during the cutover.
2. Do not destroy or mutate the Neon branch until Supabase is validated in production.
3. If validation fails:
   - restore previous `DATABASE_URL`
   - remove `DIRECT_URL` override if needed
   - redeploy API
   - verify `/health` and core endpoints against Neon
4. Re-run the export/import after fixing the issue, then retry the cutover.
