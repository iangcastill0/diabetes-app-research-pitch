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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { cgmApi } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';

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
        return 'arrow-up';
      case 'down':
        return 'arrow-down';
      case 'rising':
        return 'arrow-up';
      case 'falling':
        return 'arrow-down';
      default:
        return 'arrow-right';
    }
  };

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Current Reading Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }, theme.shadows.base]}>
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
                  {currentReading.glucoseValueMgDl}
                </Text>
                <Text style={[styles.glucoseUnit, { color: theme.colors.text.secondary }]}>
                  mg/dL
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

        {/* Stats Row */}
        {trendData && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
              <Text style={[styles.statValue, { color: theme.colors.primary[500] }]}>
                {trendData.timeInRange}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                Time in Range
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                {trendData.average}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                3hr Average
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                {trendData.readings}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                Readings
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Quick Actions
          </Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary[50] }]}>
              <Icon name="plus-circle" size={28} color={theme.colors.primary[500]} />
              <Text style={[styles.actionText, { color: theme.colors.primary[600] }]}>
                Log Food
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.secondary[50] }]}>
              <Icon name="needle" size={28} color={theme.colors.secondary[500]} />
              <Text style={[styles.actionText, { color: theme.colors.secondary[600] }]}>
                Log Insulin
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.gray[50] }]}>
              <Icon name="run" size={28} color={theme.colors.gray[600]} />
              <Text style={[styles.actionText, { color: theme.colors.gray[700] }]}>
                Log Exercise
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Target Range */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }, theme.shadows.base]}>
          <Text style={[styles.cardLabel, { color: theme.colors.text.secondary }]}>
            Target Range
          </Text>
          <View style={styles.rangeContainer}>
            <View style={styles.rangeBar}>
              <View style={[styles.rangeTarget, { backgroundColor: theme.colors.glucose.target }]} />
            </View>
            <View style={styles.rangeLabels}>
              <Text style={[styles.rangeLabel, { color: theme.colors.text.secondary }]}>
                70 mg/dL
              </Text>
              <Text style={[styles.rangeLabel, { color: theme.colors.text.secondary }]}>
                180 mg/dL
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readingContainer: {
    alignItems: 'center',
  },
  glucoseValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glucoseValue: {
    fontSize: 72,
    fontWeight: '700',
  },
  glucoseUnit: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: 24,
  },
  trendIcon: {
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 14,
    marginTop: 12,
  },
  noData: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rangeContainer: {
    marginTop: 8,
  },
  rangeBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rangeTarget: {
    height: '100%',
    width: '60%',
    marginLeft: '10%',
    borderRadius: 4,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeLabel: {
    fontSize: 12,
  },
});
