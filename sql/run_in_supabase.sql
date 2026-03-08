-- Run in Supabase SQL Editor (project rovbqnncmzltdyeeldxz)
-- Task 1: Migrations + seed. Execute as one script.

-- 008: brand_kits table
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

-- 009: jobs funnel/intent columns
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS funnel_stage    TEXT,
  ADD COLUMN IF NOT EXISTS content_intent  TEXT,
  ADD COLUMN IF NOT EXISTS provider_log    JSONB;

-- 010: seed 3 brand kits
INSERT INTO brand_kits (name, slug, niche, industry, icp, voice, visuals, cta_defaults, guardrails)
VALUES
  ('Baby Deals Network', 'bdn', 'baby/parenting', 'affiliate',
   '{"description": "Parents seeking value on baby gear, nursery, and family products"}',
   '{"tone": "Warm, helpful, budget-conscious, no guilt"}',
   '{"style": "Clean, aspirational, family-friendly"}',
   '{"primary": "Save today"}',
   ARRAY['No fear-based messaging', 'Always value-first']),
  ('Game Testers Hub', 'gth', 'gaming/side-income', 'affiliate',
   '{"description": "Gamers and side-hustlers interested in paid playtesting"}',
   '{"tone": "Casual, exciting, opportunistic"}',
   '{"style": "Gaming aesthetic, energetic, screens and controllers"}',
   '{"primary": "Apply now"}',
   ARRAY['No get-rich-quick claims', 'Be transparent about pay']),
  ('Remote Flex Jobs', 'rfj', 'remote-work', 'affiliate',
   '{"description": "Job seekers wanting flexible remote work"}',
   '{"tone": "Professional but approachable, opportunity-focused"}',
   '{"style": "Modern, clean, work-from-anywhere vibes"}',
   '{"primary": "Find your fit"}',
   ARRAY['No misleading job titles', 'Honest about flexibility'])
ON CONFLICT (slug) DO NOTHING;
