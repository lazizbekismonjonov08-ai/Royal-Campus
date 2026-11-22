import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.use(express.json());

// Cloud Run and container health check endpoints
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Static assets from Vite production build
const distPath = path.resolve(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback: return index.html for all non-file routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(200).send('Royal Campus application server is running.');
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Royal Campus production server running on http://${HOST}:${PORT}`);
});
