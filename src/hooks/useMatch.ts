// // src/hooks/useMatch.ts
// import { useCallback, useEffect } from 'react';
// import { useAppDispatch, useAppSelector } from '../store/hooks';
// import {
//   fetchUpcomingMatches,
//   fetchPastMatches,
//   fetchMyMatches,
//   fetchMatchById,
//   registerForMatch,
//   unregisterFromMatch,
//   createFriendlyMatch,
//   updateMatchScore,
//   completeMatch,
//   startMatch,
//   cancelMatch,
//   assignTeams,
//   setCurrentMatch,
//   clearError,
// } from '../store/slices/matchSlice';

// export const useMatch = () => {
//   const dispatch = useAppDispatch();
//   const {
//     currentMatch,
//     upcomingMatches,
//     pastMatches,
//     myMatches,
//     publicFriendlyMatches,
//     loading,
//     error,
//     filters,
//   } = useAppSelector((state) => state.match);

//   const { user } = useAppSelector((state) => state.auth);

//   /**
//    * Load upcoming matches on mount
//    */
//   useEffect(() => {
//     if (upcomingMatches.length === 0) {
//       dispatch(fetchUpcomingMatches());
//     }
//   }, [dispatch]);

//   /**
//    * Get upcoming matches
//    */
//   const loadUpcomingMatches = useCallback(
//     async (daysAhead?: number) => {
//       const result = await dispatch(fetchUpcomingMatches(daysAhead));
//       return fetchUpcomingMatches.fulfilled.match(result);
//     },
//     [dispatch]
//   );

//   /**
//    * Get past matches
//    */
//   const loadPastMatches = useCallback(async () => {
//     const result = await dispatch(fetchPastMatches());
//     return fetchPastMatches.fulfilled.match(result);
//   }, [dispatch]);

//   /**
//    * Get my matches
//    */
//   const loadMyMatches = useCallback(async () => {
//     if (!user?.id) return false;
//     const result = await dispatch(fetchMyMatches(user.id));
//     return fetchMyMatches.fulfilled.match(result);
//   }, [dispatch, user?.id]);

//   /**
//    * Get match by ID
//    */
//   const getMatch = useCallback(
//     async (matchId: string) => {
//       const result = await dispatch(fetchMatchById(matchId));
//       return fetchMatchById.fulfilled.match(result)
//         ? result.payload
//         : null;
//     },
//     [dispatch]
//   );

//   /**
//    * Register for match
//    */
//   const registerMatch = useCallback(
//     async (matchId: string) => {
//       if (!user?.id) {
//         return { success: false, error: 'Kullanıcı girişi gerekli' };
//       }

//       const result = await dispatch(
//         registerForMatch({ matchId, userId: user.id })
//       );

//       if (registerForMatch.fulfilled.match(result)) {
//         return { success: true, data: result.payload };
//       }

//       return { success: false, error: result.payload as string };
//     },
//     [dispatch, user?.id]
//   );

//   /**
//    * Unregister from match
//    */
//   const unregisterMatch = useCallback(
//     async (matchId: string) => {
//       if (!user?.id) {
//         return { success: false, error: 'Kullanıcı girişi gerekli' };
//       }

//       const result = await dispatch(
//         unregisterFromMatch({ matchId, userId: user.id })
//       );

//       if (unregisterFromMatch.fulfilled.match(result)) {
//         return { success: true, data: result.payload };
//       }

//       return { success: false, error: result.payload as string };
//     },
//     [dispatch, user?.id]
//   );

//   /**
//    * Create friendly match
//    */
//   const createFriendly = useCallback(
//     async (matchData: any) => {
//       const result = await dispatch(createFriendlyMatch(matchData));

//       if (createFriendlyMatch.fulfilled.match(result)) {
//         return { success: true, data: result.payload };
//       }

//       return { success: false, error: result.payload as string };
//     },
//     [dispatch]
//   );

//   /**
//    * Update match score
//    */
//   const updateScore = useCallback(
//     async (matchId: string, team1Score: number, team2Score: number) => {
//       const result = await dispatch(
//         updateMatchScore({ matchId, team1Score, team2Score })
//       );

//       if (updateMatchScore.fulfilled.match(result)) {
//         return { success: true, data: result.payload };
//       }

//       return { success: false, error: result.payload as string };
//     },
//     [dispatch]
//   );

//   /**
//    * Complete match
//    */
//   const finishMatch = useCallback(
//     async (matchId: string) => {
//       const result = await dispatch(completeMatch(matchId));

//       if (completeMatch.fulfilled.match(result)) {
//         return { success: true, data: result.payload };
//       }

//       return { success: false, error: result.payload as string };
//     },
//     [dispatch]
//   );

//   /**
//    * Start match
//    */
//   const beginMatch = useCallback(
//     async (matchId: string) => {
//       const result = await dispatch(startMatch(matchId));

//       if (startMatch.fulfilled.match(result)) {
//         return { success: true, data: result.payload };
//       }

//       return { success: false, error: result.payload as string };
//     },
//     [dispatch]
//   );

//   /**
//    * Cancel match
//    */
//   const cancelMatchById = useCallback(
//     async (matchId: string) => {
//       const result = await dispatch(cancelMatch(matchId));

//       if (cancelMatch.fulfilled.match(result)) {
//         return { success: true, data: result.payload };
//       }

//       return { success: false, error: result.payload as string };
//     },
//     [dispatch]
//   );

//   /**
//    * Assign teams
//    */
//   const setTeams = useCallback(
//     async (
//       matchId: string,
//       team1: string[],
//       team2: string[],
//       positions?: Record<string, string>
//     ) => {
//       const result = await dispatch(
//         assignTeams({
//           matchId,
//           team1PlayerIds: team1,
//           team2PlayerIds: team2,
//           playerPositions: positions,
//         })
//       );

//       if (assignTeams.fulfilled.match(result)) {
//         return { success: true, data: result.payload };
//       }

//       return { success: false, error: result.payload as string };
//     },
//     [dispatch]
//   );

//   /**
//    * Select current match
//    */
//   const selectMatch = useCallback(
//     (match: any) => {
//       dispatch(setCurrentMatch(match));
//     },
//     [dispatch]
//   );

//   /**
//    * Check if user is registered for match
//    */
//   const isRegisteredForMatch = useCallback(
//     (matchId: string): boolean => {
//       if (!user?.id) return false;
//       const match = myMatches.find((m) => m.id === matchId);
//       return match
//         ? match.registeredPlayerIds?.includes(user.id) || false
//         : false;
//     },
//     [myMatches, user?.id]
//   );

//   /**
//    * Clear error
//    */
//   const clearMatchError = useCallback(() => {
//     dispatch(clearError());
//   }, [dispatch]);

//   return {
//     // State
//     currentMatch,
//     upcomingMatches,
//     pastMatches,
//     myMatches,
//     publicFriendlyMatches,
//     loading,
//     error,
//     filters,

//     // Actions
//     loadUpcomingMatches,
//     loadPastMatches,
//     loadMyMatches,
//     getMatch,
//     registerMatch,
//     unregisterMatch,
//     createFriendly,
//     updateScore,
//     finishMatch,
//     beginMatch,
//     cancelMatchById,
//     setTeams,
//     selectMatch,

//     // Utilities
//     isRegisteredForMatch,
//     clearError: clearMatchError,
//   };
// };

// export default useMatch;