# Content MVP

Visual Content Operating System: strategy-driven content generation, Brand Kits, and asset production.

## Capabilities

- **Content Console** — Strategy tiles (objective, audience, property type, visual energy, hook, format) → AI-generated marketing copy + creative production brief. Returns structured JSON; no free typing.
- **Asset Jobs** — Queue video/image generation via Replicate (Minimax, Flux, SDXL). Jobs run async; outputs stored in Supabase.
- **Deterministic reel renderer** — When a job has a `generation_id` with a `reelBlueprint`, the worker uses **Remotion** (not an AI model) to stitch shots into MP4. Fully controlled, no hallucination. AI video models (Replicate) are only used when no blueprint is present.
- **Brand Kits** — File-based brand profiles per brand. Each kit defines positioning, target ICP, voice, visuals, scene requirements, CTAs, and guardrails. NA Blinds included.
- **Formats** — Reel, Image, Image Kit (4:5), Reel Kit (9:16), Wide Video Kit (16:9).

## Setup

Supabase: run migration, create `content-outputs` bucket if needed.

**Add to `.env`** (see .env.example):
- Redis URL (BullMQ queue)
- Replicate token (asset generation)
- OpenAI key (Content Console)

Optional: `npm run db:migrate`, `npm run db:create-bucket`.

**Remotion** (blueprint-based reel rendering): Uses headless Chrome. On Linux servers, install [Remotion's Linux dependencies](https://www.remotion.dev/docs/miscellaneous/linux-dependencies). On macOS it works out of the box.

## Run

```bash
npm install
npm run dev          # API on :3000
npm run dev:worker   # Worker (separate terminal)
```

## API

**GET /health** — Health check

**GET /models** — List models (format support, cost, descriptions)

**GET /brands** — List brand keys and display names

**GET /brands/:key** — Full BrandKit JSON

**POST /generate-content** — Strategy → structured copy + brief (synchronous)
```json
{
  "brandId": "nablinds",
  "strategySelection": {
    "campaignObjective": "lead_generation",
    "audienceContext": "affluent_homeowner",
    "propertyType": "single_family",
    "visualEnergy": "calm",
    "hookFramework": "contrast",
    "platformFormat": "reel_kit"
  }
}
```
Returns `{ marketingOutput, creativeBrief }`.

**POST /generate** — Queue asset job (async)
```json
{
  "brand_key": "nablinds",
  "format": "reel_kit",
  "length_seconds": 6,
  "objective": "lead_generation",
  "hook_type": "contrast",
  "variables": { "concept": "Design Your Light" }
}
```
Returns `{ id, status: "queued" }`.

## Deploy (Railway)

Two services: `npm run start` (API), `npm run worker` (BullMQ).
