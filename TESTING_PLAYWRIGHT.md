# Playwright: заметки и инструкция (техничка)

Файл для локальной технической проверки/поддержки Playwright-скриптов в этом проекте.

## Что используется

- `smoke-playwright.mjs` — короткий smoke
- `playwright-regression-check.mjs` — проверка багфиксов
- `playwright-demo-screenshot.mjs` — генерация demo-скриншота для README

## Подготовка

1. Установить зависимости:
   ```bash
   npm install
   ```
2. Убедиться, что браузер Playwright установлен:
   ```bash
   npx playwright install chromium
   ```

## Локальный запуск сервера

Вариант 1:
```bash
./run.sh
```

Вариант 2 (проще для скриптов):
```bash
python3 -m http.server 4173
```

## Запуск скриптов

```bash
node smoke-playwright.mjs http://127.0.0.1:4173
node playwright-regression-check.mjs http://127.0.0.1:4173
node playwright-demo-screenshot.mjs http://127.0.0.1:4173
```

## Если Playwright не стартует

Типичные причины:
- браузер Playwright не установлен;
- ограничение sandbox/CI на запуск Chromium;
- в окружении нет доступа к сокетам/`--no-sandbox`.

Что проверить:
1. `npx playwright install chromium`
2. Запускать локально вне sandbox/ограниченного контейнера
3. Проверить путь к Chromium (в скриптах есть fallback `executablePath`)

## Что обновлять после UI-изменений

1. Прогнать smoke и regression
2. Переснять demo-скрин:
   ```bash
   node playwright-demo-screenshot.mjs http://127.0.0.1:4173
   ```
3. Проверить, что `README.md` показывает актуальную картинку

