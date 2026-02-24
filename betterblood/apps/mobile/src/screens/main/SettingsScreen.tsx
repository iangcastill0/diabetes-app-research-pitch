import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import { formatGlucose, parseGlucoseInput, unitLabel } from '../../utils/glucose';

export const SettingsScreen = (): React.JSX.Element => {
  const { theme, isDark, toggleTheme } = useTheme();
  const user = useAuthStore(state => state.user);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const doseSettings = useAuthStore(state => state.doseSettings);
  const updateDoseSettings = useAuthStore(state => state.updateDoseSettings);

  const [icr, setIcr] = useState(String(doseSettings.icr));
  const [isf, setIsf] = useState(formatGlucose(doseSettings.isf, doseSettings.glucoseUnit));
  const [targetBG, setTargetBG] = useState(formatGlucose(doseSettings.targetBG, doseSettings.glucoseUnit));
  const [rangeMin, setRangeMin] = useState(formatGlucose(doseSettings.targetRangeMin, doseSettings.glucoseUnit));
  const [rangeMax, setRangeMax] = useState(formatGlucose(doseSettings.targetRangeMax, doseSettings.glucoseUnit));

  // Prevents the rehydration sync from overwriting in-progress typing
  const isEditing = useRef(false);

  // Sync local inputs once after Zustand rehydrates from AsyncStorage
  useEffect(() => {
    if (!isEditing.current) {
      setIcr(String(doseSettings.icr));
      setIsf(formatGlucose(doseSettings.isf, doseSettings.glucoseUnit));
      setTargetBG(formatGlucose(doseSettings.targetBG, doseSettings.glucoseUnit));
      setRangeMin(formatGlucose(doseSettings.targetRangeMin, doseSettings.glucoseUnit));
      setRangeMax(formatGlucose(doseSettings.targetRangeMax, doseSettings.glucoseUnit));
    }
  }, [doseSettings]);

  // Re-format glucose display values whenever the unit changes
  useEffect(() => {
    setIsf(formatGlucose(doseSettings.isf, doseSettings.glucoseUnit));
    setTargetBG(formatGlucose(doseSettings.targetBG, doseSettings.glucoseUnit));
    setRangeMin(formatGlucose(doseSettings.targetRangeMin, doseSettings.glucoseUnit));
    setRangeMax(formatGlucose(doseSettings.targetRangeMax, doseSettings.glucoseUnit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doseSettings.glucoseUnit]);

  const handleChange = (
    setter: (v: string) => void,
    key: keyof typeof doseSettings,
  ) => (val: string) => {
    isEditing.current = true;
    setter(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) updateDoseSettings({ [key]: num });
  };

  // For glucose-type fields: converts from user's selected unit back to mg/dL before saving
  const handleGlucoseChange = (
    setter: (v: string) => void,
    key: keyof typeof doseSettings,
  ) => (val: string) => {
    isEditing.current = true;
    setter(val);
    const mgVal = parseGlucoseInput(val, doseSettings.glucoseUnit);
    if (mgVal > 0) updateDoseSettings({ [key]: mgVal });
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearAuth();
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'account-circle',
          label: 'Profile',
          value: user?.profile?.firstName
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : 'Not set',
          onPress: () => {},
        },
        {
          icon: 'email',
          label: 'Email',
          value: user?.email || 'Not set',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: isDark ? 'weather-night' : 'weather-sunny',
          label: 'Dark Mode',
          value: isDark ? 'On' : 'Off',
          onPress: toggleTheme,
        },
        {
          icon: 'tune',
          label: 'Glucose Units',
          value: doseSettings.glucoseUnit === 'mg_dl' ? 'mg/dL' : 'mmol/L',
          onPress: () => {
            Alert.alert(
              'Glucose Units',
              'Choose your preferred unit',
              [
                {
                  text: 'mg/dL',
                  onPress: () => updateDoseSettings({ glucoseUnit: 'mg_dl' }),
                },
                {
                  text: 'mmol/L',
                  onPress: () => updateDoseSettings({ glucoseUnit: 'mmol_l' }),
                },
                { text: 'Cancel', style: 'cancel' },
              ],
            );
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          label: 'Help Center',
          value: '',
          onPress: () => {},
        },
        {
          icon: 'shield-check',
          label: 'Privacy Policy',
          value: '',
          onPress: () => {},
        },
        {
          icon: 'file-document',
          label: 'Terms of Service',
          value: '',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Settings
          </Text>
        </View>

        {settingsSections.slice(0, 2).map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
              {section.title}
            </Text>
            <View
              style={[
                styles.sectionContent,
                { backgroundColor: theme.colors.card },
                theme.shadows.sm,
              ]}
            >
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    <Icon
                      name={item.icon}
                      size={20}
                      color={theme.colors.primary[500]}
                      style={styles.settingIcon}
                    />
                    <Text
                      style={[styles.settingLabel, { color: theme.colors.text.primary }]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    {item.value && (
                      <Text
                        style={[
                          styles.settingValue,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        {item.value}
                      </Text>
                    )}
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={theme.colors.text.disabled}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Glucose Targets */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
            Glucose Targets
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
            <View style={[styles.inputItem, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
              <View style={styles.inputItemLeft}>
                <Icon name="bullseye-arrow" size={20} color={theme.colors.primary[500]} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>Target BG ({unitLabel(doseSettings.glucoseUnit)})</Text>
              </View>
              <TextInput
                style={[styles.inlineInput, { color: theme.colors.text.primary, borderColor: theme.colors.primary[200] ?? '#A7F3D0' }]}
                value={targetBG}
                onChangeText={handleGlucoseChange(setTargetBG, 'targetBG')}
                keyboardType="numeric"
                placeholder="120"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
            <View style={[styles.inputItem, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
              <View style={styles.inputItemLeft}>
                <Icon name="arrow-collapse-down" size={20} color={theme.colors.primary[500]} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>Range Min ({unitLabel(doseSettings.glucoseUnit)})</Text>
              </View>
              <TextInput
                style={[styles.inlineInput, { color: theme.colors.text.primary, borderColor: theme.colors.primary[200] ?? '#A7F3D0' }]}
                value={rangeMin}
                onChangeText={handleGlucoseChange(setRangeMin, 'targetRangeMin')}
                keyboardType="numeric"
                placeholder="70"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
            <View style={styles.inputItem}>
              <View style={styles.inputItemLeft}>
                <Icon name="arrow-collapse-up" size={20} color={theme.colors.primary[500]} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>Range Max ({unitLabel(doseSettings.glucoseUnit)})</Text>
              </View>
              <TextInput
                style={[styles.inlineInput, { color: theme.colors.text.primary, borderColor: theme.colors.primary[200] ?? '#A7F3D0' }]}
                value={rangeMax}
                onChangeText={handleGlucoseChange(setRangeMax, 'targetRangeMax')}
                keyboardType="numeric"
                placeholder="180"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
          </View>
        </View>

        {/* Insulin Parameters */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
            Insulin Parameters
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
            <View style={[styles.inputItem, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
              <View style={styles.inputItemLeft}>
                <Icon name="food-apple" size={20} color={theme.colors.primary[500]} style={styles.settingIcon} />
                <View>
                  <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>ICR (g / unit)</Text>
                  <Text style={[styles.inputHint, { color: theme.colors.text.secondary }]}>Insulin-to-Carb Ratio</Text>
                </View>
              </View>
              <TextInput
                style={[styles.inlineInput, { color: theme.colors.text.primary, borderColor: theme.colors.primary[200] ?? '#A7F3D0' }]}
                value={icr}
                onChangeText={handleChange(setIcr, 'icr')}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
            <View style={styles.inputItem}>
              <View style={styles.inputItemLeft}>
                <Icon name="needle" size={20} color={theme.colors.primary[500]} style={styles.settingIcon} />
                <View>
                  <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>ISF ({unitLabel(doseSettings.glucoseUnit)} / unit)</Text>
                  <Text style={[styles.inputHint, { color: theme.colors.text.secondary }]}>Insulin Sensitivity Factor</Text>
                </View>
              </View>
              <TextInput
                style={[styles.inlineInput, { color: theme.colors.text.primary, borderColor: theme.colors.primary[200] ?? '#A7F3D0' }]}
                value={isf}
                onChangeText={handleGlucoseChange(setIsf, 'isf')}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
          </View>
        </View>

        {settingsSections.slice(2).map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
              {section.title}
            </Text>
            <View
              style={[
                styles.sectionContent,
                { backgroundColor: theme.colors.card },
                theme.shadows.sm,
              ]}
            >
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    <Icon
                      name={item.icon}
                      size={20}
                      color={theme.colors.primary[500]}
                      style={styles.settingIcon}
                    />
                    <Text
                      style={[styles.settingLabel, { color: theme.colors.text.primary }]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    {item.value && (
                      <Text
                        style={[
                          styles.settingValue,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        {item.value}
                      </Text>
                    )}
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={theme.colors.text.disabled}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
          onPress={confirmLogout}
        >
          <Icon name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: theme.colors.text.disabled }]}>
          BetterBlood v0.1.0
        </Text>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
  },
  inputItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inlineInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    width: 72,
    textAlign: 'right',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
