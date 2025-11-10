// ============================================
// api/matchApi.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { IMatch, MatchType, MatchStatus, PlayerListConfig } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class MatchAPI extends BaseAPI<IMatch> {
  constructor() {
    super('matches');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get matches by league
   */
  async getByLeague(leagueId: string): Promise<ApiResponse<IMatch[]>> {
    return this.getAll({
      where: [{ field: 'leagueId', operator: '==', value: leagueId }],
      orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
    });
  }

  /**
   * Get matches by season
   */
  async getBySeason(seasonId: string): Promise<ApiResponse<IMatch[]>> {
    return this.getAll({
      where: [{ field: 'seasonId', operator: '==', value: seasonId }],
      orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
    });
  }

  /**
   * Get matches by fixture
   */
  async getByFixture(fixtureId: string): Promise<ApiResponse<IMatch[]>> {
    return this.getAll({
      where: [{ field: 'fixtureId', operator: '==', value: fixtureId }],
      orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
    });
  }

  /**
   * Get matches by type (LEAGUE or FRIENDLY)
   */
  async getByType(matchType: MatchType): Promise<ApiResponse<IMatch[]>> {
    return this.getAll({
      where: [{ field: 'type', operator: '==', value: matchType }],
      orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
      limit: 50,
    });
  }

  /**
   * Get matches by status
   */
  async getByStatus(status: MatchStatus): Promise<ApiResponse<IMatch[]>> {
    return this.getAll({
      where: [{ field: 'status', operator: '==', value: status }],
      orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
      limit: 50,
    });
  }

  /**
   * Get matches by organizer (for friendly matches)
   */
  async getByOrganizer(organizerId: string): Promise<ApiResponse<IMatch[]>> {
    return this.getAll({
      where: [
        { field: 'type', operator: '==', value: MatchType.FRIENDLY },
        { field: 'organizerId', operator: '==', value: organizerId },
      ],
      orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
    });
  }

  /**
   * Get upcoming matches (future matches)
   */
  async getUpcomingMatches(limit: number = 10): Promise<ApiResponse<IMatch[]>> {
    const now = new Date().toISOString();

    return this.getAll({
      where: [
        { field: 'schedule.matchStart', operator: '>', value: now },
        {
          field: 'status', operator: 'in', value: [
            MatchStatus.CREATED,
            MatchStatus.REGISTRATION_OPEN,
            MatchStatus.REGISTRATION_CLOSED,
            MatchStatus.TEAMS_SET,
          ]
        },
      ],
      orderBy: [{ field: 'schedule.matchStart', direction: 'asc' }],
      limit,
    });
  }

  /**
   * Get player's upcoming matches
   */
  async getPlayerUpcomingMatches(playerId: string, limit: number = 10): Promise<ApiResponse<IMatch[]>> {
    try {
      // This is complex - need to check multiple arrays
      // We'll get recent matches and filter on client side
      const now = new Date().toISOString();

      const result = await this.getAll({
        where: [
          { field: 'players.squad', operator: 'array-contains', value: playerId },
          { field: 'schedule.matchStart', operator: '>', value: now },
        ],
        orderBy: [{ field: 'schedule.matchStart', direction: 'asc' }],
        limit: 100, // Get more to filter
      });

      if (!result.success || !result.data) {
        return result;
      }

      // Filter matches where player is involved
      const playerMatches = result.data.filter(match => {
        // Check if player is in any list
        const isInPremium = match.players.premium.inherited?.includes(playerId) ||
          match.players.premium.overrides?.includes(playerId);
        const isInDirect = match.players.direct.inherited?.includes(playerId) ||
          match.players.direct.overrides?.includes(playerId);
        const isGuest = match.players.guests?.includes(playerId);
        const isRegistered = match.players.registered?.some(r => r.playerId === playerId);
        const isReserve = match.players.reserves?.includes(playerId);
        const isInSquad = match.players.squad?.includes(playerId);
        
        return isInPremium || isInDirect || isGuest || isRegistered || isReserve || isInSquad;
      });

      return {
        success: true,
        data: playerMatches.slice(0, limit),
      };
    } catch (error: any) {
      ApiLogger.error('matches', 'getPlayerUpcomingMatches', error);
      return {
        success: false,
        error: {
          code: 'GET_PLAYER_MATCHES_ERROR',
          message: error.message || 'Failed to get player matches',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get player's match history
   */
  async getPlayerMatches(playerId: string, limit: number = 20): Promise<ApiResponse<IMatch[]>> {
    // Similar to getPlayerUpcomingMatches but for all matches
    try {
      const result = await this.getAll({
        where: [
          { field: 'players.squad', operator: 'array-contains', value: playerId },
        ],
        orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
        limit: 200, // Get more to filter
      });

      if (!result.success || !result.data) {
        return result;
      }

      const playerMatches = result.data.filter(match => {
        const isInPremium = match.players.premium.inherited?.includes(playerId) ||
          match.players.premium.overrides?.includes(playerId);
        const isInDirect = match.players.direct.inherited?.includes(playerId) ||
          match.players.direct.overrides?.includes(playerId);
        const isGuest = match.players.guests?.includes(playerId);
        const isRegistered = match.players.registered?.some(r => r.playerId === playerId);
        const isReserve = match.players.reserves?.includes(playerId);
        const isInTeams = match.players.teams?.team1?.some(p => p.playerId === playerId) ||
          match.players.teams?.team2?.some(p => p.playerId === playerId);
        const isInSquad = match.players.squad?.includes(playerId);

        return isInPremium || isInDirect || isGuest || isRegistered || isReserve || isInTeams || isInSquad;
      });

      return {
        success: true,
        data: playerMatches.slice(0, limit),
      };
    } catch (error: any) {
      ApiLogger.error('matches', 'getPlayerMatches', error);
      return {
        success: false,
        error: {
          code: 'GET_PLAYER_MATCHES_ERROR',
          message: error.message || 'Failed to get player matches',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // PLAYER REGISTRATION
  // ============================================

  /**
   * Register player to match
   */
  async registerPlayer(
    matchId: string,
    playerId: string,
    preferredPosition?: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('matches', 'registerPlayer', { matchId, playerId });

      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if registration is open
      if (match.status !== MatchStatus.REGISTRATION_OPEN) {
        return {
          success: false,
          error: {
            code: 'REGISTRATION_CLOSED',
            message: 'Registration is not open',
            statusCode: 400,
          },
        };
      }

      // Check if already registered
      const alreadyRegistered = match.players.registered?.some(r => r.playerId === playerId);
      if (alreadyRegistered) {
        return {
          success: true,
          data: match,
        };
      }

      const docRef = doc(db, this.collectionName, matchId);

      await updateDoc(docRef, {
        'players.registered': arrayUnion({
          playerId,
          registeredAt: new Date(),
          preferredPosition,
        }),
        updatedAt: new Date().toISOString(),
      });

      const updatedMatch = await this.getById(matchId);

      ApiLogger.success('matches', 'registerPlayer', { matchId, playerId });

      return updatedMatch;
    } catch (error: any) {
      ApiLogger.error('matches', 'registerPlayer', error);
      return {
        success: false,
        error: {
          code: 'REGISTER_ERROR',
          message: error.message || 'Failed to register player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
  * Unregister player from match
  */
  async unregisterPlayer(matchId: string, playerId: string): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('matches', 'unregisterPlayer', { matchId, playerId });

      // 1. Get match
      const matchResult = await this.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // 2. Create updated players object
      const updatedPlayers: any = {
        registered: (match.players.registered || []).filter(r => r.playerId !== playerId),

        direct: {
          mode: match.players.direct?.mode || 'inherited',
          inherited: (match.players.direct?.inherited || []).filter(id => id !== playerId),
          overrides: (match.players.direct?.overrides || []).filter(id => id !== playerId),
        },

        premium: {
          mode: match.players.premium?.mode || 'inherited',
          inherited: (match.players.premium?.inherited || []).filter(id => id !== playerId),
          overrides: (match.players.premium?.overrides || []).filter(id => id !== playerId),
        },

        guests: (match.players.guests || []).filter(id => id !== playerId),
        reserves: (match.players.reserves || []).filter(id => id !== playerId),
      };

      // ✅ Only add teams if they exist (don't set to undefined)
      if (match.players.teams) {
        updatedPlayers.teams = {
          team1: match.players.teams.team1.filter(p => p.playerId !== playerId),
          team2: match.players.teams.team2.filter(p => p.playerId !== playerId),
        };
      } else {
        updatedPlayers.teams = { team1: [], team2: [] };
      }

      // 3. Update payments
      const updatedPayments = (match.payments || []).filter(p => p.playerId !== playerId);

      // 4. Use matchAPI.update()
      const result = await this.update(matchId, {
        players: updatedPlayers,
        payments: updatedPayments,
      });

      if (!result.success) {
        return result;
      }

      ApiLogger.success('matches', 'unregisterPlayer', { matchId, playerId });

      return result;
    } catch (error: any) {
      ApiLogger.error('matches', 'unregisterPlayer', error);
      return {
        success: false,
        error: {
          code: 'UNREGISTER_ERROR',
          message: error.message || 'Failed to unregister player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add guest player
   */
  async addGuestPlayer(matchId: string, playerId: string): Promise<ApiResponse<IMatch>> {
    try {
      const docRef = doc(db, this.collectionName, matchId);

      await updateDoc(docRef, {
        'players.guests': arrayUnion(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(matchId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_GUEST_ERROR',
          message: error.message || 'Failed to add guest player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove guest player
   */
  async removeGuestPlayer(matchId: string, playerId: string): Promise<ApiResponse<IMatch>> {
    try {
      const docRef = doc(db, this.collectionName, matchId);

      await updateDoc(docRef, {
        'players.guests': arrayRemove(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(matchId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_GUEST_ERROR',
          message: error.message || 'Failed to remove guest player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Move player to reserves
   */
  async moveToReserve(matchId: string, playerId: string): Promise<ApiResponse<IMatch>> {
    try {
      const docRef = doc(db, this.collectionName, matchId);

      await updateDoc(docRef, {
        'players.reserves': arrayUnion(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(matchId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'MOVE_RESERVE_ERROR',
          message: error.message || 'Failed to move player to reserves',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // TEAM MANAGEMENT
  // ============================================

  /**
   * Set teams (after team building)
   */
  async setTeams(
    matchId: string,
    teams: {
      team1: Array<{ playerId: string; position?: string }>;
      team2: Array<{ playerId: string; position?: string }>;
    }
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('matches', 'setTeams', { matchId });

      return this.update(matchId, {
        'players.teams': teams,
      } as any);
    } catch (error: any) {
      ApiLogger.error('matches', 'setTeams', error);
      return {
        success: false,
        error: {
          code: 'SET_TEAMS_ERROR',
          message: error.message || 'Failed to set teams',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update player position in team
   */
  async updatePlayerPosition(
    matchId: string,
    playerId: string,
    team: 'team1' | 'team2',
    position: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;
      const teams = match.players.teams;

      if (!teams) {
        return {
          success: false,
          error: {
            code: 'NO_TEAMS',
            message: 'Teams not set yet',
            statusCode: 400,
          },
        };
      }

      // Update position
      const updatedTeam = teams[team].map(player =>
        player.playerId === playerId
          ? { ...player, position }
          : player
      );

      const newTeams = {
        ...teams,
        [team]: updatedTeam,
      };

      return this.update(matchId, {
        'players.teams': newTeams,
      } as any);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_POSITION_ERROR',
          message: error.message || 'Failed to update player position',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SCORE MANAGEMENT
  // ============================================

  /**
   * Update match score
   */
  async updateScore(
    matchId: string,
    score: {
      team1: number;
      team2: number;
      scorers?: Array<{
        playerId: string;
        goals: number;
        assists: number;
        confirmed: boolean;
      }>;
    }
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('matches', 'updateScore', { matchId, score });

      return this.update(matchId, {
        score,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      ApiLogger.error('matches', 'updateScore', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SCORE_ERROR',
          message: error.message || 'Failed to update score',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add goal scorer
   */
  async addGoalScorer(
    matchId: string,
    scorer: {
      playerId: string;
      goals: number;
      assists: number;
      confirmed: boolean;
    }
  ): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;
      const currentScorers = match.score?.scorers || [];

      // Check if player already has a scorer entry
      const existingIndex = currentScorers.findIndex(s => s.playerId === scorer.playerId);

      let updatedScorers;
      if (existingIndex >= 0) {
        // Update existing entry
        updatedScorers = [...currentScorers];
        updatedScorers[existingIndex] = {
          ...updatedScorers[existingIndex],
          goals: updatedScorers[existingIndex].goals + scorer.goals,
          assists: updatedScorers[existingIndex].assists + scorer.assists,
        };
      } else {
        // Add new entry
        updatedScorers = [...currentScorers, scorer];
      }

      return this.update(matchId, {
        score: {
          ...(match.score || { team1: 0, team2: 0 }),
          scorers: updatedScorers,
        },
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_SCORER_ERROR',
          message: error.message || 'Failed to add goal scorer',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // MVP MANAGEMENT
  // ============================================

  /**
   * Update match MVP
   */
  async updateMVP(
    matchId: string,
    mvp: {
      playerId: string;
      calculatedAt: string;
      autoCalculated: boolean;
    }
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('matches', 'updateMVP', { matchId, mvp });

      return this.update(matchId, {
        mvp,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      ApiLogger.error('matches', 'updateMVP', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_MVP_ERROR',
          message: error.message || 'Failed to update MVP',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // PAYMENT MANAGEMENT
  // ============================================

  /**
   * Update player payment status
   */
  async updatePayment(
    matchId: string,
    playerId: string,
    payment: {
      paid: boolean;
      paidAt?: Date;
      confirmedBy?: string;
    }
  ): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;
      const payments = match.payments || [];

      // Find existing payment or create new
      const existingIndex = payments.findIndex(p => p.playerId === playerId);

      let updatedPayments;
      if (existingIndex >= 0) {
        updatedPayments = [...payments];
        updatedPayments[existingIndex] = {
          ...updatedPayments[existingIndex],
          ...payment,
        };
      } else {
        // Create new payment entry
        updatedPayments = [...payments, {
          playerId,
          amount: match.venue?.pricePerPlayer || 0,
          ...payment,
        }];
      }

      return this.update(matchId, {
        payments: updatedPayments,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PAYMENT_ERROR',
          message: error.message || 'Failed to update payment',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Confirm all payments
   */
  async confirmAllPayments(matchId: string, confirmedBy: string): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;
      const updatedPayments = (match.payments || []).map(payment => ({
        ...payment,
        paid: true,
        paidAt: new Date(),
        confirmedBy,
      }));

      return this.update(matchId, {
        payments: updatedPayments,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CONFIRM_PAYMENTS_ERROR',
          message: error.message || 'Failed to confirm all payments',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATUS MANAGEMENT (LIFECYCLE)
  // ============================================

  /**
   * Update match status
   */
  async updateStatus(matchId: string, status: MatchStatus): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('matches', 'updateStatus', { matchId, status });

      return this.update(matchId, {
        status,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      ApiLogger.error('matches', 'updateStatus', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_STATUS_ERROR',
          message: error.message || 'Failed to update status',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // PLAYER LIST CONFIG
  // ============================================

  /**
   * Update player list config
   */
  async updatePlayerListConfig(
    matchId: string,
    listType: 'premium' | 'direct',
    config: PlayerListConfig
  ): Promise<ApiResponse<IMatch>> {
    try {
      const updatePath = `players.${listType}`;
      const docRef = doc(db, this.collectionName, matchId);

      await updateDoc(docRef, {
        [updatePath]: config,
        updatedAt: new Date().toISOString(),
      });

      return this.getById(matchId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PLAYER_LIST_ERROR',
          message: error.message || 'Failed to update player list',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  /**
   * Update rating summary
   */
  async updateRatingSummary(
    matchId: string,
    ratingSummary: IMatch['ratingSummary']
  ): Promise<ApiResponse<IMatch>> {
    return this.update(matchId, {
      ratingSummary,
    } as Partial<Omit<IMatch, 'id'>>);
  }

  /**
   * Increment total comments
   */
  async incrementTotalComments(matchId: string): Promise<ApiResponse<IMatch>> {
    try {
      const docRef = doc(db, this.collectionName, matchId);

      await updateDoc(docRef, {
        totalComments: increment(1),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(matchId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_COMMENTS_ERROR',
          message: error.message || 'Failed to increment comments',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Increment total ratings
   */
  async incrementTotalRatings(matchId: string): Promise<ApiResponse<IMatch>> {
    try {
      const docRef = doc(db, this.collectionName, matchId);

      await updateDoc(docRef, {
        totalRatings: increment(1),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(matchId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_RATINGS_ERROR',
          message: error.message || 'Failed to increment ratings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Check if player can register
   */
  async canPlayerRegister(matchId: string, playerId: string): Promise<ApiResponse<{
    can: boolean;
    reason?: string;
  }>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check status
      if (match.status !== MatchStatus.REGISTRATION_OPEN) {
        return {
          success: true,
          data: {
            can: false,
            reason: 'Registration is not open',
          },
        };
      }

      // Check if already registered
      const alreadyRegistered = match.players.registered?.some(r => r.playerId === playerId);
      if (alreadyRegistered) {
        return {
          success: true,
          data: {
            can: false,
            reason: 'Already registered',
          },
        };
      }

      // Check if squad is full
      const totalPlayers = match.squad.totalPlayers + match.squad.reservePlayers;
      const currentCount = (match.players.registered?.length || 0) +
        (match.players.direct.mode === 'custom'
          ? (match.players.direct.overrides?.length || 0)
          : (match.players.direct.inherited?.length || 0)) +
        (match.players.guests?.length || 0);

      if (currentCount >= totalPlayers) {
        return {
          success: true,
          data: {
            can: false,
            reason: 'Squad is full',
          },
        };
      }

      return {
        success: true,
        data: {
          can: true,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_REGISTER_ERROR',
          message: error.message || 'Failed to check if player can register',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if user is organizer
   */
  async isOrganizer(matchId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getById(matchId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const isOrg = result.data.permissions.organizers.includes(userId);

      return {
        success: true,
        data: isOrg,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_ORGANIZER_ERROR',
          message: error.message || 'Failed to check organizer status',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
  // ============================================
  // api/matchApi.ts - ADD THESE METHODS
  // ============================================

  // Mevcut MatchAPI class'ına ekleyin:

  // ============================================
  // FRIENDLY SETTINGS MANAGEMENT
  // ============================================

  /**
   * Update friendly settings
   */
  async updateFriendlySettings(
    matchId: string,
    settings: Partial<IMatch['friendlySettings']>
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('matches', 'updateFriendlySettings', { matchId });

      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      // Check if it's a friendly match
      if (matchResult.data.type !== MatchType.FRIENDLY) {
        return {
          success: false,
          error: {
            code: 'NOT_FRIENDLY',
            message: 'Only friendly matches can have friendly settings',
            statusCode: 400,
          },
        };
      }

      const currentSettings = matchResult.data.friendlySettings || {
        isPublic: true,
        affectsStats: true,
        affectsStandings: false,
      };

      const updatedSettings = {
        ...currentSettings,
        ...settings,
      };

      const result = await this.update(matchId, {
        friendlySettings: updatedSettings,
      } as Partial<Omit<IMatch, 'id'>>);

      ApiLogger.success('matches', 'updateFriendlySettings', { matchId });

      return result;
    } catch (error: any) {
      ApiLogger.error('matches', 'updateFriendlySettings', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FRIENDLY_SETTINGS_ERROR',
          message: error.message || 'Failed to update friendly settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Toggle friendly match visibility
   */
  async togglePublic(matchId: string): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const isPublic = !(matchResult.data.friendlySettings?.isPublic ?? true);

      return this.updateFriendlySettings(matchId, { isPublic });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TOGGLE_PUBLIC_ERROR',
          message: error.message || 'Failed to toggle public visibility',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add invited player to friendly match
   */
  async addInvitedPlayer(matchId: string, playerId: string): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const currentInvited = matchResult.data.friendlySettings?.invitedPlayerIds || [];

      if (currentInvited.includes(playerId)) {
        return matchResult;
      }

      const updatedSettings = {
        ...matchResult.data.friendlySettings,
        invitedPlayerIds: [...currentInvited, playerId],
      };

      return this.update(matchId, {
        friendlySettings: updatedSettings,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_INVITED_ERROR',
          message: error.message || 'Failed to add invited player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove invited player from friendly match
   */
  async removeInvitedPlayer(matchId: string, playerId: string): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const currentInvited = matchResult.data.friendlySettings?.invitedPlayerIds || [];
      const updatedInvited = currentInvited.filter(id => id !== playerId);

      const updatedSettings = {
        ...matchResult.data.friendlySettings,
        invitedPlayerIds: updatedInvited,
      };

      return this.update(matchId, {
        friendlySettings: updatedSettings,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_INVITED_ERROR',
          message: error.message || 'Failed to remove invited player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // VENUE MANAGEMENT
  // ============================================

  /**
   * Update match venue (can override fixture venue)
   */
  async updateVenue(
    matchId: string,
    venue: IMatch['venue']
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('matches', 'updateVenue', { matchId });

      return this.update(matchId, {
        venue,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      ApiLogger.error('matches', 'updateVenue', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_VENUE_ERROR',
          message: error.message || 'Failed to update venue',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update venue price
   */
  async updateVenuePrice(matchId: string, pricePerPlayer: number): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      if (!matchResult.data.venue) {
        return {
          success: false,
          error: {
            code: 'NO_VENUE',
            message: 'Match has no venue configured',
            statusCode: 400,
          },
        };
      }

      const updatedVenue = {
        ...matchResult.data.venue,
        pricePerPlayer,
      };

      return this.update(matchId, {
        venue: updatedVenue,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PRICE_ERROR',
          message: error.message || 'Failed to update price',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SQUAD MANAGEMENT
  // ============================================

  /**
   * Update squad settings (can override fixture squad)
   */
  async updateSquad(
    matchId: string,
    squad: Partial<IMatch['squad']>
  ): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const updatedSquad = {
        ...matchResult.data.squad,
        ...squad,
      };

      return this.update(matchId, {
        squad: updatedSquad,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SQUAD_ERROR',
          message: error.message || 'Failed to update squad',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SCHEDULE MANAGEMENT
  // ============================================

  /**
   * Update match schedule
   */
  async updateSchedule(
    matchId: string,
    schedule: Partial<IMatch['schedule']>
  ): Promise<ApiResponse<IMatch>> {
    try {
      const matchResult = await this.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'NOT_FOUND',
            message: 'Match not found',
            statusCode: 404,
          },
        };
      }

      const updatedSchedule = {
        ...matchResult.data.schedule,
        ...schedule,
      };

      return this.update(matchId, {
        schedule: updatedSchedule,
      } as Partial<Omit<IMatch, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SCHEDULE_ERROR',
          message: error.message || 'Failed to update schedule',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Extend registration deadline
   */
  async extendRegistration(matchId: string, newEndTime: Date): Promise<ApiResponse<IMatch>> {
    return this.updateSchedule(matchId, {
      registrationEnd: newEndTime,
    });
  }

  /**
   * Postpone match
   */
  async postponeMatch(
    matchId: string,
    newMatchStart: Date,
    newMatchEnd: Date
  ): Promise<ApiResponse<IMatch>> {
    return this.updateSchedule(matchId, {
      matchStart: newMatchStart,
      matchEnd: newMatchEnd,
    });
  }
}

// Export singleton instance
export const matchAPI = new MatchAPI();