import { Match, Championship, TournamentGroup } from '../types';

export interface FixtureRound {
  round: number;
  label: string;
  matches: Array<{ home: string; away: string }>;
}

// Round-robin fixture generator (each team plays against every other once)
export const generateRoundRobin = (teams: string[]): FixtureRound[] => {
  const rounds: FixtureRound[] = [];
  const list = teams.length % 2 === 0 ? [...teams] : [...teams, 'BYE'];
  const n = list.length;
  const numRounds = n - 1;
  const half = n / 2;

  for (let round = 0; round < numRounds; round++) {
    const roundMatches: Array<{ home: string; away: string }> = [];
    for (let i = 0; i < half; i++) {
      const home = list[i];
      const away = list[n - 1 - i];
      if (home !== 'BYE' && away !== 'BYE') {
        roundMatches.push({ home, away });
      }
    }
    rounds.push({ round: round + 1, label: `Fecha ${round + 1}`, matches: roundMatches });
    // Rotate all except first element
    list.splice(1, 0, list.pop()!);
  }
  return rounds;
};

// Double round-robin (home & away)
export const generateDoubleRoundRobin = (teams: string[]): FixtureRound[] => {
  const first = generateRoundRobin(teams);
  const second = first.map((r, i) => ({
    round: first.length + r.round,
    label: `Fecha ${first.length + i + 1}`,
    matches: r.matches.map((m) => ({ home: m.away, away: m.home })),
  }));
  return [...first, ...second];
};

// Generate knockout bracket from qualified teams
export interface KnockoutMatch {
  id: string;
  round: number;
  roundLabel: string;
  team1: string | null;
  team2: string | null;
  winner?: string;
}

export const generateKnockoutBracket = (qualifiedTeams: string[]): KnockoutMatch[] => {
  const rounds = Math.ceil(Math.log2(qualifiedTeams.length));
  const matches: KnockoutMatch[] = [];
  let roundTeams = [...qualifiedTeams];

  const roundLabels: Record<number, string> = {
    1: 'Final',
    2: 'Semifinal',
    3: 'Cuartos de Final',
    4: 'Octavos de Final',
  };

  for (let r = rounds; r >= 1; r--) {
    const matchCount = Math.pow(2, r - 1);
    const label = roundLabels[r] ?? `Ronda ${rounds - r + 1}`;

    for (let m = 0; m < matchCount; m++) {
      matches.push({
        id: `round_${r}_match_${m + 1}`,
        round: rounds - r + 1,
        roundLabel: label,
        team1: r === rounds ? roundTeams[m * 2] ?? null : null,
        team2: r === rounds ? roundTeams[m * 2 + 1] ?? null : null,
      });
    }
  }
  return matches;
};

export const getQualifiersFromGroups = (
  groups: TournamentGroup[],
  standings: Record<string, Array<{ teamName: string }>>
): string[] => {
  const qualified: string[] = [];
  for (const group of groups) {
    const groupStandings = standings[group.id] ?? [];
    qualified.push(...groupStandings.slice(0, group.qualifyCount).map((e) => e.teamName));
  }
  return qualified;
};
