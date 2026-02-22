import { DEFAULT_STATE } from "./constants.js";
import { buildChordSelection, buildScaleSelection, annotateFretboardForSelection, computeFretboardNotes } from "./music/fretboard.js";
import { getPositionWindowByIndex, getPositionWindows } from "./music/positions-caged.js";
import { getScaleById } from "./music/scales.js";
import { getChordById, getChordShapeTemplates } from "./music/chords.js";
import { noteToPitchClass, normalizeNoteName } from "./music/notes.js";
import { getTuningPresetById } from "./music/tunings.js";
import {
  buildAudioNotesFromFallback,
  buildAudioNotesFromVoicing,
  buildAudioScaleNotes,
  isAudioPreviewSupported,
  playChordPreview,
  playScalePreview,
  stopAudioPreview,
} from "./audio/chord-preview.js";
import { buildFretGeometry, renderFretboard } from "./render/svg-fretboard.js";
import { buildLegendEntries } from "./render/colors.js";
import { loadState, saveState } from "./storage/local-storage.js";
import { createStore } from "./state.js";
import { renderControls, renderDetails, renderLegend } from "./ui/controls.js";

const dom = {
  controlsForm: document.getElementById("controls-form"),
  fretboardSvg: document.getElementById("fretboard-svg"),
  selectionSummary: document.getElementById("selection-summary"),
  legendInline: document.getElementById("legend-inline"),
  detailsPanel: document.getElementById("details-panel"),
  emptyState: document.getElementById("empty-state"),
};

const store = createStore(loadState());

function applyPresetToState(state) {
  const preset = getTuningPresetById(state.selectedPresetTuningId);
  if (!preset) return state;
  return {
    ...state,
    tuning: [...preset.notes],
    customTuningInput: [...preset.notes],
  };
}

function resolveActivePositionWindow(positionWindows, state) {
  if (state.displayMode !== "position") return null;
  const sameIndexAndShape = positionWindows.find((w) =>
    w.positionIndex === state.positionIndex && (!state.cagedShapeFilter || w.shape === state.cagedShapeFilter)
  );
  if (sameIndexAndShape) return sameIndexAndShape;

  if (state.cagedShapeFilter) {
    return positionWindows.find((w) => w.shape === state.cagedShapeFilter) || null;
  }

  return getPositionWindowByIndex(state.fretCount, state.positionIndex);
}

function mapVoicingTemplatesToRoot({ chordId, rootPc, tuning, fretCount, positionWindows, shapeFilter }) {
  const templates = getChordShapeTemplates(chordId);
  const tuningPcs = tuning.map(noteToPitchClass);
  const voicings = [];

  for (const template of templates) {
    if (shapeFilter && template.cagedShape !== shapeFilter) continue;
    const rootStringIndex = 6 - template.rootString;
    const openPc = tuningPcs[rootStringIndex];
    if (openPc == null) continue;

    for (let rootFret = 0; rootFret <= fretCount; rootFret += 1) {
      const pcAtFret = (openPc + rootFret) % 12;
      if (pcAtFret !== rootPc) continue;

      const stringEntries = [];
      let minFret = Infinity;
      let maxFret = -Infinity;
      let valid = true;

      for (let i = 0; i < 6; i += 1) {
        const offset = template.offsets[i];
        const stringNumber = 6 - i;
        if (offset === "x") {
          stringEntries.push({ string: stringNumber, fret: "x" });
          continue;
        }
        const fret = rootFret + offset;
        if (fret < 0 || fret > fretCount) {
          valid = false;
          break;
        }
        minFret = Math.min(minFret, fret);
        maxFret = Math.max(maxFret, fret);
        stringEntries.push({ string: stringNumber, fret });
      }
      if (!valid) continue;

      const positionWindow = positionWindows.find((w) => rootFret >= w.startFret && rootFret <= w.endFret);
      const inferredPositionIndex = positionWindow?.positionIndex ?? template.positionIndex;
      if (positionWindow && (maxFret < positionWindow.startFret || minFret > positionWindow.endFret + 2)) {
        // Keep voicing but still assign position by root anchor. No skip to avoid sparse results.
      }

      voicings.push({
        id: `${template.id}-${rootFret}`,
        label: `${template.cagedShape}-shape @ ${rootFret} лад`,
        chordId,
        cagedShape: template.cagedShape,
        positionIndex: inferredPositionIndex,
        rootFret,
        fretSpan: [Number.isFinite(minFret) ? minFret : rootFret, Number.isFinite(maxFret) ? maxFret : rootFret],
        strings: stringEntries,
      });
    }
  }

  return voicings.sort((a, b) =>
    a.positionIndex - b.positionIndex ||
    a.rootFret - b.rootFret ||
    a.cagedShape.localeCompare(b.cagedShape)
  );
}

function buildDerived(state) {
  const fretCount = state.fretCount;
  const rootPc = noteToPitchClass(state.rootNote);
  const fretboard = computeFretboardNotes({ tuning: state.tuning, fretCount });
  const positionWindows = getPositionWindows(fretCount);

  const activePositionWindow = resolveActivePositionWindow(positionWindows, state);

  let selection;
  let selectionDef;
  let chordVoicings = [];
  let selectedChordVoicing = null;

  if (state.harmonyMode === "scale") {
    const scaleDef = getScaleById(state.scaleId) || getScaleById(DEFAULT_STATE.scaleId);
    selectionDef = {
      label: scaleDef?.label || "Scale",
      intervals: scaleDef?.intervals || [],
      degreeLabels: scaleDef?.degreeLabels || [],
    };
    selection = buildScaleSelection(rootPc, scaleDef);
  } else {
    const chordDef = getChordById(state.chordId) || getChordById(DEFAULT_STATE.chordId);
    selectionDef = {
      label: chordDef?.label || "Chord",
      intervals: chordDef?.intervals || [],
      degreeLabels: chordDef?.degreeLabels || [],
    };
    selection = buildChordSelection(rootPc, chordDef);
    chordVoicings = mapVoicingTemplatesToRoot({
      chordId: state.chordId,
      rootPc,
      tuning: state.tuning,
      fretCount,
      positionWindows,
      shapeFilter: state.cagedShapeFilter || "",
    });
    if (state.displayMode === "position" && activePositionWindow) {
      chordVoicings = chordVoicings.filter((v) => v.positionIndex === activePositionWindow.positionIndex);
    }
    selectedChordVoicing = chordVoicings.find((v) => v.id === state.chordVoicingVariant) || chordVoicings[0] || null;
  }

  const annotated = annotateFretboardForSelection(fretboard, selection, {
    hideOpenStrings: !state.showOpenStrings,
  });

  let voicingToneSet = null;
  if (selectedChordVoicing) {
    voicingToneSet = new Set(
      selectedChordVoicing.strings
        .filter((s) => s.fret !== "x")
        .map((s) => `${s.string}:${s.fret}`)
    );
  }

  const renderNotes = annotated.map((note) => ({
    ...note,
    show: note.inSelection,
    showLabel: state.showNoteLabels && note.inSelection,
    isVoicingTone: voicingToneSet ? voicingToneSet.has(`${note.string}:${note.fret}`) : true,
  }));

  const legendEntries = buildLegendEntries(selection.intervals, selection.degreeByInterval);

  let chordAudioNotes = [];
  let scaleAudioNotes = [];
  const withWindowFlag = annotated.map((note) => ({
    ...note,
    _audioInWindow: activePositionWindow ? (note.fret >= activePositionWindow.startFret && note.fret <= activePositionWindow.endFret) : true,
  }));

  if (state.harmonyMode === "scale") {
    scaleAudioNotes = buildAudioScaleNotes(withWindowFlag, state.tuning, {
      inWindowOnly: Boolean(activePositionWindow),
    });
    if (!scaleAudioNotes.length) {
      scaleAudioNotes = buildAudioScaleNotes(withWindowFlag, state.tuning, { inWindowOnly: false });
    }
  }

  if (state.harmonyMode === "chord") {
    if (selectedChordVoicing) {
      chordAudioNotes = buildAudioNotesFromVoicing(selectedChordVoicing, state.tuning);
    } else {
      chordAudioNotes = buildAudioNotesFromFallback(withWindowFlag, state.tuning, {
        inWindowOnly: Boolean(activePositionWindow),
      });
      if (!chordAudioNotes.length) {
        chordAudioNotes = buildAudioNotesFromFallback(withWindowFlag, state.tuning, { inWindowOnly: false });
      }
    }
  }

  return {
    fretCount,
    rootPc,
    fretboard,
    selection,
    selectionDef,
    positionWindows,
    activePositionWindow,
    renderNotes,
    chordVoicings,
    selectedChordVoicing,
    legendEntries,
    chordAudioNotes,
    scaleAudioNotes,
    canPlayChordPreview: state.harmonyMode === "chord" && chordAudioNotes.length > 0 && isAudioPreviewSupported(),
    canPlayScalePreview: state.harmonyMode === "scale" && scaleAudioNotes.length > 0 && isAudioPreviewSupported(),
    audioPreviewSupported: isAudioPreviewSupported(),
  };
}

function getSummaryText(state, derived) {
  const modeLabel = state.harmonyMode === "scale" ? "Гармония" : "Аккорд";
  const posText = state.displayMode === "position" && derived.activePositionWindow
    ? `Позиция ${derived.activePositionWindow.positionIndex} (${derived.activePositionWindow.shape}, лады ${derived.activePositionWindow.startFret}-${derived.activePositionWindow.endFret})`
    : "Весь гриф";
  const itemLabel = derived.selectionDef.label;
  return `${modeLabel}: ${state.rootNote} ${itemLabel} • ${posText} • Строй: ${state.tuning.join(" ")}`;
}

function updateEmptyState(state, derived) {
  if (state.harmonyMode !== "chord") {
    dom.emptyState.hidden = true;
    dom.emptyState.textContent = "";
    return;
  }
  if (derived.selectedChordVoicing) {
    dom.emptyState.hidden = true;
    dom.emptyState.textContent = "";
    return;
  }
  dom.emptyState.hidden = false;
  dom.emptyState.textContent = "Для выбранного аккорда/позиции пока нет готовой аппликатуры. Попробуйте другую позицию или тип аккорда.";
}

function renderApp() {
  const state = store.getState();
  const derived = buildDerived(state);

  const maxPosition = Math.max(derived.positionWindows.length, 1);
  if (state.positionIndex > maxPosition) {
    store.setState({ positionIndex: maxPosition });
    return;
  }

  if (
    state.displayMode === "position" &&
    derived.activePositionWindow &&
    state.positionIndex !== derived.activePositionWindow.positionIndex
  ) {
    store.setState({ positionIndex: derived.activePositionWindow.positionIndex });
    return;
  }

  const nextVoicingId = derived.selectedChordVoicing?.id ?? "";
  if (state.harmonyMode === "chord" && state.chordVoicingVariant !== nextVoicingId) {
    store.setState({ chordVoicingVariant: nextVoicingId });
    return;
  }

  renderControls(dom.controlsForm, state, {
    positionWindows: derived.positionWindows,
    chordVoicings: derived.chordVoicings,
    canPlayChordPreview: derived.canPlayChordPreview,
    canPlayScalePreview: derived.canPlayScalePreview,
    audioPreviewSupported: derived.audioPreviewSupported,
  }, handleControlAction);

  dom.selectionSummary.textContent = getSummaryText(state, derived);
  renderLegend(dom.legendInline, derived.legendEntries);
  renderDetails(dom.detailsPanel, {
    state,
    selectionDef: derived.selectionDef,
    positionWindow: derived.activePositionWindow,
    chordVoicing: derived.selectedChordVoicing,
    positionWindows: derived.positionWindows,
  });

  const geometry = buildFretGeometry({ fretCount: state.fretCount });
  renderFretboard(dom.fretboardSvg, {
    fretCount: state.fretCount,
    geometry,
    notes: derived.renderNotes,
    positionWindow: state.displayMode === "position" ? derived.activePositionWindow : null,
    chordVoicing: state.harmonyMode === "chord" ? derived.selectedChordVoicing : null,
    options: {
      labelMode: "degree",
      outsidePositionMode: state.outsidePositionMode,
    },
  });
  updateEmptyState(state, derived);
}

function handleControlAction(action) {
  const state = store.getState();
  if (action.type === "set-field") {
    const { name, value } = action;
    if (name === "harmonyMode") {
      stopAudioPreview();
    }
    if (name === "positionIndex" || name === "fretCount") {
      store.setState({ [name]: Number(value) || DEFAULT_STATE[name] });
      return;
    }
    if (name === "showNoteLabels" || name === "showOpenStrings") {
      store.setState({ [name]: Boolean(value) });
      return;
    }
    if (name === "scaleFamily") {
      store.setState({ scaleFamily: String(value) });
      return;
    }
    if (name === "selectedPresetTuningId") {
      const nextPresetId = String(value);
      if (nextPresetId === "custom") {
        store.setState({ selectedPresetTuningId: "custom" });
        return;
      }
      store.setState(applyPresetToState({ ...state, selectedPresetTuningId: nextPresetId }));
      return;
    }
    if (name === "harmonyMode") {
      store.setState({
        harmonyMode: String(value),
        chordVoicingVariant: "",
      });
      return;
    }
    store.setState({ [name]: value });
    return;
  }

  if (action.type === "set-custom-tuning-input") {
    const custom = [...state.customTuningInput];
    custom[action.index] = action.value;
    store.setState({ customTuningInput: custom });
    return;
  }

  if (action.type === "apply-custom-tuning") {
    const normalized = state.customTuningInput.map((note) => normalizeNoteName(note));
    if (normalized.some((note) => !note)) {
      alert("Некорректный строй. Используйте ноты вида C, C#, D ... (бемоли тоже допускаются).");
      return;
    }
    store.setState({
      tuning: normalized,
      customTuningInput: normalized,
      selectedPresetTuningId: "custom",
    });
    return;
  }

  if (action.type === "use-preset-tuning") {
    store.setState(applyPresetToState(state));
    return;
  }

  if (action.type === "reset-state") {
    stopAudioPreview();
    store.reset();
    return;
  }

  if (action.type === "play-chord-strum" || action.type === "play-chord-arpeggio") {
    const nextState = store.getState();
    const derived = buildDerived(nextState);
    if (!derived.canPlayChordPreview) return;
    playChordPreview(derived.chordAudioNotes, {
      mode: action.type === "play-chord-arpeggio" ? "arpeggio" : "strum",
    }).catch(() => {
      // Keep UI silent on audio errors; browser support varies.
    });
    return;
  }

  if (action.type === "play-scale-preview") {
    const nextState = store.getState();
    const derived = buildDerived(nextState);
    if (!derived.canPlayScalePreview) return;
    playScalePreview(derived.scaleAudioNotes).catch(() => {
      // Keep UI silent on audio errors; browser support varies.
    });
    return;
  }

  if (action.type === "refresh-render") {
    renderApp();
  }
}

store.subscribe((state) => {
  saveState(state);
  renderApp();
});

// Ensure default preset is applied when loaded state is malformed.
const initial = store.getState();
if (!initial.tuning || initial.tuning.length !== 6) {
  store.setState(applyPresetToState(initial));
} else {
  renderApp();
}
