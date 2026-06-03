import type { ChordToken } from './parser';

export type AlignmentMode = 'strict' | 'musical';

export interface AlignmentDebugEntry {
  chord: string;
  originalColumn: number;
  relativePosition: number;
  targetPosition: number;
  chosenPosition: number;
  reason: string;
}

export interface AlignmentDecision {
  chord: ChordToken;
  targetPosition: number;
  chosenPosition: number;
  reason: string;
}

export interface MusicalAlignmentOptions {
  debugLogger?: (entry: AlignmentDebugEntry) => void;
  sourceLineLength?: number;
}

const PROJECTION_BLEND = 0;

const WORD_CHAR_RE = /[\p{L}\p{N}]/u;
const VOWEL_RE = /[aeiouáéíóúüAEIOUÁÉÍÓÚÜ]/u;
const WHITESPACE_RE = /\s/u;

export function expandTabs(line: string, tabSize = 8): string {
  let expanded = '';
  let column = 0;

  for (const char of line) {
    if (char === '\t') {
      const spaces = tabSize - (column % tabSize);
      expanded += ' '.repeat(spaces);
      column += spaces;
      continue;
    }

    expanded += char;
    column += 1;
  }

  return expanded;
}

function isWordChar(char: string | undefined): boolean {
  return char ? WORD_CHAR_RE.test(char) : false;
}

function getWordSpan(line: string, index: number): { start: number; end: number; length: number } {
  let start = index;
  let end = index;

  while (start > 0 && isWordChar(line[start - 1])) {
    start -= 1;
  }

  while (end < line.length && isWordChar(line[end])) {
    end += 1;
  }

  return { start, end, length: Math.max(0, end - start) };
}

function classifyPosition(
  lyricLine: string,
  index: number,
  syllableBreaks: Set<number>,
): { score: number; reason: string } {
  const left = lyricLine[index - 1];
  const right = lyricLine[index];
  const leftWord = isWordChar(left);
  const rightWord = isWordChar(right);
  const wordSpan = getWordSpan(lyricLine, index);

  if (index === 0 || index === lyricLine.length) {
    return index === 0
      ? { score: 0.5, reason: 'line edge' }
      : { score: 1.5, reason: 'line edge' };
  }

  if (!leftWord && !rightWord) {
    return { score: -1, reason: 'whitespace boundary' };
  }

  if (!leftWord && rightWord) {
    const afterWhitespaceBonus = WHITESPACE_RE.test(left ?? '') ? -1.5 : -0.5;
    return { score: afterWhitespaceBonus, reason: 'word start' };
  }

  if (leftWord && !rightWord) {
    return { score: 4, reason: 'word ending' };
  }

  const distanceFromWordStart = index - wordSpan.start;
  const distanceToWordEnd = wordSpan.end - index;

  if (distanceFromWordStart <= 1) {
    return { score: -0.5, reason: 'near word start' };
  }

  if (distanceToWordEnd <= 1) {
    return { score: 5, reason: 'near word ending' };
  }

  if (syllableBreaks.has(index)) {
    return { score: 1, reason: 'syllable boundary' };
  }

  return { score: wordSpan.length >= 6 ? 3.5 : 2.5, reason: 'inside word' };
}

function approximateSyllableBreaks(line: string): number[] {
  // Extension point: we only approximate syllables using vowel-group
  // transitions for now. A real syllabifier can replace this later.
  // Future versions can swap this for proper syllabification without touching
  // the alignment API.
  const breaks = new Set<number>();

  for (let index = 0; index < line.length; ) {
    if (!isWordChar(line[index])) {
      index += 1;
      continue;
    }

    const start = index;
    while (index < line.length && isWordChar(line[index])) {
      index += 1;
    }

    const end = index;
    const vowelPositions: number[] = [];
    for (let position = start; position < end; position += 1) {
      if (VOWEL_RE.test(line[position])) {
        vowelPositions.push(position);
      }
    }

    if (vowelPositions.length > 1) {
      for (const position of vowelPositions.slice(1)) {
        breaks.add(position);
      }
    }

    const lastVowel = vowelPositions[vowelPositions.length - 1];
    if (lastVowel !== undefined && lastVowel + 1 < end) {
      breaks.add(lastVowel + 1);
    }
  }

  return Array.from(breaks);
}

function isOccupied(occupied: Set<number>, index: number): boolean {
  return occupied.has(index);
}

export function formatAlignmentDebug(entry: AlignmentDebugEntry): string {
  return [
    `Chord: ${entry.chord}`,
    `Original Column: ${entry.originalColumn}`,
    `Relative Position: ${Math.round(entry.relativePosition * 100)}%`,
    `Target Position: ${entry.targetPosition}`,
    `Chosen Position: ${entry.chosenPosition}`,
    `Reason: ${entry.reason}`,
  ].join('\n');
}

function scoreCandidate(
  lyricLine: string,
  candidateIndex: number,
  targetPosition: number,
  occupied: Set<number>,
  syllableBreaks: number[],
): { score: number; distance: number; reason: string } {
  const base = classifyPosition(lyricLine, candidateIndex, new Set(syllableBreaks));
  const occupiedPenalty = isOccupied(occupied, candidateIndex) ? 1000 : 0;
  const distance = Math.abs(candidateIndex - targetPosition);

  return {
    score: distance + base.score + occupiedPenalty,
    distance,
    reason: base.reason,
  };
}

export function alignChordLineMusical(
  chords: ChordToken[],
  lyricLine: string,
  options: MusicalAlignmentOptions = {},
): { line: string; decisions: AlignmentDecision[] } {
  const expandedLyric = expandTabs(lyricLine);
  const lyricLength = expandedLyric.length;
  const chordLineLength = Math.max(
    1,
    options.sourceLineLength ?? Math.max(...chords.map((chord) => chord.index + chord.chord.length), 0),
  );
  const syllableBreaks = approximateSyllableBreaks(expandedLyric);
  const decisions: AlignmentDecision[] = [];
  const occupied = new Set<number>();

  const sortedChords = [...chords].sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return a.order - b.order;
  });

  for (const chord of sortedChords) {
    const relativePosition = chordLineLength === 0 ? 0 : chord.index / chordLineLength;
    const scaledTarget = relativePosition * lyricLength;
    const projectedTarget = chord.index + (scaledTarget - chord.index) * PROJECTION_BLEND;
    const targetPosition = Math.max(0, Math.min(lyricLength, Math.round(projectedTarget)));
    const windowStart = Math.max(0, targetPosition - 3);
    const windowEnd = Math.min(expandedLyric.length, targetPosition + 3);

    let chosenPosition = Math.min(targetPosition, expandedLyric.length);
    let reason = 'projected position';
    let bestScore = Number.POSITIVE_INFINITY;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let candidateIndex = windowStart; candidateIndex <= windowEnd; candidateIndex += 1) {
      const candidate = scoreCandidate(expandedLyric, candidateIndex, targetPosition, occupied, syllableBreaks);

      if (
        candidate.score < bestScore ||
        (candidate.score === bestScore && candidate.distance < bestDistance) ||
        (candidate.score === bestScore &&
          candidate.distance === bestDistance &&
          Math.abs(candidateIndex - targetPosition) < Math.abs(chosenPosition - targetPosition))
      ) {
        bestScore = candidate.score;
        bestDistance = candidate.distance;
        chosenPosition = candidateIndex;
        reason = candidate.reason;
      }
    }

    occupied.add(chosenPosition);

    const debugEntry: AlignmentDebugEntry = {
      chord: chord.chord,
      originalColumn: chord.index,
      relativePosition,
      targetPosition,
      chosenPosition,
      reason,
    };

    options.debugLogger?.(debugEntry);

    decisions.push({
      chord,
      targetPosition,
      chosenPosition,
      reason,
    });
  }

  let result = expandedLyric;
  const ordered = [...decisions].sort((a, b) => {
    if (a.chosenPosition !== b.chosenPosition) return b.chosenPosition - a.chosenPosition;
    return b.chord.order - a.chord.order;
  });

  for (let index = 0; index < ordered.length; ) {
    const position = ordered[index].chosenPosition;
    const group: AlignmentDecision[] = [];

    while (index < ordered.length && ordered[index].chosenPosition === position) {
      group.push(ordered[index]);
      index += 1;
    }

    if (position > result.length) {
      result += ' '.repeat(position - result.length);
    }

    const payload = group.map((decision) => `[${decision.chord.chord}]`).join(' ');
    result = result.slice(0, position) + payload + result.slice(position);
  }

  return { line: result, decisions };
}

export function alignChordLineStrict(chords: ChordToken[], lyricLine: string): string {
  const expandedLyric = expandTabs(lyricLine);
  const orderedBySource = [...chords].sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return a.order - b.order;
  });

  let insertedWidth = 0;
  const adjusted = orderedBySource.map((chord) => {
    const targetIndex = Math.max(0, chord.index - insertedWidth);
    insertedWidth += chord.chord.length + 2;
    return { ...chord, targetIndex };
  });

  const ordered = adjusted.sort((a, b) => {
    if (a.targetIndex !== b.targetIndex) return b.targetIndex - a.targetIndex;
    return b.order - a.order;
  });

  let result = expandedLyric;
  for (const chord of ordered) {
    let targetIndex = chord.targetIndex;

    if (targetIndex < result.length && WHITESPACE_RE.test(result[targetIndex] ?? '')) {
      while (targetIndex < result.length && WHITESPACE_RE.test(result[targetIndex] ?? '')) {
        targetIndex += 1;
      }
    }

    if (targetIndex > result.length) {
      result += ' '.repeat(targetIndex - result.length);
    }

    result = result.slice(0, targetIndex) + `[${chord.chord}]` + result.slice(targetIndex);
  }

  return result;
}
