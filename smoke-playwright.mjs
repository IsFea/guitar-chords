import { existsSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:4173";
const fallbackChromiumPath = "/home/koval/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome";

const browser = await chromium.launch({
  headless: true,
  ...(existsSync(fallbackChromiumPath) ? { executablePath: fallbackChromiumPath } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const result = {
  url,
  title: "",
  summaryText: "",
  svgViewBox: "",
  noteDots: 0,
  markers: 0,
};

try {
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  if (!response || !response.ok()) {
    throw new Error(`HTTP error: ${response ? response.status() : "no response"}`);
  }

  await page.waitForSelector("#fretboard-svg", { timeout: 10000 });
  await page.waitForSelector("#controls-form select#rootNote", { timeout: 10000 });

  result.title = await page.title();
  result.summaryText = (await page.locator("#selection-summary").innerText()).trim();
  result.svgViewBox = (await page.locator("#fretboard-svg").getAttribute("viewBox")) || "";
  result.noteDots = await page.locator("#fretboard-svg circle").count();
  result.markers = await page.locator("#fretboard-svg text").count();

  // Switch to chord mode and ensure UI updates without crashing.
  await page.selectOption("#harmonyMode", "chord");
  await page.waitForTimeout(300);
  await page.waitForSelector('[data-section="chord"]:not([hidden])', { timeout: 5000 });
  await page.selectOption("#chordId", "maj7");
  await page.selectOption("#displayMode", "position");
  await page.fill("#positionIndex", "2");
  await page.waitForTimeout(300);

  const emptyStateVisible = await page.locator("#empty-state").isVisible().catch(() => false);
  const detailsText = await page.locator("#details-panel").innerText();
  const svgHasViewBox = await page.locator("#fretboard-svg").getAttribute("viewBox");

  if (!svgHasViewBox) throw new Error("SVG viewBox is empty after interactions");
  if (errors.length) throw new Error(`Page errors: ${errors.join(" | ")}`);

  console.log("SMOKE_OK");
  console.log(JSON.stringify({
    ...result,
    chordMode: true,
    emptyStateVisible,
    detailsSample: detailsText.slice(0, 180),
  }, null, 2));
} catch (error) {
  console.error("SMOKE_FAIL");
  console.error(String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
}
