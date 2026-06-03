"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractChords = extractChords;
exports.detectChordLine = detectChordLine;
exports.convertSpecialLine = convertSpecialLine;
exports.mergeChordLine = mergeChordLine;
exports.parseSong = parseSong;
exports.emitChordPro = emitChordPro;
const alignment_1 = require("./alignment");
const CHORD_ROOT = String.raw `[A-G](?:#|b)?`;
const CHORD_SUFFIX = String.raw `(?:maj7|maj9|maj11|maj13|maj|min7|min9|min11|min13|min|mmaj7|m7b5|m6|m7|m9|m11|m13|m|dim7|dim9|dim|aug7|aug|sus2|sus4|sus|add2|add4|add6|add7|add9|add11|add13|6|7|9|11|13|5|2|4)`;
const CHORD_BODY = String.raw `${CHORD_ROOT}(?:${CHORD_SUFFIX})*(?:\([^)]+\))?(?:/[A-G](?:#|b)?)?`;
const CHORD_TOKEN_RE = new RegExp(`^(?:${CHORD_BODY}|N\\.?C\\.?|X|x|%)$`);
const LABEL_RE = /^\s*(?<label>intro|inter|intro\s+instrumental|verse|verso|coro|chorus|bridge|puente|outro|estrofa|estribillo|refrao|refrain)(?:\s+(?<number>\d+))?\s*[:\-]?\s*(?<rest>.*)$/i;
function isBlankLine(line) {
    return line.trim() === '';
}
function isDirectiveLine(line) {
    const trimmed = line.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
}
function mapLabelToSection(label) {
    const normalized = label.toLowerCase();
    if (normalized === 'verse' || normalized === 'verso' || normalized === 'estrofa')
        return 'verse';
    if (normalized === 'chorus' || normalized === 'coro' || normalized === 'estribillo' || normalized === 'refrain' || normalized === 'refrao')
        return 'chorus';
    if (normalized === 'bridge' || normalized === 'puente')
        return 'bridge';
    return null;
}
function makeSectionDirective(kind, label) {
    const directive = kind === 'verse'
        ? 'start_of_verse'
        : kind === 'chorus'
            ? 'start_of_chorus'
            : 'start_of_bridge';
    return label ? `{${directive}: ${label}}` : `{${directive}}`;
}
function makeEndDirective(kind) {
    return kind === 'verse'
        ? '{end_of_verse}'
        : kind === 'chorus'
            ? '{end_of_chorus}'
            : '{end_of_bridge}';
}
function formatChordOnlyLine(chords) {
    return chords.map((token) => `[${token.chord}]`).join(' ');
}
function isMostlyChordTokens(tokens) {
    if (tokens.length === 0)
        return false;
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
function extractChords(line) {
    const expanded = (0, alignment_1.expandTabs)(line);
    const tokens = [];
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
        isChordLine: isMostlyChordTokens(Array.from(expanded.matchAll(/\S+/g), (match) => ({ text: match[0] }))),
        sourceLineLength: expanded.length,
    };
}
function detectChordLine(line) {
    return extractChords(line).isChordLine;
}
function parseLabelLine(line) {
    const match = LABEL_RE.exec(line);
    if (!match?.groups)
        return null;
    const label = match.groups.label;
    const number = match.groups.number;
    const rest = match.groups.rest ?? '';
    const normalized = label.toLowerCase();
    if (normalized === 'intro' || normalized === 'inter' || normalized === 'outro') {
        return { label, number, rest };
    }
    const section = mapLabelToSection(label);
    if (!section)
        return null;
    return { label, number, rest };
}
function convertSpecialLine(line) {
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
    const isInstrumentalMarker = normalized === 'intro' ||
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
function mergeChordLine(chords, lyricLine, options = {}) {
    if (options.mode === 'strict') {
        return (0, alignment_1.alignChordLineStrict)(chords, lyricLine);
    }
    return (0, alignment_1.alignChordLineMusical)(chords, lyricLine, {
        debugLogger: options.debugLogger,
        sourceLineLength: options.sourceLineLength,
    }).line;
}
function parseSong(text, options = {}) {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const output = [];
    let openSection = null;
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
            const nextSpecial = nextLine !== undefined ? convertSpecialLine(nextLine) : { kind: 'none', lines: [] };
            const canMergeWithNextLyric = nextLine !== undefined &&
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
function emitChordPro(lines) {
    return lines.join('\n');
}
