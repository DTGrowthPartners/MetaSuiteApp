// ===========================================
// META CREATIVE BUILDER - Main Entry Point
// ===========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

// Import routes
import assetsRouter from './api/routes/assets.js';
import jobsRouter from './api/routes/jobs.js';
import draftsRouter from './api/routes/drafts.js';
import templatesRouter from './api/routes/templates.js';
import adAccountsRouter from './api/routes/adAccounts.js';

const app = express();

// ===========================================
// Middleware
// ===========================================

app.use(helmet());
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// ===========================================
// Routes
// ===========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Meta Creative Builder API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv
  });
});

// API routes
app.use('/api/assets', assetsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/drafts', draftsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/ad-accounts', adAccountsRouter);

// ===========================================
// Error Handling
// ===========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: config.server.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ===========================================
// Server Startup
// ===========================================

const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║        META CREATIVE BUILDER API - v1.0.0                 ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                 ║
╠═══════════════════════════════════════════════════════════╣
║  ENDPOINTS DISPONIBLES:                                   ║
║  ─────────────────────────────────────────────────────────║
║  GET  /api/health              - Health check             ║
║  POST /api/assets              - Upload asset             ║
║  GET  /api/assets/:id          - Get asset details        ║
║  POST /api/jobs                - Create new job           ║
║  GET  /api/jobs                - List jobs                ║
║  GET  /api/jobs/:id            - Get job details          ║
║  POST /api/jobs/:id/analyze    - Analyze asset with AI    ║
║  POST /api/jobs/:id/generate   - Generate copy variants   ║
║  PUT  /api/jobs/:id/select     - Select copy variants     ║
║  POST /api/jobs/:id/draft      - Create Meta draft        ║
║  GET  /api/drafts              - List drafts              ║
║  GET  /api/drafts/:id          - Get draft details        ║
║  GET  /api/templates           - List templates           ║
║  GET  /api/templates/:slug     - Get template details     ║
║  GET  /api/ad-accounts         - List ad accounts         ║
║  POST /api/ad-accounts         - Add ad account           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
