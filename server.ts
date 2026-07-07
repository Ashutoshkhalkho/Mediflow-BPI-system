import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './api/app';
import { getPythonApiUrl } from './api/config/env';

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Running in DEVELOPMENT mode. Starting Vite development server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Running in PRODUCTION mode. Serving static files from dist/');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Communicating with Python FastAPI service at: ${getPythonApiUrl()}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
