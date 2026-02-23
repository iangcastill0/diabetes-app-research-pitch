import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getCurrentReading,
  getReadingsHistory,
  getTrendAnalysis,
  simulateReading,
} from '../controllers/cgmController';

const router = Router();

// All CGM routes require authentication
router.use(authenticate);

// Get current glucose reading
router.get('/current', getCurrentReading);

// Get readings history
router.get('/history', getReadingsHistory);

// Get trend analysis
router.get('/trends', getTrendAnalysis);

// Simulate reading (for development/testing)
router.post('/simulate', simulateReading);

export { router as cgmRouter };
