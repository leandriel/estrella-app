import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllUsers, UserProfile } from '../../lib/user';
import { Colors } from '../../constants/Colors';

function roleLabel(profile: UserProfile): string {
  if (profile.isPlayer) return 'Jugador';
  if (profile.roles?.admin) return 'Admin';
  if (profile.roles?.subadmin) return 'Subadmin';
  return 'Usuario';
}

function roleBadgeColors(profile: UserProfile): { bg: string; text: string } {
  if (profile.isPlayer) return { bg: '#E8F6EF', text: '#2E7D32' };
  if (profile.roles?.admin) return { bg: '#FCE7EA', text: Colors.primary };
  if (profile.roles?.subadmin) return { bg: '#EFF7FF', text: Colors.secondary };
  return { bg: '#F3F3F3', text: Colors.mediumGray };
}

export default function UsersScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? users.filter(
            (u) =>
              u.name?.toLowerCase().includes(q) ||
              u.surname?.toLowerCase().includes(q) ||
              u.email?.toLowerCase().includes(q)
          )
        : users
    );
  }, [search, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await fetchAllUsers();
      setUsers(all);
      setFiltered(all);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbarRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={Colors.mediumGray}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/admin/create-user')}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.alertError}>
          <Text style={styles.alertText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {search ? 'No hay resultados para esa búsqueda.' : 'No hay usuarios registrados.'}
            </Text>
          ) : (
            filtered.map((user) => {
              const badge = roleBadgeColors(user);
              return (
                <View key={user.id} style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.surname}, {user.name}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.roleBadgeText, { color: badge.text }]}>
                        {roleLabel(user)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      router.push({ pathname: '/admin/edit-user', params: { uid: user.id } })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkGray,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.darkGray,
  },
  newButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  newButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  alertError: {
    backgroundColor: '#FDE2E5',
    borderRadius: 12,
    margin: 16,
    padding: 12,
  },
  alertText: {
    color: Colors.darkGray,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.mediumGray,
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyText: {
    color: Colors.mediumGray,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 48,
  },
  userRow: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGray,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.mediumGray,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#EFF7FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editButtonText: {
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 13,
  },
});
