import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTrainings } from '../../store/slices/appSlice';
import TrainingCard from '../../components/dashboard/TrainingCard';
import { Colors } from '../../constants/colors';
import { TrainingStatus } from '../../types';

const statusFilters: { key: TrainingStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'scheduled', label: 'Confirmados' },
  { key: 'suspended', label: 'Suspendidos' },
  { key: 'completed', label: 'Realizados' },
];

export default function TrainingScreen() {
  const dispatch = useAppDispatch();
  const { trainings, trainingsLoading } = useAppSelector((s) => s.app);
  const [filter, setFilter] = useState<TrainingStatus | 'all'>('all');

  useEffect(() => { dispatch(fetchTrainings()); }, []);

  const filtered = filter === 'all' ? trainings : trainings.filter((t) => t.status === filter);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {statusFilters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TrainingCard training={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>No hay entrenamientos para mostrar</Text>}
        refreshing={trainingsLoading}
        onRefresh={() => dispatch(fetchTrainings())}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterBar: { maxHeight: 52, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
});
