import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchAllPlayers,
  addPlayerToCategory,
  removePlayerFromCategory,
  UserProfile,
} from '../../lib/user';
import { Colors } from '../../constants/Colors';

export default function CategoryPlayersScreen() {
  const { categoryId, displayName, league, surface } = useLocalSearchParams<{
    categoryId: string;
    displayName: string;
    league: string;
    surface: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const surfaceLabel = surface === 'futsal' ? 'Futsal' : 'Campo';
  const categoryLabel = `${displayName} (${surfaceLabel})`;

  useEffect(() => {
    fetchAllPlayers()
      .then(setPlayers)
      .catch(() => setError('No se pudieron cargar los jugadores.'))
      .finally(() => setLoading(false));
  }, []);

  const currentPlayers = players.filter((p) =>
    p.playerProfile?.categories?.includes(categoryId!)
  );

  const availablePlayers = players.filter(
    (p) => !p.playerProfile?.categories?.includes(categoryId!)
  );

  const filteredAvailable = search.trim()
    ? availablePlayers.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) || p.surname?.toLowerCase().includes(q)
        );
      })
    : availablePlayers;

  const handleRemove = (player: UserProfile) => {
    Alert.alert(
      'Quitar jugador',
      `¿Querés quitar a ${player.name} ${player.surname} de ${categoryLabel}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(player.id);
            try {
              await removePlayerFromCategory(player.id, categoryId!);
              setPlayers((prev) =>
                prev.map((p) =>
                  p.id === player.id
                    ? {
                        ...p,
                        playerProfile: {
                          ...p.playerProfile,
                          categories: (p.playerProfile?.categories ?? []).filter(
                            (c) => c !== categoryId
                          ),
                        },
                      }
                    : p
                )
              );
            } catch {
              Alert.alert('Error', 'No se pudo quitar al jugador. Intentá de nuevo.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleAdd = async (player: UserProfile) => {
    setActionLoading(player.id);
    try {
      await addPlayerToCategory(player.id, categoryId!);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === player.id
            ? {
                ...p,
                playerProfile: {
                  ...p.playerProfile,
                  categories: [...(p.playerProfile?.categories ?? []), categoryId!],
                },
              }
            : p
        )
      );
    } catch {
      Alert.alert('Error', 'No se pudo agregar al jugador. Intentá de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{displayName}</Text>
          <Text style={styles.subtitle}>
            {league} · {surfaceLabel}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando jugadores...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              En esta categoría
              {currentPlayers.length > 0 ? (
                <Text style={styles.count}> ({currentPlayers.length})</Text>
              ) : null}
            </Text>

            {currentPlayers.length === 0 ? (
              <Text style={styles.emptyText}>No hay jugadores en esta categoría todavía.</Text>
            ) : (
              currentPlayers.map((player, index) => (
                <View
                  key={player.id}
                  style={[
                    styles.playerRow,
                    index === currentPlayers.length - 1 && styles.playerRowLast,
                  ]}
                >
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {player.surname}, {player.name}
                    </Text>
                    <Text style={styles.playerEmail}>{player.email}</Text>
                  </View>
                  {actionLoading === player.id ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemove(player)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeText}>Quitar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Agregar jugador</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre o apellido..."
              placeholderTextColor={Colors.mediumGray}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />

            {filteredAvailable.length === 0 ? (
              <Text style={styles.emptyText}>
                {search
                  ? 'No hay coincidencias.'
                  : 'Todos los jugadores ya están en esta categoría.'}
              </Text>
            ) : (
              filteredAvailable.map((player, index) => (
                <View
                  key={player.id}
                  style={[
                    styles.playerRow,
                    index === filteredAvailable.length - 1 && styles.playerRowLast,
                  ]}
                >
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {player.surname}, {player.name}
                    </Text>
                    <Text style={styles.playerEmail}>{player.email}</Text>
                  </View>
                  {actionLoading === player.id ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAdd(player)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addText}>Agregar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
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
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.darkGray,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: Colors.primary,
    fontWeight: '700',
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
  errorText: {
    color: Colors.primary,
    fontSize: 14,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGray,
    marginBottom: 12,
  },
  count: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.mediumGray,
  },
  emptyText: {
    color: Colors.mediumGray,
    fontSize: 13,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.inputBorder,
  },
  playerRowLast: {
    borderBottomWidth: 0,
  },
  playerInfo: {
    flex: 1,
    marginRight: 10,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkGray,
  },
  playerEmail: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#FCE7EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  removeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  searchInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: Colors.darkGray,
  },
  addButton: {
    backgroundColor: '#E8F6EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 13,
  },
});
