import axios, { AxiosInstance } from "axios";
import { Department, PaginationArgs, DataSourceError } from "../types";
import { InMemoryCache } from "../cache/InMemoryCache";

export class DepartmentAPI {
  private client: AxiosInstance;
  private cache: InMemoryCache;

  constructor(baseURL: string, cache: InMemoryCache) {
    this.client = axios.create({ baseURL, timeout: 5000 });
    this.cache = cache;
  }

  async getAll(filters: PaginationArgs = {}): Promise<{ data: Department[]; total: number }> {
    const cacheKey = InMemoryCache.buildKey("departments:list", filters);
    const cached = this.cache.get<{ data: Department[]; total: number }>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Department[]; total: number }>("/departments", {
        params: filters,
      });
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new DataSourceError("DepartmentAPI", error instanceof Error ? error : undefined);
    }
  }

  async getById(id: string): Promise<Department | null> {
    const cacheKey = InMemoryCache.buildKey("departments:id", { id });
    const cached = this.cache.get<Department>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Department }>(`/departments/${id}`);
      this.cache.set(cacheKey, response.data.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new DataSourceError("DepartmentAPI", error instanceof Error ? error : undefined);
    }
  }

  async getByIds(ids: string[]): Promise<(Department | null)[]> {
    if (ids.length === 0) return [];

    const uncachedIds: string[] = [];
    const results = new Map<string, Department | null>();

    for (const id of ids) {
      const cacheKey = InMemoryCache.buildKey("departments:id", { id });
      const cached = this.cache.get<Department>(cacheKey);
      if (cached) {
        results.set(id, cached);
      } else {
        uncachedIds.push(id);
      }
    }

    if (uncachedIds.length > 0) {
      try {
        const response = await this.client.get<{ data: (Department | null)[] }>("/departments/batch", {
          params: { ids: uncachedIds.join(",") },
        });
        uncachedIds.forEach((id, index) => {
          const item = response.data.data[index];
          results.set(id, item);
          if (item) {
            this.cache.set(InMemoryCache.buildKey("departments:id", { id }), item);
          }
        });
      } catch (error) {
        throw new DataSourceError("DepartmentAPI", error instanceof Error ? error : undefined);
      }
    }

    return ids.map((id) => results.get(id) ?? null);
  }
}
