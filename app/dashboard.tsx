import { useEffect, useState } from 'react';
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
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchUserProfileByUID, hasPermission, UserProfile, Permissions } from '../lib/user';
import { Colors } from '../constants/Colors';
import MatchDayWidget from '../components/MatchDayWidget';

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

type ActionButtonProps = { label: string; enabled?: boolean; onPress?: () => void };

function ActionButton({ label, enabled = true, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, !enabled && styles.actionButtonDisabled]}
      onPress={onPress}
      disabled={!enabled}
      activeOpacity={0.8}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function PermissionBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <View style={[styles.permissionItem, enabled ? styles.permissionActiveCard : styles.permissionInactiveCard]}>
      <Text style={styles.permissionItemLabel}>{label}</Text>
      <Text style={styles.permissionItemValue}>{enabled ? 'SI' : 'NO'}</Text>
    </View>
  );
}

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
  const [userName, setUserName] = useState('Socio');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName ?? user.email?.split('@')[0] ?? 'Socio');
        loadUserProfile(user);
      } else {
        router.replace('/login');
      }
    });
    return unsubscribe;
  }, []);

  const loadUserProfile = async (user: FirebaseUser) => {
    setLoadingProfile(true);
    const loadedProfile = await fetchUserProfileByUID(user.uid);
    setProfile(loadedProfile);
    setLoadingProfile(false);
  };

  const can = (permission: keyof Permissions) => {
    return hasPermission(profile, permission);
  };

  const permissionGroups: Array<{
    title: string;
    items: { permission: keyof Permissions; label: string }[];
  }> = [
    {
      title: 'Fixtures',
      items: [
        { permission: 'createFixture', label: 'Crear fixture' },
        { permission: 'modifyFixture', label: 'Modificar fixture' },
        { permission: 'deleteFixture', label: 'Eliminar fixture' },
      ],
    },
    {
      title: 'Noticias',
      items: [
        { permission: 'createNews', label: 'Crear noticias' },
        { permission: 'modifyNews', label: 'Modificar noticias' },
        { permission: 'deleteNews', label: 'Eliminar noticias' },
      ],
    },
    {
      title: 'Categorías',
      items: [
        { permission: 'createCategory', label: 'Crear categoría' },
        { permission: 'modifyCategory', label: 'Modificar categoría' },
        { permission: 'deleteCategory', label: 'Eliminar categoría' },
      ],
    },
    {
      title: 'Otras acciones',
      items: [
        { permission: 'startLiveMatch', label: 'Iniciar partido' },
        { permission: 'modifyLiveScore', label: 'Modificar marcador' },
      ],
    },
    {
      title: 'Permisos de lectura',
      items: [
        { permission: 'viewFixtures', label: 'Ver fixtures' },
        { permission: 'viewLiveMatches', label: 'Ver partidos' },
        { permission: 'viewNews', label: 'Ver noticias' },
        { permission: 'viewPayments', label: 'Ver cuotas' },
      ],
    },
  ];

  const handleLogout = async () => {
    await signOut(auth);
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
          <Text style={styles.welcomeTitle}>¡Bienvenido, {userName}!</Text>
          <Text style={styles.welcomeSub}>Temporada 2025 · Socio activo</Text>
          {loadingProfile ? (
            <Text style={styles.profileStatus}>Cargando perfil...</Text>
          ) : profile ? (
            <Text style={styles.profileStatus}>
              Roles: {profile.roles?.admin ? 'Admin ' : ''}
              {profile.roles?.subadmin ? 'Subadmin ' : ''}
              {profile.roles?.user ? 'Usuario' : ''}
            </Text>
          ) : (
            <Text style={styles.profileStatus}>Perfil no encontrado</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Partidos</Text>
        <MatchDayWidget profile={profile} />

        {profile && (
          <>
            <View style={styles.actionList}>
              <Text style={styles.sectionTitle}>Acciones rápidas</Text>
              <ActionButton label="Crear fixture" enabled={can('createFixture')} />
              <ActionButton label="Crear noticias" enabled={can('createNews')} />
              <ActionButton label="Crear usuario" enabled={can('createUser')} onPress={() => router.push('/admin/create-user')} />
              <ActionButton label="Gestionar usuarios" enabled={can('modifyUser')} onPress={() => router.push('/admin/users')} />
              <ActionButton label="Administrar categorías" enabled={can('createCategory') || can('modifyCategory')} onPress={() => router.push('/admin/categories')} />
              <ActionButton label="Iniciar partido en vivo" enabled={can('startLiveMatch')} />
              <ActionButton label="Ver cuotas" enabled={can('viewPayments')} />
            </View>

            <View style={styles.permissionsBlock}>
              <Text style={styles.sectionTitle}>Permisos detallados</Text>
              {permissionGroups.map((group) => (
                <View key={group.title} style={styles.permissionGroup}>
                  <Text style={styles.permissionGroupTitle}>{group.title}</Text>
                  <View style={styles.permissionsGrid}>
                    {group.items.map((item) => (
                      <PermissionBadge
                        key={item.permission}
                        label={item.label}
                        enabled={can(item.permission)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

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
  profileStatus: {
    marginTop: 12,
    color: Colors.white,
    opacity: 0.9,
    fontSize: 13,
  },
  actionList: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '700',
  },
  permissionsBlock: {
    marginBottom: 24,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  permissionItem: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  permissionItemLabel: {
    fontSize: 12,
    color: Colors.darkGray,
    marginBottom: 6,
  },
  permissionItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  permissionInactiveCard: {
    backgroundColor: '#F3F3F3',
  },
  permissionActiveCard: {
    backgroundColor: '#E7F5FF',
  },
  permissionGroup: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF7',
  },
  permissionGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkGray,
    marginBottom: 10,
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
