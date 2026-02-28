/**
 * ElevenLabs Text-to-Speech integration for voiceover generation.
 * 
 * Requires ELEVENLABS_API_KEY environment variable.
 * Cost: ~$0.30/1000 characters
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

export interface VoiceSettings {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  voiceSettings?: VoiceSettings;
}

export interface TTSResult {
  audioBuffer: Buffer;
  audioUrl?: string;
  durationSeconds: number;
  characterCount: number;
  cost: number;
}

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - warm, professional female
const DEFAULT_MODEL_ID = "eleven_monolingual_v1";

const COST_PER_CHARACTER = 0.30 / 1000;

let cachedApiKey: string | null = null;

function getApiKey(): string {
  if (cachedApiKey) return cachedApiKey;
  
  // Try environment variable first
  const envKey = process.env.ELEVENLABS_API_KEY;
  if (envKey) {
    cachedApiKey = envKey;
    return envKey;
  }
  
  // Try permissions file
  const permissionsPath = path.join(
    process.env.HOME ?? "",
    "Documents/permissions/internal/elevenlabs_api.txt"
  );
  
  if (fs.existsSync(permissionsPath)) {
    cachedApiKey = fs.readFileSync(permissionsPath, "utf-8").trim();
    return cachedApiKey;
  }
  
  throw new Error(
    "ELEVENLABS_API_KEY not found. Set environment variable or add ~/Documents/permissions/internal/elevenlabs_api.txt"
  );
}

/**
 * Generate voiceover audio from text using ElevenLabs TTS.
 */
export async function generateVoiceover(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  const apiKey = getApiKey();
  const voiceId = options.voiceId ?? DEFAULT_VOICE_ID;
  const modelId = options.modelId ?? DEFAULT_MODEL_ID;
  
  const voiceSettings = {
    stability: options.voiceSettings?.stability ?? 0.5,
    similarity_boost: options.voiceSettings?.similarityBoost ?? 0.75,
    style: options.voiceSettings?.style ?? 0.0,
    use_speaker_boost: options.voiceSettings?.useSpeakerBoost ?? true,
  };
  
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
      }),
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }
  
  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const characterCount = text.length;
  const cost = characterCount * COST_PER_CHARACTER;
  
  // Estimate duration from file size (rough: 16kbps MP3 = ~2KB/sec)
  const estimatedDuration = audioBuffer.length / 2000;
  
  return {
    audioBuffer,
    durationSeconds: estimatedDuration,
    characterCount,
    cost,
  };
}

/**
 * Generate voiceover and save to file.
 */
export async function generateVoiceoverToFile(
  text: string,
  outputPath: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  const result = await generateVoiceover(text, options);
  
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, result.audioBuffer);
  
  return {
    ...result,
    audioUrl: outputPath,
  };
}

/**
 * Get cache key for a voiceover request (for caching generated audio).
 */
export function getVoiceoverCacheKey(
  text: string,
  options: TTSOptions = {}
): string {
  const hashInput = JSON.stringify({
    text,
    voiceId: options.voiceId ?? DEFAULT_VOICE_ID,
    modelId: options.modelId ?? DEFAULT_MODEL_ID,
    voiceSettings: options.voiceSettings,
  });
  
  return crypto.createHash("sha256").update(hashInput).digest("hex").slice(0, 16);
}

/**
 * List available voices from ElevenLabs.
 */
export async function listVoices(): Promise<Array<{
  voice_id: string;
  name: string;
  category: string;
}>> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
    headers: {
      "xi-api-key": apiKey,
    },
  });
  
  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }
  
  const data = await response.json() as { voices: Array<{
    voice_id: string;
    name: string;
    category: string;
  }> };
  
  return data.voices;
}

/**
 * Predefined voice options for common use cases.
 */
export const VOICE_PRESETS = {
  professional_female: "21m00Tcm4TlvDq8ikWAM", // Rachel
  professional_male: "ErXwobaYiN019PkySvjV", // Antoni
  warm_female: "EXAVITQu4vr4xnSDxMaL", // Bella
  warm_male: "VR6AewLTigWG4xSOukaG", // Arnold
  narrator_male: "TxGEqnHWrfWFTfGW9XjX", // Josh
  narrator_female: "MF3mGyEYCl7XYWbV9V6O", // Emily
} as const;

export type VoicePreset = keyof typeof VOICE_PRESETS;
