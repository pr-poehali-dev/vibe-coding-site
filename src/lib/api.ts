const API_AUTH = "https://functions.poehali.dev/d53add14-15de-4a0d-8070-01ae50222a6e";
const API_SITES = "https://functions.poehali.dev/6df0a3e4-93ec-4044-be15-f857cd8f961e";

// Token management
export function getToken(): string | null {
  return localStorage.getItem("kodi_token");
}

export function setToken(token: string): void {
  localStorage.setItem("kodi_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("kodi_token");
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Site {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  status?: string;
  views?: number;
  created_at?: string;
  prompt?: string;
  url?: string;
  html?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface SiteStats {
  total_sites: number;
  total_views: number;
  total_submissions: number;
}

export interface Submission {
  id: number;
  form_name: string;
  data: Record<string, string>;
  sender_ip: string;
  created_at: string;
  site_title: string;
  site_slug: string;
}

export interface SubmissionsResponse {
  submissions: Submission[];
  total: number;
  page: number;
  per_page: number;
}

// Generic fetch helper
async function apiFetch<T>(
  baseUrl: string,
  params: Record<string, string>,
  options: RequestInit = {}
): Promise<T> {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth API
export const authApi = {
  register(data: { email: string; password: string; name: string }) {
    return apiFetch<AuthResponse>(API_AUTH, { action: "register" }, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: { email: string; password: string }) {
    return apiFetch<AuthResponse>(API_AUTH, { action: "login" }, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  me() {
    return apiFetch<{ user: User }>(API_AUTH, { action: "me" }, {
      method: "GET",
    });
  },
};

// Sites API
export const sitesApi = {
  create(data: { prompt: string; title: string; slug?: string }) {
    return apiFetch<Site>(API_SITES, { action: "create" }, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list() {
    return apiFetch<{ sites: Site[] }>(API_SITES, { action: "list" }, {
      method: "GET",
    });
  },

  get(siteId: string) {
    return apiFetch<Site>(API_SITES, { action: "get", site_id: siteId }, {
      method: "GET",
    });
  },

  update(data: {
    site_id: string;
    title?: string;
    slug?: string;
    meta_title?: string;
    meta_description?: string;
    html?: string;
  }) {
    return apiFetch<{ ok: boolean }>(API_SITES, { action: "update" }, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  regenerate(data: { site_id: string; prompt: string }) {
    return apiFetch<{ ok: boolean; html: string }>(API_SITES, { action: "regenerate" }, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  stats() {
    return apiFetch<SiteStats>(API_SITES, { action: "stats" }, {
      method: "GET",
    });
  },

  submissions(siteId?: string, page = 1) {
    const params: Record<string, string> = { action: "submissions", page: String(page) };
    if (siteId) params.site_id = siteId;
    return apiFetch<SubmissionsResponse>(API_SITES, params, {
      method: "GET",
    });
  },

  deleteSubmission(submissionId: number) {
    return apiFetch<{ ok: boolean }>(API_SITES, { action: "delete-submission", submission_id: String(submissionId) }, {
      method: "DELETE",
    });
  },
};