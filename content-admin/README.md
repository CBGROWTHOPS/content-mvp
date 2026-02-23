# Content Admin

Internal dashboard for the Content MVP API: Content Console and asset job management.

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` to your backend API URL.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- **/console** — Content Console: strategy tiles, brand selector, auto-generated marketing output + creative brief. Copy buttons. Randomize/Reset.
- **/new** — Create asset job (form: brand, format, hook, model override, variables)
- **/jobs** — List all jobs
- **/jobs/[id]** — Job details, output preview, download, regenerate
- **/docs** — Documentation

## Backend API

- `GET /brands` — List brands
- `GET /brands/:key` — Full BrandKit
- `POST /generate-content` — Strategy → copy + brief (Content Console)
- `POST /generate` — Queue asset job
- `GET /models` — List models
- `GET /jobs` — List jobs
- `GET /jobs/:id` — Job details + assets
