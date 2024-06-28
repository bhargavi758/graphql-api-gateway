import axios, { AxiosInstance } from "axios";
import { AcademicEvent, EventFilterArgs, DataSourceError } from "../types";
import { InMemoryCache } from "../cache/InMemoryCache";

export class EventAPI {
  private client: AxiosInstance;
  private cache: InMemoryCache;

  constructor(baseURL: string, cache: InMemoryCache) {
    this.client = axios.create({ baseURL, timeout: 5000 });
    this.cache = cache;
  }

  async getAll(filters: EventFilterArgs = {}): Promise<{ data: AcademicEvent[]; total: number }> {
    const cacheKey = InMemoryCache.buildKey("events:list", filters);
    const cached = this.cache.get<{ data: AcademicEvent[]; total: number }>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: AcademicEvent[]; total: number }>("/events", {
        params: filters,
      });
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new DataSourceError("EventAPI", error instanceof Error ? error : undefined);
    }
  }

  async getById(id: string): Promise<AcademicEvent | null> {
    const cacheKey = InMemoryCache.buildKey("events:id", { id });
    const cached = this.cache.get<AcademicEvent>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: AcademicEvent }>(`/events/${id}`);
      this.cache.set(cacheKey, response.data.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new DataSourceError("EventAPI", error instanceof Error ? error : undefined);
    }
  }

  async getByIds(ids: string[]): Promise<(AcademicEvent | null)[]> {
    if (ids.length === 0) return [];

    const uncachedIds: string[] = [];
    const results = new Map<string, AcademicEvent | null>();

    for (const id of ids) {
      const cacheKey = InMemoryCache.buildKey("events:id", { id });
      const cached = this.cache.get<AcademicEvent>(cacheKey);
      if (cached) {
        results.set(id, cached);
      } else {
        uncachedIds.push(id);
      }
    }

    if (uncachedIds.length > 0) {
      try {
        const response = await this.client.get<{ data: (AcademicEvent | null)[] }>("/events/batch", {
          params: { ids: uncachedIds.join(",") },
        });
        uncachedIds.forEach((id, index) => {
          const item = response.data.data[index];
          results.set(id, item);
          if (item) {
            this.cache.set(InMemoryCache.buildKey("events:id", { id }), item);
          }
        });
      } catch (error) {
        throw new DataSourceError("EventAPI", error instanceof Error ? error : undefined);
      }
    }

    return ids.map((id) => results.get(id) ?? null);
  }

  async getByDepartment(departmentId: string): Promise<AcademicEvent[]> {
    const cacheKey = InMemoryCache.buildKey("events:dept", { departmentId });
    const cached = this.cache.get<AcademicEvent[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: AcademicEvent[]; total: number }>("/events", {
        params: { departmentId },
      });
      this.cache.set(cacheKey, response.data.data);
      return response.data.data;
    } catch (error) {
      throw new DataSourceError("EventAPI", error instanceof Error ? error : undefined);
    }
  }
}
