// src/hooks/useAppStateListener.ts
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AppStateListenerOptions {
  onForeground?: () => void | Promise<void>;
  onBackground?: () => void | Promise<void>;
  onActive?: () => void | Promise<void>;
  onInactive?: () => void | Promise<void>;
  enabled?: boolean;
}

/**
 * Hook to listen to app state changes
 * @param options - Callback functions for different state transitions
 * @returns Current app state
 */
export const useAppStateListener = (options: AppStateListenerOptions = {}) => {
  const {
    onForeground,
    onBackground,
    onActive,
    onInactive,
    enabled = true,
  } = options;

  const appState = useRef<AppStateStatus>(AppState.currentState);

  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      const previousAppState = appState.current;

      // Log state change
      console.log('📱 App State Change:', {
        from: previousAppState,
        to: nextAppState,
      });

      // ✅ Foreground transition (background/inactive -> active)
      if (
        (previousAppState === 'inactive' || previousAppState === 'background') &&
        nextAppState === 'active'
      ) {
        console.log('📱 → App came to FOREGROUND');
        if (onForeground) {
          await onForeground();
        }
      }

      // ✅ Background transition (active -> background/inactive)
      if (
        previousAppState === 'active' &&
        (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        console.log('📱 → App went to BACKGROUND');
        if (onBackground) {
          await onBackground();
        }
      }

      // ✅ Active state
      if (nextAppState === 'active' && onActive) {
        console.log('📱 → App is ACTIVE');
        await onActive();
      }

      // ✅ Inactive state
      if (nextAppState === 'inactive' && onInactive) {
        console.log('📱 → App is INACTIVE');
        await onInactive();
      }

      // Update ref
      appState.current = nextAppState;
    },
    [onForeground, onBackground, onActive, onInactive]
  );

  useEffect(() => {
    if (!enabled) {
      console.log('📱 App state listener disabled');
      return;
    }

    console.log('📱 App state listener started');

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      console.log('📱 App state listener stopped');
      subscription.remove();
    };
  }, [enabled, handleAppStateChange]);

  return appState.current;
};


/*Usage Example:
 // ✅ Component'e özel app state handling
  useAppStateListener({
    onForeground: async () => {
      console.log('HomeScreen: Refreshing data...');
      await loadFreshData();
    },
    onBackground: () => {
      console.log('HomeScreen: Pausing timers...');
      pauseAutoRefresh();
    },
  });


  const currentAppState = useAppStateListener({
  onForeground: () => console.log('Foreground'),
});




*/