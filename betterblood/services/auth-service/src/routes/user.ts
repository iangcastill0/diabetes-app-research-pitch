import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  getProfile,
  updateProfile,
  updateSettings,
  changePassword,
} from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/profile', getProfile);

// Update profile
router.put(
  '/profile',
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    validate,
  ],
  updateProfile
);

// Update settings
router.put(
  '/settings',
  [
    body('glucoseUnit').optional().isIn(['mg_dl', 'mmol_l']),
    body('targetRangeMin').optional().isInt({ min: 50, max: 150 }),
    body('targetRangeMax').optional().isInt({ min: 100, max: 300 }),
    body('insulinToCarbRatio').optional().isFloat({ min: 1, max: 50 }),
    body('insulinSensitivityFactor').optional().isFloat({ min: 10, max: 200 }),
    validate,
  ],
  updateSettings
);

// Change password
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    validate,
  ],
  changePassword
);

export { router as userRouter };
