import { Request, Response } from 'express';
import { query } from '@bb/database';
import { ApiResponse, CGMReading } from '@bb/shared-types';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../index';
import { calculateTrend } from '../utils/trends';

// Get current glucose reading
export const getCurrentReading = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  const result = await query(
    `SELECT id, time, user_id, device_id, provider, glucose_value_mg_dl,
            trend_direction, trend_rate_mg_dl_per_minute, quality
     FROM cgm_readings 
     WHERE user_id = $1 
     ORDER BY time DESC 
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) {
    res.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const reading = result.rows[0];

  const response: ApiResponse<CGMReading> = {
    success: true,
    data: {
      id: reading.id,
      userId: reading.user_id,
      deviceId: reading.device_id,
      provider: reading.provider,
      timestamp: reading.time,
      glucoseValueMgDl: reading.glucose_value_mg_dl,
      trendDirection: reading.trend_direction,
      trendRateMgDlPerMinute: reading.trend_rate_mg_dl_per_minute,
      quality: reading.quality,
      createdAt: reading.time,
      updatedAt: reading.time,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

// Get readings history
export const getReadingsHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const hours = parseInt(req.query.hours as string || '24', 10);
  const limit = Math.min(parseInt(req.query.limit as string || '288', 10), 1000);

  if (hours < 1 || hours > 168) { // Max 7 days
    throw new CustomError('Hours must be between 1 and 168', 400, 'INVALID_RANGE');
  }

  const result = await query(
    `SELECT id, time, user_id, device_id, provider, glucose_value_mg_dl,
            trend_direction, trend_rate_mg_dl_per_minute, quality
     FROM cgm_readings 
     WHERE user_id = $1 
       AND time > NOW() - INTERVAL '${hours} hours'
     ORDER BY time DESC 
     LIMIT $2`,
    [userId, limit]
  );

  const readings: CGMReading[] = result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    deviceId: row.device_id,
    provider: row.provider,
    timestamp: row.time,
    glucoseValueMgDl: row.glucose_value_mg_dl,
    trendDirection: row.trend_direction,
    trendRateMgDlPerMinute: row.trend_rate_mg_dl_per_minute,
    quality: row.quality,
    createdAt: row.time,
    updatedAt: row.time,
  }));

  const response: ApiResponse<CGMReading[]> = {
    success: true,
    data: readings,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

// Get trend analysis
export const getTrendAnalysis = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const hours = parseInt(req.query.hours as string || '3', 10);

  const result = await query(
    `SELECT time, glucose_value_mg_dl
     FROM cgm_readings 
     WHERE user_id = $1 
       AND time > NOW() - INTERVAL '${hours} hours'
     ORDER BY time ASC`,
    [userId]
  );

  if (result.rowCount === 0) {
    res.json({
      success: true,
      data: {
        readings: 0,
        average: null,
        min: null,
        max: null,
        trend: null,
        timeInRange: null,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const values = result.rows.map(r => r.glucose_value_mg_dl);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate time in range (70-180 mg/dL)
  const inRange = values.filter(v => v >= 70 && v <= 180).length;
  const timeInRange = (inRange / values.length) * 100;

  // Calculate trend
  const trend = calculateTrend(values);

  res.json({
    success: true,
    data: {
      readings: values.length,
      average: Math.round(average),
      min,
      max,
      trend,
      timeInRange: Math.round(timeInRange * 10) / 10,
    },
    timestamp: new Date().toISOString(),
  });
};

// Simulate a reading (for development)
export const simulateReading = async (req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new CustomError('Simulation not available in production', 403, 'NOT_ALLOWED');
  }

  const userId = req.user?.id;
  const { glucoseValue, trend } = req.body;

  const reading = {
    id: crypto.randomUUID(),
    userId,
    deviceId: 'SIMULATED_DEVICE',
    provider: 'dexcom' as const,
    timestamp: new Date(),
    glucoseValueMgDl: glucoseValue || Math.floor(Math.random() * 200) + 60,
    trendDirection: trend || 'steady',
    trendRateMgDlPerMinute: 0,
    quality: 'high' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await query(
    `INSERT INTO cgm_readings (
      id, time, user_id, device_id, provider, glucose_value_mg_dl,
      trend_direction, trend_rate_mg_dl_per_minute, quality
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      reading.id,
      reading.timestamp,
      reading.userId,
      reading.deviceId,
      reading.provider,
      reading.glucoseValueMgDl,
      reading.trendDirection,
      reading.trendRateMgDlPerMinute,
      reading.quality,
    ]
  );

  logger.info({ userId, glucose: reading.glucoseValueMgDl }, 'Simulated CGM reading');

  const response: ApiResponse<CGMReading> = {
    success: true,
    data: reading,
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
};
