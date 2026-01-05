export type WallpaperItem = {
  id: string;
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  source?: string;
};

type WallhavenResponse = {
  data: Array<{
    id: string;
    purity: 'sfw' | 'sketchy' | 'nsfw';
    category: string;
    dimension_x?: number;
    dimension_y?: number;
    path: string;
    url?: string;
    source?: string;
    thumbs?: {
      large?: string;
      original?: string;
      small?: string;
    };
  }>;
};

function mapWallhavenToItems(payload: WallhavenResponse): WallpaperItem[] {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return data
    .filter((img) => img?.purity === 'sfw' && typeof img?.path === 'string' && img.path.length > 0)
    .map((img) => ({
      id: String(img.id ?? img.path),
      url: img.path,
      previewUrl: img.thumbs?.large ?? img.thumbs?.small,
      width: img.dimension_x,
      height: img.dimension_y,
      source: img.source || img.url,
    }));
}

export async function fetchAnimeWallpapers(params?: {
  signal?: AbortSignal;
  limit?: number;
}): Promise<WallpaperItem[]> {
  const limit = Math.max(6, Math.min(params?.limit ?? 24, 50));

  const url = new URL('https://wallhaven.cc/api/v1/search');
  url.searchParams.set('q', 'anime');
  url.searchParams.set('categories', '010');
  url.searchParams.set('purity', '100');
  url.searchParams.set('sorting', 'random');
  url.searchParams.set('atleast', '1920x1080');
  url.searchParams.set('page', String(1));

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

  const json = (await res.json()) as WallhavenResponse;
  const items = mapWallhavenToItems(json);
  return items.slice(0, limit);
}
