-- Seed starter brand kits. Run after 008_brand_kits.sql
INSERT INTO brand_kits (name, slug, niche, industry, icp, voice, visuals, cta_defaults, guardrails)
VALUES
  (
    'Baby Deals Network',
    'bdn',
    'baby/parenting',
    'affiliate',
    '{"description": "Parents seeking value on baby gear, nursery, and family products"}',
    '{"tone": "Warm, helpful, budget-conscious, no guilt"}',
    '{"style": "Clean, aspirational, family-friendly"}',
    '{"primary": "Save today"}',
    ARRAY['No fear-based messaging', 'Always value-first']
  ),
  (
    'Game Testers Hub',
    'gth',
    'gaming/side-income',
    'affiliate',
    '{"description": "Gamers and side-hustlers interested in paid playtesting"}',
    '{"tone": "Casual, exciting, opportunistic"}',
    '{"style": "Gaming aesthetic, energetic, screens and controllers'}',
    '{"primary": "Apply now"}',
    ARRAY['No get-rich-quick claims', 'Be transparent about pay']
  ),
  (
    'Remote Flex Jobs',
    'rfj',
    'remote-work',
    'affiliate',
    '{"description": "Job seekers wanting flexible remote work"}',
    '{"tone": "Professional but approachable, opportunity-focused"}',
    '{"style": "Modern, clean, work-from-anywhere vibes"}',
    '{"primary": "Find your fit"}',
    ARRAY['No misleading job titles', 'Honest about flexibility']
  )
ON CONFLICT (slug) DO NOTHING;
