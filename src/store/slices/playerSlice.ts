// src/store/slices/playerSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { IPlayer, SportType } from '../../types/entity/types';
import { PlayerService } from '../../services/serviceLayer/playerService';
interface PlayerState {
  // Current player (authenticated user's profile)
  currentPlayer: IPlayer | null;

  // Lists
  searchResults: IPlayer[];
  recentPlayers: IPlayer[];
  playersBySport: IPlayer[];

  // Loading states
  loading: {
    profile: boolean;
    search: boolean;
    action: boolean;
  };

  // Error
  error: string | null;

  // Search query
  searchQuery: string;

  // Player summary
  summary: {
    totalSports: number;
    hasProfilePhoto: boolean;
    isProfileComplete: boolean;
  } | null;
}

const initialState: PlayerState = {
  currentPlayer: null,
  searchResults: [],
  recentPlayers: [],
  playersBySport: [],
  loading: {
    profile: false,
    search: false,
    action: false,
  },
  error: null,
  searchQuery: '',
  summary: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Fetch player profile
 */
export const fetchPlayerProfile = createAsyncThunk<
  IPlayer,
  string,
  { rejectValue: string }
>(
  'player/fetchPlayerProfile',
  async (playerId, { rejectWithValue }) => {
    try {
      const result = await PlayerService.getPlayer(playerId);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to fetch player');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch player');
    }
  }
);

/**
 * Fetch player by email
 */
export const fetchPlayerByEmail = createAsyncThunk<
  IPlayer,
  string,
  { rejectValue: string }
>(
  'player/fetchPlayerByEmail',
  async (email, { rejectWithValue }) => {
    try {
      const result = await PlayerService.getPlayerByEmail(email);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to fetch player');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch player');
    }
  }
);

/**
 * Update player profile
 */
export const updatePlayerProfile = createAsyncThunk<
  IPlayer,
  {
    playerId: string;
    profileData: {
      name?: string;
      surname?: string;
      profilePhoto?: string;
      jerseyNumber?: string;
      birthDate?: string;
    };
  },
  { rejectValue: string }
>(
  'player/updatePlayerProfile',
  async ({ playerId, profileData }, { rejectWithValue }) => {
    try {
      const result = await PlayerService.updateProfile(playerId, profileData);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to update profile');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

/**
 * Add favorite sport
 */
export const addFavoriteSport = createAsyncThunk<
  IPlayer,
  { playerId: string; sport: SportType },
  { rejectValue: string }
>(
  'player/addFavoriteSport',
  async ({ playerId, sport }, { rejectWithValue }) => {
    try {
      const result = await PlayerService.addFavoriteSport(playerId, sport);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to add favorite sport');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add favorite sport');
    }
  }
);

/**
 * Remove favorite sport
 */
export const removeFavoriteSport = createAsyncThunk<
  IPlayer,
  { playerId: string; sport: SportType },
  { rejectValue: string }
>(
  'player/removeFavoriteSport',
  async ({ playerId, sport }, { rejectWithValue }) => {
    try {
      const result = await PlayerService.removeFavoriteSport(playerId, sport);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to remove favorite sport');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove favorite sport');
    }
  }
);

/**
 * Update sport positions
 */
export const updateSportPositions = createAsyncThunk<
  IPlayer,
  { playerId: string; sport: SportType; positions: string[] },
  { rejectValue: string }
>(
  'player/updateSportPositions',
  async ({ playerId, sport, positions }, { rejectWithValue }) => {
    try {
      const result = await PlayerService.updateSportPositions(playerId, sport, positions);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to update positions');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update positions');
    }
  }
);

/**
 * Update sport preferences (bulk)
 */
export const updateSportPreferences = createAsyncThunk<
  IPlayer,
  {
    playerId: string;
    preferences: {
      favoriteSports?: SportType[];
      sportPositions?: Partial<Record<SportType, string[]>>;
    };
  },
  { rejectValue: string }
>(
  'player/updateSportPreferences',
  async ({ playerId, preferences }, { rejectWithValue }) => {
    try {
      const result = await PlayerService.updateSportPreferences(playerId, preferences);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to update preferences');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update preferences');
    }
  }
);

/**
 * Search players
 */
export const searchPlayers = createAsyncThunk<
  IPlayer[],
  string,
  { rejectValue: string }
>(
  'player/searchPlayers',
  async (searchTerm, { rejectWithValue }) => {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const result = await PlayerService.searchPlayers(searchTerm);

      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to search players');
      }

      return result.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search players');
    }
  }
);

/**
 * Get players by sport
 */
export const fetchPlayersBySport = createAsyncThunk<
  IPlayer[],
  SportType,
  { rejectValue: string }
>(
  'player/fetchPlayersBySport',
  async (sport, { rejectWithValue }) => {
    try {
      const result = await PlayerService.getPlayersBySport(sport);

      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to fetch players by sport');
      }

      return result.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch players by sport');
    }
  }
);

/**
 * Get recent players
 */
export const fetchRecentPlayers = createAsyncThunk<
  IPlayer[],
  number,
  { rejectValue: string }
>(
  'player/fetchRecentPlayers',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const result = await PlayerService.getRecentPlayers(limit);

      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to fetch recent players');
      }

      return result.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch recent players');
    }
  }
);

/**
 * Get players by IDs
 */
export const fetchPlayersByIds = createAsyncThunk<
  IPlayer[],
  string[],
  { rejectValue: string }
>(
  'player/fetchPlayersByIds',
  async (playerIds, { rejectWithValue }) => {
    try {
      const result = await PlayerService.getPlayersByIds(playerIds);

      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to fetch players');
      }

      return result.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch players');
    }
  }
);

/**
 * Get player summary
 */
export const fetchPlayerSummary = createAsyncThunk<
  {
    player: IPlayer;
    totalSports: number;
    hasProfilePhoto: boolean;
    isProfileComplete: boolean;
  },
  string,
  { rejectValue: string }
>(
  'player/fetchPlayerSummary',
  async (playerId, { rejectWithValue }) => {
    try {
      const result = await PlayerService.getPlayerSummary(playerId);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to fetch player summary');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch player summary');
    }
  }
);

/**
 * Record login
 */
export const recordLogin = createAsyncThunk<
  IPlayer,
  string,
  { rejectValue: string }
>(
  'player/recordLogin',
  async (playerId, { rejectWithValue }) => {
    try {
      const result = await PlayerService.recordLogin(playerId);

      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to record login');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to record login');
    }
  }
);

/**
 * Check email availability
 */
export const checkEmailAvailability = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>(
  'player/checkEmailAvailability',
  async (email, { rejectWithValue }) => {
    try {
      const result = await PlayerService.isEmailAvailable(email);

      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to check email');
      }

      return result.data || false;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check email');
    }
  }
);

/**
 * Check phone availability
 */
export const checkPhoneAvailability = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>(
  'player/checkPhoneAvailability',
  async (phone, { rejectWithValue }) => {
    try {
      const result = await PlayerService.isPhoneAvailable(phone);

      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to check phone');
      }

      return result.data || false;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check phone');
    }
  }
);

// ============================================
// SLICE
// ============================================

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setCurrentPlayer: (state, action: PayloadAction<IPlayer | null>) => {
      state.currentPlayer = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    clearError: (state) => {
      state.error = null;
    },
    resetPlayerState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch Player Profile
    builder
      .addCase(fetchPlayerProfile.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(fetchPlayerProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.currentPlayer = action.payload;
      })
      .addCase(fetchPlayerProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Player By Email
    builder
      .addCase(fetchPlayerByEmail.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(fetchPlayerByEmail.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.currentPlayer = action.payload;
      })
      .addCase(fetchPlayerByEmail.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload || 'Unknown error';
      });

    // Update Player Profile
    builder
      .addCase(updatePlayerProfile.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(updatePlayerProfile.fulfilled, (state, action) => {
        state.loading.action = false;
        state.currentPlayer = action.payload;
      })
      .addCase(updatePlayerProfile.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Add Favorite Sport
    builder
      .addCase(addFavoriteSport.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(addFavoriteSport.fulfilled, (state, action) => {
        state.loading.action = false;
        state.currentPlayer = action.payload;
      })
      .addCase(addFavoriteSport.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Remove Favorite Sport
    builder
      .addCase(removeFavoriteSport.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(removeFavoriteSport.fulfilled, (state, action) => {
        state.loading.action = false;
        state.currentPlayer = action.payload;
      })
      .addCase(removeFavoriteSport.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Update Sport Positions
    builder
      .addCase(updateSportPositions.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(updateSportPositions.fulfilled, (state, action) => {
        state.loading.action = false;
        state.currentPlayer = action.payload;
      })
      .addCase(updateSportPositions.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Update Sport Preferences
    builder
      .addCase(updateSportPreferences.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(updateSportPreferences.fulfilled, (state, action) => {
        state.loading.action = false;
        state.currentPlayer = action.payload;
      })
      .addCase(updateSportPreferences.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Search Players
    builder
      .addCase(searchPlayers.pending, (state) => {
        state.loading.search = true;
        state.error = null;
      })
      .addCase(searchPlayers.fulfilled, (state, action) => {
        state.loading.search = false;
        state.searchResults = action.payload;
      })
      .addCase(searchPlayers.rejected, (state, action) => {
        state.loading.search = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Players By Sport
    builder
      .addCase(fetchPlayersBySport.pending, (state) => {
        state.loading.search = true;
        state.error = null;
      })
      .addCase(fetchPlayersBySport.fulfilled, (state, action) => {
        state.loading.search = false;
        state.playersBySport = action.payload;
      })
      .addCase(fetchPlayersBySport.rejected, (state, action) => {
        state.loading.search = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Recent Players
    builder
      .addCase(fetchRecentPlayers.pending, (state) => {
        state.loading.search = true;
        state.error = null;
      })
      .addCase(fetchRecentPlayers.fulfilled, (state, action) => {
        state.loading.search = false;
        state.recentPlayers = action.payload;
      })
      .addCase(fetchRecentPlayers.rejected, (state, action) => {
        state.loading.search = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Players By IDs
    builder
      .addCase(fetchPlayersByIds.pending, (state) => {
        state.loading.search = true;
        state.error = null;
      })
      .addCase(fetchPlayersByIds.fulfilled, (state, action) => {
        state.loading.search = false;
        // Could add these to a cache or specific list if needed
      })
      .addCase(fetchPlayersByIds.rejected, (state, action) => {
        state.loading.search = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Player Summary
    builder
      .addCase(fetchPlayerSummary.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(fetchPlayerSummary.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.currentPlayer = action.payload.player;
        state.summary = {
          totalSports: action.payload.totalSports,
          hasProfilePhoto: action.payload.hasProfilePhoto,
          isProfileComplete: action.payload.isProfileComplete,
        };
      })
      .addCase(fetchPlayerSummary.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload || 'Unknown error';
      });

    // Record Login
    builder
      .addCase(recordLogin.fulfilled, (state, action) => {
        if (state.currentPlayer?.id === action.payload.id) {
          state.currentPlayer = action.payload;
        }
      });
  },
});

export const {
  setCurrentPlayer,
  setSearchQuery,
  clearSearchResults,
  clearError,
  resetPlayerState,
} = playerSlice.actions;

export default playerSlice.reducer;



/* 
// Component'te player slice kullanımı
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchPlayerProfile,
  updatePlayerProfile,
  addFavoriteSport,
  searchPlayers 
} from '../store/slices/playerSlice';

function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { currentPlayer, loading, summary } = useAppSelector((state) => state.player);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchPlayerProfile(user.uid));
      dispatch(fetchPlayerSummary(user.uid));
    }
  }, [user?.uid, dispatch]);

  const handleUpdateProfile = async (profileData: any) => {
    const result = await dispatch(updatePlayerProfile({
      playerId: currentPlayer!.id,
      profileData
    }));
    
    if (updatePlayerProfile.fulfilled.match(result)) {
      // Success!
      console.log('Profile updated:', result.payload);
    }
  };

  const handleAddSport = async (sport: SportType) => {
    await dispatch(addFavoriteSport({
      playerId: currentPlayer!.id,
      sport
    }));
  };

  if (loading.profile) return <Loading />;

  return (
    <View>
      <Text>{currentPlayer?.name} {currentPlayer?.surname}</Text>
      {summary && (
        <Text>
          Profile {summary.isProfileComplete ? 'Complete' : 'Incomplete'}
        </Text>
      )}
    </View>
  );
}

*/