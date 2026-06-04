import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMatches } from '../../store/slices/appSlice';
import MatchCard from '../../components/dashboard/MatchCard';
import { Colors } from '../../constants/colors';
import { AdminMatchStackParams } from '../../navigation/AdminNavigator';
import { Match } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<AdminMatchStackParams>;

const tabs = [
  { key: 'live', label: '⚡ En vivo' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'finished', label: 'Finalizados' },
  { key: 'suspended', label: 'Suspendidos' },
];

export default function ManageMatchesScreen() {
  const nav = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { matches, matchesLoading } = useAppSelector((s) => s.app);
  const [tab, setTab] = useState<string>('live');

  useEffect(() => { dispatch(fetchMatches()); }, []);

  const filtered = matches.filter((m: Match) => m.status === tab);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabChip, tab === t.key && styles.tabChipActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={styles.matchWrapper}>
            <MatchCard match={item} />
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => nav.navigate('EditMatch', { matchId: item.id })}
            >
              <Ionicons name="create-outline" size={16} color={Colors.white} />
              <Text style={styles.editBtnText}>Editar Partido</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>No hay partidos en esta categoría</Text>}
        refreshing={matchesLoading}
        onRefresh={() => dispatch(fetchMatches())}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: { maxHeight: 52, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  tabChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },
  matchWrapper: { marginBottom: 4 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 6,
  },
  editBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
});
