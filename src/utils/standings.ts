import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Match, StandingEntry, Championship } from '../types';

export const calculateStandings = (
  matches: Match[],
  teams: string[],
  pointsWin = 3,
  pointsDraw = 1,
  pointsLoss = 0
): StandingEntry[] => {
  const table: Record<string, StandingEntry> = {};

  for (const team of teams) {
    table[team] = {
      teamName: team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  }

  for (const match of matches) {
    if (match.status !== 'finished') continue;

    const home = match.homeTeam;
    const away = match.awayTeam;

    if (!table[home]) {
      table[home] = { teamName: home, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    }
    if (!table[away]) {
      table[away] = { teamName: away, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    }

    const hg = match.homeScore;
    const ag = match.awayScore;

    table[home].played++;
    table[away].played++;
    table[home].goalsFor += hg;
    table[home].goalsAgainst += ag;
    table[away].goalsFor += ag;
    table[away].goalsAgainst += hg;

    if (hg > ag) {
      table[home].won++;
      table[home].points += pointsWin;
      table[away].lost++;
      table[away].points += pointsLoss;
    } else if (hg < ag) {
      table[away].won++;
      table[away].points += pointsWin;
      table[home].lost++;
      table[home].points += pointsLoss;
    } else {
      table[home].drawn++;
      table[home].points += pointsDraw;
      table[away].drawn++;
      table[away].points += pointsDraw;
    }
  }

  return Object.values(table)
    .map((e) => ({ ...e, goalDifference: e.goalsFor - e.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
};

export const recalculateStandings = async (
  championshipId: string,
  divisionId: string
): Promise<void> => {
  const champSnap = await getDoc(doc(db, 'championships', championshipId));
  if (!champSnap.exists()) return;
  const champ = champSnap.data() as Championship;

  const matchesSnap = await getDocs(
    query(
      collection(db, 'matches'),
      where('championshipId', '==', championshipId),
      where('divisionId', '==', divisionId)
    )
  );
  const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));

  if (champ.phase === 'group' && champ.groups) {
    for (const group of champ.groups) {
      const groupMatches = matches.filter((m) => m.tournamentGroup === group.id);
      const standings = calculateStandings(
        groupMatches,
        group.teams,
        champ.pointsWin,
        champ.pointsDraw,
        champ.pointsLoss
      );
      await setDoc(doc(db, 'standings', `${championshipId}_${group.id}`), {
        championshipId,
        groupId: group.id,
        groupName: group.name,
        entries: standings,
        updatedAt: Date.now(),
      });
    }
  } else {
    const standings = calculateStandings(
      matches,
      champ.teams,
      champ.pointsWin,
      champ.pointsDraw,
      champ.pointsLoss
    );
    await setDoc(doc(db, 'standings', `${championshipId}_general`), {
      championshipId,
      groupId: 'general',
      groupName: 'Tabla General',
      entries: standings,
      updatedAt: Date.now(),
    });
  }
};

export const getStandingsForChampionship = async (championshipId: string) => {
  const q = query(collection(db, 'standings'), where('championshipId', '==', championshipId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
