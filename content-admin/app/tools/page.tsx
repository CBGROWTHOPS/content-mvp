import Link from "next/link";

const tools = [
  {
    id: "marketing",
    title: "Marketing Copy",
    description: "Generate headlines, CTAs, captions, and copy variations for ads and social.",
    href: "/tools/marketing",
    icon: "✍️",
  },
  {
    id: "director-brief",
    title: "Director Brief",
    description: "Full creative direction: concept, art, camera, lighting, typography, sound.",
    href: "/tools/director-brief",
    icon: "🎬",
  },
  {
    id: "reel-blueprint",
    title: "Reel Blueprint",
    description: "Shot-by-shot spec for video pipeline: timing, movement, scene notes.",
    href: "/tools/reel-blueprint",
    icon: "📋",
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Content Tools</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Focused tools for each type of content. Pick one and generate.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="group block rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-900/80"
          >
            <span className="text-2xl">{tool.icon}</span>
            <h2 className="mt-3 font-medium text-zinc-100 group-hover:text-white">
              {tool.title}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500 group-hover:text-zinc-400">
              {tool.description}
            </p>
            <span className="mt-3 inline-block text-xs font-medium text-zinc-500 group-hover:text-zinc-400">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
