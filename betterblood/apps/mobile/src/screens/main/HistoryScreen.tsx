import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { cgmApi } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore, InsulinLog } from '../../store/authStore';
import { formatGlucose, unitLabel } from '../../utils/glucose';
import { GlassCard } from '../../components/GlassCard';

interface Reading {
  id: string;
  glucoseValueMgDl: number;
  trendDirection: string;
  timestamp: string;
}

export const HistoryScreen = (): React.JSX.Element => {
  const { theme } = useTheme();
  const { targetRangeMin, targetRangeMax, glucoseUnit } = useAuthStore((s) => s.doseSettings);
  const insulinLogs = useAuthStore((s) => s.insulinLogs);
  const deleteInsulinLog = useAuthStore((s) => s.deleteInsulinLog);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await cgmApi.getHistory(24);
      setReadings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getGlucoseColor = (value: number): string => {
    if (value < 54) return theme.colors.glucose.severeHypo;
    if (value < 70) return theme.colors.glucose.hypo;
    if (value < 80) return theme.colors.glucose.low;
    if (value <= targetRangeMax) return theme.colors.glucose.target;
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

  // Compute summary stats from loaded readings
  const stats = readings.length > 0 ? (() => {
    const values = readings.map((r) => r.glucoseValueMgDl);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const inRange = values.filter((v) => v >= targetRangeMin && v <= targetRangeMax).length;
    const tir = Math.round((inRange / values.length) * 100);
    return { avg, min, max, tir };
  })() : null;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Glucose History</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Last 24 hours</Text>
      </View>

      {/* Summary Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <GlassCard style={{ flex: 1 }}>
            <View style={{ padding: 12, alignItems: 'center' }}>
              <Text style={[styles.statValue, { color: theme.colors.primary[500] }]}>{stats.tir}%</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Time in Range</Text>
            </View>
          </GlassCard>
          <GlassCard style={{ flex: 1 }}>
            <View style={{ padding: 12, alignItems: 'center' }}>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{formatGlucose(stats.avg, glucoseUnit)}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Avg ({unitLabel(glucoseUnit)})</Text>
            </View>
          </GlassCard>
          <GlassCard style={{ flex: 1 }}>
            <View style={{ padding: 12, alignItems: 'center' }}>
              <Text style={[styles.statValue, { color: theme.colors.glucose.hypo }]}>{formatGlucose(stats.min, glucoseUnit)}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Low</Text>
            </View>
          </GlassCard>
          <GlassCard style={{ flex: 1 }}>
            <View style={{ padding: 12, alignItems: 'center' }}>
              <Text style={[styles.statValue, { color: theme.colors.glucose.high }]}>{formatGlucose(stats.max, glucoseUnit)}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>High</Text>
            </View>
          </GlassCard>
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      >
        {/* CGM Readings */}
        {readings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="chart-line" size={48} color={theme.colors.text.disabled} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              No readings available
            </Text>
          </View>
        ) : (
          readings.map((item) => (
            <GlassCard key={item.id} style={{ marginBottom: 8 }}>
              <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={styles.glucoseContainer}>
                  <Text style={[styles.glucoseValue, { color: getGlucoseColor(item.glucoseValueMgDl) }]}>
                    {formatGlucose(item.glucoseValueMgDl, glucoseUnit)}
                  </Text>
                  <Text style={[styles.glucoseUnit, { color: theme.colors.text.secondary }]}>{unitLabel(glucoseUnit)}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Icon
                    name={getTrendIcon(item.trendDirection)}
                    size={16}
                    color={getGlucoseColor(item.glucoseValueMgDl)}
                  />
                  <Text style={[styles.time, { color: theme.colors.text.secondary }]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </GlassCard>
          ))
        )}

        {/* Dose Log */}
        {insulinLogs.length > 0 && (
          <View style={styles.doseSection}>
            <Text style={[styles.doseSectionTitle, { color: theme.colors.text.secondary }]}>
              Dose Log
            </Text>
            {insulinLogs.map((log: InsulinLog) => (
              <GlassCard key={log.id} style={{ marginBottom: 12 }}>
                <View style={{ padding: 16 }}>
                  {/* Header row */}
                  <View style={styles.doseHeader}>
                    <View style={styles.doseHeaderLeft}>
                      <Icon name="needle" size={16} color={theme.colors.secondary[500]} />
                      <Text style={[styles.doseTotalUnits, { color: theme.colors.secondary[500] }]}>
                        {log.units.toFixed(2)} u
                      </Text>
                    </View>
                    <View style={styles.doseHeaderRight}>
                      <Text style={[styles.doseTime, { color: theme.colors.text.secondary }]}>
                        {new Date(log.timestamp).toLocaleString([], {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Delete Entry', 'Remove this dose from your log?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteInsulinLog(log.id) },
                          ])
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="trash-can-outline" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Breakdown grid */}
                  <View style={[styles.doseDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.doseGrid}>
                    <View style={styles.doseGridItem}>
                      <Text style={[styles.doseGridLabel, { color: theme.colors.text.secondary }]}>BG at dose</Text>
                      <Text style={[styles.doseGridValue, { color: getGlucoseColor(log.glucoseAtTime) }]}>
                        {formatGlucose(log.glucoseAtTime, glucoseUnit)} {unitLabel(glucoseUnit)}
                      </Text>
                    </View>
                    <View style={styles.doseGridItem}>
                      <Text style={[styles.doseGridLabel, { color: theme.colors.text.secondary }]}>Carbs</Text>
                      <Text style={[styles.doseGridValue, { color: theme.colors.text.primary }]}>
                        {(log.carbs ?? 0)}g
                      </Text>
                    </View>
                    <View style={styles.doseGridItem}>
                      <Text style={[styles.doseGridLabel, { color: theme.colors.text.secondary }]}>Carb dose</Text>
                      <Text style={[styles.doseGridValue, { color: theme.colors.text.primary }]}>
                        {log.carbDose.toFixed(2)} u
                      </Text>
                    </View>
                    <View style={styles.doseGridItem}>
                      <Text style={[styles.doseGridLabel, { color: theme.colors.text.secondary }]}>Correction</Text>
                      <Text style={[styles.doseGridValue, { color: theme.colors.text.primary }]}>
                        {log.correctionDose.toFixed(2)} u
                      </Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  listContent: { padding: 20, paddingTop: 0 },
  glucoseContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  glucoseValue: { fontSize: 24, fontWeight: '600' },
  glucoseUnit: { fontSize: 14 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 16 },
  doseSection: { marginTop: 24 },
  doseSectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  doseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doseHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doseTotalUnits: { fontSize: 20, fontWeight: '700' },
  doseTime: { fontSize: 12 },
  doseDivider: { height: 1, marginVertical: 12 },
  doseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  doseGridItem: { width: '45%' },
  doseGridLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  doseGridValue: { fontSize: 15, fontWeight: '600' },
});
