import { User, Message, FriendRequest, UserRole, FriendRequestStatus, UserStatus } from '../types';
import { ADMIN_CREDENTIALS, ADMIN_USER_ID, ENCRYPTION_SECRET, FIREBASE_CONFIG, CONFIG_STORAGE_KEY } from '../constants';
import * as firebaseApp from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  or,
  and,
  initializeFirestore
} from 'firebase/firestore';

// --- Firebase Initialization ---

// Check if config is valid (not the placeholder)
export const isFirebaseConfigured = () => {
  return FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY_HERE";
};

let app: any = null;
let dbInstance: any = null;

if (isFirebaseConfigured()) {
  try {
    app = firebaseApp.initializeApp(FIREBASE_CONFIG);
    // Initialize Firestore with settings to avoid "Backend didn't respond" errors
    // Connect explicitly to the 'chat' database as requested
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, 'chat');
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
}

export const db = dbInstance;

// Helper to save config from UI
export const saveFirebaseConfig = (config: any) => {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  window.location.reload();
};

export const resetFirebaseConfig = () => {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  window.location.reload();
};

// Check DB Connection explicitly to detect "Missing Database" error
export const checkDatabaseConnection = async (): Promise<{ ok: boolean, error?: string }> => {
  if (!db) return { ok: false, error: "Firebase not initialized" };
  try {
    // Try to read the admin user doc. 
    // If DB exists, this returns a snapshot (exists=true/false).
    // If DB does not exist, this throws an error.
    await getDoc(doc(db, 'users', ADMIN_USER_ID));
    return { ok: true };
  } catch (e: any) {
    const msg = e.message || '';
    // Detect specific Firestore "Database not found" error
    // This catches "The database (default) does not exist" OR "The database (chat) does not exist"
    if (msg.includes('does not exist') || (msg.includes('project') && msg.includes('database') && e.code === 'not-found') || e.code === 'not-found') {
      return { ok: false, error: 'database_missing' };
    }
    // Ignore offline errors for the check, assume it's just network
    if (msg.includes('offline')) {
      return { ok: true };
    }
    console.warn("DB Check failed:", e);
    return { ok: false, error: msg };
  }
};

// --- Encryption Logic (Client-side) ---
const encrypt = (text: string): string => {
  const chars = text.split('');
  const secretLen = ENCRYPTION_SECRET.length;
  const encrypted = chars.map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_SECRET.charCodeAt(i % secretLen))
  ).join('');
  return btoa(encrypted);
};

const decrypt = (cipher: string): string => {
  try {
    const text = atob(cipher);
    const secretLen = ENCRYPTION_SECRET.length;
    return text.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_SECRET.charCodeAt(i % secretLen))
    ).join('');
  } catch (e) {
    return '*** Decryption Error ***';
  }
};

// --- Helper: Initial Data Seeding ---
// Exported so App.tsx can call it only after verifying DB connection
export const initializeStorage = async () => {
  if (!db) return; // Skip if not configured

  try {
    const adminRef = doc(db, 'users', ADMIN_USER_ID);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      // Create Admin if not exists
      const rootAdminData: User = {
        id: ADMIN_USER_ID,
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        createdAt: Date.now(),
        avatar: 'https://picsum.photos/seed/admin/200/200'
      };
      await setDoc(adminRef, rootAdminData);
      console.log("Root admin initialized in Firestore.");
    } else {
      // Enforce critical fields for Root Admin
      await updateDoc(adminRef, {
        username: ADMIN_CREDENTIALS.username,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      });
    }
  } catch (e) {
    // We log it but don't crash here; App.tsx checks connection explicitly
    console.error("Error initializing Firestore data:", e);
  }
};

// --- User Services (Async) ---

export const getUsers = async (): Promise<User[]> => {
  if (!db) throw new Error("Database not initialized");
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => doc.data() as User);
};

export const saveUser = async (user: User): Promise<void> => {
  if (!db) throw new Error("Database not initialized");
  await setDoc(doc(db, 'users', user.id), user);
};

export const deleteUser = async (userId: string): Promise<void> => {
  if (!db) throw new Error("Database not initialized");
  await deleteDoc(doc(db, 'users', userId));
};

export const findUserByUsername = async (username: string): Promise<User | undefined> => {
  if (!db) throw new Error("Database not initialized");
  const q = query(collection(db, 'users'), where("username", "==", username));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return undefined;
  return querySnapshot.docs[0].data() as User;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  if (!db) return undefined; // Fail silently for session checks if DB unavailable
  const docRef = doc(db, 'users', id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
  } catch (e) {
    console.warn("Could not fetch user", id, e);
  }
  return undefined;
};

// --- Message Services (Real-time) ---

export const subscribeToMessages = (user1Id: string, user2Id: string, callback: (messages: Message[]) => void) => {
  if (!db) return () => { };

  const conversationId = [user1Id, user2Id].sort().join('_');
  const messagesRef = collection(db, 'messages');
  // Query by conversationId only to avoid composite index requirement
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data() as Message;
      return { ...data, content: decrypt(data.content) };
    });
    // Sort by timestamp asc (oldest first) since we removed orderBy from query
    messages.sort((a, b) => a.timestamp - b.timestamp);
    callback(messages);
  }, (error) => {
    console.error("Error subscribing to messages:", error);
  });
};

export const sendMessage = async (senderId: string, receiverId: string, content: string, type: 'text' | 'emoji' = 'text'): Promise<void> => {
  if (!db) throw new Error("Database not initialized");
  const conversationId = [senderId, receiverId].sort().join('_');
  const newMessage: Message = {
    id: crypto.randomUUID(),
    senderId,
    receiverId,
    content: encrypt(content),
    timestamp: Date.now(),
    type,
    conversationId
  };
  await addDoc(collection(db, 'messages'), newMessage);
};

// --- Friend Services (Async & Real-time) ---

export const subscribeToFriendRequests = (userId: string, callback: (requests: FriendRequest[]) => void) => {
  if (!db) return () => { };
  const q = query(
    collection(db, 'friend_requests'),
    where('toUserId', '==', userId),
    where('status', '==', FriendRequestStatus.PENDING)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as FriendRequest));
  }, (error) => {
    console.error("Error subscribing to friend requests:", error);
  });
};

export const subscribeToSentRequests = (userId: string, callback: (requests: FriendRequest[]) => void) => {
  if (!db) return () => { };
  const q = query(
    collection(db, 'friend_requests'),
    where('fromUserId', '==', userId),
    where('status', '==', FriendRequestStatus.PENDING)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as FriendRequest));
  }, (error) => {
    console.error("Error subscribing to sent requests:", error);
  });
};

export const sendFriendRequest = async (fromUserId: string, toUsername: string): Promise<{ success: boolean, message: string }> => {
  if (!db) return { success: false, message: "Database Error" };

  const targetUser = await findUserByUsername(toUsername);
  if (!targetUser) return { success: false, message: 'User not found.' };
  if (targetUser.id === fromUserId) return { success: false, message: 'Cannot add yourself.' };
  if (targetUser.status === UserStatus.PAUSED) return { success: false, message: 'User is currently unavailable.' };

  const q = query(
    collection(db, 'friend_requests'),
    or(
      and(where('fromUserId', '==', fromUserId), where('toUserId', '==', targetUser.id)),
      and(where('fromUserId', '==', targetUser.id), where('toUserId', '==', fromUserId))
    )
  );

  const querySnapshot = await getDocs(q);
  const existing = querySnapshot.docs
    .map(d => d.data() as FriendRequest)
    .find(r => r.status === FriendRequestStatus.PENDING || r.status === FriendRequestStatus.ACCEPTED);

  if (existing) {
    if (existing.status === FriendRequestStatus.ACCEPTED) return { success: false, message: 'Already friends.' };
    return { success: false, message: 'Request already pending.' };
  }

  const newRequest: FriendRequest = {
    id: crypto.randomUUID(),
    fromUserId,
    toUserId: targetUser.id,
    status: FriendRequestStatus.PENDING,
    timestamp: Date.now()
  };

  await setDoc(doc(db, 'friend_requests', newRequest.id), newRequest);
  return { success: true, message: 'Friend request sent.' };
};

export const respondToRequest = async (requestId: string, status: FriendRequestStatus): Promise<void> => {
  if (!db) return;
  const requestRef = doc(db, 'friend_requests', requestId);
  await updateDoc(requestRef, { status });
};

export const getFriends = async (userId: string): Promise<User[]> => {
  if (!db) return [];
  const q1 = query(collection(db, 'friend_requests'), where('status', '==', FriendRequestStatus.ACCEPTED), where('fromUserId', '==', userId));
  const q2 = query(collection(db, 'friend_requests'), where('status', '==', FriendRequestStatus.ACCEPTED), where('toUserId', '==', userId));

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const friendIds = new Set<string>();
  snap1.forEach(d => friendIds.add((d.data() as FriendRequest).toUserId));
  snap2.forEach(d => friendIds.add((d.data() as FriendRequest).fromUserId));

  if (friendIds.size === 0) return [];

  const friendPromises = Array.from(friendIds).map(fid => getUserById(fid));
  const friends = await Promise.all(friendPromises);

  return friends.filter((f): f is User => f !== undefined);
};