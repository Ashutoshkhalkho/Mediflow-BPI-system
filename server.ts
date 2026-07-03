import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './app';
import { startPythonService } from './server/services/python_runner';

const PORT = 3000;

// Vite Setup (Development vs. Production)
async function startServer() {
  // Start Python FastAPI Service in background
  await startPythonService();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
