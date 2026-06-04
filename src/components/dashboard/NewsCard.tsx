import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Card from '../common/Card';
import { NewsItem } from '../../types';
import { Colors } from '../../constants/colors';

interface NewsCardProps {
  news: NewsItem;
  onPress?: () => void;
  compact?: boolean;
}

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

const categoryLabel: Record<NewsItem['category'], string> = {
  general: 'General',
  match: 'Partido',
  training: 'Entrenamiento',
  achievement: 'Logro',
  announcement: 'Comunicado',
};

const categoryColor: Record<NewsItem['category'], string> = {
  general: Colors.secondary,
  match: Colors.primary,
  training: Colors.success,
  achievement: Colors.warning,
  announcement: Colors.info,
};

export default function NewsCard({ news, onPress, compact }: NewsCardProps) {
  return (
    <Card onPress={onPress} noPadding style={styles.card}>
      {news.imageUrl && !compact && (
        <Image source={{ uri: news.imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryTag, { backgroundColor: categoryColor[news.category] }]}>
            <Text style={styles.categoryText}>{categoryLabel[news.category]}</Text>
          </View>
          <Text style={styles.date}>{formatDate(news.publishedAt)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={compact ? 2 : 3}>{news.title}</Text>
        {!compact && (
          <Text style={styles.body} numberOfLines={3}>{news.body}</Text>
        )}
        <Text style={styles.author}>Por {news.author}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 0 },
  image: { width: '100%', height: 160, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  content: { padding: 14 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  date: { fontSize: 11, color: Colors.textMuted },
  title: { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 6 },
  body: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  author: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' },
});
