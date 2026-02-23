"use client";

import type { TileOption } from "@/types/strategy";

interface TileGroupProps {
  title: string;
  options: TileOption[];
  value: string;
  onChange: (id: string) => void;
}

export function TileGroup({ title, options, value, onChange }: TileGroupProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "border-zinc-100 bg-zinc-100/10 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.description && (
                <span className="ml-1.5 text-zinc-500">— {opt.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
