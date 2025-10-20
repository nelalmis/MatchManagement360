// src/hooks/useLeague.ts
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchMyLeagues,
  fetchActiveLeagues,
  fetchLeagueById,
  createLeague,
  joinLeague,
  leaveLeague,
  updateLeague,
  toggleFriendlyMatches,
  setCurrentLeague,
  clearError,
} from '../store/slices/leagueSlice';
import { ILeague } from '../types/types';

export const useLeague = () => {
  const dispatch = useAppDispatch();
  const {
    currentLeague,
    myLeagues,
    publicLeagues,
    loading,
    error,
    filters,
  } = useAppSelector((state) => state.league);

  const { user } = useAppSelector((state) => state.auth);

  /**
   * Load my leagues on mount
   */
  useEffect(() => {
    if (user?.uid && myLeagues.length === 0) {
      dispatch(fetchMyLeagues(user.uid));
    }
  }, [user?.uid, dispatch]);

  /**
   * Get my leagues
   */
  const loadMyLeagues = useCallback(async () => {
    if (!user?.uid) return;
    const result = await dispatch(fetchMyLeagues(user.uid));
    return fetchMyLeagues.fulfilled.match(result);
  }, [dispatch, user?.uid]);

  /**
   * Get active/public leagues
   */
  const loadActiveLeagues = useCallback(async () => {
    const result = await dispatch(fetchActiveLeagues());
    return fetchActiveLeagues.fulfilled.match(result);
  }, [dispatch]);

  /**
   * Get league by ID
   */
  const getLeague = useCallback(
    async (leagueId: string) => {
      const result = await dispatch(fetchLeagueById(leagueId));
      return fetchLeagueById.fulfilled.match(result)
        ? result.payload
        : null;
    },
    [dispatch]
  );

  /**
   * Create new league
   */
  const createNewLeague = useCallback(
    async (leagueData: Omit<ILeague, 'id'>) => {
      const result = await dispatch(createLeague(leagueData));
      
      if (createLeague.fulfilled.match(result)) {
        return { success: true, data: result.payload };
      }
      
      return { success: false, error: result.payload as string };
    },
    [dispatch]
  );

  /**
   * Join a league
   */
  const joinLeagueById = useCallback(
    async (leagueId: string) => {
      if (!user?.uid) {
        return { success: false, error: 'Kullanıcı girişi gerekli' };
      }

      const result = await dispatch(
        joinLeague({ leagueId, userId: user.uid })
      );

      if (joinLeague.fulfilled.match(result)) {
        return { success: true, data: result.payload };
      }

      return { success: false, error: result.payload as string };
    },
    [dispatch, user?.uid]
  );

  /**
   * Leave a league
   */
  const leaveLeagueById = useCallback(
    async (leagueId: string) => {
      if (!user?.uid) {
        return { success: false, error: 'Kullanıcı girişi gerekli' };
      }

      const result = await dispatch(
        leaveLeague({ leagueId, userId: user.uid })
      );

      if (leaveLeague.fulfilled.match(result)) {
        return { success: true };
      }

      return { success: false, error: result.payload as string };
    },
    [dispatch, user?.uid]
  );

  /**
   * Update league
   */
  const updateLeagueById = useCallback(
    async (leagueId: string, updates: Partial<ILeague>) => {
      const result = await dispatch(updateLeague({ leagueId, updates }));

      if (updateLeague.fulfilled.match(result)) {
        return { success: true, data: result.payload };
      }

      return { success: false, error: result.payload as string };
    },
    [dispatch]
  );

  /**
   * Toggle friendly matches
   */
  const toggleFriendly = useCallback(
    async (leagueId: string) => {
      const result = await dispatch(toggleFriendlyMatches(leagueId));

      if (toggleFriendlyMatches.fulfilled.match(result)) {
        return { success: true, data: result.payload };
      }

      return { success: false, error: result.payload as string };
    },
    [dispatch]
  );

  /**
   * Select current league
   */
  const selectLeague = useCallback(
    (league: ILeague | null) => {
      dispatch(setCurrentLeague(league));
    },
    [dispatch]
  );

  /**
   * Check if user is member of league
   */
  const isMemberOfLeague = useCallback(
    (leagueId: string): boolean => {
      if (!user?.uid) return false;
      return myLeagues.some((league) => league.id === leagueId);
    },
    [myLeagues, user?.uid]
  );

  /**
   * Get league by ID from state (cached)
   */
  const getLeagueFromCache = useCallback(
    (leagueId: string): ILeague | null => {
      return (
        myLeagues.find((l) => l.id === leagueId) ||
        publicLeagues.find((l) => l.id === leagueId) ||
        null
      );
    },
    [myLeagues, publicLeagues]
  );

  /**
   * Clear error
   */
  const clearLeagueError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    currentLeague,
    myLeagues,
    publicLeagues,
    loading,
    error,
    filters,

    // Actions
    loadMyLeagues,
    loadActiveLeagues,
    getLeague,
    createNewLeague,
    joinLeagueById,
    leaveLeagueById,
    updateLeagueById,
    toggleFriendly,
    selectLeague,

    // Utilities
    isMemberOfLeague,
    getLeagueFromCache,
    clearError: clearLeagueError,
  };
};

export default useLeague;