-- Store full job payload for regenerate and display
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payload JSONB;
