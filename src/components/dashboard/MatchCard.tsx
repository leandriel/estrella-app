import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../common/Card';
import { MatchStatusBadge, DivisionBadge } from '../common/Badge';
import { Match } from '../../types';
import { getDivisionById } from '../../constants/divisions';
import { Colors } from '../../constants/colors';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
  compact?: boolean;
}

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function MatchCard({ match, onPress, compact }: MatchCardProps) {
  const division = getDivisionById(match.divisionId);
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <Card onPress={onPress} style={[styles.card, isLive && styles.liveCard]}>
      <View style={styles.topRow}>
        {division && <DivisionBadge divisionLabel={division.label} color={division.color} />}
        <MatchStatusBadge status={match.status} />
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.teamBlock}>
          <Text style={[styles.teamName, match.isHomeEstrella && styles.ourTeam]} numberOfLines={2}>
            {match.homeTeam}
          </Text>
        </View>

        <View style={styles.scoreBlock}>
          {isFinished || isLive ? (
            <Text style={[styles.score, isLive && styles.liveScore]}>
              {match.homeScore} - {match.awayScore}
            </Text>
          ) : (
            <Text style={styles.vsText}>VS</Text>
          )}
        </View>

        <View style={[styles.teamBlock, styles.teamRight]}>
          <Text style={[styles.teamName, !match.isHomeEstrella && styles.ourTeam]} numberOfLines={2}>
            {match.awayTeam}
          </Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.bottomRow}>
          <Text style={styles.meta}>
            {match.venue ? `📍 ${match.venue}  ` : ''}
            🗓 {formatDate(match.scheduledAt)}
          </Text>
        </View>
      )}

      {match.status === 'suspended' && match.suspensionReason && (
        <View style={styles.suspensionBanner}>
          <Text style={styles.suspensionText}>⚠️ {match.suspensionReason}</Text>
        </View>
      )}

      {isLive && match.goals.length > 0 && !compact && (
        <View style={styles.goalsRow}>
          {match.goals.slice(-3).map((g, i) => (
            <Text key={i} style={styles.goalItem}>
              ⚽ {g.playerName} {g.minute ? `(${g.minute}')` : ''}
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 0 },
  liveCard: {
    borderWidth: 2,
    borderColor: Colors.statusLive,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  teamsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  teamBlock: { flex: 1, alignItems: 'flex-start' },
  teamRight: { alignItems: 'flex-end' },
  teamName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ourTeam: { color: Colors.primary, fontWeight: 'bold' },
  scoreBlock: { paddingHorizontal: 16 },
  score: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  liveScore: { color: Colors.statusLive },
  vsText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMuted },
  bottomRow: { marginTop: 8 },
  meta: { fontSize: 11, color: Colors.textSecondary },
  suspensionBanner: {
    marginTop: 8,
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
    padding: 8,
  },
  suspensionText: { fontSize: 12, color: Colors.warning },
  goalsRow: { marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 8 },
  goalItem: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
});
