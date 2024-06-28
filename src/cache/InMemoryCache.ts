interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheConfig {
  defaultTtlMs: number;
  maxEntries: number;
  cleanupIntervalMs: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTtlMs: 30_000,
  maxEntries: 1000,
  cleanupIntervalMs: 60_000,
};

export class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly config: CacheConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => this.evictExpired(), this.config.cleanupIntervalMs);
      this.cleanupTimer.unref();
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.config.defaultTtlMs),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }

  static buildKey(prefix: string, params: object): string {
    const record = params as Record<string, unknown>;
    const sorted = Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        if (record[key] !== undefined && record[key] !== null) {
          acc[key] = record[key];
        }
        return acc;
      }, {});
    return `${prefix}:${JSON.stringify(sorted)}`;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private evictOldest(): void {
    const firstKey = this.store.keys().next().value;
    if (firstKey !== undefined) {
      this.store.delete(firstKey);
    }
  }
}
