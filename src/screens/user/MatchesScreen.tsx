import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMatches } from '../../store/slices/appSlice';
import MatchCard from '../../components/dashboard/MatchCard';
import { Colors } from '../../constants/colors';
import { DIVISION_GROUPS } from '../../constants/divisions';
import { Match } from '../../types';

type Filter = 'all' | 'live' | 'upcoming' | 'finished';

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'live', label: '⚡ En vivo' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'finished', label: 'Resultados' },
];

export default function MatchesScreen() {
  const dispatch = useAppDispatch();
  const { matches, matchesLoading } = useAppSelector((s) => s.app);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [activeDivision, setActiveDivision] = useState<string | null>(null);

  useEffect(() => { dispatch(fetchMatches()); }, []);

  const filtered = matches.filter((m: Match) => {
    const byStatus = activeFilter === 'all' || m.status === activeFilter;
    const byDivision = !activeDivision || m.divisionId === activeDivision;
    return byStatus && byDivision;
  });

  const allDivisions = [...new Set(matches.map((m) => m.divisionId))];

  return (
    <View style={styles.container}>
      {/* Status Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Division Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.divisionBar} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.divisionChip, !activeDivision && styles.divisionChipActive]}
          onPress={() => setActiveDivision(null)}
        >
          <Text style={[styles.divisionText, !activeDivision && styles.divisionTextActive]}>Todas</Text>
        </TouchableOpacity>
        {allDivisions.map((div) => (
          <TouchableOpacity
            key={div}
            style={[styles.divisionChip, activeDivision === div && styles.divisionChipActive]}
            onPress={() => setActiveDivision(div)}
          >
            <Text style={[styles.divisionText, activeDivision === div && styles.divisionTextActive]} numberOfLines={1}>
              {div.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MatchCard match={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay partidos para mostrar</Text>
        }
        refreshing={matchesLoading}
        onRefresh={() => dispatch(fetchMatches())}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterBar: { maxHeight: 52, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  divisionBar: { maxHeight: 46, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.white, fontWeight: '700' },
  divisionChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  divisionChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  divisionText: { fontSize: 11, color: Colors.textSecondary },
  divisionTextActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
});
