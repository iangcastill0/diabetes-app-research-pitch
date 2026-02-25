import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = (): React.JSX.Element => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, sceneContainerStyle: { backgroundColor: 'transparent' } }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};
