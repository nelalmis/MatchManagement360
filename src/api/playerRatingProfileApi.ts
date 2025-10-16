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

/*
REQUIRED FIREBASE INDEXES:

Collection: playerRatingProfiles
1. leagueId (ASC) + seasonId (ASC) + totalRatingsReceived (DESC) + overallRating (DESC)
2. leagueId (ASC) + seasonId (ASC) + ratingTrend (ASC) + totalRatingsReceived (DESC)
3. leagueId (ASC) + seasonId (ASC) + mvpCount (DESC) + mvpRate (DESC)
4. playerId (ASC) + lastUpdated (DESC)
5. leagueId (ASC) + seasonId (ASC) + overallRating (DESC)
6. leagueId (ASC) + seasonId (ASC) + overallRating (ASC/DESC range query)
*/

const profileCollectionName = 'playerRatingProfiles';

export const playerRatingProfileApi = {
    add: async (data: any) => {
        return addBase(profileCollectionName, data);
    },

    update: async (id: string, data: any) => {
        return updateBase(profileCollectionName, id, data);
    },

    delete: async (id: string) => {
        return deleteByIdBase(profileCollectionName, id);
    },

    getById: async (id: string) => {
        return getByIdBase(profileCollectionName, id);
    },

    getAll: async () => {
        return getAllBase(profileCollectionName);
    },

    // ============================================
    // BASIC QUERIES
    // ============================================

    getProfileByPlayerLeagueSeason: async (playerId: string, leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('playerId', '==', playerId),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return null;
            
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Profil getirilemedi:', error);
            return null;
        }
    },

    getProfilesByPlayer: async (playerId: string) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('playerId', '==', playerId),
                orderBy('lastUpdated', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncu profilleri getirilemedi:', error);
            return [];
        }
    },

    getProfilesByLeagueSeason: async (leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('overallRating', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig/sezon profilleri getirilemedi:', error);
            return [];
        }
    },

    // ============================================
    // LEADERBOARDS
    // ============================================

    getTopRatedPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                where('totalRatingsReceived', '>=', 3),
                orderBy('totalRatingsReceived', 'desc'),
                orderBy('overallRating', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Top rated players getirilemedi:', error);
            // Fallback: simple query + client-side sort
            try {
                const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
                return profiles
                    .filter((p: any) => p.totalRatingsReceived >= 3)
                    .sort((a: any, b: any) => b.overallRating - a.overallRating)
                    .slice(0, limitCount);
            } catch (fallbackError) {
                console.error('Fallback query failed:', fallbackError);
                return [];
            }
        }
    },

    getMostImprovedPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                where('ratingTrend', '==', 'improving'),
                where('totalRatingsReceived', '>=', 3),
                orderBy('totalRatingsReceived', 'desc'),
                orderBy('overallRating', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Most improved players getirilemedi:', error);
            // Fallback
            try {
                const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
                return profiles
                    .filter((p: any) => p.ratingTrend === 'improving' && p.totalRatingsReceived >= 3)
                    .sort((a: any, b: any) => b.overallRating - a.overallRating)
                    .slice(0, limitCount);
            } catch (fallbackError) {
                return [];
            }
        }
    },

    getMVPLeaders: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('mvpCount', 'desc'),
                orderBy('mvpRate', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('MVP leaders getirilemedi:', error);
            // Fallback
            try {
                const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
                return profiles
                    .sort((a: any, b: any) => {
                        if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
                        return b.mvpRate - a.mvpRate;
                    })
                    .slice(0, limitCount);
            } catch (fallbackError) {
                return [];
            }
        }
    },

    getConsistentPerformers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                where('ratingTrend', '==', 'stable'),
                where('overallRating', '>=', 4.0),
                orderBy('overallRating', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Consistent performers getirilemedi:', error);
            // Fallback
            try {
                const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
                return profiles
                    .filter((p: any) => p.ratingTrend === 'stable' && p.overallRating >= 4.0)
                    .sort((a: any, b: any) => b.overallRating - a.overallRating)
                    .slice(0, limitCount);
            } catch (fallbackError) {
                return [];
            }
        }
    },

    // ============================================
    // NEW: FRIENDLY MATCH RATINGS
    // ============================================

    /**
     * Get top rated players in friendly matches
     */
    getTopFriendlyRatedPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
            
            return profiles
                .filter((p: any) => p.friendly && p.friendly.totalRatingsReceived >= 3)
                .sort((a: any, b: any) => {
                    const aRating = a.friendly?.overallRating || 0;
                    const bRating = b.friendly?.overallRating || 0;
                    return bRating - aRating;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('Top friendly rated players getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get top rated players in league matches
     */
    getTopLeagueRatedPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
            
            return profiles
                .filter((p: any) => p.league && p.league.totalRatingsReceived >= 3)
                .sort((a: any, b: any) => {
                    const aRating = a.league?.overallRating || 0;
                    const bRating = b.league?.overallRating || 0;
                    return bRating - aRating;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('Top league rated players getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get player rating comparison (league vs friendly)
     */
    getPlayerRatingComparison: async (playerId: string, leagueId: string, seasonId: string) => {
        try {
            const profile: any = await playerRatingProfileApi.getProfileByPlayerLeagueSeason(
                playerId,
                leagueId,
                seasonId
            );
            
            if (!profile) return null;

            return {
                playerId,
                leagueId,
                seasonId,
                overall: profile.overall || {
                    overallRating: profile.overallRating || 0,
                    totalRatingsReceived: profile.totalRatingsReceived || 0,
                    mvpCount: profile.mvpCount || 0,
                    mvpRate: profile.mvpRate || 0
                },
                league: profile.league || {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0
                },
                friendly: profile.friendly || {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0
                },
                ratingTrend: profile.ratingTrend || 'stable',
                categoryAverages: profile.categoryAverages
            };
        } catch (error) {
            console.error('Player rating comparison getirilemedi:', error);
            return null;
        }
    },

    /**
     * Get MVP leaders by match type
     */
    getMVPLeadersByType: async (
        leagueId: string,
        seasonId: string,
        matchType: 'overall' | 'league' | 'friendly',
        limitCount: number = 10
    ) => {
        try {
            const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
            
            return profiles
                .map((p: any) => {
                    let mvpCount = 0;
                    let mvpRate = 0;
                    
                    if (matchType === 'overall' && p.overall) {
                        mvpCount = p.overall.mvpCount || 0;
                        mvpRate = p.overall.mvpRate || 0;
                    } else if (matchType === 'league' && p.league) {
                        mvpCount = p.league.mvpCount || 0;
                        mvpRate = p.league.mvpRate || 0;
                    } else if (matchType === 'friendly' && p.friendly) {
                        mvpCount = p.friendly.mvpCount || 0;
                        mvpRate = p.friendly.mvpRate || 0;
                    } else {
                        mvpCount = p.mvpCount || 0;
                        mvpRate = p.mvpRate || 0;
                    }
                    
                    return {
                        ...p,
                        mvpCount,
                        mvpRate
                    };
                })
                .filter((p: any) => p.mvpCount > 0)
                .sort((a: any, b: any) => {
                    if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
                    return b.mvpRate - a.mvpRate;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('MVP leaders by type getirilemedi:', error);
            return [];
        }
    },

    // ============================================
    // UTILITY METHODS
    // ============================================

    getProfilesByRatingRange: async (
        leagueId: string,
        seasonId: string,
        minRating: number,
        maxRating: number
    ) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                where('overallRating', '>=', minRating),
                where('overallRating', '<=', maxRating),
                orderBy('overallRating', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Rating range query failed:', error);
            // Fallback
            try {
                const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
                return profiles.filter((p: any) => 
                    p.overallRating >= minRating && p.overallRating <= maxRating
                );
            } catch (fallbackError) {
                return [];
            }
        }
    },

    deleteProfilesBySeason: async (leagueId: string, seasonId: string) => {
        try {
            const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
            
            const deletePromises = profiles.map((profile: any) => 
                deleteByIdBase(profileCollectionName, profile.id)
            );

            await Promise.all(deletePromises);
            return { success: true, deletedCount: profiles.length };
        } catch (error) {
            console.error('Season profiles deletion failed:', error);
            return { success: false, deletedCount: 0 };
        }
    },

    /**
     * Get rating statistics summary
     */
    getRatingSummary: async (leagueId: string, seasonId: string) => {
        try {
            const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
            
            if (profiles.length === 0) {
                return null;
            }

            const summary = {
                totalPlayers: profiles.length,
                averageOverallRating: 0,
                averageLeagueRating: 0,
                averageFriendlyRating: 0,
                totalRatingsGiven: 0,
                totalLeagueRatings: 0,
                totalFriendlyRatings: 0,
                totalMVPs: 0,
                playersWithFriendlyRatings: 0,
                improvingPlayers: 0,
                decliningPlayers: 0
            };

            profiles.forEach((p: any) => {
                summary.averageOverallRating += p.overallRating || 0;
                summary.totalRatingsGiven += p.totalRatingsReceived || 0;
                summary.totalMVPs += p.mvpCount || 0;
                
                if (p.league) {
                    summary.averageLeagueRating += p.league.overallRating || 0;
                    summary.totalLeagueRatings += p.league.totalRatingsReceived || 0;
                }
                
                if (p.friendly) {
                    summary.averageFriendlyRating += p.friendly.overallRating || 0;
                    summary.totalFriendlyRatings += p.friendly.totalRatingsReceived || 0;
                    if (p.friendly.totalRatingsReceived > 0) {
                        summary.playersWithFriendlyRatings++;
                    }
                }
                
                if (p.ratingTrend === 'improving') summary.improvingPlayers++;
                if (p.ratingTrend === 'declining') summary.decliningPlayers++;
            });

            summary.averageOverallRating = summary.averageOverallRating / profiles.length;
            summary.averageLeagueRating = summary.averageLeagueRating / profiles.length;
            summary.averageFriendlyRating = summary.playersWithFriendlyRatings > 0
                ? summary.averageFriendlyRating / summary.playersWithFriendlyRatings
                : 0;

            return summary;
        } catch (error) {
            console.error('Rating summary getirilemedi:', error);
            return null;
        }
    }
};