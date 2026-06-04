import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Card from '../common/Card';
import { Fee } from '../../types';
import { getMonthName, getDaysUntilDue, getFeeStatusLabel } from '../../services/mercadopagoService';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface FeeCardProps {
  fee: Fee;
}

const statusColors: Record<Fee['status'], string> = {
  pending: Colors.warning,
  paid: Colors.success,
  overdue: Colors.error,
  processing: Colors.info,
};

export default function FeeCard({ fee }: FeeCardProps) {
  const daysUntilDue = getDaysUntilDue(fee.dueDate);
  const statusColor = statusColors[fee.status];

  const handlePay = async () => {
    if (fee.paymentUrl) {
      await Linking.openURL(fee.paymentUrl);
    }
  };

  return (
    <Card style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
      <View style={styles.row}>
        <View>
          <Text style={styles.month}>{getMonthName(fee.month)} {fee.year}</Text>
          <Text style={styles.description}>{fee.description}</Text>
          <Text style={styles.amount}>${fee.amount.toLocaleString('es-AR')}</Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{getFeeStatusLabel(fee.status)}</Text>
          </View>
          {fee.status === 'paid' && fee.paidAt && (
            <Text style={styles.paidDate}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} /> {new Date(fee.paidAt).toLocaleDateString('es-AR')}
            </Text>
          )}
        </View>
      </View>

      {fee.status !== 'paid' && (
        <View style={styles.dueRow}>
          <Text style={[styles.dueText, daysUntilDue < 0 && styles.overdue, daysUntilDue === 0 && styles.dueToday]}>
            {daysUntilDue < 0
              ? `⚠️ Vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) > 1 ? 's' : ''}`
              : daysUntilDue === 0
              ? '🔴 Vence HOY'
              : daysUntilDue <= 5
              ? `⏰ Vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}`
              : `Vence: ${new Date(fee.dueDate).toLocaleDateString('es-AR')}`}
          </Text>
        </View>
      )}

      {fee.paymentUrl && fee.status !== 'paid' && (
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.85}>
          <Ionicons name="card-outline" size={16} color={Colors.white} />
          <Text style={styles.payBtnText}>Pagar con Mercado Pago</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  month: { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary },
  description: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 6 },
  right: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  paidDate: { fontSize: 11, color: Colors.success, marginTop: 4 },
  dueRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  dueText: { fontSize: 13, color: Colors.textSecondary },
  overdue: { color: Colors.error, fontWeight: '600' },
  dueToday: { color: Colors.statusLive, fontWeight: '700' },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009ee3',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  payBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
