import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';

export const SettingsScreen = (): React.JSX.Element => {
  const { theme, isDark, toggleTheme } = useTheme();
  const user = useAuthStore(state => state.user);
  const clearAuth = useAuthStore(state => state.clearAuth);

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
          value: user?.settings?.glucoseUnit === 'mg_dl' ? 'mg/dL' : 'mmol/L',
          onPress: () => {},
        },
        {
          icon: 'bullseye-arrow',
          label: 'Target Range',
          value: user?.settings
            ? `${user.settings.targetRangeMin}-${user.settings.targetRangeMax} mg/dL`
            : '70-180 mg/dL',
          onPress: () => {},
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

        {settingsSections.map((section, sectionIndex) => (
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
