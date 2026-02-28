/**
 * Music library for selecting background tracks based on mood and tempo.
 * Tracks are pre-licensed and stored in brands/shared/music/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface MusicTrack {
  id: string;
  filename: string;
  mood: string;
  tempo: "slow" | "medium" | "upbeat";
  genre: string;
  durationSeconds: number;
  bpm: number;
  license: string;
  description: string;
}

export interface MusicLibrary {
  tracks: MusicTrack[];
  moodMappings: Record<string, string[]>;
}

export interface MusicSelection {
  mood: string;
  tempo?: "slow" | "medium" | "upbeat";
  genre?: string;
  minDurationSeconds?: number;
}

let cachedLibrary: MusicLibrary | null = null;

function getMusicDir(): string {
  return path.resolve(__dirname, "../../brands/shared/music");
}

function loadLibrary(): MusicLibrary {
  if (cachedLibrary) return cachedLibrary;
  
  const indexPath = path.join(getMusicDir(), "index.json");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Music library index not found: ${indexPath}`);
  }
  
  const content = fs.readFileSync(indexPath, "utf-8");
  cachedLibrary = JSON.parse(content) as MusicLibrary;
  return cachedLibrary;
}

/**
 * Normalize mood string to a canonical mood category.
 */
function normalizeMood(mood: string): string {
  const library = loadLibrary();
  const lowerMood = mood.toLowerCase().trim();
  
  for (const [canonical, aliases] of Object.entries(library.moodMappings)) {
    if (canonical === lowerMood || aliases.includes(lowerMood)) {
      return canonical;
    }
  }
  
  // Default to warm for unknown moods (safe choice)
  return "warm";
}

/**
 * Select a music track based on mood and optional criteria.
 * Returns the track metadata and full file path.
 */
export function selectTrack(selection: MusicSelection): {
  track: MusicTrack;
  filePath: string;
} | null {
  const library = loadLibrary();
  const normalizedMood = normalizeMood(selection.mood);
  
  // Filter by mood
  let candidates = library.tracks.filter(t => t.mood === normalizedMood);
  
  // Filter by tempo if specified
  if (selection.tempo && candidates.length > 0) {
    const tempoFiltered = candidates.filter(t => t.tempo === selection.tempo);
    if (tempoFiltered.length > 0) {
      candidates = tempoFiltered;
    }
  }
  
  // Filter by genre if specified
  if (selection.genre && candidates.length > 0) {
    const genreFiltered = candidates.filter(
      t => t.genre.toLowerCase() === selection.genre!.toLowerCase()
    );
    if (genreFiltered.length > 0) {
      candidates = genreFiltered;
    }
  }
  
  // Filter by minimum duration if specified
  if (selection.minDurationSeconds && candidates.length > 0) {
    const durationFiltered = candidates.filter(
      t => t.durationSeconds >= selection.minDurationSeconds!
    );
    if (durationFiltered.length > 0) {
      candidates = durationFiltered;
    }
  }
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Pick a random track from candidates
  const track = candidates[Math.floor(Math.random() * candidates.length)];
  const filePath = path.join(getMusicDir(), track.filename);
  
  return { track, filePath };
}

/**
 * Get all available moods in the library.
 */
export function getAvailableMoods(): string[] {
  const library = loadLibrary();
  return Object.keys(library.moodMappings);
}

/**
 * Get all tracks in the library.
 */
export function getAllTracks(): MusicTrack[] {
  return loadLibrary().tracks;
}

/**
 * Check if a track file exists.
 */
export function trackExists(trackId: string): boolean {
  const library = loadLibrary();
  const track = library.tracks.find(t => t.id === trackId);
  if (!track) return false;
  
  const filePath = path.join(getMusicDir(), track.filename);
  return fs.existsSync(filePath);
}
