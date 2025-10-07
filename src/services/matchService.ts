// // src/services/matchService.ts
// import { matchApi } from "../api/matchApi";
// import { Match } from "../types/match";

import { matchApi } from "../api/matchApi";
import { IMatch } from "../types/types";

export const matchService = {
    async add(matchData: IMatch): Promise<any> {
        const response = await matchApi.add(matchData);
        return response.id;
    },
    async updateMatch(id: string, matchData: IMatch): Promise<boolean> {
        const response = await matchApi.updateMatch(id, matchData);
        return response.success;
    },
    async deleteMatchById(id: string): Promise<boolean> {
        const response = await matchApi.deleteMatchById(id);
        return response.success;
    },

    async getUserMatches(userId: string): Promise<Array<IMatch>> {
        const response = await matchApi.getUserMatches(userId);
        return response.map((m: any) => ({
            id: m.id,
            matchEndTime: m.matchEndTime,
            matchOrganizationSetupId: m.matchOrganizationSetupId,
            matchStartTime: m.matchStartTime,
            status: m.status,
            title: m.title,
            directPlayers: m.directPlayers,
            eventId: m.eventId,
            guestPlayers: m.guestPlayers,
            location: m.location,
            matchBoardSheetId: m.matchBoardSheetId,
            peterFullName: m.peterFullName,
            peterIban: m.peterIban,
            pricePerPlayer: m.pricePerPlayer,
            responseCount: m.responseCount,
            score: m.score,
            team1Players: m.team1Players,
            team2Players: m.team2Players,
            teamBuildingAuthorities: m.teamBuildingAuthorities,
            registrationEndTime:m.registrationEndTime,
            registrationTime:m.registrationTime,
            playerIdOfMatchMVP : m.playerIdOfMatchMVP
        }));
    }

    // Belirli kullanıcının maçlarını getir
// export async function getUserMatches(userId: string) {
//     try {
//         const q = query(
//             collection(db, collectionName),
//             where('userId', '==', userId)
//         );
//         const querySnapshot = await getDocs(q);
//         return querySnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));
//     } catch (error) {
//         console.error('Kullanıcı maçları getirilemedi:', error);
//         return [];
//     }
// }

// // Gerçek zamanlı dinleme (Real-time)
// export function listenToMatches(callback: (matches: any[]) => void) {
//     const unsubscribe = onSnapshot(
//         collection(db, collectionName),
//         (snapshot) => {
//             const matches = snapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data()
//             }));
//             callback(matches);
//         },
//         (error) => {
//             console.error('Dinleme hatası:', error);
//         }
//     );

//     // Cleanup için return et
//     return unsubscribe;
// }

    // async getAll(): Promise<Match[]> {
    //     const data = await matchApi.getMatches();

    //     // Örnek: gelen datayı dönüştür
    //     return data.map((m: any) => ({
    //         id: m.id,
    //         name: m.name,
    //         date: new Date(m.date),
    //         playerCount: m.players?.length ?? 0,
    //         location: m.location,
    //     }));
    // },

    // async getById(id: string): Promise<Match | null> {
    //     try {
    //         const m = await matchApi.getMatchById(id);
    //         return {
    //             id: m.id,
    //             name: m.name,
    //             date: new Date(m.date),
    //             playerCount: m.players?.length ?? 0,
    //             location: m.location,
    //         };
    //     } catch (err) {
    //         console.error("Maç bulunamadı:", err);
    //         return null;
    //     }
    // },
};
