import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Each band flows across the screen and gently waves vertically
interface BandConfig {
  x: number;
  y: number;
  bandWidth: number;
  bandHeight: number;
  colors: string[];
  flowX: number;      // translateX drift amount
  waveY: number;      // translateY wave amount
  flowDuration: number;
  waveDuration: number;
  delay: number;
}

const BANDS: BandConfig[] = [
  // Band 1 — upper shimmer
  {
    x: -(width * 0.3),
    y: height * 0.04,
    bandWidth: width * 2,
    bandHeight: 220,
    colors: [
      'transparent',
      'rgba(255,255,255,0.05)',
      'rgba(255,255,255,0.04)',
      'transparent',
    ],
    flowX: width * 0.45,
    waveY: 28,
    flowDuration: 20000,
    waveDuration: 13000,
    delay: 0,
  },
  // Band 2 — upper-mid shimmer
  {
    x: -(width * 0.5),
    y: height * 0.24,
    bandWidth: width * 2,
    bandHeight: 180,
    colors: [
      'transparent',
      'rgba(255,255,255,0.04)',
      'rgba(255,255,255,0.03)',
      'transparent',
    ],
    flowX: -(width * 0.35),
    waveY: 22,
    flowDuration: 17000,
    waveDuration: 11000,
    delay: 2500,
  },
  // Band 3 — mid shimmer
  {
    x: -(width * 0.2),
    y: height * 0.44,
    bandWidth: width * 2,
    bandHeight: 200,
    colors: [
      'transparent',
      'rgba(255,255,255,0.03)',
      'rgba(255,255,255,0.04)',
      'transparent',
    ],
    flowX: width * 0.38,
    waveY: 30,
    flowDuration: 19000,
    waveDuration: 14000,
    delay: 5000,
  },
  // Band 4 — lower shimmer
  {
    x: -(width * 0.4),
    y: height * 0.65,
    bandWidth: width * 2,
    bandHeight: 160,
    colors: [
      'transparent',
      'rgba(255,255,255,0.03)',
      'rgba(255,255,255,0.02)',
      'transparent',
    ],
    flowX: -(width * 0.3),
    waveY: 20,
    flowDuration: 15000,
    waveDuration: 10000,
    delay: 7500,
  },
];

const Band: React.FC<{ config: BandConfig }> = ({ config }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    tx.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.flowX, {
          duration: config.flowDuration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
    ty.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.waveY, {
          duration: config.waveDuration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          left: config.x,
          top: config.y,
          width: config.bandWidth,
          height: config.bandHeight,
        },
      ]}
    >
      <LinearGradient
        colors={config.colors as any}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

export const AmbientBackground: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {BANDS.map((band, i) => (
      <Band key={i} config={band} />
    ))}
  </View>
);
