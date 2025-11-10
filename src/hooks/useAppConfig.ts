// src/hooks/useAppConfig.ts
import { useAppSelector } from '../store/hooks';
import { IAppConfig } from '../types/entity/types';
import { useMemo, useEffect } from 'react';
import { selectIsCacheValid } from '../store/slices/appConfigSlice';
import AppConfigService from '../services/serviceLayer/appConfigService';

export const useAppConfig = () => {
  const config = useAppSelector((state) => state.appConfig.config);
  const loading = useAppSelector((state) => state.appConfig.loading);
  const error = useAppSelector((state) => state.appConfig.error);
  const isCacheValid = useAppSelector(selectIsCacheValid);

  // ✅ Cache geçersizse otomatik refresh
  useEffect(() => {
    if (!isCacheValid && !loading) {
      console.log('🔄 useAppConfig: Cache invalid, refreshing...');
      AppConfigService.refreshConfig();
    }
  }, [isCacheValid, loading]);

  const isMaintenanceMode = useMemo(() => 
    config?.app.maintenanceMode || false, 
    [config]
  );

  const features = useMemo(() => 
    config?.features || {
      friendlyMatches: true,
      ratingSystem: true,
      commentSystem: true,
      paymentTracking: true,
      mvpSystem: true,
      notifications: true,
      invitations: true,
      multiLeague: true,
    }, 
    [config]
  );

  const defaults = useMemo(() => 
    config?.defaults || {
      seasonDuration: 180,
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      minPlayersToStart: 8,
      registrationDeadlineHours: 2,
      autoArchiveMonths: 12,
    },
    [config]
  );

  const limits = useMemo(() => 
    config?.limits || {
      maxLeaguesPerUser: 5,
      maxPlayersPerLeague: 100,
      maxMatchesPerDay: 10,
      maxCommentsPerMatch: 50,
      maxInvitationsPerMatch: 20,
    },
    [config]
  );

  const isFeatureEnabled = (featureName: keyof IAppConfig['features']): boolean => {
    return features[featureName] || false;
  };

  const getLimit = (limitName: keyof IAppConfig['limits']): number => {
    return limits[limitName] || 0;
  };

  const getDefault = (defaultName: keyof IAppConfig['defaults']): number => {
    return defaults[defaultName] || 0;
  };

  return {
    config,
    loading,
    error,
    isCacheValid,
    isMaintenanceMode,
    features,
    defaults,
    limits,
    isFeatureEnabled,
    getLimit,
    getDefault,
  };
};