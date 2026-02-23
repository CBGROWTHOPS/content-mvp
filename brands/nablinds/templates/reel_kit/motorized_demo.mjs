export function build(profile) {
  const headline = profile.positioning ?? "LIGHT. CONTROLLED.";
  const cta = profile.primary_cta ?? "Schedule Design Consultation";

  return [
    "REEL STRUCTURE - 6 second motorized demo. Static camera.",
    "",
    "Show: Silent automation of window treatment. Quiet, smooth movement.",
    "End Frame: " + headline + " | " + cta,
    "",
    "Tone: Calm. Show the product in use, no loud motion graphics.",
  ].join("\n");
}
