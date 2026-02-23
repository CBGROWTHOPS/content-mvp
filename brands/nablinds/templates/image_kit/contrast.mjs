function getCollectionLabel(profile, key) {
  const c = profile.collections?.find((x) => x.key === key);
  return c?.label ?? key.toUpperCase();
}

export function build(profile, variables, options) {
  const headline = profile.positioning ?? "LIGHT. CONTROLLED.";
  const cta = profile.primary_cta ?? "Schedule Design Consultation";
  const microLabel = options?.collection_key
    ? getCollectionLabel(profile, options.collection_key)
    : (profile.default_micro_label ?? "BRAND");
  const bodyHint = String(variables?.body ?? "Architectural window treatment in modern space.");

  return [
    "EDITORIAL ARCHITECTURAL PHOTOGRAPHY. Contrast composition. Background image for overlay.",
    "Style: Warm neutrals, realistic exposure. No HDR glow. No text baked into image.",
    "Focus on light behavior in space. South Florida modern home interior.",
    "Scene: " + bodyHint,
    "",
    "OVERLAY STRUCTURE (for post-processing):",
    `MICRO LABEL: ${microLabel}`,
    `HEADLINE: ${headline}`,
    `BODY: ${bodyHint} (1 short line, architectural, no sales tone)`,
    `CTA: ${cta}`,
    "",
    "Do not bake text into the image. Generate clean architectural photography suitable for typography overlay.",
  ].join("\n");
}
