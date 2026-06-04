import ChordSheetJS from 'chordsheetjs';
import { chromium } from 'playwright';
import { renderChordProBodyHtml } from '../../src/chordproRenderer';

type DirectiveMap = Map<string, string[]>;
type ParsedSongLike = {
  title: string | null;
  subtitle: string | null;
  key?: unknown;
  tempo?: unknown;
};
export type PdfColumnCount = 1 | 2;

function cssObjectToString(selectorPrefix: string, styleMap: Record<string, Record<string, string>>): string {
  return Object.entries(styleMap)
    .map(([selector, declarations]) => {
      const body = Object.entries(declarations)
        .map(([property, value]) => `${property}: ${value};`)
        .join(' ');
      return `${selectorPrefix} ${selector} { ${body} }`;
    })
    .join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function extractDirectives(chordPro: string): DirectiveMap {
  const directives: DirectiveMap = new Map();

  for (const line of chordPro.split(/\r?\n/)) {
    const match = line.match(/^\s*\{([^:}]+)(?::\s*([^}]*))?\}\s*$/);
    if (!match) {
      continue;
    }

    const key = match[1].trim().toLowerCase();
    const value = (match[2] ?? '').trim();
    if (!directives.has(key)) {
      directives.set(key, []);
    }
    directives.get(key)?.push(value);
  }

  return directives;
}

function pickFirst(directives: DirectiveMap, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = directives.get(key)?.find((entry) => entry.trim().length > 0);
    if (value) {
      return value;
    }
  }

  return null;
}

function renderMetadataBlock(chordPro: string, song: ParsedSongLike): string {
  const directives = extractDirectives(chordPro);
  const title = song.title ?? pickFirst(directives, 'title');
  const subtitle = song.subtitle ?? pickFirst(directives, 'subtitle');

  const contributors = [
    ['Author', pickFirst(directives, 'author')],
    ['Artist', pickFirst(directives, 'artist')],
    ['Composer', pickFirst(directives, 'composer')],
    ['Lyricist', pickFirst(directives, 'lyricist')],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const details = [
    ['Key', song.key ? String(song.key) : pickFirst(directives, 'key')],
    ['Tempo', song.tempo ? String(song.tempo) : pickFirst(directives, 'tempo')],
    ['Time', pickFirst(directives, 'time')],
    ['Capo', pickFirst(directives, 'capo')],
    ['Album', pickFirst(directives, 'album')],
    ['Year', pickFirst(directives, 'year')],
    ['CCLI', pickFirst(directives, 'ccli')],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (!title && !subtitle && contributors.length === 0 && details.length === 0) {
    return '';
  }

  const titleHtml = title ? `<h1 class="meta-title">${escapeHtml(title)}</h1>` : '';
  const subtitleHtml = subtitle ? `<p class="meta-subtitle">${escapeHtml(subtitle)}</p>` : '';
  const contributorsHtml =
    contributors.length > 0
      ? `<div class="meta-contributors">${contributors
          .map(([label, value]) => `<span class="meta-line"><strong>${label}:</strong> ${escapeHtml(value)}</span>`)
          .join('')}</div>`
      : '';
  const detailsHtml =
    details.length > 0
      ? `<div class="meta-tags">${details
          .map(([label, value]) => `<span class="meta-tag"><strong>${label}:</strong> ${escapeHtml(value)}</span>`)
          .join('')}</div>`
      : '';

  return `<header class="song-meta">${titleHtml}${subtitleHtml}${contributorsHtml}${detailsHtml}</header>`;
}

export function renderChordProHtml(chordPro: string): string {
  const parser = new ChordSheetJS.ChordProParser();
  const song = parser.parse(chordPro);
  const bodyHtml = renderChordProBodyHtml(chordPro);
  const metadataHtml = renderMetadataBlock(chordPro, song);

  return `${metadataHtml}<div class="rendered-song">${bodyHtml}</div>`;
}

export function buildPdfDocument(contentHtml: string, columns: PdfColumnCount): string {
  const formatter = new ChordSheetJS.HtmlDivFormatter();
  const formatterCss = cssObjectToString('.chordpro-sheet', formatter.defaultCss as Record<string, Record<string, string>>);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>ChordPro PDF</title>
    <style>
      :root {
        color: #0f172a;
        font-family: "Segoe UI", Arial, sans-serif;
      }

      * { box-sizing: border-box; }

      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #0f172a;
      }

      body {
        padding: 28px 30px 36px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .chordpro-sheet {
        line-height: 1.42;
      }

      .chordpro-sheet .rendered-song {
        column-count: ${columns};
        column-gap: 28px;
      }

      .chordpro-sheet .song-meta {
        margin: 0 0 18px;
        padding-bottom: 16px;
        border-bottom: 1px solid #dbeafe;
      }

      .chordpro-sheet .meta-title {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }

      .chordpro-sheet .meta-subtitle {
        margin: 6px 0 0;
        font-size: 14px;
        color: #64748b;
      }

      .chordpro-sheet .meta-contributors {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 18px;
        margin-top: 12px;
        font-size: 13px;
        color: #334155;
      }

      .chordpro-sheet .meta-line {
        white-space: nowrap;
      }

      .chordpro-sheet .meta-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .chordpro-sheet .meta-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 12px;
        font-weight: 700;
      }

      .chordpro-sheet .rendered-song .title,
      .chordpro-sheet .rendered-song .subtitle {
        display: none;
      }

      .chordpro-sheet .comment {
        display: inline-block;
        margin: 8px 0 10px;
        padding: 3px 10px;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .chordpro-sheet .instrumental-line {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: baseline;
        margin: 0.15rem 0 0.35rem;
        break-inside: avoid;
      }

      .chordpro-sheet .paragraph,
      .chordpro-sheet .row {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .chordpro-sheet .paragraph {
        break-inside: avoid-column;
        margin-bottom: 0.35rem;
      }

      .chordpro-sheet .empty-line {
        height: 1.1em;
      }

      .chordpro-sheet .row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 1px;
        max-width: 100%;
        min-width: 0;
      }

      .chordpro-sheet .column {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        min-width: 0;
        max-width: 100%;
        flex: 0 1 auto;
      }

      .chordpro-sheet .chord {
        margin-bottom: 1px;
        font-size: 13px;
        font-weight: 800;
        color: #2563eb;
        white-space: pre;
      }

      .chordpro-sheet .instrumental-chord {
        margin: 0;
        display: inline-flex;
      }

      .chordpro-sheet .lyrics {
        font-size: 14px;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        max-width: 100%;
      }

      .chordpro-sheet .plain-row {
        display: block;
      }

      .chordpro-sheet .plain-row .lyrics {
        display: block;
        width: 100%;
      }

      ${formatterCss}
    </style>
  </head>
  <body>
    <div class="chordpro-sheet">${contentHtml}</div>
  </body>
</html>`;
}

export async function generatePdfBuffer(chordPro: string, columns: PdfColumnCount = 1): Promise<Buffer> {
  const contentHtml = renderChordProHtml(chordPro);
  const html = buildPdfDocument(contentHtml, columns);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ media: 'screen' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '16mm',
        right: '12mm',
        bottom: '16mm',
        left: '12mm',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
