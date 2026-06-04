import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { getStandingsForChampionship, recalculateStandings } from '../../utils/standings';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Championship, StandingEntry } from '../../types';
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { AdminMatchStackParams } from '../../navigation/AdminNavigator';

type Route = RouteProp<AdminMatchStackParams, 'StandingsAdmin'>;

export default function StandingsAdminScreen() {
  const { params } = useRoute<Route>();
  const [champ, setChamp] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = async () => {
    setLoading(true);
    const snap = await getDoc(doc(db, 'championships', params.championshipId));
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() } as Championship;
      setChamp(data);
      const s = await getStandingsForChampionship(params.championshipId);
      setStandings(s);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [params.championshipId]);

  const handleRecalculate = async () => {
    if (!champ) return;
    setRecalculating(true);
    try {
      await recalculateStandings(params.championshipId, champ.divisionId);
      await load();
      Alert.alert('Listo', 'Tabla de posiciones recalculada correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo recalcular la tabla.');
    }
    setRecalculating(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{champ?.name}</Text>
        <TouchableOpacity style={styles.recalcBtn} onPress={handleRecalculate} disabled={recalculating}>
          <Ionicons name="refresh" size={16} color={Colors.white} />
          <Text style={styles.recalcText}>{recalculating ? 'Calculando...' : 'Recalcular'}</Text>
        </TouchableOpacity>
      </View>

      {standings.map((group: any) => (
        <View key={group.groupId} style={styles.section}>
          <Text style={styles.groupTitle}>{group.groupName}</Text>
          <Card noPadding>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.pos, styles.hText]}>#</Text>
              <Text style={[styles.cell, styles.team, styles.hText]}>Equipo</Text>
              <Text style={[styles.cell, styles.num, styles.hText]}>PJ</Text>
              <Text style={[styles.cell, styles.num, styles.hText]}>G</Text>
              <Text style={[styles.cell, styles.num, styles.hText]}>E</Text>
              <Text style={[styles.cell, styles.num, styles.hText]}>P</Text>
              <Text style={[styles.cell, styles.num, styles.hText]}>DG</Text>
              <Text style={[styles.cell, styles.num, styles.ptsH]}>Pts</Text>
            </View>
            {(group.entries as StandingEntry[]).map((e, i) => (
              <View key={e.teamName} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
                <Text style={[styles.cell, styles.pos]}>{i + 1}</Text>
                <Text style={[styles.cell, styles.team]} numberOfLines={1}>{e.teamName}</Text>
                <Text style={[styles.cell, styles.num]}>{e.played}</Text>
                <Text style={[styles.cell, styles.num]}>{e.won}</Text>
                <Text style={[styles.cell, styles.num]}>{e.drawn}</Text>
                <Text style={[styles.cell, styles.num]}>{e.lost}</Text>
                <Text style={[styles.cell, styles.num, e.goalDifference > 0 && styles.pos2, e.goalDifference < 0 && styles.neg]}>
                  {e.goalDifference > 0 ? `+${e.goalDifference}` : e.goalDifference}
                </Text>
                <Text style={[styles.cell, styles.num, styles.ptsV]}>{e.points}</Text>
              </View>
            ))}
          </Card>
        </View>
      ))}

      {standings.length === 0 && (
        <Text style={styles.empty}>No hay posiciones calculadas aún. Presioná "Recalcular".</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, flex: 1 },
  recalcBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.secondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  recalcText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  section: { marginBottom: 20 },
  groupTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.secondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center' },
  headerRow: { backgroundColor: Colors.secondary, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  rowAlt: { backgroundColor: Colors.background },
  cell: { fontSize: 12, color: Colors.textPrimary },
  hText: { color: Colors.white, fontWeight: 'bold', fontSize: 11 },
  pos: { width: 22 },
  pos2: { color: Colors.success },
  team: { flex: 1, fontWeight: '500' },
  num: { width: 30, textAlign: 'center' },
  neg: { color: Colors.error },
  ptsH: { color: Colors.warning, fontWeight: 'bold', width: 30, textAlign: 'center' },
  ptsV: { fontWeight: 'bold', color: Colors.secondary, textAlign: 'center' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14, lineHeight: 22 },
});
