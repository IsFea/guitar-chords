import { buildAudioScaleNotesFromIntervals } from "./src/audio/chord-preview.js";
import { getScaleById } from "./src/music/scales.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function midsFor(scaleId) {
  const scale = getScaleById(scaleId);
  const notes = buildAudioScaleNotesFromIntervals("C", scale?.intervals || []);
  return notes.map((n) => n.midi);
}

try {
  const ionian = midsFor("major-ionian");
  const dorian = midsFor("dorian");
  const phrygian = midsFor("phrygian");

  assert(ionian.length >= 6, "Ionian sequence too short");
  assert(dorian.length >= 6, "Dorian sequence too short");
  assert(phrygian.length >= 6, "Phrygian sequence too short");

  assert(ionian.join(",") !== dorian.join(","), "Ionian and Dorian preview sequences are identical");
  assert(dorian.join(",") !== phrygian.join(","), "Dorian and Phrygian preview sequences are identical");
  assert(ionian[ionian.length - 1] - ionian[0] === 12, "Ionian should end on octave root");
  assert(dorian[dorian.length - 1] - dorian[0] === 12, "Dorian should end on octave root");

  console.log("AUDIO_SCALE_CHECK_OK");
  console.log(JSON.stringify({ ionian, dorian, phrygian }, null, 2));
} catch (error) {
  console.error("AUDIO_SCALE_CHECK_FAIL");
  console.error(String(error));
  process.exitCode = 1;
}

