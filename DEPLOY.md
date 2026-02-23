# Deploy to Railway

## ✓ Done

- **Supabase** env vars set on `web` and `worker`
- **web** URL: https://web-production-4f46b.up.railway.app
- **Procfile** maps: web → `npm run start`, worker → `npm run worker`

## ✓ Replicate token added to web and worker

## ✓ Redis configured (private endpoint, no egress)

`REDIS_HOST`, `REDISPORT`, and `REDISPASSWORD` are set on web and worker. Uses `redis.railway.internal` for private networking.

## 1. Get a Project Token

1. Go to [railway.app](https://railway.app) and open your project
2. Project Settings → **Tokens** → **Create Token**
3. Copy the **Project Token** (this is different from an API token)

## 2. One-time setup: create project + services

If you don't have a Railway project yet:

1. Run `railway login` (opens browser) and sign in
2. Run `railway init` in this directory
3. Create **two services** in the dashboard for API and Worker

## 3. Deploy API

```bash
# From content-mvp root
RAILWAY_TOKEN=<your-project-token> railway up --service <api-service-name> --environment production
```

Or after linking:

```bash
railway link --project <project-id> --service <api-service-name> --environment production
railway up
```

## 4. Deploy Worker

```bash
RAILWAY_TOKEN=<your-project-token> railway up --service <worker-service-name> --environment production
```

## 5. Environment variables

In each Railway service, set:

**API service:**
- `UPSTASH_REDIS_URL` or `REDIS_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `REPLICATE_API_TOKEN`
- `PORT` (Railway sets this automatically)

**Worker service:** Same as API.

## ✓ content-admin (Vercel)

**Live:** https://content-admin-nine.vercel.app

For GitHub auto-deploys, add in Vercel → content-admin project → Settings → Environment Variables:
- `NEXT_PUBLIC_API_URL` = `https://web-production-4f46b.up.railway.app`
