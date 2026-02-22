export const TUNING_PRESETS = [
  { id: "standard-e", label: "Standard (EADGBE)", category: "standard", notes: ["E", "A", "D", "G", "B", "E"] },
  { id: "drop-d", label: "Drop D (DADGBE)", category: "drop", notes: ["D", "A", "D", "G", "B", "E"] },
  { id: "drop-c", label: "Drop C (CGCFAD)", category: "drop", notes: ["C", "G", "C", "F", "A", "D"] },
  { id: "drop-csharp", label: "Drop C# (C#G#C#F#A#D#)", category: "drop", notes: ["C#", "G#", "C#", "F#", "A#", "D#"] },
  { id: "open-g", label: "Open G (DGDGBD)", category: "open", notes: ["D", "G", "D", "G", "B", "D"] },
  { id: "open-d", label: "Open D (DADF#AD)", category: "open", notes: ["D", "A", "D", "F#", "A", "D"] },
  { id: "open-e", label: "Open E (EBEG#BE)", category: "open", notes: ["E", "B", "E", "G#", "B", "E"] },
];

export function getTuningPresetById(id) {
  return TUNING_PRESETS.find((preset) => preset.id === id) || null;
}
