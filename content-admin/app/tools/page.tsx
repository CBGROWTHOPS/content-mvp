import { PlatformCard, AdvancedToolLink } from "@/components/PlatformCard";

const platforms = [
  {
    id: "facebook-ads",
    icon: "📘",
    title: "Facebook Ads",
    subtitle: "Ad images + copy for campaigns",
    outputs: ["4:5 Image", "1.91:1 Image", "Ad Copy", "Headlines"],
    href: "/tools/facebook-ads",
    primary: true,
    badge: "Popular",
  },
  {
    id: "instagram-reels",
    icon: "📸",
    title: "Instagram Reels",
    subtitle: "Vertical videos with voice + music",
    outputs: ["9:16 Video", "Voiceover", "Music", "Text Overlays"],
    href: "/tools/instagram-reels",
    primary: true,
  },
  {
    id: "youtube-shorts",
    icon: "▶️",
    title: "YouTube Shorts",
    subtitle: "Vertical clips optimized for YouTube",
    outputs: ["9:16 Video", "Hook Text", "CTA End Frame"],
    href: "/tools/youtube-shorts",
    primary: false,
  },
  {
    id: "linkedin",
    icon: "💼",
    title: "LinkedIn Content",
    subtitle: "Professional posts for B2B",
    outputs: ["4:5 Image", "16:9 Video", "Post Copy"],
    href: "/tools/linkedin",
    primary: false,
  },
];

const advancedTools = [
  { href: "/tools/advanced/director-brief", label: "Director Brief" },
  { href: "/tools/advanced/reel-storyboard", label: "Storyboard" },
  { href: "/tools/advanced/marketing", label: "Marketing Copy" },
  { href: "/tools/advanced/prompt-upgrade", label: "Prompt Upgrade" },
  { href: "/tools/advanced/image", label: "Image" },
  { href: "/tools/advanced/single-reel-clip", label: "Single Clip" },
  { href: "/tools/advanced/full-reel", label: "Full Reel" },
];

export default function ToolsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">
          What do you want to create?
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Pick a platform. We'll generate the right formats and copy.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            href={platform.href}
            icon={platform.icon}
            title={platform.title}
            subtitle={platform.subtitle}
            outputs={platform.outputs}
            badge={platform.badge}
            primary={platform.primary}
          />
        ))}
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          Advanced Tools
        </h2>
        <div className="flex flex-wrap gap-2">
          {advancedTools.map((tool) => (
            <AdvancedToolLink key={tool.href} href={tool.href} label={tool.label} />
          ))}
        </div>
      </div>
    </div>
  );
}
