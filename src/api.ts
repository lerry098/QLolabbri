import type { User, Application, News, Dashboard } from "../shared/models";
import type {
  LoginInput,
  CorporateInput,
  GiroInput,
} from "../shared/validation";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}
let csrfToken: string | undefined;
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    if (options.method && options.method !== "GET" && !csrfToken) {
      const csrf = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
      });
      if (!csrf.ok)
        throw new ApiError(
          "Layanan belum tersedia. Silakan coba lagi.",
          csrf.status,
        );
      csrfToken = (await csrf.json()).token;
    }
    const response = await fetch(`/api${path}`, {
      ...options,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 403) csrfToken = undefined;
      throw new ApiError(
        data.message || "Permintaan gagal. Silakan coba lagi.",
        response.status,
        data.fields,
      );
    }
    if (data.csrfToken) csrfToken = data.csrfToken;
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.",
      0,
    );
  }
}
const post = <T>(path: string, value?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(value || {}) });
export const api = {
  me: () => request<{ user: User | null; csrfToken: string }>("/auth/me"),
  login: (value: LoginInput) =>
    post<{ user: User; csrfToken: string }>("/auth/login", value),
  logout: async () => {
    await post("/auth/logout");
    csrfToken = undefined;
  },
  forgot: (value: { email: string }) =>
    post<{ message: string }>("/auth/forgot-password", value),
  register: (kind: "corporate" | "giro", value: CorporateInput | GiroInput) =>
    post<Application>(`/registrations/${kind}`, value),
  tracking: (id: string, giro = false) =>
    request<Application>(
      giro
        ? `/registrations/giro/${encodeURIComponent(id)}`
        : `/tracking/${encodeURIComponent(id)}`,
    ),
  news: () => request<News[]>("/news"),
  article: (slug: string) => request<News>(`/news/${encodeURIComponent(slug)}`),
  dashboard: () => request<Dashboard>("/dashboard/overview"),
};
