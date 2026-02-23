import type { JobInput } from "../../../schema/job.js";

export function build(variables: JobInput["variables"]): string {
  const location = String(variables?.location ?? "luxury living space");
  const product = String(variables?.product ?? "premium product");
  const cta = String(variables?.cta ?? "Transform your space today");

  return [
    `SCENE 1 - UNCONTROLLED:`,
    `Raw, authentic footage of ${location} before intervention. Natural lighting, uncurated.`,
    ``,
    `SCENE 2 - DESIGNED:`,
    `The same space reimagined with ${product}. Polished, aspirational, controlled.`,
    ``,
    `END FRAME CTA:`,
    cta,
  ].join("\n");
}
