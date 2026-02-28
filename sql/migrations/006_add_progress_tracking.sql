-- Add progress tracking to jobs table
-- Allows real-time progress updates in the UI

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS progress_step TEXT;

COMMENT ON COLUMN jobs.progress_step IS 'Current processing step: queued, processing, generating_voiceover, generating_music, generating_video, rendering, uploading, completed';

-- Index for filtering jobs by progress step (useful for debugging)
CREATE INDEX IF NOT EXISTS idx_jobs_progress_step ON jobs(progress_step) WHERE progress_step IS NOT NULL;
