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
import { MatchType } from '../types/types';

const collectionName = 'playerStats';

export const playerStatsApi = {
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

    getStatsByPlayer: async (playerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('playerId', '==', playerId),
                orderBy('seasonId', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncu istatistikleri getirilemedi:', error);
            return [];
        }
    },

    getStatsByLeague: async (leagueId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                orderBy('points', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig istatistikleri getirilemedi:', error);
            return [];
        }
    },

    getStatsByLeagueAndSeason: async (leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('points', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Sezon istatistikleri getirilemedi:', error);
            return [];
        }
    },

    getStatsByPlayerLeagueSeason: async (playerId: string, leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('playerId', '==', playerId),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId)
            );
            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return docs.length > 0 ? docs[0] : null;
        } catch (error) {
            console.error('Oyuncu-lig-sezon istatistiği getirilemedi:', error);
            return null;
        }
    },

    getTopScorers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('totalGoals', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .slice(0, limitCount);
        } catch (error) {
            console.error('Top skorerler getirilemedi:', error);
            return [];
        }
    },

    getTopAssists: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('totalAssists', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .slice(0, limitCount);
        } catch (error) {
            console.error('Top asistler getirilemedi:', error);
            return [];
        }
    },

    // ============================================
    // NEW: FRIENDLY & COMBINED STATISTICS
    // ============================================

    /**
     * Get top scorers by all matches (league + friendly)
     */
    getTopScorersByAllMatches: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const stats = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
            
            return stats
                .filter((s: any) => s.allMatches && s.allMatches.goals > 0)
                .sort((a: any, b: any) => {
                    const aGoals = a.allMatches?.goals || 0;
                    const bGoals = b.allMatches?.goals || 0;
                    return bGoals - aGoals;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('Top skorerler (all) getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get top scorers in friendly matches only
     */
    getTopFriendlyScorers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const stats = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
            
            return stats
                .filter((s: any) => s.friendlyMatches && s.friendlyMatches.goals > 0)
                .sort((a: any, b: any) => {
                    const aGoals = a.friendlyMatches?.goals || 0;
                    const bGoals = b.friendlyMatches?.goals || 0;
                    return bGoals - aGoals;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('Friendly top skorerler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get top assisters in friendly matches only
     */
    getTopFriendlyAssisters: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const stats = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
            
            return stats
                .filter((s: any) => s.friendlyMatches && s.friendlyMatches.assists > 0)
                .sort((a: any, b: any) => {
                    const aAssists = a.friendlyMatches?.assists || 0;
                    const bAssists = b.friendlyMatches?.assists || 0;
                    return bAssists - aAssists;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('Friendly top asistler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get most active players in friendly matches
     */
    getTopFriendlyPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const stats = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
            
            return stats
                .filter((s: any) => s.friendlyMatches && s.friendlyMatches.total > 0)
                .sort((a: any, b: any) => {
                    const aTotal = a.friendlyMatches?.total || 0;
                    const bTotal = b.friendlyMatches?.total || 0;
                    if (bTotal !== aTotal) return bTotal - aTotal;
                    
                    const aWins = a.friendlyMatches?.wins || 0;
                    const bWins = b.friendlyMatches?.wins || 0;
                    return bWins - aWins;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('Top friendly oyuncular getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get player statistics comparison (league vs friendly vs all)
     */
    getPlayerStatsComparison: async (playerId: string, leagueId: string, seasonId: string) => {
        try {
            const stats: any = await playerStatsApi.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
            if (!stats) return null;

            const league = stats.leagueMatches || {
                total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, points: 0
            };

            const friendly = stats.friendlyMatches || {
                total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0
            };

            const all = stats.allMatches || {
                total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0
            };

            return {
                playerId,
                leagueId,
                seasonId,
                league: {
                    ...league,
                    winRate: league.total > 0 ? ((league.wins / league.total) * 100).toFixed(1) : '0.0',
                    goalsPerMatch: league.total > 0 ? (league.goals / league.total).toFixed(2) : '0.00',
                    assistsPerMatch: league.total > 0 ? (league.assists / league.total).toFixed(2) : '0.00'
                },
                friendly: {
                    ...friendly,
                    winRate: friendly.total > 0 ? ((friendly.wins / friendly.total) * 100).toFixed(1) : '0.0',
                    goalsPerMatch: friendly.total > 0 ? (friendly.goals / friendly.total).toFixed(2) : '0.00',
                    assistsPerMatch: friendly.total > 0 ? (friendly.assists / friendly.total).toFixed(2) : '0.00'
                },
                all: {
                    ...all,
                    winRate: all.total > 0 ? ((all.wins / all.total) * 100).toFixed(1) : '0.0',
                    goalsPerMatch: all.total > 0 ? (all.goals / all.total).toFixed(2) : '0.00',
                    assistsPerMatch: all.total > 0 ? (all.assists / all.total).toFixed(2) : '0.00'
                },
                rating: stats.rating || 0,
                mvpCount: stats.mvpCount || 0,
                mvpRate: stats.mvpRate || 0
            };
        } catch (error) {
            console.error('Stats karşılaştırması getirilemedi:', error);
            return null;
        }
    },

    /**
     * Get most active players (by all matches)
     */
    getMostActivePlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const stats = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
            
            return stats
                .filter((s: any) => s.allMatches && s.allMatches.total > 0)
                .sort((a: any, b: any) => {
                    const aTotal = a.allMatches?.total || 0;
                    const bTotal = b.allMatches?.total || 0;
                    return bTotal - aTotal;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('En aktif oyuncular getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get top rated players
     */
    getTopRatedPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const stats = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
            
            return stats
                .filter((s: any) => s.totalRatingsReceived && s.totalRatingsReceived >= 3) // Min 3 ratings
                .sort((a: any, b: any) => {
                    const aRating = a.rating || 0;
                    const bRating = b.rating || 0;
                    return bRating - aRating;
                })
                .slice(0, limitCount);
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
            const stats = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
            
            return stats
                .filter((s: any) => s.mvpCount && s.mvpCount > 0)
                .sort((a: any, b: any) => {
                    const aMvp = a.mvpCount || 0;
                    const bMvp = b.mvpCount || 0;
                    if (bMvp !== aMvp) return bMvp - aMvp;
                    
                    const aMvpRate = a.mvpRate || 0;
                    const bMvpRate = b.mvpRate || 0;
                    return bMvpRate - aMvpRate;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('MVP sıralaması getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get statistics summary for league/season
     */
    getStatsSummary: async (leagueId: string, seasonId: string) => {
        try {
            const stats = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
            
            const summary = {
                totalPlayers: stats.length,
                totalLeagueMatches: 0,
                totalFriendlyMatches: 0,
                totalAllMatches: 0,
                totalLeagueGoals: 0,
                totalFriendlyGoals: 0,
                totalAllGoals: 0,
                totalLeagueAssists: 0,
                totalFriendlyAssists: 0,
                totalAllAssists: 0,
                averageRating: 0,
                totalMVPs: 0,
                playersWithFriendlyMatches: 0
            };

            let ratingSum = 0;
            let ratingCount = 0;

            stats.forEach((s: any) => {
                summary.totalLeagueMatches += s.leagueMatches?.total || 0;
                summary.totalFriendlyMatches += s.friendlyMatches?.total || 0;
                summary.totalAllMatches += s.allMatches?.total || 0;
                
                summary.totalLeagueGoals += s.leagueMatches?.goals || 0;
                summary.totalFriendlyGoals += s.friendlyMatches?.goals || 0;
                summary.totalAllGoals += s.allMatches?.goals || 0;
                
                summary.totalLeagueAssists += s.leagueMatches?.assists || 0;
                summary.totalFriendlyAssists += s.friendlyMatches?.assists || 0;
                summary.totalAllAssists += s.allMatches?.assists || 0;
                
                summary.totalMVPs += s.mvpCount || 0;
                
                if (s.friendlyMatches && s.friendlyMatches.total > 0) {
                    summary.playersWithFriendlyMatches++;
                }
                
                if (s.rating && s.rating > 0) {
                    ratingSum += s.rating;
                    ratingCount++;
                }
            });

            summary.averageRating = ratingCount > 0 
                ? parseFloat((ratingSum / ratingCount).toFixed(2))
                : 0;

            return summary;
        } catch (error) {
            console.error('Stats özeti getirilemedi:', error);
            return null;
        }
    },

    /**
     * Update rating history
     */
    addRatingToHistory: async (
        statsId: string,
        matchId: string,
        matchType: MatchType,
        rating: number
    ) => {
        try {
            const stats: any = await getByIdBase(collectionName, statsId);
            if (!stats) {
                throw new Error('İstatistik bulunamadı');
            }

            const ratingHistory = stats.ratingHistory || [];
            ratingHistory.push({
                matchId,
                matchType,
                rating,
                date: new Date().toISOString()
            });

            // Calculate new average rating
            const totalRatings = ratingHistory.reduce((sum: number, r: any) => sum + r.rating, 0);
            const newAvgRating = totalRatings / ratingHistory.length;

            return await updateBase(collectionName, statsId, {
                rating: newAvgRating,
                totalRatingsReceived: ratingHistory.length,
                ratingHistory
            });
        } catch (error) {
            console.error('Rating geçmişi güncellenemedi:', error);
            throw error;
        }
    },

    /**
     * Get rating trend
     */
    getRatingTrend: async (playerId: string, leagueId: string, seasonId: string) => {
        try {
            const stats: any = await playerStatsApi.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
            if (!stats || !stats.ratingHistory || stats.ratingHistory.length < 3) {
                return 'stable';
            }

            const history = stats.ratingHistory;
            const recentRatings = history.slice(-3).map((r: any) => r.rating);
            const oldRatings = history.slice(0, 2).map((r: any) => r.rating);

            const recentAvg = recentRatings.reduce((a: number, b: number) => a + b) / recentRatings.length;
            const oldAvg = oldRatings.reduce((a: number, b: number) => a + b) / oldRatings.length;

            const diff = recentAvg - oldAvg;

            if (diff > 0.3) return 'up';
            if (diff < -0.3) return 'down';
            return 'stable';
        } catch (error) {
            console.error('Rating trend hesaplanamadı:', error);
            return 'stable';
        }
    }
};