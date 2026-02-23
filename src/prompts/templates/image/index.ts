import type { JobInput } from "../../../schema/job.js";

export function build(variables: JobInput["variables"]): string {
  const product = String(variables?.product ?? "premium product");
  const style = String(variables?.style ?? "clean, modern");
  const cta = String(variables?.cta ?? "Discover more");

  return [
    `Create a high-quality product image for ${product}.`,
    `Style: ${style}.`,
    `Include clear visual appeal suitable for advertising.`,
    `CTA suggestion: ${cta}`,
  ].join(" ");
}
