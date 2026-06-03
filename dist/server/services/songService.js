"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SongServiceError = void 0;
exports.ensureSongDirectories = ensureSongDirectories;
exports.convertTxtBuffer = convertTxtBuffer;
exports.prepareChoBuffer = prepareChoBuffer;
exports.normalizeChoContent = normalizeChoContent;
const node_path_1 = require("node:path");
const parser_1 = require("../../src/parser");
class SongServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'SongServiceError';
        this.statusCode = statusCode;
    }
}
exports.SongServiceError = SongServiceError;
function normalizeText(content) {
    return content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}
function sanitizeBaseName(filename) {
    const originalBase = (0, node_path_1.basename)(filename, (0, node_path_1.extname)(filename)).trim();
    const fallback = originalBase || 'song';
    return (fallback
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-_]+|[-_]+$/g, '')
        .toLowerCase() || 'song');
}
function buildMetadataBlock(metadata = {}) {
    return [
        metadata.title?.trim() ? `{title: ${metadata.title.trim()}}` : '',
        metadata.author?.trim() ? `{author: ${metadata.author.trim()}}` : '',
        metadata.key?.trim() ? `{key: ${metadata.key.trim()}}` : '',
        metadata.tempo?.trim() ? `{tempo: ${metadata.tempo.trim()}}` : '',
    ].filter(Boolean);
}
function applyMetadata(content, metadata = {}) {
    const directives = buildMetadataBlock(metadata);
    if (directives.length === 0) {
        return content;
    }
    const normalized = normalizeText(content).replace(/^\n+/, '');
    return `${directives.join('\n')}\n\n${normalized}`;
}
function ensureTxtFile(filename, contentBuffer) {
    if (!filename.toLowerCase().endsWith('.txt')) {
        throw new SongServiceError('Upload a valid .txt file.');
    }
    const content = normalizeText(contentBuffer.toString('utf8'));
    if (!content.trim()) {
        throw new SongServiceError('The TXT file is empty.');
    }
    return content;
}
function ensureChoFile(filename, contentBuffer) {
    const lower = filename.toLowerCase();
    if (!lower.endsWith('.cho') && !lower.endsWith('.chordpro')) {
        throw new SongServiceError('Upload a valid .cho file.');
    }
    const content = normalizeText(contentBuffer.toString('utf8'));
    if (!content.trim()) {
        throw new SongServiceError('The CHO file is empty.');
    }
    return content;
}
async function ensureSongDirectories() {
    return;
}
function convertTxtBuffer(filename, contentBuffer, metadata = {}) {
    const originalContent = ensureTxtFile(filename, contentBuffer);
    let choContent = '';
    try {
        choContent = (0, parser_1.parseSong)(originalContent, { mode: 'musical' });
    }
    catch (error) {
        throw new SongServiceError(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`, 500);
    }
    const finalCho = `${applyMetadata(choContent, metadata).trimEnd()}\n`;
    const baseName = sanitizeBaseName(filename);
    return {
        sourceType: 'txt',
        sourceFilename: filename,
        choFilename: `${baseName}.cho`,
        pdfFilename: `${baseName}.pdf`,
        originalContent,
        choContent: finalCho,
    };
}
function prepareChoBuffer(filename, contentBuffer) {
    const choContent = `${ensureChoFile(filename, contentBuffer).trimEnd()}\n`;
    const baseName = sanitizeBaseName(filename);
    return {
        sourceType: 'cho',
        sourceFilename: filename,
        choFilename: `${baseName}.cho`,
        pdfFilename: `${baseName}.pdf`,
        originalContent: choContent,
        choContent,
    };
}
function normalizeChoContent(choContent) {
    const normalized = normalizeText(choContent);
    if (!normalized.trim()) {
        throw new SongServiceError('The CHO editor is empty.');
    }
    return `${normalized.trimEnd()}\n`;
}
