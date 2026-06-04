import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Championship, TournamentGroup, TournamentPhase } from '../../types';
import { Colors } from '../../constants/colors';
import { DIVISIONS } from '../../constants/divisions';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminMatchStackParams } from '../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<AdminMatchStackParams>;

export default function TournamentSetupScreen() {
  const nav = useNavigation<Nav>();
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [selectedDivision, setSelectedDivision] = useState('');
  const [phase, setPhase] = useState<TournamentPhase>('league');
  const [teams, setTeams] = useState('');
  const [pointsWin, setPointsWin] = useState('3');
  const [pointsDraw, setPointsDraw] = useState('1');
  const [groupConfig, setGroupConfig] = useState('');

  const load = async () => {
    const snap = await getDocs(collection(db, 'championships'));
    setChampionships(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Championship)));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !selectedDivision || !teams.trim()) {
      Alert.alert('Campos requeridos', 'Completá nombre, división y equipos.');
      return;
    }

    const teamList = teams.split(',').map((t) => t.trim()).filter(Boolean);
    let groups: TournamentGroup[] | undefined;

    if (phase === 'group' && groupConfig.trim()) {
      // Parse group config: "Grupo A: Equipo1, Equipo2; Grupo B: Equipo3, Equipo4 | 2"
      // Format: "GroupName:team1,team2|qualifyCount;GroupName2:team3,team4|qualifyCount"
      groups = groupConfig.split(';').map((g, i) => {
        const [meta, qualify] = g.split('|');
        const [groupName, teamsStr] = meta.split(':');
        return {
          id: `group_${i}`,
          name: groupName?.trim() ?? `Grupo ${i + 1}`,
          teams: teamsStr?.split(',').map((t) => t.trim()).filter(Boolean) ?? [],
          qualifyCount: parseInt(qualify ?? '2', 10),
        };
      });
    }

    try {
      await addDoc(collection(db, 'championships'), {
        name: name.trim(),
        season,
        divisionId: selectedDivision,
        phase,
        teams: teamList,
        groups,
        pointsWin: parseInt(pointsWin, 10),
        pointsDraw: parseInt(pointsDraw, 10),
        pointsLoss: 0,
        isActive: true,
        startDate: Date.now(),
      });
      Alert.alert('Creado', 'Campeonato creado correctamente.');
      setShowCreate(false);
      load();
    } catch {
      Alert.alert('Error', 'No se pudo crear el campeonato.');
    }
  };

  const handleToggleActive = async (champ: Championship) => {
    await updateDoc(doc(db, 'championships', champ.id), { isActive: !champ.isActive });
    load();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
        <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.createBtnText}>Crear Campeonato</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Campeonatos</Text>
      {championships.map((c) => (
        <Card key={c.id}>
          <View style={styles.champRow}>
            <View style={styles.champInfo}>
              <Text style={styles.champName}>{c.name}</Text>
              <Text style={styles.champMeta}>{c.season} · {DIVISIONS.find((d) => d.id === c.divisionId)?.label ?? c.divisionId}</Text>
              <Text style={styles.champTeams}>{c.teams.length} equipos · {c.phase}</Text>
            </View>
            <View style={styles.champActions}>
              <View style={[styles.activeBadge, !c.isActive && styles.inactiveBadge]}>
                <Text style={[styles.activeText, !c.isActive && styles.inactiveText]}>
                  {c.isActive ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleToggleActive(c)}>
                <Ionicons name={c.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={28} color={c.isActive ? Colors.warning : Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nav.navigate('StandingsAdmin', { championshipId: c.id })}>
                <Ionicons name="podium-outline" size={28} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Campeonato</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Nombre *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej: Apertura 2024" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.fieldLabel}>Temporada</Text>
          <TextInput style={styles.input} value={season} onChangeText={setSeason} keyboardType="numeric" />

          <Text style={styles.fieldLabel}>División *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.divScroll} contentContainerStyle={styles.divContent}>
            {DIVISIONS.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.divChip, selectedDivision === d.id && styles.divChipActive]}
                onPress={() => setSelectedDivision(d.id)}
              >
                <Text style={[styles.divChipText, selectedDivision === d.id && styles.divChipTextActive]} numberOfLines={2}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Tipo de torneo</Text>
          <View style={styles.phaseRow}>
            {(['league', 'group', 'knockout'] as TournamentPhase[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.phaseChip, phase === p && styles.phaseChipActive]}
                onPress={() => setPhase(p)}
              >
                <Text style={[styles.phaseText, phase === p && styles.phaseTextActive]}>{p === 'league' ? 'Liga' : p === 'group' ? 'Grupos' : 'Eliminación'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Equipos * (separados por coma)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={teams}
            onChangeText={setTeams}
            placeholder="Ej: Estrella del Sur, Atlético, Deportivo..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />

          {phase === 'group' && (
            <>
              <Text style={styles.fieldLabel}>Configuración de grupos</Text>
              <Text style={styles.fieldHint}>Formato: NombreGrupo:equipo1,equipo2|clasifican;NombreGrupo2:equipo3,equipo4|clasifican</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={groupConfig}
                onChangeText={setGroupConfig}
                placeholder="Grupo A:Estrella,Atlético|2;Grupo B:Deportivo,Unión|2"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
              />
            </>
          )}

          <View style={styles.pointsRow}>
            <View style={styles.pointsField}>
              <Text style={styles.fieldLabel}>Pts victoria</Text>
              <TextInput style={styles.input} value={pointsWin} onChangeText={setPointsWin} keyboardType="numeric" />
            </View>
            <View style={styles.pointsField}>
              <Text style={styles.fieldLabel}>Pts empate</Text>
              <TextInput style={styles.input} value={pointsDraw} onChangeText={setPointsDraw} keyboardType="numeric" />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
            <Text style={styles.saveBtnText}>Crear Campeonato</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.secondary, borderRadius: 14, padding: 14, marginBottom: 20 },
  createBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },
  champRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  champInfo: { flex: 1 },
  champName: { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary },
  champMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  champTeams: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  champActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeBadge: { backgroundColor: Colors.successLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  inactiveBadge: { backgroundColor: Colors.background },
  activeText: { fontSize: 11, color: Colors.success, fontWeight: '700' },
  inactiveText: { color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.white },
  modalContent: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 14 },
  fieldHint: { fontSize: 11, color: Colors.textMuted, marginBottom: 6, marginTop: -4 },
  input: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, fontSize: 14, color: Colors.textPrimary },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  divScroll: { maxHeight: 80 },
  divContent: { gap: 8, paddingVertical: 4 },
  divChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, maxWidth: 140 },
  divChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  divChipText: { fontSize: 11, color: Colors.textSecondary },
  divChipTextActive: { color: Colors.white, fontWeight: '700' },
  phaseRow: { flexDirection: 'row', gap: 8 },
  phaseChip: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  phaseChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  phaseText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  phaseTextActive: { color: Colors.white, fontWeight: '700' },
  pointsRow: { flexDirection: 'row', gap: 12 },
  pointsField: { flex: 1 },
  saveBtn: { backgroundColor: Colors.secondary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
