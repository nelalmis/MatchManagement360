// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYGeOzB8nZPnWBLs_lEu1136XTngFe86g",
  authDomain: "matchmanagement360.firebaseapp.com",
  projectId: "matchmanagement360",
  storageBucket: "matchmanagement360.firebasestorage.app",
  messagingSenderId: "1085707335219",
  appId: "1:1085707335219:web:54694271b8969278b95546",
  measurementId: "G-S9MJ2BRXK8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Auth ve Firestore'u export et
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;