import { Router } from 'express';
import { healthCheck } from '@bb/database';
import { logger } from '../index';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const dbHealthy = await healthCheck();
    
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
      },
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error(error, 'Health check failed');
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export { router as healthRouter };
