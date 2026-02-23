-- Link jobs to generations for traceability and prompt enrichment
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS generation_id UUID REFERENCES generations (id);

CREATE INDEX IF NOT EXISTS idx_jobs_generation_id ON jobs (generation_id);
