// scripts/seedDataFull.ts
// ============================================
// COMPREHENSIVE SEED DATA GENERATOR
// Based on EXACT type definitions provided
// ============================================

import { 
  IPlayer,
  ILeague,
  ILeagueSettings,
  ILeagueInvitation,
  ILeagueInvitationUse,
  ISeason,
  IFixture,
  IMatch,
  IStandings,
  IPlayerStats,
  IMatchRating,
  IMatchComment,
  IMatchInvitation,
  SportType,
  MatchType,
  MatchStatus,
  SeasonStatus,
  SPORT_CONFIGS,
  PlayerListConfig,
} from '../types/entity/types';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  PLAYERS_COUNT: 50,
  LEAGUES_COUNT: 5,
  SEASONS_PER_LEAGUE: 3,
  FIXTURES_PER_LEAGUE: 4,
  MATCHES_PER_FIXTURE: 8,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomElements = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
};

const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const randomBoolean = (): boolean => {
  return Math.random() > 0.5;
};

// ============================================
// NAME DATA
// ============================================

const TURKISH_FIRST_NAMES = [
  'Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'Emre',
  'Burak', 'Can', 'Cem', 'Deniz', 'Ege', 'Eren', 'Kaan', 'Mert', 'Oğuz', 'Serkan',
  'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Defne', 'Ece', 'Gökhan',
  'Volkan', 'Onur', 'Barış', 'Tolga', 'Furkan', 'Kerem', 'Berkay', 'Yunus'
];

const TURKISH_LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Öztürk', 'Aydın', 'Yıldız',
  'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Polat', 'Koç', 'Kurt', 'Özdemir',
  'Şimşek', 'Aksoy', 'Erdoğan', 'Güler', 'Yavuz', 'Korkmaz', 'Taş', 'Başar',
  'Tuncer', 'Güven', 'Akbaba', 'Çakır', 'Toprak', 'Bulut', 'Deniz', 'Tekin'
];

const VENUE_NAMES = [
  'Merkez Halı Saha',
  'Şişli Spor Salonu',
  'Kadıköy Arena',
  'Beşiktaş Basketbol Sahası',
  'Ataşehir Voleybol Salonu',
  'Maltepe Tenis Kortları',
  'Kartal Spor Kompleksi',
  'Üsküdar Halı Saha'
];

// ============================================
// 1. GENERATE PLAYERS (IPlayer)
// ============================================

export const generatePlayers = (count: number): IPlayer[] => {
  const players: IPlayer[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < count; i++) {
    const name = randomElement(TURKISH_FIRST_NAMES);
    const surname = randomElement(TURKISH_LAST_NAMES);
    const displayName = `${name} ${surname}`;
    
    let email: string;
    do {
      const emailPrefix = `${name.toLowerCase()}.${surname.toLowerCase()}${randomInt(1, 999)}`;
      email = `${emailPrefix}@example.com`;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const birthYear = randomInt(1985, 2005);
    const birthDate = `${birthYear}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`;

    const favoriteSports = randomElements(
      Object.keys(SPORT_CONFIGS) as SportType[],
      randomInt(1, 3)
    );

    const sportPositions: Partial<Record<SportType, string[]>> = {};
    favoriteSports.forEach(sport => {
      const positions = SPORT_CONFIGS[sport].positions;
      if (positions.length > 0) {
        sportPositions[sport] = randomElements(positions, randomInt(1, 2));
      }
    });

    const player: IPlayer = {
      id: generateId('player'),
      name,
      surname,
      displayName,
      email,
      emailVerified: randomBoolean(),
      authProviders: ['email'],
      phone: randomBoolean() ? `+905${randomInt(300000000, 599999999)}` : undefined,
      phoneVerified: randomBoolean(),
      jerseyNumber: randomBoolean() ? String(randomInt(1, 99)) : undefined,
      birthDate,
      profilePhoto: randomBoolean() ? `https://i.pravatar.cc/150?u=${email}` : undefined,
      favoriteSports,
      sportPositions,
      language: 'tr',
      timezone: 'Europe/Istanbul',
      twoFactorEnabled: randomBoolean(),
      lastLogin: randomBoolean() ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()) : undefined,
      createdAt: randomDate(new Date('2023-01-01'), new Date('2024-01-01')).toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      isBanned: false,
    };

    players.push(player);
  }

  return players;
};

// ============================================
// 2. GENERATE LEAGUES (ILeague)
// ============================================

export const generateLeagues = (
  count: number,
  players: IPlayer[]
): ILeague[] => {
  const leagues: ILeague[] = [];
  const sportTypes = Object.keys(SPORT_CONFIGS) as SportType[];

  for (let i = 0; i < count; i++) {
    const sportType = sportTypes[i % sportTypes.length];
    
    const memberCount = randomInt(15, 30);
    const leagueMembers = randomElements(players, memberCount);
    const memberIds = leagueMembers.map(p => p.id);
    
    const adminCount = randomInt(1, 3);
    const adminIds = randomElements(memberIds, adminCount);
    
    const premiumCount = randomInt(3, 6);
    const premiumIds = randomElements(
      memberIds.filter(id => !adminIds.includes(id)),
      premiumCount
    );
    
    const directCount = randomInt(4, 8);
    const directIds = randomElements(
      memberIds.filter(id => !adminIds.includes(id) && !premiumIds.includes(id)),
      directCount
    );

    const createdBy = randomElement(adminIds);

    const league: ILeague = {
      id: generateId('league'),
      title: `${SPORT_CONFIGS[sportType].name} Ligi ${i + 1}`,
      sportType,
      description: `${SPORT_CONFIGS[sportType].name} severler için organize edilmiş profesyonel lig`,
      logo: undefined,
      currentSeasonId: undefined,
      seasonSettings: {
        autoCreateNewSeason: true,
        seasonDuration: 180,
        autoArchiveOldSeasons: true,
        archiveAfterMonths: 12,
      },
      members: {
        all: memberIds,
        admins: adminIds,
      },
      defaultPlayers: {
        premium: premiumIds,
        direct: directIds,
      },
      settings: {
        allowFriendlyMatches: randomBoolean(),
        friendlyAffectsStats: randomBoolean(),
        friendlyAffectsStandings: false,
      },
      totalSeasons: 0,
      totalMatches: 0,
      totalMembers: memberIds.length,
      createdBy,
      createdAt: randomDate(new Date('2023-01-01'), new Date('2023-06-01')).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leagues.push(league);
  }

  return leagues;
};

// ============================================
// 3. GENERATE LEAGUE SETTINGS (ILeagueSettings)
// ============================================

export const generateLeagueSettings = (league: ILeague): ILeagueSettings => {
  return {
    id: league.id,
    leagueId: league.id,
    rules: {
      lateArrivalPenalty: randomInt(10, 50),
      absentWithoutNoticePenalty: randomInt(50, 100),
      yellowCardFine: randomInt(20, 50),
      redCardFine: randomInt(100, 200),
      minAttendanceRate: randomInt(60, 80),
    },
    matchRules: {
      allowGuestPlayers: randomBoolean(),
      maxGuestPlayersPerMatch: randomInt(2, 5),
      guestPlayerPriceMultiplier: 1.5,
      autoAssignTeams: randomBoolean(),
      teamBalanceAlgorithm: randomElement(['random', 'rating', 'position'] as const),
    },
    registration: {
      allowLateRegistration: randomBoolean(),
      lateRegistrationDeadlineHours: randomInt(2, 24),
      requirePaymentForRegistration: randomBoolean(),
      autoConfirmPayment: randomBoolean(),
      cancellationDeadlineHours: randomInt(24, 72),
    },
    scoring: {
      requireScoreConfirmation: true,
      scoreConfirmationTimeoutHours: 48,
      allowPlayerSelfReporting: randomBoolean(),
    },
    rating: {
      enabled: true,
      mandatory: randomBoolean(),
      anonymous: randomBoolean(),
      ratingDeadlineHours: 72,
      minRatingsForMVP: randomInt(3, 5),
      allowCategoryRating: true,
    },
    comments: {
      enabled: true,
      requireApproval: randomBoolean(),
      allowLikes: true,
      maxLength: 500,
    },
    payment: {
      defaultIban: `TR${randomInt(10, 99)} ${randomInt(10000, 99999)} ${randomInt(10000, 99999)} ${randomInt(10000, 99999)} ${randomInt(10000, 99999)}`,
      defaultAccountName: `${randomElement(TURKISH_FIRST_NAMES)} ${randomElement(TURKISH_LAST_NAMES)}`,
      defaultPricePerPlayer: randomInt(50, 150),
      currency: 'TRY',
      allowInstallment: false,
      paymentMethods: ['cash', 'bank_transfer'],
    },
    integrations: {
      googleCalendar: randomBoolean(),
      googleSheets: randomBoolean(),
      whatsapp: randomBoolean(),
      slack: false,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: league.createdBy,
  };
};

// ============================================
// 4. GENERATE LEAGUE INVITATIONS (ILeagueInvitation)
// ============================================

export const generateLeagueInvitations = (
  league: ILeague,
  count: number = 3
): ILeagueInvitation[] => {
  const invitations: ILeagueInvitation[] = [];

  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const createdBy = randomElement(league.members.admins);
    const expiresAt = randomBoolean() 
      ? new Date(Date.now() + randomInt(7, 30) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const invitation: ILeagueInvitation = {
      id: generateId('invitation'),
      leagueId: league.id,
      code,
      inviteLink: `app://join-league/${code}`,
      createdBy,
      createdAt: new Date().toISOString(),
      expiresAt,
      maxUses: randomBoolean() ? randomInt(5, 20) : undefined,
      usedCount: randomInt(0, 3),
      isActive: true,
      metadata: {
        description: randomElement(['Sezon başı davet', 'Genel davet', 'Özel turnuva']),
        tags: randomElements(['season-1', 'premium', 'trial', 'special'], randomInt(1, 2)),
        assignRole: randomElement(['member', 'premium', 'direct'] as const),
      },
      stats: {
        totalViews: randomInt(10, 100),
        totalAttempts: randomInt(5, 50),
        successfulJoins: randomInt(1, 10),
        lastUsedAt: randomBoolean() ? new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString() : undefined,
      },
      updatedAt: new Date().toISOString(),
    };

    invitations.push(invitation);
  }

  return invitations;
};

// ============================================
// 5. GENERATE SEASONS (ISeason)
// ============================================

export const generateSeasons = (
  league: ILeague,
  count: number
): ISeason[] => {
  const seasons: ISeason[] = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < count; i++) {
    const year = currentYear - (count - i - 1);
    const seasonNumber = i + 1;
    
    const startDate = new Date(`${year}-01-15`);
    const endDate = new Date(`${year}-12-15`);
    
    let status: SeasonStatus;
    if (i === count - 1) {
      status = SeasonStatus.ACTIVE;
    } else if (i === count - 2) {
      status = SeasonStatus.COMPLETED;
    } else {
      status = SeasonStatus.ARCHIVED;
    }

    const season: ISeason = {
      id: generateId('season'),
      leagueId: league.id,
      name: `${year} Sezonu`,
      seasonNumber,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status,
      settings: {
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
      },
      summary: (status === SeasonStatus.COMPLETED || status === SeasonStatus.ARCHIVED) ? {
        totalMatches: randomInt(20, 40),
        totalGoals: randomInt(100, 300),
        topScorer: {
          playerId: randomElement(league.members.all),
          playerName: `${randomElement(TURKISH_FIRST_NAMES)} ${randomElement(TURKISH_LAST_NAMES)}`,
          goals: randomInt(15, 30),
        },
        mvp: {
          playerId: randomElement(league.members.all),
          playerName: `${randomElement(TURKISH_FIRST_NAMES)} ${randomElement(TURKISH_LAST_NAMES)}`,
          rating: randomFloat(4.5, 5.0),
          mvpCount: randomInt(5, 15),
        },
      } : undefined,
      standingsId: (status === SeasonStatus.COMPLETED || status === SeasonStatus.ARCHIVED) ? generateId('standings') : undefined,
      createdAt: startDate.toISOString(),
      completedAt: status === SeasonStatus.COMPLETED || status === SeasonStatus.ARCHIVED 
        ? endDate.toISOString() 
        : undefined,
      archivedAt: status === SeasonStatus.ARCHIVED 
        ? new Date(endDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      updatedAt: new Date().toISOString(),
    };

    seasons.push(season);
  }

  return seasons;
};

// ============================================
// 6. GENERATE FIXTURES (IFixture)
// ============================================

export const generateFixtures = (
  league: ILeague,
  leagueSettings: ILeagueSettings,
  count: number
): IFixture[] => {
  const fixtures: IFixture[] = [];
  const config = SPORT_CONFIGS[league.sportType];

  for (let i = 0; i < count; i++) {
    const dayOfWeek = randomInt(0, 6);
    const venue = randomElement(VENUE_NAMES);

    const premiumConfig: PlayerListConfig = {
      mode: 'auto',
      inherited: league.defaultPlayers.premium,
    };

    const directConfig: PlayerListConfig = {
      mode: 'auto',
      inherited: league.defaultPlayers.direct,
    };

    const fixture: IFixture = {
      id: generateId('fixture'),
      leagueId: league.id,
      title: `Hafta ${i + 1}`,
      description: `${league.title} - ${i + 1}. hafta maçları`,
      schedule: {
        registrationStartTime: '17:00',
        matchStartTime: '19:00',
        matchDuration: config.defaultDuration,
        isRecurring: true,
        pattern: {
          type: 'weekly',
          dayOfWeek,
        },
      },
      squad: {
        totalPlayers: config.defaultPlayers,
        reservePlayers: randomInt(2, 4),
        minPlayersToStart: Math.floor(config.defaultPlayers * 0.8),
      },
      venue: {
        location: `${venue}, İstanbul`,
        pricePerPlayer: leagueSettings.payment.defaultPricePerPlayer,
        payment: {
          iban: leagueSettings.payment.defaultIban!,
          accountName: leagueSettings.payment.defaultAccountName!,
        },
      },
      players: {
        premium: premiumConfig,
        direct: directConfig,
      },
      permissions: {
        organizers: randomElements(league.members.admins, randomInt(1, 2)),
        teamBuilders: randomElements(league.members.admins, randomInt(1, 3)),
      },
      totalMatches: 0,
      nextMatchDate: i === 0 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      status: i === 0 ? 'active' : 'inactive',
      createdAt: new Date(Date.now() - randomInt(30, 90) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fixtures.push(fixture);
  }

  return fixtures;
};

// ============================================
// 7. GENERATE MATCHES (IMatch)
// ============================================

export const generateMatches = (
  league: ILeague,
  season: ISeason,
  fixture: IFixture,
  count: number
): IMatch[] => {
  const matches: IMatch[] = [];
  const baseDate = new Date(fixture.nextMatchDate || Date.now());

  for (let i = 0; i < count; i++) {
    const matchDate = new Date(baseDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const registrationStart = new Date(matchDate.getTime() - 48 * 60 * 60 * 1000);
    const registrationEnd = new Date(matchDate.getTime() - 2 * 60 * 60 * 1000);
    const matchEnd = new Date(matchDate.getTime() + fixture.schedule.matchDuration * 60 * 1000);

    let status: MatchStatus;
    if (matchDate < new Date()) {
      status = randomElement([MatchStatus.COMPLETED, MatchStatus.AWAITING_SCORE]);
    } else {
      status = randomElement([MatchStatus.REGISTRATION_OPEN, MatchStatus.TEAMS_SET]);
    }

    const registeredPlayers = randomElements(
      league.members.all,
      randomInt(fixture.squad.totalPlayers, fixture.squad.totalPlayers + 5)
    ).map(playerId => ({
      playerId,
      registeredAt: randomDate(registrationStart, registrationEnd),
      preferredPosition: randomBoolean() 
        ? randomElement(SPORT_CONFIGS[league.sportType].positions)
        : undefined,
    }));

    const match: IMatch = {
      id: generateId('match'),
      type: MatchType.LEAGUE,
      leagueId: league.id,
      fixtureId: fixture.id,
      seasonId: season.id,
      title: `${fixture.title} - Maç ${i + 1}`,
      sportType: league.sportType,
      description: `${league.title} - ${fixture.title}`,
      schedule: {
        registrationStart,
        registrationEnd,
        matchStart: matchDate,
        matchEnd,
      },
      squad: fixture.squad,
      players: {
        premium: fixture.players.premium,
        direct: fixture.players.direct,
        guests: [],
        registered: registeredPlayers,
        reserves: randomElements(
          league.members.all,
          randomInt(0, fixture.squad.reservePlayers)
        ),
        teams: status === MatchStatus.COMPLETED || status === MatchStatus.TEAMS_SET ? {
          team1: registeredPlayers
            .slice(0, Math.floor(fixture.squad.totalPlayers / 2))
            .map(p => ({ playerId: p.playerId, position: p.preferredPosition })),
          team2: registeredPlayers
            .slice(Math.floor(fixture.squad.totalPlayers / 2), fixture.squad.totalPlayers)
            .map(p => ({ playerId: p.playerId, position: p.preferredPosition })),
        } : undefined,
      },
      permissions: fixture.permissions,
      venue: fixture.venue,
      score: status === MatchStatus.COMPLETED ? {
        team1: randomInt(0, 10),
        team2: randomInt(0, 10),
        scorers: [],
      } : undefined,
      payments: registeredPlayers.map(p => ({
        playerId: p.playerId,
        amount: fixture.venue.pricePerPlayer,
        paid: randomBoolean(),
        paidAt: randomBoolean() ? randomDate(p.registeredAt, matchDate) : undefined,
        confirmedBy: randomBoolean() ? randomElement(fixture.permissions.organizers) : undefined,
      })),
      mvp: status === MatchStatus.COMPLETED ? {
        playerId: randomElement(registeredPlayers).playerId,
        calculatedAt: new Date(matchEnd.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        autoCalculated: true,
      } : undefined,
      status,
      totalComments: status === MatchStatus.COMPLETED ? randomInt(0, 10) : 0,
      totalRatings: status === MatchStatus.COMPLETED ? randomInt(5, 20) : 0,
      ratingSummary: status === MatchStatus.COMPLETED ? {
        enabled: true,
        totalRatings: randomInt(5, 20),
        averageRating: randomFloat(3.5, 4.8),
        participationRate: randomFloat(60, 95),
        lastCalculated: new Date().toISOString(),
      } : undefined,
      createdAt: new Date(registrationStart.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    matches.push(match);
  }

  return matches;
};

// ============================================
// 8. GENERATE STANDINGS (IStandings)
// ============================================

export const generateStandings = (
  league: ILeague,
  season: ISeason,
  matches: IMatch[]
): IStandings => {
  const playerStats = new Map<string, any>();

  // Initialize all league members
  league.members.all.forEach(playerId => {
    playerStats.set(playerId, {
      playerId,
      playerName: `Player ${playerId.slice(-4)}`,
      league: {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        assists: 0,
        points: 0,
      },
      friendly: {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals: 0,
        assists: 0,
      },
      performance: {
        rating: randomFloat(3.5, 4.8),
        totalRatingsReceived: randomInt(10, 50),
        mvpCount: randomInt(0, 5),
        mvpRate: randomFloat(0, 20),
        attendanceRate: randomFloat(70, 95),
        form: ['W', 'W', 'D', 'L', 'W'].join(''),
        ratingTrend: randomElement(['up', 'stable', 'down'] as const),
      },
    });
  });

  // Calculate stats from completed matches
  matches.forEach(match => {
    if (match.status === MatchStatus.COMPLETED && match.score && match.players.teams) {
      const team1Players = match.players.teams.team1.map(p => p.playerId);
      const team2Players = match.players.teams.team2.map(p => p.playerId);
      
      team1Players.forEach(playerId => {
        const stats = playerStats.get(playerId);
        if (stats) {
          stats.league.played++;
          stats.league.goals += randomInt(0, 3);
          stats.league.assists += randomInt(0, 2);
          
          if (match.score!.team1 > match.score!.team2) {
            stats.league.won++;
            stats.league.points += season.settings.pointsForWin;
          } else if (match.score!.team1 === match.score!.team2) {
            stats.league.drawn++;
            stats.league.points += season.settings.pointsForDraw;
          } else {
            stats.league.lost++;
          }
        }
      });

      team2Players.forEach(playerId => {
        const stats = playerStats.get(playerId);
        if (stats) {
          stats.league.played++;
          stats.league.goals += randomInt(0, 3);
          stats.league.assists += randomInt(0, 2);
          
          if (match.score!.team2 > match.score!.team1) {
            stats.league.won++;
            stats.league.points += season.settings.pointsForWin;
          } else if (match.score!.team1 === match.score!.team2) {
            stats.league.drawn++;
            stats.league.points += season.settings.pointsForDraw;
          } else {
            stats.league.lost++;
          }
        }
      });
    }
  });

  // Calculate goal difference
  Array.from(playerStats.values()).forEach(stats => {
    stats.league.goalDifference = stats.league.goals - stats.league.goalsAgainst;
  });

  // Sort by points, then goal difference
  const sortedStandings = Array.from(playerStats.values())
    .filter(s => s.league.played > 0)
    .sort((a, b) => {
      if (b.league.points !== a.league.points) return b.league.points - a.league.points;
      if (b.league.goalDifference !== a.league.goalDifference) 
        return b.league.goalDifference - a.league.goalDifference;
      return b.league.goals - a.league.goals;
    });

  return {
    id: season.standingsId!,
    leagueId: league.id,
    seasonId: season.id,
    standings: sortedStandings,
    lastUpdated: new Date().toISOString(),
  };
};

// ============================================
// 9. GENERATE PLAYER STATS (IPlayerStats)
// ============================================

export const generatePlayerStats = (
  playerId: string,
  league: ILeague,
  season: ISeason,
  matches: IMatch[]
): IPlayerStats => {
  const playerMatches = matches.filter(m => 
    m.status === MatchStatus.COMPLETED &&
    m.players.teams &&
    (m.players.teams.team1.some(p => p.playerId === playerId) ||
     m.players.teams.team2.some(p => p.playerId === playerId))
  );

  const leagueStats = {
    matches: playerMatches.length,
    wins: randomInt(0, Math.floor(playerMatches.length * 0.6)),
    draws: randomInt(0, Math.floor(playerMatches.length * 0.2)),
    losses: 0,
    goals: randomInt(0, playerMatches.length * 2),
    assists: randomInt(0, playerMatches.length),
    points: 0,
    goalsPerMatch: 0,
    assistsPerMatch: 0,
    winRate: 0,
    cleanSheets: randomInt(0, Math.floor(playerMatches.length * 0.3)),
  };

  leagueStats.losses = leagueStats.matches - leagueStats.wins - leagueStats.draws;
  leagueStats.points = leagueStats.wins * season.settings.pointsForWin + 
                       leagueStats.draws * season.settings.pointsForDraw;
  leagueStats.goalsPerMatch = leagueStats.matches > 0 ? leagueStats.goals / leagueStats.matches : 0;
  leagueStats.assistsPerMatch = leagueStats.matches > 0 ? leagueStats.assists / leagueStats.matches : 0;
  leagueStats.winRate = leagueStats.matches > 0 ? (leagueStats.wins / leagueStats.matches) * 100 : 0;

  const friendlyStats = {
    matches: randomInt(0, 10),
    wins: 0,
    draws: 0,
    losses: 0,
    goals: 0,
    assists: 0,
    goalsPerMatch: 0,
    assistsPerMatch: 0,
    winRate: 0,
  };

  friendlyStats.wins = randomInt(0, Math.floor(friendlyStats.matches * 0.5));
  friendlyStats.draws = randomInt(0, Math.floor(friendlyStats.matches * 0.2));
  friendlyStats.losses = friendlyStats.matches - friendlyStats.wins - friendlyStats.draws;
  friendlyStats.goals = randomInt(0, friendlyStats.matches);
  friendlyStats.assists = randomInt(0, friendlyStats.matches);
  friendlyStats.goalsPerMatch = friendlyStats.matches > 0 ? friendlyStats.goals / friendlyStats.matches : 0;
  friendlyStats.assistsPerMatch = friendlyStats.matches > 0 ? friendlyStats.assists / friendlyStats.matches : 0;
  friendlyStats.winRate = friendlyStats.matches > 0 ? (friendlyStats.wins / friendlyStats.matches) * 100 : 0;

  const lastFiveRatings = Array.from({ length: 5 }, () => randomFloat(3.0, 5.0));
  const avgRating = lastFiveRatings.reduce((sum, r) => sum + r, 0) / lastFiveRatings.length;

  return {
    id: generateId('playerStats'),
    playerId,
    leagueId: league.id,
    seasonId: season.id,
    league: leagueStats,
    friendly: friendlyStats,
    total: {
      matches: leagueStats.matches + friendlyStats.matches,
      goals: leagueStats.goals + friendlyStats.goals,
      assists: leagueStats.assists + friendlyStats.assists,
      points: leagueStats.points,
    },
    rating: {
      average: avgRating,
      totalReceived: randomInt(10, 50),
      categories: {
        skill: randomFloat(3.5, 5.0),
        teamwork: randomFloat(3.5, 5.0),
        sportsmanship: randomFloat(3.5, 5.0),
        effort: randomFloat(3.5, 5.0),
      },
      lastFiveRatings,
      trend: randomElement(['improving', 'stable', 'declining'] as const),
      fromTeammates: {
        average: randomFloat(3.5, 5.0),
        count: randomInt(5, 30),
      },
      fromOpponents: {
        average: randomFloat(3.0, 4.5),
        count: randomInt(2, 15),
      },
    },
    mvp: {
      count: randomInt(0, 5),
      rate: 0,
      lastMvpDate: randomBoolean() 
        ? randomDate(new Date(season.startDate), new Date()).toISOString()
        : undefined,
    },
    attendance: {
      invited: randomInt(leagueStats.matches, leagueStats.matches + 5),
      played: leagueStats.matches,
      rate: 0,
    },
    lastUpdated: new Date().toISOString(),
  };
};

// ============================================
// 10. GENERATE MATCH RATINGS (IMatchRating)
// ============================================

export const generateMatchRatings = (
  match: IMatch,
  count: number = 15
): IMatchRating[] => {
  const ratings: IMatchRating[] = [];

  if (match.status !== MatchStatus.COMPLETED || !match.players.teams) {
    return ratings;
  }

  const allPlayers = [
    ...match.players.teams.team1.map(p => p.playerId),
    ...match.players.teams.team2.map(p => p.playerId),
  ];

  for (let i = 0; i < Math.min(count, allPlayers.length * 3); i++) {
    const raterId = randomElement(allPlayers);
    const ratedPlayerId = randomElement(allPlayers.filter(id => id !== raterId));

    const rating: IMatchRating = {
      id: generateId('rating'),
      matchId: match.id,
      matchType: match.type,
      leagueId: match.leagueId,
      seasonId: match.seasonId,
      raterId,
      ratedPlayerId,
      rating: randomFloat(3.0, 5.0),
      categories: {
        skill: randomFloat(3.0, 5.0),
        teamwork: randomFloat(3.0, 5.0),
        sportsmanship: randomFloat(3.5, 5.0),
        effort: randomFloat(3.5, 5.0),
      },
      comment: randomBoolean() ? 'Harika bir performans!' : undefined,
      isAnonymous: randomBoolean(),
      createdAt: new Date(match.schedule.matchEnd.getTime() + randomInt(1, 48) * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ratings.push(rating);
  }

  return ratings;
};

// ============================================
// 11. GENERATE MATCH COMMENTS (IMatchComment)
// ============================================

export const generateMatchComments = (
  match: IMatch,
  count: number = 5
): IMatchComment[] => {
  const comments: IMatchComment[] = [];

  if (match.status !== MatchStatus.COMPLETED) {
    return comments;
  }

  const commentTexts = [
    'Harika bir maçtı!',
    'Takım oyunu çok iyiydi',
    'Skor adil oldu',
    'Güzel goller vardı',
    'Fair play için teşekkürler',
  ];

  for (let i = 0; i < count; i++) {
    const playerId = randomElement(match.players.registered).playerId;
    
    const comment: IMatchComment = {
      id: generateId('comment'),
      matchId: match.id,
      matchType: match.type,
      playerId,
      playerName: `Player ${playerId.slice(-4)}`,
      playerPhoto: randomBoolean() ? `https://i.pravatar.cc/150?u=${playerId}` : undefined,
      comment: randomElement(commentTexts),
      type: randomElement(['general', 'highlight', 'improvement'] as const),
      isApproved: randomBoolean(),
      approvedBy: randomBoolean() ? randomElement(match.permissions.organizers) : undefined,
      approvedAt: randomBoolean() 
        ? new Date(match.schedule.matchEnd.getTime() + randomInt(1, 24) * 60 * 60 * 1000).toISOString()
        : undefined,
      likes: randomElements(
        match.players.registered.map(p => p.playerId),
        randomInt(0, 5)
      ),
      createdAt: new Date(match.schedule.matchEnd.getTime() + randomInt(1, 48) * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    comments.push(comment);
  }

  return comments;
};

// ============================================
// MAIN SEED FUNCTION
// ============================================

export const generateFullSeedData = () => {
  console.log('🌱 Starting comprehensive seed data generation...\n');

  // 1. Players
  console.log(`📝 Generating ${CONFIG.PLAYERS_COUNT} players...`);
  const players = generatePlayers(CONFIG.PLAYERS_COUNT);
  console.log(`✅ Generated ${players.length} players\n`);

  // 2. Leagues
  console.log(`🏆 Generating ${CONFIG.LEAGUES_COUNT} leagues...`);
  const leagues = generateLeagues(CONFIG.LEAGUES_COUNT, players);
  console.log(`✅ Generated ${leagues.length} leagues\n`);

  // 3. League Settings
  console.log(`⚙️ Generating league settings...`);
  const allLeagueSettings = leagues.map(league => generateLeagueSettings(league));
  console.log(`✅ Generated ${allLeagueSettings.length} league settings\n`);

  // 4. League Invitations
  console.log(`📨 Generating league invitations...`);
  const allInvitations: ILeagueInvitation[] = [];
  leagues.forEach(league => {
    const invitations = generateLeagueInvitations(league, 3);
    allInvitations.push(...invitations);
  });
  console.log(`✅ Generated ${allInvitations.length} league invitations\n`);
 
  // Process each league
  const allSeasons: ISeason[] = [];
  const allFixtures: IFixture[] = [];
  const allMatches: IMatch[] = [];
  const allStandings: IStandings[] = [];
  const allPlayerStats: IPlayerStats[] = [];
  const allRatings: IMatchRating[] = [];
  const allComments: IMatchComment[] = [];

  leagues.forEach((league, leagueIndex) => {
    console.log(`\n📊 Processing ${league.title}...`);

    const leagueSettings = allLeagueSettings[leagueIndex];

    // Seasons
    const seasons = generateSeasons(league, CONFIG.SEASONS_PER_LEAGUE);
    allSeasons.push(...seasons);
    league.currentSeasonId = seasons[seasons.length - 1].id;
    league.totalSeasons = seasons.length;

    seasons.forEach((season, seasonIndex) => {
      console.log(`  Season ${seasonIndex + 1}/${CONFIG.SEASONS_PER_LEAGUE}: ${season.name}`);

      // Fixtures
      const fixtures = generateFixtures(league, leagueSettings, CONFIG.FIXTURES_PER_LEAGUE);
      allFixtures.push(...fixtures);

      let seasonTotalMatches = 0;

      fixtures.forEach(fixture => {
        // Matches
        const matches = generateMatches(league, season, fixture, CONFIG.MATCHES_PER_FIXTURE);
        allMatches.push(...matches);
        fixture.totalMatches = matches.length;
        seasonTotalMatches += matches.length;

        // Ratings & Comments for completed matches
        matches.forEach(match => {
          if (match.status === MatchStatus.COMPLETED) {
            const ratings = generateMatchRatings(match, 15);
            allRatings.push(...ratings);

            const comments = generateMatchComments(match, 5);
            allComments.push(...comments);
          }
        });
      });

      league.totalMatches += seasonTotalMatches;

      // Standings
      if (season.status !== SeasonStatus.UPCOMING) {
        const standings = generateStandings(league, season, allMatches.filter(m => m.seasonId === season.id));
        allStandings.push(standings);
      }

      // Player Stats
      league.members.all.forEach(playerId => {
        const playerStats = generatePlayerStats(
          playerId,
          league,
          season,
          allMatches.filter(m => m.seasonId === season.id)
        );
        allPlayerStats.push(playerStats);
      });
    });

    console.log(`✅ ${league.title}: ${league.totalSeasons} seasons, ${league.totalMatches} matches`);
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE SEED DATA GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`👥 Players:              ${players.length}`);
  console.log(`🏆 Leagues:              ${leagues.length}`);
  console.log(`⚙️  League Settings:      ${allLeagueSettings.length}`);
  console.log(`📨 Invitations:          ${allInvitations.length}`);
  console.log(`📅 Seasons:              ${allSeasons.length}`);
  console.log(`📋 Fixtures:             ${allFixtures.length}`);
  console.log(`⚽ Matches:              ${allMatches.length}`);
  console.log(`📊 Standings:            ${allStandings.length}`);
  console.log(`📈 Player Stats:         ${allPlayerStats.length}`);
  console.log(`⭐ Ratings:              ${allRatings.length}`);
  console.log(`💬 Comments:             ${allComments.length}`);
  console.log('='.repeat(60) + '\n');

  return {
    players,
    leagues,
    leagueSettings: allLeagueSettings,
    invitations: allInvitations,
    seasons: allSeasons,
    fixtures: allFixtures,
    matches: allMatches,
    standings: allStandings,
    playerStats: allPlayerStats,
    ratings: allRatings,
    comments: allComments,
  };
};

// ============================================
// EXPORT TO JSON
// ============================================

export const exportToJSON = (data: ReturnType<typeof generateFullSeedData>) => {
  const fs = require('fs');
  const path = require('path');

  const outputDir = path.join(__dirname, '../seed-output');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  Object.entries(data).forEach(([key, value]) => {
    const filename = path.join(outputDir, `${key}.json`);
    fs.writeFileSync(filename, JSON.stringify(value, null, 2));
    console.log(`✅ Exported ${filename}`);
  });

  console.log(`\n🎉 All data exported to ${outputDir}`);
};

// RUN
if (require.main === module) {
  const seedData = generateFullSeedData();
 // exportToJSON(seedData);
}

export default generateFullSeedData;