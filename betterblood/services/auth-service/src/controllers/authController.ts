import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import { Request, Response } from 'express';

import { JWT_CONFIG, SECURITY_CONFIG } from '@bb/config';
import { query, withTransaction } from '@bb/database';
import { User, ApiResponse } from '@bb/shared-types';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../index';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const generateTokens = (user: User): AuthTokens => {
  const accessToken = jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    },
    JWT_CONFIG.SECRET,
    { 
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      algorithm: JWT_CONFIG.ALGORITHM as jwt.Algorithm,
    }
  );

  const refreshToken = uuidv4();
  const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

  return { accessToken, refreshToken, expiresIn };
};

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_ROUNDS);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName } = req.body;

  // Check if user exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rowCount && existingUser.rowCount > 0) {
    throw new CustomError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(password);
  const userId = uuidv4();

  await query(
    `INSERT INTO users (
      id, email, password_hash, role, verification_status, profile, settings,
      mfa_enabled, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [
      userId,
      email,
      passwordHash,
      'patient',
      'pending',
      JSON.stringify({ firstName, lastName }),
      JSON.stringify({
        glucoseUnit: 'mg_dl',
        targetRangeMin: 80,
        targetRangeMax: 180,
        insulinToCarbRatio: 15,
        insulinSensitivityFactor: 50,
        insulinDuration: 4,
      }),
      false,
    ]
  );

  logger.info({ userId, email }, 'New user registered');

  const response: ApiResponse<{ userId: string; message: string }> = {
    success: true,
    data: {
      userId,
      message: 'Registration successful. Please verify your email.',
    },
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, mfaToken } = req.body;

  const result = await query(
    `SELECT id, email, password_hash, role, verification_status, profile, 
            settings, mfa_enabled, mfa_secret
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rowCount === 0) {
    throw new CustomError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new CustomError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check MFA if enabled
  if (user.mfa_enabled) {
    if (!mfaToken) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MFA_REQUIRED',
          message: 'MFA token required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: mfaToken,
      window: 1,
    });

    if (!verified) {
      throw new CustomError('Invalid MFA token', 401, 'INVALID_MFA');
    }
  }

  // Generate tokens
  const tokens = generateTokens(user);

  // Store refresh token
  const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      user.id,
      refreshTokenHash,
      expiresAt,
      req.ip,
      req.get('user-agent'),
    ]
  );

  logger.info({ userId: user.id }, 'User logged in');

  const response: ApiResponse<{
    user: Partial<User>;
    tokens: AuthTokens;
  }> = {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationStatus: user.verification_status,
        profile: user.profile,
        settings: user.settings,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  // Find non-revoked refresh tokens for the user
  const tokenResult = await query(
    `SELECT rt.id, rt.user_id, rt.token_hash, rt.expires_at,
            u.email, u.role, u.verification_status, u.profile, u.settings
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.expires_at > NOW() AND rt.revoked_at IS NULL`,
    []
  );

  let validToken = null;
  let userId = null;

  for (const row of tokenResult.rows) {
    const isValid = await bcrypt.compare(refreshToken, row.token_hash);
    if (isValid) {
      validToken = row;
      userId = row.user_id;
      break;
    }
  }

  if (!validToken) {
    throw new CustomError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Revoke old token
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
    [validToken.id]
  );

  // Generate new tokens
  const user: User = {
    id: validToken.user_id,
    email: validToken.email,
    role: validToken.role,
    verificationStatus: validToken.verification_status,
    profile: validToken.profile,
    settings: validToken.settings,
    // Other required fields
    passwordHash: '',
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tokens = generateTokens(user);

  // Store new refresh token
  const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, newRefreshTokenHash, expiresAt]
  );

  const response: ApiResponse<AuthTokens> = {
    success: true,
    data: tokens,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const token = req.token;

  if (token) {
    // Revoke all refresh tokens for this user session
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }

  logger.info({ userId }, 'User logged out');

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
    timestamp: new Date().toISOString(),
  });
};

// Verify email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  // Placeholder - implement email verification logic
  res.json({
    success: true,
    data: { message: 'Email verification placeholder' },
    timestamp: new Date().toISOString(),
  });
};

// Setup MFA
export const setupMFA = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  const secret = speakeasy.generateSecret({
    name: `BetterBlood:${req.user?.email}`,
    length: 32,
  });

  // Store secret temporarily (not enabled until verified)
  await query(
    'UPDATE users SET mfa_secret = $1 WHERE id = $2',
    [secret.base32, userId]
  );

  const response: ApiResponse<{
    secret: string;
    qrCodeUrl: string;
  }> = {
    success: true,
    data: {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || '',
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

// Verify and enable MFA
export const verifyMFA = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { token } = req.body;

  const result = await query(
    'SELECT mfa_secret FROM users WHERE id = $1',
    [userId]
  );

  if (result.rowCount === 0 || !result.rows[0].mfa_secret) {
    throw new CustomError('MFA not set up', 400, 'MFA_NOT_SETUP');
  }

  const verified = speakeasy.totp.verify({
    secret: result.rows[0].mfa_secret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) {
    throw new CustomError('Invalid MFA token', 401, 'INVALID_MFA');
  }

  // Enable MFA
  await query(
    'UPDATE users SET mfa_enabled = true WHERE id = $1',
    [userId]
  );

  res.json({
    success: true,
    data: { message: 'MFA enabled successfully' },
    timestamp: new Date().toISOString(),
  });
};
