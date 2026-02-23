# Content MVP

Automated content generation system: structured jobs → Replicate → storage.

## Setup

Supabase (Conversion Bridge) is configured: migration run, `content-outputs` bucket created. `.env` has Supabase credentials.

**Still needed:** Add to `.env`:
- `UPSTASH_REDIS_URL` or `REDIS_URL` (from Upstash or Railway Redis)
- `REPLICATE_API_TOKEN` (from replicate.com)

Optional: `npm run db:migrate` (if schema changes), `npm run db:create-bucket` (if bucket missing).

## Run

```bash
npm install
npm run dev          # API on :3000
npm run dev:worker   # Worker (separate terminal)
```

## API

**POST /generate**

```json
{
  "brand": "NA Blinds",
  "format": "reel",
  "length_seconds": 6,
  "objective": "lead_generation",
  "hook_type": "contrast",
  "scene_structure": 2,
  "model": "video-model-x",
  "variables": {
    "location": "South Florida luxury living room",
    "product": "motorized shades"
  }
}
```

Returns `{ id, status: "queued" }`.

## Deploy (Railway)

- Two services: one for `npm run start` (API), one for `npm run worker`.
- Or use Procfile with `web` and `worker` processes if supported.
