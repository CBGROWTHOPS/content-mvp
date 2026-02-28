-- Creative Brief Cache Table
-- Stores compact creative briefs keyed by SHA1 hash of inputs

CREATE TABLE IF NOT EXISTS creative_briefs (
  brief_key TEXT PRIMARY KEY,
  brief JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creative_briefs_created 
  ON creative_briefs(created_at DESC);
