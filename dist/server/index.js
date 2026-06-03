"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const node_path_1 = require("node:path");
const songRoutes_1 = require("./routes/songRoutes");
const songService_1 = require("./services/songService");
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 5174);
const clientBuildDir = (0, node_path_1.resolve)(process.cwd(), 'dist', 'client');
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '2mb' }));
app.use('/api', songRoutes_1.songRoutes);
app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
});
app.use(express_1.default.static(clientBuildDir));
app.get('/{*path}', (request, response, next) => {
    if (request.path.startsWith('/api')) {
        next();
        return;
    }
    response.sendFile((0, node_path_1.join)(clientBuildDir, 'index.html'));
});
app.use((error, _request, response, _next) => {
    if (error instanceof songService_1.SongServiceError) {
        response.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (typeof error === 'object' && error && 'name' in error && error.name === 'MulterError') {
        response.status(400).json({ message: 'The upload is too large. Use a TXT file under 2 MB.' });
        return;
    }
    console.error(error);
    response.status(500).json({ message: 'Something went wrong while processing the song.' });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
