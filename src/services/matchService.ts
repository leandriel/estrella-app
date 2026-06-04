import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Match, Goal, StandingEntry } from '../types';
import { recalculateStandings } from '../utils/standings';
import { broadcastGoalNotification, broadcastMatchNotification } from './notificationService';
import { getDivisionById } from '../constants/divisions';

export const getMatches = async (): Promise<Match[]> => {
  const snap = await getDocs(query(collection(db, 'matches'), orderBy('scheduledAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
};

export const getMatchesByDivision = async (divisionId: string): Promise<Match[]> => {
  const q = query(
    collection(db, 'matches'),
    where('divisionId', '==', divisionId),
    orderBy('scheduledAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
};

export const getLiveMatches = async (): Promise<Match[]> => {
  const q = query(collection(db, 'matches'), where('status', '==', 'live'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
};

export const subscribeToLiveMatches = (callback: (matches: Match[]) => void): Unsubscribe => {
  const q = query(collection(db, 'matches'), where('status', '==', 'live'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match)));
  });
};

export const updateMatchScore = async (
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<void> => {
  await updateDoc(doc(db, 'matches', matchId), { homeScore, awayScore });
};

export const addGoal = async (
  matchId: string,
  playerId: string,
  playerName: string,
  team: 'home' | 'away',
  minute?: number
): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) throw new Error('Partido no encontrado');

  const match = matchSnap.data() as Match;
  const goal: Goal = {
    id: `${Date.now()}`,
    matchId,
    playerId,
    playerName,
    team,
    minute,
    timestamp: Date.now(),
  };

  const updatedGoals = [...(match.goals || []), goal];
  const newHomeScore = team === 'home' ? match.homeScore + 1 : match.homeScore;
  const newAwayScore = team === 'away' ? match.awayScore + 1 : match.awayScore;

  await updateDoc(matchRef, {
    goals: updatedGoals,
    homeScore: newHomeScore,
    awayScore: newAwayScore,
  });

  const division = getDivisionById(match.divisionId);
  const score = `${match.homeTeam} ${newHomeScore} - ${newAwayScore} ${match.awayTeam}`;
  await broadcastGoalNotification(playerName, team === 'home' ? match.homeTeam : match.awayTeam, division?.label ?? '', score);
};

export const finishMatch = async (matchId: string): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) return;

  const match = { id: matchId, ...matchSnap.data() } as Match;
  await updateDoc(matchRef, { status: 'finished' });

  const division = getDivisionById(match.divisionId);
  await broadcastMatchNotification(
    'Partido finalizado',
    `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam} | ${division?.label ?? ''}`
  );

  // Recalculate standings after match ends
  if (match.championshipId) {
    await recalculateStandings(match.championshipId, match.divisionId);
  }
};

export const setMatchStatus = async (matchId: string, status: Match['status'], reason?: string) => {
  const update: Partial<Match> = { status };
  if (reason) update.suspensionReason = reason;
  await updateDoc(doc(db, 'matches', matchId), update);

  if (status === 'suspended') {
    const matchSnap = await getDoc(doc(db, 'matches', matchId));
    if (matchSnap.exists()) {
      const match = matchSnap.data() as Match;
      const division = getDivisionById(match.divisionId);
      await broadcastMatchNotification(
        'Partido suspendido',
        `El partido ${match.homeTeam} vs ${match.awayTeam} (${division?.label ?? ''}) fue suspendido. ${reason ?? ''}`
      );
    }
  }
};

export const getPlayersByDivision = async (divisionId: string) => {
  const q = query(
    collection(db, 'users'),
    where('divisionId', '==', divisionId),
    where('role', '==', 'user')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
