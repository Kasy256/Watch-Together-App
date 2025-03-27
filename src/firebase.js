// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCr2nxYTDOzClBhS9eC1jPgGC9dJMixXCM",
  authDomain: "watch-together-2025.firebaseapp.com",
  projectId: "watch-together-2025",
  storageBucket: "watch-together-2025.firebasestorage.app",
  messagingSenderId: "879571223945",
  appId: "1:879571223945:web:ff1464f21ba5b1408d8d58",
  measurementId: "G-F1F2523933"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth, analytics, signInWithPopup, GoogleAuthProvider };
export default app;