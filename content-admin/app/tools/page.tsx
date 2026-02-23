import Link from "next/link";

const tools = [
  {
    id: "marketing",
    title: "Marketing Copy",
    description: "Headlines, CTAs, captions, and copy variations for ads and social.",
    href: "/tools/marketing",
    icon: "✍️",
  },
  {
    id: "director-brief",
    title: "Director Brief",
    description: "Creative direction: concept, art, camera, lighting, typography, sound.",
    href: "/tools/director-brief",
    icon: "🎬",
  },
  {
    id: "reel-storyboard",
    title: "Reel Storyboard",
    description: "Shot-by-shot breakdown with timing, movement, and scene notes.",
    href: "/tools/reel-storyboard",
    icon: "📋",
  },
  {
    id: "prompt-upgrade",
    title: "Prompt Upgrade",
    description: "Improve and polish prompts for image or video generation.",
    href: "/tools/prompt-upgrade",
    icon: "✨",
  },
  {
    id: "image",
    title: "Image",
    description: "Generate a still image. 4:5 editorial or custom aspect.",
    href: "/tools/image",
    icon: "🖼️",
  },
  {
    id: "single-reel-clip",
    title: "Single Reel Clip",
    description: "Generate one short reel clip (6s, 9:16).",
    href: "/tools/single-reel-clip",
    icon: "📱",
  },
  {
    id: "full-reel",
    title: "Full Reel",
    description: "Generate a full 16:9 showcase video.",
    href: "/tools/full-reel",
    icon: "🎥",
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Content Tools</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Each tool does one thing. Pick one and go.
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
