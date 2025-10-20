// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Import slices
import authReducer from './slices/authSlice';
import leagueReducer from './slices/leagueSlice';
import matchReducer from './slices/matchSlice';
import playerReducer from './slices/playerSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';

// ============================================
// PERSIST CONFIG
// ============================================
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'ui'], // Only persist these reducers
  blacklist: ['league', 'match', 'player', 'notification'], // Don't persist these
};

// ============================================
// ROOT REDUCER
// ============================================
const rootReducer = combineReducers({
  auth: authReducer,
  league: leagueReducer,
  match: matchReducer,
  player: playerReducer,
  notification: notificationReducer,
  ui: uiReducer,
});

// ============================================
// PERSISTED REDUCER
// ============================================
const persistedReducer = persistReducer(persistConfig, rootReducer);

// ============================================
// STORE CONFIGURATION
// ============================================
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// ============================================
// PERSISTOR
// ============================================
export const persistor = persistStore(store);

// ============================================
// TYPES
// ============================================
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
