import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchChampionships } from '../../store/slices/appSlice';
import { Colors } from '../../constants/colors';
import { getDivisionById } from '../../constants/divisions';
import { getStandingsForChampionship } from '../../utils/standings';
import { Championship, StandingEntry } from '../../types';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';

interface StandingsGroup {
  groupId: string;
  groupName: string;
  entries: StandingEntry[];
}

export default function ChampionshipsScreen() {
  const dispatch = useAppDispatch();
  const { championships } = useAppSelector((s) => s.app);
  const [selected, setSelected] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<StandingsGroup[]>([]);

  useEffect(() => { dispatch(fetchChampionships()); }, []);

  useEffect(() => {
    if (!selected) return;
    getStandingsForChampionship(selected.id).then((data) => {
      setStandings(data as StandingsGroup[]);
    });
  }, [selected]);

  const activeChamps = championships.filter((c) => c.isActive);
  const current = selected ?? activeChamps[0] ?? null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Championship selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.champBar} contentContainerStyle={styles.champContent}>
        {activeChamps.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.champChip, current?.id === c.id && styles.champChipActive]}
            onPress={() => setSelected(c)}
          >
            <Text style={[styles.champText, current?.id === c.id && styles.champTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {current && (
        <>
          <View style={styles.champHeader}>
            <Ionicons name="trophy" size={24} color={Colors.warning} />
            <View style={styles.champInfo}>
              <Text style={styles.champName}>{current.name}</Text>
              <Text style={styles.champMeta}>
                {getDivisionById(current.divisionId)?.label} · Temporada {current.season}
              </Text>
            </View>
          </View>

          {standings.map((group) => (
            <View key={group.groupId} style={styles.section}>
              <Text style={styles.groupTitle}>{group.groupName}</Text>
              <Card noPadding>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, styles.posCell, styles.headerText]}>#</Text>
                  <Text style={[styles.tableCell, styles.teamCell, styles.headerText]}>Equipo</Text>
                  <Text style={[styles.tableCell, styles.numCell, styles.headerText]}>PJ</Text>
                  <Text style={[styles.tableCell, styles.numCell, styles.headerText]}>G</Text>
                  <Text style={[styles.tableCell, styles.numCell, styles.headerText]}>E</Text>
                  <Text style={[styles.tableCell, styles.numCell, styles.headerText]}>P</Text>
                  <Text style={[styles.tableCell, styles.numCell, styles.headerText]}>GF</Text>
                  <Text style={[styles.tableCell, styles.numCell, styles.headerText]}>GC</Text>
                  <Text style={[styles.tableCell, styles.numCell, styles.headerText]}>DG</Text>
                  <Text style={[styles.tableCell, styles.numCell, styles.ptsHeader]}>Pts</Text>
                </View>
                {group.entries.map((entry, idx) => (
                  <View key={entry.teamName} style={[styles.tableRow, idx % 2 === 1 && styles.rowAlt]}>
                    <Text style={[styles.tableCell, styles.posCell]}>{idx + 1}</Text>
                    <Text style={[styles.tableCell, styles.teamCell]} numberOfLines={1}>{entry.teamName}</Text>
                    <Text style={[styles.tableCell, styles.numCell]}>{entry.played}</Text>
                    <Text style={[styles.tableCell, styles.numCell]}>{entry.won}</Text>
                    <Text style={[styles.tableCell, styles.numCell]}>{entry.drawn}</Text>
                    <Text style={[styles.tableCell, styles.numCell]}>{entry.lost}</Text>
                    <Text style={[styles.tableCell, styles.numCell]}>{entry.goalsFor}</Text>
                    <Text style={[styles.tableCell, styles.numCell]}>{entry.goalsAgainst}</Text>
                    <Text style={[styles.tableCell, styles.numCell, entry.goalDifference > 0 && styles.posDiff, entry.goalDifference < 0 && styles.negDiff]}>
                      {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                    </Text>
                    <Text style={[styles.tableCell, styles.numCell, styles.ptsValue]}>{entry.points}</Text>
                  </View>
                ))}
              </Card>
            </View>
          ))}

          {current.groups && (
            <View style={styles.section}>
              <Text style={styles.groupTitle}>Grupos</Text>
              {current.groups.map((g) => (
                <Card key={g.id}>
                  <Text style={styles.gName}>{g.name}</Text>
                  <Text style={styles.gTeams}>{g.teams.join(' · ')}</Text>
                  <Text style={styles.gClassify}>Clasifican: {g.qualifyCount} equipo{g.qualifyCount > 1 ? 's' : ''}</Text>
                </Card>
              ))}
            </View>
          )}
        </>
      )}

      {activeChamps.length === 0 && (
        <Text style={styles.empty}>No hay campeonatos activos</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  champBar: { maxHeight: 52, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  champContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  champChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  champChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  champText: { fontSize: 13, color: Colors.textSecondary },
  champTextActive: { color: Colors.white, fontWeight: '700' },
  champHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  champInfo: { flex: 1 },
  champName: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  champMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  groupTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.secondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  tableHeader: { backgroundColor: Colors.secondary, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  rowAlt: { backgroundColor: Colors.background },
  tableCell: { fontSize: 12, color: Colors.textPrimary },
  headerText: { color: Colors.white, fontWeight: 'bold', fontSize: 11 },
  posCell: { width: 24 },
  teamCell: { flex: 1, fontWeight: '500' },
  numCell: { width: 28, textAlign: 'center' },
  posDiff: { color: Colors.success },
  negDiff: { color: Colors.error },
  ptsHeader: { color: Colors.warning, fontWeight: 'bold' },
  ptsValue: { fontWeight: 'bold', color: Colors.secondary },
  gName: { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  gTeams: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  gClassify: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14, padding: 16 },
});
