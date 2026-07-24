import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category, LocalTask } from '../features/tasks/types';

const CACHE_KEY = 'taskmanager.cache.v1';
const CACHE_VERSION = 1;

/**
 * Everything we persist locally, in a single versioned blob. Keeping it as one
 * document keeps reads/writes atomic and makes future migrations explicit via
 * the `version` field.
 */
export interface CacheShape {
  version: number;
  tasks: LocalTask[];
  categories: Category[];
  meta: {
    lastRefreshedAt: string | null;
  };
}

export const emptyCache = (): CacheShape => ({
  version: CACHE_VERSION,
  tasks: [],
  categories: [],
  meta: { lastRefreshedAt: null },
});

/**
 * Read the cache. Returns an empty cache when nothing is stored, when the
 * stored blob is from an incompatible version, or when parsing fails — the app
 * should always get a usable shape back, never throw.
 */
export async function readCache(): Promise<CacheShape> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return emptyCache();

    const parsed = JSON.parse(raw) as Partial<CacheShape>;
    if (parsed.version !== CACHE_VERSION) return emptyCache();

    return {
      version: CACHE_VERSION,
      tasks: parsed.tasks ?? [],
      categories: parsed.categories ?? [],
      meta: { lastRefreshedAt: parsed.meta?.lastRefreshedAt ?? null },
    };
  } catch {
    return emptyCache();
  }
}

/** Persist the whole cache blob. */
export async function writeCache(cache: CacheShape): Promise<void> {
  await AsyncStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ ...cache, version: CACHE_VERSION }),
  );
}
