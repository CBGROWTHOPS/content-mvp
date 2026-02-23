"use client";

interface Brand {
  key: string;
  display_name: string;
}

interface BrandSelectorProps {
  value: string;
  onChange: (key: string) => void;
  brands: Brand[];
}

export function BrandSelector({ value, onChange, brands }: BrandSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
    >
      <option value="">Select brand…</option>
      {brands.map((b) => (
        <option key={b.key} value={b.key}>
          {b.display_name || b.key}
        </option>
      ))}
    </select>
  );
}
