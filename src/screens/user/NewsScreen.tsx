import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchNews } from '../../store/slices/appSlice';
import NewsCard from '../../components/dashboard/NewsCard';
import { Colors } from '../../constants/colors';

export default function NewsScreen() {
  const dispatch = useAppDispatch();
  const { news, newsLoading } = useAppSelector((s) => s.app);

  useEffect(() => { dispatch(fetchNews()); }, []);

  return (
    <FlatList
      data={news}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => <NewsCard news={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<Text style={styles.empty}>No hay novedades disponibles</Text>}
      refreshing={newsLoading}
      onRefresh={() => dispatch(fetchNews())}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
});
