import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { join, resolve } from 'node:path';
import { songRoutes } from './routes/songRoutes';
import { SongServiceError } from './services/songService';

const app = express();
const port = Number(process.env.PORT ?? 5174);
const clientBuildDir = resolve(process.cwd(), 'dist', 'client');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api', songRoutes);

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.use(express.static(clientBuildDir));

app.get('/{*path}', (request, response, next) => {
  if (request.path.startsWith('/api')) {
    next();
    return;
  }

  response.sendFile(join(clientBuildDir, 'index.html'));
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof SongServiceError) {
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
