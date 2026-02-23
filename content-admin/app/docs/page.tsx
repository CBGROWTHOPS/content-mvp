import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">
        Content Generation MVP — Documentation
      </h1>
      <p className="text-zinc-400">
        Full overview of the Content MVP system: architecture, how it works,
        deployment, and troubleshooting.
      </p>

      {/* High-level overview for users */}
      <section className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-6">
        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          At a Glance — What You Can Do
        </h2>
        <p className="mb-4 text-zinc-300">
          Two flows: (1) Content Console — strategy tiles for copy and creative brief;
          (2) Asset jobs — video/image generation via Replicate, stored in Supabase.
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-zinc-300">
          <li>
            <strong>Content Console</strong> — Select brand, then choose strategy
            tiles (Campaign Objective, Audience, Property Type, Visual Energy, Hook,
            Platform Format). Copy and creative brief auto-generate. Use Copy buttons
            to grab output. Randomize/Reset for quick exploration.
          </li>
          <li>
            <strong>New Job</strong> — Create asset jobs: brand, format (Reel, Image,
            Image Kit, Reel Kit, Wide Video Kit), hook type, model override, variables.
            Submit and get a job ID.
          </li>
          <li>
            <strong>Jobs list</strong> — All jobs with status (Queued, Processing,
            Completed, Failed). Click for details.
          </li>
          <li>
            <strong>Job detail</strong> — Metadata, status, error messages. Preview
            or download completed video/image. Regenerate with same settings.
          </li>
        </ul>
        <p className="mb-2 text-sm text-zinc-400">
          <strong>Brand Kits:</strong> File-based per brand (e.g. NA Blinds).
          Define positioning, target ICP, voice, visuals, scene requirements, CTAs,
          guardrails. Console and jobs use these constraints.
        </p>
        <p className="mb-2 text-sm text-zinc-400">
          <strong>Models:</strong> Replicate models (minimax-video-01, flux-schnell,
          flux-dev, sdxl, stable-video-diffusion). Default chosen by format.
        </p>
        <p className="text-sm text-zinc-500">
          Jobs process asynchronously (Queued → Processing → Completed/Failed).
          Console copy/brief is synchronous via OpenAI.
        </p>
      </section>

      <hr className="border-zinc-800" />

      <p className="text-xs uppercase tracking-wider text-zinc-500">
        Technical reference (below)
      </p>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">What It Is</h2>
        <p>
          Content MVP is a Visual Content Operating System. (1) Content Console:
          strategy tiles + Brand Kit → OpenAI → marketing copy + creative brief.
          (2) Asset jobs: structured jobs (brand, format, hook, variables) queued
          via BullMQ + Redis; worker generates video/image via Replicate. Outputs
          stored in Supabase (Postgres + Storage).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">Architecture</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-sm text-zinc-300">
          <pre className="whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)                                              │
│  /console, /new, /jobs, /docs                                    │
└───────────────────────────────┬───────────────────────────────────┘
                                │ NEXT_PUBLIC_API_URL
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Express)                                               │
│  /generate-content, /generate, /brands, /jobs, /models           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
     ┌──────────────────────────┼──────────────────────────┐
     ▼                          ▼                          ▼
┌──────────┐            ┌──────────────┐            ┌──────────────┐
│ OpenAI   │            │ Redis/BullMQ │            │  Supabase +  │
│ copy+    │            │ + Replicate  │            │  Replicate   │
│ brief    │            │ (asset jobs) │            │  (storage)   │
└──────────┘            └──────────────┘            └──────────────┘
     ▲                          ▲
     │                          │ Worker: dequeue → Replicate → store
     │ Brand Kits (files)       │
     └──────────────────────────┘`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">How It Works</h2>
        <h3 className="mt-3 text-base font-medium text-zinc-300">Content Console</h3>
        <ol className="list-decimal space-y-1 pl-6 text-zinc-300">
          <li>Select brand and strategy tiles. Changes debounce (500ms).</li>
          <li>UI calls POST /generate-content with brandId and strategySelection.</li>
          <li>Backend loads Brand Kit, merges with strategy, calls OpenAI. Returns marketingOutput + creativeBrief.</li>
          <li>Copy buttons copy sections to clipboard.</li>
        </ol>
        <h3 className="mt-4 text-base font-medium text-zinc-300">Asset Jobs</h3>
        <ol className="list-decimal space-y-1 pl-6 text-zinc-300">
          <li>New Job form: brand, format, hook, model, variables → POST /generate.</li>
          <li>API validates, inserts in Supabase <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">jobs</code>, enqueues BullMQ. Returns <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">{"{ id, status: \"queued\" }"}</code>.</li>
          <li>Worker dequeues, builds prompts, calls Replicate, stores in Supabase, updates <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">assets</code>.</li>
          <li>Jobs/Job detail: GET /jobs, GET /jobs/:id. Preview, download, regenerate.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">Deployment</h2>
        <p className="text-zinc-300">
          Frontend: deploy <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">content-admin/</code> (e.g. Vercel).
          Set <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_API_URL</code> to your backend.
        </p>
        <p className="mt-2 text-zinc-300">
          Backend: two services — API (<code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">npm run start</code>),
          Worker (<code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">npm run worker</code>). Set env vars for
          Supabase, Redis, Replicate, OpenAI. Configure CORS for your frontend origin.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">Troubleshooting</h2>
        <dl className="space-y-3 text-zinc-300">
          <div>
            <dt className="font-medium text-zinc-200">
              Content Console: &quot;OPENAI_API_KEY is not set&quot;
            </dt>
            <dd>
              Add <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">OPENAI_API_KEY</code> to the backend .env.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">
              &quot;Failed to fetch jobs&quot;
            </dt>
            <dd>
              Ensure Supabase env vars are set, then run <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">npm run db:migrate</code>.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">Jobs list empty after fix</dt>
            <dd>
              Normal if no jobs exist yet. Create one via &quot;New Job&quot;.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">No production deployments (Vercel)</dt>
            <dd>
              Push to main to trigger a deploy, or use Deploy → Redeploy in the
              Vercel dashboard.
            </dd>
          </div>
        </dl>
      </section>


      <p className="mt-8 text-sm text-zinc-500">
        <Link href="/jobs" className="text-zinc-400 hover:text-white">
          ← Back to Jobs
        </Link>
      </p>
    </div>
  );
}
