// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, Platform, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Redux
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';

// Context Providers
import { SideMenuProvider } from './src/context/SideMenuContext';

// Navigation
import { RootNavigator } from './src/navigation';

// Config
import { appConfig } from './src/config/app.config';
import { resetAuthState } from './src/store/slices/authSlice';
import PlayerService from './src/services/serviceLayer/playerService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './src/utils';

export default function App() {
  useEffect(() => {
    if (__DEV__) {
       store.dispatch(resetAuthState());
      console.log('⚙️ App Config:', {
        environment: appConfig.environment,
        apiBaseUrl: appConfig.api.baseUrl,
        useEmulator: appConfig.firebase.useEmulator,
        projectId: appConfig.firebase.projectId,
        platform: Platform.OS,
      });
      console.log(PlayerService.getPlayerByEmail("john.doe@example.com"));

      LogBox.ignoreLogs([
        'Non-serializable values were found in the navigation state',
        'VirtualizedLists should never be nested',
      ]);
    }
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
              <SideMenuProvider>
                <StatusBar
                  barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
                  backgroundColor="#16a34a"
                  translucent={false}
                />
                <RootNavigator />
              </SideMenuProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}