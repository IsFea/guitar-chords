export const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const DEFAULT_FRET_COUNT = 24;
export const MARKER_FRETS = [3, 5, 7, 10, 12, 15, 17];
export const STORAGE_KEY = "guitar-fretboard-v1-state";
export const STORAGE_VERSION = 1;

export const DEFAULT_STATE = {
  version: STORAGE_VERSION,
  tuning: ["E", "A", "D", "G", "B", "E"],
  fretCount: DEFAULT_FRET_COUNT,
  rootNote: "C",
  harmonyMode: "scale",
  scaleFamily: "diatonic",
  scaleId: "major-ionian",
  chordId: "maj",
  displayMode: "full",
  positionIndex: 1,
  cagedShapeFilter: "",
  chordVoicingVariant: "",
  showNoteLabels: true,
  showOpenStrings: true,
  outsidePositionMode: "dim",
  selectedPresetTuningId: "standard-e",
  customTuningInput: ["E", "A", "D", "G", "B", "E"],
  uiLanguage: "ru",
};

export const UI_NOTE_OPTIONS = NOTE_NAMES_SHARP;
