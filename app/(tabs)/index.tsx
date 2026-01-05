import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchAnimeWallpapers, type WallpaperItem } from '@/lib/wallpapers';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const GAP = 10;
const TILE_SIZE = Math.floor((width - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS);

export default function HomeScreen() {
  const [items, setItems] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'more') => {
    if (loadingMoreRef.current && mode === 'more') return;
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);

    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (mode === 'more') loadingMoreRef.current = true;

    try {
      const next = await fetchAnimeWallpapers({
        signal: controller.signal,
        limit: 24,
      });

      setItems((prev) => {
        if (mode === 'more') {
          const seen = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const item of next) {
            if (!seen.has(item.id)) merged.push(item);
          }
          return merged;
        }
        return next;
      });
    } catch (e) {
      if ((e as any)?.name === 'AbortError') return;
      setError((e as Error).message || 'Erro ao carregar wallpapers.');
    } finally {
      if (mode === 'initial') setLoading(false);
      if (mode === 'refresh') setRefreshing(false);
      if (mode === 'more') loadingMoreRef.current = false;
    }
  }, []);

  useEffect(() => {
    void load('initial');
    return () => abortRef.current?.abort();
  }, [load]);

  const header = useMemo(() => {
    return (
      <ThemedView style={styles.header}>
        <ThemedText type="title">Anime Wallpapers</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Toque em uma imagem para baixar ou definir.
        </ThemedText>
        {error ? (
          <ThemedText type="default" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
      </ThemedView>
    );
  }, [error]);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.column}
        refreshing={refreshing}
        onRefresh={() => load('refresh')}
        onEndReachedThreshold={0.5}
        onEndReached={() => load('more')}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: '/modal',
              params: {
                url: item.url,
                previewUrl: item.previewUrl ?? item.url,
                source: item.source ?? '',
              },
            }}
            asChild>
            <Pressable style={styles.tile}>
              <Image
                source={{ uri: item.previewUrl ?? item.url }}
                style={styles.image}
                contentFit="cover"
                transition={150}
              />
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          loading ? (
            <ThemedText style={styles.empty}>Carregando...</ThemedText>
          ) : (
            <ThemedText style={styles.empty}>Sem imagens por enquanto.</ThemedText>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 18,
    paddingHorizontal: GAP,
    paddingBottom: 10,
    gap: 6,
  },
  subtitle: {
    opacity: 0.8,
  },
  error: {
    opacity: 0.9,
  },
  listContent: {
    paddingBottom: 20,
  },
  column: {
    paddingHorizontal: GAP,
    gap: GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE * 1.4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: GAP,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    padding: 20,
    textAlign: 'center',
  },
});