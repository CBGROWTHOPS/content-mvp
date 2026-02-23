"use client";

interface ContextFieldsProps {
  contextTitle: string;
  contextNotes: string;
  onContextTitleChange: (v: string) => void;
  onContextNotesChange: (v: string) => void;
}

const inputClass =
  "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none";

export function ContextFields({
  contextTitle,
  contextNotes,
  onContextTitleChange,
  onContextNotesChange,
}: ContextFieldsProps) {
  return (
    <div className="space-y-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Context Title (optional)
        </label>
        <input
          type="text"
          value={contextTitle}
          onChange={(e) => onContextTitleChange(e.target.value)}
          placeholder="e.g. Q1 Campaign"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Context Notes (optional)
        </label>
        <textarea
          value={contextNotes}
          onChange={(e) => onContextNotesChange(e.target.value)}
          placeholder="Additional context for generation..."
          rows={2}
          className={inputClass}
        />
      </div>
    </div>
  );
}
