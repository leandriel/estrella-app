import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  if (!userDoc.exists()) throw new Error('Usuario no encontrado en la base de datos');
  return userDoc.data() as User;
};

export const logout = () => signOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const getCurrentUserProfile = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
};

export const updatePushToken = async (userId: string, token: string) => {
  await updateDoc(doc(db, 'users', userId), { expoPushToken: token });
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    const profile = await getCurrentUserProfile(firebaseUser.uid);
    callback(profile);
  });
};
