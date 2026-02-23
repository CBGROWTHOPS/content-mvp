"use client";

import { useCallback, useEffect, useState } from "react";
import type { GenerateResponse } from "@/types/generate";

const STORAGE_KEY_ID = "content-last-generation-id";
const STORAGE_KEY_RESPONSE = "content-last-generation-response";

export function useLastGeneration() {
  const [lastId, setLastId] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<GenerateResponse | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const id = localStorage.getItem(STORAGE_KEY_ID);
      const raw = localStorage.getItem(STORAGE_KEY_RESPONSE);
      if (id) setLastId(id);
      if (raw) {
        const parsed = JSON.parse(raw) as GenerateResponse;
        setLastResponse(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const save = useCallback((response: GenerateResponse) => {
    if (typeof window === "undefined" || !response.generationId) return;
    localStorage.setItem(STORAGE_KEY_ID, response.generationId);
    localStorage.setItem(STORAGE_KEY_RESPONSE, JSON.stringify(response));
    setLastId(response.generationId);
    setLastResponse(response);
  }, []);

  const load = useCallback((): GenerateResponse | null => {
    return lastResponse;
  }, [lastResponse]);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_RESPONSE);
    setLastId(null);
    setLastResponse(null);
  }, []);

  return { lastId, lastResponse, save, load, clear };
}
