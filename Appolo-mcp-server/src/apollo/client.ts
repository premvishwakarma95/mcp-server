import axios, { AxiosInstance, AxiosError } from "axios";

export class ApolloClient {
  private http: AxiosInstance;

  constructor(apiKey: string, baseUrl = "https://api.apollo.io") {
    if (!apiKey) {
      throw new Error("APOLLO_API_KEY is required");
    }
    this.http = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      timeout: 30_000,
    });
  }

  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    try {
      const res = await this.http.get<T>(path, { params });
      return res.data;
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async post<T = any>(path: string, body?: Record<string, any>): Promise<T> {
    try {
      const res = await this.http.post<T>(path, body ?? {});
      return res.data;
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async put<T = any>(path: string, body?: Record<string, any>): Promise<T> {
    try {
      const res = await this.http.put<T>(path, body ?? {});
      return res.data;
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async patch<T = any>(path: string, body?: Record<string, any>): Promise<T> {
    try {
      const res = await this.http.patch<T>(path, body ?? {});
      return res.data;
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async delete<T = any>(path: string): Promise<T> {
    try {
      const res = await this.http.delete<T>(path);
      return res.data;
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  private normalizeError(err: unknown): Error {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const data = err.response?.data;
      const message =
        (data && (data.error || data.message || data.errors)) ||
        err.message ||
        "Apollo API request failed";
      const detail = typeof message === "string" ? message : JSON.stringify(message);
      const e = new Error(`Apollo API error (HTTP ${status ?? "?"}): ${detail}`);
      (e as any).status = status;
      (e as any).data = data;
      return e;
    }
    return err instanceof Error ? err : new Error(String(err));
  }
}

let singleton: ApolloClient | null = null;

export function getApolloClient(): ApolloClient {
  if (singleton) return singleton;
  const apiKey = process.env.APOLLO_API_KEY;
  const baseUrl = process.env.APOLLO_BASE_URL || "https://api.apollo.io";
  if (!apiKey) {
    throw new Error(
      "APOLLO_API_KEY environment variable is not set. Add it to your .env file."
    );
  }
  singleton = new ApolloClient(apiKey, baseUrl);
  return singleton;
}
