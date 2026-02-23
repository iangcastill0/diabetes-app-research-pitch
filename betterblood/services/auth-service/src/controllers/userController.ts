import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '@bb/database';
import { ApiResponse, User } from '@bb/shared-types';
import { CustomError } from '../middleware/errorHandler';
import { SECURITY_CONFIG } from '@bb/config';
import { logger } from '../index';

// Get user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  const result = await query(
    `SELECT id, email, role, verification_status, profile, settings,
            cgm_connection, mfa_enabled, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
  }

  const user = result.rows[0];

  const response: ApiResponse<Partial<User>> = {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verification_status,
      profile: user.profile,
      settings: user.settings,
      cgmConnection: user.cgm_connection,
      mfaEnabled: user.mfa_enabled,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

// Update profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { firstName, lastName, dateOfBirth } = req.body;

  // Get current profile
  const currentResult = await query(
    'SELECT profile FROM users WHERE id = $1',
    [userId]
  );

  if (currentResult.rowCount === 0) {
    throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
  }

  const currentProfile = currentResult.rows[0].profile || {};

  const updatedProfile = {
    ...currentProfile,
    ...(firstName !== undefined && { firstName }),
    ...(lastName !== undefined && { lastName }),
    ...(dateOfBirth !== undefined && { dateOfBirth }),
  };

  await query(
    'UPDATE users SET profile = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(updatedProfile), userId]
  );

  logger.info({ userId }, 'User profile updated');

  res.json({
    success: true,
    data: { message: 'Profile updated successfully' },
    timestamp: new Date().toISOString(),
  });
};

// Update settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const {
    glucoseUnit,
    targetRangeMin,
    targetRangeMax,
    insulinToCarbRatio,
    insulinSensitivityFactor,
  } = req.body;

  // Get current settings
  const currentResult = await query(
    'SELECT settings FROM users WHERE id = $1',
    [userId]
  );

  if (currentResult.rowCount === 0) {
    throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
  }

  const currentSettings = currentResult.rows[0].settings || {};

  const updatedSettings = {
    ...currentSettings,
    ...(glucoseUnit !== undefined && { glucoseUnit }),
    ...(targetRangeMin !== undefined && { targetRangeMin }),
    ...(targetRangeMax !== undefined && { targetRangeMax }),
    ...(insulinToCarbRatio !== undefined && { insulinToCarbRatio }),
    ...(insulinSensitivityFactor !== undefined && { insulinSensitivityFactor }),
  };

  await query(
    'UPDATE users SET settings = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(updatedSettings), userId]
  );

  logger.info({ userId }, 'User settings updated');

  res.json({
    success: true,
    data: { message: 'Settings updated successfully' },
    timestamp: new Date().toISOString(),
  });
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  // Get current password hash
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rowCount === 0) {
    throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Verify current password
  const isValidCurrent = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isValidCurrent) {
    throw new CustomError('Current password is incorrect', 401, 'INVALID_PASSWORD');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, SECURITY_CONFIG.BCRYPT_ROUNDS);

  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );

  // Revoke all refresh tokens
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );

  logger.info({ userId }, 'User password changed');

  res.json({
    success: true,
    data: { message: 'Password changed successfully. Please log in again.' },
    timestamp: new Date().toISOString(),
  });
};
