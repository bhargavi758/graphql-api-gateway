import { InMemoryCache } from "../../src/cache/InMemoryCache";

describe("InMemoryCache", () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache({ cleanupIntervalMs: 0 });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe("get / set", () => {
    it("stores and retrieves a value", () => {
      cache.set("key1", { name: "test" });
      expect(cache.get("key1")).toEqual({ name: "test" });
    });

    it("returns undefined for missing keys", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("returns undefined for expired entries", async () => {
      cache.set("expiring", "value", 50);
      expect(cache.get("expiring")).toBe("value");

      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(cache.get("expiring")).toBeUndefined();
    });

    it("overwrites existing values", () => {
      cache.set("key", "first");
      cache.set("key", "second");
      expect(cache.get("key")).toBe("second");
    });
  });

  describe("has", () => {
    it("returns true for existing non-expired entries", () => {
      cache.set("key", "value");
      expect(cache.has("key")).toBe(true);
    });

    it("returns false for missing entries", () => {
      expect(cache.has("missing")).toBe(false);
    });

    it("returns false for expired entries", async () => {
      cache.set("expiring", "value", 50);
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(cache.has("expiring")).toBe(false);
    });
  });

  describe("delete", () => {
    it("removes an entry", () => {
      cache.set("key", "value");
      expect(cache.delete("key")).toBe(true);
      expect(cache.get("key")).toBeUndefined();
    });

    it("returns false for non-existent keys", () => {
      expect(cache.delete("missing")).toBe(false);
    });
  });

  describe("clear", () => {
    it("removes all entries", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe("size", () => {
    it("tracks entry count", () => {
      expect(cache.size).toBe(0);
      cache.set("a", 1);
      cache.set("b", 2);
      expect(cache.size).toBe(2);
    });
  });

  describe("eviction", () => {
    it("evicts oldest entry when maxEntries exceeded", () => {
      const smallCache = new InMemoryCache({ maxEntries: 3, cleanupIntervalMs: 0 });
      smallCache.set("a", 1);
      smallCache.set("b", 2);
      smallCache.set("c", 3);
      smallCache.set("d", 4);

      expect(smallCache.get("a")).toBeUndefined();
      expect(smallCache.get("d")).toBe(4);
      expect(smallCache.size).toBe(3);
      smallCache.destroy();
    });
  });

  describe("buildKey", () => {
    it("produces deterministic keys regardless of property order", () => {
      const key1 = InMemoryCache.buildKey("prefix", { b: 2, a: 1 });
      const key2 = InMemoryCache.buildKey("prefix", { a: 1, b: 2 });
      expect(key1).toBe(key2);
    });

    it("excludes null and undefined values", () => {
      const key = InMemoryCache.buildKey("test", { a: 1, b: null, c: undefined });
      expect(key).toBe('test:{"a":1}');
    });

    it("includes the prefix", () => {
      const key = InMemoryCache.buildKey("myprefix", { x: 1 });
      expect(key).toStartWith("myprefix:");
    });
  });

  describe("destroy", () => {
    it("clears all entries and stops cleanup", () => {
      cache.set("key", "value");
      cache.destroy();
      expect(cache.size).toBe(0);
    });
  });
});

expect.extend({
  toStartWith(received: string, prefix: string) {
    const pass = received.startsWith(prefix);
    return {
      pass,
      message: () => `expected "${received}" to start with "${prefix}"`,
    };
  },
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toStartWith(prefix: string): R;
    }
  }
}
