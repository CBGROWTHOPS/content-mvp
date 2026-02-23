-- Job status enum
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Asset type enum
CREATE TYPE asset_type AS ENUM ('video', 'image');

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status job_status NOT NULL DEFAULT 'pending',
  brand TEXT NOT NULL,
  format TEXT NOT NULL,
  objective TEXT NOT NULL,
  model TEXT NOT NULL,
  cost DECIMAL(10, 6),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs (status);
CREATE INDEX idx_jobs_created_at ON jobs (created_at);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  type asset_type NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_job_id ON assets (job_id);

-- Metrics table (Phase 2)
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  ctr DECIMAL(5, 4),
  cpl DECIMAL(10, 2),
  conversion_rate DECIMAL(5, 4),
  recorded_at TIMESTAMPTZ
);

CREATE INDEX idx_metrics_job_id ON metrics (job_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at();
