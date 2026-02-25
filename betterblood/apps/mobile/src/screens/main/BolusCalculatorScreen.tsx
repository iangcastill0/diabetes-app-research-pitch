import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { cgmApi, insulinApi } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { MainTabParamList } from '../../navigation/MainNavigator';
import { formatGlucose, unitLabel, parseGlucoseInput, formatISF } from '../../utils/glucose';
import { GlassCard } from '../../components/GlassCard';

const roundTo005 = (value: number): number => Math.round(value / 0.05) * 0.05;

export const BolusCalculatorScreen = (): React.JSX.Element => {
  const { theme } = useTheme();
  const doseSettings = useAuthStore((s) => s.doseSettings);
  const logInsulin = useAuthStore((s) => s.logInsulin);
  const route = useRoute<RouteProp<MainTabParamList, 'BolusCalculator'>>();

  const { targetBG, glucoseUnit } = doseSettings;

  const [loadingCGM, setLoadingCGM] = useState(true);
  const [glucose, setGlucose] = useState('');
  const [carbs, setCarbs] = useState(
    route.params?.carbs != null ? String(route.params.carbs) : '',
  );

  useEffect(() => {
    cgmApi
      .getCurrentReading()
      .then((res) => {
        const val = res.data?.data?.glucoseValueMgDl;
        if (val != null) setGlucose(formatGlucose(val, glucoseUnit));
      })
      .catch(() => {})
      .finally(() => setLoadingCGM(false));
  }, []);

  // Keep carbs in sync if navigated from Food screen
  useEffect(() => {
    if (route.params?.carbs != null) {
      setCarbs(String(route.params.carbs));
    }
  }, [route.params?.carbs]);

  const glucoseNum = parseGlucoseInput(glucose, glucoseUnit);
  const carbsNum = parseFloat(carbs) || 0;
  const icrNum = doseSettings.icr;
  const isfNum = doseSettings.isf;

  const carbDose = icrNum > 0 ? carbsNum / icrNum : 0;
  const rawCorrection = isfNum > 0 ? (glucoseNum - targetBG) / isfNum : 0;
  const correctionDose = rawCorrection;
  const totalBolus = roundTo005(carbDose + Math.max(0, correctionDose));

  const correctionIsNegative = glucoseNum > 0 && correctionDose < 0;
  const correctionColor = correctionIsNegative
    ? theme.colors.glucose?.hypo ?? '#F59E0B'
    : theme.colors.text.primary;

  const confirmDose = () => {
    if (totalBolus <= 0) {
      Alert.alert('No dose needed', 'Total bolus is 0 units based on current inputs.');
      return;
    }

    Alert.alert(
      'Confirm Dose',
      `Log ${totalBolus.toFixed(2)} units of insulin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            logInsulin({
              units: totalBolus,
              carbs: carbsNum,
              carbDose,
              correctionDose: Math.max(0, correctionDose),
              glucoseAtTime: glucoseNum,
            });
            // Attempt backend sync (non-blocking)
            insulinApi.logDose({
              units: totalBolus,
              carbDose,
              correctionDose: Math.max(0, correctionDose),
              glucoseAtTime: glucoseNum,
            }).catch(() => {});
            // Reset form — settings-derived fields (ICR, ISF, targetBG) stay
            setGlucose('');
            setCarbs('');
            Alert.alert('Dose Logged', `${totalBolus.toFixed(2)}u recorded.`);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Bolus Calculator
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
            Target BG: {formatGlucose(targetBG, glucoseUnit)} {unitLabel(glucoseUnit)}
          </Text>
        </View>

        {/* Inputs Card */}
        <GlassCard style={{ marginBottom: 16 }}>
          <View style={{ padding: 24 }}>
          <Text style={[styles.cardLabel, { color: theme.colors.text.secondary }]}>Inputs</Text>

          {/* Current Glucose */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
              Current Glucose ({unitLabel(glucoseUnit)})
            </Text>
            {loadingCGM ? (
              <ActivityIndicator size="small" color={theme.colors.primary[500]} style={styles.cgmSpinner} />
            ) : (
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.primary[200] ?? '#A7F3D0',
                }]}
                value={glucose}
                onChangeText={setGlucose}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.text.secondary}
              />
            )}
          </View>

          {/* Carbs */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
              Carbs to Eat (g)
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text.primary,
                borderColor: theme.colors.primary[200] ?? '#A7F3D0',
              }]}
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          {/* ICR / ISF from settings (read-only) */}
          <View style={[styles.settingsRow, { backgroundColor: theme.colors.background, borderRadius: 10 }]}>
            <View style={styles.settingsPill}>
              <Text style={[styles.settingsPillLabel, { color: theme.colors.text.secondary }]}>ICR</Text>
              <Text style={[styles.settingsPillValue, { color: theme.colors.text.primary }]}>{icrNum} g/u</Text>
            </View>
            <View style={[styles.settingsPill, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
              <Text style={[styles.settingsPillLabel, { color: theme.colors.text.secondary }]}>ISF</Text>
              <Text style={[styles.settingsPillValue, { color: theme.colors.text.primary }]}>{formatISF(isfNum, glucoseUnit)}</Text>
            </View>
          </View>
        </View>
        </GlassCard>

        {/* Result Card */}
        <GlassCard style={{ marginBottom: 16 }}>
          <View style={{ padding: 24 }}>
          <Text style={[styles.cardLabel, { color: theme.colors.text.secondary }]}>Dose Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.text.secondary }]}>Carb dose</Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text.primary }]}>
              {carbDose.toFixed(2)} u
            </Text>
          </View>
          <Text style={[styles.breakdownFormula, { color: theme.colors.text.secondary }]}>
            {carbsNum}g ÷ {icrNum} g/unit
          </Text>

          <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.text.secondary }]}>Correction dose</Text>
            <Text style={[styles.breakdownValue, { color: correctionColor }]}>
              {(glucoseNum > 0 ? correctionDose : 0).toFixed(2)} u{correctionIsNegative ? ' (clamped to 0)' : ''}
            </Text>
          </View>
          <Text style={[styles.breakdownFormula, { color: theme.colors.text.secondary }]}>
            ({formatGlucose(glucoseNum, glucoseUnit)} − {formatGlucose(targetBG, glucoseUnit)}) ÷ {formatISF(isfNum, glucoseUnit)}
          </Text>

          <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text.primary }]}>Total Bolus</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
              {totalBolus.toFixed(2)} u
            </Text>
          </View>
          </View>
        </GlassCard>

        {/* Confirm Dose Button */}
        <TouchableOpacity
          style={[styles.confirmButton, { borderRadius: 14, backgroundColor: theme.colors.primary[600], borderWidth: 1, borderColor: theme.colors.border }]}
          onPress={confirmDose}
        >
          <View style={styles.confirmButtonInner}>
            <Icon name="needle" size={20} color={theme.colors.text.inverse} />
            <Text style={styles.confirmButtonText}>Confirm Dose</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  headerSubtitle: { fontSize: 16, marginTop: 4 },
  card: { borderRadius: 16, padding: 24, marginBottom: 16 },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  cgmSpinner: { alignSelf: 'flex-start', marginVertical: 14 },
  settingsRow: { flexDirection: 'row', marginBottom: 4 },
  settingsPill: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  settingsPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  settingsPillValue: { fontSize: 15, fontWeight: '600' },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownLabel: { fontSize: 15 },
  breakdownValue: { fontSize: 15, fontWeight: '600' },
  breakdownFormula: { fontSize: 12, marginBottom: 12 },
  divider: { height: 1, marginBottom: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 32, fontWeight: '700' },
  confirmButton: {
    marginTop: 4,
    overflow: 'hidden',
  },
  confirmButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
