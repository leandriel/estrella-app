import { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  PanResponder,
  Animated,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchUserProfileByUID, hasPermission, UserProfile } from '../lib/user';
import {
  fetchFixtureByCategory,
  calculateStandings,
  matchArgDateStr,
  toArgDateStr,
  FixtureMatch,
} from '../lib/fixtures';
import { Colors } from '../constants/Colors';

function goalEntryText(playerName: string | null, minute: number | null, minuteFirst = false): string {
  const min = minute != null ? `${minute}'` : null;
  if (playerName) {
    if (minuteFirst && min) return `${min} ${playerName}`;
    return min ? `${playerName} ${min}` : playerName;
  }
  return min ?? '⚽';
}

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_ES[dt.getDay()]} ${d}/${String(m).padStart(2, '0')}/${y}`;
}

export default function FixtureScreen() {
  const { width: SCREEN_W } = useWindowDimensions();
  const CONTENT_W = SCREEN_W;

  const { categoryId, categoryName, league, season, initialTab } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    league?: string;
    season?: string;
    initialTab?: string;
  }>();

  const initIdx = initialTab === 'tablas' ? 1 : 0;
  const [activeTabIdx, setActiveTabIdx] = useState(initIdx);
  const currentIdxRef = useRef(initIdx);
  const scrollX = useRef(new Animated.Value(-initIdx * CONTENT_W)).current;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<FixtureMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = hasPermission(profile, 'startLiveMatch') || hasPermission(profile, 'modifyLiveScore');
  const todayStr = toArgDateStr(new Date());

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      if (user) fetchUserProfileByUID(user.uid).then(setProfile);
    });
  }, []);

  const loadFixture = async () => {
    if (!categoryId) return;
    try {
      const data = await fetchFixtureByCategory(categoryId);
      setMatches(data);
      setError('');
    } catch {
      setError('No se pudo cargar el fixture.');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadFixture().finally(() => setLoading(false));
  }, [categoryId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFixture();
    setRefreshing(false);
  };

  const fechaGroups = useMemo(() => {
    type DG = { dateKey: string; dateLabel: string; matches: FixtureMatch[] };
    type FG = { fechaNum: number; dateGroups: DG[] };
    const groups: FG[] = [];

    for (const m of matches) {
      let fg = groups.find(g => g.fechaNum === m.fechaNum);
      if (!fg) { fg = { fechaNum: m.fechaNum, dateGroups: [] }; groups.push(fg); }

      const dateKey = matchArgDateStr(m) ?? 'sin-fecha';
      let dg = fg.dateGroups.find(d => d.dateKey === dateKey);
      if (!dg) {
        dg = {
          dateKey,
          dateLabel: dateKey === 'sin-fecha' ? 'Sin fecha asignada' : formatDateLabel(dateKey),
          matches: [],
        };
        fg.dateGroups.push(dg);
      }
      dg.matches.push(m);
    }
    return groups;
  }, [matches]);

  const standings = useMemo(() => calculateStandings(matches), [matches]);

  const goToIndex = (idx: number) => {
    currentIdxRef.current = idx;
    setActiveTabIdx(idx);
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
      onPanResponderGrant: () => {
        scrollX.stopAnimation();
      },
      onPanResponderMove: (_, gs) => {
        const base = -currentIdxRef.current * CONTENT_W;
        scrollX.setValue(Math.max(-CONTENT_W, Math.min(0, base + gs.dx)));
      },
      onPanResponderRelease: (_, gs) => {
        let idx = currentIdxRef.current;
        if (gs.dx < -40 && idx < 1) idx++;
        else if (gs.dx > 40 && idx > 0) idx--;
        goToIndex(idx);
      },
      onPanResponderTerminate: () => goToIndex(currentIdxRef.current),
    })
  ).current;

  const indicatorX = scrollX.interpolate({
    inputRange: [-CONTENT_W, 0],
    outputRange: [CONTENT_W / 2, 0],
  });

  function MatchRow({ m, isLast }: { m: FixtureMatch; isLast: boolean }) {
    let centerLabel = '-';
    if (m.status === 'played' && m.scoreLocal !== null && m.scoreAway !== null) {
      centerLabel = `${m.scoreLocal} - ${m.scoreAway}`;
    } else if (m.status === 'suspended') {
      centerLabel = 'SUS.';
    } else if (m.matchTime) {
      centerLabel = m.matchTime;
    }

    const isEstrella =
      m.localTeam.toLowerCase().includes('estrella') ||
      m.awayTeam.toLowerCase().includes('estrella');
    const dateKey = matchArgDateStr(m);
    const isPastPending = m.status === 'pending' && dateKey != null && dateKey < todayStr;

    // Tappable: cualquier played/past-pending para admin; solo Estrella played para usuarios comunes
    const isTappable =
      (m.status === 'played' && (isEstrella || isAdmin)) ||
      (isPastPending && isAdmin);

    const handlePress = () => {
      router.push({
        pathname: '/live-match',
        params: { matchId: m.id, categoryId, categoryName, league, season },
      });
    };

    const goals = m.liveData?.goals ?? [];
    const localGoals = goals.filter(g => g.team === 'local');
    const awayGoals = goals.filter(g => g.team === 'away');
    const showGoals = goals.length > 0 && m.status === 'played' && isEstrella;

    const inner = (
      <>
        {m.venue ? <Text style={styles.matchVenue}>{m.venue}</Text> : null}
        <View style={styles.teamsRow}>
          <Text
            style={[styles.teamName, styles.teamLeft, m.localTeam.toLowerCase().includes('estrella') && styles.teamEstrella]}
            numberOfLines={2}
          >
            {m.localTeam}
          </Text>
          <View style={styles.centerBlock}>
            <Text style={styles.matchScore}>{centerLabel}</Text>
          </View>
          <Text
            style={[styles.teamName, styles.teamRight, m.awayTeam.toLowerCase().includes('estrella') && styles.teamEstrella]}
            numberOfLines={2}
          >
            {m.awayTeam}
          </Text>
        </View>
        {m.status === 'played' && (
          <Text style={styles.finalLabel}>Finalizado</Text>
        )}
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
      </>
    );

    if (isTappable) {
      return (
        <TouchableOpacity
          style={[styles.matchRow, isLast && !showGoals && styles.matchRowLast, isEstrella && styles.matchRowEstrella]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {inner}
        </TouchableOpacity>
      );
    }
    return (
      <View style={[styles.matchRow, isLast && styles.matchRowLast, isEstrella && styles.matchRowEstrella]}>
        {inner}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
          {league ? (
            <Text style={styles.headerSub}>{league}{season ? ` ${season}` : ''}</Text>
          ) : null}
        </View>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.tabBar}>
        {(['FIXTURE', 'POSICIONES'] as const).map((label, i) => (
          <TouchableOpacity key={label} style={styles.tabItem} onPress={() => goToIndex(i)} activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTabIdx === i && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View
          style={[styles.tabUnderline, { width: CONTENT_W / 2, transform: [{ translateX: indicatorX }] }]}
        />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} /></View>
      ) : error ? (
        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <View style={{ flex: 1, overflow: 'hidden' }} {...panResponder.panHandlers}>
          <Animated.View style={{
            flex: 1,
            width: CONTENT_W * 2,
            flexDirection: 'row',
            transform: [{ translateX: scrollX }],
          }}>
            {/* FIXTURE tab */}
            <View style={{ width: CONTENT_W, flex: 1 }}>
              <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
              >
                {fechaGroups.map(fg => (
                  <View key={fg.fechaNum}>
                    <Text style={styles.fechaHeader}>FECHA {fg.fechaNum}</Text>
                    <View style={styles.card}>
                      {fg.dateGroups.map((dg, di) => (
                        <View key={dg.dateKey}>
                          <View style={[styles.dateSub, di > 0 && styles.dateSubBorder]}>
                            <Text style={styles.dateSubText}>{dg.dateLabel}</Text>
                          </View>
                          {dg.matches.map((m, mi) =>
                            <MatchRow
                              key={m.id}
                              m={m}
                              isLast={
                                mi === dg.matches.length - 1 &&
                                di === fg.dateGroups.length - 1
                              }
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* POSICIONES tab */}
            <View style={{ width: CONTENT_W, flex: 1 }}>
              <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableWrapper}>
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                      {['#', 'EQUIPO', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DIF', 'PTS'].map((h, i) => (
                        <Text
                          key={h}
                          style={[styles.cell, styles.cellHeader, i === 0 && styles.cellPos, i === 1 && styles.cellTeam, i === 9 && styles.cellPts]}
                        >
                          {h}
                        </Text>
                      ))}
                    </View>
                    {standings.map((row, i) => (
                      <View
                        key={row.team}
                        style={[
                          styles.tableRow,
                          styles.tableDataRow,
                          i % 2 === 1 && styles.tableRowAlt,
                          row.team === 'ESTRELLA DEL SUR' && styles.tableRowEstrella,
                        ]}
                      >
                        <Text style={[styles.cell, styles.cellPos]}>{i + 1}</Text>
                        <Text style={[styles.cell, styles.cellTeam]} numberOfLines={1}>{row.team}</Text>
                        <Text style={styles.cell}>{row.pj}</Text>
                        <Text style={styles.cell}>{row.pg}</Text>
                        <Text style={styles.cell}>{row.pe}</Text>
                        <Text style={styles.cell}>{row.pp}</Text>
                        <Text style={styles.cell}>{row.gf}</Text>
                        <Text style={styles.cell}>{row.gc}</Text>
                        <Text style={styles.cell}>{row.dif > 0 ? `+${row.dif}` : row.dif}</Text>
                        <Text style={[styles.cell, styles.cellPts, styles.ptsValue]}>{row.pts}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.inputBorder,
  },
  backBtn: {
    paddingVertical: 4,
    width: 70,
  },
  backText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkGray,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 11,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.inputBorder,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.mediumGray,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.primary,
    fontSize: 14,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  fechaHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.mediumGray,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  dateSub: {
    backgroundColor: '#F0F0F5',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  dateSubBorder: {
    borderTopWidth: 1,
    borderColor: Colors.inputBorder,
  },
  dateSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mediumGray,
  },
  matchRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.inputBorder,
  },
  matchRowLast: {
    borderBottomWidth: 0,
  },
  matchRowEstrella: {
    backgroundColor: '#FFF8F8',
  },
  matchVenue: {
    fontSize: 11,
    color: Colors.mediumGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  teamLeft: {
    textAlign: 'right',
    marginRight: 10,
  },
  teamRight: {
    textAlign: 'left',
    marginLeft: 10,
  },
  teamEstrella: {
    color: Colors.primary,
    fontWeight: '800',
  },
  centerBlock: {
    width: 64,
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkGray,
  },
  finalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.mediumGray,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 3,
  },
  goalsRow: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 2,
  },
  goalsSide: { flex: 1 },
  goalEntry: { fontSize: 11, color: Colors.mediumGray, lineHeight: 17, fontStyle: 'italic' },
  goalEntryLeft: { textAlign: 'right' },
  goalEntryRight: { textAlign: 'left' },
  tableWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderRow: {
    backgroundColor: Colors.darkGray,
    paddingVertical: 10,
  },
  cellHeader: {
    color: Colors.white,
    fontWeight: '700',
  },
  tableDataRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.inputBorder,
  },
  tableRowAlt: {
    backgroundColor: Colors.inputBackground,
  },
  tableRowEstrella: {
    backgroundColor: '#FFF0F1',
  },
  cell: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.darkGray,
    fontWeight: '600',
  },
  cellPos: {
    width: 28,
  },
  cellTeam: {
    width: 140,
    textAlign: 'left',
    paddingLeft: 10,
  },
  cellPts: {
    width: 36,
  },
  ptsValue: {
    fontWeight: '800',
    color: Colors.primary,
  },
});
