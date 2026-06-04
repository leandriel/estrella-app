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
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Match, MatchStatus } from '../../types';
import { addGoal, finishMatch, setMatchStatus, updateMatchScore, getPlayersByDivision } from '../../services/matchService';
import { Colors } from '../../constants/colors';
import { getDivisionById } from '../../constants/divisions';
import Card from '../../components/common/Card';
import { MatchStatusBadge } from '../../components/common/Badge';
import { Ionicons } from '@expo/vector-icons';
import { AdminMatchStackParams } from '../../navigation/AdminNavigator';

type Route = RouteProp<AdminMatchStackParams, 'EditMatch'>;

const STATUS_OPTIONS: { value: MatchStatus; label: string; color: string }[] = [
  { value: 'upcoming', label: 'Próximo', color: Colors.info },
  { value: 'live', label: 'En Vivo', color: Colors.error },
  { value: 'finished', label: 'Finalizado', color: Colors.success },
  { value: 'suspended', label: 'Suspendido', color: Colors.warning },
  { value: 'postponed', label: 'Postergado', color: Colors.textSecondary },
];

export default function EditMatchScreen() {
  const { params } = useRoute<Route>();
  const nav = useNavigation();
  const [match, setMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTeam, setGoalTeam] = useState<'home' | 'away'>('home');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    loadMatch();
  }, [params.matchId]);

  const loadMatch = async () => {
    setLoading(true);
    const snap = await getDoc(doc(db, 'matches', params.matchId));
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() } as Match;
      setMatch(data);
      setHomeScore(String(data.homeScore));
      setAwayScore(String(data.awayScore));
      // Load players for goal recording
      const divPlayers = await getPlayersByDivision(data.divisionId);
      setPlayers(divPlayers);
    }
    setLoading(false);
  };

  const handleSaveScore = async () => {
    if (!match) return;
    setSaving(true);
    try {
      await updateMatchScore(match.id, parseInt(homeScore, 10), parseInt(awayScore, 10));
      Alert.alert('Guardado', 'Resultado actualizado correctamente.');
      loadMatch();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el resultado.');
    }
    setSaving(false);
  };

  const handleAddGoal = async (player: any) => {
    if (!match) return;
    setShowGoalModal(false);
    try {
      await addGoal(match.id, player.id, player.displayName, goalTeam);
      loadMatch();
    } catch {
      Alert.alert('Error', 'No se pudo registrar el gol.');
    }
  };

  const handleChangeStatus = async (status: MatchStatus) => {
    if (!match) return;
    setShowStatusModal(false);
    if (status === 'suspended' && !suspensionReason.trim()) {
      Alert.alert('Motivo requerido', 'Ingresá el motivo de la suspensión.');
      return;
    }
    setSaving(true);
    try {
      if (status === 'finished') {
        await finishMatch(match.id);
      } else {
        await setMatchStatus(match.id, status, suspensionReason);
      }
      loadMatch();
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el estado.');
    }
    setSaving(false);
  };

  if (loading || !match) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const division = getDivisionById(match.divisionId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Match Header */}
      <Card>
        <View style={styles.matchHeader}>
          <Text style={styles.divLabel}>{division?.label}</Text>
          <MatchStatusBadge status={match.status} />
        </View>
        <View style={styles.teamsRow}>
          <Text style={styles.team}>{match.homeTeam}</Text>
          <Text style={styles.currentScore}>{match.homeScore} — {match.awayScore}</Text>
          <Text style={styles.team}>{match.awayTeam}</Text>
        </View>
      </Card>

      {/* Score Editor */}
      <Card>
        <Text style={styles.sectionTitle}>Editar Resultado</Text>
        <View style={styles.scoreEditor}>
          <View style={styles.scoreInput}>
            <Text style={styles.scoreLabel}>{match.homeTeam}</Text>
            <View style={styles.scoreControls}>
              <TouchableOpacity style={styles.scoreBtn} onPress={() => setHomeScore(String(Math.max(0, parseInt(homeScore, 10) - 1)))}>
                <Ionicons name="remove" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.scoreField}
                value={homeScore}
                onChangeText={setHomeScore}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TouchableOpacity style={styles.scoreBtn} onPress={() => setHomeScore(String(parseInt(homeScore, 10) + 1))}>
                <Ionicons name="add" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.scoreSep}>–</Text>

          <View style={styles.scoreInput}>
            <Text style={styles.scoreLabel}>{match.awayTeam}</Text>
            <View style={styles.scoreControls}>
              <TouchableOpacity style={styles.scoreBtn} onPress={() => setAwayScore(String(Math.max(0, parseInt(awayScore, 10) - 1)))}>
                <Ionicons name="remove" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.scoreField}
                value={awayScore}
                onChangeText={setAwayScore}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TouchableOpacity style={styles.scoreBtn} onPress={() => setAwayScore(String(parseInt(awayScore, 10) + 1))}>
                <Ionicons name="add" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveScore} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar Resultado'}</Text>
        </TouchableOpacity>
      </Card>

      {/* Goal Registration */}
      <Card>
        <Text style={styles.sectionTitle}>Registrar Gol</Text>
        <View style={styles.goalBtns}>
          <TouchableOpacity
            style={[styles.goalTeamBtn, { backgroundColor: Colors.primary }]}
            onPress={() => { setGoalTeam('home'); setShowGoalModal(true); }}
          >
            <Ionicons name="football" size={16} color={Colors.white} />
            <Text style={styles.goalTeamBtnText}>⚽ {match.homeTeam}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.goalTeamBtn, { backgroundColor: Colors.secondary }]}
            onPress={() => { setGoalTeam('away'); setShowGoalModal(true); }}
          >
            <Ionicons name="football" size={16} color={Colors.white} />
            <Text style={styles.goalTeamBtnText}>⚽ {match.awayTeam}</Text>
          </TouchableOpacity>
        </View>

        {/* Goals list */}
        {match.goals.length > 0 && (
          <View style={styles.goalsList}>
            <Text style={styles.goalsTitle}>Goles registrados:</Text>
            {match.goals.map((g, i) => (
              <Text key={i} style={styles.goalEntry}>
                ⚽ {g.playerName} ({g.team === 'home' ? match.homeTeam : match.awayTeam}){g.minute ? ` ${g.minute}'` : ''}
              </Text>
            ))}
          </View>
        )}
      </Card>

      {/* Status Change */}
      <Card>
        <Text style={styles.sectionTitle}>Cambiar Estado</Text>
        {match.status === 'suspended' && (
          <TextInput
            style={styles.suspInput}
            placeholder="Motivo de suspensión..."
            placeholderTextColor={Colors.textMuted}
            value={suspensionReason}
            onChangeText={setSuspensionReason}
            multiline
          />
        )}
        <View style={styles.statusBtns}>
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.statusBtn, { borderColor: s.color }, match.status === s.value && { backgroundColor: s.color }]}
              onPress={() => handleChangeStatus(s.value)}
              disabled={saving}
            >
              <Text style={[styles.statusBtnText, { color: match.status === s.value ? Colors.white : s.color }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Goal Player Modal */}
      <Modal visible={showGoalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Quién marcó el gol?</Text>
            <Text style={styles.modalSubtitle}>{goalTeam === 'home' ? match.homeTeam : match.awayTeam}</Text>
            <FlatList
              data={players}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.playerItem} onPress={() => handleAddGoal(item)}>
                  <Ionicons name="person-circle-outline" size={32} color={Colors.primary} />
                  <View>
                    <Text style={styles.playerName}>{item.displayName}</Text>
                    {item.playerProfile?.jerseyNumber && (
                      <Text style={styles.playerMeta}>#{item.playerProfile.jerseyNumber}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No hay jugadores en esta división</Text>}
              style={styles.playerList}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowGoalModal(false)}>
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  divLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  team: { flex: 1, fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center' },
  currentScore: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 14 },
  scoreEditor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreInput: { flex: 1, alignItems: 'center' },
  scoreLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textAlign: 'center' },
  scoreControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  scoreField: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.background, textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  scoreSep: { fontSize: 24, color: Colors.textMuted, paddingHorizontal: 8 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
  goalBtns: { flexDirection: 'row', gap: 10 },
  goalTeamBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 12, gap: 6 },
  goalTeamBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  goalsList: { marginTop: 14, borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10 },
  goalsTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  goalEntry: { fontSize: 13, color: Colors.textPrimary, marginBottom: 4 },
  statusBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 2 },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  suspInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, fontSize: 14, color: Colors.textPrimary, marginBottom: 14, minHeight: 60 },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  playerList: { maxHeight: 320 },
  playerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  playerName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  playerMeta: { fontSize: 12, color: Colors.textSecondary },
  empty: { textAlign: 'center', color: Colors.textMuted, padding: 20 },
  modalClose: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  modalCloseText: { color: Colors.textSecondary, fontWeight: '700' },
});
