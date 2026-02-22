import { DEFAULT_STATE, STORAGE_KEY, STORAGE_VERSION } from "../constants.js";
import { normalizeNoteName } from "../music/notes.js";

function sanitizeTuningArray(maybeTuning, fallback) {
  if (!Array.isArray(maybeTuning) || maybeTuning.length !== 6) return fallback;
  const normalized = maybeTuning.map(normalizeNoteName);
  if (normalized.some((note) => !note)) return fallback;
  return normalized;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_STATE };

    const merged = { ...DEFAULT_STATE, ...parsed };
    merged.version = STORAGE_VERSION;
    merged.tuning = sanitizeTuningArray(parsed.tuning, DEFAULT_STATE.tuning);
    merged.customTuningInput = sanitizeTuningArray(parsed.customTuningInput, merged.tuning);
    return merged;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      version: STORAGE_VERSION,
    }));
  } catch {
    // Ignore storage failures (private mode / quota)
  }
}
