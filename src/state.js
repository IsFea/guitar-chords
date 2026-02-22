import { DEFAULT_STATE } from "./constants.js";
import { getScalesByFamily } from "./music/scales.js";
import { getTuningPresetById } from "./music/tunings.js";
import { normalizeNoteName } from "./music/notes.js";

export function createStore(initialState) {
  let state = { ...DEFAULT_STATE, ...initialState };
  const listeners = new Set();

  function emit() {
    for (const listener of listeners) listener(state);
  }

  return {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState(patch) {
      state = { ...state, ...patch };
      state = normalizeState(state);
      emit();
    },
    reset() {
      state = normalizeState({ ...DEFAULT_STATE });
      emit();
    },
  };
}

export function normalizeState(state) {
  const next = { ...state };

  next.fretCount = Number.isFinite(+next.fretCount) ? Math.max(12, Math.min(24, +next.fretCount)) : DEFAULT_STATE.fretCount;
  next.positionIndex = Number.isFinite(+next.positionIndex) ? Math.max(1, Math.min(9, +next.positionIndex)) : 1;
  next.rootNote = normalizeNoteName(next.rootNote) || DEFAULT_STATE.rootNote;

  next.tuning = Array.isArray(next.tuning) && next.tuning.length === 6
    ? next.tuning.map((n, i) => normalizeNoteName(n) || DEFAULT_STATE.tuning[i])
    : [...DEFAULT_STATE.tuning];

  next.customTuningInput = Array.isArray(next.customTuningInput) && next.customTuningInput.length === 6
    ? next.customTuningInput.map((n, i) => normalizeNoteName(n) || next.tuning[i] || DEFAULT_STATE.tuning[i])
    : [...next.tuning];

  const familyScales = getScalesByFamily(next.scaleFamily);
  if (!familyScales.some((scale) => scale.id === next.scaleId)) {
    next.scaleId = familyScales[0]?.id || DEFAULT_STATE.scaleId;
  }

  const preset = getTuningPresetById(next.selectedPresetTuningId);
  if (!preset && next.selectedPresetTuningId !== "custom") {
    next.selectedPresetTuningId = DEFAULT_STATE.selectedPresetTuningId;
  }
  if (!["scale", "chord"].includes(next.harmonyMode)) next.harmonyMode = "scale";
  if (!["full", "position"].includes(next.displayMode)) next.displayMode = "full";
  if (!["dim", "hide"].includes(next.outsidePositionMode)) next.outsidePositionMode = "dim";
  if (typeof next.cagedShapeFilter !== "string") next.cagedShapeFilter = "";
  if (typeof next.chordVoicingVariant !== "string") next.chordVoicingVariant = "";

  return next;
}
