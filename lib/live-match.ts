import { doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { FixtureMatch, MatchGoal, MatchPeriod } from './fixtures';

export const ACTIVE_PERIODS: MatchPeriod[] = ['first_half', 'second_half', 'extra_time'];

export const PERIOD_LABELS: Record<MatchPeriod, string> = {
  first_half: 'PRIMER TIEMPO',
  half_time: 'ENTRE TIEMPO',
  second_half: 'SEGUNDO TIEMPO',
  extra_time: 'ALARGUE',
  penalties: 'PENALES',
  finished: 'FINALIZADO',
  suspended: 'SUSPENDIDO',
};

export const PERIOD_SHORT: Record<MatchPeriod, string> = {
  first_half: '1T',
  half_time: 'ET',
  second_half: '2T',
  extra_time: 'PRR',
  penalties: 'PEN',
  finished: 'FIN',
  suspended: 'SUS',
};

export function getElapsedSeconds(match: FixtureMatch): number {
  const ld = match.liveData;
  if (!ld) return 0;
  const acc = ld.timerAccumulatedSeconds ?? 0;
  if (!ld.timerRunning || !ld.timerStartedAt) return acc;
  const startMs = ld.timerStartedAt.toDate().getTime();
  return acc + Math.floor((Date.now() - startMs) / 1000);
}

export function formatElapsedTime(match: FixtureMatch, elapsedOverride?: number): string {
  const secs = elapsedOverride ?? getElapsedSeconds(match);
  const mins = Math.floor(secs / 60);
  if (match.liveData?.isFutsal) {
    const s = secs % 60;
    return `${mins}:${String(s).padStart(2, '0')}`;
  }
  return `${mins}'`;
}

export function subscribeMatch(
  matchId: string,
  callback: (match: FixtureMatch | null) => void
): () => void {
  return onSnapshot(doc(db, 'fixtures', matchId), snap => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as FixtureMatch) : null);
  });
}

export async function startMatch(matchId: string, isFutsal: boolean): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    status: 'live',
    scoreLocal: 0,
    scoreAway: 0,
    liveData: {
      period: 'first_half',
      isFutsal,
      halfDurationMinutes: isFutsal ? 20 : 45,
      timerRunning: true,
      timerStartedAt: Timestamp.now(),
      timerAccumulatedSeconds: 0,
      extraMinutes: 0,
      goals: [],
    },
  });
}

export async function pauseTimer(matchId: string, accumulatedSeconds: number): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    'liveData.timerRunning': false,
    'liveData.timerStartedAt': null,
    'liveData.timerAccumulatedSeconds': accumulatedSeconds,
  });
}

export async function resumeTimer(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    'liveData.timerRunning': true,
    'liveData.timerStartedAt': Timestamp.now(),
  });
}

export async function endFirstHalf(matchId: string, accumulatedSeconds: number): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    'liveData.period': 'half_time',
    'liveData.timerRunning': false,
    'liveData.timerStartedAt': null,
    'liveData.timerAccumulatedSeconds': accumulatedSeconds,
    'liveData.extraMinutes': 0,
  });
}

export async function startSecondHalf(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    'liveData.period': 'second_half',
    'liveData.timerRunning': true,
    'liveData.timerStartedAt': Timestamp.now(),
    'liveData.timerAccumulatedSeconds': 0,
    'liveData.extraMinutes': 0,
  });
}

export async function startExtraTime(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    'liveData.period': 'extra_time',
    'liveData.timerRunning': true,
    'liveData.timerStartedAt': Timestamp.now(),
    'liveData.timerAccumulatedSeconds': 0,
    'liveData.extraMinutes': 0,
  });
}

export async function startPenalties(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    'liveData.period': 'penalties',
    'liveData.timerRunning': false,
    'liveData.timerStartedAt': null,
  });
}

export async function endMatch(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    status: 'played',
    'liveData.period': 'finished',
    'liveData.timerRunning': false,
    'liveData.timerStartedAt': null,
  });
}

export async function suspendMatch(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    status: 'suspended',
    'liveData.timerRunning': false,
    'liveData.timerStartedAt': null,
  });
}

export async function resumeFromSuspension(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), { status: 'live' });
}

export async function setExtraMinutes(matchId: string, minutes: number): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), { 'liveData.extraMinutes': minutes });
}

export async function addGoal(
  matchId: string,
  goal: MatchGoal,
  currentGoals: MatchGoal[]
): Promise<void> {
  const newGoals = [...currentGoals, goal];
  await updateDoc(doc(db, 'fixtures', matchId), {
    'liveData.goals': newGoals,
    scoreLocal: newGoals.filter(g => g.team === 'local').length,
    scoreAway: newGoals.filter(g => g.team === 'away').length,
  });
}

export async function removeGoal(
  matchId: string,
  goalId: string,
  currentGoals: MatchGoal[]
): Promise<void> {
  const newGoals = currentGoals.filter(g => g.id !== goalId);
  await updateDoc(doc(db, 'fixtures', matchId), {
    'liveData.goals': newGoals,
    scoreLocal: newGoals.filter(g => g.team === 'local').length,
    scoreAway: newGoals.filter(g => g.team === 'away').length,
  });
}

export async function setFinalResult(
  matchId: string,
  scoreLocal: number,
  scoreAway: number
): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), {
    status: 'played',
    scoreLocal,
    scoreAway,
  });
}

// Finaliza el partido cuando los goles ya fueron cargados (el marcador está calculado)
export async function finalizeMatch(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'fixtures', matchId), { status: 'played' });
}
