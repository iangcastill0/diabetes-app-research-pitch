import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  setupMFA,
  verifyMFA,
} from '../controllers/authController';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    validate,
  ],
  register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    body('mfaToken').optional().isLength({ min: 6, max: 6 }).isNumeric(),
    validate,
  ],
  login
);

// Refresh token
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token required'),
    validate,
  ],
  refreshToken
);

// Logout
router.post('/logout', authenticate, logout);

// Verify email
router.get('/verify-email/:token', verifyEmail);

// MFA setup (protected)
router.post('/mfa/setup', authenticate, setupMFA);

// MFA verification
router.post(
  '/mfa/verify',
  [
    body('token').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid MFA token required'),
    validate,
  ],
  authenticate,
  verifyMFA
);

export { router as authRouter };
