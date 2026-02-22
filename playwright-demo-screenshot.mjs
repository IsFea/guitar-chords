import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:4173";
const outPath = "docs/demo-chord-page.png";
const fallbackChromiumPath = "/home/koval/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome";

mkdirSync("docs", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(existsSync(fallbackChromiumPath) ? { executablePath: fallbackChromiumPath } : {}),
});

const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#fretboard-svg");

  // Настраиваем осмысленное демо-состояние.
  await page.selectOption("#rootNote", "E");
  await page.selectOption("#harmonyMode", "chord");
  await page.waitForSelector('[data-section="chord"]:not([hidden])');
  await page.selectOption("#chordId", "m7");
  await page.selectOption("#displayMode", "position");
  await page.selectOption("#cagedShapeFilter", "A");
  await page.waitForTimeout(350);

  // Если список аппликатур доступен, выберем первый вариант явно.
  const voicing = page.locator("#chordVoicingVariant");
  if (await voicing.count()) {
    const disabled = await voicing.isDisabled().catch(() => true);
    if (!disabled) {
      const options = await voicing.locator("option").count();
      if (options > 0) {
        const value = await voicing.locator("option").first().getAttribute("value");
        if (value) await voicing.selectOption(value);
      }
    }
  }

  await page.waitForTimeout(250);
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`SCREENSHOT_OK ${outPath}`);
} catch (error) {
  console.error("SCREENSHOT_FAIL");
  console.error(String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
}

