import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export type WorkHistoryCategory =
  | 'slovin'
  | 'sitasi'
  | 'statistik'
  | 'pesan-dosen'
  | 'pomodoro'
  | 'skripsi'
  | 'panduan';

export interface WorkHistoryEntry {
  id: string;
  ownerId: string;
  category: WorkHistoryCategory;
  title: string;
  detail: string;
  createdAtMs: number;
}

export interface UserWorkspaceData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  savedGuideIds: string[];
  likedGuideIds: string[];
  checkedStepKeys: string[];
  thesisTaskIds: string[];
  pomodoroSessionsToday: number;
  pomodoroDate: string;
}

function clampString(val: string | null | undefined, maxLen: number): string {
  return (val ?? '').trim().slice(0, maxLen);
}

function clampStringList(
  items: string[],
  maxItems: number,
  maxItemLen: number
): string[] {
  const unique = Array.from(
    new Set(
      items
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().slice(0, maxItemLen))
        .filter((item) => item.length > 0)
    )
  );
  return unique.slice(0, maxItems);
}

function clampDate(dateStr: string): string {
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr) ? dateStr : '2026-01-01';
}

function clampPomodoroCount(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(200, Math.max(0, Math.floor(n)));
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserWorkspace(
  user: User,
  localSeed: {
    savedGuideIds: string[];
    likedGuideIds: string[];
    checkedStepKeys: string[];
    thesisTaskIds: string[];
    pomodoroSessionsToday: number;
    pomodoroDate: string;
  }
): Promise<UserWorkspaceData> {
  const docPath = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const initial: UserWorkspaceData = {
        uid: user.uid,
        displayName: clampString(user.displayName || 'Mahasiswa', 120),
        email: clampString(user.email || '', 254),
        photoURL: clampString(user.photoURL || '', 500),
        savedGuideIds: clampStringList(localSeed.savedGuideIds, 40, 100),
        likedGuideIds: clampStringList(localSeed.likedGuideIds, 40, 100),
        checkedStepKeys: clampStringList(localSeed.checkedStepKeys, 200, 128),
        thesisTaskIds: clampStringList(localSeed.thesisTaskIds, 30, 64),
        pomodoroSessionsToday: clampPomodoroCount(localSeed.pomodoroSessionsToday),
        pomodoroDate: clampDate(localSeed.pomodoroDate),
      };

      await setDoc(ref, {
        ...initial,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return initial;
    }

    const existing = snap.data() as Partial<UserWorkspaceData>;
    const merged: UserWorkspaceData = {
      uid: user.uid,
      displayName: clampString(user.displayName || existing.displayName || 'Mahasiswa', 120),
      email: clampString(user.email || existing.email || '', 254),
      photoURL: clampString(user.photoURL || existing.photoURL || '', 500),
      savedGuideIds: clampStringList(
        [...(existing.savedGuideIds || []), ...localSeed.savedGuideIds],
        40,
        100
      ),
      likedGuideIds: clampStringList(
        [...(existing.likedGuideIds || []), ...localSeed.likedGuideIds],
        40,
        100
      ),
      checkedStepKeys: clampStringList(
        [...(existing.checkedStepKeys || []), ...localSeed.checkedStepKeys],
        200,
        128
      ),
      thesisTaskIds: clampStringList(
        [...(existing.thesisTaskIds || []), ...localSeed.thesisTaskIds],
        30,
        64
      ),
      pomodoroSessionsToday: clampPomodoroCount(
        existing.pomodoroDate === localSeed.pomodoroDate
          ? Math.max(existing.pomodoroSessionsToday || 0, localSeed.pomodoroSessionsToday)
          : localSeed.pomodoroSessionsToday
      ),
      pomodoroDate: clampDate(localSeed.pomodoroDate),
    };

    await updateDoc(ref, {
      displayName: merged.displayName,
      email: merged.email,
      photoURL: merged.photoURL,
      savedGuideIds: merged.savedGuideIds,
      likedGuideIds: merged.likedGuideIds,
      checkedStepKeys: merged.checkedStepKeys,
      thesisTaskIds: merged.thesisTaskIds,
      pomodoroSessionsToday: merged.pomodoroSessionsToday,
      pomodoroDate: merged.pomodoroDate,
      updatedAt: serverTimestamp(),
    });

    return merged;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function syncWorkspaceProgress(
  uid: string,
  progress: {
    savedGuideIds: string[];
    likedGuideIds: string[];
    checkedStepKeys: string[];
    thesisTaskIds: string[];
    pomodoroSessionsToday: number;
    pomodoroDate: string;
  }
): Promise<void> {
  const docPath = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  try {
    await updateDoc(ref, {
      savedGuideIds: clampStringList(progress.savedGuideIds, 40, 100),
      likedGuideIds: clampStringList(progress.likedGuideIds, 40, 100),
      checkedStepKeys: clampStringList(progress.checkedStepKeys, 200, 128),
      thesisTaskIds: clampStringList(progress.thesisTaskIds, 30, 64),
      pomodoroSessionsToday: clampPomodoroCount(progress.pomodoroSessionsToday),
      pomodoroDate: clampDate(progress.pomodoroDate),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function saveGuideNoteToCloud(
  uid: string,
  guideId: string,
  content: string
): Promise<void> {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(guideId)) return;
  const docPath = `users/${uid}/notes/${guideId}`;
  const ref = doc(db, 'users', uid, 'notes', guideId);
  const trimmed = clampString(content, 2000);

  try {
    const snap = await getDoc(ref);
    if (!trimmed) {
      if (snap.exists()) {
        await deleteDoc(ref);
      }
      return;
    }

    if (snap.exists()) {
      await updateDoc(ref, {
        content: trimmed,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: uid,
        guideId,
        content: trimmed,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function addWorkHistoryEntry(
  uid: string,
  category: WorkHistoryCategory,
  title: string,
  detail: string
): Promise<void> {
  const safeTitle = clampString(title, 160);
  if (!safeTitle) return;
  const safeDetail = clampString(detail, 1200);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const entryId = `hist_${Date.now()}_${randomSuffix}`;
  const docPath = `users/${uid}/history/${entryId}`;
  const ref = doc(db, 'users', uid, 'history', entryId);

  try {
    await setDoc(ref, {
      ownerId: uid,
      category,
      title: safeTitle,
      detail: safeDetail,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function deleteWorkHistoryEntry(
  uid: string,
  entryId: string
): Promise<void> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(entryId)) return;
  const docPath = `users/${uid}/history/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'history', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export function subscribeUserWorkspace(
  uid: string,
  onData: (workspace: UserWorkspaceData) => void,
  onError?: (err: Error) => void
): () => void {
  const docPath = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data() as Partial<UserWorkspaceData>;
      onData({
        uid,
        displayName: d.displayName || 'Mahasiswa',
        email: d.email || '',
        photoURL: d.photoURL || '',
        savedGuideIds: Array.isArray(d.savedGuideIds) ? d.savedGuideIds : [],
        likedGuideIds: Array.isArray(d.likedGuideIds) ? d.likedGuideIds : [],
        checkedStepKeys: Array.isArray(d.checkedStepKeys) ? d.checkedStepKeys : [],
        thesisTaskIds: Array.isArray(d.thesisTaskIds) ? d.thesisTaskIds : [],
        pomodoroSessionsToday:
          typeof d.pomodoroSessionsToday === 'number' ? d.pomodoroSessionsToday : 0,
        pomodoroDate: typeof d.pomodoroDate === 'string' ? d.pomodoroDate : '',
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeUserNotes(
  uid: string,
  onData: (notes: Record<string, string>) => void,
  onError?: (err: Error) => void
): () => void {
  const colPath = `users/${uid}/notes`;
  const q = query(collection(db, 'users', uid, 'notes'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const next: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as { guideId?: string; content?: string };
        const id = d.guideId || docSnap.id;
        if (typeof d.content === 'string') {
          next[id] = d.content;
        }
      });
      onData(next);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeWorkHistory(
  uid: string,
  onData: (entries: WorkHistoryEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colPath = `users/${uid}/history`;
  const q = query(
    collection(db, 'users', uid, 'history'),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: WorkHistoryEntry[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as {
          ownerId?: string;
          category?: WorkHistoryCategory;
          title?: string;
          detail?: string;
          createdAt?: Timestamp | null;
        };
        entries.push({
          id: docSnap.id,
          ownerId: d.ownerId || uid,
          category: d.category || 'panduan',
          title: d.title || 'Aktivitas tersimpan',
          detail: d.detail || '',
          createdAtMs: d.createdAt?.toMillis?.() ?? Date.now(),
        });
      });
      onData(entries);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}
