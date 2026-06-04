import { Division } from '../constants/divisions';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  divisionId?: string;
  playerProfile?: PlayerProfile;
  expoPushToken?: string;
  createdAt: number;
}

export interface PlayerProfile {
  userId: string;
  divisionId: string;
  jerseyNumber?: number;
  position?: string;
  totalGoals: number;
  isActive: boolean;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'suspended' | 'postponed';

export interface Goal {
  id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  team: 'home' | 'away';
  minute?: number;
  timestamp: number;
}

export interface Match {
  id: string;
  divisionId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  scheduledAt: number;
  venue?: string;
  round?: string;
  goals: Goal[];
  championshipId?: string;
  tournamentGroup?: string;
  isHomeEstrella: boolean;
  suspensionReason?: string;
  notes?: string;
}

export type TrainingStatus = 'scheduled' | 'suspended' | 'completed' | 'cancelled';

export interface Training {
  id: string;
  divisionId: string;
  scheduledAt: number;
  location: string;
  status: TrainingStatus;
  suspensionReason?: string;
  notes?: string;
  coach?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  publishedAt: number;
  author: string;
  category: 'general' | 'match' | 'training' | 'achievement' | 'announcement';
  divisionId?: string;
}

export interface StandingEntry {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TournamentGroup {
  id: string;
  name: string;
  teams: string[];
  qualifyCount: number;
}

export type TournamentPhase = 'group' | 'knockout' | 'league';

export interface Championship {
  id: string;
  name: string;
  divisionId: string;
  season: string;
  phase: TournamentPhase;
  groups?: TournamentGroup[];
  teams: string[];
  startDate: number;
  endDate?: number;
  isActive: boolean;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
}

export type FeeStatus = 'pending' | 'paid' | 'overdue' | 'processing';

export interface Fee {
  id: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  status: FeeStatus;
  dueDate: number;
  paidAt?: number;
  mercadopagoPreferenceId?: string;
  mercadopagoPaymentId?: string;
  paymentUrl?: string;
  description: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sentAt: number;
  type: 'match' | 'goal' | 'news' | 'fee' | 'training' | 'general';
  read: boolean;
}

export interface AppState {
  auth: {
    user: User | null;
    loading: boolean;
    error: string | null;
  };
  matches: {
    list: Match[];
    loading: boolean;
    liveMatch: Match | null;
  };
  news: {
    list: NewsItem[];
    loading: boolean;
  };
  trainings: {
    list: Training[];
    loading: boolean;
  };
  championships: {
    list: Championship[];
    loading: boolean;
  };
  fees: {
    list: Fee[];
    loading: boolean;
  };
}
