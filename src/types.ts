export type CrowdLevel = 'Low' | 'Medium' | 'High' | 'Overcrowded';
export type Priority = 'Normal' | 'High' | 'Urgent';
export type UserRole = 'public' | 'admin';

export interface Gate {
  id: string;
  name: string;
  crowdLevel: CrowdLevel;
  waitTime: number;
  lastUpdated: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface UserReport {
  id: string;
  userId: string;
  userName?: string;
  gateId: string;
  crowdLevel: CrowdLevel;
  comment?: string;
  imageUrl?: string;
  timestamp: string;
  votes: number;
  voters: string[];
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  timestamp: string;
  authorId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}
