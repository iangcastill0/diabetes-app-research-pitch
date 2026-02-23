// Base interface for all entities
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User roles
type UserRole = 'patient' | 'healthcare_provider' | 'admin' | 'system';

export interface User extends BaseEntity {
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    diabetesType?: 'type1' | 'type2' | 'gestational' | 'prediabetes';
    diagnosisDate?: Date;
    healthcareProviders?: string[]; // Provider user IDs
  };
  settings: {
    glucoseUnit: 'mg/dl' | 'mmol/l';
    targetRangeMin: number; // mg/dl
    targetRangeMax: number; // mg/dl
    insulinToCarbRatio: number; // Example: 1:15 means 1 unit per 15g carbs
    insulinSensitivityFactor: number; // mg/dl per 1 unit insulin
    insulinDuration: number; // hours (typically 3-5)
  };
  cgmConnection?: {
    provider: 'dexcom' | 'freestyle_libre' | 'guardian';
    deviceId: string;
    connectedAt: Date;
    oauthTokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
    };
  };
  verificationStatus: 'pending' | 'verified' | 'suspended';
}

// CGM Data
export interface CGMReading {
  id: string;
  userId: string;
  deviceId: string;
  provider: 'dexcom' | 'freestyle_libre' | 'guardian';
  timestamp: Date;
  glucoseValueMgDl: number;
  filteredGlucoseValueMgDl?: number; // Some devices provide filtered values
  trendDirection?: 'up' | 'down' | 'steady' | 'up' | 'down';
  trendRateMgDlPerMinute?: number;
  quality?: 'low' | 'medium' | 'high';
  transmissionId?: string;
}

// Carb / Meal data
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string; // g, oz, cup, etc.
  totalCarbohydrates: number; // grams
  dietaryFiber?: number;
  sugars?: number;
  protein?: number;
  fat?: number;
  calories?: number;
  glycemicIndex?: number; // For meal timing recommendations
  verified: boolean; // True if from verified source (USDA, etc.)
}

export interface MealLog {
  id: string;
  userId: string;
  timestamp: Date;
  foods: {
    foodId: string;
    quantity: number; // Multiplier of servingSize
  }[];
  totalCarbs: number; // Pre-calculated
  photoUrl?: string;
  aiAnalysis?: {
    // If photo was analyzed
    confidence: number;
    detectedFoods: string[];
    estimatedCarbs: number;
    requiresConfirmation: boolean;
  };
}

// Insulin Dosing (FDA Regulated Component)
export interface InsulinDoseCalculation {
  id: string;
  userId: string;
  timestamp: Date;
  inputs: {
    currentGlucoseMgDl: number;
    targetGlucoseMgDl: number;
    carbsInGrams: number;
    insulinToCarbRatio: number; // e.g., 15 (1:15 ratio)
    insulinSensitivityFactor: number; // mg/dl per 1 unit insulin
    insulinOnBoard: number; // units
    deviceId?: string;
    calculationContext: 'meal' | 'correction' | 'manual';
  };
  outputs: {
    foodDose: number; // Insulin for carbs
    correctionDose: number; // Insulin to correct high glucose
    negativeIobDose: number; // Reduction for IOB
    totalRecommendedDose: number;
inRange: boolean; // If total dose within expected range
    warnings: string[]; // Safety warnings
    confidence: number; // Algorithm certainty (0-1)
  };
  confirmation: {
    confirmedAt?: Date;
    confirmedDose?: number;
    confirmedBy: string; // User ID, 'patient' or system user
    confirmationMethod: 'app' | 'voice' | 'manual_override';
  };
  algorithm: {
    version: string; // For FDA traceability
    name: string; // 'ISPAD pediatric' | 'ADA adult' etc.
  };
}

// Lifestyle and AI coaching
export interface LifestyleRecommendation {
  id: string;
  userId: string;
  timestamp: Date;
  category:
    | 'meal_timing'
    | 'exercise'
    | 'sleep'
    | 'stress'
    | 'hydration'
    | 'insulin_timing'
    | 'medication_timing';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidence: {
    dataPoints: {
      type: string;
      timestamp: Date;
      value: number | string;
    }[];
    patternDetected: string;
    confidence: number; // 0-1
  };
  status: 'pending' | 'dismissed' | 'completed';
  dismissedAt?: Date;
  completedAt?: Date;
  result?: {
    // If action was taken, track outcome
    glucoseEffectMgDl?: number;
    successRate?: number;
  };
}

// Notifications and alerts
export type NotificationType = 'push' | 'sms' | 'email';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  context?: {
    // Contextual data for the notification
    relatedReadingId?: string;
    relatedDoseId?: string;
    alertType?:
      | 'hypo_predicted'
      | 'hyper_warn'
      | 'missed_bolus'
      | 'cgm_calibration'
      | 'meal_reminder'
      | 'exercise_opportunity';
  };
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  deliveredAt?: Date;
  failureReason?: string;
}

// Audit trail for FDA compliance
export interface AuditLog {
  id: string;
  userId?: string;
  action: string; // 'dose_calculated' | 'dose_confirmed' | 'settings_updated'
  resource: string; // 'insulin_service' | 'cgm_service'
  resourceId?: string;
  timestamp: Date;
  actor: string; // User ID or system user
  actorType: 'user' | 'system' | 'healthcare_provider';
  ipAddress?: string;
  userAgent?: string;

  // Before/after values for changes
  before?: Record<string, any>;
  after?: Record<string, any>;

  // FDA traceability
  fdaRelevant: boolean;
  fdaCategory?: 'medical_decision' | 'safety_alert' | 'settings_change';
  softwareVersion: string;
}

type GlucoseTrend = 'rising' | 'falling' | 'steady' | 'rising_quickly' | 'falling_quickly';
type GlucoseRange = 'severe_hypo' | 'hypo' | 'low' | 'target' | 'high' | 'hyper';

export interface TimeInRangeStats {
  userId: string;
  period: 'day' | 'week' | 'month' | 'quarter';
  periodStart: Date;
  periodEnd: Date;
  stats: {
    totalReadings: number;
    averageGlucoseMgDl: number;
    stdDevGlucose: number;
    timeInRanges: {
      severeHypo: number; // < 54 mg/dL (%)
      hypo: number; // 54-69 mg/dL (%)
      low: number; // 70-79 mg/dL (%)
      target: number; // 80-180 mg/dL (%)
      high: number; // 181-250 mg/dL (%)
      hyper: number; // > 250 mg/dL (%)
    };
    estimatedA1c?: number;
    glucoseManagementIndicator?: number;
    coefficientOfVariation?: number;
    timeBelowRange?: number; // <70 mg/dL
    timeInRange?: number; // 70-180 mg/dL
    timeAboveRange?: number; // >180 mg/dL
  };
}

// Type guards
declare const isFDARegulatedEvent: (event: any) => event is InsulinDoseCalculation;
declare const isCGMReading: (data: any) => data is CGMReading;
declare const isBloodGlucoseInSafeRange: (glucose: number) => boolean;