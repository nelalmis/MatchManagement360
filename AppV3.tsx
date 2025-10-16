// App.tsx
import 'react-native-gesture-handler'; // ✅ En üstte olmalı
import React, { useEffect } from 'react';
import { StatusBar, Platform, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context Providers
import { AppProvider } from './src/context/AppContext';
import { SideMenuProvider } from './src/context/SideMenuContext';

// Navigation
import { RootNavigator } from './src/navigation';

// ============================================
// APP COMPONENT
// ============================================

export default function App() {
  useEffect(() => {
    // ============================================
    // LOG BOX WARNINGS (Development Only)
    // ============================================
    // if (__DEV__) {
    //   // Bilinen navigation uyarılarını gizle
    //   LogBox.ignoreLogs([
    //     'Non-serializable values were found in the navigation state',
    //     'VirtualizedLists should never be nested',
    //   ]);
    // }

    // ============================================
    // NOTIFICATION SETUP (TODO)
    // ============================================
    // const setupNotifications = async () => {
    //   const { status } = await Notifications.requestPermissionsAsync();
    //   if (status !== 'granted') {
    //     console.log('Notification permission denied');
    //     return;
    //   }
    //   const token = await Notifications.getExpoPushTokenAsync();
    //   console.log('Push token:', token);
    // };
    // setupNotifications();

  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <SideMenuProvider>
            <StatusBar
              barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
              backgroundColor="#16a34a"
              translucent={false}
            />
            <RootNavigator />
          </SideMenuProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ============================================
// ALTERNATIVE: APP WITH ERROR BOUNDARY
// ============================================

/*
import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Bir Hata Oluştu</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Bilinmeyen hata'}
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={this.handleReset}>
            <Text style={styles.errorButtonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
*/