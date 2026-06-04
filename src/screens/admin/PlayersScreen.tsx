import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/colors';
import { getDivisionById } from '../../constants/divisions';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { AdminMatchStackParams } from '../../navigation/AdminNavigator';

type Route = RouteProp<AdminMatchStackParams, 'Players'>;

export default function PlayersScreen() {
  const { params } = useRoute<Route>();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const division = getDivisionById(params.divisionId);

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, 'users'),
        where('divisionId', '==', params.divisionId),
        where('role', '==', 'user')
      );
      const snap = await getDocs(q);
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, [params.divisionId]);

  const filtered = players.filter((p) =>
    p.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.divName}>{division?.label ?? params.divisionId}</Text>
        <Text style={styles.count}>{players.length} jugador{players.length !== 1 ? 'es' : ''}</Text>
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar jugador..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <Card style={styles.playerCard}>
            <View style={styles.playerRow}>
              <View style={styles.jerseyBadge}>
                <Text style={styles.jerseyText}>#{item.playerProfile?.jerseyNumber ?? '?'}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.displayName}</Text>
                <Text style={styles.playerMeta}>{item.email}</Text>
                {item.playerProfile?.position && (
                  <Text style={styles.playerPos}>{item.playerProfile.position}</Text>
                )}
              </View>
              <View style={styles.goalStat}>
                <Text style={styles.goalCount}>{item.playerProfile?.totalGoals ?? 0}</Text>
                <Text style={styles.goalLabel}>goles</Text>
              </View>
            </View>
          </Card>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>No hay jugadores en esta división</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 0 },
  divName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  list: { padding: 16, paddingTop: 0, paddingBottom: 40 },
  playerCard: { marginBottom: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  jerseyBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  jerseyText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  playerMeta: { fontSize: 11, color: Colors.textMuted },
  playerPos: { fontSize: 12, color: Colors.secondary, fontWeight: '500', marginTop: 2 },
  goalStat: { alignItems: 'center' },
  goalCount: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  goalLabel: { fontSize: 10, color: Colors.textSecondary },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
});
