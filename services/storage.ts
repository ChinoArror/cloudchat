import { User, Message, FriendRequest, UserRole, FriendRequestStatus, UserStatus } from '../types';
import { ADMIN_CREDENTIALS, ADMIN_USER_ID, ENCRYPTION_SECRET } from '../constants';

// --- Encryption Logic (AES Simulation via XOR+Base64) ---
// This ensures that message content stored in LocalStorage is not readable as plain text.
// In a production GCP environment, this would be replaced by server-side encryption 
// and HTTPS (TLS) for data in transit.
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

// --- Storage Keys ---
const KEYS = {
  USERS: 'cc_users',
  MESSAGES: 'cc_messages',
  FRIEND_REQUESTS: 'cc_friend_requests',
};

// --- Helper: Initial Data Seeding ---
const initializeStorage = () => {
  let users: User[] = [];
  try {
    const stored = localStorage.getItem(KEYS.USERS);
    if (stored) {
      users = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse users", e);
    users = [];
  }

  // Ensure Root Admin exists, is ACTIVE, and is protected
  const adminIndex = users.findIndex(u => u.id === ADMIN_USER_ID);
  
  const rootAdminData: User = {
    id: ADMIN_USER_ID,
    username: ADMIN_CREDENTIALS.username,
    password: ADMIN_CREDENTIALS.password,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE, // Root admin cannot be paused by default logic here
    createdAt: Date.now(),
    avatar: 'https://picsum.photos/seed/admin/200/200'
  };

  if (adminIndex >= 0) {
    // Preserve existing avatar if changed, but enforce ID/Role/Username integrity for root
    users[adminIndex] = { 
      ...users[adminIndex],
      username: ADMIN_CREDENTIALS.username, // Enforce root username
      role: UserRole.ADMIN, // Enforce root role
      status: UserStatus.ACTIVE // Enforce active status
    };
    // We allow password changes via the UI, so we don't overwrite password here unless we want to reset it.
    // For this demo, let's strictly enforce the constant password on reload to avoid lockout if localStorage persists.
    // In a real app, you wouldn't reset password on every app load.
    users[adminIndex].password = ADMIN_CREDENTIALS.password; 
  } else {
    // Create new root admin
    users.push(rootAdminData);
  }

  // Migration: Ensure all users have a status
  users = users.map(u => ({
    ...u,
    status: u.status || UserStatus.ACTIVE
  }));

  localStorage.setItem(KEYS.USERS, JSON.stringify(users));

  if (!localStorage.getItem(KEYS.MESSAGES)) localStorage.setItem(KEYS.MESSAGES, JSON.stringify([]));
  if (!localStorage.getItem(KEYS.FRIEND_REQUESTS)) localStorage.setItem(KEYS.FRIEND_REQUESTS, JSON.stringify([]));
};

initializeStorage();

// --- User Services ---
export const getUsers = (): User[] => {
  const users = localStorage.getItem(KEYS.USERS);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const deleteUser = (userId: string): void => {
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const findUserByUsername = (username: string): User | undefined => {
  return getUsers().find(u => u.username === username);
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find(u => u.id === id);
};

export const updateUserStatus = (userId: string, status: UserStatus): void => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user && userId !== ADMIN_USER_ID) { // Double check: prevent pausing root admin
    user.status = status;
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
};

// --- Message Services ---
export const getMessages = (user1Id: string, user2Id: string): Message[] => {
  const allMessages: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
  
  // Filter messages between the two users
  const conversation = allMessages.filter(m => 
    (m.senderId === user1Id && m.receiverId === user2Id) ||
    (m.senderId === user2Id && m.receiverId === user1Id)
  );

  // Decrypt content for display
  return conversation.map(m => ({
    ...m,
    content: decrypt(m.content)
  })).sort((a, b) => a.timestamp - b.timestamp);
};

export const sendMessage = (senderId: string, receiverId: string, content: string, type: 'text' | 'emoji' = 'text'): Message => {
  const allMessages: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
  
  const newMessage: Message = {
    id: crypto.randomUUID(),
    senderId,
    receiverId,
    content: encrypt(content), // Encrypt before storing
    timestamp: Date.now(),
    type
  };

  allMessages.push(newMessage);
  localStorage.setItem(KEYS.MESSAGES, JSON.stringify(allMessages));
  return { ...newMessage, content }; // Return unencrypted for UI update
};

// --- Friend Services ---
export const getFriendRequests = (userId: string): FriendRequest[] => {
  const requests: FriendRequest[] = JSON.parse(localStorage.getItem(KEYS.FRIEND_REQUESTS) || '[]');
  return requests.filter(r => r.toUserId === userId && r.status === FriendRequestStatus.PENDING);
};

export const getSentRequests = (userId: string): FriendRequest[] => {
  const requests: FriendRequest[] = JSON.parse(localStorage.getItem(KEYS.FRIEND_REQUESTS) || '[]');
  return requests.filter(r => r.fromUserId === userId && r.status === FriendRequestStatus.PENDING);
};

export const sendFriendRequest = (fromUserId: string, toUsername: string): { success: boolean, message: string } => {
  const targetUser = findUserByUsername(toUsername);
  if (!targetUser) return { success: false, message: 'User not found.' };
  if (targetUser.id === fromUserId) return { success: false, message: 'Cannot add yourself.' };
  if (targetUser.status === UserStatus.PAUSED) return { success: false, message: 'User is currently unavailable.' };

  const requests: FriendRequest[] = JSON.parse(localStorage.getItem(KEYS.FRIEND_REQUESTS) || '[]');
  
  // Check if already friends or requested
  const existing = requests.find(r => 
    ((r.fromUserId === fromUserId && r.toUserId === targetUser.id) || 
     (r.fromUserId === targetUser.id && r.toUserId === fromUserId)) &&
    (r.status === FriendRequestStatus.PENDING || r.status === FriendRequestStatus.ACCEPTED)
  );

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

  requests.push(newRequest);
  localStorage.setItem(KEYS.FRIEND_REQUESTS, JSON.stringify(requests));
  return { success: true, message: 'Friend request sent.' };
};

export const respondToRequest = (requestId: string, status: FriendRequestStatus): void => {
  const requests: FriendRequest[] = JSON.parse(localStorage.getItem(KEYS.FRIEND_REQUESTS) || '[]');
  const index = requests.findIndex(r => r.id === requestId);
  if (index >= 0) {
    requests[index].status = status;
    localStorage.setItem(KEYS.FRIEND_REQUESTS, JSON.stringify(requests));
  }
};

export const getFriends = (userId: string): User[] => {
  const requests: FriendRequest[] = JSON.parse(localStorage.getItem(KEYS.FRIEND_REQUESTS) || '[]');
  const accepted = requests.filter(r => r.status === FriendRequestStatus.ACCEPTED && (r.fromUserId === userId || r.toUserId === userId));
  
  const friendIds = accepted.map(r => r.fromUserId === userId ? r.toUserId : r.fromUserId);
  const allUsers = getUsers();
  
  // Filter only active users (optional: you might want to see paused friends but disable chat)
  // For now, we return all, but UI might indicate they are paused.
  return allUsers.filter(u => friendIds.includes(u.id));
};