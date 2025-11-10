// // src/store/slices/leagueSlice.ts
// import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
// import { ILeague } from '../../types/entity/types';
// import { LeagueService } from '../../services/serviceLayer/leagueService';

// interface LeagueState {
//   currentLeague: ILeague | null;
//   myLeagues: ILeague[];
//   publicLeagues: ILeague[];
//   loading: {
//     leagues: boolean;
//     currentLeague: boolean;
//     action: boolean;
//   };
//   error: string | null;
//   filters: {
//     sportType: string | null;
//     search: string;
//   };
// }

// const initialState: LeagueState = {
//   currentLeague: null,
//   myLeagues: [],
//   publicLeagues: [],
//   loading: {
//     leagues: false,
//     currentLeague: false,
//     action: false,
//   },
//   error: null,
//   filters: {
//     sportType: null,
//     search: '',
//   },
// };

// // ============================================
// // ASYNC THUNKS (ESKİ SERVICE İLE)
// // ============================================

// export const fetchMyLeagues = createAsyncThunk<
//   ILeague[],
//   string,
//   { rejectValue: string }
// >(
//   'league/fetchMyLeagues',
//   async (userId, { rejectWithValue }) => {
//     try {
//       const leagues = await LeagueService.getPlayerLeagues(userId);
//       return leagues;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch leagues');
//     }
//   }
// );

// export const fetchAllLeagues = createAsyncThunk<
//   ILeague[],
//   void,
//   { rejectValue: string }
// >(
//   'league/fetchAllLeagues',
//   async (_, { rejectWithValue }) => {
//     try {
//       const leagues = await LeagueService.getAllLeagues();
//       return leagues;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch all leagues');
//     }
//   }
// );

// export const fetchActiveLeagues = createAsyncThunk<
//   ILeague[],
//   void,
//   { rejectValue: string }
// >(
//   'league/fetchActiveLeagues',
//   async (_, { rejectWithValue }) => {
//     try {
//       const leagues = await LeagueService.getPlayerLeagues();
//       return leagues;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch active leagues');
//     }
//   }
// );

// export const fetchLeagueById = createAsyncThunk<
//   ILeague,
//   string,
//   { rejectValue: string }
// >(
//   'league/fetchLeagueById',
//   async (leagueId, { rejectWithValue }) => {
//     try {
//       const league = await LeagueService.getLeague(leagueId);
//       if (!league) {
//         return rejectWithValue('League not found');
//       }
//       return league;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch league');
//     }
//   }
// );

// export const createLeague = createAsyncThunk<
//   ILeague,
//   Omit<ILeague, 'id'>,
//   { rejectValue: string }
// >(
//   'league/createLeague',
//   async (leagueData, { rejectWithValue }) => {
//     try {
//       const response = await LeagueService.createLeague(leagueData as ILeague);
//       if (!response.success) {
//         return rejectWithValue(response.error || 'Failed to create league');
//       }
//       // Yeni oluşturulan liği getir
//       if (response.id) {
//         const newLeague = await leagueService.getById(response.id);
//         if (newLeague) {
//           return newLeague;
//         }
//       }
//       return rejectWithValue('Failed to fetch created league');
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to create league');
//     }
//   }
// );

// export const joinLeague = createAsyncThunk<
//   ILeague,
//   { leagueId: string; userId: string },
//   { rejectValue: string }
// >(
//   'league/joinLeague',
//   async ({ leagueId, userId }, { rejectWithValue }) => {
//     try {
//       const success = await LeagueService.addMember(leagueId,userId, userId);
//       if (!success) {
//         return rejectWithValue('Failed to join league');
//       }

//       const league = await LeagueService.getLeague(leagueId);
//       if (!league) {
//         return rejectWithValue('League not found');
//       }
      
//       return league;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to join league');
//     }
//   }
// );

// export const leaveLeague = createAsyncThunk<
//   string,
//   { leagueId: string; userId: string },
//   { rejectValue: string }
// >(
//   'league/leaveLeague',
//   async ({ leagueId, userId }, { rejectWithValue }) => {
//     try {
//       const success = await LeagueService.removeMember(leagueId, userId, userId);
//       if (!success) {
//         return rejectWithValue('Failed to leave league');
//       }
//       return leagueId;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to leave league');
//     }
//   }
// );

// export const updateLeague = createAsyncThunk<
//   ILeague,
//   { leagueId: string; updates: Partial<ILeague> },
//   { rejectValue: string }
// >(
//   'league/updateLeague',
//   async ({ leagueId, updates }, { rejectWithValue }) => {
//     try {
//       const response = await leagueService.update(leagueId, updates);
//       if (!response.success) {
//         return rejectWithValue(response.error || 'Failed to update league');
//       }
      
//       const league = await leagueService.getById(leagueId);
//       if (!league) {
//         return rejectWithValue('League not found');
//       }
      
//       return league;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to update league');
//     }
//   }
// );

// export const toggleFriendlyMatches = createAsyncThunk<
//   ILeague,
//   string,
//   { rejectValue: string }
// >(
//   'league/toggleFriendlyMatches',
//   async (leagueId, { rejectWithValue }) => {
//     try {
//       const success = await leagueService.toggleFriendlyMatches(leagueId);
//       if (!success) {
//         return rejectWithValue('Failed to toggle friendly matches');
//       }
      
//       const league = await leagueService.getById(leagueId);
//       if (!league) {
//         return rejectWithValue('League not found');
//       }
      
//       return league;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to toggle friendly matches');
//     }
//   }
// );

// export const fetchLeaguesBySport = createAsyncThunk<
//   ILeague[],
//   string,
//   { rejectValue: string }
// >(
//   'league/fetchLeaguesBySport',
//   async (sportType, { rejectWithValue }) => {
//     try {
//       const leagues = await leagueService.getLeaguesBySportType(sportType as any);
//       return leagues;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to fetch leagues by sport');
//     }
//   }
// );

// // ============================================
// // SLICE
// // ============================================

// const leagueSlice = createSlice({
//   name: 'league',
//   initialState,
//   reducers: {
//     setCurrentLeague: (state, action: PayloadAction<ILeague | null>) => {
//       state.currentLeague = action.payload;
//     },
//     setFilters: (state, action: PayloadAction<Partial<LeagueState['filters']>>) => {
//       state.filters = { ...state.filters, ...action.payload };
//     },
//     clearFilters: (state) => {
//       state.filters = initialState.filters;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//     resetLeagueState: () => initialState,
//   },
//   extraReducers: (builder) => {
//     // Fetch My Leagues
//     builder
//       .addCase(fetchMyLeagues.pending, (state) => {
//         state.loading.leagues = true;
//         state.error = null;
//       })
//       .addCase(fetchMyLeagues.fulfilled, (state, action) => {
//         state.loading.leagues = false;
//         state.myLeagues = action.payload;
//       })
//       .addCase(fetchMyLeagues.rejected, (state, action) => {
//         state.loading.leagues = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch All Leagues
//     builder
//       .addCase(fetchAllLeagues.pending, (state) => {
//         state.loading.leagues = true;
//         state.error = null;
//       })
//       .addCase(fetchAllLeagues.fulfilled, (state, action) => {
//         state.loading.leagues = false;
//         state.publicLeagues = action.payload;
//       })
//       .addCase(fetchAllLeagues.rejected, (state, action) => {
//         state.loading.leagues = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch Active Leagues
//     builder
//       .addCase(fetchActiveLeagues.pending, (state) => {
//         state.loading.leagues = true;
//         state.error = null;
//       })
//       .addCase(fetchActiveLeagues.fulfilled, (state, action) => {
//         state.loading.leagues = false;
//         state.publicLeagues = action.payload;
//       })
//       .addCase(fetchActiveLeagues.rejected, (state, action) => {
//         state.loading.leagues = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch League By ID
//     builder
//       .addCase(fetchLeagueById.pending, (state) => {
//         state.loading.currentLeague = true;
//         state.error = null;
//       })
//       .addCase(fetchLeagueById.fulfilled, (state, action) => {
//         state.loading.currentLeague = false;
//         state.currentLeague = action.payload;
//       })
//       .addCase(fetchLeagueById.rejected, (state, action) => {
//         state.loading.currentLeague = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Create League
//     builder
//       .addCase(createLeague.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(createLeague.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.myLeagues.unshift(action.payload);
//         state.currentLeague = action.payload;
//       })
//       .addCase(createLeague.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Join League
//     builder
//       .addCase(joinLeague.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(joinLeague.fulfilled, (state, action) => {
//         state.loading.action = false;
        
//         // Eğer zaten listede yoksa ekle
//         const exists = state.myLeagues.find(l => l.id === action.payload.id);
//         if (!exists) {
//           state.myLeagues.push(action.payload);
//         }
        
//         state.currentLeague = action.payload;
//       })
//       .addCase(joinLeague.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Leave League
//     builder
//       .addCase(leaveLeague.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(leaveLeague.fulfilled, (state, action) => {
//         state.loading.action = false;
//         state.myLeagues = state.myLeagues.filter((l) => l.id !== action.payload);
//         if (state.currentLeague?.id === action.payload) {
//           state.currentLeague = null;
//         }
//       })
//       .addCase(leaveLeague.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Update League
//     builder
//       .addCase(updateLeague.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(updateLeague.fulfilled, (state, action) => {
//         state.loading.action = false;
        
//         // Update in lists
//         const index = state.myLeagues.findIndex((l) => l.id === action.payload.id);
//         if (index !== -1) {
//           state.myLeagues[index] = action.payload;
//         }
        
//         // Update current league
//         if (state.currentLeague?.id === action.payload.id) {
//           state.currentLeague = action.payload;
//         }
//       })
//       .addCase(updateLeague.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Toggle Friendly Matches
//     builder
//       .addCase(toggleFriendlyMatches.pending, (state) => {
//         state.loading.action = true;
//         state.error = null;
//       })
//       .addCase(toggleFriendlyMatches.fulfilled, (state, action) => {
//         state.loading.action = false;
        
//         // Update in lists
//         const index = state.myLeagues.findIndex((l) => l.id === action.payload.id);
//         if (index !== -1) {
//           state.myLeagues[index] = action.payload;
//         }
        
//         // Update current league
//         if (state.currentLeague?.id === action.payload.id) {
//           state.currentLeague = action.payload;
//         }
//       })
//       .addCase(toggleFriendlyMatches.rejected, (state, action) => {
//         state.loading.action = false;
//         state.error = action.payload || 'Unknown error';
//       });

//     // Fetch Leagues By Sport
//     builder
//       .addCase(fetchLeaguesBySport.pending, (state) => {
//         state.loading.leagues = true;
//         state.error = null;
//       })
//       .addCase(fetchLeaguesBySport.fulfilled, (state, action) => {
//         state.loading.leagues = false;
//         state.publicLeagues = action.payload;
//       })
//       .addCase(fetchLeaguesBySport.rejected, (state, action) => {
//         state.loading.leagues = false;
//         state.error = action.payload || 'Unknown error';
//       });
//   },
// });

// export const {
//   setCurrentLeague,
//   setFilters,
//   clearFilters,
//   clearError,
//   resetLeagueState,
// } = leagueSlice.actions;

// export default leagueSlice.reducer;



// /* 
// // Component'te kullanım
// import { useAppDispatch, useAppSelector } from '../store/hooks';
// import { 
//   fetchMyLeagues, 
//   fetchLeagueById,
//   joinLeague,
//   createLeague 
// } from '../store/slices/leagueSlice';

// function LeaguesScreen() {
//   const dispatch = useAppDispatch();
//   const { myLeagues, loading, error } = useAppSelector((state) => state.league);
//   const { user } = useAppSelector((state) => state.auth);

//   useEffect(() => {
//     if (user?.uid) {
//       dispatch(fetchMyLeagues(user.uid));
//     }
//   }, [user?.uid, dispatch]);

//   const handleCreateLeague = async (leagueData: any) => {
//     const result = await dispatch(createLeague(leagueData));
    
//     if (createLeague.fulfilled.match(result)) {
//       // Success!
//       console.log('League created:', result.payload);
//     } else {
//       // Error
//       console.error('Error:', result.payload);
//     }
//   };

//   if (loading.leagues) return <Loading />;
//   if (error) return <Error message={error} />;

//   return (
//     <FlatList
//       data={myLeagues}
//       renderItem={({ item }) => <LeagueCard league={item} />}
//     />
//   );
// }

// */