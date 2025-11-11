// // src/services/authService.ts
// import { authApi } from "../api/authApi";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export const authService = {
//   async login(phone: string, password: string) {
//     const response = await authApi.login(phone, password);

//     if (response?.token) {
//       await AsyncStorage.setItem("token", response.token);
//     }

//     return response.user;
//   },

//   async getProfile() {
//     const profile = await authApi.getProfile();
//     return {
//       id: profile.id,
//       name: profile.name,
//       phone: profile.phone,
//       team: profile.teamName,
//     };
//   },

//   async logout() {
//     await AsyncStorage.removeItem("token");
//   },
// };
