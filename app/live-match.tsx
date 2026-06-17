import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchUserProfileByUID, fetchPlayersByCategory, UserProfile, hasPermission } from '../lib/user';
import { FixtureMatch, MatchGoal, matchArgDateStr, toArgDateStr } from '../lib/fixtures';
import {
  subscribeMatch, startMatch, pauseTimer, resumeTimer,
  endFirstHalf, startSecondHalf, startExtraTime, startPenalties,
  endMatch, suspendMatch, resumeFromSuspension, setExtraMinutes,
  addGoal, removeGoal, setFinalResult, finalizeMatch,
  getElapsedSeconds, formatElapsedTime,
  PERIOD_LABELS, PERIOD_SHORT, ACTIVE_PERIODS,
} from '../lib/live-match';
import { Colors } from '../constants/Colors';

export default function LiveMatchScreen() {
  const { matchId, categoryId, categoryName, league, season } = useLocalSearchParams<{
    matchId: string;
    categoryId: string;
    categoryName?: string;
    league?: string;
    season?: string;
  }>();

  const [match, setMatch] = useState<FixtureMatch | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showExtraTimeModal, setShowExtraTimeModal] = useState(false);
  const [goalTeam, setGoalTeam] = useState<'local' | 'away'>('local');
  const [goalPlayerId, setGoalPlayerId] = useState<string | null>(null);
  const [goalPlayerName, setGoalPlayerName] = useState<string | null>(null);
  const [goalMinute, setGoalMinute] = useState('');
  const [extraTimeInput, setExtraTimeInput] = useState('');

  const [resultLocal, setResultLocal] = useState('');
  const [resultAway, setResultAway] = useState('');
  const [savingResult, setSavingResult] = useState(false);
  const [editingResult, setEditingResult] = useState(false);

  const isAdmin = hasPermission(profile, 'startLiveMatch') || hasPermission(profile, 'modifyLiveScore');
  const todayStr = toArgDateStr(new Date());
  // Determina de qué lado juega Estrella del Sur para mostrar la lista de jugadores correctamente
  const isEstrellMatch =
    (match?.localTeam ?? '').toLowerCase().includes('estrella') ||
    (match?.awayTeam ?? '').toLowerCase().includes('estrella');
  const estrellaSide: 'local' | 'away' =
    (match?.localTeam ?? '').toLowerCase().includes('estrella') ? 'local' : 'away';

  useEffect(() => {
    if (!matchId) return;
    return subscribeMatch(matchId, m => { setMatch(m); setLoading(false); });
  }, [matchId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) fetchUserProfileByUID(user.uid).then(setProfile);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    fetchPlayersByCategory(categoryId).then(setPlayers);
  }, [categoryId]);

  useEffect(() => {
    if (match?.status !== 'live' || !match?.liveData?.timerRunning) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [match?.status, match?.liveData?.timerRunning]);

  if (loading || !match) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  const ld = match.liveData;
  const elapsed = getElapsedSeconds(match);
  const period = ld?.period;
  const goals = ld?.goals ?? [];
  const isActivePeriod = !!(period && ACTIVE_PERIODS.includes(period));
  const matchDate = matchArgDateStr(match);
  const isPastPending = match.status === 'pending' && matchDate != null && matchDate < todayStr;
  const isTodayPending = match.status === 'pending' && matchDate === todayStr;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleStart = () => {
    const isFutsal = (categoryId ?? '').includes('futsal');
    Alert.alert(
      'Iniciar partido',
      `¿Confirmar inicio?\n${match.localTeam} vs ${match.awayTeam}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'INICIAR', onPress: () => startMatch(match.id, isFutsal) },
      ]
    );
  };

  const handleEndFirstHalf = () =>
    Alert.alert('Fin primer tiempo', '¿Confirmar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'CONFIRMAR', onPress: () => endFirstHalf(match.id, elapsed) },
    ]);

  const handleEndMatch = () =>
    Alert.alert('Fin del partido', '¿Confirmar fin del partido?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'FINALIZAR', style: 'destructive', onPress: () => endMatch(match.id) },
    ]);

  const handleSuspend = () =>
    Alert.alert('Suspender partido', '¿Confirmar suspensión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'SUSPENDER', style: 'destructive', onPress: () => suspendMatch(match.id) },
    ]);

  const handleOpenGoalModal = () => {
    setGoalTeam('local');
    setGoalPlayerId(null);
    setGoalPlayerName(null);
    setGoalMinute(match.status === 'live' ? String(Math.floor(elapsed / 60)) : '');
    setShowGoalModal(true);
  };

  const handleConfirmGoal = () => {
    if (goalTeam === estrellaSide && players.length > 0 && !goalPlayerId) {
      Alert.alert('Seleccioná el jugador');
      return;
    }
    const goal: MatchGoal = {
      id: `goal-${Date.now()}`,
      team: goalTeam,
      playerId: goalTeam === estrellaSide ? goalPlayerId : null,
      playerName: goalTeam === estrellaSide ? goalPlayerName : null,
      minute: goalMinute ? parseInt(goalMinute, 10) : null,
    };
    addGoal(match.id, goal, goals);
    setShowGoalModal(false);
  };

  const handleRemoveGoal = (goalId: string) =>
    Alert.alert('Eliminar gol', '¿Eliminar este gol?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'ELIMINAR', style: 'destructive', onPress: () => removeGoal(match.id, goalId, goals) },
    ]);

  const handleConfirmExtraTime = () => {
    const mins = parseInt(extraTimeInput, 10);
    if (!isNaN(mins) && mins >= 0) setExtraMinutes(match.id, mins);
    setShowExtraTimeModal(false);
  };

  const handleUpdateResult = async () => {
    const local = parseInt(resultLocal, 10);
    const away = parseInt(resultAway, 10);
    if (isNaN(local) || isNaN(away)) { Alert.alert('Ingresá ambos resultados'); return; }
    setSavingResult(true);
    await setFinalResult(match.id, local, away);
    setSavingResult(false);
    setEditingResult(false);
  };

  const handleSaveResult = async () => {
    const local = parseInt(resultLocal, 10);
    const away = parseInt(resultAway, 10);
    const hasGoals = goals.length > 0;

    if (!hasGoals && (isNaN(local) || isNaN(away))) {
      Alert.alert('Ingresá el resultado o agregá los goles');
      return;
    }
    setSavingResult(true);
    if (!isNaN(local) && !isNaN(away)) {
      await setFinalResult(match.id, local, away);
    } else {
      await finalizeMatch(match.id);
    }
    setSavingResult(false);
  };

  // ── Status display ────────────────────────────────────────────────────

  let statusLabel = 'PENDIENTE';
  let statusColor = Colors.mediumGray;
  if (match.status === 'live') { statusLabel = '● EN VIVO'; statusColor = Colors.primary; }
  else if (match.status === 'played') { statusLabel = 'FINALIZADO'; }
  else if (match.status === 'suspended') { statusLabel = '⚠ SUSPENDIDO'; statusColor = Colors.gold; }
  else if (isPastPending) statusLabel = 'SIN RESULTADO';

  const displayLeague = `${league ?? ''}${season ? ` ${season}` : ''}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{categoryName ?? ''}</Text>
          {displayLeague ? <Text style={styles.headerSub}>{displayLeague}</Text> : null}
        </View>
        <View style={styles.statusWrap}>
          <Text style={[styles.statusBadge, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Score card */}
        <View style={styles.scoreCard}>
          <Text style={styles.fechaLabel}>Fecha {match.fechaNum}</Text>
          {match.venue ? <Text style={styles.venueLabel}>{match.venue}</Text> : null}

          <View style={styles.scoreRow}>
            <Text style={styles.teamLabel} numberOfLines={2}>{match.localTeam}</Text>
            <View style={styles.scoreCenter}>
              <Text style={styles.scoreNum}>{match.scoreLocal ?? 0}</Text>
              <Text style={styles.scoreSep}>–</Text>
              <Text style={styles.scoreNum}>{match.scoreAway ?? 0}</Text>
            </View>
            <Text style={[styles.teamLabel, styles.teamRight]} numberOfLines={2}>{match.awayTeam}</Text>
          </View>

          {match.status === 'live' && ld && (
            <View style={styles.timerBlock}>
              {isActivePeriod ? (
                <>
                  <Text style={styles.timerText}>
                    {formatElapsedTime(match, elapsed)}
                    {ld.extraMinutes > 0 ? <Text style={styles.extraMin}> +{ld.extraMinutes}'</Text> : null}
                  </Text>
                  {!ld.timerRunning && (
                    <Text style={styles.pausedLabel}>⏸ PAUSADO</Text>
                  )}
                </>
              ) : null}
              <Text style={styles.periodLabel}>{PERIOD_LABELS[ld.period]}</Text>
            </View>
          )}
          {match.status === 'suspended' && (
            <Text style={[styles.periodLabel, { color: Colors.gold, marginTop: 12 }]}>SUSPENDIDO</Text>
          )}
          {match.status === 'played' && (
            <Text style={[styles.periodLabel, { marginTop: 12 }]}>FINALIZADO</Text>
          )}
        </View>

        {/* Admin controls */}
        {isAdmin && (
          <View style={styles.controlsCard}>

            {/* Today pending → start */}
            {isTodayPending && (
              <TouchableOpacity style={styles.btnPrimary} onPress={handleStart} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>▶  INICIAR PARTIDO</Text>
              </TouchableOpacity>
            )}

            {/* Past pending → mark result */}
            {isPastPending && (
              <>
                {isEstrellMatch && (
                  <TouchableOpacity style={styles.btnGoal} onPress={handleOpenGoalModal} activeOpacity={0.8}>
                    <Text style={styles.btnGoalText}>⚽  AGREGAR GOL</Text>
                  </TouchableOpacity>
                )}

                {goals.length > 0 ? (
                  <TouchableOpacity
                    style={[styles.btnPrimary, savingResult && { opacity: 0.6 }]}
                    onPress={handleSaveResult}
                    disabled={savingResult}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnPrimaryText}>
                      {savingResult ? 'GUARDANDO...' : 'FINALIZAR PARTIDO'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.orSeparator}>— o ingresá solo el resultado —</Text>
                    <View style={styles.resultRow}>
                      <View style={styles.resultSide}>
                        <Text style={styles.resultTeam} numberOfLines={1}>{match.localTeam}</Text>
                        <TextInput
                          style={styles.resultInput}
                          value={resultLocal}
                          onChangeText={setResultLocal}
                          keyboardType="numeric"
                          maxLength={2}
                          placeholder="0"
                          placeholderTextColor={Colors.inputBorder}
                        />
                      </View>
                      <Text style={styles.resultDash}>–</Text>
                      <View style={[styles.resultSide, { alignItems: 'flex-start' }]}>
                        <Text style={styles.resultTeam} numberOfLines={1}>{match.awayTeam}</Text>
                        <TextInput
                          style={styles.resultInput}
                          value={resultAway}
                          onChangeText={setResultAway}
                          keyboardType="numeric"
                          maxLength={2}
                          placeholder="0"
                          placeholderTextColor={Colors.inputBorder}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.btnPrimary, savingResult && { opacity: 0.6 }]}
                      onPress={handleSaveResult}
                      disabled={savingResult}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnPrimaryText}>
                        {savingResult ? 'GUARDANDO...' : 'CONFIRMAR RESULTADO'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* Live controls */}
            {match.status === 'live' && ld && (
              <>
                {/* Futsal timer pause/resume */}
                {ld.isFutsal && isActivePeriod && (
                  ld.timerRunning ? (
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => pauseTimer(match.id, elapsed)} activeOpacity={0.8}>
                      <Text style={styles.btnSecondaryText}>⏸  PAUSAR TIEMPO</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => resumeTimer(match.id)} activeOpacity={0.8}>
                      <Text style={styles.btnPrimaryText}>▶  REANUDAR TIEMPO</Text>
                    </TouchableOpacity>
                  )
                )}

                {/* Add goal (active periods) */}
                {isActivePeriod && (
                  <TouchableOpacity style={styles.btnGoal} onPress={handleOpenGoalModal} activeOpacity={0.8}>
                    <Text style={styles.btnGoalText}>⚽  AGREGAR GOL</Text>
                  </TouchableOpacity>
                )}

                {/* Extra time */}
                {isActivePeriod && (
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={() => { setExtraTimeInput(String(ld.extraMinutes ?? 0)); setShowExtraTimeModal(true); }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnSecondaryText}>
                      ⏱  TIEMPO ADICIONAL{ld.extraMinutes > 0 ? `  (+${ld.extraMinutes}')` : ''}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Period transitions */}
                {period === 'first_half' && (
                  <TouchableOpacity style={styles.btnDanger} onPress={handleEndFirstHalf} activeOpacity={0.8}>
                    <Text style={styles.btnDangerText}>FIN PRIMER TIEMPO</Text>
                  </TouchableOpacity>
                )}
                {period === 'half_time' && (
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => startSecondHalf(match.id)} activeOpacity={0.8}>
                    <Text style={styles.btnPrimaryText}>▶  INICIAR SEGUNDO TIEMPO</Text>
                  </TouchableOpacity>
                )}
                {period === 'second_half' && (
                  <>
                    <TouchableOpacity style={styles.btnDanger} onPress={handleEndMatch} activeOpacity={0.8}>
                      <Text style={styles.btnDangerText}>FIN DEL PARTIDO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => startExtraTime(match.id)} activeOpacity={0.8}>
                      <Text style={styles.btnSecondaryText}>ALARGUE</Text>
                    </TouchableOpacity>
                  </>
                )}
                {period === 'extra_time' && (
                  <>
                    <TouchableOpacity style={styles.btnDanger} onPress={handleEndMatch} activeOpacity={0.8}>
                      <Text style={styles.btnDangerText}>FIN ALARGUE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => startPenalties(match.id)} activeOpacity={0.8}>
                      <Text style={styles.btnSecondaryText}>PENALES</Text>
                    </TouchableOpacity>
                  </>
                )}
                {period === 'penalties' && (
                  <TouchableOpacity style={styles.btnDanger} onPress={handleEndMatch} activeOpacity={0.8}>
                    <Text style={styles.btnDangerText}>FIN PENALES</Text>
                  </TouchableOpacity>
                )}

                {/* Suspend */}
                <TouchableOpacity style={styles.btnSuspend} onPress={handleSuspend} activeOpacity={0.8}>
                  <Text style={styles.btnSuspendText}>⚠  SUSPENDER PARTIDO</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Resume from suspension */}
            {match.status === 'suspended' && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => resumeFromSuspension(match.id)} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>▶  REACTIVAR PARTIDO</Text>
              </TouchableOpacity>
            )}

            {/* Editar resultado de partido finalizado */}
            {match.status === 'played' && (
              editingResult ? (
                <>
                  <Text style={styles.sectionLabel}>EDITAR RESULTADO</Text>
                  <View style={styles.resultRow}>
                    <View style={styles.resultSide}>
                      <Text style={styles.resultTeam} numberOfLines={1}>{match.localTeam}</Text>
                      <TextInput
                        style={styles.resultInput}
                        value={resultLocal}
                        onChangeText={setResultLocal}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor={Colors.inputBorder}
                      />
                    </View>
                    <Text style={styles.resultDash}>–</Text>
                    <View style={[styles.resultSide, { alignItems: 'flex-start' }]}>
                      <Text style={styles.resultTeam} numberOfLines={1}>{match.awayTeam}</Text>
                      <TextInput
                        style={styles.resultInput}
                        value={resultAway}
                        onChangeText={setResultAway}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor={Colors.inputBorder}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnPrimary, savingResult && { opacity: 0.6 }]}
                    onPress={handleUpdateResult}
                    disabled={savingResult}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnPrimaryText}>
                      {savingResult ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => setEditingResult(false)} activeOpacity={0.8}>
                    <Text style={styles.btnSecondaryText}>CANCELAR</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => {
                    setResultLocal(String(match.scoreLocal ?? ''));
                    setResultAway(String(match.scoreAway ?? ''));
                    setEditingResult(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnSecondaryText}>✎  EDITAR RESULTADO</Text>
                </TouchableOpacity>
              )
            )}

            {/* Agregar gol (solo partidos de Estrella) */}
            {match.status === 'played' && isEstrellMatch && (
              <TouchableOpacity style={styles.btnGoal} onPress={handleOpenGoalModal} activeOpacity={0.8}>
                <Text style={styles.btnGoalText}>⚽  AGREGAR GOL</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Goals list (solo partidos de Estrella) */}
        {goals.length > 0 && isEstrellMatch && (
          <View style={styles.goalsCard}>
            <Text style={styles.sectionLabel}>GOLES</Text>
            {goals.map((g, i) => (
              <View key={g.id} style={[styles.goalRow, i === goals.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.goalMinute}>{g.minute != null ? `${g.minute}'` : '—'}</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalPlayer}>
                    {g.playerName ?? (g.team === 'local' ? match.localTeam : match.awayTeam)}
                  </Text>
                  <Text style={styles.goalTeam}>
                    {g.team === 'local' ? match.localTeam : match.awayTeam}
                  </Text>
                </View>
                {isAdmin && (
                  <TouchableOpacity onPress={() => handleRemoveGoal(g.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.goalRemove}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add Goal Modal ── */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⚽ AGREGAR GOL</Text>

            <Text style={styles.modalLabel}>Equipo</Text>
            <View style={styles.teamToggle}>
              {(['local', 'away'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.teamToggleBtn, goalTeam === t && styles.teamToggleBtnOn]}
                  onPress={() => { setGoalTeam(t); setGoalPlayerId(null); setGoalPlayerName(null); }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.teamToggleBtnText, goalTeam === t && styles.teamToggleBtnTextOn]}
                    numberOfLines={1}
                  >
                    {t === 'local' ? match.localTeam : match.awayTeam}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {goalTeam === estrellaSide && (
              <>
                <Text style={styles.modalLabel}>Jugador</Text>
                <ScrollView style={styles.playerList} nestedScrollEnabled>
                  {players.length === 0 ? (
                    <Text style={styles.emptyText}>Sin jugadores registrados en esta categoría</Text>
                  ) : players.map(p => {
                    const name = `${p.name ?? ''} ${p.surname ?? ''}`.trim();
                    const active = goalPlayerId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.playerRow, active && styles.playerRowOn]}
                        onPress={() => { setGoalPlayerId(p.id); setGoalPlayerName(name); }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.playerRowText, active && styles.playerRowTextOn]}>{name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {isEstrellMatch && (
              <>
                <Text style={styles.modalLabel}>Minuto (opcional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={goalMinute}
                  onChangeText={setGoalMinute}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="Ej: 18"
                  placeholderTextColor={Colors.inputBorder}
                />
              </>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowGoalModal(false)} activeOpacity={0.8}>
                <Text style={styles.modalBtnCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleConfirmGoal} activeOpacity={0.8}>
                <Text style={styles.modalBtnConfirmText}>CONFIRMAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Extra Time Modal ── */}
      <Modal visible={showExtraTimeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: 300 }]}>
            <Text style={styles.modalTitle}>⏱ TIEMPO ADICIONAL</Text>
            <Text style={styles.modalLabel}>Minutos adicionales</Text>
            <TextInput
              style={styles.modalInput}
              value={extraTimeInput}
              onChangeText={setExtraTimeInput}
              keyboardType="numeric"
              maxLength={2}
              placeholder="0"
              placeholderTextColor={Colors.inputBorder}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowExtraTimeModal(false)} activeOpacity={0.8}>
                <Text style={styles.modalBtnCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleConfirmExtraTime} activeOpacity={0.8}>
                <Text style={styles.modalBtnConfirmText}>CONFIRMAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.lightGray },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.inputBorder,
  },
  backBtn: { width: 70, paddingVertical: 4 },
  backText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.darkGray, textAlign: 'center' },
  headerSub: { fontSize: 11, color: Colors.mediumGray, marginTop: 2 },
  statusWrap: { width: 80, alignItems: 'flex-end' },
  statusBadge: { fontSize: 11, fontWeight: '700', textAlign: 'right' },

  // Score card
  scoreCard: {
    margin: 16, backgroundColor: Colors.white, borderRadius: 16,
    padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  fechaLabel: { fontSize: 11, fontWeight: '700', color: Colors.mediumGray, letterSpacing: 1.5, marginBottom: 4 },
  venueLabel: { fontSize: 11, color: Colors.mediumGray, marginBottom: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 8 },
  teamLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.darkGray, textAlign: 'left' },
  teamRight: { textAlign: 'right' },
  scoreCenter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  scoreNum: { fontSize: 44, fontWeight: '900', color: Colors.darkGray, lineHeight: 52 },
  scoreSep: { fontSize: 32, color: Colors.mediumGray, marginHorizontal: 8, lineHeight: 52 },
  timerBlock: { alignItems: 'center', marginTop: 14 },
  timerText: { fontSize: 36, fontWeight: '900', color: Colors.primary, lineHeight: 42 },
  extraMin: { fontSize: 20, color: Colors.mediumGray },
  pausedLabel: { fontSize: 11, fontWeight: '700', color: Colors.gold, letterSpacing: 1, marginTop: 2 },
  periodLabel: { fontSize: 12, fontWeight: '700', color: Colors.mediumGray, letterSpacing: 1.5, marginTop: 6 },

  // Controls card
  controlsCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.mediumGray,
    letterSpacing: 1.5, marginBottom: 14,
  },
  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', marginBottom: 10,
  },
  btnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  btnSecondary: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    alignItems: 'center', marginBottom: 10,
  },
  btnSecondaryText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  btnGoal: {
    backgroundColor: Colors.secondary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', marginBottom: 10,
  },
  btnGoalText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  btnDanger: {
    backgroundColor: '#FFF0F1', borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', marginBottom: 10,
  },
  btnDangerText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },
  btnSuspend: {
    borderWidth: 1.5, borderColor: Colors.gold, borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    alignItems: 'center', marginTop: 4, marginBottom: 0,
  },
  btnSuspendText: { color: Colors.gold, fontWeight: '700', fontSize: 13 },

  // Past result form
  orSeparator: {
    textAlign: 'center', fontSize: 11, color: Colors.mediumGray,
    marginVertical: 14, letterSpacing: 0.5,
  },
  resultRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 },
  resultSide: { flex: 1, alignItems: 'flex-end' },
  resultTeam: { fontSize: 10, color: Colors.mediumGray, marginBottom: 6, fontWeight: '600' },
  resultInput: {
    borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 10,
    paddingVertical: 8, width: 72, textAlign: 'center',
    fontSize: 32, fontWeight: '800', color: Colors.darkGray,
  },
  resultDash: { fontSize: 28, fontWeight: '700', color: Colors.mediumGray, paddingBottom: 6 },

  // Goals card
  goalsCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  goalRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.inputBorder,
  },
  goalMinute: { width: 38, fontSize: 13, fontWeight: '800', color: Colors.primary },
  goalInfo: { flex: 1 },
  goalPlayer: { fontSize: 14, fontWeight: '700', color: Colors.darkGray },
  goalTeam: { fontSize: 11, color: Colors.mediumGray, marginTop: 1 },
  goalRemove: { fontSize: 16, color: Colors.inputBorder, paddingLeft: 8 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 16, fontWeight: '800', color: Colors.darkGray,
    letterSpacing: 0.5, marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.mediumGray,
    letterSpacing: 1.2, marginTop: 14, marginBottom: 8,
  },
  teamToggle: { flexDirection: 'row', gap: 10 },
  teamToggleBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1.5, borderColor: Colors.inputBorder, alignItems: 'center',
  },
  teamToggleBtnOn: { borderColor: Colors.primary, backgroundColor: '#FFF0F1' },
  teamToggleBtnText: { fontWeight: '700', color: Colors.mediumGray, fontSize: 12 },
  teamToggleBtnTextOn: { color: Colors.primary },
  playerList: { maxHeight: 190, borderRadius: 10, borderWidth: 1, borderColor: Colors.inputBorder },
  playerRow: {
    paddingVertical: 13, paddingHorizontal: 14,
    borderBottomWidth: 1, borderColor: Colors.inputBorder,
  },
  playerRowOn: { backgroundColor: '#FFF0F1' },
  playerRowText: { fontSize: 14, color: Colors.darkGray, fontWeight: '600' },
  playerRowTextOn: { color: Colors.primary, fontWeight: '700' },
  emptyText: { padding: 14, color: Colors.mediumGray, fontSize: 13 },
  modalInput: {
    borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 16,
    fontSize: 20, fontWeight: '700', textAlign: 'center', color: Colors.darkGray,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.inputBorder, alignItems: 'center',
  },
  modalBtnCancelText: { fontWeight: '700', color: Colors.mediumGray },
  modalBtnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  modalBtnConfirmText: { fontWeight: '700', color: Colors.white },

  timerControls: { marginBottom: 10 },
});
