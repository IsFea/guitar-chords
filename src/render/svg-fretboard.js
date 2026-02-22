import { MARKER_FRETS } from "../constants.js";
import { cssColorForInterval } from "./colors.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgEl(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    el.setAttribute(key, String(value));
  }
  return el;
}

export function buildFretGeometry({ fretCount, width = 1500, height = 290, margin = 42, scaleLength = 1320 }) {
  const topY = 56;
  const bottomY = height - 34;
  const stringYs = Array.from({ length: 6 }, (_, i) => topY + ((bottomY - topY) * i) / 5);
  const nutX = margin + 24;

  const fretXs = [nutX];
  for (let fret = 1; fret <= fretCount; fret += 1) {
    const distanceFromNut = scaleLength - (scaleLength / Math.pow(2, fret / 12));
    fretXs.push(nutX + distanceFromNut);
  }

  const boardRightX = fretXs[fretCount] + 30;
  const fullWidth = Math.max(width, boardRightX + margin);
  return {
    width: fullWidth,
    height,
    nutX,
    topY,
    bottomY,
    stringYs,
    fretXs,
    boardLeftX: nutX,
    boardRightX,
    markerFrets: MARKER_FRETS.filter((f) => f <= fretCount),
  };
}

function centerXForFret(geometry, fret) {
  if (fret === 0) {
    return (geometry.nutX - 26 + geometry.nutX) / 2;
  }
  // Fret N sits between the previous divider (nut/fret N-1) and fret wire N.
  const left = geometry.fretXs[fret - 1];
  const right = geometry.fretXs[fret] ?? (geometry.fretXs[fret - 1] + 28);
  return (left + right) / 2;
}

function isWithinWindow(fret, window) {
  if (!window) return true;
  return fret >= window.startFret && fret <= window.endFret;
}

export function renderFretboard(svg, model) {
  const { geometry, notes, options = {}, positionWindow = null, chordVoicing = null } = model;
  svg.setAttribute("viewBox", `0 0 ${geometry.width} ${geometry.height}`);
  svg.textContent = "";

  const root = createSvgEl("g");
  svg.append(root);

  root.append(createSvgEl("rect", {
    x: geometry.boardLeftX - 26,
    y: geometry.topY - 20,
    width: geometry.boardRightX - (geometry.boardLeftX - 26),
    height: (geometry.bottomY - geometry.topY) + 40,
    rx: 12,
    fill: "var(--fretboard)",
    stroke: "rgba(70, 45, 18, 0.25)",
  }));

  root.append(createSvgEl("rect", {
    x: geometry.nutX - 2.6,
    y: geometry.topY - 10,
    width: 5.2,
    height: (geometry.bottomY - geometry.topY) + 20,
    fill: "var(--nut)",
  }));

  for (let i = 1; i < geometry.fretXs.length; i += 1) {
    root.append(createSvgEl("line", {
      x1: geometry.fretXs[i],
      x2: geometry.fretXs[i],
      y1: geometry.topY - 12,
      y2: geometry.bottomY + 12,
      stroke: "var(--fret)",
      "stroke-width": i === 12 || i === 24 ? 2.2 : 1.4,
      opacity: 0.95,
    }));
  }

  const yForStringIndex = (stringIndex) => geometry.stringYs[5 - stringIndex];
  const yForStringNumber = (stringNumber) => geometry.stringYs[stringNumber - 1];

  geometry.stringYs.forEach((y, idx) => {
    root.append(createSvgEl("line", {
      x1: geometry.nutX - 24,
      x2: geometry.boardRightX,
      y1: y,
      y2: y,
      stroke: "var(--string)",
      // Thicker bass strings at the bottom (string 6).
      "stroke-width": 1.1 + idx * 0.45,
      "stroke-linecap": "round",
    }));
  });

  for (let fret = 0; fret <= model.fretCount; fret += 1) {
    const x = fret === 0 ? geometry.nutX - 13 : centerXForFret(geometry, fret);
    const fretLabel = createSvgEl("text", {
      x,
      y: geometry.bottomY + 28,
      "text-anchor": "middle",
      "font-size": "12",
      fill: "var(--muted)",
    });
    fretLabel.textContent = String(fret);
    root.append(fretLabel);
  }

  geometry.markerFrets.forEach((fret) => {
    const x = centerXForFret(geometry, fret);
    const markerY = geometry.topY - 28;
    if (fret === 12 || fret === 24) {
      root.append(createSvgEl("circle", { cx: x - 7, cy: markerY, r: 3.4, fill: "var(--marker)" }));
      root.append(createSvgEl("circle", { cx: x + 7, cy: markerY, r: 3.4, fill: "var(--marker)" }));
    } else {
      root.append(createSvgEl("circle", { cx: x, cy: markerY, r: 3.4, fill: "var(--marker)" }));
    }
  });

  if (positionWindow) {
    const startX = positionWindow.startFret === 0 ? geometry.nutX - 26 : geometry.fretXs[positionWindow.startFret];
    const endX = (geometry.fretXs[positionWindow.endFret + 1] ?? (geometry.fretXs[positionWindow.endFret] + 28));
    root.append(createSvgEl("rect", {
      x: startX,
      y: geometry.topY - 18,
      width: Math.max(0, endX - startX),
      height: (geometry.bottomY - geometry.topY) + 36,
      fill: "rgba(255,255,255,0.16)",
      stroke: "rgba(255,255,255,0.5)",
      "stroke-dasharray": "5 4",
      rx: 8,
    }));
  }

  const voicingMuteStrings = new Set();
  if (chordVoicing?.strings) {
    chordVoicing.strings.forEach((s) => {
      if (s.fret === "x") voicingMuteStrings.add(s.string);
    });
  }

  const notesLayer = createSvgEl("g");
  root.append(notesLayer);
  for (const note of notes) {
    const inWindow = isWithinWindow(note.fret, positionWindow);
    const isVoicingTone = chordVoicing ? note.isVoicingTone : true;
    if (!note.show) continue;
    const baseOpacity = note.inSelection ? 1 : 0.1;
    const opacity = note.inSelection && inWindow && isVoicingTone
      ? 1
      : (options.outsidePositionMode === "hide" && !inWindow ? 0 : (note.inSelection ? 0.22 : baseOpacity));

    if (opacity <= 0) continue;

    const cx = centerXForFret(geometry, note.fret);
    const cy = yForStringIndex(note.stringIndex);
    const radius = note.interval === 0 ? 13 : 10.2;

    notesLayer.append(createSvgEl("circle", {
      cx,
      cy,
      r: radius,
      fill: note.inSelection ? cssColorForInterval(note.interval) : "rgba(255,255,255,0.7)",
      stroke: "var(--dot-stroke)",
      "stroke-width": note.interval === 0 ? 2 : 1.2,
      opacity,
    }));

    if (note.showLabel) {
      const label = options.labelMode === "degree" ? (note.degree ?? "") : note.note;
      const noteLabel = createSvgEl("text", {
        x: cx,
        y: cy + 4,
        "text-anchor": "middle",
        "font-size": note.interval === 0 ? "11" : "10",
        "font-weight": note.interval === 0 ? "700" : "600",
        fill: "rgba(255,255,255,0.98)",
        stroke: "rgba(24,18,12,0.55)",
        "stroke-width": "0.7",
        "paint-order": "stroke",
        opacity,
      });
      noteLabel.textContent = label;
      notesLayer.append(noteLabel);
    }
  }

  if (voicingMuteStrings.size > 0) {
    for (const stringNumber of voicingMuteStrings) {
      const y = yForStringNumber(stringNumber);
      const muteLabel = createSvgEl("text", {
        x: geometry.nutX - 34,
        y: y + 4,
        "text-anchor": "middle",
        "font-size": "12",
        "font-weight": "700",
        fill: "var(--muted)",
      });
      muteLabel.textContent = "x";
      root.append(muteLabel);
    }
  }
}
