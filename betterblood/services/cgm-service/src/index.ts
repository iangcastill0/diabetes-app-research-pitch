import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { pino } from 'pino';

import { SERVER_CONFIG } from '@bb/config';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { cgmRouter } from './routes/cgm';
import { healthRouter } from './routes/health';
import { setupWebSocketHandlers } from './websocket/handlers';

const logger = pino({
  name: 'cgm-service',
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const app: Application = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: SERVER_CONFIG.CORS_ORIGINS,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGINS,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/health', healthRouter);
app.use('/api/v1/cgm', cgmRouter);

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

// WebSocket setup
setupWebSocketHandlers(io, logger);

const PORT = parseInt(process.env.PORT || '3002', 10);

const server = httpServer.listen(PORT, () => {
  logger.info(`CGM Service running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  io.close(() => {
    logger.info('WebSocket server closed');
  });
  
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

export { app, logger, io };
