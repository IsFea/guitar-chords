export const CHORD_DEFS = [
  { id: "maj", label: "Maj", intervals: [0, 4, 7], degreeLabels: ["1", "3", "5"] },
  { id: "min", label: "Min", intervals: [0, 3, 7], degreeLabels: ["1", "b3", "5"] },
  { id: "dim", label: "Dim", intervals: [0, 3, 6], degreeLabels: ["1", "b3", "b5"] },
  { id: "aug", label: "Aug", intervals: [0, 4, 8], degreeLabels: ["1", "3", "#5"] },
  { id: "7", label: "7", intervals: [0, 4, 7, 10], degreeLabels: ["1", "3", "5", "b7"] },
  { id: "maj7", label: "Maj7", intervals: [0, 4, 7, 11], degreeLabels: ["1", "3", "5", "7"] },
  { id: "m7", label: "m7", intervals: [0, 3, 7, 10], degreeLabels: ["1", "b3", "5", "b7"] },
  { id: "m7b5", label: "m7b5", intervals: [0, 3, 6, 10], degreeLabels: ["1", "b3", "b5", "b7"] },
  { id: "dim7", label: "dim7", intervals: [0, 3, 6, 9], degreeLabels: ["1", "b3", "b5", "6"] },
  { id: "sus2", label: "sus2", intervals: [0, 2, 7], degreeLabels: ["1", "2", "5"] },
  { id: "sus4", label: "sus4", intervals: [0, 5, 7], degreeLabels: ["1", "4", "5"] },
];

// Shape templates use the lowest sounding root on string 6 or 5.
// Values are semitone offsets from the root fret for each string (6..1), "x" muted.
const SHAPE_TEMPLATES = [
  { id: "e-barre-maj", chordId: "maj", cagedShape: "E", rootString: 6, positionIndex: 1, offsets: [0, 2, 2, 1, 0, 0] },
  { id: "e-barre-min", chordId: "min", cagedShape: "E", rootString: 6, positionIndex: 1, offsets: [0, 2, 2, 0, 0, 0] },
  { id: "e-barre-7", chordId: "7", cagedShape: "E", rootString: 6, positionIndex: 1, offsets: [0, 2, 0, 1, 0, 0] },
  { id: "e-barre-maj7", chordId: "maj7", cagedShape: "E", rootString: 6, positionIndex: 1, offsets: [0, 2, 1, 1, 0, 0] },
  { id: "e-barre-m7", chordId: "m7", cagedShape: "E", rootString: 6, positionIndex: 1, offsets: [0, 2, 0, 0, 0, 0] },
  { id: "e-shape-sus4", chordId: "sus4", cagedShape: "E", rootString: 6, positionIndex: 1, offsets: [0, 2, 2, 2, 0, 0] },
  { id: "e-shape-sus2", chordId: "sus2", cagedShape: "E", rootString: 6, positionIndex: 1, offsets: [0, 2, 4, 4, 2, 2] },
  { id: "a-barre-maj", chordId: "maj", cagedShape: "A", rootString: 5, positionIndex: 2, offsets: ["x", 0, 2, 2, 2, 0] },
  { id: "a-barre-min", chordId: "min", cagedShape: "A", rootString: 5, positionIndex: 2, offsets: ["x", 0, 2, 2, 1, 0] },
  { id: "a-barre-7", chordId: "7", cagedShape: "A", rootString: 5, positionIndex: 2, offsets: ["x", 0, 2, 0, 2, 0] },
  { id: "a-barre-maj7", chordId: "maj7", cagedShape: "A", rootString: 5, positionIndex: 2, offsets: ["x", 0, 2, 1, 2, 0] },
  { id: "a-barre-m7", chordId: "m7", cagedShape: "A", rootString: 5, positionIndex: 2, offsets: ["x", 0, 2, 0, 1, 0] },
  { id: "a-shape-sus4", chordId: "sus4", cagedShape: "A", rootString: 5, positionIndex: 2, offsets: ["x", 0, 2, 2, 3, 0] },
  { id: "d-shape-maj", chordId: "maj", cagedShape: "D", rootString: 4, positionIndex: 3, offsets: ["x", "x", 0, 2, 3, 2] },
  { id: "d-shape-min", chordId: "min", cagedShape: "D", rootString: 4, positionIndex: 3, offsets: ["x", "x", 0, 2, 3, 1] },
  { id: "d-shape-7", chordId: "7", cagedShape: "D", rootString: 4, positionIndex: 3, offsets: ["x", "x", 0, 2, 1, 2] },
  { id: "d-shape-maj7", chordId: "maj7", cagedShape: "D", rootString: 4, positionIndex: 3, offsets: ["x", "x", 0, 2, 2, 2] },
  { id: "g-shape-maj", chordId: "maj", cagedShape: "G", rootString: 6, positionIndex: 4, offsets: [0, 2, 2, 0, 0, 3] },
  { id: "c-shape-maj", chordId: "maj", cagedShape: "C", rootString: 5, positionIndex: 5, offsets: ["x", 0, 2, 2, 1, 0] },
];

export function getChordById(chordId) {
  return CHORD_DEFS.find((chord) => chord.id === chordId) || null;
}

export function getChordShapeTemplates(chordId) {
  return SHAPE_TEMPLATES.filter((template) => template.chordId === chordId);
}
