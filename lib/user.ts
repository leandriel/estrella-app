import { collection, getDocs, query, where, doc, getDoc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
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
  playerProfile?: {
    categories: string[];
  };
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

export type NewUserType = 'admin' | 'subadmin' | 'user' | 'player';

export function buildUserRoles(type: NewUserType): Roles {
  switch (type) {
    case 'admin':
      return { admin: true };
    case 'subadmin':
      return { subadmin: true };
    case 'player':
    case 'user':
    default:
      return { user: true };
  }
}

export function buildUserPermissions(roles: Roles): Permissions {
  const permissions: Permissions = {
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

  if (roles.admin) {
    permissions.createSubadmin = true;
    permissions.createUser = true;
    permissions.modifyUser = true;
    permissions.createFixture = true;
    permissions.modifyFixture = true;
    permissions.deleteFixture = true;
    permissions.startLiveMatch = true;
    permissions.modifyLiveScore = true;
    permissions.createNews = true;
    permissions.modifyNews = true;
    permissions.deleteNews = true;
    permissions.createCategory = true;
    permissions.modifyCategory = true;
    permissions.deleteCategory = true;
    permissions.addPlayerToCategory = true;
    permissions.viewFixtures = true;
    permissions.viewLiveMatches = true;
    permissions.viewNews = true;
    permissions.viewPayments = true;
  }

  if (roles.subadmin) {
    permissions.modifyFixture = true;
    permissions.deleteFixture = true;
    permissions.startLiveMatch = true;
    permissions.modifyLiveScore = true;
    permissions.createNews = true;
    permissions.modifyNews = true;
    permissions.deleteNews = true;
    permissions.viewFixtures = true;
    permissions.viewLiveMatches = true;
    permissions.viewNews = true;
    permissions.viewPayments = true;
  }

  if (roles.user && !roles.admin && !roles.subadmin) {
    permissions.viewFixtures = true;
    permissions.viewLiveMatches = true;
    permissions.viewNews = true;
    permissions.viewPayments = true;
  }

  return permissions;
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as UserProfile))
    .sort((a, b) =>
      (a.surname ?? '').localeCompare(b.surname ?? '') ||
      (a.name ?? '').localeCompare(b.name ?? '')
    );
}

export async function updateUserProfile(
  uid: string,
  firstName: string,
  lastName: string,
  userType: NewUserType,
  selectedCategories: string[]
): Promise<void> {
  const roles = buildUserRoles(userType);
  const permissions = buildUserPermissions(roles);
  const isPlayer = userType === 'player';

  const updates: Record<string, any> = {
    name: firstName,
    surname: lastName,
    displayName: `${firstName} ${lastName}`,
    roles,
    permissions,
    isPlayer,
    'metadata.updatedAt': serverTimestamp(),
  };

  if (isPlayer) {
    updates['playerProfile.categories'] = selectedCategories;
  } else {
    updates['playerProfile'] = deleteField();
  }

  await updateDoc(doc(db, 'users', uid), updates);
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
