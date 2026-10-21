/**
 * FraudLens — Full-Stack Server Entry Point
 * Runs Express backend with real REST APIs on port 3000 and mounts Vite in dev mode
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API Router
  app.use('/api', apiRouter);

  if (!isProd) {
    // Development mode: Create Vite server and use its middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FraudLens] Full-stack engine running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[FraudLens] Server startup failed:', err);
  process.exit(1);
});
