export type League = 'ADEFUL' | 'LIFUBA';
export type SportType = 'Futsal' | 'Campo';

export interface Division {
  id: string;
  name: string;
  league: League;
  sport: SportType;
  label: string;
  shortLabel: string;
  color: string;
}

export const DIVISIONS: Division[] = [
  // Futsal ADEFUL
  { id: 'futsal_adeful_primera', name: 'Primera', league: 'ADEFUL', sport: 'Futsal', label: 'Futsal ADEFUL - Primera', shortLabel: '1ra ADEFUL', color: '#C8102E' },
  { id: 'futsal_adeful_paralelo', name: 'Paralelo', league: 'ADEFUL', sport: 'Futsal', label: 'Futsal ADEFUL - Paralelo', shortLabel: 'Paralelo ADEFUL', color: '#E8344E' },
  { id: 'futsal_adeful_2016', name: 'Categoría 2016', league: 'ADEFUL', sport: 'Futsal', label: 'Futsal ADEFUL - Cat. 2016', shortLabel: 'Cat.2016 ADEFUL', color: '#F47A8A' },
  { id: 'futsal_adeful_sub16', name: 'Sub 16', league: 'ADEFUL', sport: 'Futsal', label: 'Futsal ADEFUL - Sub 16', shortLabel: 'Sub16 ADEFUL', color: '#FF9AA8' },
  // Futsal LIFUBA
  { id: 'futsal_lifuba_primera', name: 'Primera', league: 'LIFUBA', sport: 'Futsal', label: 'Futsal LIFUBA - Primera', shortLabel: '1ra LIFUBA', color: '#003087' },
  { id: 'futsal_lifuba_tercera', name: 'Tercera', league: 'LIFUBA', sport: 'Futsal', label: 'Futsal LIFUBA - Tercera', shortLabel: '3ra LIFUBA', color: '#1A4BA0' },
  { id: 'futsal_lifuba_cuarta', name: 'Cuarta', league: 'LIFUBA', sport: 'Futsal', label: 'Futsal LIFUBA - Cuarta', shortLabel: '4ta LIFUBA', color: '#3366BB' },
  { id: 'futsal_lifuba_quinta', name: 'Quinta', league: 'LIFUBA', sport: 'Futsal', label: 'Futsal LIFUBA - Quinta', shortLabel: '5ta LIFUBA', color: '#4D80CC' },
  { id: 'futsal_lifuba_sexta', name: 'Sexta', league: 'LIFUBA', sport: 'Futsal', label: 'Futsal LIFUBA - Sexta', shortLabel: '6ta LIFUBA', color: '#6699DD' },
  // Campo ADEFUL
  { id: 'campo_adeful_primera', name: 'Primera', league: 'ADEFUL', sport: 'Campo', label: 'Campo ADEFUL - Primera', shortLabel: '1ra Campo ADEFUL', color: '#8B0015' },
  { id: 'campo_adeful_sub16', name: 'Sub 16', league: 'ADEFUL', sport: 'Campo', label: 'Campo ADEFUL - Sub 16', shortLabel: 'Sub16 Campo ADEFUL', color: '#A0001F' },
  // Campo LIFUBA
  { id: 'campo_lifuba_primera', name: 'Primera', league: 'LIFUBA', sport: 'Campo', label: 'Campo LIFUBA - Primera', shortLabel: '1ra Campo LIFUBA', color: '#001A5E' },
  { id: 'campo_lifuba_tercera', name: 'Tercera', league: 'LIFUBA', sport: 'Campo', label: 'Campo LIFUBA - Tercera', shortLabel: '3ra Campo LIFUBA', color: '#00297A' },
  { id: 'campo_lifuba_cuarta', name: 'Cuarta', league: 'LIFUBA', sport: 'Campo', label: 'Campo LIFUBA - Cuarta', shortLabel: '4ta Campo LIFUBA', color: '#003896' },
  { id: 'campo_lifuba_quinta', name: 'Quinta', league: 'LIFUBA', sport: 'Campo', label: 'Campo LIFUBA - Quinta', shortLabel: '5ta Campo LIFUBA', color: '#1A47A8' },
  { id: 'campo_lifuba_sexta', name: 'Sexta', league: 'LIFUBA', sport: 'Campo', label: 'Campo LIFUBA - Sexta', shortLabel: '6ta Campo LIFUBA', color: '#3360BB' },
];

export const getDivisionById = (id: string): Division | undefined =>
  DIVISIONS.find((d) => d.id === id);

export const getDivisionsByLeague = (league: League): Division[] =>
  DIVISIONS.filter((d) => d.league === league);

export const getDivisionsBySport = (sport: SportType): Division[] =>
  DIVISIONS.filter((d) => d.sport === sport);

export const getDivisionsByLeagueAndSport = (league: League, sport: SportType): Division[] =>
  DIVISIONS.filter((d) => d.league === league && d.sport === sport);

export const DIVISION_GROUPS = {
  FUTSAL_ADEFUL: DIVISIONS.filter((d) => d.league === 'ADEFUL' && d.sport === 'Futsal'),
  FUTSAL_LIFUBA: DIVISIONS.filter((d) => d.league === 'LIFUBA' && d.sport === 'Futsal'),
  CAMPO_ADEFUL: DIVISIONS.filter((d) => d.league === 'ADEFUL' && d.sport === 'Campo'),
  CAMPO_LIFUBA: DIVISIONS.filter((d) => d.league === 'LIFUBA' && d.sport === 'Campo'),
};
