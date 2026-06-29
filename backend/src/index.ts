import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { testConnection } from './config/database';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import agentRoutes from './routes/agent.routes';
import campaignsRoutes from './routes/campaigns.routes';
import creatorsRoutes from './routes/creators.routes';
import streamingRoutes from './routes/streaming.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '4000', 10);
const API_PREFIX = '/api/v1';

// Security
app.use(helmet());
app.set('trust proxy', 1);

// CORS
const allowedOrigins = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10),
  max: parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMIT', message: 'Demasiadas peticiones, intenta más tarde' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, code: 'RATE_LIMIT', message: 'Demasiados intentos de autenticación' },
});

app.use(limiter);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/agent`, agentRoutes);
app.use(`${API_PREFIX}/campaigns`, campaignsRoutes);
app.use(`${API_PREFIX}/creators`, creatorsRoutes);
app.use(`${API_PREFIX}/streaming`, streamingRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  await testConnection();
  app.listen(PORT, () => {
    logger.info(`🚀 EzzeShop API running on http://localhost:${PORT}`);
    logger.info(`📖 Health check: http://localhost:${PORT}/health`);
    logger.info(`🌍 Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});

export default app;
