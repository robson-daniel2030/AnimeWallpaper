export type WallpaperItem = {
  id: string;
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  source?: string;
};

type WaifuImResponse = {
  images: Array<{
    image_id: number | string;
    url: string;
    preview_url?: string;
    width?: number;
    height?: number;
    source?: string;
  }>;
};

function mapWaifuImToItems(payload: WaifuImResponse): WallpaperItem[] {
  const images = Array.isArray(payload?.images) ? payload.images : [];
  return images
    .filter((img) => typeof img?.url === 'string' && img.url.length > 0)
    .map((img) => ({
      id: String(img.image_id ?? img.url),
      url: img.url,
      previewUrl: img.preview_url,
      width: img.width,
      height: img.height,
      source: img.source,
    }));
}

export async function fetchAnimeWallpapers(params?: {
  signal?: AbortSignal;
  limit?: number;
}): Promise<WallpaperItem[]> {
  const limit = Math.max(6, Math.min(params?.limit ?? 24, 50));

  const url = new URL('https://api.waifu.im/search');
  url.searchParams.set('included_tags', 'waifu');
  url.searchParams.set('is_nsfw', 'false');
  url.searchParams.set('height', '>=720');
  url.searchParams.set('width', '>=720');
  url.searchParams.set('many', 'true');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: params?.signal,
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar wallpapers: HTTP ${res.status}`);
  }

  const json = (await res.json()) as WaifuImResponse;
  return mapWaifuImToItems(json);
}
