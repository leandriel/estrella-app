import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyD9VKbgj7VKYjWP-bhL0O0WqL3heU3dLWo",
  authDomain: "estrella-del-sur-20268.firebaseapp.com",
  projectId: "estrella-del-sur-20268",
  storageBucket: "estrella-del-sur-20268.firebasestorage.app",
  messagingSenderId: "726978708301",
  appId: "1:726978708301:web:b5ca4f43e836b108052d04",
  measurementId: "G-GVWWKGP2TN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

export default app;