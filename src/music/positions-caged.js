// Simplified CAGED-like position windows for v1.
// We use 5 windows across the neck and attach a shape label for UX.
const SHAPES = ["C", "A", "G", "E", "D"];

export function getPositionWindows(fretCount) {
  const windows = [];
  const span = 5;
  let start = 0;
  let idx = 0;
  while (start <= fretCount) {
    const end = Math.min(fretCount, start + span - 1);
    windows.push({
      positionIndex: idx + 1,
      shape: SHAPES[idx % SHAPES.length],
      startFret: start,
      endFret: end,
    });
    if (end === fretCount) break;
    start += 4;
    idx += 1;
  }
  return windows;
}

export function getPositionWindowByIndex(fretCount, positionIndex) {
  const windows = getPositionWindows(fretCount);
  return windows.find((w) => w.positionIndex === positionIndex) || windows[0] || null;
}
