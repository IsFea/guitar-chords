export const SCALE_DEFS = [
  { id: "major-pentatonic", label: "Мажорная пентатоника", family: "pentatonic", intervals: [0, 2, 4, 7, 9], degreeLabels: ["1", "2", "3", "5", "6"] },
  { id: "minor-pentatonic", label: "Минорная пентатоника", family: "pentatonic", intervals: [0, 3, 5, 7, 10], degreeLabels: ["1", "b3", "4", "5", "b7"] },
  { id: "major-ionian", label: "Ионийский (Major)", family: "diatonic", intervals: [0, 2, 4, 5, 7, 9, 11], degreeLabels: ["1", "2", "3", "4", "5", "6", "7"] },
  { id: "dorian", label: "Дорийский", family: "diatonic", intervals: [0, 2, 3, 5, 7, 9, 10], degreeLabels: ["1", "2", "b3", "4", "5", "6", "b7"] },
  { id: "phrygian", label: "Фригийский", family: "diatonic", intervals: [0, 1, 3, 5, 7, 8, 10], degreeLabels: ["1", "b2", "b3", "4", "5", "b6", "b7"] },
  { id: "lydian", label: "Лидийский", family: "diatonic", intervals: [0, 2, 4, 6, 7, 9, 11], degreeLabels: ["1", "2", "3", "#4", "5", "6", "7"] },
  { id: "mixolydian", label: "Миксолидийский", family: "diatonic", intervals: [0, 2, 4, 5, 7, 9, 10], degreeLabels: ["1", "2", "3", "4", "5", "6", "b7"] },
  { id: "aeolian", label: "Эолийский (Natural Minor)", family: "diatonic", intervals: [0, 2, 3, 5, 7, 8, 10], degreeLabels: ["1", "2", "b3", "4", "5", "b6", "b7"] },
  { id: "locrian", label: "Локрийский", family: "diatonic", intervals: [0, 1, 3, 5, 6, 8, 10], degreeLabels: ["1", "b2", "b3", "4", "b5", "b6", "b7"] },
  { id: "blues-minor", label: "Blues (minor)", family: "blues", intervals: [0, 3, 5, 6, 7, 10], degreeLabels: ["1", "b3", "4", "b5", "5", "b7"] },
  { id: "melodic-minor-1", label: "Melodic Minor (1)", family: "jazz", intervals: [0, 2, 3, 5, 7, 9, 11], degreeLabels: ["1", "2", "b3", "4", "5", "6", "7"] },
  { id: "melodic-minor-2", label: "Dorian b2", family: "jazz", intervals: [0, 1, 3, 5, 7, 9, 10], degreeLabels: ["1", "b2", "b3", "4", "5", "6", "b7"] },
  { id: "melodic-minor-3", label: "Lydian Augmented", family: "jazz", intervals: [0, 2, 4, 6, 8, 9, 11], degreeLabels: ["1", "2", "3", "#4", "#5", "6", "7"] },
  { id: "melodic-minor-4", label: "Lydian Dominant", family: "jazz", intervals: [0, 2, 4, 6, 7, 9, 10], degreeLabels: ["1", "2", "3", "#4", "5", "6", "b7"] },
  { id: "melodic-minor-5", label: "Mixolydian b6", family: "jazz", intervals: [0, 2, 4, 5, 7, 8, 10], degreeLabels: ["1", "2", "3", "4", "5", "b6", "b7"] },
  { id: "melodic-minor-6", label: "Locrian #2", family: "jazz", intervals: [0, 2, 3, 5, 6, 8, 10], degreeLabels: ["1", "2", "b3", "4", "b5", "b6", "b7"] },
  { id: "melodic-minor-7", label: "Altered", family: "jazz", intervals: [0, 1, 3, 4, 6, 8, 10], degreeLabels: ["1", "b2", "#2", "3", "b5", "#5", "b7"] },
  { id: "harmonic-minor-1", label: "Harmonic Minor (1)", family: "jazz", intervals: [0, 2, 3, 5, 7, 8, 11], degreeLabels: ["1", "2", "b3", "4", "5", "b6", "7"] },
  { id: "harmonic-minor-2", label: "Locrian #6", family: "jazz", intervals: [0, 1, 3, 5, 6, 9, 10], degreeLabels: ["1", "b2", "b3", "4", "b5", "6", "b7"] },
  { id: "harmonic-minor-3", label: "Ionian #5", family: "jazz", intervals: [0, 2, 4, 5, 8, 9, 11], degreeLabels: ["1", "2", "3", "4", "#5", "6", "7"] },
  { id: "harmonic-minor-4", label: "Dorian #4", family: "jazz", intervals: [0, 2, 3, 6, 7, 9, 10], degreeLabels: ["1", "2", "b3", "#4", "5", "6", "b7"] },
  { id: "harmonic-minor-5", label: "Phrygian Dominant", family: "jazz", intervals: [0, 1, 4, 5, 7, 8, 10], degreeLabels: ["1", "b2", "3", "4", "5", "b6", "b7"] },
  { id: "harmonic-minor-6", label: "Lydian #2", family: "jazz", intervals: [0, 3, 4, 6, 7, 9, 11], degreeLabels: ["1", "#2", "3", "#4", "5", "6", "7"] },
  { id: "harmonic-minor-7", label: "Super Locrian bb7", family: "jazz", intervals: [0, 1, 3, 4, 6, 8, 9], degreeLabels: ["1", "b2", "b3", "b4?", "b5", "b6", "bb7"] },
];

export const SCALE_FAMILIES = [
  { id: "pentatonic", label: "Пентатоника" },
  { id: "diatonic", label: "Диатоника / лады" },
  { id: "blues", label: "Блюз" },
  { id: "jazz", label: "Джазовые" },
];

export function getScalesByFamily(family) {
  return SCALE_DEFS.filter((scale) => scale.family === family);
}

export function getScaleById(scaleId) {
  return SCALE_DEFS.find((scale) => scale.id === scaleId) || null;
}
