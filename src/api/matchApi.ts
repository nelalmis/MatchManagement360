// // src/api/matchApi.ts
// import baseApi from "./baseApi";

// export const matchApi = {
//   getMatches: async () => {
//     const response = await baseApi.get("/matches");
//     return response.data;
//   },

//   getMatchById: async (id: string) => {
//     const response = await baseApi.get(`/matches/${id}`);
//     return response.data;
//   },

//   createMatch: async (payload: {
//     name: string;
//     date: string;
//     location: string;
//   }) => {
//     const response = await baseApi.post("/matches", payload);
//     return response.data;
//   },
// };
