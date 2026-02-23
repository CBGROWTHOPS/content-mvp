function getProjectContext(projectType) {
  switch (projectType) {
    case "high-rise":
      return "high-rise condo with floor-to-ceiling windows";
    case "single-family":
      return "single-family modern home";
    case "townhouse":
      return "townhouse with flexible spaces";
    default:
      return "single-family modern home";
  }
}

export function build(profile, variables, options) {
  const headline = profile.positioning ?? "LIGHT. CONTROLLED.";
  const cta = profile.primary_cta ?? "Schedule Design Consultation";
  const theme = String(variables?.theme ?? "Design Your Light");
  const projectType = options?.project_type ?? "single-family";
  const projectContext = getProjectContext(projectType);
  const microLabel = profile.default_micro_label ?? "BRAND";

  return [
    "WIDE VIDEO STRUCTURE - 16:9 editorial lookbook. Architectural showcase.",
    "",
    "Label: " + microLabel,
    "Headline: " + headline,
    "Concept: " + theme,
    "Detail: " + projectContext + ". Light behavior, window architecture.",
    "CTA: " + cta,
    "",
    "Tone: Editorial lookbook. Architectural showcase. Not ad creative.",
    "No discount framing. No loud motion graphics. Calm, aspirational.",
  ].join("\n");
}
