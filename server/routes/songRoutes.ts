import { Router } from 'express';
import multer from 'multer';
import { generatePdfBuffer, type PdfColumnCount } from '../services/pdfService';
import {
  convertTxtBuffer,
  normalizeChoContent,
  prepareChoBuffer,
  type ChordProMetadata,
} from '../services/songService';
import { asyncHandler } from '../utils/asyncHandler';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const songRoutes = Router();

songRoutes.post('/convert-txt', upload.single('file'), asyncHandler(async (request, response) => {
  if (!request.file) {
    response.status(400).json({ message: 'Choose a TXT file before uploading.' });
    return;
  }

  const metadata: ChordProMetadata = {
    title: String(request.body?.title ?? ''),
    author: String(request.body?.author ?? ''),
    key: String(request.body?.key ?? ''),
    tempo: String(request.body?.tempo ?? ''),
  };

  response.json({
    song: convertTxtBuffer(request.file.originalname, request.file.buffer, metadata),
  });
}));

songRoutes.post('/upload-cho', upload.single('file'), asyncHandler(async (request, response) => {
  if (!request.file) {
    response.status(400).json({ message: 'Choose a CHO file before uploading.' });
    return;
  }

  response.json({
    song: prepareChoBuffer(request.file.originalname, request.file.buffer),
  });
}));

songRoutes.post('/generate-pdf', asyncHandler(async (request, response) => {
  const content = normalizeChoContent(String(request.body?.content ?? ''));
  const filename = String(request.body?.filename ?? 'song.pdf').trim() || 'song.pdf';
  const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  const requestedColumns = Number(request.body?.columns) === 2 ? 2 : 1;
  const pdfBuffer = await generatePdfBuffer(content, requestedColumns as PdfColumnCount);

  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `attachment; filename="${safeFilename.replace(/"/g, '')}"`);
  response.send(pdfBuffer);
}));
