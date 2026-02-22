import { NOTE_NAMES_SHARP } from "../constants.js";

const FLAT_TO_SHARP = {
  DB: "C#",
  EB: "D#",
  GB: "F#",
  AB: "G#",
  BB: "A#",
  CB: "B",
  FB: "E",
};

const SHARP_ENHARMONIC = {
  "E#": "F",
  "B#": "C",
};

export function normalizeNoteName(input) {
  if (!input) return null;
  const clean = String(input).trim().toUpperCase().replace(/\s+/g, "");
  if (!clean) return null;
  const formatted = clean.length === 1
    ? clean
    : clean[0] + clean.slice(1).replace("♯", "#").replace("♭", "B");

  if (NOTE_NAMES_SHARP.includes(formatted)) return formatted;
  if (FLAT_TO_SHARP[formatted]) return FLAT_TO_SHARP[formatted];
  if (SHARP_ENHARMONIC[formatted]) return SHARP_ENHARMONIC[formatted];
  return null;
}

export function noteToPitchClass(note) {
  const normalized = normalizeNoteName(note);
  if (!normalized) return null;
  return NOTE_NAMES_SHARP.indexOf(normalized);
}

export function pitchClassToNote(pc) {
  return NOTE_NAMES_SHARP[((pc % 12) + 12) % 12];
}

export function transposePitchClass(pc, semitones) {
  return ((pc + semitones) % 12 + 12) % 12;
}

export function transposeNote(note, semitones) {
  const pc = noteToPitchClass(note);
  if (pc == null) return null;
  return pitchClassToNote(pc + semitones);
}

export function intervalToDegreeLabel(interval) {
  const map = {
    0: "1",
    1: "b2",
    2: "2",
    3: "b3",
    4: "3",
    5: "4",
    6: "b5",
    7: "5",
    8: "b6",
    9: "6",
    10: "b7",
    11: "7",
  };
  return map[((interval % 12) + 12) % 12];
}
