"use client";

import type { TileOption } from "@/types/strategy";

interface TileGroupProps {
  title: string;
  options: TileOption[];
  value: string;
  onChange: (id: string) => void;
  showDescription?: boolean;
}

export function TileGroup({ title, options, value, onChange, showDescription = true }: TileGroupProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{title}</h3>
      <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`rounded border px-1.5 py-1 text-left text-[11px] leading-tight transition-colors ${
                isActive
                  ? "border-zinc-100 bg-zinc-100/10 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.description && showDescription && (
                <span className="ml-0.5 text-zinc-500">— {opt.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
