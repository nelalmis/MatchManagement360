import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'standings';

export const standingsApi = {
    add: async (data: any) => {
        return addBase(collectionName, data);
    },

    update: async (id: string, data: any) => {
        return updateBase(collectionName, id, data);
    },

    delete: async (id: string) => {
        return deleteByIdBase(collectionName, id);
    },

    getById: async (id: string) => {
        return getByIdBase(collectionName, id);
    },

    getAll: async () => {
        return getAllBase(collectionName);
    },

    // Get all standings for a league
    getStandingsByLeague: async (leagueId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                orderBy('lastUpdated', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig puan durumu getirilemedi:', error);
            return [];
        }
    },

    // Get standings for a specific season
    getStandingsByLeagueAndSeason: async (leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))[0] || null;
        } catch (error) {
            console.error('Sezon puan durumu getirilemedi:', error);
            return null;
        }
    },

    // ============================================
    // NEW: FRIENDLY MATCH STATISTICS
    // ============================================

    /**
     * Update player's friendly match stats in standings
     */
    updatePlayerFriendlyStats: async (
        standingsId: string,
        playerId: string,
        friendlyStats: {
            played?: number;
            won?: number;
            drawn?: number;
            lost?: number;
        }
    ) => {
        try {
            const standings: any = await getByIdBase(collectionName, standingsId);
            if (!standings) {
                throw new Error('Puan durumu bulunamadı');
            }

            const updatedPlayerStandings = standings.playerStandings.map((ps: any) => {
                if (ps.playerId === playerId) {
                    return {
                        ...ps,
                        friendlyPlayed: (ps.friendlyPlayed || 0) + (friendlyStats.played || 0),
                        friendlyWon: (ps.friendlyWon || 0) + (friendlyStats.won || 0),
                        friendlyDrawn: (ps.friendlyDrawn || 0) + (friendlyStats.drawn || 0),
                        friendlyLost: (ps.friendlyLost || 0) + (friendlyStats.lost || 0)
                    };
                }
                return ps;
            });

            return await updateBase(collectionName, standingsId, {
                playerStandings: updatedPlayerStandings,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Friendly istatistikleri güncellenemedi:', error);
            throw error;
        }
    },

    /**
     * Get player's friendly match statistics from standings
     */
    getPlayerFriendlyStats: async (leagueId: string, seasonId: string, playerId: string) => {
        try {
            const standings: any = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);
            if (!standings) return null;

            const playerStanding = standings.playerStandings.find((ps: any) => ps.playerId === playerId);
            
            if (!playerStanding) return null;

            return {
                played: playerStanding.friendlyPlayed || 0,
                won: playerStanding.friendlyWon || 0,
                drawn: playerStanding.friendlyDrawn || 0,
                lost: playerStanding.friendlyLost || 0
            };
        } catch (error) {
            console.error('Friendly istatistikleri getirilemedi:', error);
            return null;
        }
    },

    /**
     * Get top players by friendly matches played
     */
    getTopFriendlyPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const standings: any = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);
            if (!standings) return [];

            return standings.playerStandings
                .filter((ps: any) => (ps.friendlyPlayed || 0) > 0)
                .sort((a: any, b: any) => (b.friendlyPlayed || 0) - (a.friendlyPlayed || 0))
                .slice(0, limitCount)
                .map((ps: any) => ({
                    playerId: ps.playerId,
                    playerName: ps.playerName,
                    friendlyPlayed: ps.friendlyPlayed || 0,
                    friendlyWon: ps.friendlyWon || 0,
                    friendlyDrawn: ps.friendlyDrawn || 0,
                    friendlyLost: ps.friendlyLost || 0,
                    friendlyWinRate: ps.friendlyPlayed 
                        ? ((ps.friendlyWon || 0) / ps.friendlyPlayed * 100).toFixed(1)
                        : '0.0'
                }));
        } catch (error) {
            console.error('Top friendly oyuncular getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get players sorted by combined stats (league + friendly)
     */
    getPlayersCombinedStats: async (leagueId: string, seasonId: string) => {
        try {
            const standings: any = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);
            if (!standings) return [];

            return standings.playerStandings.map((ps: any) => ({
                playerId: ps.playerId,
                playerName: ps.playerName,
                // League stats
                leagueStats: {
                    played: ps.played || 0,
                    won: ps.won || 0,
                    drawn: ps.drawn || 0,
                    lost: ps.lost || 0,
                    points: ps.points || 0
                },
                // Friendly stats
                friendlyStats: {
                    played: ps.friendlyPlayed || 0,
                    won: ps.friendlyWon || 0,
                    drawn: ps.friendlyDrawn || 0,
                    lost: ps.friendlyLost || 0
                },
                // Combined stats
                combinedStats: {
                    totalPlayed: (ps.played || 0) + (ps.friendlyPlayed || 0),
                    totalWon: (ps.won || 0) + (ps.friendlyWon || 0),
                    totalDrawn: (ps.drawn || 0) + (ps.friendlyDrawn || 0),
                    totalLost: (ps.lost || 0) + (ps.friendlyLost || 0)
                },
                // Other stats
                goalsScored: ps.goalsScored || 0,
                assists: ps.assists || 0,
                rating: ps.rating || 0,
                mvpCount: ps.mvpCount || 0
            }));
        } catch (error) {
            console.error('Kombine istatistikler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Update rating statistics for player
     */
    updatePlayerRatingStats: async (
        standingsId: string,
        playerId: string,
        ratingUpdate: {
            rating?: number;
            totalRatingsReceived?: number;
            ratingTrend?: 'up' | 'stable' | 'down';
            mvpCount?: number;
        }
    ) => {
        try {
            const standings: any = await getByIdBase(collectionName, standingsId);
            if (!standings) {
                throw new Error('Puan durumu bulunamadı');
            }

            const updatedPlayerStandings = standings.playerStandings.map((ps: any) => {
                if (ps.playerId === playerId) {
                    const updated = { ...ps };
                    
                    if (ratingUpdate.rating !== undefined) {
                        updated.rating = ratingUpdate.rating;
                    }
                    if (ratingUpdate.totalRatingsReceived !== undefined) {
                        updated.totalRatingsReceived = ratingUpdate.totalRatingsReceived;
                    }
                    if (ratingUpdate.ratingTrend !== undefined) {
                        updated.ratingTrend = ratingUpdate.ratingTrend;
                    }
                    if (ratingUpdate.mvpCount !== undefined) {
                        updated.mvpCount = ratingUpdate.mvpCount;
                        // Calculate MVP rate
                        const totalMatches = (ps.played || 0) + (ps.friendlyPlayed || 0);
                        updated.mvpRate = totalMatches > 0 
                            ? (ratingUpdate.mvpCount / totalMatches) * 100 
                            : 0;
                    }
                    
                    return updated;
                }
                return ps;
            });

            return await updateBase(collectionName, standingsId, {
                playerStandings: updatedPlayerStandings,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Rating istatistikleri güncellenemedi:', error);
            throw error;
        }
    },

    /**
     * Get top rated players
     */
    getTopRatedPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const standings: any = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);
            if (!standings) return [];

            return standings.playerStandings
                .filter((ps: any) => (ps.totalRatingsReceived || 0) >= 3) // Minimum 3 ratings
                .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
                .slice(0, limitCount)
                .map((ps: any) => ({
                    playerId: ps.playerId,
                    playerName: ps.playerName,
                    rating: ps.rating || 0,
                    totalRatingsReceived: ps.totalRatingsReceived || 0,
                    ratingTrend: ps.ratingTrend || 'stable',
                    mvpCount: ps.mvpCount || 0,
                    mvpRate: ps.mvpRate || 0
                }));
        } catch (error) {
            console.error('Top rated oyuncular getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get MVP leaderboard
     */
    getMVPLeaderboard: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const standings: any = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);
            if (!standings) return [];

            return standings.playerStandings
                .filter((ps: any) => (ps.mvpCount || 0) > 0)
                .sort((a: any, b: any) => {
                    // First sort by MVP count
                    if ((b.mvpCount || 0) !== (a.mvpCount || 0)) {
                        return (b.mvpCount || 0) - (a.mvpCount || 0);
                    }
                    // Then by MVP rate
                    return (b.mvpRate || 0) - (a.mvpRate || 0);
                })
                .slice(0, limitCount)
                .map((ps: any) => ({
                    playerId: ps.playerId,
                    playerName: ps.playerName,
                    mvpCount: ps.mvpCount || 0,
                    mvpRate: ps.mvpRate || 0,
                    totalMatches: (ps.played || 0) + (ps.friendlyPlayed || 0),
                    rating: ps.rating || 0
                }));
        } catch (error) {
            console.error('MVP sıralaması getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get player standing detail
     */
    getPlayerStandingDetail: async (leagueId: string, seasonId: string, playerId: string) => {
        try {
            const standings: any = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);
            if (!standings) return null;

            const playerStanding = standings.playerStandings.find((ps: any) => ps.playerId === playerId);
            
            if (!playerStanding) return null;

            // Calculate additional metrics
            const totalMatches = (playerStanding.played || 0) + (playerStanding.friendlyPlayed || 0);
            const totalWon = (playerStanding.won || 0) + (playerStanding.friendlyWon || 0);
            
            return {
                ...playerStanding,
                // Calculated metrics
                totalMatches,
                totalWinRate: totalMatches > 0 ? (totalWon / totalMatches * 100).toFixed(1) : '0.0',
                leagueWinRate: playerStanding.played > 0 
                    ? ((playerStanding.won || 0) / playerStanding.played * 100).toFixed(1) 
                    : '0.0',
                friendlyWinRate: playerStanding.friendlyPlayed > 0 
                    ? ((playerStanding.friendlyWon || 0) / playerStanding.friendlyPlayed * 100).toFixed(1) 
                    : '0.0',
                averageGoalsPerMatch: totalMatches > 0 
                    ? ((playerStanding.goalsScored || 0) / totalMatches).toFixed(2) 
                    : '0.00',
                averageAssistsPerMatch: totalMatches > 0 
                    ? ((playerStanding.assists || 0) / totalMatches).toFixed(2) 
                    : '0.00'
            };
        } catch (error) {
            console.error('Oyuncu detay istatistikleri getirilemedi:', error);
            return null;
        }
    },

    /**
     * Compare two players
     */
    comparePlayers: async (
        leagueId: string,
        seasonId: string,
        playerId1: string,
        playerId2: string
    ) => {
        try {
            const player1Stats = await standingsApi.getPlayerStandingDetail(leagueId, seasonId, playerId1);
            const player2Stats = await standingsApi.getPlayerStandingDetail(leagueId, seasonId, playerId2);

            if (!player1Stats || !player2Stats) {
                throw new Error('Oyunculardan biri bulunamadı');
            }

            return {
                player1: player1Stats,
                player2: player2Stats,
                comparison: {
                    matchesDiff: player1Stats.totalMatches - player2Stats.totalMatches,
                    pointsDiff: (player1Stats.points || 0) - (player2Stats.points || 0),
                    goalsDiff: (player1Stats.goalsScored || 0) - (player2Stats.goalsScored || 0),
                    assistsDiff: (player1Stats.assists || 0) - (player2Stats.assists || 0),
                    ratingDiff: (player1Stats.rating || 0) - (player2Stats.rating || 0),
                    mvpDiff: (player1Stats.mvpCount || 0) - (player2Stats.mvpCount || 0)
                }
            };
        } catch (error) {
            console.error('Oyuncu karşılaştırması yapılamadı:', error);
            throw error;
        }
    },

    /**
     * Get standings statistics summary
     */
    getStandingsSummary: async (leagueId: string, seasonId: string) => {
        try {
            const standings: any = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);
            if (!standings) return null;

            const players = standings.playerStandings;

            // Calculate totals
            const totalLeagueMatches = players.reduce((sum: number, p: any) => sum + (p.played || 0), 0);
            const totalFriendlyMatches = players.reduce((sum: number, p: any) => sum + (p.friendlyPlayed || 0), 0);
            const totalGoals = players.reduce((sum: number, p: any) => sum + (p.goalsScored || 0), 0);
            const totalAssists = players.reduce((sum: number, p: any) => sum + (p.assists || 0), 0);

            // Calculate averages
            const avgRating = players.length > 0
                ? players.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) / players.length
                : 0;

            return {
                totalPlayers: players.length,
                totalLeagueMatches,
                totalFriendlyMatches,
                totalMatches: totalLeagueMatches + totalFriendlyMatches,
                totalGoals,
                totalAssists,
                averageRating: avgRating.toFixed(2),
                topScorer: players.reduce((max: any, p: any) => 
                    (p.goalsScored || 0) > (max.goalsScored || 0) ? p : max, 
                    players[0]
                ),
                topAssister: players.reduce((max: any, p: any) => 
                    (p.assists || 0) > (max.assists || 0) ? p : max, 
                    players[0]
                ),
                mostActive: players.reduce((max: any, p: any) => {
                    const maxTotal = (max.played || 0) + (max.friendlyPlayed || 0);
                    const pTotal = (p.played || 0) + (p.friendlyPlayed || 0);
                    return pTotal > maxTotal ? p : max;
                }, players[0]),
                lastUpdated: standings.lastUpdated
            };
        } catch (error) {
            console.error('Standings özeti getirilemedi:', error);
            return null;
        }
    }
};

/*
// Kombine istatistikler
const combined = await standingsApi.getPlayersCombinedStats(leagueId, seasonId);
// Returns: leagueStats, friendlyStats, combinedStats


// Rating istatistiklerini güncelle
await standingsApi.updatePlayerRatingStats(standingsId, playerId, {
  rating: 4.5,
  totalRatingsReceived: 10,
  ratingTrend: 'up',
  mvpCount: 3
});

// Top rated oyuncular
const topRated = await standingsApi.getTopRatedPlayers(leagueId, seasonId, 10);

// MVP sıralaması
const mvpLeaderboard = await standingsApi.getMVPLeaderboard(leagueId, seasonId, 10);



// Oyuncu detay istatistikleri
const detail = await standingsApi.getPlayerStandingDetail(leagueId, seasonId, playerId);
// Returns: totalMatches, totalWinRate, leagueWinRate, friendlyWinRate, etc.

// İki oyuncuyu karşılaştır
const comparison = await standingsApi.comparePlayers(
  leagueId,
  seasonId,
  playerId1,
  playerId2
);
// Returns: player1, player2, comparison (diffs)


// Genel özet
const summary = await standingsApi.getStandingsSummary(leagueId, seasonId);
// Returns:
// - totalPlayers, totalMatches
// - topScorer, topAssister, mostActive
// - averageRating


// Friendly maç tamamlandıktan sonra
const standings = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);

// Her oyuncu için friendly stats güncelle
for (const playerId of team1PlayerIds) {
  await standingsApi.updatePlayerFriendlyStats(standings.id, playerId, {
    played: 1,
    won: team1Score > team2Score ? 1 : 0,
    drawn: team1Score === team2Score ? 1 : 0,
    lost: team1Score < team2Score ? 1 : 0
  });
}


// Ana sayfa için leaderboard'lar
const topScorers = await standingsApi.getPlayersCombinedStats(leagueId, seasonId)
  .sort((a, b) => b.goalsScored - a.goalsScored)
  .slice(0, 10);

const topRated = await standingsApi.getTopRatedPlayers(leagueId, seasonId, 10);
const mvpLeaders = await standingsApi.getMVPLeaderboard(leagueId, seasonId, 10);
const topFriendly = await standingsApi.getTopFriendlyPlayers(leagueId, seasonId, 10);


// Detaylı oyuncu istatistikleri
const playerDetail = await standingsApi.getPlayerStandingDetail(leagueId, seasonId, playerId);

console.log(`
  Total Matches: ${playerDetail.totalMatches}
  League Win Rate: ${playerDetail.leagueWinRate}%
  Friendly Win Rate: ${playerDetail.friendlyWinRate}%
  Average Goals: ${playerDetail.averageGoalsPerMatch}
  Rating: ${playerDetail.rating} ⭐
  MVP Count: ${playerDetail.mvpCount}
`);



// İki oyuncuyu karşılaştır
const comparison = await standingsApi.comparePlayers(
  leagueId,
  seasonId,
  currentPlayer,
  rivalPlayer
);

if (comparison.comparison.goalsDiff > 0) {
  console.log('You scored more goals! 🎯');
}
if (comparison.comparison.ratingDiff > 0) {
  console.log('You have better rating! ⭐');
}

*/