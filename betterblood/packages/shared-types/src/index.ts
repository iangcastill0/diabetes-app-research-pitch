// BetterBlood Shared Types
// These types are used across all services

// ============================================================================
// BASE ENTITIES
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'patient' | 'healthcare_provider' | 'admin' | 'system';
export type DiabetesType = 'type1' | 'type2' | 'gestational' | 'prediabetes';
export type GlucoseUnit = 'mg_dl' | 'mmol_l';

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  diabetesType?: DiabetesType;
  diagnosisDate?: Date;
  healthcareProviders?: string[];
}

export interface UserSettings {
  glucoseUnit: GlucoseUnit;
  targetRangeMin: number;
  targetRangeMax: number;
  insulinToCarbRatio: number;
  insulinSensitivityFactor: number;
  insulinDuration: number;
}

export interface CGMConnection {
  provider: 'dexcom' | 'freestyle_libre' | 'guardian';
  deviceId: string;
  connectedAt: Date;
  oauthTokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
}

export interface User extends BaseEntity {
  email: string;
  role: UserRole;
  profile: UserProfile;
  settings: UserSettings;
  cgmConnection?: CGMConnection;
  verificationStatus: 'pending' | 'verified' | 'suspended';
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
}

// ============================================================================
// CGM DATA TYPES
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'steady' | 'rising' | 'falling';
export type DataQuality = 'low' | 'medium' | 'high';

export interface CGMReading extends BaseEntity {
  userId: string;
  deviceId: string;
  provider: 'dexcom' | 'freestyle_libre' | 'guardian';
  timestamp: Date;
  glucoseValueMgDl: number;
  filteredGlucoseValueMgDl?: number;
  trendDirection?: TrendDirection;
  trendRateMgDlPerMinute?: number;
  quality?: DataQuality;
  transmissionId?: string;
}

// ============================================================================
// FOOD & MEAL TYPES
// ============================================================================

export interface FoodItem extends BaseEntity {
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  totalCarbohydrates: number;
  dietaryFiber?: number;
  sugars?: number;
  protein?: number;
  fat?: number;
  calories?: number;
  glycemicIndex?: number;
  verified: boolean;
  barcode?: string;
}

export interface MealFoodItem {
  foodId: string;
  quantity: number;
  notes?: string;
}

export interface AIAnalysis {
  confidence: number;
  detectedFoods: string[];
  estimatedCarbs: number;
  requiresConfirmation: boolean;
}

export interface MealLog extends BaseEntity {
  userId: string;
  timestamp: Date;
  foods: MealFoodItem[];
  totalCarbs: number;
  photoUrl?: string;
  aiAnalysis?: AIAnalysis;
  notes?: string;
}

// ============================================================================
// INSULIN DOSING TYPES (FDA Regulated)
// ============================================================================

export type CalculationContext = 'meal' | 'correction' | 'manual';

export interface InsulinDoseInputs {
  currentGlucoseMgDl: number;
  targetGlucoseMgDl: number;
  carbsInGrams: number;
  insulinToCarbRatio: number;
  insulinSensitivityFactor: number;
  insulinOnBoard: number;
  deviceId?: string;
  calculationContext: CalculationContext;
}

export interface InsulinDoseOutputs {
  foodDose: number;
  correctionDose: number;
  negativeIobDose: number;
  totalRecommendedDose: number;
  inRange: boolean;
  warnings: string[];
  confidence: number;
}

export interface DoseConfirmation {
  confirmedAt?: Date;
  confirmedDose?: number;
  confirmedBy: string;
  confirmationMethod: 'app' | 'voice' | 'manual_override';
}

export interface AlgorithmInfo {
  version: string;
  name: string;
}

export interface InsulinDoseCalculation extends BaseEntity {
  userId: string;
  timestamp: Date;
  inputs: InsulinDoseInputs;
  outputs: InsulinDoseOutputs;
  confirmation: DoseConfirmation;
  algorithm: AlgorithmInfo;
}

// ============================================================================
// LIFESTYLE & AI COACHING TYPES
// ============================================================================

export type RecommendationCategory =
  | 'meal_timing'
  | 'exercise'
  | 'sleep'
  | 'stress'
  | 'hydration'
  | 'insulin_timing'
  | 'medication_timing';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationStatus = 'pending' | 'dismissed' | 'completed';

export interface EvidenceDataPoint {
  type: string;
  timestamp: Date;
  value: number | string;
}

export interface RecommendationEvidence {
  dataPoints: EvidenceDataPoint[];
  patternDetected: string;
  confidence: number;
}

export interface RecommendationResult {
  glucoseEffectMgDl?: number;
  successRate?: number;
}

export interface LifestyleRecommendation extends BaseEntity {
  userId: string;
  timestamp: Date;
  category: RecommendationCategory;
  title: string;
  content: string;
  priority: RecommendationPriority;
  evidence: RecommendationEvidence;
  status: RecommendationStatus;
  dismissedAt?: Date;
  completedAt?: Date;
  result?: RecommendationResult;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 'push' | 'sms' | 'email';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertType =
  | 'hypo_predicted'
  | 'hyper_warn'
  | 'missed_bolus'
  | 'cgm_calibration'
  | 'meal_reminder'
  | 'exercise_opportunity';

export interface NotificationContext {
  relatedReadingId?: string;
  relatedDoseId?: string;
  alertType?: AlertType;
}

export type NotificationDeliveryStatus = 'pending' | 'delivered' | 'failed';

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  context?: NotificationContext;
  deliveryStatus: NotificationDeliveryStatus;
  deliveredAt?: Date;
  failureReason?: string;
}

// ============================================================================
// AUDIT LOG TYPES (FDA Compliance)
// ============================================================================

export type ActorType = 'user' | 'system' | 'healthcare_provider';
export type FDACategory = 'medical_decision' | 'safety_alert' | 'settings_change';

export interface AuditLog extends BaseEntity {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  actor: string;
  actorType: ActorType;
  ipAddress?: string;
  userAgent?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  fdaRelevant: boolean;
  fdaCategory?: FDACategory;
  softwareVersion: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface TimeRange {
  start: Date;
  end: Date;
}

export type GlucoseTrend = 'rising' | 'falling' | 'steady' | 'rising_quickly' | 'falling_quickly';
export type GlucoseRange = 'severe_hypo' | 'hypo' | 'low' | 'target' | 'high' | 'hyper';

// Type guards
export const isCGMReading = (data: unknown): data is CGMReading => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'userId' in data &&
    'glucoseValueMgDl' in data &&
    'timestamp' in data
  );
};

export const isGlucoseInSafeRange = (glucose: number): boolean => {
  return glucose >= 70 && glucose <= 180;
};

export const glucoseToRange = (glucose: number): GlucoseRange => {
  if (glucose < 54) return 'severe_hypo';
  if (glucose < 70) return 'hypo';
  if (glucose < 80) return 'low';
  if (glucose <= 180) return 'target';
  if (glucose <= 250) return 'high';
  return 'hyper';
};
