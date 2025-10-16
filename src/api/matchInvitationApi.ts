import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    and
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'matchInvitations';

export enum MatchType {
    LEAGUE = 'LEAGUE',
    FRIENDLY = 'FRIENDLY',
    TOURNAMENT = 'TOURNAMENT'
}

export interface IMatchInvitation {
    id: string;
    matchId: string;
    matchType: MatchType;
    inviterId: string;
    inviteeId: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    message?: string;
    sentAt: string;
    respondedAt?: string;
    expiresAt?: string;
}

export const matchInvitationApi = {
    /**
     * Add new invitation
     */
    add: async (data: Omit<IMatchInvitation, 'id'>) => {
        return addBase(collectionName, data);
    },

    /**
     * Update invitation
     */
    update: async (id: string, data: Partial<IMatchInvitation>) => {
        return updateBase(collectionName, id, data);
    },

    /**
     * Delete invitation
     */
    delete: async (id: string) => {
        return deleteByIdBase(collectionName, id);
    },

    /**
     * Get invitation by ID
     */
    getById: async (id: string) => {
        return getByIdBase(collectionName, id);
    },

    /**
     * Get all invitations
     */
    getAll: async () => {
        return getAllBase(collectionName);
    },

    /**
     * Get invitations by match ID
     */
    getByMatchId: async (matchId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('matchId', '==', matchId),
                orderBy('sentAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IMatchInvitation[];
        } catch (error) {
            console.error('Maç davetleri getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get invitations sent by inviter
     */
    getBySenderId: async (inviterId: string, limitCount: number = 50) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('inviterId', '==', inviterId),
                orderBy('sentAt', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IMatchInvitation[];
        } catch (error) {
            console.error('Gönderilen davetler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get invitations received by invitee
     */
    getByReceiverId: async (inviteeId: string, limitCount: number = 50) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('inviteeId', '==', inviteeId),
                orderBy('sentAt', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IMatchInvitation[];
        } catch (error) {
            console.error('Alınan davetler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get pending invitations for a player
     */
    getPendingInvitations: async (inviteeId: string) => {
        try {
            const now = new Date().toISOString();
            const q = query(
                collection(db, collectionName),
                where('inviteeId', '==', inviteeId),
                where('status', '==', 'pending'),
                orderBy('sentAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            
            // Filter out expired invitations client-side
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter((inv: any) => !inv.expiresAt || inv.expiresAt > now) as IMatchInvitation[];
        } catch (error) {
            console.error('Bekleyen davetler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get invitations by status
     */
    getByStatus: async (
        status: 'pending' | 'accepted' | 'declined' | 'expired',
        limitCount: number = 50
    ) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('status', '==', status),
                orderBy('sentAt', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IMatchInvitation[];
        } catch (error) {
            console.error('Durum bazlı davetler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get invitations by match type
     */
    getByMatchType: async (matchType: MatchType, limitCount: number = 50) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('matchType', '==', matchType),
                orderBy('sentAt', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IMatchInvitation[];
        } catch (error) {
            console.error('Maç tipi bazlı davetler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Check if invitation exists for a match and invitee
     */
    checkInvitationExists: async (matchId: string, inviteeId: string): Promise<IMatchInvitation | null> => {
        try {
            const q = query(
                collection(db, collectionName),
                where('matchId', '==', matchId),
                where('inviteeId', '==', inviteeId),
                orderBy('sentAt', 'desc'),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return null;
            }
            
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            } as IMatchInvitation;
        } catch (error) {
            console.error('Davet kontrolü başarısız:', error);
            return null;
        }
    },

    /**
     * Get active (pending + not expired) invitations for a match
     */
    getActiveInvitationsByMatch: async (matchId: string) => {
        try {
            const now = new Date().toISOString();
            const q = query(
                collection(db, collectionName),
                where('matchId', '==', matchId),
                where('status', '==', 'pending'),
                orderBy('sentAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter((inv: any) => !inv.expiresAt || inv.expiresAt > now) as IMatchInvitation[];
        } catch (error) {
            console.error('Aktif davetler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get expired invitations
     */
    getExpiredInvitations: async (limitCount: number = 100) => {
        try {
            const now = new Date().toISOString();
            const q = query(
                collection(db, collectionName),
                where('status', '==', 'pending'),
                orderBy('sentAt', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter((inv: any) => inv.expiresAt && inv.expiresAt <= now) as IMatchInvitation[];
        } catch (error) {
            console.error('Süresi geçmiş davetler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get invitation statistics for a user
     */
    getInvitationStats: async (userId: string) => {
        try {
            const sent = await matchInvitationApi.getBySenderId(userId);
            const received = await matchInvitationApi.getByReceiverId(userId);
            
            return {
                sent: {
                    total: sent.length,
                    pending: sent.filter(i => i.status === 'pending').length,
                    accepted: sent.filter(i => i.status === 'accepted').length,
                    declined: sent.filter(i => i.status === 'declined').length,
                    expired: sent.filter(i => i.status === 'expired').length
                },
                received: {
                    total: received.length,
                    pending: received.filter(i => i.status === 'pending').length,
                    accepted: received.filter(i => i.status === 'accepted').length,
                    declined: received.filter(i => i.status === 'declined').length,
                    expired: received.filter(i => i.status === 'expired').length
                }
            };
        } catch (error) {
            console.error('Davet istatistikleri getirilemedi:', error);
            return {
                sent: { total: 0, pending: 0, accepted: 0, declined: 0, expired: 0 },
                received: { total: 0, pending: 0, accepted: 0, declined: 0, expired: 0 }
            };
        }
    },

    /**
     * Bulk update invitations status
     */
    bulkUpdateStatus: async (
        invitationIds: string[],
        status: 'pending' | 'accepted' | 'declined' | 'expired'
    ) => {
        try {
            const promises = invitationIds.map(id =>
                updateBase(collectionName, id, {
                    status,
                    respondedAt: status !== 'pending' ? new Date().toISOString() : undefined
                })
            );
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu güncelleme başarısız:', error);
            throw error;
        }
    },

    /**
     * Delete invitations by match ID
     */
    deleteByMatchId: async (matchId: string) => {
        try {
            const invitations = await matchInvitationApi.getByMatchId(matchId);
            const promises = invitations.map(inv => deleteByIdBase(collectionName, inv.id));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Maç davetleri silinemedi:', error);
            throw error;
        }
    }
};