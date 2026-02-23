import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { DashboardScreen } from '../screens/main/DashboardScreen';
import { HistoryScreen } from '../screens/main/HistoryScreen';
import { FoodScreen } from '../screens/main/FoodScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { useTheme } from '../theme/ThemeProvider';

export type MainTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Food: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

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
    paddingBottom: 8,
    paddingTop: 8,
    height: 64,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export const MainNavigator = (): React.JSX.Element => {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Food" component={FoodScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
