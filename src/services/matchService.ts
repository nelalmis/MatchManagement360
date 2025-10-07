// // src/services/matchService.ts
// import { matchApi } from "../api/matchApi";
// import { Match } from "../types/match";

// export const matchService = {
//     async getAll(): Promise<Match[]> {
//         const data = await matchApi.getMatches();

//         // Örnek: gelen datayı dönüştür
//         return data.map((m: any) => ({
//             id: m.id,
//             name: m.name,
//             date: new Date(m.date),
//             playerCount: m.players?.length ?? 0,
//             location: m.location,
//         }));
//     },

//     async getById(id: string): Promise<Match | null> {
//         try {
//             const m = await matchApi.getMatchById(id);
//             return {
//                 id: m.id,
//                 name: m.name,
//                 date: new Date(m.date),
//                 playerCount: m.players?.length ?? 0,
//                 location: m.location,
//             };
//         } catch (err) {
//             console.error("Maç bulunamadı:", err);
//             return null;
//         }
//     },
// };
