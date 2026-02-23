# Content Admin

Minimal internal dashboard for the Content Generation API. Connects to the backend on Railway.

**Live:** https://content-admin-nine.vercel.app

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` to your Railway backend URL (e.g. `https://web-production-4f46b.up.railway.app`).

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- **/new** – Create a new job (form)
- **/jobs** – List all jobs
- **/jobs/[id]** – Job details, output preview, download, regenerate

## Backend

Requires the Content MVP API with:

- `POST /generate` – Queue a job
- `GET /jobs` – List jobs
- `GET /jobs/:id` – Job details + assets
