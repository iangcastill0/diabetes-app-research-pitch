import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'react-native';

import { RootNavigator } from './navigation/RootNavigator';
import { useAuthStore } from './store/authStore';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Inner component so navTheme can react to theme toggle via useTheme()
function AppContent(): React.JSX.Element {
  const { isDark } = useTheme();

  const navTheme = isDark
    ? {
        dark: true,
        colors: {
          primary: '#E2E8F0',
          background: '#080C14',
          card: 'rgba(8,12,20,0.90)',
          text: '#FFFFFF',
          border: 'rgba(255,255,255,0.08)',
          notification: '#F87171',
        },
      }
    : {
        dark: false,
        colors: {
          primary: '#334155',
          background: '#FFFFFF',
          card: '#FFFFFF',
          text: '#111827',
          border: '#E5E7EB',
          notification: '#EF4444',
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
