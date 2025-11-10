// src/store/slices/appConfigSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IAppConfig } from '../../types/entity/types';

interface AppConfigState {
  config: IAppConfig | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheValid: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // ✅ 5 dakika cache

const initialState: AppConfigState = {
  config: null,
  loading: false,
  error: null,
  lastFetched: null,
  cacheValid: false,
};

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<IAppConfig>) => {
      state.config = action.payload;
      state.loading = false;
      state.error = null;
      state.lastFetched = Date.now();
      state.cacheValid = true;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    invalidateCache: (state) => {
      state.cacheValid = false;
    },
    clearConfig: (state) => {
      return initialState;
    },
  },
});

// ✅ Cache validation selector
export const selectIsCacheValid = (state: any): boolean => {
  const { lastFetched, cacheValid } = state.appConfig;
  if (!cacheValid || !lastFetched) return false;
  return Date.now() - lastFetched < CACHE_DURATION;
};

export const { setConfig, setLoading, setError, invalidateCache, clearConfig } = appConfigSlice.actions;
export default appConfigSlice.reducer;