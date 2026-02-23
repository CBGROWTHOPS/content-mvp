import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}

export const supabase = createClient(url, serviceKey);

export const STORAGE_BUCKET = "content-outputs";

export function getStoragePath(brand: string, format: string, jobId: string, filename: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${brand}/${format}/${date}/${jobId}/${filename}`;
}
