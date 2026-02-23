import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Logger } from 'pino';
import { JWT_CONFIG } from '@bb/config';
import { query } from '@bb/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupWebSocketHandlers = (io: SocketIOServer, logger: Logger): void => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as { id: string };
      socket.userId = decoded.id;
      next();
    } catch (error) {
      logger.warn({ error }, 'WebSocket authentication failed');
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    
    logger.info({ userId, socketId: socket.id }, 'Client connected to CGM stream');

    // Join user-specific room
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Send current reading
    sendCurrentReading(socket, userId);

    // Handle client subscribing to real-time updates
    socket.on('subscribe:cgm', () => {
      logger.info({ userId }, 'Subscribed to CGM updates');
      socket.emit('subscribed', { channel: 'cgm' });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info({ userId, socketId: socket.id }, 'Client disconnected from CGM stream');
    });
  });

  // Simulate real-time data push (in production, this would come from actual CGM devices)
  setInterval(async () => {
    try {
      // Get all connected users
      const rooms = io.sockets.adapter.rooms;
      
      for (const [roomName] of rooms) {
        if (roomName.startsWith('user:')) {
          const userId = roomName.replace('user:', '');
          
          // Get latest reading for this user
          const result = await query(
            `SELECT glucose_value_mg_dl, trend_direction, trend_rate_mg_dl_per_minute
             FROM cgm_readings 
             WHERE user_id = $1 
             ORDER BY time DESC 
             LIMIT 1`,
            [userId]
          );

          if (result.rowCount && result.rowCount > 0) {
            const reading = result.rows[0];
            
            io.to(roomName).emit('cgm:update', {
              glucoseValueMgDl: reading.glucose_value_mg_dl,
              trendDirection: reading.trend_direction,
              trendRateMgDlPerMinute: reading.trend_rate_mg_dl_per_minute,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      logger.error(error, 'Error pushing CGM updates');
    }
  }, 30000); // Every 30 seconds
};

const sendCurrentReading = async (socket: AuthenticatedSocket, userId?: string): Promise<void> => {
  if (!userId) return;

  try {
    const result = await query(
      `SELECT glucose_value_mg_dl, trend_direction, trend_rate_mg_dl_per_minute
       FROM cgm_readings 
       WHERE user_id = $1 
       ORDER BY time DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rowCount && result.rowCount > 0) {
      const reading = result.rows[0];
      socket.emit('cgm:current', {
        glucoseValueMgDl: reading.glucose_value_mg_dl,
        trendDirection: reading.trend_direction,
        trendRateMgDlPerMinute: reading.trend_rate_mg_dl_per_minute,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    socket.emit('error', { message: 'Failed to fetch current reading' });
  }
};
