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

export type PdfColumnCount = 1 | 2;

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Request failed.');
  }

  return response.json() as Promise<T>;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function convertTxt(file: File, metadata: ChordProMetadata): Promise<SessionSong> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', metadata.title ?? '');
  formData.append('author', metadata.author ?? '');
  formData.append('key', metadata.key ?? '');
  formData.append('tempo', metadata.tempo ?? '');

  const payload = await parseResponse<{ song: SessionSong }>(
    await fetch('/api/convert-txt', {
      method: 'POST',
      body: formData,
    }),
  );

  return payload.song;
}

export async function uploadCho(file: File): Promise<SessionSong> {
  const formData = new FormData();
  formData.append('file', file);
  const payload = await parseResponse<{ song: SessionSong }>(
    await fetch('/api/upload-cho', {
      method: 'POST',
      body: formData,
    }),
  );

  return payload.song;
}

export async function generatePdf(content: string, filename: string, columns: PdfColumnCount): Promise<Blob> {
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, filename, columns }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'PDF generation failed.');
  }

  return response.blob();
}

export function downloadCho(content: string, filename: string): void {
  triggerDownload(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename);
}

export function downloadPdf(blob: Blob, filename: string): void {
  triggerDownload(blob, filename);
}
