CREATE TABLE IF NOT EXISTS brand_kits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  niche        TEXT NOT NULL,
  industry     TEXT,
  icp          JSONB,
  voice        JSONB,
  visuals      JSONB,
  cta_defaults JSONB,
  guardrails   TEXT[],
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
