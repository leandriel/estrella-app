import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export type RoleName = 'admin' | 'subadmin' | 'user';

export type Roles = Partial<Record<RoleName, boolean>>;

export type Permissions = {
  createSubadmin: boolean;
  createUser: boolean;
  modifyUser: boolean;
  createFixture: boolean;
  modifyFixture: boolean;
  deleteFixture: boolean;
  startLiveMatch: boolean;
  modifyLiveScore: boolean;
  createNews: boolean;
  modifyNews: boolean;
  deleteNews: boolean;
  createCategory: boolean;
  modifyCategory: boolean;
  deleteCategory: boolean;
  addPlayerToCategory: boolean;
  viewFixtures: boolean;
  viewLiveMatches: boolean;
  viewNews: boolean;
  viewPayments: boolean;
  [key: string]: boolean;
};

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  surname?: string;
  isPlayer?: boolean;
  roles?: Roles;
  permissions?: Permissions;
  metadata?: { [key: string]: any };
}

export function hasPermission(profile: UserProfile | null, permission: keyof Permissions) {
  return !!profile?.permissions?.[permission];
}

export function getUserProfilePermissions(profile: UserProfile | null): Permissions {
  return profile?.permissions ?? {
    createSubadmin: false,
    createUser: false,
    modifyUser: false,
    createFixture: false,
    modifyFixture: false,
    deleteFixture: false,
    startLiveMatch: false,
    modifyLiveScore: false,
    createNews: false,
    modifyNews: false,
    deleteNews: false,
    createCategory: false,
    modifyCategory: false,
    deleteCategory: false,
    addPlayerToCategory: false,
    viewFixtures: false,
    viewLiveMatches: false,
    viewNews: false,
    viewPayments: false,
  };
}

export async function fetchUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const usersQuery = query(collection(db, 'users'), where('email', '==', email));
  const snapshot = await getDocs(usersQuery);
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as UserProfile;
}

export async function fetchUserProfileByUID(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userDocRef);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile by UID:', error);
    return null;
  }
}
