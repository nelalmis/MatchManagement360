// ============================================
// APP.TSX (DEBUG VERSION)
// ============================================
// useEffect hatası için debug edilmiş versiyon
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context
import { AppProvider } from './src/context/AppContext';

// Navigation
import { RootNavigatorV3 } from './src/navigation';
import { SideMenuProvider } from './src/context/SideMenuContext';

export default function AppV3() {
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
            <RootNavigatorV3 />
          </SideMenuProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}