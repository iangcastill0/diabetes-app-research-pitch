import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pino } from 'pino';

import { SERVER_CONFIG } from '@bb/config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { foodRouter } from './routes/food';
import { mealRouter } from './routes/meals';
import { healthRouter } from './routes/health';

const logger = pino({
  name: 'food-service',
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGINS,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/health', healthRouter);
app.use('/api/v1/food', foodRouter);
app.use('/api/v1/meals', mealRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3003', 10);

const server = app.listen(PORT, () => {
  logger.info(`Food Service running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, logger };
