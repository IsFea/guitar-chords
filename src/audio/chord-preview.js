import { noteToPitchClass } from "../music/notes.js";

const STANDARD_OPEN_MIDIS_6_TO_1 = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
const MAX_CHORD_VOICES = 6;
const MAX_SCALE_NOTES = 14;

let audioCtx = null;
let masterGain = null;
let activeVoices = [];

function getAudioCtor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

export function isAudioPreviewSupported() {
  return Boolean(getAudioCtor());
}

function getAudioContext() {
  const AudioCtor = getAudioCtor();
  if (!AudioCtor) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.45;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

export function stopChordPreview() {
  for (const voice of activeVoices) {
    try {
      voice.osc.stop();
    } catch {
      // voice may already be stopped
    }
    try {
      voice.osc.disconnect();
      voice.gain.disconnect();
    } catch {
      // noop
    }
  }
  activeVoices = [];
}

export const stopAudioPreview = stopChordPreview;

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function normalizeOpenMidis(openMidis) {
  const result = [];
  for (let i = 0; i < openMidis.length; i += 1) {
    let midi = openMidis[i];
    if (i > 0) {
      while (midi <= result[i - 1]) midi += 12;
      while (midi - result[i - 1] > 12) midi -= 12;
      while (midi <= result[i - 1]) midi += 12;
    }
    result.push(midi);
  }
  return result;
}

export function tuningToOpenMidis(tuning6to1) {
  if (!Array.isArray(tuning6to1) || tuning6to1.length !== 6) {
    return [...STANDARD_OPEN_MIDIS_6_TO_1];
  }
  const openMidis = tuning6to1.map((note, idx) => {
    const targetPc = noteToPitchClass(note);
    const anchorMidi = STANDARD_OPEN_MIDIS_6_TO_1[idx];
    if (targetPc == null) return anchorMidi;
    const anchorPc = ((anchorMidi % 12) + 12) % 12;
    let delta = targetPc - anchorPc;
    while (delta > 6) delta -= 12;
    while (delta < -6) delta += 12;
    return anchorMidi + delta;
  });
  return normalizeOpenMidis(openMidis);
}

function sortByStringBassToTreble(notes) {
  return [...notes].sort((a, b) => b.stringNumber - a.stringNumber || a.midi - b.midi);
}

export function buildAudioNotesFromVoicing(chordVoicing, tuning6to1) {
  if (!chordVoicing?.strings?.length) return [];
  const openMidis = tuningToOpenMidis(tuning6to1);
  const notes = chordVoicing.strings
    .filter((s) => s.fret !== "x")
    .map((s) => {
      const stringIndex = 6 - s.string;
      const openMidi = openMidis[stringIndex];
      const midi = openMidi + s.fret;
      return {
        stringNumber: s.string,
        fret: s.fret,
        midi,
        frequency: midiToFrequency(midi),
      };
    });
  return sortByStringBassToTreble(notes).slice(0, MAX_CHORD_VOICES);
}

export function buildAudioNotesFromFallback(fretNotes, tuning6to1, { inWindowOnly = false } = {}) {
  const openMidis = tuningToOpenMidis(tuning6to1);
  const candidates = fretNotes
    .filter((n) => n.inSelection)
    .filter((n) => !inWindowOnly || n._audioInWindow !== false)
    .map((n) => {
      const stringIndex = 6 - n.string;
      const midi = openMidis[stringIndex] + n.fret;
      return {
        stringNumber: n.string,
        fret: n.fret,
        midi,
        frequency: midiToFrequency(midi),
      };
    })
    .sort((a, b) => a.midi - b.midi || b.stringNumber - a.stringNumber);

  const deduped = [];
  const seenMidi = new Set();
  for (const note of candidates) {
    if (seenMidi.has(note.midi)) continue;
    deduped.push(note);
    seenMidi.add(note.midi);
    if (deduped.length >= MAX_CHORD_VOICES) break;
  }
  return deduped;
}

export function buildAudioScaleNotes(fretNotes, tuning6to1, { inWindowOnly = false } = {}) {
  const openMidis = tuningToOpenMidis(tuning6to1);
  const candidates = fretNotes
    .filter((n) => n.inSelection)
    .filter((n) => !inWindowOnly || n._audioInWindow !== false)
    .map((n) => {
      const stringIndex = 6 - n.string;
      const midi = openMidis[stringIndex] + n.fret;
      return {
        stringNumber: n.string,
        fret: n.fret,
        midi,
        frequency: midiToFrequency(midi),
      };
    })
    .sort((a, b) => a.midi - b.midi || b.stringNumber - a.stringNumber);

  const deduped = [];
  const seenMidi = new Set();
  for (const note of candidates) {
    if (seenMidi.has(note.midi)) continue;
    deduped.push(note);
    seenMidi.add(note.midi);
    if (deduped.length >= MAX_SCALE_NOTES) break;
  }
  return deduped;
}

function nearestMidiForPitchClassInRange(pc, { min = 48, max = 60, target = 55 } = {}) {
  let best = null;
  for (let midi = min; midi <= max; midi += 1) {
    if (((midi % 12) + 12) % 12 !== pc) continue;
    const score = Math.abs(midi - target);
    if (!best || score < best.score) best = { midi, score };
  }
  return best?.midi ?? target;
}

export function buildAudioScaleNotesFromIntervals(rootNote, intervals) {
  const rootPc = noteToPitchClass(rootNote);
  if (rootPc == null || !Array.isArray(intervals) || intervals.length === 0) return [];

  const baseMidi = nearestMidiForPitchClassInRange(rootPc, { min: 48, max: 60, target: 55 });
  const uniqueIntervals = [...new Set(intervals.map((n) => ((n % 12) + 12) % 12))].sort((a, b) => a - b);
  const ascending = uniqueIntervals.includes(0)
    ? uniqueIntervals
    : [0, ...uniqueIntervals];

  const sequenceIntervals = [...ascending, 12];
  return sequenceIntervals.map((interval) => {
    const midi = baseMidi + interval;
    return {
      stringNumber: 0,
      fret: null,
      midi,
      frequency: midiToFrequency(midi),
    };
  });
}

function scheduleVoice(ctx, note, startAt, durationSec, voiceGain) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(note.frequency, startAt);

  const attack = 0.006;
  const decay = 0.08;
  const release = 0.34;
  const peak = voiceGain;
  const sustain = voiceGain * 0.72;
  const noteOff = startAt + Math.max(durationSec - release, attack + decay + 0.02);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), startAt + attack + decay);
  gain.gain.setValueAtTime(Math.max(sustain, 0.0001), noteOff);
  gain.gain.exponentialRampToValueAtTime(0.0001, noteOff + release);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(startAt);
  osc.stop(noteOff + release + 0.02);
  activeVoices.push({ osc, gain });
}

export async function playChordPreview(notes, options = {}) {
  if (!notes?.length) return { ok: false, reason: "no-notes" };
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return { ok: false, reason: "unsupported" };

  stopChordPreview();
  if (ctx.state === "suspended") {
    await ctx.resume().catch(() => {});
  }

  const mode = options.mode === "arpeggio" ? "arpeggio" : "strum";
  const ordered = mode === "arpeggio"
    ? [...notes].sort((a, b) => b.stringNumber - a.stringNumber || a.midi - b.midi)
    : [...notes].sort((a, b) => b.stringNumber - a.stringNumber || a.midi - b.midi);

  const stepSec = mode === "arpeggio" ? 0.14 : 0.02;
  const durationSec = mode === "arpeggio" ? 1.2 : 0.95;
  const voiceGain = Math.min(0.12, Math.max(0.045, 0.36 / ordered.length));
  const startBase = ctx.currentTime + 0.015;

  ordered.forEach((note, idx) => {
    scheduleVoice(ctx, note, startBase + (idx * stepSec), durationSec, voiceGain);
  });

  return { ok: true, mode, voices: ordered.length };
}

export async function playScalePreview(notes, options = {}) {
  if (!notes?.length) return { ok: false, reason: "no-notes" };
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return { ok: false, reason: "unsupported" };

  stopChordPreview();
  if (ctx.state === "suspended") {
    await ctx.resume().catch(() => {});
  }

  const ascend = [...notes].sort((a, b) => a.midi - b.midi || b.stringNumber - a.stringNumber);
  const sequence = options.bounce && ascend.length > 1
    ? [...ascend, ...ascend.slice(0, -1).reverse().slice(1)]
    : ascend;

  const stepSec = 0.16;
  const durationSec = 0.65;
  const voiceGain = Math.min(0.09, Math.max(0.03, 0.28 / Math.min(sequence.length, 8)));
  const startBase = ctx.currentTime + 0.015;

  sequence.forEach((note, idx) => {
    scheduleVoice(ctx, note, startBase + (idx * stepSec), durationSec, voiceGain);
  });

  return { ok: true, mode: "scale", notes: sequence.length };
}
