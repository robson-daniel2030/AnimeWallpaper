import { File, Paths, downloadAsync } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

const ALBUM_NAME = 'AnimeWallpaper';

function sanitizeFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function downloadToCache(url: string) {
  const fileName = sanitizeFileName(
    `wallpaper_${Date.now()}_${url.split('/').pop() || 'image'}`
  );

  const dest = new File(Paths.cache, fileName).uri;
  const result = await downloadAsync(url, dest);
  return result.uri;
}

export async function saveToGallery(localUri: string) {
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Permissão de galeria negada.');
  }

  const asset = await MediaLibrary.createAssetAsync(localUri);

  try {
    const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
    }
  } catch {
    // Se falhar em criar/usar álbum, o asset já foi salvo.
  }

  return asset;
}

export async function downloadAndSave(url: string) {
  const localUri = await downloadToCache(url);
  await saveToGallery(localUri);
  return localUri;
}

export async function shareImage(localUri: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartilhamento não disponível neste dispositivo.');
  }

  await Sharing.shareAsync(localUri, {
    dialogTitle: 'Definir como wallpaper',
    mimeType: 'image/*',
    UTI: 'public.image',
  });
}

export async function downloadAndShare(url: string) {
  const localUri = await downloadToCache(url);
  await shareImage(localUri);
  return localUri;
}
