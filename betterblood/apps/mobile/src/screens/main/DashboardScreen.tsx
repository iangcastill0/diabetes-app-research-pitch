import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { cgmApi } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { formatGlucose, unitLabel } from '../../utils/glucose';
import { GlassCard } from '../../components/GlassCard';

interface CurrentReading {
  glucoseValueMgDl: number;
  trendDirection: string;
  timestamp: string;
}

interface TrendData {
  readings: number;
  average: number;
  min: number;
  max: number;
  trend: string;
  timeInRange: number;
}

export const DashboardScreen = (): React.JSX.Element => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { targetRangeMin, targetRangeMax, glucoseUnit } = useAuthStore((s) => s.doseSettings);
  const mealLogs = useAuthStore((s) => s.mealLogs);
  const insulinLogs = useAuthStore((s) => s.insulinLogs);

  // Position the target band on a 40–300 mg/dL scale
  const SCALE_MIN = 40;
  const SCALE_SPAN = 260;
  const rangeLeftPct = ((targetRangeMin - SCALE_MIN) / SCALE_SPAN) * 100;
  const rangeWidthPct = ((targetRangeMax - targetRangeMin) / SCALE_SPAN) * 100;

  const [currentReading, setCurrentReading] = useState<CurrentReading | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [readingRes, trendRes] = await Promise.all([
        cgmApi.getCurrentReading(),
        cgmApi.getTrends(3),
      ]);
      setCurrentReading(readingRes.data.data);
      setTrendData(trendRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGlucoseColor = (value: number): string => {
    if (value < 54) return theme.colors.glucose.severeHypo;
    if (value < 70) return theme.colors.glucose.hypo;
    if (value < 80) return theme.colors.glucose.low;
    if (value <= 180) return theme.colors.glucose.target;
    if (value <= 250) return theme.colors.glucose.high;
    return theme.colors.glucose.hyper;
  };

  const getTrendIcon = (direction: string): string => {
    switch (direction) {
      case 'up':
      case 'rising':
        return 'arrow-up';
      case 'down':
      case 'falling':
        return 'arrow-down';
      default:
        return 'arrow-right';
    }
  };

  // Safety alert logic
  const getAlert = (reading: CurrentReading | null) => {
    if (!reading) return null;
    const v = reading.glucoseValueMgDl;
    if (v < 54) return { icon: 'alert-circle', color: theme.colors.glucose.severeHypo, message: 'SEVERE LOW — Act immediately! Treat with fast-acting glucose.' };
    if (v < 70) return { icon: 'alert', color: theme.colors.glucose.hypo, message: 'LOW GLUCOSE — Treat with 15g fast-acting carbs now.' };
    if (v > 300) return { icon: 'alert-circle', color: theme.colors.glucose.hyper, message: 'SEVERE HIGH — Check ketones and contact your care team.' };
    if (v > 250) return { icon: 'alert', color: theme.colors.glucose.high, message: 'HIGH GLUCOSE — Consider a correction dose.' };
    return null;
  };

  const lastMeal = mealLogs[0] ?? null;
  const lastInsulin = insulinLogs[0] ?? null;

  const alert = getAlert(currentReading);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading your glucose data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Dashboard
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Safety Alert Banner */}
        {alert && (
          <View style={[styles.alertBanner, { backgroundColor: alert.color }]}>
            <Icon name={alert.icon} size={22} color="#fff" />
            <Text style={styles.alertText}>{alert.message}</Text>
          </View>
        )}

        {/* Current Reading Card */}
        <GlassCard style={{ marginBottom: 16 }}>
          <View style={{ padding: 24 }}>
          <Text style={[styles.cardLabel, { color: theme.colors.text.secondary }]}>
            Current Glucose
          </Text>
            {currentReading ? (
              <View style={styles.readingContainer}>
                <View style={styles.glucoseValueContainer}>
                  <Text
                    style={[
                      styles.glucoseValue,
                      { color: getGlucoseColor(currentReading.glucoseValueMgDl) },
                    ]}
                  >
                    {formatGlucose(currentReading.glucoseValueMgDl, glucoseUnit)}
                  </Text>
                  <Text style={[styles.glucoseUnit, { color: theme.colors.text.secondary }]}>
                    {unitLabel(glucoseUnit)}
                  </Text>
                  <Icon
                    name={getTrendIcon(currentReading.trendDirection)}
                    size={32}
                    color={getGlucoseColor(currentReading.glucoseValueMgDl)}
                    style={styles.trendIcon}
                  />
                </View>
                <Text style={[styles.timestamp, { color: theme.colors.text.secondary }]}>
                  {new Date(currentReading.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ) : (
              <Text style={[styles.noData, { color: theme.colors.text.secondary }]}>
                No reading available
              </Text>
            )}
          </View>
        </GlassCard>

        {/* Stats Row */}
        {trendData && (
          <View style={styles.statsRow}>
            <GlassCard style={{ flex: 1 }}>
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {trendData.timeInRange}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Time in Range
                </Text>
              </View>
            </GlassCard>
            <GlassCard style={{ flex: 1 }}>
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={[styles.statValue, { color: theme.colors.text.secondary }]}>
                  {formatGlucose(trendData.average, glucoseUnit)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  3hr Avg ({unitLabel(glucoseUnit)})
                </Text>
              </View>
            </GlassCard>
            <GlassCard style={{ flex: 1 }}>
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {trendData.readings}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Readings
                </Text>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
            Quick Actions
          </Text>

          <View style={styles.actionGrid}>
            <View style={styles.actionRow}>
              <GlassCard style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: 'transparent' }]}
                  onPress={() => navigation.navigate('Food' as never)}
                >
                  <Icon name="plus-circle" size={28} color={theme.colors.text.primary} />
                  <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>Log Food</Text>
                </TouchableOpacity>
              </GlassCard>

              <GlassCard style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: 'transparent' }]}
                  onPress={() => navigation.navigate('BolusCalculator' as never)}
                >
                  <Icon name="needle" size={28} color={theme.colors.text.secondary} />
                  <Text style={[styles.actionText, { color: theme.colors.text.secondary }]}>Log Insulin</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>

            <View style={styles.actionRow}>
              <GlassCard style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: 'transparent' }]}
                  onPress={() => navigation.navigate('History' as never)}
                >
                  <Icon name="chart-line" size={28} color={theme.colors.text.secondary} />
                  <Text style={[styles.actionText, { color: theme.colors.text.secondary }]}>View History</Text>
                </TouchableOpacity>
              </GlassCard>

              <GlassCard style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: 'transparent' }]}
                  onPress={() => navigation.navigate('BolusCalculator' as never)}
                >
                  <Icon name="calculator" size={28} color={theme.colors.text.secondary} />
                  <Text style={[styles.actionText, { color: theme.colors.text.secondary }]}>Bolus Calc</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>
          </View>
        </View>

        {/* Last Activity Row */}
        {(lastMeal || lastInsulin) && (
          <View style={styles.statsRow}>
            {lastMeal && (
              <GlassCard style={{ flex: 1 }}>
                <View style={{ padding: 14, alignItems: 'center', gap: 4 }}>
                  <Icon name="food-apple" size={18} color={theme.colors.text.primary} />
                  <Text style={[styles.activityValue, { color: theme.colors.text.primary }]}>
                    {lastMeal.totalCarbs}g carbs
                  </Text>
                  <Text style={[styles.activityLabel, { color: theme.colors.text.secondary }]}>
                    Last meal
                  </Text>
                </View>
              </GlassCard>
            )}
            {lastInsulin && (
              <GlassCard style={{ flex: 1 }}>
                <View style={{ padding: 14, alignItems: 'center', gap: 4 }}>
                  <Icon name="needle" size={18} color={theme.colors.text.secondary} />
                  <Text style={[styles.activityValue, { color: theme.colors.text.primary }]}>
                    {lastInsulin.units.toFixed(2)}u
                  </Text>
                  <Text style={[styles.activityLabel, { color: theme.colors.text.secondary }]}>
                    Last dose
                  </Text>
                </View>
              </GlassCard>
            )}
          </View>
        )}

        {/* Target Range */}
        <GlassCard style={{ marginBottom: 16 }}>
          <View style={{ padding: 24 }}>
            <Text style={[styles.cardLabel, { color: theme.colors.text.secondary }]}>
              Target Range
            </Text>
            <View style={styles.rangeContainer}>
              <View style={[styles.rangeBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.rangeTarget,
                    {
                      backgroundColor: theme.colors.primary[500],
                      marginLeft: `${rangeLeftPct}%` as any,
                      width: `${rangeWidthPct}%` as any,
                    },
                  ]}
                />
              </View>
              <View style={styles.rangeLabels}>
                <Text style={[styles.rangeLabel, { color: theme.colors.text.secondary }]}>
                  {formatGlucose(targetRangeMin, glucoseUnit)} {unitLabel(glucoseUnit)}
                </Text>
                <Text style={[styles.rangeLabel, { color: theme.colors.text.secondary }]}>
                  {formatGlucose(targetRangeMax, glucoseUnit)} {unitLabel(glucoseUnit)}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  headerSubtitle: { fontSize: 16, marginTop: 4 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  alertText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  card: { borderRadius: 16, padding: 24, marginBottom: 16 },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readingContainer: { alignItems: 'center' },
  glucoseValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glucoseValue: { fontSize: 72, fontWeight: '700' },
  glucoseUnit: { fontSize: 20, fontWeight: '500', marginTop: 24 },
  trendIcon: { marginLeft: 8 },
  timestamp: { fontSize: 14, marginTop: 12 },
  noData: { fontSize: 16, textAlign: 'center', paddingVertical: 32 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  activityCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  activityValue: { fontSize: 16, fontWeight: '700' },
  activityLabel: { fontSize: 11 },
  quickActions: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  actionGrid: { gap: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
  actionText: { fontSize: 12, fontWeight: '500' },
  rangeContainer: { marginTop: 8 },
  rangeBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  rangeTarget: { height: '100%', borderRadius: 4 },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rangeLabel: { fontSize: 12 },
});
