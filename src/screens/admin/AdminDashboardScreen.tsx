import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMatches, fetchNews, fetchTrainings } from '../../store/slices/appSlice';
import { Colors } from '../../constants/colors';
import MatchCard from '../../components/dashboard/MatchCard';
import SectionHeader from '../../components/common/SectionHeader';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function AdminDashboardScreen() {
  const dispatch = useAppDispatch();
  const { matches, news, trainings, matchesLoading } = useAppSelector((s) => s.app);
  const { user } = useAppSelector((s) => s.auth);

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming').slice(0, 5);
  const recentResults = matches.filter((m) => m.status === 'finished').slice(0, 3);

  const loadData = () => {
    dispatch(fetchMatches());
    dispatch(fetchNews());
    dispatch(fetchTrainings());
  };

  useEffect(() => { loadData(); }, []);

  const stats = [
    { label: 'En Vivo', value: liveMatches.length, icon: 'radio-outline', color: Colors.error },
    { label: 'Próximos', value: upcomingMatches.length, icon: 'calendar-outline', color: Colors.info },
    { label: 'Resultados', value: recentResults.length, icon: 'trophy-outline', color: Colors.success },
    { label: 'Noticias', value: news.length, icon: 'newspaper-outline', color: Colors.warning },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={matchesLoading} onRefresh={loadData} tintColor={Colors.secondary} />}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="light" />

      <View style={styles.hero}>
        <Image source={require('../../../assets/logo.png')} style={styles.heroLogo} resizeMode="contain" />
        <View style={styles.heroText}>
          <Text style={styles.heroGreeting}>Panel Admin</Text>
          <Text style={styles.heroName}>{user?.displayName}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={24} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Live matches */}
        {liveMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.liveHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.liveHeaderText}>EN VIVO — ACCIÓN RÁPIDA</Text>
            </View>
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </View>
        )}

        {/* Upcoming to manage */}
        <View style={styles.section}>
          <SectionHeader title="Próximos Partidos" />
          {upcomingMatches.length > 0
            ? upcomingMatches.map((m) => <MatchCard key={m.id} match={m} compact />)
            : <Text style={styles.empty}>No hay partidos próximos</Text>}
        </View>

        {/* Recent Results */}
        <View style={styles.section}>
          <SectionHeader title="Últimos Resultados" />
          {recentResults.length > 0
            ? recentResults.map((m) => <MatchCard key={m.id} match={m} compact />)
            : <Text style={styles.empty}>Sin resultados cargados</Text>}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 14,
  },
  heroLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white },
  heroText: { flex: 1 },
  heroGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  heroName: { fontSize: 18, fontWeight: 'bold', color: Colors.white },
  body: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  section: { marginBottom: 24 },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },
  liveHeaderText: { fontWeight: 'bold', color: Colors.error, fontSize: 12, letterSpacing: 1 },
  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 16, fontSize: 14 },
});
