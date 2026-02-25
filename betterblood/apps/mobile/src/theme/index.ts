// BetterBlood Design System
// Timeless, professional medical app aesthetic
// No emojis, clean and accessible

export const colors = {
  // Primary palette - monochromatic slate
  primary: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#CBD5E1',
    300: '#94A3B8',
    400: '#64748B',
    500: '#334155', // Main accent - dark slate
    600: '#1E293B',
    700: '#0F172A',
    800: '#020617',
    900: '#010409',
  },

  // Secondary palette - lighter slate
  secondary: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#475569', // Secondary accent
    600: '#334155',
    700: '#1E293B',
    800: '#0F172A',
    900: '#020617',
  },

  // Glucose-specific colors — safety-critical, keep vivid
  glucose: {
    severeHypo: '#DC2626', // < 54
    hypo: '#EF4444',       // 54-69
    low: '#F97316',        // 70-79
    target: '#22C55E',     // 80-180
    high: '#F97316',       // 181-250
    hyper: '#EF4444',      // > 250
  },

  // Neutral grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F9FAFB',
  card: '#FFFFFF',

  // Text
  text: {
    primary: '#111827',
    secondary: '#64748B',
    disabled: '#94A3B8',
    inverse: '#FFFFFF',
  },

  // Border
  border: '#E5E7EB',
  divider: '#F3F4F6',
};

export const typography = {
  // Font families - clean, readable
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export type Theme = {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
};

export const lightTheme: Theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  isDark: false,
};

// Monochromatic glow shadows
const monoShadows = {
  none: shadows.none,
  sm: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  base: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  md: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  lg: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 36,
    elevation: 10,
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...colors,
    // Primary → monochromatic slate palette
    primary: {
      ...colors.primary,
      50:  'rgba(255,255,255,0.05)',
      100: 'rgba(255,255,255,0.08)',
      200: 'rgba(255,255,255,0.15)',
      300: '#94A3B8',
      400: '#CBD5E1',
      500: '#E2E8F0',   // near-white for icons/text
      600: '#94A3B8',
      700: '#64748B',
    },
    // Secondary → darker slate
    secondary: {
      ...colors.secondary,
      50:  'rgba(255,255,255,0.04)',
      100: 'rgba(255,255,255,0.07)',
      200: 'rgba(255,255,255,0.12)',
      300: '#64748B',
      400: '#94A3B8',
      500: '#94A3B8',   // medium slate
      600: '#64748B',
      700: '#475569',
    },
    // Glucose: medical safety colors — keep for clinical clarity
    glucose: {
      severeHypo: '#FF4444',
      hypo:       '#FF6B6B',
      low:        '#FF9F43',
      target:     '#94A3B8',
      high:       '#FF9F43',
      hyper:      '#FF6B6B',
    },
    // Grays → dark translucent fills for tint surfaces
    gray: {
      ...colors.gray,
      50:  'rgba(255,255,255,0.05)',
      100: 'rgba(255,255,255,0.08)',
      200: 'rgba(255,255,255,0.13)',
      300: 'rgba(255,255,255,0.20)',
      400: '#94A3B8',
      500: '#64748B',
      600: '#94A3B8',
      700: '#CBD5E1',
      800: '#E2E8F0',
      900: '#F1F5F9',
    },
    // Transparent so AmbientBackground canvas shows everywhere
    background: 'transparent',
    surface: 'rgba(255,255,255,0.04)',
    card:    'rgba(255,255,255,0.07)',
    text: {
      primary:  '#FFFFFF',
      secondary: '#94A3B8',
      disabled:  '#475569',
      inverse:   '#0A0A1F',
    },
    border:  'rgba(255,255,255,0.12)',
    divider: 'rgba(255,255,255,0.06)',
    success: '#94A3B8',
    warning: '#CBD5E1',
    error:   '#F87171',
    info:    '#94A3B8',
  },
  shadows: monoShadows,
  isDark: true,
};
