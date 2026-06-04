import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, ScrollView, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMatches, fetchChampionships } from '../../store/slices/appSlice';
import MatchCard from '../../components/dashboard/MatchCard';
import { Colors } from '../../constants/colors';
import { DIVISIONS } from '../../constants/divisions';

export default function FixtureScreen() {
  const dispatch = useAppDispatch();
  const { matches, championships } = useAppSelector((s) => s.app);
  const [selectedChampionship, setSelectedChampionship] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMatches());
    dispatch(fetchChampionships());
  }, []);

  const activeChampionships = championships.filter((c) => c.isActive);
  const currentChamp = selectedChampionship
    ? championships.find((c) => c.id === selectedChampionship)
    : activeChampionships[0];

  const champMatches = currentChamp
    ? matches.filter((m) => m.championshipId === currentChamp.id)
    : [];

  // Group by round
  const roundMap: Record<string, typeof champMatches> = {};
  for (const m of champMatches) {
    const key = m.round ?? 'Sin fecha asignada';
    if (!roundMap[key]) roundMap[key] = [];
    roundMap[key].push(m);
  }
  const sections = Object.entries(roundMap).map(([title, data]) => ({ title, data }));

  return (
    <View style={styles.container}>
      {/* Championship Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.champBar} contentContainerStyle={styles.champContent}>
        {activeChampionships.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.champChip, currentChamp?.id === c.id && styles.champChipActive]}
            onPress={() => setSelectedChampionship(c.id)}
          >
            <Text style={[styles.champText, currentChamp?.id === c.id && styles.champTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {currentChamp ? (
        <SectionList
          sections={sections}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.roundHeader}>
              <Text style={styles.roundText}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No hay partidos en el fixture</Text>}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <Text style={styles.empty}>No hay campeonatos activos</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  champBar: { maxHeight: 52, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  champContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  champChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  champChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  champText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  champTextActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  roundHeader: { backgroundColor: Colors.background, paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8, marginTop: 12 },
  roundText: { fontSize: 14, fontWeight: 'bold', color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14, padding: 16 },
});
