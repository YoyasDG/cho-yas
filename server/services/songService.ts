import { basename, extname } from 'node:path';
import { parseSong } from '../../src/parser';

export interface ChordProMetadata {
  title?: string;
  author?: string;
  key?: string;
  tempo?: string;
}

export interface SessionSong {
  sourceType: 'txt' | 'cho';
  sourceFilename: string;
  choFilename: string;
  pdfFilename: string;
  originalContent: string;
  choContent: string;
}

export class SongServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'SongServiceError';
    this.statusCode = statusCode;
  }
}

function normalizeText(content: string): string {
  return content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function sanitizeBaseName(filename: string): string {
  const originalBase = basename(filename, extname(filename)).trim();
  const fallback = originalBase || 'song';

  return (
    fallback
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '')
      .toLowerCase() || 'song'
  );
}

function buildMetadataBlock(metadata: ChordProMetadata = {}): string[] {
  return [
    metadata.title?.trim() ? `{title: ${metadata.title.trim()}}` : '',
    metadata.author?.trim() ? `{author: ${metadata.author.trim()}}` : '',
    metadata.key?.trim() ? `{key: ${metadata.key.trim()}}` : '',
    metadata.tempo?.trim() ? `{tempo: ${metadata.tempo.trim()}}` : '',
  ].filter(Boolean);
}

function applyMetadata(content: string, metadata: ChordProMetadata = {}): string {
  const directives = buildMetadataBlock(metadata);
  if (directives.length === 0) {
    return content;
  }

  const normalized = normalizeText(content).replace(/^\n+/, '');
  return `${directives.join('\n')}\n\n${normalized}`;
}

function ensureTxtFile(filename: string, contentBuffer: Buffer): string {
  if (!filename.toLowerCase().endsWith('.txt')) {
    throw new SongServiceError('Upload a valid .txt file.');
  }

  const content = normalizeText(contentBuffer.toString('utf8'));
  if (!content.trim()) {
    throw new SongServiceError('The TXT file is empty.');
  }

  return content;
}

function ensureChoFile(filename: string, contentBuffer: Buffer): string {
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

export async function ensureSongDirectories(): Promise<void> {
  return;
}

export function convertTxtBuffer(filename: string, contentBuffer: Buffer, metadata: ChordProMetadata = {}): SessionSong {
  const originalContent = ensureTxtFile(filename, contentBuffer);

  let choContent = '';
  try {
    choContent = parseSong(originalContent, { mode: 'musical' });
  } catch (error) {
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

export function prepareChoBuffer(filename: string, contentBuffer: Buffer): SessionSong {
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

export function normalizeChoContent(choContent: string): string {
  const normalized = normalizeText(choContent);
  if (!normalized.trim()) {
    throw new SongServiceError('The CHO editor is empty.');
  }

  return `${normalized.trimEnd()}\n`;
}
