import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

type StatCardProps = { icon: string; value: string; label: string };

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type NewsCardProps = { title: string; body: string; date: string; isNew?: boolean };

function NewsCard({ title, body, date, isNew }: NewsCardProps) {
  return (
    <View style={styles.newsCard}>
      {isNew && (
        <View style={styles.newsBadge}>
          <Text style={styles.newsBadgeText}>NUEVO</Text>
        </View>
      )}
      <Text style={styles.newsTitle}>{title}</Text>
      <Text style={styles.newsBody}>{body}</Text>
      <Text style={styles.newsDate}>{date}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const handleLogout = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>ESTRELLA DEL SUR</Text>
          <Text style={styles.headerSub}>Club Social y Deportivo</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.headerLogout}>
          <Text style={styles.headerLogoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>¡Bienvenido al Club!</Text>
          <Text style={styles.welcomeSub}>Temporada 2025 · Socio activo</Text>
        </View>

        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.statsRow}>
          <StatCard icon="👥" value="342" label="Socios" />
          <StatCard icon="⚽" value="8" label="Equipos" />
          <StatCard icon="🏆" value="3" label="Torneos" />
        </View>

        <Text style={styles.sectionTitle}>Novedades</Text>
        <NewsCard
          isNew
          title="Inicio de temporada 2025"
          body="Comenzamos el año con gran entusiasmo. Todos los equipos ya se encuentran entrenando para los torneos de la temporada."
          date="9 de junio, 2025"
        />
        <NewsCard
          title="Cuotas societarias"
          body="Recordamos que las cuotas del mes se abonan del 1 al 10 de cada mes. Podés pagar desde la app."
          date="1 de junio, 2025"
        />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 1,
  },
  headerLogout: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerLogoutText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 36,
  },
  welcomeCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0 4px 8px rgba(27, 79, 168, 0.2)',
  },
  welcomeTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  welcomeSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkGray,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  newsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  newsBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  newsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.darkGray,
    letterSpacing: 1,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGray,
    marginBottom: 6,
  },
  newsBody: {
    fontSize: 13,
    color: Colors.mediumGray,
    lineHeight: 20,
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 11,
    color: Colors.inputBorder,
    fontStyle: 'italic',
  },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
