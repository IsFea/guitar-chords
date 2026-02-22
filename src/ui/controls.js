import { UI_NOTE_OPTIONS } from "../constants.js";
import { CHORD_DEFS } from "../music/chords.js";
import { SCALE_FAMILIES, getScalesByFamily } from "../music/scales.js";
import { TUNING_PRESETS } from "../music/tunings.js";

function optionList(options, valueKey = "id", labelKey = "label") {
  return options.map((item) => `<option value="${item[valueKey]}">${item[labelKey]}</option>`).join("");
}

function selectedAttr(value, current) {
  return value === current ? " selected" : "";
}

function noteOptions(current) {
  return UI_NOTE_OPTIONS.map((note) => `<option value="${note}"${selectedAttr(note, current)}>${note}</option>`).join("");
}

export function renderControls(container, state, derived, onAction) {
  const familyScales = getScalesByFamily(state.scaleFamily);
  const tuningPresetOptions = [
    ...TUNING_PRESETS.map((preset) => {
    const label = `${preset.label}`;
    return `<option value="${preset.id}"${selectedAttr(preset.id, state.selectedPresetTuningId)}>${label}</option>`;
    }),
    `<option value="custom"${selectedAttr("custom", state.selectedPresetTuningId)}>Custom (ручной)</option>`,
  ].join("");

  const familyOptions = SCALE_FAMILIES.map((family) =>
    `<option value="${family.id}"${selectedAttr(family.id, state.scaleFamily)}>${family.label}</option>`
  ).join("");

  const scaleOptions = familyScales.map((scale) =>
    `<option value="${scale.id}"${selectedAttr(scale.id, state.scaleId)}>${scale.label}</option>`
  ).join("");

  const chordOptions = CHORD_DEFS.map((chord) =>
    `<option value="${chord.id}"${selectedAttr(chord.id, state.chordId)}>${chord.label}</option>`
  ).join("");

  const displayOptions = [
    { value: "full", label: "Весь гриф" },
    { value: "position", label: "Позиция" },
  ].map((item) =>
    `<option value="${item.value}"${selectedAttr(item.value, state.displayMode)}>${item.label}</option>`
  ).join("");

  const shapeOptions = `<option value="">Любая форма</option>${
    ["C", "A", "G", "E", "D"].map((shape) => `<option value="${shape}"${selectedAttr(shape, state.cagedShapeFilter)}>${shape}</option>`).join("")
  }`;

  const positionMax = Math.max(derived.positionWindows.length, 1);
  const voicingOptions = derived.chordVoicings.map((v) =>
    `<option value="${v.id}"${selectedAttr(v.id, state.chordVoicingVariant)}>${v.label}</option>`
  ).join("");
  const audioUnsupported = derived.audioPreviewSupported === false;
  const canPlayChordPreview = Boolean(derived.canPlayChordPreview);
  const canPlayScalePreview = Boolean(derived.canPlayScalePreview);

  container.innerHTML = `
    <div class="field-group">
      <h3>Основное</h3>
      <div class="field-row inline-2">
        <div>
          <label for="rootNote">Тональность (root)</label>
          <select id="rootNote" name="rootNote">${noteOptions(state.rootNote)}</select>
        </div>
        <div>
          <label for="harmonyMode">Режим</label>
          <select id="harmonyMode" name="harmonyMode">
            <option value="scale"${selectedAttr("scale", state.harmonyMode)}>Гармония</option>
            <option value="chord"${selectedAttr("chord", state.harmonyMode)}>Аккорд</option>
          </select>
        </div>
      </div>
    </div>

    <div class="field-group" data-section="scale" ${state.harmonyMode !== "scale" ? "hidden" : ""}>
      <h3>Гармония</h3>
      <div class="field-row">
        <label for="scaleFamily">Семейство</label>
        <select id="scaleFamily" name="scaleFamily">${familyOptions}</select>
      </div>
      <div class="field-row">
        <label for="scaleId">Лад / гамма</label>
        <select id="scaleId" name="scaleId">${scaleOptions}</select>
      </div>
      <div class="field-row">
        <button type="button" data-action="play-scale-preview" ${canPlayScalePreview ? "" : "disabled"}>▶ Гамма</button>
      </div>
      <div class="helper-text">
        ${
          audioUnsupported
            ? "Аудио-preview недоступен: браузер не поддерживает Web Audio API."
            : (canPlayScalePreview
              ? "Синтетический preview выбранной гаммы (по возрастанию)."
              : "Нет данных для воспроизведения гаммы в текущем отображении.")
        }
      </div>
    </div>

    <div class="field-group" data-section="chord" ${state.harmonyMode !== "chord" ? "hidden" : ""}>
      <h3>Аккорд</h3>
      <div class="field-row">
        <label for="chordId">Тип аккорда</label>
        <select id="chordId" name="chordId">${chordOptions}</select>
      </div>
      <div class="field-row">
        <label for="chordVoicingVariant">Аппликатура</label>
        <select id="chordVoicingVariant" name="chordVoicingVariant" ${derived.chordVoicings.length ? "" : "disabled"}>
          ${derived.chordVoicings.length ? voicingOptions : "<option value=''>Нет вариантов</option>"}
        </select>
      </div>
      <div class="helper-text">${derived.chordVoicings.length ? "Выберите готовый voicing в позиции." : "Для этого аккорда в выбранной позиции нет готовых voicing."}</div>
      <div class="field-row inline-2">
        <button type="button" data-action="play-chord-strum" ${canPlayChordPreview ? "" : "disabled"}>▶ Струм</button>
        <button type="button" data-action="play-chord-arpeggio" ${canPlayChordPreview ? "" : "disabled"}>▶ Арпеджио</button>
      </div>
      <div class="helper-text">
        ${
          audioUnsupported
            ? "Аудио-preview недоступен: браузер не поддерживает Web Audio API."
            : (canPlayChordPreview
              ? "Синтетический preview аккорда (ориентировочное звучание)."
              : "Нет данных для воспроизведения (выберите другой аккорд/позицию/voicing).")
        }
      </div>
    </div>

    <div class="field-group">
      <h3>Отображение</h3>
      <div class="field-row inline-2">
        <div>
          <label for="displayMode">Показать</label>
          <select id="displayMode" name="displayMode">${displayOptions}</select>
        </div>
        <div>
          <label for="positionIndex">Позиция</label>
          <input id="positionIndex" name="positionIndex" type="number" min="1" max="${positionMax}" value="${Math.min(state.positionIndex, positionMax)}">
        </div>
      </div>
      <div class="field-row inline-2">
        <div>
          <label for="cagedShapeFilter">Форма (CAGED)</label>
          <select id="cagedShapeFilter" name="cagedShapeFilter">${shapeOptions}</select>
        </div>
        <div>
          <label for="outsidePositionMode">Вне позиции</label>
          <select id="outsidePositionMode" name="outsidePositionMode">
            <option value="dim"${selectedAttr("dim", state.outsidePositionMode)}>Приглушить</option>
            <option value="hide"${selectedAttr("hide", state.outsidePositionMode)}>Скрыть</option>
          </select>
        </div>
      </div>
    </div>

    <div class="field-group">
      <h3>Строй</h3>
      <div class="field-row">
        <label for="selectedPresetTuningId">Пресет</label>
        <select id="selectedPresetTuningId" name="selectedPresetTuningId">${tuningPresetOptions}</select>
      </div>
      <div class="tuning-grid">
        ${["6", "5", "4", "3", "2", "1"].map((stringNo, idx) => `
          <div class="tuning-item">
            <label for="tuning-${idx}">Струна ${stringNo}</label>
            <input id="tuning-${idx}" data-tuning-index="${idx}" type="text" maxlength="2" value="${state.customTuningInput[idx]}">
          </div>
        `).join("")}
      </div>
      <div class="helper-text">Допустимые ноты: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (можно вводить бемоли, они будут нормализованы).</div>
      <div class="field-row inline-2">
        <button type="button" data-action="apply-custom-tuning">Применить свой строй</button>
        <button type="button" data-action="use-preset-tuning">Применить пресет</button>
      </div>
    </div>

    <div class="field-group">
      <h3>Опции</h3>
      <label class="checkbox-row"><input type="checkbox" id="showNoteLabels" name="showNoteLabels" ${state.showNoteLabels ? "checked" : ""}>Показывать подписи</label>
      <label class="checkbox-row"><input type="checkbox" id="showOpenStrings" name="showOpenStrings" ${state.showOpenStrings ? "checked" : ""}>Показывать открытые струны</label>
      <div class="field-row inline-2">
        <button type="button" class="primary" data-action="reset-state">Сбросить настройки</button>
        <button type="button" data-action="refresh-render">Обновить</button>
      </div>
    </div>
  `;

  container.onchange = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-tuning-index]")) {
      const index = Number(target.dataset.tuningIndex);
      onAction({ type: "set-custom-tuning-input", index, value: target.value });
      return;
    }

    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    const name = target.name;
    if (!name) return;
    const value = target.type === "checkbox" ? target.checked : target.value;
    onAction({ type: "set-field", name, value });
  };

  container.oninput = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.matches("[data-tuning-index]")) return;
    const index = Number(target.dataset.tuningIndex);
    onAction({ type: "set-custom-tuning-input", index, value: target.value, live: true });
  };

  container.onclick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest("[data-action]");
    if (!button) return;
    onAction({ type: button.dataset.action });
  };
}

export function renderLegend(container, legendEntries) {
  container.innerHTML = legendEntries.map((entry) => `
    <span class="legend-chip">
      <span class="legend-swatch" style="background:${entry.colorVar}"></span>
      <span>${entry.degree}</span>
    </span>
  `).join("");
}

export function renderDetails(container, data) {
  const { state, selectionDef, positionWindow, chordVoicing, positionWindows } = data;
  const intervalsText = selectionDef.intervals.join(", ");
  const degreeText = selectionDef.degreeLabels.join(", ");
  container.innerHTML = `
    <div class="details-grid">
      <div class="details-box">
        <h4>Выбор</h4>
        <div class="tag-list">
          <span class="tag">Root: ${state.rootNote}</span>
          <span class="tag">Режим: ${state.harmonyMode === "scale" ? "Гармония" : "Аккорд"}</span>
          <span class="tag">${selectionDef.label}</span>
          <span class="tag">Строй: ${state.tuning.join(" ")}</span>
        </div>
      </div>
      <div class="details-box">
        <h4>Интервалы и степени</h4>
        <div class="helper-text">Интервалы (полутоны): ${intervalsText}</div>
        <div class="helper-text">Степени: ${degreeText}</div>
      </div>
      <div class="details-box">
        <h4>Позиция</h4>
        <div class="helper-text">
          ${positionWindow ? `№${positionWindow.positionIndex}, форма ${positionWindow.shape}, лады ${positionWindow.startFret}-${positionWindow.endFret}` : "Весь гриф"}
        </div>
        <div class="helper-text">Всего окон: ${positionWindows.length}</div>
      </div>
      <div class="details-box">
        <h4>Аккорд / Voicing</h4>
        <div class="helper-text">${chordVoicing ? chordVoicing.label : "Не выбран / отсутствует"}</div>
        <div class="helper-text">${chordVoicing ? `Форма ${chordVoicing.cagedShape}, позиция ${chordVoicing.positionIndex}` : ""}</div>
      </div>
    </div>
  `;
}
