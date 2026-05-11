export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  surname: string;
  branch?: string;
  ageCategory?: string;
  role: UserRole;
  email: string | null;
  createdAt: number;
}

export interface TypingText {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: number;
  isActive: boolean;
}

export interface TypingResult {
  id: string;
  userId: string;
  textId: string;
  wpm: number;
  accuracy: number;
  completedAt: number;
  userName: string;
  userSurname: string;
  branch: string;
  ageCategory: string;
}
