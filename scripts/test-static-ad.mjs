#!/usr/bin/env node
/**
 * Test Static Ad (image_kit) — simplest job: one image, no voiceover, no video, no Remotion.
 * Run after confirming worker is up. Verifies worker + Replicate/Higgsfield respond.
 *
 * Usage: API_URL=https://web-production-4f46b.up.railway.app node scripts/test-static-ad.mjs
 */
const API_URL = process.env.API_URL ?? "https://web-production-4f46b.up.railway.app";

const payload = {
  brand_key: "nablinds", // use nablinds (has templates); or "bdn" if you have that brand
  format: "image_kit",
  objective: "awareness",
  hook_type: "contrast",
  aspect_ratio: "4:5",
  variables: {
    headline: "Design Your Light",
    cta: "Learn More",
    body: "Architectural window treatment in modern space",
  },
};

async function main() {
  console.log("Creating Static Ad (image_kit) job...");
  const res = await fetch(`${API_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Error:", json?.error ?? res.statusText);
    process.exit(1);
  }
  const jobId = json?.id;
  console.log(`Job created: ${jobId}`);
  console.log(`Status: ${json?.status ?? "queued"}`);
  console.log(`Check progress: ${API_URL.replace(/\/$/, "")}/jobs/${jobId}`);
  console.log("Or in content-admin: /jobs/" + jobId);
}

main();
