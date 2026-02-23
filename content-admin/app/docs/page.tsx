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
          Create AI-generated video and image content. Fill out a form, submit, and
          the system queues your job, runs it through Replicate, and stores the
          output for preview and download.
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-zinc-300">
          <li>
            <strong>New Job</strong> — Choose brand, format (Reel/Image), hook type
            (Contrast, Question, etc.), length, and variables (location, product,
            CTA). Submit and get a job ID.
          </li>
          <li>
            <strong>Jobs list</strong> — See all jobs with status (Queued, Processing,
            Completed, Failed). Click to view details.
          </li>
          <li>
            <strong>Job detail</strong> — View full metadata, status, and any error
            messages. When completed, preview or download the video/image.
          </li>
          <li>
            <strong>Regenerate</strong> — Create a new job with the same settings
            (e.g. after a failure or to try again).
          </li>
        </ul>
        <p className="mb-2 text-sm text-zinc-400">
          <strong>Models:</strong> Choose from curated Replicate models (e.g.{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5">minimax-video-01</code>,{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5">flux-schnell</code>) or use the default.
          Outputs are stored in Supabase and viewable in the UI.
        </p>
        <p className="text-sm text-zinc-500">
          Jobs process asynchronously. Status moves from Queued → Processing →
          Completed (or Failed). Check back or refresh the job page to see updates.
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          <strong>Note:</strong> Only the Contrast hook template is fully built
          today. Video length is capped at 6 seconds for Replicate. Other formats
          and hook types use defaults.
        </p>
      </section>

      <hr className="border-zinc-800" />

      <p className="text-xs uppercase tracking-wider text-zinc-500">
        Technical reference (below)
      </p>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">What It Is</h2>
        <p>
          Content MVP is an automated content generation system. You submit
          structured jobs (brand, format, hook type, variables), they get queued
          via BullMQ + Redis, and a worker generates assets (video/image) via
          Replicate. Outputs are stored in Supabase (Postgres + Storage).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">Architecture</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-sm text-zinc-300">
          <pre className="whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                                │
│  content-admin-nine.vercel.app                                    │
│  Next.js app in content-admin/                                    │
└───────────────────────────────┬───────────────────────────────────┘
                                │ NEXT_PUBLIC_API_URL
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Railway)                                               │
│  web-production-4f46b.up.railway.app                             │
│  Express API: POST /generate, GET /jobs, GET /jobs/:id           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │ Redis (Queue)│    │  Supabase    │    │  Replicate   │
   │ BullMQ jobs  │    │  Postgres +  │    │  AI models   │
   └──────────────┘    │  Storage     │    └──────────────┘
                       └──────────────┘
          ▲
          │
   ┌──────────────┐
   │   Worker     │  Railway worker process: dequeue → Replicate → store
   │  (Railway)   │
   └──────────────┘`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">How It Works</h2>
        <ol className="list-decimal space-y-2 pl-6 text-zinc-300">
          <li>
            <strong>Create a job</strong> — In Content Admin, use &quot;New Job&quot; to submit
            a job (brand, format, hook type, variables). The UI calls POST
            /generate on the Railway API.
          </li>
          <li>
            <strong>Queue</strong> — The API validates the payload, inserts a row in
            Supabase <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">jobs</code>,
            and adds the job to BullMQ. It returns{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">{"{ id, status: \"queued\" }"}</code>.
          </li>
          <li>
            <strong>Worker</strong> — A separate worker process on Railway dequeues
            jobs, builds prompts from templates, calls Replicate, and stores outputs
            in Supabase Storage. It updates job status and writes to{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">assets</code>.
          </li>
          <li>
            <strong>View results</strong> — The Jobs list and Job detail pages fetch
            from GET /jobs and GET /jobs/:id. You can preview, download, or
            regenerate.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">Deployment</h2>
        <h3 className="mt-4 text-base font-medium text-zinc-300">Frontend (Vercel)</h3>
        <ul className="list-disc space-y-1 pl-6 text-zinc-300">
          <li>
            <strong>Project:</strong> content-admin (single project, no duplicate)
          </li>
          <li>
            <strong>Repo:</strong> CBGROWTHOPS/content-mvp, Root Directory:{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">content-admin</code>
          </li>
          <li>
            <strong>Env:</strong>{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_API_URL</code>{" "}
            = https://web-production-4f46b.up.railway.app
          </li>
          <li>Pushes to main trigger automatic deploys</li>
        </ul>

        <h3 className="mt-4 text-base font-medium text-zinc-300">Backend (Railway)</h3>
        <ul className="list-disc space-y-1 pl-6 text-zinc-300">
          <li>
            <strong>Web service:</strong> runs <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">npm run start</code> (Express API)
          </li>
          <li>
            <strong>Worker service:</strong> runs <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">npm run worker</code> (BullMQ worker)
          </li>
          <li>
            <strong>Deploy from repo root</strong> — Backend lives in{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">src/api/</code>,{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">src/worker/</code>, etc.
          </li>
          <li>
            <strong>Env vars:</strong> SUPABASE_URL, SUPABASE_SERVICE_KEY,
            REDIS_*, REPLICATE_API_TOKEN
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">CORS</h2>
        <p className="text-zinc-300">
          The Railway API allows requests from content-admin-nine.vercel.app,
          localhost:3000, and Vercel preview URLs. OPTIONS preflight is handled
          automatically.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">Troubleshooting</h2>
        <dl className="space-y-3 text-zinc-300">
          <div>
            <dt className="font-medium text-zinc-200">
              &quot;Failed to fetch jobs&quot;
            </dt>
            <dd>
              Run migration 002 for the <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">payload</code> column:{" "}
              <code className="block rounded bg-zinc-900 p-2 text-xs">
                SUPABASE_DB_PASSWORD=... npm run db:migrate
              </code>
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

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">Links</h2>
        <ul className="space-y-2 text-zinc-300">
          <li>
            <a
              href="https://content-admin-nine.vercel.app"
              className="text-zinc-400 underline hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              Content Admin (this app)
            </a>
          </li>
          <li>
            <a
              href="https://web-production-4f46b.up.railway.app/health"
              className="text-zinc-400 underline hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              API health check
            </a>
          </li>
          <li>
            <a
              href="https://github.com/CBGROWTHOPS/content-mvp"
              className="text-zinc-400 underline hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repo
            </a>
          </li>
        </ul>
      </section>

      <p className="mt-8 text-sm text-zinc-500">
        <Link href="/jobs" className="text-zinc-400 hover:text-white">
          ← Back to Jobs
        </Link>
      </p>
    </div>
  );
}
