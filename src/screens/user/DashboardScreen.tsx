import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMatches, fetchNews, fetchTrainings, fetchChampionships } from '../../store/slices/appSlice';
import { Colors } from '../../constants/colors';
import SectionHeader from '../../components/common/SectionHeader';
import MatchCard from '../../components/dashboard/MatchCard';
import NewsCard from '../../components/dashboard/NewsCard';
import TrainingCard from '../../components/dashboard/TrainingCard';
import { HomeStackParams } from '../../navigation/UserNavigator';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<HomeStackParams>;

export default function DashboardScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { matches, news, trainings, championships, matchesLoading } = useAppSelector((s) => s.app);
  const { user } = useAppSelector((s) => s.auth);

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming').slice(0, 3);
  const recentResults = matches.filter((m) => m.status === 'finished').slice(0, 3);
  const nextTrainings = trainings
    .filter((t) => t.scheduledAt > Date.now() || t.status === 'scheduled')
    .slice(0, 2);
  const latestNews = news.slice(0, 2);

  const loadData = () => {
    dispatch(fetchMatches());
    dispatch(fetchNews());
    dispatch(fetchTrainings());
    dispatch(fetchChampionships());
  };

  useEffect(() => { loadData(); }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={matchesLoading} onRefresh={loadData} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="light" />

      {/* Hero Header */}
      <View style={styles.hero}>
        <Image source={require('../../../assets/logo.png')} style={styles.heroLogo} resizeMode="contain" />
        <View>
          <Text style={styles.heroGreeting}>Hola, {user?.displayName?.split(' ')[0] ?? 'Socio'} 👋</Text>
          <Text style={styles.heroClub}>Club Estrella del Sur</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* LIVE MATCHES */}
        {liveMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.liveBanner}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBannerText}>PARTIDOS EN VIVO</Text>
            </View>
            {liveMatches.map((m) => <MatchCard key={m.id} match={m} />)}
          </View>
        )}

        {/* NOVEDADES */}
        {latestNews.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Novedades" onSeeAll={() => nav.navigate('News')} />
            {latestNews.map((n) => <NewsCard key={n.id} news={n} compact onPress={() => nav.navigate('News')} />)}
          </View>
        )}

        {/* PRÓXIMOS PARTIDOS */}
        <View style={styles.section}>
          <SectionHeader title="Próximos Partidos" onSeeAll={() => nav.navigate('Matches')} />
          {upcomingMatches.length > 0
            ? upcomingMatches.map((m) => <MatchCard key={m.id} match={m} onPress={() => nav.navigate('Matches')} />)
            : <Text style={styles.empty}>No hay partidos programados</Text>}
        </View>

        {/* ÚLTIMOS RESULTADOS */}
        <View style={styles.section}>
          <SectionHeader title="Últimos Resultados" onSeeAll={() => nav.navigate('Matches')} />
          {recentResults.length > 0
            ? recentResults.map((m) => <MatchCard key={m.id} match={m} compact onPress={() => nav.navigate('Matches')} />)
            : <Text style={styles.empty}>Sin resultados recientes</Text>}
        </View>

        {/* ENTRENAMIENTOS */}
        <View style={styles.section}>
          <SectionHeader title="Próximos Entrenamientos" onSeeAll={() => nav.navigate('Training')} />
          {nextTrainings.length > 0
            ? nextTrainings.map((t) => <TrainingCard key={t.id} training={t} onPress={() => nav.navigate('Training')} />)
            : <Text style={styles.empty}>Sin entrenamientos programados</Text>}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
          <View style={styles.quickActions}>
            {[
              { icon: 'trophy-outline', label: 'Campeonatos', screen: 'Championships' },
              { icon: 'list-outline', label: 'Fixture', screen: 'Fixture' },
            ].map((item) => (
              <TouchableOpacity
                key={item.screen}
                style={styles.quickBtn}
                onPress={() => nav.navigate(item.screen as any)}
              >
                <Ionicons name={item.icon as any} size={28} color={Colors.primary} />
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 12,
  },
  heroLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white },
  heroGreeting: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  heroClub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  notifBtn: { marginLeft: 'auto' },
  body: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 10 },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },
  liveBannerText: { fontWeight: 'bold', color: Colors.error, fontSize: 13, letterSpacing: 1 },
  empty: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
});
