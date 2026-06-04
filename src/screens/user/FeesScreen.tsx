import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchFees } from '../../store/slices/appSlice';
import FeeCard from '../../components/dashboard/FeeCard';
import { Colors } from '../../constants/colors';
import { Fee } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function FeesScreen() {
  const dispatch = useAppDispatch();
  const { fees, feesLoading } = useAppSelector((s) => s.app);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (user?.id) dispatch(fetchFees(user.id));
  }, [user?.id]);

  const pendingCount = fees.filter((f: Fee) => f.status === 'pending' || f.status === 'overdue').length;
  const paidCount = fees.filter((f: Fee) => f.status === 'paid').length;

  return (
    <View style={styles.container}>
      {/* Summary header */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={20} color={Colors.warning} />
          <Text style={styles.summaryNumber}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pendientes</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryCard}>
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
          <Text style={styles.summaryNumber}>{paidCount}</Text>
          <Text style={styles.summaryLabel}>Pagadas</Text>
        </View>
      </View>

      <FlatList
        data={fees}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => <FeeCard fee={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feesLoading}
            onRefresh={() => user?.id && dispatch(fetchFees(user.id))}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.empty}>No tenés cuotas registradas</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  summaryCard: { flex: 1, alignItems: 'center', gap: 4 },
  summaryNumber: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },
  divider: { width: 1, height: 48, backgroundColor: Colors.border },
  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 12 },
  empty: { color: Colors.textMuted, fontSize: 14 },
});
