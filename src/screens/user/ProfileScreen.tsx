import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { Colors } from '../../constants/colors';
import { getDivisionById } from '../../constants/divisions';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const division = user?.divisionId ? getDivisionById(user.divisionId) : null;

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const initials = (user?.displayName ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.displayName ?? 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {division && (
          <View style={[styles.divisionTag, { backgroundColor: division.color }]}>
            <Text style={styles.divisionTagText}>{division.label}</Text>
          </View>
        )}
        <View style={[styles.roleBadge, user?.role === 'admin' && styles.adminBadge]}>
          <Text style={styles.roleText}>{user?.role === 'admin' ? '⚙️ Administrador' : '⚽ Socio'}</Text>
        </View>
      </View>

      {/* Player Stats */}
      {user?.playerProfile && (
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estadísticas</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user.playerProfile.totalGoals}</Text>
              <Text style={styles.statLabel}>Goles</Text>
            </View>
            {user.playerProfile.jerseyNumber && (
              <View style={styles.stat}>
                <Text style={styles.statNumber}>#{user.playerProfile.jerseyNumber}</Text>
                <Text style={styles.statLabel}>Camiseta</Text>
              </View>
            )}
            {user.playerProfile.position && (
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.playerProfile.position}</Text>
                <Text style={styles.statLabel}>Posición</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Account Info */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>Información de cuenta</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>
        {division && (
          <View style={styles.infoRow}>
            <Ionicons name="football-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{division.label}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            Socio desde {new Date(user?.createdAt ?? Date.now()).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}
          </Text>
        </View>
      </Card>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: Colors.white },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  email: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  divisionTag: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  divisionTagText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  roleBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.infoLight },
  adminBadge: { backgroundColor: Colors.secondary },
  roleText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  statsCard: { marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCard: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  infoText: { fontSize: 14, color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
});
