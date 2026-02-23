import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { cgmApi } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';

interface Reading {
  id: string;
  glucoseValueMgDl: number;
  trendDirection: string;
  timestamp: string;
}

export const HistoryScreen = (): React.JSX.Element => {
  const { theme } = useTheme();
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
    if (value < 70) return theme.colors.glucose.hypo;
    if (value <= 180) return theme.colors.glucose.target;
    return theme.colors.glucose.hyper;
  };

  const renderItem = ({ item }: { item: Reading }) => (
    <View style={[styles.row, { backgroundColor: theme.colors.card }]}>
      <View style={styles.glucoseContainer}>
        <Text
          style={[styles.glucoseValue, { color: getGlucoseColor(item.glucoseValueMgDl) }]}
        >
          {item.glucoseValueMgDl}
        </Text>
        <Text style={[styles.glucoseUnit, { color: theme.colors.text.secondary }]}>
          mg/dL
        </Text>
      </View>
      <Text style={[styles.time, { color: theme.colors.text.secondary }]}>
        {new Date(item.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

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
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Glucose History
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          Last 24 hours
        </Text>
      </View>

      <FlatList
        data={readings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              No readings available
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  glucoseContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  glucoseValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  glucoseUnit: {
    fontSize: 14,
  },
  time: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
  },
});
