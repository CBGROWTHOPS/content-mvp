/**
 * Music library for selecting background tracks based on mood and tempo.
 * Supports both pre-licensed tracks and AI-generated music via MusicGen.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Replicate from "replicate";

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

// ============================================
// AI Music Generation (MusicGen via Replicate)
// ============================================

export interface GenerateMusicOptions {
  mood: string;
  tempo?: "slow" | "medium" | "upbeat";
  genre?: string;
  durationSeconds?: number;
  brandContext?: string;
}

export interface GenerateMusicResult {
  audioUrl: string;
  audioBuffer?: Buffer;
  durationSeconds: number;
  cost: number;
  prompt: string;
}

const MUSICGEN_MODEL = "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb";
const MUSICGEN_COST_PER_RUN = 0.083;

/**
 * Build a MusicGen prompt from mood/tempo/genre.
 */
function buildMusicPrompt(options: GenerateMusicOptions): string {
  const parts: string[] = [];
  
  // Mood mapping to descriptive terms
  const moodDescriptions: Record<string, string> = {
    calm: "calm, peaceful, relaxing ambient",
    warm: "warm, cozy, inviting acoustic",
    upbeat: "upbeat, positive, energetic modern",
    dramatic: "dramatic, cinematic, epic orchestral",
  };
  
  const moodDesc = moodDescriptions[options.mood.toLowerCase()] ?? options.mood;
  parts.push(moodDesc);
  
  // Tempo
  if (options.tempo) {
    const tempoMap: Record<string, string> = {
      slow: "slow tempo, 70-85 BPM",
      medium: "medium tempo, 90-110 BPM",
      upbeat: "upbeat tempo, 120-140 BPM",
    };
    parts.push(tempoMap[options.tempo] ?? options.tempo);
  }
  
  // Genre
  if (options.genre) {
    parts.push(options.genre);
  }
  
  // Brand context for better results
  if (options.brandContext) {
    parts.push(`for ${options.brandContext}`);
  }
  
  // Add quality cues
  parts.push("high quality, professional production, suitable for video background");
  
  return parts.join(", ");
}

/**
 * Generate music using MusicGen on Replicate.
 * Cost: ~$0.08 per generation
 */
export async function generateMusic(
  options: GenerateMusicOptions
): Promise<GenerateMusicResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not set");
  }
  
  const replicate = new Replicate({ auth: token });
  const prompt = buildMusicPrompt(options);
  const duration = options.durationSeconds ?? 30;
  
  console.log(`Generating music: "${prompt}" (${duration}s)`);
  
  const output = await replicate.run(MUSICGEN_MODEL, {
    input: {
      prompt,
      duration,
      model_version: "stereo-melody-large",
      output_format: "mp3",
      normalization_strategy: "loudness",
    },
  });
  
  // MusicGen returns the audio URL directly
  const audioUrl = typeof output === "string" ? output : (output as { audio?: string }).audio ?? "";
  
  if (!audioUrl) {
    throw new Error("MusicGen did not return audio URL");
  }
  
  return {
    audioUrl,
    durationSeconds: duration,
    cost: MUSICGEN_COST_PER_RUN,
    prompt,
  };
}

/**
 * Generate music and download to a local file.
 */
export async function generateMusicToFile(
  options: GenerateMusicOptions,
  outputPath: string
): Promise<GenerateMusicResult> {
  const result = await generateMusic(options);
  
  // Download the audio
  const response = await fetch(result.audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download music: ${response.status}`);
  }
  
  const audioBuffer = Buffer.from(await response.arrayBuffer());
  
  // Ensure directory exists
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, audioBuffer);
  
  return {
    ...result,
    audioBuffer,
  };
}

/**
 * Get music for a reel - tries library first, falls back to AI generation.
 */
export async function getMusicForReel(
  selection: MusicSelection & { generateIfMissing?: boolean; brandContext?: string }
): Promise<{
  source: "library" | "generated";
  audioUrl?: string;
  filePath?: string;
  cost: number;
}> {
  // First try the pre-licensed library
  const libraryTrack = selectTrack(selection);
  
  if (libraryTrack && trackExists(libraryTrack.track.id)) {
    return {
      source: "library",
      filePath: libraryTrack.filePath,
      cost: 0,
    };
  }
  
  // If generateIfMissing is true, use AI
  if (selection.generateIfMissing !== false) {
    console.log("No library track found, generating with MusicGen...");
    const result = await generateMusic({
      mood: selection.mood,
      tempo: selection.tempo,
      genre: selection.genre,
      durationSeconds: selection.minDurationSeconds,
      brandContext: selection.brandContext,
    });
    
    return {
      source: "generated",
      audioUrl: result.audioUrl,
      cost: result.cost,
    };
  }
  
  return { source: "library", cost: 0 };
}
