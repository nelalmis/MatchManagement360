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
  IPlayer
} from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

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

      const registrationStart = new Date(matchStart);
      const [regHours, regMinutes] = fixture.schedule.registrationStartTime.split(':');
      registrationStart.setHours(parseInt(regHours), parseInt(regMinutes), 0, 0);

      const registrationEnd = new Date(matchStart);
      registrationEnd.setMinutes(registrationEnd.getMinutes() - 30);

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
   * Create Friendly Match (standalone)
   */
  static async createFriendlyMatch(data: {
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
      invitedPlayerIds?: string[];
      affectsStats?: boolean;
      affectsStandings?: boolean;
    };
  }): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'createFriendlyMatch', {
        organizerId: data.organizerId,
        title: data.title
      });

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

      // Calculate times
      const matchStart = new Date(data.matchDate);
      const matchEnd = new Date(matchStart);
      matchEnd.setMinutes(matchEnd.getMinutes() + data.matchDuration);

      const registrationStart = new Date(matchStart);
      registrationStart.setHours(registrationStart.getHours() - 24);

      const registrationEnd = new Date(matchStart);
      registrationEnd.setMinutes(registrationEnd.getMinutes() - 30);

      // Create match data
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
        squad: data.squad,
        players: {
          premium: {
            mode: 'custom',
            inherited: [],
            overrides: [],
          },
          direct: {
            mode: 'custom',
            inherited: [],
            overrides: [data.organizerId],
          },
          guests: [],
          registered: [],
          reserves: [],
        },
        permissions: {
          organizers: [data.organizerId],
          teamBuilders: [data.organizerId],
        },
        venue: data.venue,
        payments: [],
        status: MatchStatus.CREATED,
        friendlySettings: {
          isPublic: data.friendlySettings?.isPublic ?? true,
          invitedPlayerIds: data.friendlySettings?.invitedPlayerIds || [],
          affectsStats: data.friendlySettings?.affectsStats ?? true,
          affectsStandings: data.friendlySettings?.affectsStandings ?? false,
        },
        createdAt: new Date().toISOString(),
      };

      // Create match
      const result = await matchAPI.create(matchData);

      if (result.success && result.data) {
        // Auto-open registration
        await this.openRegistration(result.data.id!);

        // Send invitations if any
        if (data.friendlySettings?.invitedPlayerIds && data.friendlySettings.invitedPlayerIds.length > 0) {
          await this.sendMatchInvitations(
            result.data.id!,
            data.organizerId,
            data.friendlySettings.invitedPlayerIds
          );
        }

        ApiLogger.success('MatchService', 'createFriendlyMatch', {
          matchId: result.data.id
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'createFriendlyMatch', error);
      return {
        success: false,
        error: {
          code: 'CREATE_FRIENDLY_ERROR',
          message: error.message || 'Friendly maç oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
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
      if (now > match.schedule.registrationEnd) {
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

        if (eligiblePlayers.length < match.squad.minPlayersToStart) {
          return {
            success: false,
            error: {
              code: 'INSUFFICIENT_PLAYERS',
              message: `Yetersiz oyuncu: ${eligiblePlayers.length}/${match.squad.minPlayersToStart}`,
              statusCode: 400,
            },
          };
        }

        // Build teams based on algorithm
        teams = await this.executeTeamBuildingAlgorithm(
          eligiblePlayers,
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
   * Unregister player from match
   */
  static async unregisterPlayer(matchId: string, playerId: string): Promise<ApiResponse<IMatch>> {
    try {
      ApiLogger.log('MatchService', 'unregisterPlayer', { matchId, playerId });

      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return matchResult;
      }

      const match = matchResult.data;

      // Can only unregister if registration is open
      if (match.status !== MatchStatus.REGISTRATION_OPEN) {
        return {
          success: false,
          error: {
            code: 'REGISTRATION_CLOSED',
            message: 'Kayıtlar kapandı, kayıt iptal edilemez',
            statusCode: 400,
          },
        };
      }

      const result = await matchAPI.unregisterPlayer(matchId, playerId);

      if (result.success) {
        // Send unregistration confirmation
        await notificationAPI.createNotification({
          userId: playerId,
          type: 'team_assignment',
          title: 'Kayıt İptal Edildi',
          message: `${match.title} maçından kaydınız iptal edildi.`,
          relatedId: matchId,
          relatedType: 'match',
        });

        ApiLogger.success('MatchService', 'unregisterPlayer', { matchId, playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchService', 'unregisterPlayer', error);
      return {
        success: false,
        error: {
          code: 'UNREGISTER_PLAYER_ERROR',
          message: error.message || 'Kayıt iptal edilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
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
  private static getEligiblePlayers(match: IMatch): string[] {
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
    return uniquePlayers.slice(0, match.squad.totalPlayers);
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
}

export default MatchService;