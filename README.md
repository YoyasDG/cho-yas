# ChordPro Session Converter

Local web app for quick, session-based worship song conversion.

The existing TXT to CHO converter is preserved and reused as the core engine. The app does not keep a song library or persistent file history: upload, convert, edit, download, and finish.

## What it does

### Workflow 1

`TXT → CHO → PDF`

1. Upload a TXT chord sheet.
2. Optionally add basic ChordPro metadata:
   - `{title: }`
   - `{author: }`
   - `{key: }`
   - `{tempo: }`
3. Convert it with the existing parser.
4. Edit the generated ChordPro.
5. Download the `.cho`.
6. Generate and download the `.pdf`.

### Workflow 2

`CHO → PDF`

1. Upload an existing `.cho` file.
2. Review and edit it.
3. Preview the rendered result.
4. Generate and download the `.pdf`.

## Important behavior

- No song history
- No saved library
- No persistent server-side file storage
- Everything is handled for the current browser session flow
- Downloads are generated and returned immediately

## Architecture

### Conversion engine

- The existing conversion logic remains in [src/parser.ts](src/parser.ts).
- `server/services/songService.ts` reuses `parseSong()` for TXT to ChordPro conversion.

### Preview and PDF rendering

- `chordsheetjs` parses and formats ChordPro into structured HTML.
- `client/src/lib/chordproPreview.ts` renders the live preview.
- `server/services/pdfService.ts` renders the same style of output for PDF generation.
- `playwright` uses headless Chromium to export a real printable PDF.

## Tech stack

- React
- TypeScript
- Vite
- TailwindCSS
- Monaco Editor
- Node.js
- Express
- chordsheetjs
- Playwright

## Run locally

Install dependencies:

```bash
npm install
```

Install the Playwright browser once:

```bash
npx playwright install chromium
```

Start development:

```bash
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5174`

## Production build

```bash
npm run build
npm start
```

## REST API

- `GET /api/health`
- `POST /api/convert-txt`
- `POST /api/upload-cho`
- `POST /api/generate-pdf`

## Notes

- The server does not keep a persistent song library.
- The generated `.cho` download is created client-side from the current editor content.
- The PDF is generated server-side and returned directly as a downloadable file.

## Tests

```bash
npm test
```
