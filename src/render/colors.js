export function colorTokenForInterval(interval) {
  return `deg-${((interval % 12) + 12) % 12}`;
}

export function cssColorForInterval(interval) {
  return `var(${colorTokenForInterval(interval)})`;
}

export function buildLegendEntries(intervals, degreeByInterval) {
  return [...intervals].map((interval) => ({
    interval,
    degree: degreeByInterval.get(interval) ?? String(interval),
    colorVar: `var(--deg-${interval})`,
  }));
}
