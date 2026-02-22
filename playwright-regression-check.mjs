import { existsSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:4173";
const fallbackChromiumPath = "/home/koval/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({
  headless: true,
  ...(existsSync(fallbackChromiumPath) ? { executablePath: fallbackChromiumPath } : {}),
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#fretboard-svg");
  await page.waitForSelector("#controls-form");
  await page.waitForSelector('button[data-action="play-scale-preview"]');

  const initialSummary = await page.locator("#selection-summary").innerText();
  assert(initialSummary.includes("Строй: E A D G B E"), "Initial tuning summary mismatch");
  const scaleButtonEnabled = await page.evaluate(() => {
    const btn = document.querySelector('button[data-action="play-scale-preview"]');
    return Boolean(btn && !btn.disabled);
  });
  if (scaleButtonEnabled) {
    await page.click('button[data-action="play-scale-preview"]');
  }

  await page.selectOption("#selectedPresetTuningId", "drop-d");
  await page.waitForTimeout(200);
  const dropDSummary = await page.locator("#selection-summary").innerText();
  assert(dropDSummary.includes("Строй: D A D G B E"), "Preset tuning did not apply on select");

  await page.selectOption("#displayMode", "position");
  await page.waitForTimeout(100);
  await page.selectOption("#cagedShapeFilter", "E");
  await page.waitForTimeout(250);
  const detailsAfterShape = await page.locator("#details-panel").innerText();
  assert(detailsAfterShape.includes("форма E"), "CAGED shape filter did not affect active position");

  await page.selectOption("#harmonyMode", "chord");
  await page.waitForSelector('[data-section="chord"]:not([hidden])');
  await page.waitForSelector('button[data-action="play-chord-strum"]');
  const audioButtonsEnabled = await page.evaluate(() => {
    const a = document.querySelector('button[data-action="play-chord-strum"]');
    const b = document.querySelector('button[data-action="play-chord-arpeggio"]');
    return Boolean(a && b && !a.disabled && !b.disabled);
  });
  if (audioButtonsEnabled) {
    await page.click('button[data-action="play-chord-strum"]');
    await page.click('button[data-action="play-chord-arpeggio"]');
  }
  await page.selectOption("#chordId", "dim");
  await page.waitForTimeout(250);
  const dimEmptyVisible = await page.locator("#empty-state").isVisible();
  const dimNoteDots = await page.locator("#fretboard-svg circle").count();
  assert(dimEmptyVisible, "Empty state should be visible for chord with no predefined voicing");
  assert(dimNoteDots > 20, "Chord mode should still render chord tones without voicing");

  await page.selectOption("#harmonyMode", "scale");
  await page.waitForTimeout(250);
  const labelAttrs = await page.evaluate(() => {
    const texts = [...document.querySelectorAll("#fretboard-svg text")];
    const noteLabels = texts.filter((el) => el.getAttribute("paint-order") === "stroke");
    return noteLabels.slice(0, 3).map((el) => ({
      fill: el.getAttribute("fill"),
      stroke: el.getAttribute("stroke"),
      text: el.textContent,
    }));
  });
  assert(labelAttrs.length > 0, "No note labels found on fretboard");
  assert(labelAttrs.every((a) => a.fill && a.stroke), "Note labels are missing contrast attributes");
  assert(pageErrors.length === 0, `Page errors after audio clicks: ${pageErrors.join(" | ")}`);

  console.log("REGRESSION_OK");
  console.log(JSON.stringify({
    dropDSummary,
    detailsAfterShape: detailsAfterShape.replace(/\s+/g, " ").slice(0, 160),
    dimEmptyVisible,
    dimNoteDots,
    labelAttrs,
    scaleButtonEnabled,
    audioButtonsEnabled,
  }, null, 2));
} catch (error) {
  console.error("REGRESSION_FAIL");
  console.error(String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
}
