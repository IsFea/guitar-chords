import { intervalToDegreeLabel, noteToPitchClass, pitchClassToNote } from "./notes.js";

export function computeFretboardNotes({ tuning, fretCount }) {
  const tuningPcs = tuning.map(noteToPitchClass);
  return tuningPcs.map((openPc, index) => {
    const stringNumber = 6 - index;
    return Array.from({ length: fretCount + 1 }, (_, fret) => {
      const pc = (openPc + fret) % 12;
      return {
        string: stringNumber,
        stringIndex: index,
        fret,
        pitchClass: pc,
        note: pitchClassToNote(pc),
      };
    });
  });
}

export function buildScaleSelection(rootPc, scaleDef) {
  const intervalSet = new Set(scaleDef.intervals);
  const degreeByInterval = new Map();
  scaleDef.intervals.forEach((interval, idx) => {
    degreeByInterval.set(interval, scaleDef.degreeLabels[idx] || intervalToDegreeLabel(interval));
  });
  return { rootPc, intervals: scaleDef.intervals, intervalSet, degreeByInterval, label: scaleDef.label };
}

export function buildChordSelection(rootPc, chordDef) {
  const intervalSet = new Set(chordDef.intervals);
  const degreeByInterval = new Map();
  chordDef.intervals.forEach((interval, idx) => {
    degreeByInterval.set(interval, chordDef.degreeLabels[idx] || intervalToDegreeLabel(interval));
  });
  return { rootPc, intervals: chordDef.intervals, intervalSet, degreeByInterval, label: chordDef.label };
}

export function annotateFretboardForSelection(fretboard, selection, options = {}) {
  const { hideOpenStrings = false } = options;
  const rows = [];
  for (const stringNotes of fretboard) {
    for (const note of stringNotes) {
      if (hideOpenStrings && note.fret === 0) continue;
      const interval = (note.pitchClass - selection.rootPc + 12) % 12;
      const inSelection = selection.intervalSet.has(interval);
      rows.push({
        ...note,
        interval,
        inSelection,
        degree: inSelection ? (selection.degreeByInterval.get(interval) || intervalToDegreeLabel(interval)) : null,
      });
    }
  }
  return rows;
}
