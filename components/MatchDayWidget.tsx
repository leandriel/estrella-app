import { useEffect, useState, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  PanResponder, Animated, useWindowDimensions, Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  subscribeEstrellaDeSurMatches,
  matchArgDateStr, toArgDateStr,
  FixtureMatch,
} from '../lib/fixtures';
import {
  startMatch, getElapsedSeconds,
  PERIOD_SHORT, ACTIVE_PERIODS,
} from '../lib/live-match';
import { getCategories, Category } from '../lib/categories';
import { UserProfile } from '../lib/user';
import { Colors } from '../constants/Colors';

function formatCatName(cat: Category): string {
  const surfaceLabel = cat.surface === 'futsal' ? 'Futsal' : 'Campo';
  return cat.displayName.replace(/\s(futsal|campo)$/i, ` ${surfaceLabel}`);
}

function catNameFromId(categoryId: string): string {
  const parts = categoryId.split('-');
  const surface = parts[parts.length - 1];
  const middle = parts.slice(1, parts.length - 1).join(' ');
  const surfaceLabel = surface === 'futsal' ? 'Futsal' : 'Campo';
  return `Categoría ${middle} ${surfaceLabel}`;
}

type DayTab = 'ayer' | 'hoy' | 'manana';
const TABS: DayTab[] = ['ayer', 'hoy', 'manana'];
const TAB_LABELS: Record<DayTab, string> = { ayer: 'AYER', hoy: 'HOY', manana: 'MAÑANA' };
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function shortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_SHORT[dt.getDay()]} ${d}/${String(m).padStart(2, '0')}`;
}

interface MatchGroup {
  key: string; categoryId: string; league: string; season: string;
  fechaNum: number; matches: FixtureMatch[];
}

function groupMatches(matches: FixtureMatch[]): MatchGroup[] {
  const map = new Map<string, MatchGroup>();
  for (const m of matches) {
    const key = `${m.categoryId}-f${m.fechaNum}`;
    if (!map.has(key)) {
      map.set(key, { key, categoryId: m.categoryId, league: m.league, season: m.season, fechaNum: m.fechaNum, matches: [] });
    }
    map.get(key)!.matches.push(m);
  }
  return Array.from(map.values());
}

function goalEntryText(playerName: string | null, minute: number | null, minuteFirst = false): string {
  const min = minute != null ? `${minute}'` : null;
  if (playerName) {
    if (minuteFirst && min) return `${min} ${playerName}`;
    return min ? `${playerName} ${min}` : playerName;
  }
  return min ?? '⚽';
}

function MatchRow({ match, isLast, showDate, tick }: {
  match: FixtureMatch; isLast: boolean; showDate?: boolean; tick?: number;
}) {
  const ld = match.liveData;
  const isLive = match.status === 'live' && ld != null;

  let centerLabel = '-';
  let centerSub: string | null = null;

  if (isLive && ld) {
    if (ACTIVE_PERIODS.includes(ld.period)) {
      const elapsed = getElapsedSeconds(match);
      const mins = Math.floor(elapsed / 60);
      if (ld.isFutsal) {
        const secs = elapsed % 60;
        centerLabel = `${mins}:${String(secs).padStart(2, '0')}`;
      } else {
        centerLabel = `${mins}'`;
      }
      centerSub = PERIOD_SHORT[ld.period];
    } else {
      centerLabel = PERIOD_SHORT[ld.period];
    }
  } else if (match.status === 'played' && match.scoreLocal !== null && match.scoreAway !== null) {
    centerLabel = `${match.scoreLocal} - ${match.scoreAway}`;
  } else if (match.status === 'suspended') {
    centerLabel = 'SUS.';
  } else if (match.matchTime) {
    centerLabel = match.matchTime;
  }

  const dateStr = matchArgDateStr(match);
  const goals = ld?.goals ?? [];
  const localGoals = goals.filter(g => g.team === 'local');
  const awayGoals = goals.filter(g => g.team === 'away');
  const showGoals = goals.length > 0 && (match.status === 'played' || isLive);

  return (
    <View style={[styles.matchRow, isLast && styles.matchRowLast]}>
      {match.venue ? <Text style={styles.matchVenue}>{match.venue}</Text> : null}
      <View style={styles.teamsRow}>
        <Text style={[styles.teamName, styles.teamLeft]} numberOfLines={2}>{match.localTeam}</Text>
        <View style={styles.centerBlock}>
          <Text style={[styles.matchScore, isLive && styles.liveScore]}>{centerLabel}</Text>
          {centerSub ? <Text style={styles.periodSub}>{centerSub}</Text> : null}
          {showDate && dateStr && !isLive
            ? <Text style={styles.matchDateSub}>{shortDate(dateStr)}</Text>
            : null}
        </View>
        <Text style={[styles.teamName, styles.teamRight]} numberOfLines={2}>{match.awayTeam}</Text>
      </View>
      {showGoals && (
        <View style={styles.goalsRow}>
          <View style={styles.goalsSide}>
            {localGoals.map(g => (
              <Text key={g.id} style={[styles.goalEntry, styles.goalEntryLeft]}>
                {goalEntryText(g.playerName, g.minute, false)}
              </Text>
            ))}
          </View>
          <View style={{ width: 64 }} />
          <View style={styles.goalsSide}>
            {awayGoals.map(g => (
              <Text key={g.id} style={[styles.goalEntry, styles.goalEntryRight]}>
                {goalEntryText(g.playerName, g.minute, true)}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function MatchGroupCard({
  group, showDate, proximo, catDisplayName, tick, isAdmin, todayStr,
}: {
  group: MatchGroup; showDate?: boolean; proximo?: boolean;
  catDisplayName?: string; tick?: number; isAdmin?: boolean; todayStr?: string;
}) {
  const categoryTitle = catDisplayName ?? catNameFromId(group.categoryId);
  const tournamentLine = `${group.league} ${group.season} · Fecha ${group.fechaNum}`;
  const params = { categoryId: group.categoryId, categoryName: categoryTitle, league: group.league, season: group.season };

  const goFixture = () => router.push({ pathname: '/fixture', params });
  const goTablas = () => router.push({ pathname: '/fixture', params: { ...params, initialTab: 'tablas' } });
  const goLive = (m: FixtureMatch) => router.push({ pathname: '/live-match', params: { ...params, matchId: m.id } });

  const hasLiveMatch = group.matches.some(m => m.status === 'live');
  const firstLive = group.matches.find(m => m.status === 'live');
  const pendingToday = group.matches.filter(m => m.status === 'pending' && matchArgDateStr(m) === todayStr);
  const firstPastPending = group.matches.find(m => {
    const ds = matchArgDateStr(m);
    return m.status === 'pending' && ds != null && ds < (todayStr ?? '');
  });

  const handleStart = (m: FixtureMatch) => {
    const isFutsal = group.categoryId.includes('futsal');
    Alert.alert(
      'Iniciar partido',
      `¿Confirmar inicio?\n${m.localTeam} vs ${m.awayTeam}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'INICIAR', onPress: async () => {
            await startMatch(m.id, isFutsal);
            goLive(m);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={hasLiveMatch && firstLive ? () => goLive(firstLive) : goFixture}
        activeOpacity={0.8}
      >
        {proximo && <Text style={styles.proximoLabel}>PRÓXIMO PARTIDO</Text>}
        {hasLiveMatch && <Text style={styles.liveLabel}>● EN VIVO</Text>}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{categoryTitle}</Text>
            <Text style={styles.cardTournament}>{tournamentLine}</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {group.matches.map((m, i) => (
        <MatchRow
          key={m.id}
          match={m}
          isLast={i === group.matches.length - 1}
          showDate={showDate}
          tick={tick}
        />
      ))}

      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={goFixture} activeOpacity={0.7}>
          <Text style={styles.footerBtn}>FIXTURE</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goTablas} activeOpacity={0.7}>
          <Text style={styles.footerBtn}>TABLAS</Text>
        </TouchableOpacity>
        {isAdmin && hasLiveMatch && firstLive && (
          <TouchableOpacity onPress={() => goLive(firstLive)} activeOpacity={0.7}>
            <Text style={[styles.footerBtn, styles.footerBtnLive]}>● EN VIVO</Text>
          </TouchableOpacity>
        )}
        {isAdmin && !hasLiveMatch && pendingToday.length > 0 && (
          <TouchableOpacity onPress={() => handleStart(pendingToday[0])} activeOpacity={0.7}>
            <Text style={[styles.footerBtn, styles.footerBtnLive]}>▶ INICIAR</Text>
          </TouchableOpacity>
        )}
        {isAdmin && !hasLiveMatch && !pendingToday.length && firstPastPending && (
          <TouchableOpacity onPress={() => goLive(firstPastPending)} activeOpacity={0.7}>
            <Text style={[styles.footerBtn, styles.footerBtnResult]}>RESULTADO</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function TabContent({
  tabName, loading, ayerMatches, hoyMatches, mananaMatches,
  categoriesMap, tick, isAdmin, todayStr,
}: {
  tabName: DayTab; loading: boolean;
  ayerMatches: FixtureMatch[]; hoyMatches: FixtureMatch[]; mananaMatches: FixtureMatch[];
  categoriesMap: Record<string, Category>; tick: number; isAdmin?: boolean; todayStr?: string;
}) {
  const catName = (categoryId: string) => {
    const cat = categoriesMap[categoryId];
    return cat ? formatCatName(cat) : undefined;
  };

  if (loading) {
    return <View style={styles.placeholder}><ActivityIndicator color={Colors.primary} size="small" /></View>;
  }

  const cardProps = { tick, isAdmin, todayStr };

  if (tabName === 'ayer') {
    if (ayerMatches.length === 0)
      return <View style={styles.placeholder}><Text style={styles.emptyText}>No hubo partidos ayer</Text></View>;
    return <>{groupMatches(ayerMatches).map(g => <MatchGroupCard key={g.key} group={g} catDisplayName={catName(g.categoryId)} {...cardProps} />)}</>;
  }

  if (tabName === 'hoy') {
    if (hoyMatches.length === 0) {
      if (mananaMatches.length === 0)
        return <View style={styles.placeholder}><Text style={styles.emptyText}>No hay partidos programados</Text></View>;
      return <>{groupMatches(mananaMatches).map(g => <MatchGroupCard key={g.key} group={g} showDate proximo catDisplayName={catName(g.categoryId)} {...cardProps} />)}</>;
    }
    return <>{groupMatches(hoyMatches).map(g => <MatchGroupCard key={g.key} group={g} catDisplayName={catName(g.categoryId)} {...cardProps} />)}</>;
  }

  if (mananaMatches.length === 0)
    return <View style={styles.placeholder}><Text style={styles.emptyText}>No hay partidos programados</Text></View>;
  return <>{groupMatches(mananaMatches).map(g => <MatchGroupCard key={g.key} group={g} showDate catDisplayName={catName(g.categoryId)} {...cardProps} />)}</>;
}

export default function MatchDayWidget({ profile }: { profile?: UserProfile | null }) {
  const { width: SCREEN_W } = useWindowDimensions();
  const CONTENT_W = SCREEN_W - 32;

  const [tab, setTabState] = useState<DayTab>('hoy');
  const currentIdxRef = useRef(1);
  const scrollX = useRef(new Animated.Value(-CONTENT_W)).current;

  const [allMatches, setAllMatches] = useState<FixtureMatch[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const isAdmin = !!(profile?.permissions?.startLiveMatch || profile?.permissions?.modifyLiveScore);
  const todayStr = toArgDateStr(new Date());
  const yesterdayStr = toArgDateStr(new Date(Date.now() - 86_400_000));

  const nextDateStr = useMemo(() => {
    for (const m of allMatches) {
      const d = matchArgDateStr(m);
      if (d && d > todayStr) return d;
    }
    return null;
  }, [allMatches, todayStr]);

  const ayerMatches = useMemo(() => allMatches.filter(m => matchArgDateStr(m) === yesterdayStr), [allMatches, yesterdayStr]);
  const hoyMatches = useMemo(() => allMatches.filter(m => matchArgDateStr(m) === todayStr), [allMatches, todayStr]);
  const mananaMatches = useMemo(() => nextDateStr ? allMatches.filter(m => matchArgDateStr(m) === nextDateStr) : [], [allMatches, nextDateStr]);

  useEffect(() => {
    getCategories().then(cats => {
      const map: Record<string, Category> = {};
      cats.forEach(c => { map[c.id] = c; });
      setCategoriesMap(map);
    });
    return subscribeEstrellaDeSurMatches(matches => {
      setAllMatches(matches);
      setLoading(false);
    });
  }, []);

  // Tick every second only when there's a running live match
  useEffect(() => {
    const hasRunning = allMatches.some(m => m.status === 'live' && m.liveData?.timerRunning);
    if (!hasRunning) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [allMatches]);

  const goToIndex = (idx: number) => {
    currentIdxRef.current = idx;
    setTabState(TABS[idx]);
    Animated.spring(scrollX, {
      toValue: -idx * CONTENT_W,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: () => { scrollX.stopAnimation(); },
      onPanResponderMove: (_, gs) => {
        const base = -currentIdxRef.current * CONTENT_W;
        scrollX.setValue(Math.max(-2 * CONTENT_W, Math.min(0, base + gs.dx)));
      },
      onPanResponderRelease: (_, gs) => {
        let idx = currentIdxRef.current;
        if (gs.dx < -40 && idx < 2) idx++;
        else if (gs.dx > 40 && idx > 0) idx--;
        goToIndex(idx);
      },
      onPanResponderTerminate: () => goToIndex(currentIdxRef.current),
    })
  ).current;

  const indicatorX = scrollX.interpolate({
    inputRange: [-2 * CONTENT_W, -CONTENT_W, 0],
    outputRange: [2 * (CONTENT_W / 3), CONTENT_W / 3, 0],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { width: CONTENT_W }]}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={styles.tabItem} onPress={() => goToIndex(i)} activeOpacity={0.8}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
        <Animated.View
          style={[styles.tabUnderline, { width: CONTENT_W / 3, transform: [{ translateX: indicatorX }] }]}
        />
      </View>

      <View style={{ width: CONTENT_W, overflow: 'hidden' }} {...panResponder.panHandlers}>
        <Animated.View style={{ width: CONTENT_W * 3, flexDirection: 'row', transform: [{ translateX: scrollX }] }}>
          {TABS.map(t => (
            <View key={t} style={{ width: CONTENT_W, gap: 10 }}>
              <TabContent
                tabName={t}
                loading={loading}
                ayerMatches={ayerMatches}
                hoyMatches={hoyMatches}
                mananaMatches={mananaMatches}
                categoriesMap={categoriesMap}
                tick={tick}
                isAdmin={isAdmin}
                todayStr={todayStr}
              />
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    position: 'relative',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.mediumGray, letterSpacing: 0.8 },
  tabTextActive: { color: Colors.primary },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 0,
    height: 3, backgroundColor: Colors.primary, borderRadius: 2,
  },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardHeader: {
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderColor: Colors.inputBorder,
  },
  proximoLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.secondary, letterSpacing: 1, marginBottom: 3,
  },
  liveLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 1, marginBottom: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.darkGray },
  cardTournament: { fontSize: 11, color: Colors.mediumGray, marginTop: 2 },
  cardArrow: { fontSize: 20, color: Colors.mediumGray, lineHeight: 22 },
  matchRow: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: Colors.inputBorder,
  },
  matchRowLast: { borderBottomWidth: 0 },
  matchVenue: { fontSize: 11, color: Colors.mediumGray, textAlign: 'center', marginBottom: 8 },
  teamsRow: { flexDirection: 'row', alignItems: 'center' },
  teamName: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.darkGray },
  teamLeft: { textAlign: 'right', marginRight: 10 },
  teamRight: { textAlign: 'left', marginLeft: 10 },
  centerBlock: { width: 64, alignItems: 'center' },
  matchScore: { fontSize: 17, fontWeight: '800', color: Colors.darkGray },
  liveScore: { color: Colors.primary },
  periodSub: { fontSize: 9, fontWeight: '700', color: Colors.mediumGray, letterSpacing: 0.8, marginTop: 1 },
  matchDateSub: { fontSize: 10, color: Colors.mediumGray, marginTop: 2 },
  goalsRow: {
    flexDirection: 'row', paddingTop: 2, paddingBottom: 8,
  },
  goalsSide: { flex: 1 },
  goalEntry: { fontSize: 11, color: Colors.mediumGray, lineHeight: 17, fontStyle: 'italic' },
  goalEntryLeft: { textAlign: 'right' },
  goalEntryRight: { textAlign: 'left' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderColor: Colors.inputBorder,
  },
  footerBtn: { fontSize: 13, fontWeight: '700', color: Colors.secondary, letterSpacing: 0.5 },
  footerBtnLive: { color: Colors.primary },
  footerBtnResult: { color: Colors.gold },
  placeholder: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 20, alignItems: 'center',
  },
  emptyText: { color: Colors.mediumGray, fontSize: 14 },
});
