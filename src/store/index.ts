// ============================================
// src/store/index.ts
// ============================================
import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import all slices
import authReducer from './slices/authSlice';
// import leagueReducer from './slices/leagueSlice';
// import matchReducer from './slices/matchSlice';
import notificationReducer from './slices/notificationSlice';
import playerReducer from './slices/playerSlice';
import uiReducer from './slices/uiSlice';
import appConfigReducer from './slices/appConfigSlice';

// Root reducer with all slices
const rootReducer = combineReducers({
  auth: authReducer,
  appConfig: appConfigReducer,
  // league: leagueReducer,
  // match: matchReducer,
  notification: notificationReducer,
  player: playerReducer,
  ui: uiReducer,
});

// Persist config
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'ui', 'appConfig'], // Persist edilecek reducer'lar
  blacklist: ['notification'], // Notification'ları persist etme
};
// ✅ Alternatif: Sadece config'i persist et, loading/error'u etme
const appConfigPersistConfig = {
  key: 'appConfig',
  storage: AsyncStorage,
  whitelist: ['config', 'lastFetched'], // Sadece bunları persist et
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__, // Development'ta Redux DevTools
});

// export const persistor = persistStore(store);

export const persistor = persistStore(store, null, () => {
  console.log('✅ Redux persist rehydration complete');
  console.log('📊 Rehydrated State:', {
    auth: store.getState().auth.isAuthenticated,
    config: !!store.getState().appConfig.config,
  });
});
// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============================================
// LOG STORE INITIALIZATION (Development)
// ============================================
if (__DEV__) {
  console.log('🗃️ Redux Store Initialized with slices:', {
    auth: '✅',
    league: '✅',
    match: '✅',
    notification: '✅',
    player: '✅',
    ui: '✅',
  });
}