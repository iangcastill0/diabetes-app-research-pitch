import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardScreen } from '../screens/main/DashboardScreen';
import { HistoryScreen } from '../screens/main/HistoryScreen';
import { FoodScreen } from '../screens/main/FoodScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { BolusCalculatorScreen } from '../screens/main/BolusCalculatorScreen';
import { AmbientBackground } from '../components/AmbientBackground';
import { useTheme } from '../theme/ThemeProvider';

export type MainTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Food: undefined;
  BolusCalculator: { carbs?: number } | undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = (): React.JSX.Element => {
  const { bottom } = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const screenOptions = ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName = '';

      switch (route.name) {
        case 'Dashboard':
          iconName = 'chart-line';
          break;
        case 'History':
          iconName = 'history';
          break;
        case 'Food':
          iconName = focused ? 'food-apple' : 'food-apple-outline';
          break;
        case 'BolusCalculator':
          iconName = 'calculator';
          break;
        case 'Settings':
          iconName = focused ? 'cog' : 'cog-outline';
          break;
      }

      return <Icon name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: theme.colors.primary[500],
    tabBarInactiveTintColor: theme.colors.text.disabled,
    tabBarStyle: {
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
      backgroundColor: isDark ? 'rgba(8,12,20,0.90)' : '#FFFFFF',
      paddingBottom: 8 + bottom,
      paddingTop: 8,
      height: 64 + bottom,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
    // Let ambient background show through each screen
    sceneContainerStyle: { backgroundColor: 'transparent' },
    headerShown: false,
  });

  return (
    // Dark base provides the deep canvas; AmbientBackground renders the orbs above it
    <View style={{ flex: 1, backgroundColor: isDark ? '#080C14' : theme.colors.background }}>
      {isDark && <AmbientBackground />}
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Food" component={FoodScreen} />
        <Tab.Screen
          name="BolusCalculator"
          component={BolusCalculatorScreen}
          options={{ tabBarLabel: 'Calculator' }}
        />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </View>
  );
};
