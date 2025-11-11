// App.tsx
import React, { useEffect, useState, useRef } from 'react';
import { 
  StatusBar, 
  Platform, 
  LogBox, 
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store';
import { setConfig, setError, setLoading, selectIsCacheValid } from './src/store/slices/appConfigSlice';
import { SideMenuProvider } from './src/context/SideMenuContext';
import { TabBarProvider } from './src/context/TabBarContext';
import { RootNavigator } from './src/navigation';
import { appConfig } from './src/config/app.config';
import AppConfigService from './src/services/serviceLayer/appConfigService';
import { useAppStateListener } from './src/hooks/useAppStateListener'; // ✅ Import
import { LoadingScreen } from './src/screens';

function AppContent() {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const configListenerRef = useRef<(() => void) | null>(null);

  // ✅ App state listener hook
  useAppStateListener({
    onForeground: async () => {
      console.log('🔄 App came to foreground - checking config cache');
      await refreshConfigIfNeeded();
    },
    onBackground: () => {
      console.log('💤 App went to background');
      // Optional: pause certain operations
    },
    enabled: isConfigLoaded, // Only enable after initial config load
  });

  useEffect(() => {
    initializeApp();

    return () => {
      if (configListenerRef.current) {
        configListenerRef.current();
        configListenerRef.current = null;
      }
    };
  }, []);

  const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app...');

    // ✅ Wait for persist rehydration (improved)
    const state = store.getState();
    
    if (state._persist?.rehydrated) {
      // ✅ Zaten rehydrate olmuş
      console.log('✅ Store already rehydrated');
    } else {
      // ✅ Rehydration bekle
      console.log('⏳ Waiting for store rehydration...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ Store rehydration timeout');
          reject(new Error('Store rehydration timeout'));
        }, 5000); // 5 saniye timeout

        const unsubscribe = store.subscribe(() => {
          const currentState = store.getState();
          if (currentState._persist?.rehydrated) {
            clearTimeout(timeout);
            unsubscribe();
            console.log('✅ Store rehydrated');
            resolve();
          }
        });
      });
    }

    // ✅ Check cache validity
    const currentState = store.getState();
    const isCacheValid = selectIsCacheValid(currentState);

    if (isCacheValid && currentState.appConfig.config) {
      console.log('✅ Using cached config', {
        version: currentState.appConfig.config.app.version,
        lastFetched: new Date(currentState.appConfig.lastFetched!).toISOString(),
      });
      setIsConfigLoaded(true);
      
      // Background'da yeni config çek
      fetchConfigInBackground();
    } else {
      console.log('📥 Fetching fresh config...', {
        cacheValid: isCacheValid,
        hasConfig: !!currentState.appConfig.config,
      });
      await fetchConfig();
    }

    // ✅ Start real-time listener
    startConfigListener();

  } catch (error: any) {
    console.error('❌ App initialization error:', error);
    store.dispatch(setError(error.message || 'Unknown error'));
    setIsConfigLoaded(true); // Yine de devam et
  }
};

  const fetchConfig = async () => {
    try {
      store.dispatch(setLoading(true));
      
      const configResult = await AppConfigService.getConfig(true);

      if (configResult.success && configResult.data) {
        store.dispatch(setConfig(configResult.data));
        console.log('✅ Config loaded:', configResult.data.app.version);
      } else {
        console.warn('⚠️ Failed to load config:', configResult.error?.message);
        store.dispatch(setError(configResult.error?.message || 'Config load failed'));
      }
    } finally {
      setIsConfigLoaded(true);
    }
  };

  const fetchConfigInBackground = async () => {
    try {
      console.log('🔄 Background config refresh...');
      const configResult = await AppConfigService.getConfig(true);

      if (configResult.success && configResult.data) {
        store.dispatch(setConfig(configResult.data));
        console.log('✅ Background config updated');
      }
    } catch (error) {
      console.error('❌ Background config refresh failed:', error);
    }
  };

  const refreshConfigIfNeeded = async () => {
    const state = store.getState();
    const isCacheValid = selectIsCacheValid(state);

    if (!isCacheValid) {
      console.log('🔄 Cache expired, refreshing...');
      await fetchConfigInBackground();
    } else {
      console.log('✅ Cache still valid, no refresh needed');
    }
  };

  const startConfigListener = () => {
    configListenerRef.current = AppConfigService.subscribeToConfigChangesWithRetry(
      (updatedConfig) => {
        console.log('📡 Config updated from Firestore:', updatedConfig.app.version);
        store.dispatch(setConfig(updatedConfig));
      },
      3 // Max 3 retry
    );
  };

  useEffect(() => {
    if (__DEV__) {
      console.log('⚙️ App Config:', {
        environment: appConfig.environment,
        apiBaseUrl: appConfig.api.baseUrl,
        useEmulator: appConfig.firebase.useEmulator,
        projectId: appConfig.firebase.projectId,
        platform: Platform.OS,
      });

      LogBox.ignoreLogs([
        'Non-serializable values were found in the navigation state',
        'VirtualizedLists should never be nested',
      ]);
    }
  }, []);

  // ✅ Loading screen
  if (!isConfigLoaded) {
     return <LoadingScreen />
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <TabBarProvider>
              <SideMenuProvider>
                <StatusBar
                  barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
                  backgroundColor="#16a34a"
                  translucent={false}
                />
                <AppContent />
              </SideMenuProvider>
            </TabBarProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}