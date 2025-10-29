import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './config';

export class FirestoreService {
  constructor(private collectionName: string) {}

  async getDocument(id: string) {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  async getAllDocuments() {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async setDocument(id: string, data: any) {
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, data, { merge: true });
    return { id, ...data };
  }

  async updateDocument(id: string, data: any) {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data);
    return { id, ...data };
  }

  async deleteDocument(id: string) {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
    return id;
  }

  async queryDocuments(queryConstraints: QueryConstraint[]) {
    const q = query(collection(db, this.collectionName), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}