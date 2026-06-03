"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderChordProBodyHtml = renderChordProBodyHtml;
function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
function isDirectiveLine(line) {
    return /^\s*\{[^}]+\}\s*$/.test(line);
}
function isChordOnlyLine(line) {
    const withoutChords = line.replace(/\[[^\]]+\]/g, '');
    return withoutChords.trim().length === 0 && /\[[^\]]+\]/.test(line);
}
function renderChordOnlyLine(line) {
    const chords = Array.from(line.matchAll(/\[([^\]]+)\]/g), (entry) => entry[1].trim()).filter(Boolean);
    return `<div class="instrumental-line">${chords
        .map((chord) => `<span class="chord instrumental-chord">${escapeHtml(chord)}</span>`)
        .join('')}</div>`;
}
function renderLyricLine(line) {
    const chordRegex = /\[([^\]]+)\]/g;
    const matches = Array.from(line.matchAll(chordRegex));
    if (matches.length === 0) {
        return `<div class="row plain-row"><div class="lyrics">${escapeHtml(line)}</div></div>`;
    }
    const columns = [];
    let cursor = 0;
    const firstMatch = matches[0];
    if (firstMatch && firstMatch.index !== undefined && firstMatch.index > 0) {
        const prefix = line.slice(0, firstMatch.index);
        if (prefix) {
            columns.push(`<div class="column"><div class="chord chord-empty"></div><div class="lyrics">${escapeHtml(prefix)}</div></div>`);
        }
    }
    for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        const next = matches[index + 1];
        const chord = match[1].trim();
        const chordStart = match.index ?? cursor;
        const lyricStart = chordStart + match[0].length;
        const lyricEnd = next?.index ?? line.length;
        const lyric = line.slice(lyricStart, lyricEnd);
        columns.push(`<div class="column"><div class="chord">${escapeHtml(chord)}</div><div class="lyrics">${escapeHtml(lyric)}</div></div>`);
        cursor = lyricEnd;
    }
    return `<div class="row">${columns.join('')}</div>`;
}
function renderContentLine(line) {
    if (isChordOnlyLine(line)) {
        return renderChordOnlyLine(line);
    }
    return renderLyricLine(line);
}
function renderChordProBodyHtml(chordPro) {
    const lines = chordPro.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
    const paragraphs = [];
    let current = [];
    function flushParagraph() {
        if (current.length === 0) {
            return;
        }
        paragraphs.push(`<div class="paragraph">${current.join('')}</div>`);
        current = [];
    }
    for (const rawLine of lines) {
        const line = rawLine;
        if (!line.trim()) {
            flushParagraph();
            continue;
        }
        const commentMatch = line.match(/^\s*\{comment(?::|\s*:\s*)(.*?)\}\s*$/i);
        if (commentMatch) {
            current.push(`<div class="row"><div class="comment">${escapeHtml(commentMatch[1].trim())}</div></div>`);
            continue;
        }
        if (isDirectiveLine(line)) {
            continue;
        }
        current.push(renderContentLine(line));
    }
    flushParagraph();
    return `<div class="chord-sheet">${paragraphs.join('')}</div>`;
}
