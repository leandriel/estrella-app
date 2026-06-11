import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD9VKbgj7VKYjWP-bhL0O0WqL3heU3dLWo',
  authDomain: 'estrella-del-sur-20268.firebaseapp.com',
  projectId: 'estrella-del-sur-20268',
  storageBucket: 'estrella-del-sur-20268.firebasestorage.app',
  messagingSenderId: '726978708301',
  appId: '1:726978708301:web:b5ca4f43e836b108052d04',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export { firebaseConfig };
