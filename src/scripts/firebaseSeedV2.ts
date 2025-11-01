// src/config/firebaseSeed.ts
import {
  collection,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  getFirestore,
} from 'firebase/firestore';
// import { db } from '../config/firebase.config';
import {
  IPlayer,
  ILeague,
  ISeason,
  IFixture,
  IMatch,
  IStandings,
  IPlayerStats,
  IMatchRating,
  IMatchComment,
  IMatchInvitation,
  INotification,
  IActivityLog,
  IAppConfig,
  IUserSettings,
  ILeagueSettings,
  IFAQ,
  IAnnouncement,
  IFeedback,
  IPlayerProfile,
  IPlayerRatingProfile,
  IFriendlyMatchConfig,
  ISystemLog,
  SportType,
  MatchType,
  MatchStatus,
  SeasonStatus,
} from '../types/entity/types';
import { initializeApp } from '@firebase/app';


// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCYGeOzB8nZPnWBLs_lEu1136XTngFe86g",
  authDomain: "matchmanagement360.firebaseapp.com",
  projectId: "matchmanagement360",
  storageBucket: "matchmanagement360.firebasestorage.app",
  messagingSenderId: "1085707335219",
  appId: "1:1085707335219:web:54694271b8969278b95546",
  measurementId: "G-S9MJ2BRXK8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Complete Firebase Seed Data Generator
 * Tüm collection'lar için test verisi
 */
export class FirebaseSeedV2 {
  // ============================================
  // 1. TEST USERS (PLAYERS)
  // ============================================
  static getTestPlayers(): Omit<IPlayer, 'id'>[] {
    return [
      {
        name: 'John',
        surname: 'Doe',
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        emailVerified: true,
        authProviders: ['email'],
        phone: '+905551234567',
        phoneVerified: true,
        jerseyNumber: '10',
        birthDate: '1990-05-15',
        profilePhoto: 'https://i.pravatar.cc/150?img=1',
        favoriteSports: ['Futbol', 'Basketbol'],
        sportPositions: {
          Futbol: ['Orta Saha', 'Forvet'],
          Basketbol: ['Guard'],
        },
        language: 'en',
        timezone: 'Europe/Istanbul',
        twoFactorEnabled: false,
        lastLogin: new Date(),
        createdAt: new Date().toISOString(),
        isActive: true,
        isBanned: false,
      },
      {
        name: 'Jane',
        surname: 'Smith',
        displayName: 'Jane Smith',
        email: 'jane.smith@example.com',
        emailVerified: true,
        authProviders: ['email'],
        phone: '+905559876543',
        phoneVerified: true,
        jerseyNumber: '7',
        birthDate: '1992-08-22',
        profilePhoto: 'https://i.pravatar.cc/150?img=2',
        favoriteSports: ['Futbol', 'Voleybol'],
        sportPositions: {
          Futbol: ['Defans'],
          Voleybol: ['Smaçör'],
        },
        language: 'en',
        timezone: 'Europe/Istanbul',
        twoFactorEnabled: false,
        lastLogin: new Date(),
        createdAt: new Date().toISOString(),
        isActive: true,
        isBanned: false,
      },
      {
        name: 'Michael',
        surname: 'Johnson',
        displayName: 'Michael Johnson',
        email: 'michael.j@example.com',
        emailVerified: true,
        authProviders: ['email', 'google'],
        phone: '+905557778899',
        phoneVerified: true,
        jerseyNumber: '9',
        birthDate: '1988-03-10',
        profilePhoto: 'https://i.pravatar.cc/150?img=3',
        favoriteSports: ['Futbol'],
        sportPositions: {
          Futbol: ['Kaleci'],
        },
        language: 'en',
        timezone: 'Europe/Istanbul',
        twoFactorEnabled: false,
        lastLogin: new Date(),
        createdAt: new Date().toISOString(),
        isActive: true,
        isBanned: false,
      },
      {
        name: 'Sarah',
        surname: 'Williams',
        displayName: 'Sarah Williams',
        email: 'sarah.w@example.com',
        emailVerified: true,
        authProviders: ['email'],
        phone: '+905554445566',
        phoneVerified: false,
        jerseyNumber: '11',
        birthDate: '1995-11-30',
        profilePhoto: 'https://i.pravatar.cc/150?img=4',
        favoriteSports: ['Basketbol', 'Voleybol'],
        sportPositions: {
          Basketbol: ['Forward'],
          Voleybol: ['Libero'],
        },
        language: 'en',
        timezone: 'Europe/Istanbul',
        twoFactorEnabled: false,
        lastLogin: new Date(),
        createdAt: new Date().toISOString(),
        isActive: true,
        isBanned: false,
      },
      {
        name: 'David',
        surname: 'Brown',
        displayName: 'David Brown',
        email: 'david.b@example.com',
        emailVerified: true,
        authProviders: ['email'],
        phone: '+905552223344',
        phoneVerified: true,
        jerseyNumber: '8',
        birthDate: '1991-07-18',
        profilePhoto: 'https://i.pravatar.cc/150?img=5',
        favoriteSports: ['Futbol', 'Tenis'],
        sportPositions: {
          Futbol: ['Defans', 'Orta Saha'],
        },
        language: 'en',
        timezone: 'Europe/Istanbul',
        twoFactorEnabled: false,
        lastLogin: new Date(),
        createdAt: new Date().toISOString(),
        isActive: true,
        isBanned: false,
      },
    ];
  }

  // ============================================
  // 2. TEST LEAGUES
  // ============================================
  static getTestLeagues(playerIds: string[]): Omit<ILeague, 'id'>[] {
    return [
      {
        title: 'Architect Football League',
        sportType: 'Futbol' as SportType,
        description: 'Weekly football matches for architects',
        logo: 'https://via.placeholder.com/150?text=AFL',
        currentSeasonId: "null",
        seasonSettings: {
          autoCreateNewSeason: true,
          seasonDuration: 180,
          autoArchiveOldSeasons: true,
          archiveAfterMonths: 12,
        },
        members: {
          all: playerIds,
          admins: [playerIds[0]],
        },
        defaultPlayers: {
          premium: [playerIds[0], playerIds[1]],
          direct: [playerIds[2]],
        },
        settings: {
          allowFriendlyMatches: true,
          friendlyAffectsStats: true,
          friendlyAffectsStandings: false,
        },
        totalSeasons: 1,
        totalMatches: 5,
        totalMembers: playerIds.length,
        createdBy: playerIds[0],
        createdAt: new Date().toISOString(),
      },
      {
        title: 'Evening Basketball Club',
        sportType: 'Basketbol' as SportType,
        description: 'Basketball matches every Tuesday and Thursday',
        logo: 'https://via.placeholder.com/150?text=EBC',
        currentSeasonId: "null",
        seasonSettings: {
          autoCreateNewSeason: true,
          seasonDuration: 90,
          autoArchiveOldSeasons: true,
          archiveAfterMonths: 12,
        },
        members: {
          all: [playerIds[0], playerIds[3], playerIds[4]],
          admins: [playerIds[0]],
        },
        defaultPlayers: {
          premium: [playerIds[0]],
          direct: [playerIds[3]],
        },
        settings: {
          allowFriendlyMatches: true,
          friendlyAffectsStats: false,
          friendlyAffectsStandings: false,
        },
        totalSeasons: 1,
        totalMatches: 3,
        totalMembers: 3,
        createdBy: playerIds[0],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ============================================
  // 3. TEST SEASONS
  // ============================================
  static getTestSeasons(leagueId: string, playerIds: string[]): Omit<ISeason, 'id'>[] {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);

    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 150);

    return [
      {
        leagueId,
        name: '2025 Spring Season',
        seasonNumber: 1,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: SeasonStatus.ACTIVE,
        settings: {
          pointsForWin: 3,
          pointsForDraw: 1,
          pointsForLoss: 0,
        },
        summary: {
          totalMatches: 5,
          totalGoals: 25,
          topScorer: {
            playerId: playerIds[0],
            playerName: 'John Doe',
            goals: 8,
          },
          mvp: {
            playerId: playerIds[1],
            playerName: 'Jane Smith',
            rating: 4.5,
            mvpCount: 3,
          },
        },
        standingsId: "1",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ============================================
  // 4. TEST FIXTURES
  // ============================================
  static getTestFixtures(leagueId: string, playerIds: string[]): Omit<IFixture, 'id'>[] {
    return [
      {
        leagueId,
        title: 'Tuesday Night Match',
        description: 'Regular Tuesday evening football match',
        schedule: {
          registrationStartTime: '18:00',
          matchStartTime: '20:00',
          matchDuration: 90,
          isRecurring: true,
          pattern: {
            type: 'weekly',
            dayOfWeek: 2,
          },
        },
        squad: {
          totalPlayers: 10,
          reservePlayers: 2,
          minPlayersToStart: 8,
        },
        venue: {
          location: 'Central Sports Complex, Istanbul',
          pricePerPlayer: 50,
          payment: {
            iban: 'TR330006100519786457841326',
            accountName: 'Sport League',
          },
        },
        players: {
          premium: {
            mode: 'auto',
            inherited: [playerIds[0], playerIds[1]],
          },
          direct: {
            mode: 'auto',
            inherited: [playerIds[2]],
          },
        },
        permissions: {
          organizers: [playerIds[0]],
          teamBuilders: [playerIds[0], playerIds[1]],
        },
        totalMatches: 5,
        nextMatchDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ============================================
  // 5. TEST MATCHES
  // ============================================
  static getTestMatches(
    leagueId: string,
    seasonId: string,
    fixtureId: string,
    playerIds: string[]
  ): Omit<IMatch, 'id'>[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    const regStart = new Date(tomorrow);
    regStart.setHours(18, 0, 0, 0);

    const regEnd = new Date(tomorrow);
    regEnd.setHours(19, 30, 0, 0);

    const matchEnd = new Date(tomorrow);
    matchEnd.setHours(21, 30, 0, 0);

    return [
      {
        type: MatchType.LEAGUE,
        leagueId,
        fixtureId,
        seasonId,
        title: 'Tuesday League Match',
        sportType: 'Futbol' as SportType,
        description: 'Regular league match',
        schedule: {
          registrationStart: regStart,
          registrationEnd: regEnd,
          matchStart: tomorrow,
          matchEnd: matchEnd,
        },
        squad: {
          totalPlayers: 10,
          reservePlayers: 2,
          minPlayersToStart: 8,
        },
        players: {
          premium: {
            mode: 'auto',
            inherited: [playerIds[0], playerIds[1]],
          },
          direct: {
            mode: 'auto',
            inherited: [playerIds[2]],
          },
          guests: [],
          registered: [
            {
              playerId: playerIds[3],
              registeredAt: new Date(),
              preferredPosition: 'Forvet',
            },
            {
              playerId: playerIds[4],
              registeredAt: new Date(),
              preferredPosition: 'Defans',
            },
          ],
          reserves: [],
        },
        permissions: {
          organizers: [playerIds[0]],
          teamBuilders: [playerIds[0]],
        },
        venue: {
          location: 'Central Sports Complex, Istanbul',
          pricePerPlayer: 50,
          payment: {
            iban: 'TR330006100519786457841326',
            accountName: 'Sport League',
          },
        },
        payments: [
          {
            playerId: playerIds[0],
            amount: 50,
            paid: true,
            paidAt: new Date(),
            confirmedBy: playerIds[0],
          },
          {
            playerId: playerIds[1],
            amount: 50,
            paid: false,
          },
        ],
        status: MatchStatus.REGISTRATION_OPEN,
        totalComments: 0,
        totalRatings: 0,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ============================================
  // 6. TEST STANDINGS
  // ============================================
  static getTestStandings(
    leagueId: string,
    seasonId: string,
    playerIds: string[]
  ): Omit<IStandings, 'id'> {
    return {
      leagueId,
      seasonId,
      standings: [
        {
          playerId: playerIds[0],
          playerName: 'John Doe',
          league: {
            played: 5,
            won: 4,
            drawn: 1,
            lost: 0,
            goals: 8,
            goalsAgainst: 2,
            goalDifference: 6,
            assists: 3,
            points: 13,
          },
          friendly: {
            played: 2,
            won: 2,
            drawn: 0,
            lost: 0,
            goals: 4,
            assists: 1,
          },
          performance: {
            rating: 4.5,
            totalRatingsReceived: 5,
            mvpCount: 2,
            mvpRate: 40,
            attendanceRate: 100,
            form: 'WWDWW',
            ratingTrend: 'up',
          },
        },
        {
          playerId: playerIds[1],
          playerName: 'Jane Smith',
          league: {
            played: 5,
            won: 3,
            drawn: 1,
            lost: 1,
            goals: 6,
            goalsAgainst: 3,
            goalDifference: 3,
            assists: 5,
            points: 10,
          },
          performance: {
            rating: 4.3,
            totalRatingsReceived: 5,
            mvpCount: 3,
            mvpRate: 60,
            attendanceRate: 100,
            form: 'WLDWW',
            ratingTrend: 'stable',
          },
        },
        {
          playerId: playerIds[2],
          playerName: 'Michael Johnson',
          league: {
            played: 5,
            won: 2,
            drawn: 2,
            lost: 1,
            goals: 1,
            goalsAgainst: 4,
            goalDifference: -3,
            assists: 2,
            points: 8,
          },
          performance: {
            rating: 4.0,
            totalRatingsReceived: 5,
            mvpCount: 0,
            mvpRate: 0,
            attendanceRate: 100,
            form: 'WDLWD',
            ratingTrend: 'stable',
          },
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  // ============================================
  // 7. TEST PLAYER STATS
  // ============================================
  static getTestPlayerStats(
    playerIds: string[],
    leagueId: string,
    seasonId: string
  ): Omit<IPlayerStats, 'id'>[] {
    return playerIds.slice(0, 3).map((playerId, index) => ({
      playerId,
      leagueId,
      seasonId,
      league: {
        matches: 5,
        wins: 4 - index,
        draws: 1,
        losses: index,
        goals: 8 - index * 2,
        assists: 3 - index,
        points: 13 - index * 3,
        goalsPerMatch: (8 - index * 2) / 5,
        assistsPerMatch: (3 - index) / 5,
        winRate: ((4 - index) / 5) * 100,
        cleanSheets: 2,
      },
      friendly: {
        matches: 2,
        wins: 2,
        draws: 0,
        losses: 0,
        goals: 4,
        assists: 1,
        goalsPerMatch: 2,
        assistsPerMatch: 0.5,
        winRate: 100,
      },
      total: {
        matches: 7,
        goals: 12 - index * 2,
        assists: 4 - index,
        points: 13 - index * 3,
      },
      rating: {
        average: 4.5 - index * 0.2,
        totalReceived: 5,
        categories: {
          skill: 4.5,
          teamwork: 4.3,
          sportsmanship: 4.7,
          effort: 4.4,
        },
        lastFiveRatings: [4.5, 4.4, 4.6, 4.5, 4.3],
        trend: index === 0 ? 'improving' : 'stable',
        fromTeammates: {
          average: 4.6,
          count: 3,
        },
        fromOpponents: {
          average: 4.4,
          count: 2,
        },
      },
      mvp: {
        count: 2 - index,
        rate: ((2 - index) / 5) * 100,
        lastMvpDate: new Date().toISOString(),
      },
      attendance: {
        invited: 5,
        played: 5,
        rate: 100,
      },
      positions: {
        'Orta Saha': {
          matches: 3,
          goals: 5,
          assists: 2,
          rating: 4.6,
        },
        Forvet: {
          matches: 2,
          goals: 3,
          assists: 1,
          rating: 4.4,
        },
      },
      lastUpdated: new Date().toISOString(),
    }));
  }

  // ============================================
  // 8. TEST MATCH RATINGS
  // ============================================
  static getTestMatchRatings(
    matchId: string,
    leagueId: string,
    seasonId: string,
    playerIds: string[]
  ): Omit<IMatchRating, 'id'>[] {
    const ratings: Omit<IMatchRating, 'id'>[] = [];

    // Player 0 rates others
    for (let i = 1; i < 3; i++) {
      ratings.push({
        matchId,
        matchType: MatchType.LEAGUE,
        leagueId,
        seasonId,
        raterId: playerIds[0],
        ratedPlayerId: playerIds[i],
        rating: 4 + Math.random(),
        categories: {
          skill: 4 + Math.random(),
          teamwork: 4 + Math.random(),
          sportsmanship: 4.5 + Math.random() * 0.5,
          effort: 4 + Math.random(),
        },
        comment: 'Great game!',
        isAnonymous: false,
        createdAt: new Date().toISOString(),
      });
    }

    return ratings;
  }

  // ============================================
  // 9. TEST MATCH COMMENTS
  // ============================================
  static getTestMatchComments(
    matchId: string,
    playerIds: string[]
  ): Omit<IMatchComment, 'id'>[] {
    return [
      {
        matchId,
        matchType: MatchType.LEAGUE,
        playerId: playerIds[0],
        playerName: 'John Doe',
        playerPhoto: 'https://i.pravatar.cc/150?img=1',
        comment: 'Great match everyone! Looking forward to the next one.',
        type: 'general',
        isApproved: true,
        approvedBy: playerIds[0],
        approvedAt: new Date().toISOString(),
        likes: [playerIds[1], playerIds[2]],
        createdAt: new Date().toISOString(),
      },
      {
        matchId,
        matchType: MatchType.LEAGUE,
        playerId: playerIds[1],
        playerName: 'Jane Smith',
        playerPhoto: 'https://i.pravatar.cc/150?img=2',
        comment: "That goal in the second half was amazing! 🔥",
        type: 'highlight',
        isApproved: true,
        likes: [playerIds[0], playerIds[3]],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ============================================
  // 10. TEST MATCH INVITATIONS
  // ============================================
  static getTestMatchInvitations(
    matchId: string,
    playerIds: string[]
  ): Omit<IMatchInvitation, 'id'>[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        matchId,
        matchType: MatchType.LEAGUE,
        inviterId: playerIds[0],
        inviterName: 'John Doe',
        inviteeId: playerIds[4],
        inviteeName: 'David Brown',
        status: 'pending',
        message: 'Hey! Would you like to join us for tomorrow\'s match?',
        sentAt: new Date().toISOString(),
        expiresAt: tomorrow.toISOString(),
      },
    ];
  }

  // ============================================
  // 11. TEST NOTIFICATIONS
  // ============================================
  static getTestNotifications(playerIds: string[], matchId: string): Omit<INotification, 'id'>[] {
    return [
      {
        userId: playerIds[0],
        type: 'match_reminder',
        title: 'Match Tomorrow!',
        message: 'Your match is scheduled for tomorrow at 8:00 PM',
        relatedId: matchId,
        relatedType: 'match',
        read: false,
        actionUrl: `/matches/${matchId}`,
        actionLabel: 'View Match',
        createdAt: new Date().toISOString(),
      },
      {
        userId: playerIds[1],
        type: 'team_assignment',
        title: 'Team Assignment',
        message: 'You have been assigned to Team A',
        relatedId: matchId,
        relatedType: 'match',
        read: true,
        readAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        userId: playerIds[0],
        type: 'mvp_announcement',
        title: 'MVP Award! 🏆',
        message: 'Congratulations! You were voted MVP of the last match',
        relatedId: matchId,
        relatedType: 'match',
        read: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  }

  // ============================================
  // 12. TEST ACTIVITY LOGS
  // ============================================
  static getTestActivityLogs(playerIds: string[], leagueId: string, matchId: string): Omit<IActivityLog, 'id'>[] {
    return [
      {
        userId: playerIds[0],
        userName: 'John Doe',
        action: 'league_created',
        entityType: 'league',
        entityId: leagueId,
        entityName: 'Architect Football League',
        details: {
          sportType: 'Futbol',
        },
        timestamp: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
      },
      {
        userId: playerIds[0],
        userName: 'John Doe',
        action: 'match_created',
        entityType: 'match',
        entityId: matchId,
        entityName: 'Tuesday League Match',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        userId: playerIds[1],
        userName: 'Jane Smith',
        action: 'match_registered',
        entityType: 'match',
        entityId: matchId,
        entityName: 'Tuesday League Match',
        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      },
    ];
  }

  // ============================================
  // 13. APP CONFIG
  // ============================================
  static getAppConfig(): IAppConfig {
    return {
      id: 'main',
      app: {
        name: 'Sport Manager',
        version: '1.0.0',
        environment: 'development',
        maintenanceMode: false,
      },
      features: {
        friendlyMatches: true,
        ratingSystem: true,
        commentSystem: true,
        paymentTracking: true,
        mvpSystem: true,
        notifications: true,
        invitations: true,
        multiLeague: true,
      },
      defaults: {
        seasonDuration: 180,
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
        minPlayersToStart: 8,
        registrationDeadlineHours: 2,
        autoArchiveMonths: 12,
      },
      limits: {
        maxLeaguesPerUser: 5,
        maxPlayersPerLeague: 100,
        maxMatchesPerDay: 10,
        maxCommentsPerMatch: 50,
        maxInvitationsPerMatch: 20,
      },
      notifications: {
        enabled: true,
        channels: {
          email: true,
          push: true,
          sms: false,
        },
        timings: {
          matchReminder: 24,
          paymentReminder: 48,
          ratingRequest: 2,
        },
      },
      emailTemplates: {
        matchInvitation: {
          subject: 'You are invited to a match!',
          enabled: true,
        },
        matchReminder: {
          subject: 'Match Reminder',
          enabled: true,
        },
        paymentReminder: {
          subject: 'Payment Reminder',
          enabled: true,
        },
        seasonReport: {
          subject: 'Season Report',
          enabled: true,
        },
      },
      contact: {
        email: 'support@sportmanager.com',
        supportEmail: 'help@sportmanager.com',
      },
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system',
    };
  }

  // ============================================
  // 14. USER SETTINGS
  // ============================================
  static getTestUserSettings(playerIds: string[]): Omit<IUserSettings, 'id'>[] {
    return playerIds.map((playerId) => ({
      userId: playerId,
      profile: {
        displayName: "Test User",
        showEmail: true,
        showPhone: false,
        showBirthDate: false,
      },
      notifications: {
        email: {
          matchInvitations: true,
          matchReminders: true,
          teamAssignments: true,
          paymentReminders: true,
          ratingRequests: true,
          mvpAnnouncements: true,
          seasonUpdates: true,
          weeklyDigest: false,
        },
        push: {
          matchInvitations: true,
          matchReminders: true,
          teamAssignments: true,
          paymentReminders: true,
          ratingRequests: false,
          mvpAnnouncements: true,
        },
        sms: {
          matchReminders: false,
          urgentUpdates: false,
        },
      },
      privacy: {
        profileVisibility: 'public',
        showStats: true,
        showRating: true,
        allowInvitations: true,
        allowFriendRequests: true,
      },
      preferences: {
        favoritePositions: {
          Futbol: ['Orta Saha'],
        },
        availableDays: [2, 4, 6], // Tue, Thu, Sat
        preferredTimes: {
          morning: false,
          afternoon: false,
          evening: true,
        },
        maxDistanceKm: 10,
      },
      appearance: {
        theme: 'light',
        language: 'en',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
      quickActions: {
        favoriteLeagues: [],
        recentMatches: [],
        frequentPlayers: [],
      },
      createdAt: new Date().toISOString(),
    }));
  }

  // ============================================
  // 15. LEAGUE SETTINGS
  // ============================================
  static getTestLeagueSettings(leagueIds: string[], playerIds: string[]): Omit<ILeagueSettings, 'id'>[] {
    return leagueIds.map((leagueId) => ({
      leagueId,
      rules: {
        lateArrivalPenalty: 10,
        absentWithoutNoticePenalty: 50,
        yellowCardFine: 20,
        redCardFine: 100,
        minAttendanceRate: 70,
      },
      matchRules: {
        allowGuestPlayers: true,
        maxGuestPlayersPerMatch: 2,
        guestPlayerPriceMultiplier: 1.5,
        autoAssignTeams: false,
        teamBalanceAlgorithm: 'rating',
      },
      registration: {
        allowLateRegistration: true,
        lateRegistrationDeadlineHours: 2,
        requirePaymentForRegistration: false,
        autoConfirmPayment: false,
        cancellationDeadlineHours: 24,
        requireOrganizerApprovalForSquad: false,
      },
      scoring: {
        requireScoreConfirmation: true,
        scoreConfirmationTimeoutHours: 24,
        allowPlayerSelfReporting: false,
      },
      rating: {
        enabled: true,
        mandatory: false,
        anonymous: false,
        ratingDeadlineHours: 48,
        minRatingsForMVP: 5,
        allowCategoryRating: true,
      },
      comments: {
        enabled: true,
        requireApproval: false,
        allowLikes: true,
        maxLength: 500,
      },
      payment: {
        defaultIban: 'TR330006100519786457841326',
        defaultAccountName: 'Sport League',
        defaultPricePerPlayer: 50,
        currency: 'TRY',
        allowInstallment: false,
        paymentMethods: ['cash', 'bank_transfer'],
      },
      integrations: {
        googleCalendar: false,
        googleSheets: false,
        whatsapp: true,
        slack: false,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: playerIds[0],
    }));
  }

  // ============================================
  // 16. FAQS
  // ============================================
  static getTestFAQs(playerIds: string[]): Omit<IFAQ, 'id'>[] {
    return [
      {
        question: 'How do I join a league?',
        answer: 'You can join a league by browsing public leagues or accepting an invitation from a league organizer.',
        category: 'league',
        priority: 1,
        isPublished: true,
        views: 150,
        helpful: 120,
        notHelpful: 5,
        createdAt: new Date().toISOString(),
        createdBy: playerIds[0],
      },
      {
        question: 'How do payments work?',
        answer: 'Each match has a set price per player. You can pay via bank transfer to the provided IBAN. Mark your payment in the app and wait for organizer confirmation.',
        category: 'payment',
        priority: 2,
        isPublished: true,
        views: 200,
        helpful: 180,
        notHelpful: 10,
        createdAt: new Date().toISOString(),
        createdBy: playerIds[0],
      },
      {
        question: 'What is the rating system?',
        answer: 'After each match, players can rate each other on skill, teamwork, sportsmanship, and effort. These ratings contribute to your overall player profile.',
        category: 'rating',
        priority: 3,
        isPublished: true,
        views: 95,
        helpful: 80,
        notHelpful: 3,
        createdAt: new Date().toISOString(),
        createdBy: playerIds[0],
      },
    ];
  }

  // ============================================
  // 17. ANNOUNCEMENTS
  // ============================================
  static getTestAnnouncements(leagueIds: string[], playerIds: string[]): Omit<IAnnouncement, 'id'>[] {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 7);

    return [
      {
        title: 'Welcome to Sport Manager!',
        message: 'We are excited to have you join our platform. Explore leagues, join matches, and connect with fellow athletes.',
        type: 'success',
        target: {
          scope: 'global',
        },
        display: {
          showOnHome: true,
          showAsPopup: true,
          showInLeague: false,
          dismissable: true,
        },
        schedule: {
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true,
        },
        action: {
          label: 'Browse Leagues',
          url: '/leagues',
        },
        stats: {
          views: 50,
          clicks: 15,
          dismissed: 10,
        },
        createdAt: now.toISOString(),
        createdBy: playerIds[0],
      },
    ];
  }

  // ============================================
  // 18. FEEDBACKS
  // ============================================
  static getTestFeedbacks(playerIds: string[]): Omit<IFeedback, 'id'>[] {
    return [
      {
        userId: playerIds[1],
        userName: 'Jane Smith',
        userEmail: 'jane.smith@example.com',
        type: 'feature',
        title: 'Add WhatsApp notification integration',
        description: 'It would be great to receive match reminders via WhatsApp.',
        page: 'Notifications',
        feature: 'Notifications',
        status: 'new',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        systemInfo: {
          browser: 'Chrome',
          os: 'iOS',
          device: 'iPhone 13',
          appVersion: '1.0.0',
        },
      },
    ];
  }

  // ============================================
  // 19. PLAYER PROFILES
  // ============================================
  static getTestPlayerProfiles(playerIds: string[], leagueIds: string[]): Omit<IPlayerProfile, 'id'>[] {
    return playerIds.map((playerId, index) => ({
      playerId,
      overall: {
        totalLeagues: 2,
        totalMatches: 7,
        totalGoals: 12 - index * 2,
        totalAssists: 4 - index,
        totalMVPs: 2 - index,
        averageRating: 4.5 - index * 0.2,
      },
      leagueSummaries: [
        {
          leagueId: leagueIds[0],
          leagueName: 'Architect Football League',
          sportType: 'Futbol',
          stats: {
            matches: 5,
            wins: 4 - index,
            goals: 8 - index * 2,
            assists: 3 - index,
            mvps: 2 - index,
            rating: 4.5 - index * 0.2,
          },
          isActive: true,
          joinedAt: new Date(Date.now() - 2592000000).toISOString(),
          lastPlayedAt: new Date().toISOString(),
        },
      ],
      achievements: [
        {
          id: 'top_scorer_1',
          type: 'top_scorer',
          name: 'Top Scorer',
          description: 'Most goals in a season',
          earnedAt: new Date().toISOString(),
          leagueId: leagueIds[0],
        },
      ],
      preferences: {
        favoriteSports: ['Futbol'],
        preferredPositions: {
          Futbol: ['Orta Saha'],
        },
        availableDays: [2, 4, 6],
        preferredTimes: ['evening'],
      },
      playStyle: {
        offensive: 70 + index * 5,
        defensive: 30 - index * 5,
        teamPlayer: 85,
        consistent: 90 - index * 5,
      },
      social: {
        friendIds: [],
        blockedIds: [],
        followersCount: 10 + index * 5,
        followingCount: 15 + index * 3,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }

  // ============================================
  // 20. PLAYER RATING PROFILES
  // ============================================
  static getTestPlayerRatingProfiles(playerIds: string[], leagueId: string, seasonId: string): Omit<IPlayerRatingProfile, 'id'>[] {
    return playerIds.slice(0, 3).map((playerId, index) => ({
      playerId,
      leagueId,
      seasonId,
      overall: {
        overallRating: 4.5 - index * 0.2,
        totalRatingsReceived: 7,
        mvpCount: 2 - index,
        mvpRate: ((2 - index) / 7) * 100,
      },
      league: {
        overallRating: 4.5 - index * 0.2,
        totalRatingsReceived: 5,
        mvpCount: 2 - index,
        mvpRate: ((2 - index) / 5) * 100,
      },
      friendly: {
        overallRating: 4.4,
        totalRatingsReceived: 2,
        mvpCount: 0,
        mvpRate: 0,
      },
      categoryAverages: {
        skill: 4.5,
        teamwork: 4.3,
        sportsmanship: 4.7,
        effort: 4.4,
      },
      ratingTrend: index === 0 ? 'improving' : 'stable',
      lastFiveRatings: [4.5, 4.4, 4.6, 4.5, 4.3],
      teammateRatings: {
        average: 4.6,
        count: 4,
      },
      opponentRatings: {
        average: 4.4,
        count: 3,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }

  // ============================================
  // 21. FRIENDLY MATCH CONFIGS
  // ============================================
  static getTestFriendlyMatchConfigs(playerIds: string[]): Omit<IFriendlyMatchConfig, 'id'>[] {
    return [
      {
        organizerId: playerIds[0],
        defaultSettings: {
          location: 'Central Sports Complex',
          staffCount: 10,
          reserveCount: 2,
          pricePerPlayer: 50,
          paymentInfo: {
            iban: 'TR330006100519786457841326',
            accountName: 'John Doe',
          },
        },
        favoritePlayerIds: [playerIds[1], playerIds[2], playerIds[3]],
        templates: [
          {
            id: 'template_1',
            name: 'Saturday Morning Match',
            sportType: 'Futbol',
            settings: {
              location: 'Central Sports Complex',
              staffCount: 10,
              reserveCount: 2,
              pricePerPlayer: 50,
              matchDuration: 90,
            },
          },
        ],
        recentSettings: {
          lastLocation: 'Central Sports Complex',
          lastPrice: 50,
          lastStaffCount: 10,
        },
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ============================================
  // 22. SYSTEM LOGS
  // ============================================
  static getTestSystemLogs(playerIds: string[]): Omit<ISystemLog, 'id'>[] {
    return [
      {
        level: 'info',
        category: 'auth',
        message: 'User logged in successfully',
        details: {
          userId: playerIds[0],
        },
        timestamp: new Date().toISOString(),
        source: 'web',
      },
      {
        level: 'warning',
        category: 'match',
        message: 'Match registration deadline approaching',
        details: {
          matchId: 'match_1',
        },
        timestamp: new Date().toISOString(),
        source: 'cron',
      },
    ];
  }

  // ============================================
  // SEED ALL DATA
  // ============================================
  static async seedAll(): Promise<void> {
    try {
      console.log('🌱 Starting complete Firebase seed...\n');

      const batch = writeBatch(db);
      let batchCount = 0;

      // Helper to commit batch if needed
      const commitIfNeeded = async () => {
        if (batchCount >= 450) { // Firestore limit is 500
          await batch.commit();
          batchCount = 0;
        }
      };

      // 1. Players
      console.log('👥 Creating players...');
      const players = this.getTestPlayers();
      const playerIds: string[] = [];

      for (let i = 0; i < players.length; i++) {
        const playerId = `player_${i + 1}`;
        playerIds.push(playerId);
        batch.set(doc(db, 'users', playerId), players[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 2. Leagues
      console.log('🏆 Creating leagues...');
      const leagues = this.getTestLeagues(playerIds);
      const leagueIds: string[] = [];

      for (let i = 0; i < leagues.length; i++) {
        const leagueId = `league_${i + 1}`;
        leagueIds.push(leagueId);
        batch.set(doc(db, 'leagues', leagueId), leagues[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 3. Seasons
      console.log('📅 Creating seasons...');
      const seasons = this.getTestSeasons(leagueIds[0], playerIds);
      const seasonIds: string[] = [];

      for (let i = 0; i < seasons.length; i++) {
        const seasonId = `season_${i + 1}`;
        seasonIds.push(seasonId);
        batch.set(doc(db, 'seasons', seasonId), seasons[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 4. Fixtures
      console.log('📋 Creating fixtures...');
      const fixtures = this.getTestFixtures(leagueIds[0], playerIds);
      const fixtureIds: string[] = [];

      for (let i = 0; i < fixtures.length; i++) {
        const fixtureId = `fixture_${i + 1}`;
        fixtureIds.push(fixtureId);
        batch.set(doc(db, 'fixtures', fixtureId), fixtures[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 5. Matches
      console.log('⚽ Creating matches...');
      const matches = this.getTestMatches(leagueIds[0], seasonIds[0], fixtureIds[0], playerIds);
      const matchIds: string[] = [];

      for (let i = 0; i < matches.length; i++) {
        const matchId = `match_${i + 1}`;
        matchIds.push(matchId);
        batch.set(doc(db, 'matches', matchId), matches[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 6. Standings
      console.log('📊 Creating standings...');
      const standings = this.getTestStandings(leagueIds[0], seasonIds[0], playerIds);
      batch.set(doc(db, 'standings', `standings_${seasonIds[0]}`), standings);
      batchCount++;
      await commitIfNeeded();

      // 7. Player Stats
      console.log('📈 Creating player stats...');
      const playerStats = this.getTestPlayerStats(playerIds, leagueIds[0], seasonIds[0]);
      for (let i = 0; i < playerStats.length; i++) {
        batch.set(doc(db, 'player_stats', `stats_${playerIds[i]}_${seasonIds[0]}`), playerStats[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 8. Match Ratings
      console.log('⭐ Creating match ratings...');
      const ratings = this.getTestMatchRatings(matchIds[0], leagueIds[0], seasonIds[0], playerIds);
      for (let i = 0; i < ratings.length; i++) {
        batch.set(doc(db, 'ratings', `rating_${i + 1}`), ratings[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 9. Match Comments
      console.log('💬 Creating match comments...');
      const comments = this.getTestMatchComments(matchIds[0], playerIds);
      for (let i = 0; i < comments.length; i++) {
        batch.set(doc(db, 'comments', `comment_${i + 1}`), comments[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 10. Match Invitations
      console.log('✉️ Creating match invitations...');
      const invitations = this.getTestMatchInvitations(matchIds[0], playerIds);
      for (let i = 0; i < invitations.length; i++) {
        batch.set(doc(db, 'invitations', `invitation_${i + 1}`), invitations[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 11. Notifications
      console.log('🔔 Creating notifications...');
      const notifications = this.getTestNotifications(playerIds, matchIds[0]);
      for (let i = 0; i < notifications.length; i++) {
        batch.set(doc(db, 'notifications', `notification_${i + 1}`), notifications[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 12. Activity Logs
      console.log('📝 Creating activity logs...');
      const activityLogs = this.getTestActivityLogs(playerIds, leagueIds[0], matchIds[0]);
      for (let i = 0; i < activityLogs.length; i++) {
        batch.set(doc(db, 'activity_logs', `log_${i + 1}`), activityLogs[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 13. App Config
      console.log('⚙️ Creating app config...');
      batch.set(doc(db, 'app_config', 'main'), this.getAppConfig());
      batchCount++;
      await commitIfNeeded();

      // 14. User Settings
      console.log('👤 Creating user settings...');
      const userSettings = this.getTestUserSettings(playerIds);
      for (let i = 0; i < userSettings.length; i++) {
        batch.set(doc(db, 'user_settings', playerIds[i]), userSettings[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 15. League Settings
      console.log('🔧 Creating league settings...');
      const leagueSettings = this.getTestLeagueSettings(leagueIds, playerIds);
      for (let i = 0; i < leagueSettings.length; i++) {
        batch.set(doc(db, 'league_settings', leagueIds[i]), leagueSettings[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 16. FAQs
      console.log('❓ Creating FAQs...');
      const faqs = this.getTestFAQs(playerIds);
      for (let i = 0; i < faqs.length; i++) {
        batch.set(doc(db, 'faqs', `faq_${i + 1}`), faqs[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 17. Announcements
      console.log('📢 Creating announcements...');
      const announcements = this.getTestAnnouncements(leagueIds, playerIds);
      for (let i = 0; i < announcements.length; i++) {
        batch.set(doc(db, 'announcements', `announcement_${i + 1}`), announcements[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 18. Feedbacks
      console.log('📣 Creating feedbacks...');
      const feedbacks = this.getTestFeedbacks(playerIds);
      for (let i = 0; i < feedbacks.length; i++) {
        batch.set(doc(db, 'feedbacks', `feedback_${i + 1}`), feedbacks[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 19. Player Profiles
      console.log('👥 Creating player profiles...');
      const playerProfiles = this.getTestPlayerProfiles(playerIds, leagueIds);
      for (let i = 0; i < playerProfiles.length; i++) {
        batch.set(doc(db, 'player_profiles', playerIds[i]), playerProfiles[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 20. Player Rating Profiles
      console.log('⭐ Creating player rating profiles...');
      const ratingProfiles = this.getTestPlayerRatingProfiles(playerIds, leagueIds[0], seasonIds[0]);
      for (let i = 0; i < ratingProfiles.length; i++) {
        batch.set(doc(db, 'player_rating_profiles', `rating_${playerIds[i]}`), ratingProfiles[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 21. Friendly Match Configs
      console.log('🎮 Creating friendly match configs...');
      const friendlyConfigs = this.getTestFriendlyMatchConfigs(playerIds);
      for (let i = 0; i < friendlyConfigs.length; i++) {
        batch.set(doc(db, 'friendly_match_configs', playerIds[i]), friendlyConfigs[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // 22. System Logs
      console.log('🖥️ Creating system logs...');
      const systemLogs = this.getTestSystemLogs(playerIds);
      for (let i = 0; i < systemLogs.length; i++) {
        batch.set(doc(db, 'system_logs', `system_log_${i + 1}`), systemLogs[i]);
        batchCount++;
        await commitIfNeeded();
      }

      // Final commit
      if (batchCount > 0) {
        await batch.commit();
      }

      console.log('\n✅ Complete Firebase seed successful!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Summary:`);
      console.log(`   ✓ ${players.length} players`);
      console.log(`   ✓ ${leagues.length} leagues`);
      console.log(`   ✓ ${seasons.length} seasons`);
      console.log(`   ✓ ${fixtures.length} fixtures`);
      console.log(`   ✓ ${matches.length} matches`);
      console.log(`   ✓ 1 standings`);
      console.log(`   ✓ ${playerStats.length} player stats`);
      console.log(`   ✓ ${ratings.length} ratings`);
      console.log(`   ✓ ${comments.length} comments`);
      console.log(`   ✓ ${invitations.length} invitations`);
      console.log(`   ✓ ${notifications.length} notifications`);
      console.log(`   ✓ ${activityLogs.length} activity logs`);
      console.log(`   ✓ 1 app config`);
      console.log(`   ✓ ${userSettings.length} user settings`);
      console.log(`   ✓ ${leagueSettings.length} league settings`);
      console.log(`   ✓ ${faqs.length} FAQs`);
      console.log(`   ✓ ${announcements.length} announcements`);
      console.log(`   ✓ ${feedbacks.length} feedbacks`);
      console.log(`   ✓ ${playerProfiles.length} player profiles`);
      console.log(`   ✓ ${ratingProfiles.length} rating profiles`);
      console.log(`   ✓ ${friendlyConfigs.length} friendly configs`);
      console.log(`   ✓ ${systemLogs.length} system logs`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🎉 Total: 24 collections seeded!`);
    } catch (error) {
      console.error('\n❌ Firebase seed failed:', error);
      throw error;
    }
  }
}
/**
 * Firebase Seed Script
 * Tüm test verilerini Firebase'e ekler
 * 
 * Kullanım:
 * npm run seed
 * yarn seed
 */

async function main() {
  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 FIREBASE SEED SCRIPT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n');

  try {
    // Onay iste (production'da)
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  WARNING: Running seed in PRODUCTION environment!');
      console.log('This will create test data in your production database.');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Seed başlat
    const startTime = Date.now();
    
    await FirebaseSeedV2.seedAll();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Seed completed in ${duration}s`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n');
    console.log('🎉 Your Firebase database is ready!');
    console.log('\n');
    console.log('Next steps:');
    console.log('  1. Run your app: npm start');
    console.log('  2. Login with: john.doe@example.com');
    console.log('  3. Explore the seeded data');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ SEED FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('\n');
    console.error('Error:', error);
    console.error('\n');
    
    if (error instanceof Error) {
      console.error('Message:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }
    
    console.error('\n');
    console.error('Common issues:');
    console.error('  - Firebase credentials not configured');
    console.error('  - Network connection problems');
    console.error('  - Insufficient permissions');
    console.error('  - Firestore rules blocking writes');
    console.error('\n');

    process.exit(1);
  }
}

// Run script
main();

export default FirebaseSeedV2;