import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export type MatchPeriod =
  | 'first_half'
  | 'half_time'
  | 'second_half'
  | 'extra_time'
  | 'penalties'
  | 'finished'
  | 'suspended';

export interface MatchGoal {
  id: string;
  team: 'local' | 'away';
  playerId: string | null;
  playerName: string | null;
  minute: number | null;
}

export interface LiveMatchData {
  period: MatchPeriod;
  isFutsal: boolean;
  halfDurationMinutes: number;
  timerRunning: boolean;
  timerStartedAt: { toDate: () => Date; seconds: number } | null;
  timerAccumulatedSeconds: number;
  extraMinutes: number;
  goals: MatchGoal[];
}

export interface FixtureMatch {
  id: string;
  categoryId: string;
  league: string;
  season: string;
  fechaNum: number;
  zona: string;
  localTeam: string;
  awayTeam: string;
  matchDate: { toDate: () => Date; seconds: number } | null;
  matchTime: string | null;
  venue: string | null;
  scoreLocal: number | null;
  scoreAway: number | null;
  status: 'pending' | 'live' | 'played' | 'suspended';
  order: number;
  liveData?: LiveMatchData;
}

export interface StandingRow {
  team: string;
  pj: number; pg: number; pe: number; pp: number;
  gf: number; gc: number; dif: number; pts: number;
}

export function matchToDate(match: FixtureMatch): Date | null {
  if (!match.matchDate) return null;
  const md = match.matchDate as any;
  return md.toDate ? md.toDate() : new Date(md.seconds * 1000);
}

// Argentina UTC-3
export function toArgDateStr(date: Date): string {
  const d = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function matchArgDateStr(match: FixtureMatch): string | null {
  const d = matchToDate(match);
  return d ? toArgDateStr(d) : null;
}

export function subscribeEstrellaDeSurMatches(
  callback: (matches: FixtureMatch[]) => void
): () => void {
  const q1 = query(collection(db, 'fixtures'), where('localTeam', '==', 'ESTRELLA DEL SUR'));
  const q2 = query(collection(db, 'fixtures'), where('awayTeam', '==', 'ESTRELLA DEL SUR'));

  let results1: FixtureMatch[] = [];
  let results2: FixtureMatch[] = [];

  const merge = () => {
    const seen = new Set<string>();
    const merged: FixtureMatch[] = [];
    for (const m of [...results1, ...results2]) {
      if (!seen.has(m.id)) { seen.add(m.id); merged.push(m); }
    }
    merged.sort((a, b) => {
      const sa = (a.matchDate as any)?.seconds ?? Infinity;
      const sb = (b.matchDate as any)?.seconds ?? Infinity;
      return sa - sb;
    });
    callback(merged);
  };

  const unsub1 = onSnapshot(q1, snap => {
    results1 = snap.docs.map(d => ({ id: d.id, ...d.data() } as FixtureMatch));
    merge();
  });
  const unsub2 = onSnapshot(q2, snap => {
    results2 = snap.docs.map(d => ({ id: d.id, ...d.data() } as FixtureMatch));
    merge();
  });

  return () => { unsub1(); unsub2(); };
}

export async function fetchEstrellaDeSurMatches(): Promise<FixtureMatch[]> {
  const [s1, s2] = await Promise.all([
    getDocs(query(collection(db, 'fixtures'), where('localTeam', '==', 'ESTRELLA DEL SUR'))),
    getDocs(query(collection(db, 'fixtures'), where('awayTeam', '==', 'ESTRELLA DEL SUR'))),
  ]);
  return [
    ...s1.docs.map(d => ({ id: d.id, ...d.data() } as FixtureMatch)),
    ...s2.docs.map(d => ({ id: d.id, ...d.data() } as FixtureMatch)),
  ].sort((a, b) => {
    const sa = (a.matchDate as any)?.seconds ?? Infinity;
    const sb = (b.matchDate as any)?.seconds ?? Infinity;
    return sa - sb;
  });
}

export async function fetchFixtureByCategory(categoryId: string): Promise<FixtureMatch[]> {
  const snap = await getDocs(query(collection(db, 'fixtures'), where('categoryId', '==', categoryId)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as FixtureMatch))
    .sort((a, b) => a.fechaNum - b.fechaNum || a.order - b.order);
}

export function calculateStandings(matches: FixtureMatch[]): StandingRow[] {
  const table: Record<string, StandingRow> = {};
  for (const m of matches) {
    if (m.zona !== 'Zona A') continue;
    for (const team of [m.localTeam, m.awayTeam]) {
      if (!table[team]) table[team] = { team, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
    }
    if (m.status === 'played' && m.scoreLocal !== null && m.scoreAway !== null) {
      const L = table[m.localTeam], A = table[m.awayTeam];
      L.pj++; A.pj++;
      L.gf += m.scoreLocal; L.gc += m.scoreAway;
      A.gf += m.scoreAway; A.gc += m.scoreLocal;
      if (m.scoreLocal > m.scoreAway) { L.pg++; L.pts += 3; A.pp++; }
      else if (m.scoreLocal < m.scoreAway) { A.pg++; A.pts += 3; L.pp++; }
      else { L.pe++; L.pts++; A.pe++; A.pts++; }
    }
  }
  return Object.values(table)
    .map(r => ({ ...r, dif: r.gf - r.gc }))
    .sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf || a.team.localeCompare(b.team));
}
