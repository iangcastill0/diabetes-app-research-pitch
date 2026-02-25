import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

const DARK_BORDER = [
  'rgba(255,255,255,0.22)',
  'rgba(255,255,255,0.10)',
  'rgba(255,255,255,0.06)',
  'rgba(255,255,255,0.10)',
] as const;

const LIGHT_BORDER = [
  'rgba(0,0,0,0.10)',
  'rgba(0,0,0,0.05)',
  'rgba(0,0,0,0.03)',
  'rgba(0,0,0,0.05)',
] as const;

interface GlassCardProps {
  children: React.ReactNode;
  /** Outer style — margins, flex, width, etc. */
  style?: ViewStyle | ViewStyle[];
  /** Inner content padding (default 0 — callers control their own padding) */
  padding?: number;
  /** Border radius (default 16) */
  radius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  padding = 0,
  radius = 16,
}) => {
  const { isDark } = useTheme();

  const borderColors = isDark ? DARK_BORDER : LIGHT_BORDER;
  const glassBg = isDark ? 'rgba(10,10,31,0.80)' : 'rgba(255,255,255,0.95)';
  const shadowStyle = isDark
    ? styles.shadowDark
    : styles.shadowLight;

  return (
    <View style={[shadowStyle, style]}>
      <LinearGradient
        colors={borderColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius + 1, padding: 1 }}
      >
        <View
          style={[
            styles.inner,
            { borderRadius: radius, padding, backgroundColor: glassBg },
          ]}
        >
          {/* Top highlight — simulates light catching the glass surface */}
          <View
            style={[
              styles.highlight,
              { borderTopLeftRadius: radius, borderTopRightRadius: radius },
            ]}
          />
          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowDark: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  shadowLight: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inner: {
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.055)',
    pointerEvents: 'none',
  } as any,
});
