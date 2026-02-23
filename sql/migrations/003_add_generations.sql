-- Generations table: persisted content generation records
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  strategy JSONB NOT NULL,
  marketing_output JSONB,
  creative_brief JSONB,
  creative_director_brief JSONB,
  reel_blueprint JSONB,
  token_usage JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generations_brand_id ON generations (brand_id);
CREATE INDEX idx_generations_created_at ON generations (created_at);
