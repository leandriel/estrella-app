import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../common/Card';
import { TrainingStatusBadge, DivisionBadge } from '../common/Badge';
import { Training } from '../../types';
import { getDivisionById } from '../../constants/divisions';
import { Colors } from '../../constants/colors';

interface TrainingCardProps {
  training: Training;
  onPress?: () => void;
}

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function TrainingCard({ training, onPress }: TrainingCardProps) {
  const division = getDivisionById(training.divisionId);
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.left}>
          {division && <DivisionBadge divisionLabel={division.shortLabel} color={division.color} />}
          <Text style={styles.date}>{formatDate(training.scheduledAt)}</Text>
          <Text style={styles.location}>📍 {training.location}</Text>
          {training.coach && <Text style={styles.coach}>👨‍💼 {training.coach}</Text>}
          {training.suspensionReason && (
            <Text style={styles.suspension}>⚠️ {training.suspensionReason}</Text>
          )}
        </View>
        <TrainingStatusBadge status={training.status} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  left: { flex: 1, marginRight: 12 },
  date: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: 8, textTransform: 'capitalize' },
  location: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  coach: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  suspension: { fontSize: 12, color: Colors.warning, marginTop: 6 },
});
