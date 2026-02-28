-- Migration: Add audio support for multi-format reels
-- Adds voiceover_script and music_selection to generations
-- Adds audio_assets to jobs for tracking generated audio files

-- Add voiceover script to generations (LLM-generated narration)
ALTER TABLE generations 
ADD COLUMN IF NOT EXISTS voiceover_script JSONB;

-- Add music selection to generations (mood, tempo, genre)
ALTER TABLE generations 
ADD COLUMN IF NOT EXISTS music_selection JSONB;

-- Add audio assets to jobs (URLs for voiceover, music, per-shot videos)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS audio_assets JSONB;

-- Add reel_type to jobs for tracking which pipeline was used
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS reel_type TEXT;

-- Add index for querying by reel type
CREATE INDEX IF NOT EXISTS idx_jobs_reel_type ON jobs(reel_type);

-- Comment on new columns
COMMENT ON COLUMN generations.voiceover_script IS 'LLM-generated voiceover script with segments per shot';
COMMENT ON COLUMN generations.music_selection IS 'Selected music track metadata (mood, tempo, genre)';
COMMENT ON COLUMN jobs.audio_assets IS 'Generated audio asset URLs: voiceoverUrl, musicUrl, videosByShot';
COMMENT ON COLUMN jobs.reel_type IS 'Reel type: text_overlay, voiceover, broll, talking_head';
