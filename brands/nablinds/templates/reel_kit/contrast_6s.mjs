export function build(profile) {
  const headline = profile.positioning ?? "LIGHT. CONTROLLED.";
  const cta = profile.primary_cta ?? "Schedule Design Consultation";

  return [
    "REEL STRUCTURE - 6 second contrast. Static camera. Natural light. No flashy transitions.",
    "",
    "Scene 1 (UNCONTROLLED):",
    "Raw, authentic space. Natural lighting, uncurated. Light flooding in without control.",
    "",
    "Scene 2 (DESIGNED):",
    "Same space with window treatment. Polished, aspirational. Light controlled.",
    "",
    "End Frame:",
    headline,
    cta,
    "",
    "Tone: Calm, deliberate. Feels like editorial, not ad creative. No aggressive text motion.",
  ].join("\n");
}
