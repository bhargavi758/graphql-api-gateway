import axios, { AxiosInstance } from "axios";
import { Course, CourseFilterArgs, DataSourceError } from "../types";
import { InMemoryCache } from "../cache/InMemoryCache";

export class CourseAPI {
  private client: AxiosInstance;
  private cache: InMemoryCache;

  constructor(baseURL: string, cache: InMemoryCache) {
    this.client = axios.create({ baseURL, timeout: 5000 });
    this.cache = cache;
  }

  async getAll(filters: CourseFilterArgs = {}): Promise<{ data: Course[]; total: number }> {
    const cacheKey = InMemoryCache.buildKey("courses:list", filters);
    const cached = this.cache.get<{ data: Course[]; total: number }>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Course[]; total: number }>("/courses", {
        params: filters,
      });
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new DataSourceError("CourseAPI", error instanceof Error ? error : undefined);
    }
  }

  async getById(id: string): Promise<Course | null> {
    const cacheKey = InMemoryCache.buildKey("courses:id", { id });
    const cached = this.cache.get<Course>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Course }>(`/courses/${id}`);
      this.cache.set(cacheKey, response.data.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new DataSourceError("CourseAPI", error instanceof Error ? error : undefined);
    }
  }

  async getByIds(ids: string[]): Promise<(Course | null)[]> {
    if (ids.length === 0) return [];

    const uncachedIds: string[] = [];
    const results = new Map<string, Course | null>();

    for (const id of ids) {
      const cacheKey = InMemoryCache.buildKey("courses:id", { id });
      const cached = this.cache.get<Course>(cacheKey);
      if (cached) {
        results.set(id, cached);
      } else {
        uncachedIds.push(id);
      }
    }

    if (uncachedIds.length > 0) {
      try {
        const response = await this.client.get<{ data: (Course | null)[] }>("/courses/batch", {
          params: { ids: uncachedIds.join(",") },
        });
        uncachedIds.forEach((id, index) => {
          const item = response.data.data[index];
          results.set(id, item);
          if (item) {
            this.cache.set(InMemoryCache.buildKey("courses:id", { id }), item);
          }
        });
      } catch (error) {
        throw new DataSourceError("CourseAPI", error instanceof Error ? error : undefined);
      }
    }

    return ids.map((id) => results.get(id) ?? null);
  }

  async getByDepartment(departmentId: string): Promise<Course[]> {
    const cacheKey = InMemoryCache.buildKey("courses:dept", { departmentId });
    const cached = this.cache.get<Course[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Course[]; total: number }>("/courses", {
        params: { departmentId },
      });
      this.cache.set(cacheKey, response.data.data);
      return response.data.data;
    } catch (error) {
      throw new DataSourceError("CourseAPI", error instanceof Error ? error : undefined);
    }
  }

  async getByProfessor(professorId: string): Promise<Course[]> {
    const cacheKey = InMemoryCache.buildKey("courses:prof", { professorId });
    const cached = this.cache.get<Course[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ data: Course[]; total: number }>("/courses", {
        params: { professorId },
      });
      this.cache.set(cacheKey, response.data.data);
      return response.data.data;
    } catch (error) {
      throw new DataSourceError("CourseAPI", error instanceof Error ? error : undefined);
    }
  }
}
