"use client";

export interface WorkflowStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
}

export interface WorkflowProgressProps {
  steps: WorkflowStep[];
}

export function WorkflowProgress({ steps }: WorkflowProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                step.status === "completed"
                  ? "bg-green-600 text-white"
                  : step.status === "active"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {step.status === "completed" ? "✓" : index + 1}
            </div>
            <span
              className={`text-sm ${
                step.status === "active"
                  ? "font-medium text-zinc-100"
                  : step.status === "completed"
                  ? "text-zinc-400"
                  : "text-zinc-500"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-3 h-px w-8 ${
                step.status === "completed" ? "bg-green-600" : "bg-zinc-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export interface WorkflowResultProps {
  status: "pending" | "processing" | "completed" | "failed";
  jobId?: string;
  assetUrl?: string;
  error?: string;
}

export function WorkflowResult({
  status,
  jobId,
  assetUrl,
  error,
}: WorkflowResultProps) {
  if (status === "pending") {
    return null;
  }

  if (status === "processing") {
    return (
      <div className="rounded-lg border border-blue-800/50 bg-blue-950/30 p-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <div>
            <p className="text-sm font-medium text-blue-300">Generating...</p>
            {jobId && (
              <p className="text-xs text-blue-400/70">Job: {jobId}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-4">
        <p className="text-sm font-medium text-red-300">Generation failed</p>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (status === "completed" && assetUrl) {
    const isVideo = assetUrl.includes(".mp4") || assetUrl.includes("video");
    return (
      <div className="rounded-lg border border-green-800/50 bg-green-950/30 p-4">
        <p className="mb-3 text-sm font-medium text-green-300">Ready!</p>
        {isVideo ? (
          <video
            src={assetUrl}
            controls
            className="max-h-80 w-full rounded-lg"
          />
        ) : (
          <img
            src={assetUrl}
            alt="Generated asset"
            className="max-h-80 w-full rounded-lg object-contain"
          />
        )}
        <a
          href={assetUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
        >
          Download
        </a>
      </div>
    );
  }

  return null;
}
