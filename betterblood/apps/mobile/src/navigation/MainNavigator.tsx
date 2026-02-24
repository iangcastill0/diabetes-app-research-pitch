import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardScreen } from '../screens/main/DashboardScreen';
import { HistoryScreen } from '../screens/main/HistoryScreen';
import { FoodScreen } from '../screens/main/FoodScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { BolusCalculatorScreen } from '../screens/main/BolusCalculatorScreen';
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

  const screenOptions = ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName = '';

      switch (route.name) {
        case 'Dashboard':
          iconName = focused ? 'chart-line' : 'chart-line';
          break;
        case 'History':
          iconName = focused ? 'history' : 'history';
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
    tabBarActiveTintColor: '#009173',
    tabBarInactiveTintColor: '#6B7280',
    tabBarStyle: {
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingBottom: 8 + bottom,
      paddingTop: 8,
      height: 64 + bottom,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
  });

  return (
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
  );
};
