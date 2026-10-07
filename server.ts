/**
 * ANISA HQ — Full-Stack Server
 * Express Server with Vite middlewares in development
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/api/routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API routes
  app.use('/api', apiRouter);

  if (!isProd) {
    // Development mode: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ANISA HQ] Server operational at http://localhost:${PORT}`);
    console.log(`[Gather Office Sync] Linked to https://app.v2.gather.town/app/b4d5424e-dc10-4219-90cb-b367b14ba97f`);
    console.log(`[GitHub Gateway] Active for owner AndyMagwayer`);
  });
}

startServer().catch((err) => {
  console.error('[ANISA HQ Server Error]:', err);
  process.exit(1);
});
