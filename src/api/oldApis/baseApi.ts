// // src/api/baseApi.ts
// import axios from "axios";

// const baseApi = axios.create({
//   baseURL: "https://api.example.com",
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Request interceptor (örneğin token eklemek için)
// baseApi.interceptors.request.use(async (config) => {
//   // örnek token ekleme
//   const token = "user_token"; // storage'dan çekebilirsin
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default baseApi;
