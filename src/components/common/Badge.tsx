import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { MatchStatus, TrainingStatus } from '../../types';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  small?: boolean;
}

export function Badge({ label, color = Colors.primary, textColor = Colors.white, style, small }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }, small && styles.small, style]}>
      <Text style={[styles.text, { color: textColor }, small && styles.smallText]}>{label}</Text>
    </View>
  );
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const config: Record<MatchStatus, { label: string; color: string }> = {
    upcoming: { label: 'Próximo', color: Colors.statusUpcoming },
    live: { label: '⚡ EN VIVO', color: Colors.statusLive },
    finished: { label: 'Finalizado', color: Colors.statusFinished },
    suspended: { label: 'Suspendido', color: Colors.statusSuspended },
    postponed: { label: 'Postergado', color: Colors.textSecondary },
  };
  const { label, color } = config[status] ?? { label: status, color: Colors.textSecondary };
  return <Badge label={label} color={color} />;
}

export function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  const config: Record<TrainingStatus, { label: string; color: string }> = {
    scheduled: { label: 'Confirmado', color: Colors.statusFinished },
    suspended: { label: 'Suspendido', color: Colors.statusSuspended },
    completed: { label: 'Realizado', color: Colors.textSecondary },
    cancelled: { label: 'Cancelado', color: Colors.statusLive },
  };
  const { label, color } = config[status] ?? { label: status, color: Colors.textSecondary };
  return <Badge label={label} color={color} />;
}

export function DivisionBadge({ divisionLabel, color }: { divisionLabel: string; color: string }) {
  return <Badge label={divisionLabel} color={color} small />;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  small: { paddingHorizontal: 8, paddingVertical: 3 },
  smallText: { fontSize: 10 },
});
