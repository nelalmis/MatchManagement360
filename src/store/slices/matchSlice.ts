// // src/store/slices/matchSlice.ts
// import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
// import { IMatch, MatchType, SportType } from '../../types/entity/types';
// import { MatchService } from '../../services/serviceLayer/matchService';

// interface MatchState {
//   currentMatch: IMatch | null;
//   upcomingMatches: IMatch[];
//   pastMatches: IMatch[];
//   myMatches: IMatch[];
//   publicFriendlyMatches: IMatch[];
//   loading: {
//     matches: boolean;
//     currentMatch: boolean;
//     action: boolean;
//   };
//   error: string | null;
//   filters: {
//     status: IMatch['status'] | null;
//     type: MatchType | null;
//     leagueId: string | null;
//     dateRange: {
//       start: Date | null;
//       end: Date | null;
//     };
//   };
// }

// const initialState: MatchState = {
//   currentMatch: null,
//   upcomingMatches: [],
//   pastMatches: [],
//   myMatches: [],
//   publicFriendlyMatches: [],
//   loading: {
//     matches: false,
//     currentMatch: false,
//     action: false,
//   },
//   error: null,
//   filters: {
//     status: null,
//     type: null,
//     leagueId: null,
//     dateRange: {
//       start: null,
//       end: null,
//     },
//   },
// };

// // ============================================
// // ASYNC THUNKS
// // ============================================

// export const fetchUpcomingMatches = createAsyncThunk<
//   IMatch[],
//   number | undefined,
//   { rejectValue: string }
// >(
//   'match/fetchUpcomingMatches',
//   async (daysAhead = 7, { rejectWithValue }) => {
//     try {
//       const matches = await matchService.getUpcomingMatches(daysAhead);
//       return matches;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch upcoming matches');
//     }
//   }
// );

// export const fetchPastMatches = createAsyncThunk<
//   IMatch[],
//   void,
//   { rejectValue: string }
// >(
//   'match/fetchPastMatches',
//   async (_, { rejectWithValue }) => {
//     try {
//       const matches = await matchService.getMatchesByStatus('Tamamlandı');
//       return matches;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch past matches');
//     }
//   }
// );

// export const fetchMyMatches = createAsyncThunk<
//   IMatch[],
//   string,
//   { rejectValue: string }
// >(
//   'match/fetchMyMatches',
//   async (playerId, { rejectWithValue }) => {
//     try {
//       const matches = await matchService.getMatchesByPlayer(playerId);
//       return matches;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch my matches');
//     }
//   }
// );

// export const fetchMatchById = createAsyncThunk<
//   IMatch,
//   string,
//   { rejectValue: string }
// >(
//   'match/fetchMatchById',
//   async (matchId, { rejectWithValue }) => {
//     try {
//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }
//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch match');
//     }
//   }
// );

// export const fetchLeagueMatches = createAsyncThunk<
//   IMatch[],
//   string,
//   { rejectValue: string }
// >(
//   'match/fetchLeagueMatches',
//   async (leagueId, { rejectWithValue }) => {
//     try {
//       const matches = await matchService.getMatchesByLeague(leagueId);
//       return matches;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch league matches');
//     }
//   }
// );

// export const fetchPublicFriendlyMatches = createAsyncThunk<
//   IMatch[],
//   { sportType?: string; location?: string },
//   { rejectValue: string }
// >(
//   'match/fetchPublicFriendlyMatches',
//   async (filters, { rejectWithValue }) => {
//     try {
//       const matches = await matchService.getPublicFriendlyMatches(filters);
//       return matches;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch public friendly matches');
//     }
//   }
// );

// export const registerForMatch = createAsyncThunk<
//   IMatch,
//   { matchId: string; userId: string },
//   { rejectValue: string }
// >(
//   'match/registerForMatch',
//   async ({ matchId, userId }, { rejectWithValue }) => {
//     try {
//       const success = await matchService.registerPlayer(matchId, userId);
//       if (!success) {
//         return rejectWithValue('Failed to register for match');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to register for match');
//     }
//   }
// );

// export const unregisterFromMatch = createAsyncThunk<
//   IMatch,
//   { matchId: string; userId: string },
//   { rejectValue: string }
// >(
//   'match/unregisterFromMatch',
//   async ({ matchId, userId }, { rejectWithValue }) => {
//     try {
//       const success = await matchService.unregisterPlayer(matchId, userId);
//       if (!success) {
//         return rejectWithValue('Failed to unregister from match');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to unregister from match');
//     }
//   }
// );

// export const createFriendlyMatch = createAsyncThunk<
//   IMatch,
//   {
//     organizerId: string;
//     sportType: SportType;
//     title: string;
//     matchStartTime: Date;
//     location: string;
//     staffPlayerCount: number;
//     reservePlayerCount: number;
//     isPublic: boolean;
//     affectsStats: boolean;
//     affectsStandings: boolean;
//     invitedPlayerIds?: string[];
//     linkedLeagueId?: string;
//     pricePerPlayer?: number;
//     peterIban?: string;
//     peterFullName?: string;
//     useDefaults?: boolean;
//   },
//   { rejectValue: string }
// >(
//   'match/createFriendlyMatch',
//   async (data, { rejectWithValue }) => {
//     try {
//       const response = await matchService.createFriendlyMatch(data);
      
//       if (!response.success || !response.id) {
//         return rejectWithValue(response.error || 'Failed to create friendly match');
//       }

//       const match = await matchService.getById(response.id);
//       if (!match) {
//         return rejectWithValue('Match created but not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to create friendly match');
//     }
//   }
// );

// export const updateMatchScore = createAsyncThunk<
//   IMatch,
//   { matchId: string; team1Score: number; team2Score: number },
//   { rejectValue: string }
// >(
//   'match/updateMatchScore',
//   async ({ matchId, team1Score, team2Score }, { rejectWithValue }) => {
//     try {
//       const success = await matchService.updateScore(matchId, team1Score, team2Score);
//       if (!success) {
//         return rejectWithValue('Failed to update score');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to update score');
//     }
//   }
// );

// export const completeMatch = createAsyncThunk<
//   IMatch,
//   string,
//   { rejectValue: string }
// >(
//   'match/completeMatch',
//   async (matchId, { rejectWithValue }) => {
//     try {
//       const success = await matchService.completeMatch(matchId);
//       if (!success) {
//         return rejectWithValue('Failed to complete match');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to complete match');
//     }
//   }
// );

// export const startMatch = createAsyncThunk<
//   IMatch,
//   string,
//   { rejectValue: string }
// >(
//   'match/startMatch',
//   async (matchId, { rejectWithValue }) => {
//     try {
//       const success = await matchService.startMatch(matchId);
//       if (!success) {
//         return rejectWithValue('Failed to start match');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to start match');
//     }
//   }
// );

// export const cancelMatch = createAsyncThunk<
//   IMatch,
//   string,
//   { rejectValue: string }
// >(
//   'match/cancelMatch',
//   async (matchId, { rejectWithValue }) => {
//     try {
//       const success = await matchService.cancelMatch(matchId);
//       if (!success) {
//         return rejectWithValue('Failed to cancel match');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to cancel match');
//     }
//   }
// );

// export const assignTeams = createAsyncThunk<
//   IMatch,
//   {
//     matchId: string;
//     team1PlayerIds: string[];
//     team2PlayerIds: string[];
//     playerPositions?: Record<string, string>;
//   },
//   { rejectValue: string }
// >(
//   'match/assignTeams',
//   async ({ matchId, team1PlayerIds, team2PlayerIds, playerPositions }, { rejectWithValue }) => {
//     try {
//       const success = await matchService.assignTeams(
//         matchId,
//         team1PlayerIds,
//         team2PlayerIds,
//         playerPositions
//       );

//       if (!success) {
//         return rejectWithValue('Failed to assign teams');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to assign teams');
//     }
//   }
// );

// export const addGoalScorer = createAsyncThunk<
//   IMatch,
//   { matchId: string; playerId: string; goals: number; assists: number },
//   { rejectValue: string }
// >(
//   'match/addGoalScorer',
//   async ({ matchId, playerId, goals, assists }, { rejectWithValue }) => {
//     try {
//       const success = await matchService.addGoalScorer(matchId, playerId, goals, assists);
//       if (!success) {
//         return rejectWithValue('Failed to add goal scorer');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to add goal scorer');
//     }
//   }
// );

// export const setMatchMVP = createAsyncThunk<
//   IMatch,
//   { matchId: string; playerId: string },
//   { rejectValue: string }
// >(
//   'match/setMatchMVP',
//   async ({ matchId, playerId }, { rejectWithValue }) => {
//     try {
//       const success = await matchService.setMVP(matchId, playerId);
//       if (!success) {
//         return rejectWithValue('Failed to set MVP');
//       }

//       const match = await matchService.getById(matchId);
//       if (!match) {
//         return rejectWithValue('Match not found');
//       }

//       return match;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to set MVP');
//     }
//   }
// );

// export const invitePlayersToMatch = createAsyncThunk<
//   void,
//   {
//     matchId: string;
//     inviterId: string;
//     playerIds: string[];
//     message?: string;
//     expiresInHours?: number;
//   },
//   { rejectValue: string }
// >(
//   'match/invitePlayersToMatch',
//   async ({ matchId, inviterId, playerIds, message, expiresInHours }, { rejectWithValue }) => {
//     try {
//       await matchService.invitePlayersToMatch(
//         matchId,
//         inviterId,
//         playerIds,
//         message,
//         expiresInHours
//       );
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to invite players');
//     }
//   }
// );

// // ============================================
// // SLICE
// // ============================================

// const matchSlice = createSlice({
//   name: 'match',
//   initialState,
//   reducers: {
//     setCurrentMatch: (state, action: PayloadAction<IMatch | null>) => {
//       state.currentMatch = action.payload;
//     },
//     setFilters: (state, action: PayloadAction<Partial<MatchState['filters']>>) => {
//       state.filters = { ...state.filters, ...action.payload };
//     },
//     clearFilters: (state) => {
//       state.filters = initialState.filters;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//     resetMatchState: () => initialState,
//   },
//   extraReducers: (builder) => {
//     // Fetch Upcoming Matches
//     builder
//       .addCase(fetchUpcomingMatches.pending, (state) => {
//         state.loading.matches = true;
//         state.error = null;
//       })
//       .addCase(fetchUpcomingMatches.fulfilled, (state, action) => {
//         state.loading.matches = false;
//         state.upcomingMatches = action.payload;
//       })
//       .addCase(fetchUpcomingMatches.rejected, (state, action) => {
//         state.loading.matches = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch Past Matches
//     builder
//       .addCase(fetchPastMatches.pending, (state) => {
//         state.loading.matches = true;
//         state.error = null;
//       })
//       .addCase(fetchPastMatches.fulfilled, (state, action) => {
//         state.loading.matches = false;
//         state.pastMatches = action.payload;
//       })
//       .addCase(fetchPastMatches.rejected, (state, action) => {
//         state.loading.matches = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch My Matches
//     builder
//       .addCase(fetchMyMatches.pending, (state) => {
//         state.loading.matches = true;
//         state.error = null;
//       })
//       .addCase(fetchMyMatches.fulfilled, (state, action) => {
//         state.loading.matches = false;
//         state.myMatches = action.payload;
//       })
//       .addCase(fetchMyMatches.rejected, (state, action) => {
//         state.loading.matches = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch Match By ID
//     builder
//       .addCase(fetchMatchById.pending, (state) => {
//         state.loading.currentMatch = true;
//         state.error = null;
//       })
//       .addCase(fetchMatchById.fulfilled, (state, action) => {
//         state.loading.currentMatch = false;
//         state.currentMatch = action.payload;
//       })
//       .addCase(fetchMatchById.rejected, (state, action) => {
//         state.loading.currentMatch = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch League Matches
//     builder
//       .addCase(fetchLeagueMatches.pending, (state) => {
//         state.loading.matches = true;
//         state.error = null;
//       })
//       .addCase(fetchLeagueMatches.fulfilled, (state, action) => {
//         state.loading.matches = false;
//         state.upcomingMatches = action.payload.filter(
//           (m) => m.status !== 'Tamamlandı' && m.status !== 'İptal Edildi'
//         );
//         state.pastMatches = action.payload.filter((m) => m.status === 'Tamamlandı');
//       })
//       .addCase(fetchLeagueMatches.rejected, (state, action) => {
//         state.loading.matches = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch Public Friendly Matches
//     builder
//       .addCase(fetchPublicFriendlyMatches.pending, (state) => {
//         state.loading.matches = true;
//         state.error = null;
//       })
//       .addCase(fetchPublicFriendlyMatches.fulfilled, (state, action) => {
//         state.loading.matches = false;
//         state.publicFriendlyMatches = action.payload;
//       })
//       .addCase(fetchPublicFriendlyMatches.rejected, (state, action) => {
//         state.loading.matches = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Register For Match
//     builder
//       .addCase(registerForMatch.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(registerForMatch.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
        
//         // Update in lists
//         const updateInList = (list: IMatch[]) => {
//           const index = list.findIndex((m) => m.id === action.payload.id);
//           if (index !== -1) {
//             list[index] = action.payload;
//           }
//         };
        
//         updateInList(state.upcomingMatches);
//         updateInList(state.myMatches);
//       })
//       .addCase(registerForMatch.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Unregister From Match
//     builder
//       .addCase(unregisterFromMatch.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(unregisterFromMatch.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
        
//         // Update in lists
//         const updateInList = (list: IMatch[]) => {
//           const index = list.findIndex((m) => m.id === action.payload.id);
//           if (index !== -1) {
//             list[index] = action.payload;
//           }
//         };
        
//         updateInList(state.upcomingMatches);
//         updateInList(state.myMatches);
//       })
//       .addCase(unregisterFromMatch.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Create Friendly Match
//     builder
//       .addCase(createFriendlyMatch.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(createFriendlyMatch.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.upcomingMatches.unshift(action.payload);
//         state.currentMatch = action.payload;
//       })
//       .addCase(createFriendlyMatch.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Update Match Score
//     builder
//       .addCase(updateMatchScore.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(updateMatchScore.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
//       })
//       .addCase(updateMatchScore.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Complete Match
//     builder
//       .addCase(completeMatch.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(completeMatch.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
        
//         // Move from upcoming to past
//         state.upcomingMatches = state.upcomingMatches.filter(
//           (m: IMatch) => m.id !== action.payload.id
//         );
//         state.pastMatches.unshift(action.payload);
//       })
//       .addCase(completeMatch.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Start Match
//     builder
//       .addCase(startMatch.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(startMatch.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
//       })
//       .addCase(startMatch.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Cancel Match
//     builder
//       .addCase(cancelMatch.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(cancelMatch.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
        
//         // Remove from upcoming
//         state.upcomingMatches = state.upcomingMatches.filter(
//           (m: IMatch) => m.id !== action.payload.id
//         );
//       })
//       .addCase(cancelMatch.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Assign Teams
//     builder
//       .addCase(assignTeams.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(assignTeams.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
//       })
//       .addCase(assignTeams.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Add Goal Scorer
//     builder
//       .addCase(addGoalScorer.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(addGoalScorer.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
//       })
//       .addCase(addGoalScorer.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Set Match MVP
//     builder
//       .addCase(setMatchMVP.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(setMatchMVP.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.currentMatch = action.payload;
//       })
//       .addCase(setMatchMVP.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Invite Players To Match
//     builder
//       .addCase(invitePlayersToMatch.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(invitePlayersToMatch.fulfilled, (state) => {
//         state.loading.action = false;
//       })
//       .addCase(invitePlayersToMatch.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });
//   },
// });

// export const {
//   setCurrentMatch,
//   setFilters,
//   clearFilters,
//   clearError,
//   resetMatchState,
// } = matchSlice.actions;

// export default matchSlice.reducer;