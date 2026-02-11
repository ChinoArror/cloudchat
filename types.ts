export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
}

export interface User {
  id: string;
  username: string;
  password?: string; // Only used for verification, simulated storage
  role: UserRole;
  status: UserStatus; // New field for suspension
  avatar?: string;
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string; // Encrypted content
  timestamp: number;
  type: 'text' | 'emoji';
}

export enum FriendRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  timestamp: number;
}

export interface Session {
  userId: string;
  username: string;
  role: UserRole;
  expiry: number;
}