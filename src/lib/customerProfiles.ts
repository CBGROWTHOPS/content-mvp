/**
 * Customer Profile Registry - Minimal ICP definitions for hook/scene generation.
 */

export type CustomerProfile = {
  id: string;
  label: string;
  pains: string[];
  desires: string[];
  drivers: string[];
  objections: string[];
  environment: string;
  proofAngles: string[];
};

export const CUSTOMER_PROFILES: Record<string, CustomerProfile> = {
  luxury_condo_owner: {
    id: "luxury_condo_owner",
    label: "Luxury Condo Owner",
    pains: ["harsh glare", "heat through glass", "privacy at night", "cheap blinds ruin design"],
    desires: ["clean minimal look", "motorized control", "soft natural light", "privacy without darkness"],
    drivers: ["status", "control", "comfort"],
    objections: ["I don't want it to look bulky", "I don't want a messy install"],
    environment: "Miami high-rise condo, floor-to-ceiling windows, modern interior, bright sun.",
    proofAngles: ["before/after glare", "smooth motorized drop", "designer-grade materials", "heat reduction"],
  },
  interior_designer: {
    id: "interior_designer",
    label: "Interior Designer",
    pains: ["client hates the sample", "hardware looks cheap", "installers ruin the finish"],
    desires: ["spec-perfect fabrics", "clean track concealment", "fast quotes", "white-glove install"],
    drivers: ["taste", "reliability", "client trust"],
    objections: ["lead times", "will it match the palette"],
    environment: "Design studio and upscale homes, material swatches, detailed finishes.",
    proofAngles: ["material closeups", "perfect alignment", "jobsite protection", "repeatable process"],
  },
  loan_officer: {
    id: "loan_officer",
    label: "Loan Officer",
    pains: ["losing leads to competitors", "manual follow-up taking hours", "no system for nurturing"],
    desires: ["automated lead nurturing", "more closings less effort", "premium positioning"],
    drivers: ["status", "time freedom", "income"],
    objections: ["already have a CRM", "too expensive", "don't have time to learn"],
    environment: "Home office, laptop, phone calls, client meetings.",
    proofAngles: ["X leads in Y days", "saved Z hours per week", "increased close rate"],
  },
  remote_job_seeker: {
    id: "remote_job_seeker",
    label: "Remote Job Seeker",
    pains: ["endless applications no responses", "scam job listings", "competing with thousands"],
    desires: ["legit remote jobs", "work from anywhere freedom", "good pay without commute"],
    drivers: ["escape 9-5", "family time", "location independence"],
    objections: ["sounds too good to be true", "need experience I don't have"],
    environment: "Home desk, laptop, coffee, casual clothes.",
    proofAngles: ["X people hired this month", "average salary $Y", "real job screenshots"],
  },
  deal_seeking_parent: {
    id: "deal_seeking_parent",
    label: "Deal-Seeking Parent",
    pains: ["baby stuff is expensive", "missing out on good deals", "products sell out fast"],
    desires: ["save money on baby essentials", "get notified first", "trusted recommendations"],
    drivers: ["providing for family", "smart spending pride", "FOMO"],
    objections: ["deals are probably fake", "too many emails already"],
    environment: "Living room, baby gear, phone scrolling, multitasking.",
    proofAngles: ["saved $X this month", "exclusive retailer partnerships", "real savings screenshots"],
  },
};

export const DEFAULT_PROFILE_ID = "luxury_condo_owner";

export function getCustomerProfile(id?: string): CustomerProfile {
  return CUSTOMER_PROFILES[id || DEFAULT_PROFILE_ID] || CUSTOMER_PROFILES[DEFAULT_PROFILE_ID];
}

export function listCustomerProfiles(): Array<{ id: string; label: string }> {
  return Object.values(CUSTOMER_PROFILES).map(p => ({ id: p.id, label: p.label }));
}
