# FOM (V1)

Mobile-first social app for real-life quests. Content is earned: users can only post after completing a quest with geo + time check-in.

## Repo Structure

- `apps/mobile` � Expo React Native app (TypeScript)
- `apps/api` � NestJS API (TypeScript)
- `packages/shared` � shared zod schemas and types

## Prereqs

- Node.js 20+
- pnpm 9+
- PostgreSQL (Supabase, Neon, or local)

## Environment

Create env files:

`apps/api/.env`

```
DATABASE_URL="postgresql://user:password@localhost:5432/fom"
JWT_SECRET="replace-with-strong-secret"
PORT=4000
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

`apps/mobile/.env`

```
EXPO_PUBLIC_API_URL="http://localhost:4000"
EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL="https://api.cloudinary.com/v1_1/<cloud_name>/auto/upload"
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=""
EXPO_PUBLIC_MAPS_API_KEY=""
```

## Setup

```bash
pnpm install
pnpm db:migrate
pnpm seed
pnpm dev
pnpm -C apps/mobile start
```

- `pnpm dev` starts API and Expo
- `pnpm db:migrate` runs Prisma migrations
- `pnpm seed` seeds sample data

## V1 Behavior Notes

- **Check-in window:** quest `startTime` � 60 minutes
- **Check-in radius:** 200 meters
- **Completion rule (V1):** immediate completion after check-in
- **Posting:** only after completion
- **Public locations only:** V1 validates required `placeName` + coordinates; UI includes disclaimer

## Feed Ranking (Rules-Based)

Feed merges upcoming quests and recent posts and ranks by a weighted score.

Pseudo-math:

```
score_quest = 0.30 * interest_overlap
           + 0.20 * distance_score
           + 0.25 * recency_score
           + 0.15 * popularity_score
           + 0.10 * redo_score

score_post = 0.35 * distance_score
          + 0.45 * recency_score
          + 0.20 * like_score
```

Inputs:

- `interest_overlap`: user interest keywords found in quest title/description
- `distance_score`: inverse distance (closer = higher)
- `recency_score`: newer or nearer start times score higher
- `popularity_score`: based on max participants (low weight)
- `redo_score`: number of instances for a template
- `like_score`: small weight, not a primary rank signal

## API Endpoints (V1)

- `POST /auth/signup`, `POST /auth/login`
- `GET /users/me`, `POST /users/me`, `PATCH /users/me`
- `GET /interests`
- `POST /quests`, `GET /quests`, `GET /quests/:id`
- `POST /quests/:id/join`
- `POST /quests/:id/save`
- `POST /quests/:id/redo`
- `POST /quest-instances/:id/checkin`
- `POST /quest-instances/:id/complete`
- `POST /quest-instances/:id/posts`
- `POST /quest-instances/:id/rate`
- `GET /feed`
- `GET /locations/:id`
- `POST /reports`
- `POST /blocks`

## Development Notes

- Mobile app uses `EXPO_PUBLIC_` envs for API, Cloudinary, and Maps keys.
- Cloudinary uploads are done via unsigned upload preset in the mobile app.
- You can swap the ranking service with ML later by replacing `apps/api/src/feed/feed.service.ts`.

## Key Files

- `apps/api/prisma/schema.prisma`
- `apps/api/src/feed/feed.service.ts`
- `apps/mobile/app/(tabs)/index.tsx`
- `apps/mobile/app/onboarding.tsx`
- `packages/shared/src/schemas.ts`
