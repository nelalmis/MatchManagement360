// // src/api/authApi.ts
// import baseApi from "./baseApi";

// export const authApi = {
//   login: async (phone: string, password: string) => {
//     const response = await baseApi.post("/auth/login", { phone, password });
//     return response.data;
//   },

//   register: async (userData: any) => {
//     const response = await baseApi.post("/auth/register", userData);
//     return response.data;
//   },

//   getProfile: async () => {
//     const response = await baseApi.get("/auth/profile");
//     return response.data;
//   },
// };
