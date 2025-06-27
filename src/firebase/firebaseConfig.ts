import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdWgMm2Qx_3V8szX0Cacl7eJjHVnhmTuI",
  authDomain: "lzofseven.firebaseapp.com",
  projectId: "lzofseven",
  storageBucket: "lzofseven.appspot.com",
  messagingSenderId: "700366485402",
  appId: "1:700366485402:web:5c2517c4279afa4e956c23"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
