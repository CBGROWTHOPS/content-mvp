export function build(profile, variables) {
  const headline = profile.positioning ?? "LIGHT. CONTROLLED.";
  const cta = profile.primary_cta ?? "Schedule Design Consultation";
  const concept = String(variables?.concept ?? "Design Your Light");

  return [
    "REEL STRUCTURE - 6 second concept reveal. Static camera. Natural light.",
    "",
    "Concept theme: " + concept,
    "",
    "Scene 1: Setup - space before",
    "Scene 2: Reveal - light controlled",
    "End Frame: " + headline + " | " + cta,
    "",
    "Tone: Calm, deliberate. Editorial feel.",
  ].join("\n");
}
