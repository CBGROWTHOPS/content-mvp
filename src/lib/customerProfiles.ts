/**
 * Customer Profile Registry - Minimal ICP definitions for hook/scene generation.
 * Keeps tokens low by using short arrays, not paragraphs.
 */

export interface CustomerProfile {
  id: string;
  label: string;                  // "loan officers", "homeowners 35-55"
  pains: string[];                // 3-5 items
  desires: string[];              // 3-5 items
  drivers: string[];              // 2-4 items (what motivates action)
  environment: string;            // 1 line (where they consume content)
  objections: string[];           // 2-3 items
  proofAngles: string[];          // 2-4 items (what proof resonates)
}

export const CUSTOMER_PROFILES: Record<string, CustomerProfile> = {
  loan_officers: {
    id: "loan_officers",
    label: "loan officers",
    pains: [
      "losing leads to competitors",
      "manual follow-up taking hours",
      "no system for nurturing",
      "inconsistent pipeline",
    ],
    desires: [
      "automated lead nurturing",
      "more closings less effort",
      "premium positioning",
      "predictable pipeline",
    ],
    drivers: [
      "fear of being left behind",
      "desire for status among peers",
      "time freedom",
    ],
    environment: "LinkedIn, Instagram, industry podcasts",
    objections: [
      "already have a CRM",
      "too expensive",
      "don't have time to learn",
    ],
    proofAngles: [
      "X leads in Y days",
      "saved Z hours per week",
      "increased close rate by %",
      "client testimonials",
    ],
  },

  homeowners_35_55: {
    id: "homeowners_35_55",
    label: "homeowners 35-55",
    pains: [
      "too much glare",
      "faded furniture from sun",
      "no privacy from neighbors",
      "high energy bills",
    ],
    desires: [
      "beautiful controlled light",
      "modern premium interior",
      "smart home integration",
      "effortless operation",
    ],
    drivers: [
      "pride in home",
      "convenience",
      "aesthetic improvement",
    ],
    environment: "Instagram, Pinterest, home improvement shows",
    objections: [
      "custom is too expensive",
      "installation is complicated",
      "regular blinds work fine",
    ],
    proofAngles: [
      "before/after transformation",
      "energy savings %",
      "5-star reviews",
      "years of warranty",
    ],
  },

  small_business_owners: {
    id: "small_business_owners",
    label: "small business owners",
    pains: [
      "no time for marketing",
      "inconsistent lead flow",
      "competing with bigger players",
      "wasting money on ads that don't work",
    ],
    desires: [
      "predictable customer acquisition",
      "professional brand presence",
      "automated marketing",
      "measurable ROI",
    ],
    drivers: [
      "fear of failure",
      "desire to scale",
      "proving doubters wrong",
    ],
    environment: "Facebook, Instagram, YouTube",
    objections: [
      "tried marketing before, didn't work",
      "can't afford agency rates",
      "don't understand digital",
    ],
    proofAngles: [
      "X new customers in Y days",
      "ROI of Z%",
      "case study results",
      "money-back guarantee",
    ],
  },

  job_seekers_remote: {
    id: "job_seekers_remote",
    label: "remote job seekers",
    pains: [
      "endless applications no responses",
      "scam job listings",
      "competing with thousands",
      "no idea what pays well",
    ],
    desires: [
      "legit remote jobs",
      "work from anywhere freedom",
      "good pay without commute",
      "flexible schedule",
    ],
    drivers: [
      "escape 9-5 office",
      "family time",
      "location independence",
    ],
    environment: "TikTok, Instagram, Facebook groups",
    objections: [
      "sounds too good to be true",
      "need experience I don't have",
      "not tech savvy enough",
    ],
    proofAngles: [
      "X people hired this month",
      "average salary $Y",
      "real job screenshots",
      "success story videos",
    ],
  },

  parents_deal_seekers: {
    id: "parents_deal_seekers",
    label: "parents looking for deals",
    pains: [
      "baby stuff is expensive",
      "missing out on good deals",
      "too many sites to check",
      "products sell out fast",
    ],
    desires: [
      "save money on baby essentials",
      "get notified first",
      "trusted recommendations",
      "one place for all deals",
    ],
    drivers: [
      "providing for family",
      "smart spending pride",
      "FOMO on limited deals",
    ],
    environment: "Facebook, Instagram, deal groups",
    objections: [
      "deals are probably fake",
      "too many emails already",
      "don't want to share info",
    ],
    proofAngles: [
      "saved $X this month",
      "exclusive retailer partnerships",
      "community of Y parents",
      "real savings screenshots",
    ],
  },
};

export function getProfile(profileId: string): CustomerProfile | null {
  return CUSTOMER_PROFILES[profileId] ?? null;
}

export function listProfiles(): Array<{ id: string; label: string }> {
  return Object.values(CUSTOMER_PROFILES).map(p => ({
    id: p.id,
    label: p.label,
  }));
}

export function getRandomPain(profile: CustomerProfile): string {
  return profile.pains[Math.floor(Math.random() * profile.pains.length)];
}

export function getRandomDesire(profile: CustomerProfile): string {
  return profile.desires[Math.floor(Math.random() * profile.desires.length)];
}

export function getRandomObjection(profile: CustomerProfile): string {
  return profile.objections[Math.floor(Math.random() * profile.objections.length)];
}

export function getRandomProofAngle(profile: CustomerProfile): string {
  return profile.proofAngles[Math.floor(Math.random() * profile.proofAngles.length)];
}

/**
 * Get hook seed based on pattern type and profile.
 * Returns a phrase to inject into hook generation.
 */
export function getHookSeed(
  pattern: "expose_mistake" | "challenge_belief" | "reveal_result" | "callout_audience" | "quantify_outcome",
  profile: CustomerProfile
): string {
  switch (pattern) {
    case "callout_audience":
      return `If you're a ${profile.label}`;
    case "expose_mistake":
      return `Most ${profile.label} think "${getRandomObjection(profile)}" but...`;
    case "challenge_belief":
      return `You believe "${getRandomObjection(profile)}"`;
    case "reveal_result":
      return `${profile.proofAngles[0]} changed everything`;
    case "quantify_outcome":
      return profile.proofAngles.find(p => /\d/.test(p)) || profile.proofAngles[0];
  }
}
