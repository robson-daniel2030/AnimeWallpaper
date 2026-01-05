import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { downloadAndSave, downloadAndShare } from '@/lib/wallpaper-actions';

export default function ModalScreen() {
  const { url, previewUrl, source } = useLocalSearchParams<{
    url?: string;
    previewUrl?: string;
    source?: string;
  }>();

  const imageUrl = typeof url === 'string' ? url : '';
  const imagePreviewUrl =
    typeof previewUrl === 'string' && previewUrl.length > 0 ? previewUrl : imageUrl;

  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  const [busy, setBusy] = useState<'download' | 'wallpaper' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canAct = useMemo(() => imageUrl.length > 0, [imageUrl]);

  const onDownload = useCallback(async () => {
    if (!canAct || busy) return;
    setMessage(null);
    setBusy('download');
    try {
      await downloadAndSave(imageUrl);
      setMessage('Salvo na galeria (álbum AnimeWallpaper).');
    } catch (e) {
      setMessage((e as Error).message || 'Não foi possível salvar.');
    } finally {
      setBusy(null);
    }
  }, [busy, canAct, imageUrl]);

  const onSetWallpaper = useCallback(async () => {
    if (!canAct || busy) return;
    setMessage(null);
    setBusy('wallpaper');
    try {
      await downloadAndShare(imageUrl);
      if (Platform.OS === 'ios') {
        setMessage('No iOS, normalmente você salva e define pela Fotos.');
      }
    } catch (e) {
      setMessage((e as Error).message || 'Não foi possível abrir o compartilhamento.');
    } finally {
      setBusy(null);
    }
  }, [busy, canAct, imageUrl]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <Link href="/" dismissTo asChild>
          <Pressable style={[styles.topButton, { borderColor: tint }]}>
            <ThemedText type="link">Fechar</ThemedText>
          </Pressable>
        </Link>
      </View>

      {imagePreviewUrl ? (
        <Image
          source={{ uri: imagePreviewUrl }}
          style={styles.image}
          contentFit="contain"
          transition={150}
        />
      ) : (
        <ThemedText style={styles.empty}>Imagem inválida.</ThemedText>
      )}

      <ThemedView style={[styles.actions, { backgroundColor: background }]}> 
        <View style={styles.buttonRow}>
          <Pressable
            disabled={!canAct || !!busy}
            onPress={onDownload}
            style={[
              styles.button,
              { borderColor: tint, opacity: !canAct || busy ? 0.5 : 1 },
            ]}>
            {busy === 'download' ? (
              <ActivityIndicator color={text} />
            ) : (
              <ThemedText type="link">Baixar</ThemedText>
            )}
          </Pressable>

          <Pressable
            disabled={!canAct || !!busy}
            onPress={onSetWallpaper}
            style={[
              styles.button,
              { borderColor: tint, opacity: !canAct || busy ? 0.5 : 1 },
            ]}>
            {busy === 'wallpaper' ? (
              <ActivityIndicator color={text} />
            ) : (
              <ThemedText type="link">Definir</ThemedText>
            )}
          </Pressable>
        </View>

        {typeof source === 'string' && source.length > 0 ? (
          <ThemedText style={styles.meta} numberOfLines={2}>
            Fonte: {source}
          </ThemedText>
        ) : null}

        {message ? <ThemedText style={styles.meta}>{message}</ThemedText> : null}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  topButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  actions: {
    padding: 14,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    opacity: 0.8,
  },
  empty: {
    padding: 20,
    textAlign: 'center',
  },
});
