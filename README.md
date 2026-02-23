# Content MVP

Automated content generation system: structured jobs → Replicate → storage.

## Setup

Supabase (Conversion Bridge) is configured: migration run, `content-outputs` bucket created. `.env` has Supabase credentials.

**Still needed:** Add to `.env`:
- `UPSTASH_REDIS_URL` or `REDIS_URL` (from Upstash or Railway Redis)
- `REPLICATE_API_TOKEN` (from replicate.com)

Optional: `npm run db:migrate` (if schema changes), `npm run db:create-bucket` (if bucket missing).

## Vercel

Live: **https://content-mvp-chris-projects-ebee1a4e.vercel.app** (or check [vercel.com](https://vercel.com) dashboard)

Add env vars in Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `UPSTASH_REDIS_URL`, `REPLICATE_API_TOKEN`.

Note: The BullMQ worker does not run on Vercel (serverless). Deploy the worker separately (e.g. Railway) for full pipeline.

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
  "model_key": "minimax-video-01",
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
