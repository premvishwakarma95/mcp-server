import axios, { AxiosInstance, AxiosError } from "axios";

export class UnipileClient {
  private http: AxiosInstance;

  constructor(dsn: string, accessToken: string) {
    if (!dsn) throw new Error("UNIPILE_DSN is required");
    if (!accessToken) throw new Error("UNIPILE_ACCESS_TOKEN is required");

    const baseURL = dsn.startsWith("http") ? dsn : `https://${dsn}`;

    this.http = axios.create({
      baseURL,
      headers: {
        "X-API-KEY": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 60_000,
    });
  }

  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    try {
      const res = await this.http.get<T>(path, { params });
      return res.data;
    } catch (e) {
      throw this.normalize(e);
    }
  }

  async post<T = any>(path: string, body?: Record<string, any>, params?: Record<string, any>): Promise<T> {
    try {
      const res = await this.http.post<T>(path, body ?? {}, { params });
      return res.data;
    } catch (e) {
      throw this.normalize(e);
    }
  }

  async put<T = any>(path: string, body?: Record<string, any>): Promise<T> {
    try {
      const res = await this.http.put<T>(path, body ?? {});
      return res.data;
    } catch (e) {
      throw this.normalize(e);
    }
  }

  async delete<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    try {
      const res = await this.http.delete<T>(path, { params });
      return res.data;
    } catch (e) {
      throw this.normalize(e);
    }
  }

  private normalize(err: unknown): Error {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const data = err.response?.data;
      const msg =
        (data && (data.title || data.detail || data.message || data.error)) ||
        err.message ||
        "Unipile request failed";
      const detail = typeof msg === "string" ? msg : JSON.stringify(msg);
      const e = new Error(`Unipile API error (HTTP ${status ?? "?"}): ${detail}`);
      (e as any).status = status;
      (e as any).data = data;
      return e;
    }
    return err instanceof Error ? err : new Error(String(err));
  }
}

let singleton: UnipileClient | null = null;

export function getUnipileClient(): UnipileClient {
  if (singleton) return singleton;
  const dsn = process.env.UNIPILE_DSN;
  const token = process.env.UNIPILE_ACCESS_TOKEN;
  if (!dsn || !token) {
    throw new Error(
      "UNIPILE_DSN and UNIPILE_ACCESS_TOKEN must be set in .env"
    );
  }
  singleton = new UnipileClient(dsn, token);
  return singleton;
}
