
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLlx2y0YD2tlLTpGGDbUizs7qAywyQ18g",
  authDomain: "ez-perfil-webinars.firebaseapp.com",
  projectId: "ez-perfil-webinars",
  storageBucket: "ez-perfil-webinars.appspot.com",
  messagingSenderId: "397718659707",
  appId: "1:397718659707:web:ab56bcfd0f2ad2959438de"
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
