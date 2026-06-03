"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const pdfService_1 = require("../services/pdfService");
const songService_1 = require("../services/songService");
const asyncHandler_1 = require("../utils/asyncHandler");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
exports.songRoutes = (0, express_1.Router)();
exports.songRoutes.post('/convert-txt', upload.single('file'), (0, asyncHandler_1.asyncHandler)(async (request, response) => {
    if (!request.file) {
        response.status(400).json({ message: 'Choose a TXT file before uploading.' });
        return;
    }
    const metadata = {
        title: String(request.body?.title ?? ''),
        author: String(request.body?.author ?? ''),
        key: String(request.body?.key ?? ''),
        tempo: String(request.body?.tempo ?? ''),
    };
    response.json({
        song: (0, songService_1.convertTxtBuffer)(request.file.originalname, request.file.buffer, metadata),
    });
}));
exports.songRoutes.post('/upload-cho', upload.single('file'), (0, asyncHandler_1.asyncHandler)(async (request, response) => {
    if (!request.file) {
        response.status(400).json({ message: 'Choose a CHO file before uploading.' });
        return;
    }
    response.json({
        song: (0, songService_1.prepareChoBuffer)(request.file.originalname, request.file.buffer),
    });
}));
exports.songRoutes.post('/generate-pdf', (0, asyncHandler_1.asyncHandler)(async (request, response) => {
    const content = (0, songService_1.normalizeChoContent)(String(request.body?.content ?? ''));
    const filename = String(request.body?.filename ?? 'song.pdf').trim() || 'song.pdf';
    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    const requestedColumns = Number(request.body?.columns) === 2 ? 2 : 1;
    const pdfBuffer = await (0, pdfService_1.generatePdfBuffer)(content, requestedColumns);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${safeFilename.replace(/"/g, '')}"`);
    response.send(pdfBuffer);
}));
