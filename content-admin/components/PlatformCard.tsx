"use client";

import Link from "next/link";

export interface PlatformCardProps {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  outputs: string[];
  badge?: string;
  primary?: boolean;
}

export function PlatformCard({
  href,
  icon,
  title,
  subtitle,
  outputs,
  badge,
  primary = false,
}: PlatformCardProps) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-xl border p-5 transition-all hover:scale-[1.02] ${
        primary
          ? "border-zinc-600 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
    >
      {badge && (
        <span className="absolute -top-2 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
          {badge}
        </span>
      )}
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {outputs.map((output, i) => (
          <span
            key={i}
            className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
          >
            {output}
          </span>
        ))}
      </div>
    </Link>
  );
}

export interface AdvancedToolLinkProps {
  href: string;
  label: string;
}

export function AdvancedToolLink({ href, label }: AdvancedToolLinkProps) {
  return (
    <Link
      href={href}
      className="rounded border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
    >
      {label}
    </Link>
  );
}
