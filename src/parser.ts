import { alignChordLineMusical, alignChordLineStrict, expandTabs, type AlignmentMode, type MusicalAlignmentOptions } from './alignment';

export type SectionKind = 'verse' | 'chorus' | 'bridge';

export interface ChordToken {
  chord: string;
  index: number;
  order: number;
}

export interface ExtractedChords {
  chords: ChordToken[];
  isChordLine: boolean;
  sourceLineLength: number;
}

export interface SpecialLineResult {
  kind: 'none' | 'section-start' | 'comment-and-chords';
  lines: string[];
  openSection?: SectionKind;
}

const CHORD_ROOT = String.raw`[A-G](?:#|b)?`;
const CHORD_SUFFIX = String.raw`(?:maj7|maj9|maj11|maj13|maj|min7|min9|min11|min13|min|mmaj7|m7b5|m6|m7|m9|m11|m13|m|dim7|dim9|dim|aug7|aug|sus2|sus4|sus|add2|add4|add6|add7|add9|add11|add13|6|7|9|11|13|5|2|4)`;
const CHORD_BODY = String.raw`${CHORD_ROOT}(?:${CHORD_SUFFIX})*(?:\([^)]+\))?(?:/[A-G](?:#|b)?)?`;
const CHORD_TOKEN_RE = new RegExp(`^(?:${CHORD_BODY}|N\\.?C\\.?|X|x|%)$`);
const LABEL_RE = /^\s*(?<label>intro|inter|intro\s+instrumental|verse|verso|coro|chorus|bridge|puente|outro|estrofa|estribillo|refrao|refrain)(?:\s+(?<number>\d+))?\s*[:\-]?\s*(?<rest>.*)$/i;

function isBlankLine(line: string): boolean {
  return line.trim() === '';
}

function isDirectiveLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('{') && trimmed.endsWith('}');
}

function mapLabelToSection(label: string): SectionKind | null {
  const normalized = label.toLowerCase();
  if (normalized === 'verse' || normalized === 'verso' || normalized === 'estrofa') return 'verse';
  if (normalized === 'chorus' || normalized === 'coro' || normalized === 'estribillo' || normalized === 'refrain' || normalized === 'refrao') return 'chorus';
  if (normalized === 'bridge' || normalized === 'puente') return 'bridge';
  return null;
}

function makeSectionDirective(kind: SectionKind, label?: string): string {
  const directive = kind === 'verse'
    ? 'start_of_verse'
    : kind === 'chorus'
      ? 'start_of_chorus'
      : 'start_of_bridge';

  return label ? `{${directive}: ${label}}` : `{${directive}}`;
}

function makeEndDirective(kind: SectionKind): string {
  return kind === 'verse'
    ? '{end_of_verse}'
    : kind === 'chorus'
      ? '{end_of_chorus}'
      : '{end_of_bridge}';
}

function formatChordOnlyLine(chords: ChordToken[]): string {
  return chords.map((token) => `[${token.chord}]`).join(' ');
}

function isMostlyChordTokens(tokens: Array<{ text: string }>): boolean {
  if (tokens.length === 0) return false;

  let chordTokens = 0;
  let nonChordTokens = 0;

  for (const token of tokens) {
    if (CHORD_TOKEN_RE.test(token.text)) {
      chordTokens += 1;
      continue;
    }

    if (/^[|:.\-]+$/.test(token.text)) {
      continue;
    }

    nonChordTokens += 1;
  }

  return chordTokens > 0 && chordTokens >= nonChordTokens && chordTokens / tokens.length >= 0.5;
}

export function extractChords(line: string): ExtractedChords {
  const expanded = expandTabs(line);
  const tokens: ChordToken[] = [];
  const matches = expanded.matchAll(/\S+/g);

  let order = 0;
  for (const match of matches) {
    const text = match[0];
    const index = match.index ?? 0;
    if (!CHORD_TOKEN_RE.test(text)) {
      order += 1;
      continue;
    }

    tokens.push({
      chord: text,
      index,
      order,
    });
    order += 1;
  }

  return {
    chords: tokens,
    isChordLine: isMostlyChordTokens(
      Array.from(expanded.matchAll(/\S+/g), (match) => ({ text: match[0] })),
    ),
    sourceLineLength: expanded.length,
  };
}

export function detectChordLine(line: string): boolean {
  return extractChords(line).isChordLine;
}

function parseLabelLine(line: string): { label: string; number?: string; rest: string } | null {
  const match = LABEL_RE.exec(line);
  if (!match?.groups) return null;

  const label = match.groups.label;
  const number = match.groups.number;
  const rest = match.groups.rest ?? '';
  const normalized = label.toLowerCase();

  if (normalized === 'intro' || normalized === 'inter' || normalized === 'outro') {
    return { label, number, rest };
  }

  const section = mapLabelToSection(label);
  if (!section) return null;

  return { label, number, rest };
}

export function convertSpecialLine(line: string): SpecialLineResult {
  const parsed = parseLabelLine(line);
  if (!parsed) {
    return { kind: 'none', lines: [] };
  }

  const { label, number, rest } = parsed;
  const section = mapLabelToSection(label);

  // Section labels are emitted as ChordPro directives so readers can render
  // verse/chorus/bridge blocks with the expected semantics.
  if (section && isBlankLine(rest)) {
    const sectionLabel = number ? `${label[0].toUpperCase() + label.slice(1)} ${number}` : undefined;
    return {
      kind: 'section-start',
      lines: [makeSectionDirective(section, sectionLabel)],
      openSection: section,
    };
  }

  const normalized = label.toLowerCase();
  const isInstrumentalMarker =
    normalized === 'intro' ||
    normalized === 'inter' ||
    normalized === 'intro instrumental' ||
    normalized === 'outro';

  if (isInstrumentalMarker && rest.trim()) {
    const extracted = extractChords(rest);
    if (extracted.isChordLine) {
      return {
        kind: 'comment-and-chords',
        lines: [`{comment: ${label[0].toUpperCase() + label.slice(1)}}`, formatChordOnlyLine(extracted.chords)],
      };
    }
  }

  if (isInstrumentalMarker && isBlankLine(rest)) {
    return {
      kind: 'comment-and-chords',
      lines: [`{comment: ${label[0].toUpperCase() + label.slice(1)}}`],
    };
  }

  return { kind: 'none', lines: [] };
}

export interface ParseSongOptions extends MusicalAlignmentOptions {
  mode?: AlignmentMode;
}

export function mergeChordLine(chords: ChordToken[], lyricLine: string, options: ParseSongOptions = {}): string {
  if (options.mode === 'strict') {
    return alignChordLineStrict(chords, lyricLine);
  }

  return alignChordLineMusical(chords, lyricLine, {
    debugLogger: options.debugLogger,
    sourceLineLength: options.sourceLineLength,
  }).line;
}

export function parseSong(text: string, options: ParseSongOptions = {}): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const output: string[] = [];
  let openSection: SectionKind | null = null;
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const special = convertSpecialLine(rawLine);

    if (special.kind === 'section-start') {
      if (openSection) {
        output.push(makeEndDirective(openSection));
      }
      openSection = special.openSection ?? null;
      output.push(...special.lines);
      index += 1;
      continue;
    }

    if (special.kind === 'comment-and-chords') {
      output.push(...special.lines);
      index += 1;
      continue;
    }

    if (isBlankLine(rawLine)) {
      if (openSection) {
        output.push(makeEndDirective(openSection));
        openSection = null;
      }
      output.push('');
      index += 1;
      continue;
    }

    if (isDirectiveLine(rawLine)) {
      output.push(rawLine.trimEnd());
      index += 1;
      continue;
    }

    const extracted = extractChords(rawLine);
    if (extracted.isChordLine) {
      const nextLine = lines[index + 1];
      const nextSpecial = nextLine !== undefined ? convertSpecialLine(nextLine) : { kind: 'none' as const, lines: [] };
      const canMergeWithNextLyric =
        nextLine !== undefined &&
        !isBlankLine(nextLine) &&
        !isDirectiveLine(nextLine) &&
        nextSpecial.kind === 'none' &&
        !detectChordLine(nextLine);

      if (canMergeWithNextLyric) {
        output.push(mergeChordLine(extracted.chords, nextLine, {
          ...options,
          sourceLineLength: extracted.sourceLineLength,
        }));
        index += 2;
        continue;
      }

      output.push(formatChordOnlyLine(extracted.chords));
      index += 1;
      continue;
    }

    output.push(rawLine);
    index += 1;
  }

  if (openSection) {
    output.push(makeEndDirective(openSection));
  }

  return emitChordPro(output);
}

export function emitChordPro(lines: string[]): string {
  return lines.join('\n');
}
