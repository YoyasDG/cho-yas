import ChordSheetJS from 'chordsheetjs';
import { renderChordProBodyHtml } from '../../../src/chordproRenderer';

type DirectiveMap = Map<string, string[]>;
type ParsedSongLike = {
  title: string | null;
  subtitle: string | null;
  key?: unknown;
  tempo?: unknown;
};

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

export function renderChordProPreview(chordPro: string): string {
  const parser = new ChordSheetJS.ChordProParser();
  const formatter = new ChordSheetJS.HtmlDivFormatter();
  const song = parser.parse(chordPro);
  const bodyHtml = renderChordProBodyHtml(chordPro);
  const metadataHtml = renderMetadataBlock(chordPro, song);
  const baseCss = cssObjectToString('.chordpro-preview', formatter.defaultCss as Record<string, Record<string, string>>);

  return `
    <style>
      .chordpro-preview {
        color: #0f172a;
        font-family: "Segoe UI", Arial, sans-serif;
        line-height: 1.42;
      }

      .chordpro-preview .song-meta {
        margin: 0 0 18px;
        padding-bottom: 16px;
        border-bottom: 1px solid #dbeafe;
      }

      .chordpro-preview .meta-title {
        margin: 0;
        font-size: 1.85rem;
        font-weight: 700;
        color: #0f172a;
      }

      .chordpro-preview .meta-subtitle {
        margin: 6px 0 0;
        font-size: 0.9rem;
        color: #64748b;
      }

      .chordpro-preview .meta-contributors {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 18px;
        margin-top: 12px;
        font-size: 0.85rem;
        color: #334155;
      }

      .chordpro-preview .meta-line {
        white-space: nowrap;
      }

      .chordpro-preview .meta-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .chordpro-preview .meta-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 0.72rem;
        font-weight: 700;
      }

      .chordpro-preview .rendered-song .title,
      .chordpro-preview .rendered-song .subtitle {
        display: none;
      }

      .chordpro-preview .comment {
        display: inline-block;
        margin: 8px 0 10px;
        padding: 3px 10px;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .chordpro-preview .instrumental-line {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: baseline;
        margin: 0.15rem 0 0.35rem;
      }

      .chordpro-preview .row {
        align-items: flex-end;
      }

      .chordpro-preview .column {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .chordpro-preview .chord {
        margin-bottom: 1px;
        font-size: 0.85rem;
        font-weight: 800;
        color: #2563eb;
        white-space: pre;
      }

      .chordpro-preview .instrumental-chord {
        margin: 0;
        display: inline-flex;
      }

      .chordpro-preview .lyrics {
        font-size: 0.97rem;
        white-space: pre;
      }

      ${baseCss}
    </style>
    ${metadataHtml}
    <div class="rendered-song">${bodyHtml}</div>
  `;
}
