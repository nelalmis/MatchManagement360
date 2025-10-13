// ============================================
// APP.TSX (DEBUG VERSION)
// ============================================
// useEffect hatası için debug edilmiş versiyon

import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context
import { AppProvider } from './src/context/AppContext';

// Navigation
import { RootNavigator } from './src/navigation';
import { SideMenuProvider } from './src/context/SideMenuContext';

export default function App() {
  // ⚠️ Notification kodları geçici olarak kaldırıldı
  // useEffect sorunu çözüldükten sonra eklenecek

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <SideMenuProvider> {/* ✅ */}
            <StatusBar
              barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
              backgroundColor="#16a34a"
            />
            <RootNavigator />
          </SideMenuProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}