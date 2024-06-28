import axios, { AxiosInstance } from "axios";
import { Professor, ProfessorFilterArgs, DataSourceError } from "../types";
import { InMemoryCache } from "../cache/InMemoryCache";

export class ProfessorAPI {
  private client: AxiosInstance;
  private cache: InMemoryCache;

  constructor(baseURL: string, cache: InMemoryCache) {
    this.client = axios.create({ baseURL, timeout: 5000 });
    this.cache = cache;
  }

  async getAll(filters: ProfessorFilterArgs = {}): Promise<{ data: Professor[]; total: number }> {
    const cacheKey = InMemoryCache.buildKey("professors:list", filters);
    const cached = this.cache.get<{ data: Professor[]; total: number }>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Professor[]; total: number }>("/professors", {
        params: filters,
      });
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new DataSourceError("ProfessorAPI", error instanceof Error ? error : undefined);
    }
  }

  async getById(id: string): Promise<Professor | null> {
    const cacheKey = InMemoryCache.buildKey("professors:id", { id });
    const cached = this.cache.get<Professor>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Professor }>(`/professors/${id}`);
      this.cache.set(cacheKey, response.data.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new DataSourceError("ProfessorAPI", error instanceof Error ? error : undefined);
    }
  }

  async getByIds(ids: string[]): Promise<(Professor | null)[]> {
    if (ids.length === 0) return [];

    const uncachedIds: string[] = [];
    const results = new Map<string, Professor | null>();

    for (const id of ids) {
      const cacheKey = InMemoryCache.buildKey("professors:id", { id });
      const cached = this.cache.get<Professor>(cacheKey);
      if (cached) {
        results.set(id, cached);
      } else {
        uncachedIds.push(id);
      }
    }

    if (uncachedIds.length > 0) {
      try {
        const response = await this.client.get<{ data: (Professor | null)[] }>("/professors/batch", {
          params: { ids: uncachedIds.join(",") },
        });
        uncachedIds.forEach((id, index) => {
          const item = response.data.data[index];
          results.set(id, item);
          if (item) {
            this.cache.set(InMemoryCache.buildKey("professors:id", { id }), item);
          }
        });
      } catch (error) {
        throw new DataSourceError("ProfessorAPI", error instanceof Error ? error : undefined);
      }
    }

    return ids.map((id) => results.get(id) ?? null);
  }

  async getByDepartment(departmentId: string): Promise<Professor[]> {
    const cacheKey = InMemoryCache.buildKey("professors:dept", { departmentId });
    const cached = this.cache.get<Professor[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Professor[]; total: number }>("/professors", {
        params: { departmentId },
      });
      this.cache.set(cacheKey, response.data.data);
      return response.data.data;
    } catch (error) {
      throw new DataSourceError("ProfessorAPI", error instanceof Error ? error : undefined);
    }
  }
}
