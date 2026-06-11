import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type LeagueName = 'ADEFUL' | 'LIFUBA';
export type Surface = 'futsal' | 'campo';

export interface Category {
  id: string;
  league: LeagueName;
  surface: Surface;
  displayName: string;
  order: number;
}

export async function getCategories(): Promise<Category[]> {
  const categoriesQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
  const snapshot = await getDocs(categoriesQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Category));
}

export async function saveCategory(category: Category): Promise<void> {
  const categoryRef = doc(db, 'categories', category.id);
  await setDoc(categoryRef, {
    league: category.league,
    surface: category.surface,
    displayName: category.displayName,
    order: category.order,
  });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const categoryRef = doc(db, 'categories', categoryId);
  await deleteDoc(categoryRef);
}
