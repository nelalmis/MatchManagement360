// ============================================
// services/MatchService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { seasonAPI } from '../../api/apiLayer/seasonAPI';
import { fixtureAPI } from '../../api/apiLayer/fixtureAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { standingsAPI } from '../../api/apiLayer/standingsAPI';
import { playerStatsAPI } from '../../api/apiLayer/playerStatsAPI';
import { notificationAPI } from '../../api/apiLayer/notificationAPI';
import { matchInvitationsAPI } from '../../api/apiLayer/matchInvitationsAPI';
import { matchRatingAPI } from '../../api/apiLayer/matchRatingAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import {
  IMatch,
  MatchType,
  MatchStatus,
  SportType,
  getEffectivePlayers,
  IPlayer,
  Venue
} from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';
import { calculateRegistrationCloseTime, calculateRegistrationOpenTime } from '../../types/entity/registrationScheduleType';

export class MatchService {
  // ============================================
  // 1. MATCH CREATION
  // ============================================

  /**
   * Create League Match (from fixture)
   */
  static async createLeagueMatch(data: {
    fixtureId: string;
    matchDate: Date;
    adminId: string;
  }): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'createLeagueMatch', {
        fixtureId: data.fixtureId,
        matchDate: data.matchDate
      });

      // Get fixture
      const fixtureResult = await fixtureAPI.getById(data.fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'FIXTURE_NOT_FOUND',
            message: 'Fixture bulunamadı',
            statusCode: 404,
          },
        };
      }

      const fixture = fixtureResult.data;

      // Check if user is organizer
      const isOrganizerCheck = await fixtureAPI.isOrganizer(data.fixtureId, data.adminId);
      if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Bu fixture için maç oluşturma yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Get league and active season
      const leagueResult = await leagueAPI.getById(fixture.leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: false,
          error: {
            code: 'LEAGUE_NOT_FOUND',
            message: 'Lig bulunamadı',
            statusCode: 404,
          },
        };
      }

      const league = leagueResult.data;

      if (!league.currentSeasonId) {
        return {
          success: false,
          error: {
            code: 'NO_ACTIVE_SEASON',
            message: 'Aktif sezon bulunamadı',
            statusCode: 400,
          },
        };
      }

      // Calculate match times
      const matchStart = new Date(data.matchDate);
      const [hours, minutes] = fixture.schedule.matchStartTime.split(':');
      matchStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const matchEnd = new Date(matchStart);
      matchEnd.setMinutes(matchEnd.getMinutes() + fixture.schedule.matchDuration);

      // 🆕 Calculate registration times using RegistrationSchedule
      const registrationStart = calculateRegistrationOpenTime(
        matchStart,
        fixture.schedule.registrationSchedule
      );

      const registrationEnd = calculateRegistrationCloseTime(
        matchStart,
        fixture.schedule.registrationSchedule
      );

      // Create match data
      const matchData: Omit<IMatch, 'id'> = {
        type: MatchType.LEAGUE,
        leagueId: fixture.leagueId,
        fixtureId: data.fixtureId,
        seasonId: league.currentSeasonId,
        title: `${fixture.title} - ${matchStart.toLocaleDateString('tr-TR')}`,
        sportType: league.sportType,
        schedule: {
          registrationStart,
          registrationEnd,
          matchStart,
          matchEnd,
        },
        squad: {
          totalPlayers: fixture.squad.totalPlayers,
          reservePlayers: fixture.squad.reservePlayers,
          minPlayersToStart: fixture.squad.minPlayersToStart,
        },
        players: {
          premium: fixture.players.premium,
          direct: fixture.players.direct,
          guests: [],
          registered: [],
          reserves: [],
        },
        permissions: {
          organizers: fixture.permissions.organizers,
          teamBuilders: fixture.permissions.teamBuilders || [],
        },
        venue: fixture.venue,
        payments: [],
        status: MatchStatus.CREATED,
        createdAt: new Date().toISOString(),
      };

      // Create match
      const result = await matchAPI.create(matchData);

      if (result.success && result.data) {
        // Update fixture cache
        await fixtureAPI.incrementTotalMatches(data.fixtureId);

        // Update league cache
        await leagueAPI.incrementTotalMatches(fixture.leagueId);

        // Auto-open registration
        await this.openRegistration(result.data.id!);

        ApiLogger.success('MatchService', 'createLeagueMatch', {
          matchId: result.data.id
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'createLeagueMatch', error);
      return {
        success: false,
        error: {
          code: 'CREATE_MATCH_ERROR',
          message: error.message || 'Maç oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
 * Create Friendly Match (with invitation code system)
 */
static async createFriendlyMatch(data: {
  organizerId: string;
  title: string;
  sportType: SportType;
  matchStartTime: Date; // ✅ matchDate → matchStartTime (daha açık)
  matchDuration?: number; // ✅ Optional, default 90
  location: string; // ✅ venue → location (daha basit)
  staffPlayerCount: number; // ✅ squad → staffPlayerCount
  reservePlayerCount: number; // ✅ squad → reservePlayerCount
  pricePerPlayer?: number;
  paymentInfo?: {
    iban?: string;
    accountName?: string;
  };
  linkedLeagueId?: string;
  description?: string;
  
  // ✅ YENİ: Simplified friendly settings
  isPublic: boolean;
  affectsStats?: boolean;
  affectsStandings?: boolean;
  
  // ✅ YENİ: Invitation code settings (replaces invitedPlayerIds)
  enableInvitationCode?: boolean; // Varsayılan: true (özel maçlar için)
  invitationCodeExpiry?: number; // Saat cinsinden (varsayılan: 48)
  invitationCodeMaxUses?: number; // Maksimum kullanım
}): Promise<ApiResponse<IMatch>> {
  try {
    ApiLogger.log('MatchService', 'createFriendlyMatch', {
      organizerId: data.organizerId,
      title: data.title,
      sportType: data.sportType,
      isPublic: data.isPublic,
    });

    // ============================================
    // 1. VALIDATION
    // ============================================

    // Validate organizer exists
    const organizerCheck = await playerAPI.exists(data.organizerId);
    if (!organizerCheck.success || !organizerCheck.data) {
      return {
        success: false,
        error: {
          code: 'ORGANIZER_NOT_FOUND',
          message: 'Organizatör bulunamadı',
          statusCode: 404,
        },
      };
    }

    // Validate staff count
    if (data.staffPlayerCount < 2) {
      return {
        success: false,
        error: {
          code: 'INVALID_STAFF_COUNT',
          message: 'Kadro sayısı en az 2 olmalı',
          statusCode: 400,
        },
      };
    }

    // Validate reserve count
    if (data.reservePlayerCount < 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_RESERVE_COUNT',
          message: 'Yedek sayısı 0 veya daha fazla olmalı',
          statusCode: 400,
        },
      };
    }

    // ============================================
    // 2. CALCULATE TIMES
    // ============================================

    const matchDuration = data.matchDuration || 90; // Default 90 minutes
    const matchStart = new Date(data.matchStartTime.getTime());
    if (isNaN(matchStart.getTime())) {
      return {
        success: false,
        error: {
          code: 'INVALID_MATCH_START',
          message: 'Geçersiz maç başlangıç zamanı',
          statusCode: 400,
        },
      };
    }
    const matchEnd = new Date(matchStart.getTime());
    matchEnd.setMinutes(matchEnd.getMinutes() + matchDuration);

    // Registration opens 24 hours before match
    const registrationStart = new Date(matchStart.getTime());
    registrationStart.setHours(registrationStart.getHours() - 24);

    // Registration closes 30 minutes before match
    const registrationEnd = new Date(matchStart.getTime());
    registrationEnd.setMinutes(registrationEnd.getMinutes() - 30);

    // ============================================
    // 3. GENERATE INVITATION CODE (if private)
    // ============================================

    let invitationCode: IMatch['invitationCode'] | undefined;
    
    if (!data.isPublic && data.enableInvitationCode !== false) {
      try {
        const code = await this.generateUniqueCode();
        
        const expiryHours = data.invitationCodeExpiry || 48; // Default 48 hours
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
        
        invitationCode = {
          code,
          enabled: true,
          expiresAt,
          maxUses: data.invitationCodeMaxUses || data.staffPlayerCount,
          currentUses: 0,
          createdAt: new Date(),
          createdBy: data.organizerId,
        };

        ApiLogger.log('MatchService', 'createFriendlyMatch', {
          invitationCode: code,
          expiresAt,
          maxUses: invitationCode.maxUses,
        });
      } catch (error) {
        ApiLogger.error('MatchService', 'createFriendlyMatch - code generation', error);
        return {
          success: false,
          error: {
            code: 'CODE_GENERATION_ERROR',
            message: 'Davet kodu oluşturulamadı',
            statusCode: 500,
          },
        };
      }
    }

    // ============================================
    // 4. CREATE MATCH DATA
    // ============================================

    const matchData: Omit<IMatch, 'id'> = {
      type: MatchType.FRIENDLY,
      organizerId: data.organizerId,
      linkedLeagueId: data.linkedLeagueId,
      title: data.title,
      sportType: data.sportType,
      description: data.description,
      
      schedule: {
         registrationStart,
        registrationEnd,
        matchStart,
        matchEnd,
      },
      
      squad: {
        totalPlayers: data.staffPlayerCount,
        reservePlayers: data.reservePlayerCount,
        minPlayersToStart: Math.ceil(data.staffPlayerCount / 2),
      },
      
      venue: {
        location: data.location,
        pricePerPlayer: data.pricePerPlayer || 0,
        payment: data.paymentInfo   || {
          iban: '',
          accountName: '',
        },
      },
      
      players: {
        premium: {
          mode: 'custom',
          inherited: [],
          overrides: [],
        },
        direct: {
          mode: 'custom',
          inherited: [],
          overrides: [data.organizerId], // Organizer auto-added
        },
        guests: [],
        registered: [],
        reserves: [],
      },
      
      permissions: {
        organizers: [data.organizerId],
        teamBuilders: [data.organizerId],
      },
      
      friendlySettings: {
        isPublic: data.isPublic,
        affectsStats: data.affectsStats ?? true,
        affectsStandings: data.affectsStandings ?? false,
      },
      
      // ✅ NEW: Invitation code
      invitationCode,
      
      payments: [],
      status: MatchStatus.CREATED,
      totalComments: 0,
      totalRatings: 0,
      createdAt: new Date().toISOString(),
    };

    // ============================================
    // 5. CREATE MATCH
    // ============================================

    const result = await matchAPI.create(matchData);

    if (!result.success || !result.data) {
      return result;
    }

    const matchId = result.data.id!;

    // ============================================
    // 6. AUTO-OPEN REGISTRATION
    // ============================================

    try {
      await this.openRegistration(matchId);
      ApiLogger.success('MatchService', 'createFriendlyMatch - registration opened', {
        matchId
      });
    } catch (error) {
      ApiLogger.error('MatchService', 'createFriendlyMatch - open registration failed', error);
      // Continue anyway, match is created
    }

    // ============================================
    // 7. SUCCESS
    // ============================================

    ApiLogger.success('MatchService', 'createFriendlyMatch', {
      matchId,
      invitationCode: invitationCode?.code,
      isPublic: data.isPublic,
    });

    return result;

  } catch (error: any) {
    ApiLogger.error('MatchService', 'createFriendlyMatch', error);
    return {
      success: false,
      error: {
        code: 'CREATE_FRIENDLY_ERROR',
        message: error.message || 'Dostluk maçı oluşturulurken hata oluştu',
        details: error,
        statusCode: 500,
      },
    };
  }
}

// ============================================
// DEPRECATION NOTICE FOR OLD METHOD
// ============================================

/**
 * @deprecated Use createFriendlyMatch with new invitation code system
 * 
 * Old method signature for backward compatibility:
 * - invitedPlayerIds → Now use invitation code
 * - venue object → Now simplified to location + payment
 * - squad object → Now staffPlayerCount + reservePlayerCount
 */
static async createFriendlyMatchLegacy(data: {
  organizerId: string;
  title: string;
  sportType: SportType;
  matchDate: Date;
  matchDuration: number;
  venue: IMatch['venue'];
  squad: IMatch['squad'];
  linkedLeagueId?: string;
  description?: string;
  friendlySettings?: {
    isPublic?: boolean;
    invitedPlayerIds?: string[]; // ❌ DEPRECATED
    affectsStats?: boolean;
    affectsStandings?: boolean;
  };
}): Promise<ApiResponse<IMatch>> {
  // Convert to new format
  return this.createFriendlyMatch({
    organizerId: data.organizerId,
    title: data.title,
    sportType: data.sportType,
    matchStartTime: data.matchDate,
    matchDuration: data.matchDuration,
    location: data.venue?.location || '',
    staffPlayerCount: data.squad.totalPlayers,
    reservePlayerCount: data.squad.reservePlayers,
    pricePerPlayer: data.venue?.pricePerPlayer,
    paymentInfo: data.venue?.payment,
    linkedLeagueId: data.linkedLeagueId,
    description: data.description,
    isPublic: data.friendlySettings?.isPublic ?? true,
    affectsStats: data.friendlySettings?.affectsStats,
    affectsStandings: data.friendlySettings?.affectsStandings,
    enableInvitationCode: !data.friendlySettings?.isPublic,
  });
}

  // ============================================
  // 2. MATCH LIFECYCLE (STATUS MANAGEMENT)
  // ============================================

  /**
   * Open registration for match
   * Status: CREATED → REGISTRATION_OPEN
   */
  static async openRegistration(matchId: string): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'openRegistration', { matchId });

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return matchResult;
      }

      const match = matchResult.data;

      // Validate status
      if (match.status !== MatchStatus.CREATED) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Kayıt açılamaz. Mevcut durum: ${match.status}`,
            statusCode: 400,
          },
        };
      }

      // Check if registration time is valid
      const now = new Date();
      if (match.type ===MatchType.LEAGUE && now > match.schedule.registrationEnd) {
        return {
          success: false,
          error: {
            code: 'REGISTRATION_EXPIRED',
            message: 'Kayıt süresi geçmiş',
            statusCode: 400,
          },
        };
      }

      const result = await matchAPI.updateStatus(matchId, MatchStatus.REGISTRATION_OPEN);

      if (result.success) {
        // Send registration open notifications
        await this.notifyRegistrationOpen(match);

        ApiLogger.success('MatchService', 'openRegistration', { matchId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'openRegistration', error);
      return {
        success: false,
        error: {
          code: 'OPEN_REGISTRATION_ERROR',
          message: error.message || 'Kayıt açılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Close registration for match
   * Status: REGISTRATION_OPEN → REGISTRATION_CLOSED
   */
  static async closeRegistration(matchId: string): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'closeRegistration', { matchId });

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return matchResult;
      }

      const match = matchResult.data;

      // Validate status
      if (match.status !== MatchStatus.REGISTRATION_OPEN) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Kayıt kapatılamaz. Mevcut durum: ${match.status}`,
            statusCode: 400,
          },
        };
      }

      // Check minimum players
      const totalRegistered = this.calculateTotalPlayers(match);

      if (totalRegistered < match.squad.minPlayersToStart) {
        ApiLogger.warn('MatchService', 'closeRegistration',
          `Minimum oyuncu sayısı karşılanmadı: ${totalRegistered}/${match.squad.minPlayersToStart}`
        );
      }

      const result = await matchAPI.updateStatus(matchId, MatchStatus.REGISTRATION_CLOSED);

      if (result.success) {
        // Send registration closed notifications
        await this.notifyRegistrationClosed(match, totalRegistered);

        ApiLogger.success('MatchService', 'closeRegistration', {
          matchId,
          totalPlayers: totalRegistered
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'closeRegistration', error);
      return {
        success: false,
        error: {
          code: 'CLOSE_REGISTRATION_ERROR',
          message: error.message || 'Kayıt kapatılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Build teams (manually or algorithmically)
   * Status: REGISTRATION_CLOSED → TEAMS_SET
   */
  static async buildTeams(
    matchId: string,
    algorithm: 'random' | 'rating' | 'position' | 'manual',
    manualTeams?: {
      team1: Array<{ playerId: string; position?: string }>;
      team2: Array<{ playerId: string; position?: string }>;
    }
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'buildTeams', { matchId, algorithm });

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return matchResult;
      }

      const match = matchResult.data;

      // Validate status
      if (match.status !== MatchStatus.REGISTRATION_CLOSED) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Takımlar kurulamaz. Mevcut durum: ${match.status}`,
            statusCode: 400,
          },
        };
      }

      let teams;

      if (algorithm === 'manual' && manualTeams) {
        teams = manualTeams;
      } else {
        // Get all eligible players
        const eligiblePlayers = this.getEligiblePlayers(match);

        if (eligiblePlayers.squad.length < match.squad.minPlayersToStart) {
          return {
            success: false,
            error: {
              code: 'INSUFFICIENT_PLAYERS',
              message: `Yetersiz oyuncu: ${eligiblePlayers.squad.length}/${match.squad.minPlayersToStart}`,
              statusCode: 400,
            },
          };
        }

        // Build teams based on algorithm
        teams = await this.executeTeamBuildingAlgorithm(
          eligiblePlayers.squad,
          algorithm,
          match
        );
      }

      // Set teams
      const setTeamsResult = await matchAPI.setTeams(matchId, teams);

      if (!setTeamsResult.success) {
        return setTeamsResult;
      }

      // Update status
      const result = await matchAPI.updateStatus(matchId, MatchStatus.TEAMS_SET);

      if (result.success) {
        // Initialize payments for all players
        const allPlayers = [
          ...teams.team1.map(p => p.playerId),
          ...teams.team2.map(p => p.playerId),
        ];
        await this.initializePayments(matchId, allPlayers, match.venue?.pricePerPlayer || 0);

        // Send team assignment notifications
        await this.notifyTeamsSet(match, teams);

        ApiLogger.success('MatchService', 'buildTeams', {
          matchId,
          team1Count: teams.team1.length,
          team2Count: teams.team2.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'buildTeams', error);
      return {
        success: false,
        error: {
          code: 'BUILD_TEAMS_ERROR',
          message: error.message || 'Takımlar oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Start match
   * Status: TEAMS_SET → IN_PROGRESS
   */
  static async startMatch(matchId: string): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'startMatch', { matchId });

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return matchResult;
      }

      const match = matchResult.data;

      // Validate status
      if (match.status !== MatchStatus.TEAMS_SET) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Maç başlatılamaz. Mevcut durum: ${match.status}`,
            statusCode: 400,
          },
        };
      }

      // Validate teams are set
      if (!match.players.teams) {
        return {
          success: false,
          error: {
            code: 'NO_TEAMS',
            message: 'Takımlar henüz oluşturulmamış',
            statusCode: 400,
          },
        };
      }

      const result = await matchAPI.updateStatus(matchId, MatchStatus.IN_PROGRESS);

      if (result.success) {
        // Send match started notifications
        await this.notifyMatchStarted(match);

        ApiLogger.success('MatchService', 'startMatch', { matchId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'startMatch', error);
      return {
        success: false,
        error: {
          code: 'START_MATCH_ERROR',
          message: error.message || 'Maç başlatılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Submit match score
   * Status: IN_PROGRESS → AWAITING_SCORE
   */
  static async submitScore(
    matchId: string,
    scoreData: {
      team1: number;
      team2: number;
      scorers?: Array<{
        playerId: string;
        goals: number;
        assists: number;
      }>;
    }
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'submitScore', { matchId, scoreData });

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return matchResult;
      }

      const match = matchResult.data;

      // Validate status
      if (match.status !== MatchStatus.IN_PROGRESS && match.status !== MatchStatus.AWAITING_SCORE) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Skor girilemez. Mevcut durum: ${match.status}`,
            statusCode: 400,
          },
        };
      }

      // Prepare scorers with confirmed flag
      const scorersWithConfirm = scoreData.scorers?.map(scorer => ({
        ...scorer,
        confirmed: true,
      })) || [];

      // Update score
      const result = await matchAPI.updateScore(matchId, {
        team1: scoreData.team1,
        team2: scoreData.team2,
        scorers: scorersWithConfirm,
      });

      if (result.success) {
        // Update status to awaiting score if needed
        if (match.status === MatchStatus.IN_PROGRESS) {
          await matchAPI.updateStatus(matchId, MatchStatus.AWAITING_SCORE);
        }

        ApiLogger.success('MatchService', 'submitScore', { matchId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'submitScore', error);
      return {
        success: false,
        error: {
          code: 'SUBMIT_SCORE_ERROR',
          message: error.message || 'Skor girilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Complete match (final step)
   * Status: AWAITING_SCORE → COMPLETED
   */
  static async completeMatch(matchId: string): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'completeMatch', { matchId });

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return matchResult;
      }

      const match = matchResult.data;

      // Validate status
      if (match.status !== MatchStatus.AWAITING_SCORE) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Maç tamamlanamaz. Mevcut durum: ${match.status}`,
            statusCode: 400,
          },
        };
      }

      // Validate score exists
      if (!match.score) {
        return {
          success: false,
          error: {
            code: 'NO_SCORE',
            message: 'Skor girilmemiş',
            statusCode: 400,
          },
        };
      }

      // Update status
      const result = await matchAPI.updateStatus(matchId, MatchStatus.COMPLETED);

      if (result.success) {
        // Post-match operations (parallel execution)
        await Promise.all([
          // 1. Update standings (if league match and affects standings)
          this.updateStandingsAfterMatch(match),

          // 2. Update player stats
          this.updatePlayerStatsAfterMatch(match),

          // 3. Calculate and set MVP if not manually set
          match.mvp ? Promise.resolve() : this.calculateAndSetMVP(matchId),

          // 4. Send rating requests (2 hours after match)
          this.scheduleRatingRequests(match),

          // 5. Send match completed notifications
          this.notifyMatchCompleted(match),
        ]);

        ApiLogger.success('MatchService', 'completeMatch', { matchId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'completeMatch', error);
      return {
        success: false,
        error: {
          code: 'COMPLETE_MATCH_ERROR',
          message: error.message || 'Maç tamamlanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Cancel match
   * Status: ANY → CANCELLED
   */
  static async cancelMatch(
    matchId: string,
    reason: string,
    userId: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'cancelMatch', { matchId, reason, userId });

      // Check if user is organizer
      const isOrganizerCheck = await matchAPI.isOrganizer(matchId, userId);
      if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Bu maçı iptal etme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return matchResult;
      }

      const match = matchResult.data;

      // Cannot cancel completed matches
      if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Maç iptal edilemez. Mevcut durum: ${match.status}`,
            statusCode: 400,
          },
        };
      }

      // Update status and add cancellation reason
      const result = await matchAPI.update(matchId, {
        status: MatchStatus.CANCELLED,
        description: `${match.description || ''}\n\nİPTAL NEDENİ: ${reason}`,
      } as Partial<Omit<IMatch, 'id'>>);

      if (result.success) {
        // Send cancellation notifications
        await this.notifyMatchCancelled(match, reason);

        // Expire pending invitations
        await matchInvitationsAPI.expirePendingInvitations(matchId);

        ApiLogger.success('MatchService', 'cancelMatch', { matchId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'cancelMatch', error);
      return {
        success: false,
        error: {
          code: 'CANCEL_MATCH_ERROR',
          message: error.message || 'Maç iptal edilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. PLAYER MANAGEMENT
  // ============================================

  /**
   * Register player to match
   */
  static async registerPlayer(
    matchId: string,
    playerId: string,
    preferredPosition?: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'registerPlayer', { matchId, playerId });

      // Check if player can register
      const canRegisterCheck = await matchAPI.canPlayerRegister(matchId, playerId);

      if (!canRegisterCheck.success || !canRegisterCheck.data?.can) {
        return {
          success: false,
          error: {
            code: 'CANNOT_REGISTER',
            message: canRegisterCheck.data?.reason || 'Kayıt olunamadı',
            statusCode: 400,
          },
        };
      }

      const result = await matchAPI.registerPlayer(matchId, playerId, preferredPosition);

      if (result.success) {
        // Send registration confirmation
        const matchResult = await matchAPI.getById(matchId);
        if (matchResult.success && matchResult.data) {
          await notificationAPI.createNotification({
            userId: playerId,
            type: 'team_assignment',
            title: 'Kayıt Başarılı',
            message: `${matchResult.data.title} maçına kayıt oldunuz.`,
            relatedId: matchId,
            relatedType: 'match',
            actionUrl: `/matches/${matchId}`,
            actionLabel: 'Maçı Gör',
          });
        }

        ApiLogger.success('MatchService', 'registerPlayer', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'registerPlayer', error);
      return {
        success: false,
        error: {
          code: 'REGISTER_PLAYER_ERROR',
          message: error.message || 'Oyuncu kaydedilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
 * Cancel player registration from match
 * Oyuncu kaydını iptal et (takımlar kurulmadan önce)
 */
  static async unregisterPlayer(
    matchId: string,
    playerId: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'cancelRegistration', { matchId, playerId });

      // Get match
      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;

      // Check if teams are already set
      if (match.players.teams &&
        (match.players.teams.team1.length > 0 || match.players.teams.team2.length > 0)) {
        return {
          success: false,
          error: {
            code: 'TEAMS_ALREADY_SET',
            message: 'Takımlar kuruldu. Artık kaydı iptal edemezsiniz.',
            statusCode: 400
          }
        };
      }

      // Check if player is registered
      const isRegistered = match.players.registered?.some(r => r.playerId === playerId);
      const isGuest = match.players.guests?.includes(playerId);
      const isInTeams = match.players.teams?.team1?.some(p => p.playerId === playerId) || match.players.teams?.team2?.some(p => p.playerId === playerId);
      const isReserve = match.players.reserves?.includes(playerId);
      const isInherit = match.players.premium.inherited?.includes(playerId) || match.players.premium.overrides?.includes(playerId);
      const isDirect = match.players.direct.inherited?.includes(playerId) || match.players.direct.overrides?.includes(playerId);
      const isDirectOverride = match.players.direct.overrides?.includes(playerId);
      const isPremiumOverride = match.players.premium.overrides?.includes(playerId);

      // Direct or Premium players cannot unregister

      if (!isRegistered && !isGuest && !isReserve && !isInTeams && !isInherit && !isDirect && !isDirectOverride && !isPremiumOverride) {
        return {
          success: false,
          error: {
            code: 'NOT_REGISTERED',
            message: 'Bu maça kayıtlı değilsiniz',
            statusCode: 400
          }
        };
      }

      const result = await matchAPI.unregisterPlayer(matchId, playerId);
      if (result.success) {
        ApiLogger.success('MatchService', 'cancelRegistration', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'cancelRegistration', error);
      return {
        success: false,
        error: {
          code: 'CANCEL_REGISTRATION_ERROR',
          message: error.message || 'Kayıt iptal edilirken hata oluştu',
          details: error,
          statusCode: 500
        }
      };
    }
  }


  /**
   * Add guest player
   */
  static async addGuestPlayer(
    matchId: string,
    playerId: string,
    addedBy: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'addGuestPlayer', { matchId, playerId, addedBy });

      // Check if user is organizer
      const isOrganizerCheck = await matchAPI.isOrganizer(matchId, addedBy);
      if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Misafir oyuncu ekleme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Validate player exists
      const playerCheck = await playerAPI.exists(playerId);
      if (!playerCheck.success || !playerCheck.data) {
        return {
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Oyuncu bulunamadı',
            statusCode: 404,
          },
        };
      }

      const result = await matchAPI.addGuestPlayer(matchId, playerId);

      if (result.success) {
        // Send guest player invitation
        const matchResult = await matchAPI.getById(matchId);
        if (matchResult.success && matchResult.data) {
          await notificationAPI.sendMatchInvitation(
            playerId,
            matchId,
            matchResult.data.title,
            matchResult.data.schedule.matchStart.toString()
          );
        }

        ApiLogger.success('MatchService', 'addGuestPlayer', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'addGuestPlayer', error);
      return {
        success: false,
        error: {
          code: 'ADD_GUEST_ERROR',
          message: error.message || 'Misafir oyuncu eklenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Move player to reserve list
   */
  static async moveToReserve(
    matchId: string,
    playerId: string,
    movedBy: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'moveToReserve', { matchId, playerId, movedBy });

      // Check if user is organizer
      const isOrganizerCheck = await matchAPI.isOrganizer(matchId, movedBy);
      if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Yedek listesine taşıma yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      const result = await matchAPI.moveToReserve(matchId, playerId);

      if (result.success) {
        // Send reserve list notification
        const matchResult = await matchAPI.getById(matchId);
        if (matchResult.success && matchResult.data) {
          await notificationAPI.createNotification({
            userId: playerId,
            type: 'team_assignment',
            title: 'Yedek Listesine Alındınız',
            message: `${matchResult.data.title} maçında yedek listesine alındınız.`,
            relatedId: matchId,
            relatedType: 'match',
          });
        }

        ApiLogger.success('MatchService', 'moveToReserve', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'moveToReserve', error);
      return {
        success: false,
        error: {
          code: 'MOVE_RESERVE_ERROR',
          message: error.message || 'Yedek listesine taşınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. PAYMENT MANAGEMENT
  // ============================================

  /**
   * Initialize payments for all players
   */
  private static async initializePayments(
    matchId: string,
    playerIds: string[],
    pricePerPlayer: number
  ): Promise<void> {
    try {
      const payments = playerIds.map(playerId => ({
        playerId,
        amount: pricePerPlayer,
        paid: false,
      }));

      await matchAPI.update(matchId, {
        payments,
      } as Partial<Omit<IMatch, 'id'>>);

      // Send payment reminders (48 hours before match)
      const match = await matchAPI.getById(matchId);
      if (match.success && match.data) {
        const hoursUntilMatch = Math.floor(
          (match.data.schedule.matchStart.getTime() - new Date().getTime()) / (1000 * 60 * 60)
        );

        if (hoursUntilMatch <= 48 && hoursUntilMatch > 0) {
          for (const playerId of playerIds) {
            await notificationAPI.sendPaymentReminder(
              playerId,
              matchId,
              match.data.title,
              pricePerPlayer
            );
          }
        }
      }

      ApiLogger.log('MatchService', 'initializePayments', {
        matchId,
        playerCount: playerIds.length,
        pricePerPlayer,
      });
    } catch (error: any) {
      ApiLogger.error('MatchService', 'initializePayments', error);
    }
  }


  // src/services/serviceLayer/matchService.ts
  // 💰 PAYMENT METHODS - API Layer Pattern ile

  /**
   * Player submits payment notification
   * Oyuncu "Ödeme Yaptım" der, organizatör onayını bekler
   */
  static async submitPlayerPayment(
    matchId: string,
    playerId: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'submitPlayerPayment', { matchId, playerId });

      // Get match
      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;

      // Find payment
      const payment = match.payments?.find(p => p.playerId === playerId);
      if (!payment) {
        return {
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Ödeme kaydı bulunamadı',
            statusCode: 404
          }
        };
      }

      // Update payment - mark as submitted (not confirmed yet)
      const updatedPayments = match.payments.map(p =>
        p.playerId === playerId
          ? {
            ...p,
            paidAt: new Date(), // Player submission time
            // confirmedBy remains undefined until organizer confirms
          }
          : p
      );

      // Update match
      const result = await matchAPI.update(matchId, {
        payments: updatedPayments,
        updatedAt: new Date().toISOString()
      });

      if (result.success) {
        ApiLogger.success('MatchService', 'submitPlayerPayment', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'submitPlayerPayment', error);
      return {
        success: false,
        error: {
          code: 'SUBMIT_PAYMENT_ERROR',
          message: error.message || 'Ödeme bildirimi gönderilemedi',
          details: error,
          statusCode: 500
        }
      };
    }
  }

  /**
   * Player cancels payment submission
   * "Yanlış işaretledim" - before organizer confirmation
   */
  static async cancelPlayerPayment(
    matchId: string,
    playerId: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'cancelPlayerPayment', { matchId, playerId });

      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;

      // Reset payment
      const updatedPayments = match.payments.map(p =>
        p.playerId === playerId
          ? {
            ...p,
            paid: false,
            paidAt: undefined,
            confirmedBy: undefined
          }
          : p
      );

      const result = await matchAPI.update(matchId, {
        payments: updatedPayments,
        updatedAt: new Date().toISOString()
      });

      if (result.success) {
        ApiLogger.success('MatchService', 'cancelPlayerPayment', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'cancelPlayerPayment', error);
      return {
        success: false,
        error: {
          code: 'CANCEL_PAYMENT_ERROR',
          message: error.message || 'Ödeme iptali yapılamadı',
          details: error,
          statusCode: 500
        }
      };
    }
  }

  /**
   * Organizer confirms/rejects payment
   * Organizatör "Ödeme Aldım" veya iptal eder
   */
  static async updatePaymentStatus(
    matchId: string,
    playerId: string,
    paid: boolean,
    confirmedBy: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'updatePaymentStatus', {
        matchId,
        playerId,
        paid,
        confirmedBy
      });

      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;

      // Check if confirmedBy is organizer
      if (!match.permissions.organizers.includes(confirmedBy)) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece organizatörler ödeme onaylayabilir',
            statusCode: 403
          }
        };
      }

      // Update payment
      const updatedPayments = match.payments.map(p =>
        p.playerId === playerId
          ? {
            ...p,
            paid,
            paidAt: paid ? (p.paidAt || new Date()) : undefined,
            confirmedBy: paid ? confirmedBy : undefined
          }
          : p
      );

      const result = await matchAPI.update(matchId, {
        payments: updatedPayments,
        updatedAt: new Date().toISOString()
      });

      if (result.success) {
        ApiLogger.success('MatchService', 'updatePaymentStatus', {
          matchId,
          playerId,
          paid
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'updatePaymentStatus', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PAYMENT_ERROR',
          message: error.message || 'Ödeme durumu güncellenemedi',
          details: error,
          statusCode: 500
        }
      };
    }
  }
  /**
   * Confirm player payment
   */
  static async confirmPayment(
    matchId: string,
    playerId: string,
    confirmedBy: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'confirmPayment', { matchId, playerId, confirmedBy });

      // Check if user is organizer
      const isOrganizerCheck = await matchAPI.isOrganizer(matchId, confirmedBy);
      if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Ödeme onaylama yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      const result = await matchAPI.updatePayment(matchId, playerId, {
        paid: true,
        paidAt: new Date(),
        confirmedBy,
      });

      if (result.success) {
        // Send payment confirmation
        await notificationAPI.createNotification({
          userId: playerId,
          type: 'payment_reminder',
          title: 'Ödeme Onaylandı',
          message: 'Maç ödemeniz onaylandı.',
          relatedId: matchId,
          relatedType: 'match',
        });

        ApiLogger.success('MatchService', 'confirmPayment', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'confirmPayment', error);
      return {
        success: false,
        error: {
          code: 'CONFIRM_PAYMENT_ERROR',
          message: error.message || 'Ödeme onaylanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }


  // ============================================
  // 2B. UPDATE OPERATIONS
  // ============================================

  /**
   * Update match details (before match starts)
   * Can only update: title, description, schedule, venue, squad, friendlySettings
   * Cannot update: type, leagueId, fixtureId, organizerId, players.teams, score, status
   */
  static async updateMatch(
    matchId: string,
    updates: Partial<IMatch>
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'updateMatch', { matchId, updates });

      // Get current match
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Validate: Cannot update completed or cancelled matches
      if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED) {
        return {
          success: false,
          error: {
            code: 'CANNOT_UPDATE',
            message: `Tamamlanmış veya iptal edilmiş maç güncellenemez. Durum: ${match.status}`,
            statusCode: 400,
          },
        };
      }

      // Validate: Cannot update if teams are set (except for organizer changes)
      if (match.status === MatchStatus.TEAMS_SET ||
        match.status === MatchStatus.IN_PROGRESS ||
        match.status === MatchStatus.AWAITING_SCORE) {

        // Only allow limited updates after teams are set
        const allowedFields = ['title', 'description', 'venue'];
        const updateKeys = Object.keys(updates);
        const hasDisallowedUpdate = updateKeys.some(
          key => !allowedFields.includes(key) && key !== 'updatedAt'
        );

        if (hasDisallowedUpdate) {
          return {
            success: false,
            error: {
              code: 'LIMITED_UPDATE',
              message: 'Takımlar kurulduktan sonra sadece başlık, açıklama ve yer bilgisi güncellenebilir',
              statusCode: 400,
            },
          };
        }
      }

      // Build safe update object (filter out fields that should never be updated)
      const safeUpdates: Partial<IMatch> = {};
      const immutableFields = ['id', 'type', 'leagueId', 'fixtureId', 'seasonId', 'organizerId',
        'createdAt', 'players.teams', 'score', 'mvp', 'status',
        'payments', 'ratingSummary', 'totalComments', 'totalRatings'];

      for (const [key, value] of Object.entries(updates)) {
        if (!immutableFields.includes(key)) {
          (safeUpdates as any)[key] = value;
        }
      }

      // Validate schedule if updated
      if (updates.schedule) {
        const now = new Date();

        if (new Date(updates.schedule.registrationStart) <= now) {
          return {
            success: false,
            error: {
              code: 'INVALID_SCHEDULE',
              message: 'Kayıt başlangıcı gelecekte olmalı',
              statusCode: 400,
            },
          };
        }

        if (new Date(updates.schedule.registrationEnd) <= new Date(updates.schedule.registrationStart)) {
          return {
            success: false,
            error: {
              code: 'INVALID_SCHEDULE',
              message: 'Kayıt bitişi, başlangıçtan sonra olmalı',
              statusCode: 400,
            },
          };
        }

        if (new Date(updates.schedule.matchStart) <= new Date(updates.schedule.registrationEnd)) {
          return {
            success: false,
            error: {
              code: 'INVALID_SCHEDULE',
              message: 'Maç başlangıcı, kayıt bitişinden sonra olmalı',
              statusCode: 400,
            },
          };
        }

        if (new Date(updates.schedule.matchEnd) <= new Date(updates.schedule.matchStart)) {
          return {
            success: false,
            error: {
              code: 'INVALID_SCHEDULE',
              message: 'Maç bitişi, başlangıçtan sonra olmalı',
              statusCode: 400,
            },
          };
        }
      }

      // Validate squad if updated
      if (updates.squad) {
        if (updates.squad.minPlayersToStart > updates.squad.totalPlayers) {
          return {
            success: false,
            error: {
              code: 'INVALID_SQUAD',
              message: 'Minimum oyuncu sayısı, toplam oyuncu sayısından fazla olamaz',
              statusCode: 400,
            },
          };
        }

        if (updates.squad.totalPlayers < 2) {
          return {
            success: false,
            error: {
              code: 'INVALID_SQUAD',
              message: 'Toplam oyuncu sayısı en az 2 olmalı',
              statusCode: 400,
            },
          };
        }

        // Check if reducing squad size affects existing registrations
        const currentTotalRegistered = this.calculateTotalPlayers(match);
        if (updates.squad.totalPlayers < currentTotalRegistered) {
          ApiLogger.warn('MatchService', 'updateMatch',
            `Kadro küçültülüyor: ${currentTotalRegistered} kayıtlı oyuncu var, yeni kadro: ${updates.squad.totalPlayers}`
          );
          // Don't block, but warn - some players will be moved to reserves
        }
      }

      // Add updatedAt timestamp
      safeUpdates.updatedAt = new Date().toISOString();

      // Update match
      const result = await matchAPI.update(matchId, safeUpdates);

      if (result.success) {
        // Send update notifications to registered players
        await this.notifyMatchUpdated(match, safeUpdates);

        ApiLogger.success('MatchService', 'updateMatch', {
          matchId,
          updatedFields: Object.keys(safeUpdates)
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'updateMatch', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_MATCH_ERROR',
          message: error.message || 'Maç güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Notify players about match updates
   */
  private static async notifyMatchUpdated(
    match: IMatch,
    updates: Partial<IMatch>
  ): Promise<void> {
    try {
      // Get all registered players
      const registered = match.players.registered?.map(r => r.playerId) || [];
      const direct = getEffectivePlayers(match.players.direct);
      const guests = match.players.guests || [];
      const allPlayers = [...new Set([...registered, ...direct, ...guests])];

      if (allPlayers.length === 0) {
        return;
      }

      // Build update message
      const updateMessages: string[] = [];

      if (updates.title) {
        updateMessages.push(`Başlık: ${updates.title}`);
      }

      if (updates.schedule) {
        updateMessages.push('Tarih/saat değişti');
      }

      if (updates.venue) {
        if (updates.venue.location) {
          updateMessages.push(`Yer: ${updates.venue.location}`);
        }
        if (updates.venue.pricePerPlayer !== undefined) {
          updateMessages.push(`Ücret: ${updates.venue.pricePerPlayer} ₺`);
        }
      }

      if (updates.squad) {
        updateMessages.push('Kadro ayarları değişti');
      }

      if (updateMessages.length === 0) {
        return;
      }

      const message = `${match.title} maçında değişiklik: ${updateMessages.join(', ')}`;

      // Send notifications
      for (const playerId of allPlayers) {
        await notificationAPI.createNotification({
          userId: playerId,
          type: 'match_reminder',
          title: 'Maç Güncellendi',
          message,
          relatedId: match.id!,
          relatedType: 'match',
          actionUrl: `/matches/${match.id}`,
          actionLabel: 'Detayları Gör',
        });
      }

      ApiLogger.success('MatchService', 'notifyMatchUpdated', {
        matchId: match.id,
        playerCount: allPlayers.length,
        updates: updateMessages,
      });
    } catch (error: any) {
      ApiLogger.error('MatchService', 'notifyMatchUpdated', error);
    }
  }

  // ============================================
  // 5. POST-MATCH OPERATIONS
  // ============================================
  // ============================================
  // 5. POST-MATCH OPERATIONS
  // ============================================

  /**
   * Update standings after match completion
   */
  private static async updateStandingsAfterMatch(match: IMatch): Promise<void> {
    try {
      // Only update for league matches or friendly matches that affect standings
      if (match.type === MatchType.FRIENDLY && !match.friendlySettings?.affectsStandings) {
        return;
      }

      if (!match.seasonId || !match.leagueId || !match.score || !match.players.teams) {
        return;
      }

      // Get standings
      const standingsResult = await standingsAPI.getBySeason(match.seasonId);

      if (!standingsResult.success || !standingsResult.data) {
        return;
      }

      const standings = standingsResult.data;

      // Determine winner
      const team1Won = match.score.team1 > match.score.team2;
      const team2Won = match.score.team2 > match.score.team1;
      const drawn = match.score.team1 === match.score.team2;

      // Calculate points (3 for win, 1 for draw, 0 for loss)
      const team1Points = team1Won ? 3 : (drawn ? 1 : 0);
      const team2Points = team2Won ? 3 : (drawn ? 1 : 0);

      // Get player names
      const playerNames = await this.getPlayerNames([
        ...match.players.teams.team1.map(p => p.playerId),
        ...match.players.teams.team2.map(p => p.playerId),
      ]);

      // Prepare updates for all players
      const matchUpdates: Array<{
        playerId: string;
        playerName: string;
        won: boolean;
        drawn: boolean;
        lost: boolean;
        goals: number;
        goalsAgainst: number;
        assists: number;
        points: number;
        form: 'W' | 'D' | 'L';
        rating?: number;
        isMVP?: boolean;
      }> = [];

      // Team 1 players
      for (const player of match.players.teams.team1) {
        const scorer = match.score.scorers?.find(s => s.playerId === player.playerId);
        const goals = scorer?.goals || 0;
        const assists = scorer?.assists || 0;

        matchUpdates.push({
          playerId: player.playerId,
          playerName: playerNames[player.playerId] || 'Unknown',
          won: team1Won,
          drawn,
          lost: team2Won,
          goals,
          goalsAgainst: match.score.team2,
          assists,
          points: team1Points,
          form: team1Won ? 'W' : (drawn ? 'D' : 'L'),
          isMVP: match.mvp?.playerId === player.playerId,
        });
      }

      // Team 2 players
      for (const player of match.players.teams.team2) {
        const scorer = match.score.scorers?.find(s => s.playerId === player.playerId);
        const goals = scorer?.goals || 0;
        const assists = scorer?.assists || 0;

        matchUpdates.push({
          playerId: player.playerId,
          playerName: playerNames[player.playerId] || 'Unknown',
          won: team2Won,
          drawn,
          lost: team1Won,
          goals,
          goalsAgainst: match.score.team1,
          assists,
          points: team2Points,
          form: team2Won ? 'W' : (drawn ? 'D' : 'L'),
          isMVP: match.mvp?.playerId === player.playerId,
        });
      }

      // Update standings
      if (match.type === MatchType.LEAGUE) {
        await standingsAPI.updateAfterLeagueMatch(standings.id!, matchUpdates);
      } else {
        // Friendly match that affects standings (only friendly stats, no points/goalsAgainst)
        await standingsAPI.updateAfterFriendlyMatch(standings.id!, matchUpdates.map(u => ({
          playerId: u.playerId,
          playerName: u.playerName,
          won: u.won,
          drawn: u.drawn,
          lost: u.lost,
          goals: u.goals,
          assists: u.assists,
          rating: u.rating,
          isMVP: u.isMVP,
        })));
      }

      ApiLogger.success('MatchService', 'updateStandingsAfterMatch', { matchId: match.id });
    } catch (error: any) {
      ApiLogger.error('MatchService', 'updateStandingsAfterMatch', error);
    }
  }

  /**
 * Player submits goal/assist entry
 * Oyuncu gol/asist girişi yapar
 */
  static async submitGoalAssist(
    matchId: string,
    playerId: string,
    goals: number,
    assists: number
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'submitGoalAssist', { matchId, playerId, goals, assists });

      // Get match
      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;

      // Check if player is in match
      if (!match.players.teams) {
        return {
          success: false,
          error: {
            code: 'NO_TEAMS',
            message: 'Takımlar henüz kurulmamış',
            statusCode: 400
          }
        };
      }

      const inTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
      const inTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);

      if (!inTeam1 && !inTeam2) {
        return {
          success: false,
          error: {
            code: 'PLAYER_NOT_IN_MATCH',
            message: 'Sadece maçta oynayan oyuncular gol/asist girebilir',
            statusCode: 403
          }
        };
      }

      // Validate against team score
      const teamScore = inTeam1 ? match.score?.team1 : match.score?.team2;
      if (goals > (teamScore || 0)) {
        return {
          success: false,
          error: {
            code: 'INVALID_GOALS',
            message: `Gol sayısı takım skorundan fazla olamaz (Max: ${teamScore})`,
            statusCode: 400
          }
        };
      }

      // Check if already submitted
      const existingEntry = match.score?.scorers?.find(s => s.playerId === playerId);
      if (existingEntry) {
        return {
          success: false,
          error: {
            code: 'ALREADY_SUBMITTED',
            message: 'Bu oyuncu için zaten gol/asist girişi yapılmış',
            statusCode: 400
          }
        };
      }

      // Add new scorer entry
      const updatedScorers = [
        ...(match.score?.scorers || []),
        {
          playerId,
          goals,
          assists,
          confirmed: false,
          submittedAt: new Date().toISOString(),
        }
      ];

      // Update match
      const result = await matchAPI.update(matchId, {
        score: {
          ...match.score,
          team1: match.score?.team1 || 0,
          team2: match.score?.team2 || 0,
          scorers: updatedScorers,
        }
      });

      if (result.success) {
        ApiLogger.success('MatchService', 'submitGoalAssist', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'submitGoalAssist', error);
      return {
        success: false,
        error: {
          code: 'SUBMIT_GOAL_ASSIST_ERROR',
          message: error.message || 'Gol/Asist kaydedilirken hata oluştu',
          details: error,
          statusCode: 500
        }
      };
    }
  }

  /**
   * Organizer approves goal/assist entry
   * Organizatör gol/asist girişini onaylar
   */
  static async approveGoalAssist(
    matchId: string,
    playerId: string,
    organizerId: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'approveGoalAssist', { matchId, playerId, organizerId });

      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;

      // Check if organizer
      if (!match.permissions.organizers.includes(organizerId)) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece organizatörler gol/asist onaylayabilir',
            statusCode: 403
          }
        };
      }

      // Find and update scorer
      const updatedScorers = (match.score?.scorers || []).map(s =>
        s.playerId === playerId
          ? { ...s, confirmed: true, confirmedBy: organizerId, confirmedAt: new Date().toISOString() }
          : s
      );

      const result = await matchAPI.update(matchId, {
        score: {
          ...match.score,
          team1: match.score?.team1 || 0,
          team2: match.score?.team2 || 0,
          scorers: updatedScorers,
        }
      });

      if (result.success) {
        ApiLogger.success('MatchService', 'approveGoalAssist', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'approveGoalAssist', error);
      return {
        success: false,
        error: {
          code: 'APPROVE_GOAL_ASSIST_ERROR',
          message: error.message || 'Onaylama sırasında hata oluştu',
          details: error,
          statusCode: 500
        }
      };
    }
  }

  /**
   * Organizer rejects goal/assist entry
   * Organizatör gol/asist girişini reddeder
   */
  static async rejectGoalAssist(
    matchId: string,
    playerId: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'rejectGoalAssist', { matchId, playerId });

      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;

      // Remove scorer entry
      const updatedScorers = (match.score?.scorers || []).filter(s => s.playerId !== playerId);

      const result = await matchAPI.update(matchId, {
        score: {
          ...match.score,
          team1: match.score?.team1 || 0,
          team2: match.score?.team2 || 0,
          scorers: updatedScorers,
        }
      });

      if (result.success) {
        ApiLogger.success('MatchService', 'rejectGoalAssist', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'rejectGoalAssist', error);
      return {
        success: false,
        error: {
          code: 'REJECT_GOAL_ASSIST_ERROR',
          message: error.message || 'Reddetme sırasında hata oluştu',
          details: error,
          statusCode: 500
        }
      };
    }
  }

  /**
   * Approve all pending goal/assist entries
   * Tüm bekleyen gol/asist girişlerini onayla
   */
  static async approveAllGoalAssists(
    matchId: string,
    organizerId: string
  ): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'approveAllGoalAssists', { matchId, organizerId });

      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;

      // Check if organizer
      if (!match.permissions.organizers.includes(organizerId)) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece organizatörler gol/asist onaylayabilir',
            statusCode: 403
          }
        };
      }

      // Approve all unconfirmed scorers
      const updatedScorers = (match.score?.scorers || []).map(s =>
        !s.confirmed
          ? { ...s, confirmed: true, confirmedBy: organizerId, confirmedAt: new Date().toISOString() }
          : s
      );

      const result = await matchAPI.update(matchId, {
        score: {
          ...match.score,
          team1: match.score?.team1 || 0,
          team2: match.score?.team2 || 0,
          scorers: updatedScorers,
        }
      });

      if (result.success) {
        ApiLogger.success('MatchService', 'approveAllGoalAssists', { matchId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'approveAllGoalAssists', error);
      return {
        success: false,
        error: {
          code: 'APPROVE_ALL_ERROR',
          message: error.message || 'Toplu onaylama sırasında hata oluştu',
          details: error,
          statusCode: 500
        }
      };
    }
  }

  /**
   * Get goal/assist statistics for match
   * Maç için gol/asist istatistikleri
   */
  static async getGoalAssistStats(matchId: string): Promise<ApiResponse<{
    totalGoals: number;
    totalAssists: number;
    confirmedGoals: number;
    confirmedAssists: number;
    pendingCount: number;
    topScorers: Array<{
      playerId: string;
      goals: number;
      assists: number;
    }>;
  }>> {
    try {
      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404
          }
        };
      }

      const match = matchResult.data;
      const scorers = match.score?.scorers || [];

      const totalGoals = scorers.reduce((sum, s) => sum + s.goals, 0);
      const totalAssists = scorers.reduce((sum, s) => sum + s.assists, 0);

      const confirmedScorers = scorers.filter(s => s.confirmed);
      const confirmedGoals = confirmedScorers.reduce((sum, s) => sum + s.goals, 0);
      const confirmedAssists = confirmedScorers.reduce((sum, s) => sum + s.assists, 0);

      const pendingCount = scorers.filter(s => !s.confirmed).length;

      // Top scorers (sorted by goals + assists)
      const topScorers = [...scorers]
        .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
        .slice(0, 5)
        .map(s => ({
          playerId: s.playerId,
          goals: s.goals,
          assists: s.assists,
        }));

      return {
        success: true,
        data: {
          totalGoals,
          totalAssists,
          confirmedGoals,
          confirmedAssists,
          pendingCount,
          topScorers,
        }
      };
    } catch (error: any) {
      ApiLogger.error('MatchService', 'getGoalAssistStats', error);
      return {
        success: false,
        error: {
          code: 'GET_STATS_ERROR',
          message: error.message || 'İstatistikler alınırken hata oluştu',
          details: error,
          statusCode: 500
        }
      };
    }
  }
  /**
   * Update player stats after match completion
   */
  private static async updatePlayerStatsAfterMatch(match: IMatch): Promise<void> {
    try {
      // Check if stats should be updated
      if (match.type === MatchType.FRIENDLY && !match.friendlySettings?.affectsStats) {
        return;
      }

      if (!match.seasonId || !match.leagueId || !match.score || !match.players.teams) {
        return;
      }

      // Determine winner
      const team1Won = match.score.team1 > match.score.team2;
      const team2Won = match.score.team2 > match.score.team1;
      const drawn = match.score.team1 === match.score.team2;

      // Calculate points (only for league matches)
      const team1Points = team1Won ? 3 : (drawn ? 1 : 0);
      const team2Points = team2Won ? 3 : (drawn ? 1 : 0);

      // Get player ratings
      const ratingsResult = await matchRatingAPI.getByMatch(match.id!);
      const ratings = ratingsResult.success && ratingsResult.data ? ratingsResult.data : [];

      // Update stats for all players
      const allPlayers = [
        ...match.players.teams.team1,
        ...match.players.teams.team2,
      ];

      for (const player of allPlayers) {
        const isTeam1 = match.players.teams!.team1.some(p => p.playerId === player.playerId);
        const scorer = match.score.scorers?.find(s => s.playerId === player.playerId);
        const goals = scorer?.goals || 0;
        const assists = scorer?.assists || 0;

        // Get player average rating
        const playerRatings = ratings.filter(r => r.ratedPlayerId === player.playerId);
        const averageRating = playerRatings.length > 0
          ? playerRatings.reduce((sum, r) => sum + r.rating, 0) / playerRatings.length
          : undefined;

        // Calculate category averages
        let categoryAvg: any = undefined;
        if (playerRatings.some(r => r.categories)) {
          const withCategories = playerRatings.filter(r => r.categories);
          categoryAvg = {
            skill: withCategories.reduce((sum, r) => sum + (r.categories?.skill || 0), 0) / withCategories.length,
            teamwork: withCategories.reduce((sum, r) => sum + (r.categories?.teamwork || 0), 0) / withCategories.length,
            sportsmanship: withCategories.reduce((sum, r) => sum + (r.categories?.sportsmanship || 0), 0) / withCategories.length,
            effort: withCategories.reduce((sum, r) => sum + (r.categories?.effort || 0), 0) / withCategories.length,
          };
        }

        if (match.type === MatchType.LEAGUE) {
          // League match - includes points and cleanSheet
          const matchData = {
            won: isTeam1 ? team1Won : team2Won,
            drawn,
            lost: isTeam1 ? team2Won : team1Won,
            goals,
            assists,
            points: isTeam1 ? team1Points : team2Points,
            rating: averageRating,
            ratingCategory: categoryAvg,
            isMVP: match.mvp?.playerId === player.playerId,
            position: player.position,
            cleanSheet: isTeam1 ? match.score.team2 === 0 : match.score.team1 === 0,
            wasInvited: true,
          };

          await playerStatsAPI.updateAfterLeagueMatch(
            player.playerId,
            match.leagueId,
            match.seasonId,
            matchData
          );
        } else {
          // Friendly match - no points, no cleanSheet
          const matchData = {
            won: isTeam1 ? team1Won : team2Won,
            drawn,
            lost: isTeam1 ? team2Won : team1Won,
            goals,
            assists,
            rating: averageRating,
            ratingCategory: categoryAvg,
            isMVP: match.mvp?.playerId === player.playerId,
            position: player.position,
            wasInvited: true,
          };

          await playerStatsAPI.updateAfterFriendlyMatch(
            player.playerId,
            match.leagueId,
            match.seasonId,
            matchData
          );
        }
      }

      ApiLogger.success('MatchService', 'updatePlayerStatsAfterMatch', { matchId: match.id });
    } catch (error: any) {
      ApiLogger.error('MatchService', 'updatePlayerStatsAfterMatch', error);
    }
  }

  /**
   * Calculate and set MVP automatically
   */
  private static async calculateAndSetMVP(matchId: string): Promise<void> {
    try {
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return;
      }

      const match = matchResult.data;

      if (!match.players.teams) {
        return;
      }

      // Get all ratings for this match
      const ratingsResult = await matchRatingAPI.getByMatch(matchId);

      if (!ratingsResult.success || !ratingsResult.data || ratingsResult.data.length === 0) {
        return;
      }

      // Calculate average rating for each player
      const playerRatings: Record<string, { total: number; count: number; goals: number; assists: number }> = {};

      const allPlayers = [
        ...match.players.teams.team1.map(p => p.playerId),
        ...match.players.teams.team2.map(p => p.playerId),
      ];

      for (const playerId of allPlayers) {
        const playerRatingsForMatch = ratingsResult.data.filter(r => r.ratedPlayerId === playerId);
        const scorer = match.score?.scorers?.find(s => s.playerId === playerId);

        playerRatings[playerId] = {
          total: playerRatingsForMatch.reduce((sum, r) => sum + r.rating, 0),
          count: playerRatingsForMatch.length,
          goals: scorer?.goals || 0,
          assists: scorer?.assists || 0,
        };
      }

      // Find MVP (highest average rating + bonus for goals/assists)
      let mvpPlayerId = '';
      let mvpScore = 0;

      for (const [playerId, data] of Object.entries(playerRatings)) {
        if (data.count === 0) continue;

        const avgRating = data.total / data.count;
        // MVP Score = Average Rating + (Goals * 0.5) + (Assists * 0.3)
        const score = avgRating + (data.goals * 0.5) + (data.assists * 0.3);

        if (score > mvpScore) {
          mvpScore = score;
          mvpPlayerId = playerId;
        }
      }

      if (mvpPlayerId) {
        await matchAPI.updateMVP(matchId, {
          playerId: mvpPlayerId,
          calculatedAt: new Date().toISOString(),
          autoCalculated: true,
        });

        // Send MVP notification
        await notificationAPI.sendMVPAnnouncement(
          mvpPlayerId,
          matchId,
          match.title
        );

        ApiLogger.success('MatchService', 'calculateAndSetMVP', { matchId, mvpPlayerId });
      }
    } catch (error: any) {
      ApiLogger.error('MatchService', 'calculateAndSetMVP', error);
    }
  }

  /**
   * Schedule rating requests (2 hours after match)
   */
  private static async scheduleRatingRequests(match: IMatch): Promise<void> {
    try {
      if (!match.players.teams) {
        return;
      }

      // In production, this should be handled by a scheduled cloud function
      // For now, we'll just send notifications immediately

      const allPlayers = [
        ...match.players.teams.team1.map(p => p.playerId),
        ...match.players.teams.team2.map(p => p.playerId),
      ];

      for (const playerId of allPlayers) {
        await notificationAPI.sendRatingRequest(
          playerId,
          match.id!,
          match.title
        );
      }

      ApiLogger.success('MatchService', 'scheduleRatingRequests', { matchId: match.id });
    } catch (error: any) {
      ApiLogger.error('MatchService', 'scheduleRatingRequests', error);
    }
  }

  // ============================================
  // 6. INVITATION MANAGEMENT
  // ============================================

  /**
   * Send match invitations to players
   */
  private static async sendMatchInvitations(
    matchId: string,
    inviterId: string,
    playerIds: string[]
  ): Promise<void> {
    try {
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return;
      }

      const match = matchResult.data;

      // Get inviter name
      const inviterResult = await playerAPI.getById(inviterId);
      const inviterName = inviterResult.success && inviterResult.data
        ? `${inviterResult.data.name} ${inviterResult.data.surname}`
        : 'Unknown';

      // Get invitee names
      const inviteeNames = await this.getPlayerNames(playerIds);

      // Create invitations
      const invitations = playerIds.map(playerId => ({
        matchId,
        matchType: match.type,
        inviterId,
        inviterName,
        inviteeId: playerId,
        inviteeName: inviteeNames[playerId] || 'Unknown',
        status: 'pending' as const,
        message: `${match.title} maçına davet edildiniz.`,
        expiresAt: match.schedule.registrationEnd.toISOString(),
      }));

      await matchInvitationsAPI.createBulkInvitations(invitations);

      // Send notifications
      for (const playerId of playerIds) {
        await notificationAPI.sendMatchInvitation(
          playerId,
          matchId,
          match.title,
          match.schedule.matchStart.toLocaleDateString('tr-TR')
        );
      }

      ApiLogger.success('MatchService', 'sendMatchInvitations', {
        matchId,
        count: playerIds.length
      });
    } catch (error: any) {
      ApiLogger.error('MatchService', 'sendMatchInvitations', error);
    }
  }

  // ============================================
  // 7. NOTIFICATION HELPERS
  // ============================================

  private static async notifyRegistrationOpen(match: IMatch): Promise<void> {
    try {
      // Get all eligible players
      const premiumPlayers = getEffectivePlayers(match.players.premium);
      const directPlayers = getEffectivePlayers(match.players.direct);
      const allEligible = [...new Set([...premiumPlayers, ...directPlayers])];

      // Send notifications
      for (const playerId of allEligible) {
        await notificationAPI.createNotification({
          userId: playerId,
          type: 'match_invitation',
          title: 'Kayıtlar Açıldı',
          message: `${match.title} maçı için kayıtlar açıldı.`,
          relatedId: match.id!,
          relatedType: 'match',
          actionUrl: `/matches/${match.id}`,
          actionLabel: 'Kayıt Ol',
        });
      }
    } catch (error: any) {
      ApiLogger.error('MatchService', 'notifyRegistrationOpen', error);
    }
  }

  private static async notifyRegistrationClosed(match: IMatch, totalPlayers: number): Promise<void> {
    try {
      const registered = match.players.registered?.map(r => r.playerId) || [];
      const direct = getEffectivePlayers(match.players.direct);
      const guests = match.players.guests || [];

      const allRegistered = [...registered, ...direct, ...guests];

      for (const playerId of allRegistered) {
        await notificationAPI.createNotification({
          userId: playerId,
          type: 'match_reminder',
          title: 'Kayıtlar Kapandı',
          message: `${match.title} maçı için kayıtlar kapandı. Toplam: ${totalPlayers} oyuncu.`,
          relatedId: match.id!,
          relatedType: 'match',
        });
      }
    } catch (error: any) {
      ApiLogger.error('MatchService', 'notifyRegistrationClosed', error);
    }
  }

  private static async notifyTeamsSet(
    match: IMatch,
    teams: { team1: Array<{ playerId: string; position?: string }>; team2: Array<{ playerId: string; position?: string }> }
  ): Promise<void> {
    try {
      // Notify team 1
      for (const player of teams.team1) {
        await notificationAPI.sendTeamAssignment(
          player.playerId,
          match.id!,
          match.title,
          'Takım 1'
        );
      }

      // Notify team 2
      for (const player of teams.team2) {
        await notificationAPI.sendTeamAssignment(
          player.playerId,
          match.id!,
          match.title,
          'Takım 2'
        );
      }
    } catch (error: any) {
      ApiLogger.error('MatchService', 'notifyTeamsSet', error);
    }
  }

  private static async notifyMatchStarted(match: IMatch): Promise<void> {
    try {
      if (!match.players.teams) return;

      const allPlayers = [
        ...match.players.teams.team1.map(p => p.playerId),
        ...match.players.teams.team2.map(p => p.playerId),
      ];

      for (const playerId of allPlayers) {
        await notificationAPI.createNotification({
          userId: playerId,
          type: 'match_reminder',
          title: 'Maç Başladı',
          message: `${match.title} maçı başladı!`,
          relatedId: match.id!,
          relatedType: 'match',
        });
      }
    } catch (error: any) {
      ApiLogger.error('MatchService', 'notifyMatchStarted', error);
    }
  }

  private static async notifyMatchCompleted(match: IMatch): Promise<void> {
    try {
      if (!match.players.teams || !match.score) return;

      const allPlayers = [
        ...match.players.teams.team1.map(p => p.playerId),
        ...match.players.teams.team2.map(p => p.playerId),
      ];

      const result = `${match.score.team1} - ${match.score.team2}`;

      for (const playerId of allPlayers) {
        await notificationAPI.createNotification({
          userId: playerId,
          type: 'match_reminder',
          title: 'Maç Tamamlandı',
          message: `${match.title} maçı tamamlandı. Sonuç: ${result}`,
          relatedId: match.id!,
          relatedType: 'match',
          actionUrl: `/matches/${match.id}`,
          actionLabel: 'Sonuçları Gör',
        });
      }
    } catch (error: any) {
      ApiLogger.error('MatchService', 'notifyMatchCompleted', error);
    }
  }

  private static async notifyMatchCancelled(match: IMatch, reason: string): Promise<void> {
    try {
      const registered = match.players.registered?.map(r => r.playerId) || [];
      const direct = getEffectivePlayers(match.players.direct);
      const guests = match.players.guests || [];

      const allRegistered = [...registered, ...direct, ...guests];

      for (const playerId of allRegistered) {
        await notificationAPI.createNotification({
          userId: playerId,
          type: 'match_reminder',
          title: 'Maç İptal Edildi',
          message: `${match.title} maçı iptal edildi. Neden: ${reason}`,
          relatedId: match.id!,
          relatedType: 'match',
        });
      }
    } catch (error: any) {
      ApiLogger.error('MatchService', 'notifyMatchCancelled', error);
    }
  }

  // ============================================
  // 8. QUERY & READ OPERATIONS
  // ============================================

  static async getMatch(matchId: string): Promise<ApiResponse<IMatch>> {
    return matchAPI.getById(matchId);
  }

  static async getPlayerUpcomingMatches(
    playerId: string,
    limit: number = 10
  ): Promise<ApiResponse<IMatch[]>> {
    return matchAPI.getPlayerUpcomingMatches(playerId, limit);
  }

  static async getPlayerMatchHistory(
    playerId: string,
    limit: number = 20
  ): Promise<ApiResponse<IMatch[]>> {
    return matchAPI.getPlayerMatches(playerId, limit);
  }

  static async getLeagueMatches(leagueId: string): Promise<ApiResponse<IMatch[]>> {
    return matchAPI.getByLeague(leagueId);
  }

  static async getFixtureMatches(fixtureId: string): Promise<ApiResponse<IMatch[]>> {
    return matchAPI.getByFixture(fixtureId);
  }

  static async getMatchesByStatus(status: MatchStatus): Promise<ApiResponse<IMatch[]>> {
    return matchAPI.getByStatus(status);
  }

  // ============================================
  // 9. DELETE OPERATIONS
  // ============================================

  static async deleteMatch(matchId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('MatchService', 'deleteMatch', { matchId, userId });

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if user is organizer
      const isOrganizerCheck = await matchAPI.isOrganizer(matchId, userId);
      if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Bu maçı silme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Cannot delete completed or in-progress matches
      if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.IN_PROGRESS) {
        return {
          success: false,
          error: {
            code: 'CANNOT_DELETE',
            message: 'Tamamlanmış veya devam eden maç silinemez',
            statusCode: 400,
          },
        };
      }

      // Delete related data
      await Promise.all([
        // Delete invitations
        matchInvitationsAPI.deleteByMatchId(matchId),

        // Delete ratings
        matchRatingAPI.deleteMatchRatings(matchId),
      ]);

      const result = await matchAPI.delete(matchId);

      if (result.success) {
        ApiLogger.success('MatchService', 'deleteMatch', { matchId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'deleteMatch', error);
      return {
        success: false,
        error: {
          code: 'DELETE_MATCH_ERROR',
          message: error.message || 'Maç silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 10. TEAM BUILDING ALGORITHMS
  // ============================================

  /**
   * Calculate total registered players
   */
  private static calculateTotalPlayers(match: IMatch): number {
    const premiumPlayers = getEffectivePlayers(match.players.premium).length;
    const directPlayers = getEffectivePlayers(match.players.direct).length;
    const guestPlayers = match.players.guests?.length || 0;
    const registeredPlayers = match.players.registered?.length || 0;

    return premiumPlayers + directPlayers + guestPlayers + registeredPlayers;
  }

  /**
   * Get eligible players for team building
   */
  public static getEligiblePlayers(match: IMatch): { all: string[]; squad: string[]; reserve: string[] } {
    const players: string[] = [];

    // Premium players (who registered)
    const premiumList = getEffectivePlayers(match.players.premium);
    const registeredPremium = match.players.registered
      ?.filter(r => premiumList.includes(r.playerId))
      .map(r => r.playerId) || [];
    players.push(...registeredPremium);

    // Direct players (auto-included)
    const directList = getEffectivePlayers(match.players.direct);
    players.push(...directList);

    // Registered players (not premium)
    const normalRegistered = match.players.registered
      ?.filter(r => !premiumList.includes(r.playerId))
      .map(r => r.playerId) || [];
    players.push(...normalRegistered);

    // Guest players
    players.push(...(match.players.guests || []));

    // Remove duplicates and limit to squad size
    const uniquePlayers = [...new Set(players)];
    const squad = uniquePlayers.slice(0, match.squad.totalPlayers);
    const reserve = uniquePlayers.slice(match.squad.totalPlayers, match.squad.totalPlayers + match.squad.reservePlayers);
    return {
      all: [...squad, ...reserve],
      squad: squad,
      reserve: reserve,
    };
  }

  /**
   * Execute team building algorithm
   */
  private static async executeTeamBuildingAlgorithm(
    playerIds: string[],
    algorithm: 'random' | 'rating' | 'position' | 'manual',
    match: IMatch
  ): Promise<{
    team1: Array<{ playerId: string; position?: string }>;
    team2: Array<{ playerId: string; position?: string }>;
  }> {
    const playersPerTeam = Math.floor(playerIds.length / 2);

    switch (algorithm) {
      case 'random':
        return this.buildTeamsRandom(playerIds, playersPerTeam);

      case 'rating':
        return await this.buildTeamsByRating(playerIds, playersPerTeam, match);

      case 'position':
        return await this.buildTeamsByPosition(playerIds, playersPerTeam, match);
      case 'manual':
        return this.buildTeamsRandom(playerIds, playersPerTeam);
      default:
        return this.buildTeamsRandom(playerIds, playersPerTeam);
    }
  }

  /**
   * Build teams randomly
   * Algorithm: Simple shuffle and split
   */
  private static buildTeamsRandom(
    playerIds: string[],
    playersPerTeam: number
  ): {
    team1: Array<{ playerId: string; position?: string }>;
    team2: Array<{ playerId: string; position?: string }>;
  } {
    // Shuffle players using Fisher-Yates algorithm
    const shuffled = [...playerIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const team1 = shuffled.slice(0, playersPerTeam).map(playerId => ({
      playerId,
    }));

    const team2 = shuffled.slice(playersPerTeam, playersPerTeam * 2).map(playerId => ({
      playerId,
    }));

    return { team1, team2 };
  }

  /**
   * Build teams by rating (balanced approach)
   * Algorithm: Serpentine draft (1-2-2-1-1-2-2-1...)
   * This ensures both teams have similar total rating
   */
  private static async buildTeamsByRating(
    playerIds: string[],
    playersPerTeam: number,
    match: IMatch
  ): Promise<{
    team1: Array<{ playerId: string; position?: string }>;
    team2: Array<{ playerId: string; position?: string }>;
  }> {
    try {
      // Get player ratings from player_stats
      const playerRatings: Array<{ playerId: string; rating: number }> = [];

      for (const playerId of playerIds) {
        if (match.seasonId && match.leagueId) {
          const statsResult = await playerStatsAPI.getByPlayerLeagueSeason(
            playerId,
            match.leagueId,
            match.seasonId
          );

          if (statsResult.success && statsResult.data) {
            playerRatings.push({
              playerId,
              rating: statsResult.data.rating.average || 3.0, // Default to 3.0 if no rating
            });
          } else {
            playerRatings.push({
              playerId,
              rating: 3.0, // Default rating for new players
            });
          }
        } else {
          playerRatings.push({
            playerId,
            rating: 3.0,
          });
        }
      }

      // Sort players by rating (highest first)
      playerRatings.sort((a, b) => b.rating - a.rating);

      // Serpentine draft
      const team1: Array<{ playerId: string; position?: string }> = [];
      const team2: Array<{ playerId: string; position?: string }> = [];

      let pickForTeam1 = true;
      let serpentineReverse = false;

      for (let i = 0; i < playerRatings.length && (team1.length < playersPerTeam || team2.length < playersPerTeam); i++) {
        if (pickForTeam1 && team1.length < playersPerTeam) {
          team1.push({ playerId: playerRatings[i].playerId });
        } else if (!pickForTeam1 && team2.length < playersPerTeam) {
          team2.push({ playerId: playerRatings[i].playerId });
        }

        // Serpentine logic: alternate 1-2-2-1-1-2-2-1
        if (serpentineReverse) {
          // Going back: stay with current team for one more pick
          serpentineReverse = false;
        } else {
          // Normal: switch teams
          pickForTeam1 = !pickForTeam1;
          serpentineReverse = true;
        }
      }

      ApiLogger.log('MatchService', 'buildTeamsByRating', {
        team1Rating: team1.reduce((sum, p) => {
          const player = playerRatings.find(pr => pr.playerId === p.playerId);
          return sum + (player?.rating || 0);
        }, 0) / team1.length,
        team2Rating: team2.reduce((sum, p) => {
          const player = playerRatings.find(pr => pr.playerId === p.playerId);
          return sum + (player?.rating || 0);
        }, 0) / team2.length,
      });

      return { team1, team2 };
    } catch (error: any) {
      ApiLogger.error('MatchService', 'buildTeamsByRating', error);
      // Fallback to random
      return this.buildTeamsRandom(playerIds, playersPerTeam);
    }
  }

  /**
   * Build teams by position (balanced approach)
   * Algorithm: Distribute positions evenly, then balance by rating within positions
   */
  private static async buildTeamsByPosition(
    playerIds: string[],
    playersPerTeam: number,
    match: IMatch
  ): Promise<{
    team1: Array<{ playerId: string; position?: string }>;
    team2: Array<{ playerId: string; position?: string }>;
  }> {
    try {
      // Get player positions and ratings
      const playerData: Array<{
        playerId: string;
        position?: string;
        rating: number;
      }> = [];

      for (const playerId of playerIds) {
        // Get player's preferred position
        const playerResult = await playerAPI.getById(playerId);
        const registrationData = match.players.registered?.find(r => r.playerId === playerId);

        let position: string | undefined;
        if (registrationData?.preferredPosition) {
          position = registrationData.preferredPosition;
        } else if (playerResult.success && playerResult.data?.sportPositions) {
          const positions = playerResult.data.sportPositions[match.sportType];
          position = positions?.[0];
        }

        // Get player rating
        let rating = 3.0;
        if (match.seasonId && match.leagueId) {
          const statsResult = await playerStatsAPI.getByPlayerLeagueSeason(
            playerId,
            match.leagueId,
            match.seasonId
          );

          if (statsResult.success && statsResult.data) {
            rating = statsResult.data.rating.average || 3.0;
          }
        }

        playerData.push({ playerId, position, rating });
      }

      // Group by position
      const byPosition: Record<string, Array<{ playerId: string; rating: number }>> = {};
      const noPosition: Array<{ playerId: string; rating: number }> = [];

      for (const player of playerData) {
        if (player.position) {
          if (!byPosition[player.position]) {
            byPosition[player.position] = [];
          }
          byPosition[player.position].push({
            playerId: player.playerId,
            rating: player.rating,
          });
        } else {
          noPosition.push({
            playerId: player.playerId,
            rating: player.rating,
          });
        }
      }

      // Sort each position by rating
      for (const position in byPosition) {
        byPosition[position].sort((a, b) => b.rating - a.rating);
      }
      noPosition.sort((a, b) => b.rating - a.rating);

      // Distribute positions evenly using serpentine draft
      const team1: Array<{ playerId: string; position?: string }> = [];
      const team2: Array<{ playerId: string; position?: string }> = [];

      // First, distribute players with positions
      for (const position in byPosition) {
        const players = byPosition[position];
        let team1Turn = true;

        for (const player of players) {
          if (team1.length >= playersPerTeam && team2.length >= playersPerTeam) break;

          if (team1Turn && team1.length < playersPerTeam) {
            team1.push({ playerId: player.playerId, position });
          } else if (!team1Turn && team2.length < playersPerTeam) {
            team2.push({ playerId: player.playerId, position });
          }

          team1Turn = !team1Turn;
        }
      }

      // Then, fill remaining slots with players without positions
      let team1Turn = team1.length < team2.length;
      for (const player of noPosition) {
        if (team1.length >= playersPerTeam && team2.length >= playersPerTeam) break;

        if (team1Turn && team1.length < playersPerTeam) {
          team1.push({ playerId: player.playerId });
        } else if (!team1Turn && team2.length < playersPerTeam) {
          team2.push({ playerId: player.playerId });
        }

        team1Turn = !team1Turn;
      }

      ApiLogger.log('MatchService', 'buildTeamsByPosition', {
        team1Positions: team1.reduce((acc, p) => {
          acc[p.position || 'none'] = (acc[p.position || 'none'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        team2Positions: team2.reduce((acc, p) => {
          acc[p.position || 'none'] = (acc[p.position || 'none'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      });

      return { team1, team2 };
    } catch (error: any) {
      ApiLogger.error('MatchService', 'buildTeamsByPosition', error);
      // Fallback to rating-based
      return this.buildTeamsByRating(playerIds, playersPerTeam, match);
    }
  }

  // ============================================
  // 11. HELPER METHODS
  // ============================================

  /**
   * Get player names in bulk
   */
  private static async getPlayerNames(playerIds: string[]): Promise<Record<string, string>> {
    const names: Record<string, string> = {};

    for (const playerId of playerIds) {
      const playerResult = await playerAPI.getById(playerId);
      if (playerResult.success && playerResult.data) {
        names[playerId] = `${playerResult.data.name} ${playerResult.data.surname}`;
      }
    }

    return names;
  }

  /**
   * Check if match can be started (scheduled time validation)
   */
  static async canStartMatch(matchId: string): Promise<ApiResponse<{
    can: boolean;
    reason?: string;
  }>> {
    try {
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check status
      if (match.status !== MatchStatus.TEAMS_SET) {
        return {
          success: true,
          data: {
            can: false,
            reason: `Geçersiz durum: ${match.status}`,
          },
        };
      }

      // Check if match time has arrived (allow 30 minutes early start)
      const now = new Date();
      const matchStart = new Date(match.schedule.matchStart);
      const thirtyMinutesEarly = new Date(matchStart.getTime() - 30 * 60 * 1000);

      if (now < thirtyMinutesEarly) {
        const minutesUntilStart = Math.floor((matchStart.getTime() - now.getTime()) / (1000 * 60));
        return {
          success: true,
          data: {
            can: false,
            reason: `Maç henüz başlamadı. ${minutesUntilStart} dakika kaldı.`,
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
          code: 'CHECK_START_ERROR',
          message: error.message || 'Kontrol sırasında hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get match summary for display
   */
  static async getMatchSummary(matchId: string): Promise<ApiResponse<{
    match: IMatch;
    playerCount: number;
    paymentsCompleted: number;
    ratingsCompleted: number;
    canStart: boolean;
    canComplete: boolean;
  }>> {
    try {
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Calculate summary
      const playerCount = this.calculateTotalPlayers(match);
      const paymentsCompleted = match.payments.filter(p => p.paid).length;

      // Get ratings count
      const ratingsResult = await matchRatingAPI.getByMatch(matchId);
      const ratingsCompleted = ratingsResult.success && ratingsResult.data
        ? ratingsResult.data.length
        : 0;

      // Check if can start
      const canStartResult = await this.canStartMatch(matchId);
      const canStart = canStartResult.success && canStartResult.data?.can || false;

      // Check if can complete
      const canComplete = match.status === MatchStatus.AWAITING_SCORE && !!match.score;

      return {
        success: true,
        data: {
          match,
          playerCount,
          paymentsCompleted,
          ratingsCompleted,
          canStart,
          canComplete,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Özet alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get match statistics
   */
  static async getMatchStatistics(matchId: string): Promise<ApiResponse<{
    totalPlayers: number;
    team1Score: number;
    team2Score: number;
    topScorer: { playerId: string; goals: number } | null;
    mvp: { playerId: string; rating: number } | null;
    averageRating: number;
    attendanceRate: number;
  }>> {
    try {
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Calculate statistics
      const totalPlayers = match.players.teams
        ? match.players.teams.team1.length + match.players.teams.team2.length
        : 0;

      const team1Score = match.score?.team1 || 0;
      const team2Score = match.score?.team2 || 0;

      // Find top scorer
      let topScorer: { playerId: string; goals: number } | null = null;
      if (match.score?.scorers) {
        const sorted = [...match.score.scorers].sort((a, b) => b.goals - a.goals);
        if (sorted.length > 0) {
          topScorer = {
            playerId: sorted[0].playerId,
            goals: sorted[0].goals,
          };
        }
      }

      // Get MVP rating
      let mvp: { playerId: string; rating: number } | null = null;
      if (match.mvp) {
        const ratingsResult = await matchRatingAPI.getPlayerRatingsInMatch(
          matchId,
          match.mvp.playerId
        );

        if (ratingsResult.success && ratingsResult.data && ratingsResult.data.length > 0) {
          const avgRating = ratingsResult.data.reduce((sum, r) => sum + r.rating, 0) / ratingsResult.data.length;
          mvp = {
            playerId: match.mvp.playerId,
            rating: avgRating,
          };
        }
      }

      // Get average rating
      const ratingsResult = await matchRatingAPI.getByMatch(matchId);
      const averageRating = ratingsResult.success && ratingsResult.data && ratingsResult.data.length > 0
        ? ratingsResult.data.reduce((sum, r) => sum + r.rating, 0) / ratingsResult.data.length
        : 0;

      // Calculate attendance rate
      const invitedCount = this.calculateTotalPlayers(match);
      const playedCount = totalPlayers;
      const attendanceRate = invitedCount > 0 ? (playedCount / invitedCount) * 100 : 0;

      return {
        success: true,
        data: {
          totalPlayers,
          team1Score,
          team2Score,
          topScorer,
          mvp,
          averageRating,
          attendanceRate,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATISTICS_ERROR',
          message: error.message || 'İstatistikler alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
  // src/services/serviceLayer/matchService.ts
// 📄 PAGINATION METHODS

/**
 * Get fixture matches with pagination
 */
static async getFixtureMatchesPaginated(
  fixtureId: string,
  pageSize: number = 20,
  lastDoc?: any
): Promise<ApiResponse<{
  data: IMatch[];
  lastDoc?: any;
  hasMore: boolean;
}>> {
  try {
    const result = await matchAPI.getPaginated(
      {
        where: [{ field: 'fixtureId', operator: '==', value: fixtureId }],
        orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
      },
      {
        pageSize,
        lastDoc,
      }
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || {
          code: 'GET_MATCHES_ERROR',
          message: 'Maçlar alınamadı',
          statusCode: 500
        }
      };
    }

    return {
      success: true,
      data: {
        data: result.data.data,
        lastDoc: result.data.lastDoc,
        hasMore: result.data.hasMore,
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'GET_FIXTURE_MATCHES_ERROR',
        message: error.message || 'Fikstür maçları alınamadı',
        details: error,
        statusCode: 500
      }
    };
  }
}

/**
 * Get league matches with pagination
 */
static async getLeagueMatchesPaginated(
  leagueId: string,
  pageSize: number = 20,
  lastDoc?: any
): Promise<ApiResponse<{
  data: IMatch[];
  lastDoc?: any;
  hasMore: boolean;
}>> {
  try {
    const result = await matchAPI.getPaginated(
      {
        where: [{ field: 'leagueId', operator: '==', value: leagueId }],
        orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
      },
      {
        pageSize,
        lastDoc,
      }
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || {
          code: 'GET_MATCHES_ERROR',
          message: 'Maçlar alınamadı',
          statusCode: 500
        }
      };
    }

    return {
      success: true,
      data: {
        data: result.data.data,
        lastDoc: result.data.lastDoc,
        hasMore: result.data.hasMore,
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'GET_LEAGUE_MATCHES_ERROR',
        message: error.message || 'Lig maçları alınamadı',
        details: error,
        statusCode: 500
      }
    };
  }
}

/**
 * Get player upcoming matches with pagination
 */
static async getPlayerUpcomingMatchesPaginated(
  playerId: string,
  pageSize: number = 20,
  lastDoc?: any
): Promise<ApiResponse<{
  data: IMatch[];
  lastDoc?: any;
  hasMore: boolean;
}>> {
  try {
    const now = new Date().toISOString();

    // Get paginated upcoming matches
    const result = await matchAPI.getPaginated(
      {
        where: [
          { field: 'schedule.matchStart', operator: '>', value: now },
        ],
        orderBy: [{ field: 'schedule.matchStart', direction: 'asc' }],
      },
      {
        pageSize: pageSize * 2, // Get more to filter client-side
        lastDoc,
      }
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || {
          code: 'GET_MATCHES_ERROR',
          message: 'Maçlar alınamadı',
          statusCode: 500
        }
      };
    }

    // Filter matches where player is involved (client-side)
    const playerMatches = result.data.data.filter(match => {
      const isInPremium = match.players.premium.inherited?.includes(playerId) ||
        match.players.premium.overrides?.includes(playerId);
      const isInDirect = match.players.direct.inherited?.includes(playerId) ||
        match.players.direct.overrides?.includes(playerId);
      const isGuest = match.players.guests?.includes(playerId);
      const isRegistered = match.players.registered?.some(r => r.playerId === playerId);
      const isReserve = match.players.reserves?.includes(playerId);

      return isInPremium || isInDirect || isGuest || isRegistered || isReserve;
    });

    return {
      success: true,
      data: {
        data: playerMatches.slice(0, pageSize),
        lastDoc: result.data.lastDoc,
        hasMore: result.data.hasMore || playerMatches.length > pageSize,
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'GET_PLAYER_MATCHES_ERROR',
        message: error.message || 'Oyuncu maçları alınamadı',
        details: error,
        statusCode: 500
      }
    };
  }
}

/**
 * Get player match history with pagination
 */
static async getPlayerMatchHistoryPaginated(
  playerId: string,
  pageSize: number = 20,
  lastDoc?: any
): Promise<ApiResponse<{
  data: IMatch[];
  lastDoc?: any;
  hasMore: boolean;
}>> {
  try {
    const now = new Date().toISOString();

    // Get paginated past matches
    const result = await matchAPI.getPaginated(
      {
        where: [
          { field: 'schedule.matchStart', operator: '<=', value: now },
        ],
        orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
      },
      {
        pageSize: pageSize * 2, // Get more to filter client-side
        lastDoc,
      }
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || {
          code: 'GET_MATCHES_ERROR',
          message: 'Maçlar alınamadı',
          statusCode: 500
        }
      };
    }

    // Filter matches where player is involved (client-side)
    const playerMatches = result.data.data.filter(match => {
      const isInPremium = match.players.premium.inherited?.includes(playerId) ||
        match.players.premium.overrides?.includes(playerId);
      const isInDirect = match.players.direct.inherited?.includes(playerId) ||
        match.players.direct.overrides?.includes(playerId);
      const isGuest = match.players.guests?.includes(playerId);
      const isRegistered = match.players.registered?.some(r => r.playerId === playerId);
      const isReserve = match.players.reserves?.includes(playerId);
      const isInTeams = match.players.teams?.team1?.some(p => p.playerId === playerId) ||
        match.players.teams?.team2?.some(p => p.playerId === playerId);

      return isInPremium || isInDirect || isGuest || isRegistered || isReserve || isInTeams;
    });

    return {
      success: true,
      data: {
        data: playerMatches.slice(0, pageSize),
        lastDoc: result.data.lastDoc,
        hasMore: result.data.hasMore || playerMatches.length > pageSize,
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'GET_PLAYER_HISTORY_ERROR',
        message: error.message || 'Oyuncu geçmişi alınamadı',
        details: error,
        statusCode: 500
      }
    };
  }
}

/**
 * Get all player matches (upcoming + history) with pagination
 */
static async getPlayerAllMatchesPaginated(
  playerId: string,
  pageSize: number = 20,
  lastDoc?: any
): Promise<ApiResponse<{
  data: IMatch[];
  lastDoc?: any;
  hasMore: boolean;
}>> {
  try {
    // Get paginated all matches
    const result = await matchAPI.getPaginated(
      {
        orderBy: [{ field: 'schedule.matchStart', direction: 'desc' }],
      },
      {
        pageSize: pageSize * 2, // Get more to filter client-side
        lastDoc,
      }
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || {
          code: 'GET_MATCHES_ERROR',
          message: 'Maçlar alınamadı',
          statusCode: 500
        }
      };
    }

    // Filter matches where player is involved (client-side)
    const playerMatches = result.data.data.filter(match => {
      const isInPremium = match.players.premium.inherited?.includes(playerId) ||
        match.players.premium.overrides?.includes(playerId);
      const isInDirect = match.players.direct.inherited?.includes(playerId) ||
        match.players.direct.overrides?.includes(playerId);
      const isGuest = match.players.guests?.includes(playerId);
      const isRegistered = match.players.registered?.some(r => r.playerId === playerId);
      const isReserve = match.players.reserves?.includes(playerId);
      const isInTeams = match.players.teams?.team1?.some(p => p.playerId === playerId) ||
        match.players.teams?.team2?.some(p => p.playerId === playerId);

      return isInPremium || isInDirect || isGuest || isRegistered || isReserve || isInTeams;
    });

    return {
      success: true,
      data: {
        data: playerMatches.slice(0, pageSize),
        lastDoc: result.data.lastDoc,
        hasMore: result.data.hasMore || playerMatches.length > pageSize,
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'GET_ALL_MATCHES_ERROR',
        message: error.message || 'Tüm maçlar alınamadı',
        details: error,
        statusCode: 500
      }
    };
  }
}

// src/services/serviceLayer/matchService.ts
// ✅ INVITATION CODE METHODS - ADD TO EXISTING FILE

/**
 * Generate unique 6-character invitation code
 */
private static generateInvitationCode(): string {
  // Exclude confusing characters: 0,O,1,I
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if code is unique in database
 */
private static async isCodeUnique(code: string): Promise<boolean> {
  try {
    const result = await matchAPI.getAll({
      where: [
        { field: 'invitationCode.code', operator: '==', value: code },
        { field: 'invitationCode.enabled', operator: '==', value: true }
      ],
      limit: 1
    });
    
    return !result.success || !result.data || result.data.length === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Generate unique invitation code with retry logic
 */
private static async generateUniqueCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = this.generateInvitationCode();
    if (await this.isCodeUnique(code)) {
      return code;
    }
    attempts++;
  }
  
  throw new Error('Benzersiz davet kodu oluşturulamadı');
}

// ============================================
// CREATE FRIENDLY MATCH - UPDATED
// ============================================


// ============================================
// JOIN WITH INVITATION CODE
// ============================================

/**
 * Join match with invitation code
 */
static async joinWithInvitationCode(
  code: string,
  playerId: string
): Promise<ApiResponse<IMatch>> {
  try {
    ApiLogger.log('MatchService', 'joinWithInvitationCode', { code, playerId });

    // 1. Find match by code
    const matchesResult = await matchAPI.getAll({
      where: [
        { field: 'invitationCode.code', operator: '==', value: code.toUpperCase() },
        { field: 'invitationCode.enabled', operator: '==', value: true }
      ],
      limit: 1
    });

    if (!matchesResult.success || !matchesResult.data || matchesResult.data.length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Geçersiz davet kodu',
          statusCode: 404
        }
      };
    }

    const match = matchesResult.data[0];

    // 2. Validate code
    if (match.invitationCode?.expiresAt && 
        new Date(match.invitationCode.expiresAt) < new Date()) {
      return {
        success: false,
        error: {
          code: 'CODE_EXPIRED',
          message: 'Davet kodunun süresi dolmuş',
          statusCode: 400
        }
      };
    }

    if (match.invitationCode?.maxUses && 
        match.invitationCode.currentUses >= match.invitationCode.maxUses) {
      return {
        success: false,
        error: {
          code: 'CODE_LIMIT_REACHED',
          message: 'Davet kodu kullanım limitine ulaşmış',
          statusCode: 400
        }
      };
    }

    // 3. Check if player already registered
    const isRegistered = match.players.registered?.some(r => r.playerId === playerId);
    if (isRegistered) {
      // Return success but with the match data
      return {
        success: true,
        data: match,
      };
    }

    // 4. Check if match is full
    const totalPlayers = match.squad.totalPlayers;
    const currentCount = (match.players.registered?.length || 0) + 
                        (match.players.guests?.length || 0);
    
    if (currentCount >= totalPlayers) {
      return {
        success: false,
        error: {
          code: 'MATCH_FULL',
          message: 'Maç kadrosu dolu',
          statusCode: 400
        }
      };
    }

    // 5. Register player
    const registerResult = await this.registerPlayer(match.id!, playerId);
    
    if (!registerResult.success) {
      return registerResult;
    }

    // 6. Increment code usage
    await matchAPI.update(match.id!, {
      'invitationCode.currentUses': (match.invitationCode?.currentUses || 0) + 1
    } as any);

    ApiLogger.success('MatchService', 'joinWithInvitationCode', { 
      code, 
      playerId, 
      matchId: match.id 
    });

    return registerResult;

  } catch (error: any) {
    ApiLogger.error('MatchService', 'joinWithInvitationCode', error);
    return {
      success: false,
      error: {
        code: 'JOIN_ERROR',
        message: error.message || 'Maça katılma başarısız',
        details: error,
        statusCode: 500
      }
    };
  }
}

// ============================================
// REGENERATE INVITATION CODE
// ============================================

/**
 * Regenerate invitation code (organizer only)
 */
static async regenerateInvitationCode(
  matchId: string,
  organizerId: string
): Promise<ApiResponse<{ code: string }>> {
  try {
    ApiLogger.log('MatchService', 'regenerateInvitationCode', { matchId, organizerId });

    // Check permissions
    const matchResult = await matchAPI.getById(matchId);
    if (!matchResult.success || !matchResult.data) {
      return {
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Maç bulunamadı',
          statusCode: 404
        }
      };
    }

    const match = matchResult.data;
    if (!match.permissions.organizers.includes(organizerId)) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sadece organizatör kodu yenileyebilir',
          statusCode: 403
        }
      };
    }

    // Generate new code
    const newCode = await this.generateUniqueCode();

    // Update match
    await matchAPI.update(matchId, {
      invitationCode: {
        ...match.invitationCode!,
        code: newCode,
        currentUses: 0, // Reset usage
        createdAt: new Date(),
      }
    } as any);

    ApiLogger.success('MatchService', 'regenerateInvitationCode', { 
      matchId, 
      newCode 
    });

    return {
      success: true,
      data: { code: newCode }
    };

  } catch (error: any) {
    ApiLogger.error('MatchService', 'regenerateInvitationCode', error);
    return {
      success: false,
      error: {
        code: 'REGENERATE_CODE_ERROR',
        message: error.message || 'Kod yenilenemedi',
        statusCode: 500
      }
    };
  }
}

// ============================================
// TOGGLE INVITATION CODE
// ============================================

/**
 * Enable/Disable invitation code
 */
static async toggleInvitationCode(
  matchId: string,
  organizerId: string,
  enabled: boolean
): Promise<ApiResponse<void>> {
  try {
    ApiLogger.log('MatchService', 'toggleInvitationCode', { 
      matchId, 
      organizerId, 
      enabled 
    });

    const matchResult = await matchAPI.getById(matchId);
    if (!matchResult.success || !matchResult.data) {
      return {
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Maç bulunamadı',
          statusCode: 404
        }
      };
    }

    const match = matchResult.data;
    if (!match.permissions.organizers.includes(organizerId)) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sadece organizatör kodu değiştirebilir',
          statusCode: 403
        }
      };
    }

    await matchAPI.update(matchId, {
      'invitationCode.enabled': enabled
    } as any);

    ApiLogger.success('MatchService', 'toggleInvitationCode', { 
      matchId, 
      enabled 
    });

    return { success: true };

  } catch (error: any) {
    ApiLogger.error('MatchService', 'toggleInvitationCode', error);
    return {
      success: false,
      error: {
        code: 'TOGGLE_CODE_ERROR',
        message: error.message || 'Kod durumu değiştirilemedi',
        statusCode: 500
      }
    };
  }
}

// ============================================
// GET INVITATION CODE INFO
// ============================================

/**
 * Get invitation code info (for display)
 */
static async getInvitationCodeInfo(
  matchId: string
): Promise<ApiResponse<{
  code: string;
  enabled: boolean;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  remainingUses: number;
  isExpired: boolean;
  isLimitReached: boolean;
}>> {
  try {
    const matchResult = await matchAPI.getById(matchId);
    if (!matchResult.success || !matchResult.data) {
      return {
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Maç bulunamadı',
          statusCode: 404
        }
      };
    }

    const match = matchResult.data;
    const invCode = match.invitationCode;

    if (!invCode) {
      return {
        success: false,
        error: {
          code: 'NO_CODE',
          message: 'Bu maçın davet kodu yok',
          statusCode: 404
        }
      };
    }

    const isExpired = invCode.expiresAt 
      ? new Date(invCode.expiresAt) < new Date()
      : false;

    const remainingUses = invCode.maxUses 
      ? Math.max(0, invCode.maxUses - invCode.currentUses)
      : Infinity;

    const isLimitReached = invCode.maxUses 
      ? invCode.currentUses >= invCode.maxUses
      : false;

    return {
      success: true,
      data: {
        code: invCode.code,
        enabled: invCode.enabled,
        expiresAt: invCode.expiresAt,
        maxUses: invCode.maxUses,
        currentUses: invCode.currentUses,
        remainingUses,
        isExpired,
        isLimitReached,
      }
    };

  } catch (error: any) {
    ApiLogger.error('MatchService', 'getInvitationCodeInfo', error);
    return {
      success: false,
      error: {
        code: 'GET_CODE_INFO_ERROR',
        message: error.message || 'Kod bilgisi alınamadı',
        statusCode: 500
      }
    };
  }
}

/*
USAGE EXAMPLES:

// ✅ Create match with invitation code
const result = await MatchService.createFriendlyMatch({
  organizerId: user.id,
  sportType: 'Futbol',
  title: 'Cumartesi Maçı',
  matchStartTime: new Date(),
  location: 'Ankara Halısaha',
  staffPlayerCount: 10,
  reservePlayerCount: 2,
  isPublic: false, // Özel maç
  affectsStats: true,
  affectsStandings: false,
  pricePerPlayer: 50,
  
  // Kod ayarları
  enableInvitationCode: true,
  invitationCodeExpiry: 48, // 48 saat
  invitationCodeMaxUses: 10,
});

// Kod: result.data.invitationCode.code

// ✅ Join with code
const joinResult = await MatchService.joinWithInvitationCode(
  'ABC123',
  playerId
);

// ✅ Regenerate code
const newCode = await MatchService.regenerateInvitationCode(
  matchId,
  organizerId
);

// ✅ Disable code
await MatchService.toggleInvitationCode(matchId, organizerId, false);

// ✅ Get code info
const codeInfo = await MatchService.getInvitationCodeInfo(matchId);
console.log(`Kod: ${codeInfo.data.code}`);
console.log(`Kullanım: ${codeInfo.data.currentUses}/${codeInfo.data.maxUses}`);
console.log(`Kalan: ${codeInfo.data.remainingUses}`);
*/
}

export default MatchService;