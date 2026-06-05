type CurrentUser = { id: string; email: string };

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error ?? "Erro desconhecido" };
    }

    return { data };
  } catch (err: any) {
    return { error: err.message ?? "Erro de rede" };
  }
}

// Auth
export async function login(email: string, password: string) {
  return apiRequest<{ user: { id: string; email: string } }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return apiRequest<{ user: { id: string; email: string } }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiRequest<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getMe(): Promise<{ user: CurrentUser | null }> {
  const result = await apiRequest<{ user: CurrentUser }>("/api/auth/me");
  return { user: result.data?.user ?? null };
}

// Projects
export async function listProjects(type?: string) {
  const url = type ? `/api/projects?type=${type}` : "/api/projects";
  return apiRequest<any[]>(url);
}

export async function getProject(id: string) {
  return apiRequest<any>(`/api/projects/${id}`);
}

export async function createProject(formData: FormData) {
  const response = await fetch("/api/projects", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) return { error: data.error ?? "Erro" };
  return { data };
}

export async function updateProject(id: string, data: any) {
  return apiRequest<any>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string) {
  return apiRequest<{ ok: boolean }>(`/api/projects/${id}`, {
    method: "DELETE",
  });
}

// Versions
export async function listVersions(projectId: string) {
  return apiRequest<any[]>(`/api/projects/${projectId}/versions`);
}

export async function createVersion(projectId: string, formData: FormData) {
  const response = await fetch(`/api/projects/${projectId}/versions`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) return { error: data.error ?? "Erro" };
  return { data };
}

export function getSignedUrl(zipPath: string): string {
  const base = window.location.origin;
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const secret = "client-signing-secret"; // Client-side signing placeholder
  const data = `${zipPath}:${expiry}`;
  const sig = btoa(data); // Simplified for demo; use proper HMAC
  return `${base}/api/download?path=${encodeURIComponent(zipPath)}&expiry=${expiry}&sig=${sig}`;
}

// Tags
export async function listTags() {
  return apiRequest<{ id: string; name: string }[]>("/api/tags");
}

// Webhook Subscriptions
export async function getWebhookSubscription(projectId: string) {
  return apiRequest<any>(`/api/webhook-subscriptions/${projectId}`);
}

export async function createWebhookSubscription(data: {
  projectId: string;
  repoFullName: string;
  branch?: string;
}) {
  return apiRequest<any>("/api/webhook-subscriptions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function toggleWebhookSubscription(projectId: string, isActive: boolean) {
  return apiRequest<any>(`/api/webhook-subscriptions/${projectId}`, {
    method: "PUT",
    body: JSON.stringify({ isActive }),
  });
}

// Check if user is logged in
export async function checkAuth(): Promise<CurrentUser | null> {
  const result = await apiRequest<{ user: CurrentUser }>("/api/auth/me");
  return result.data?.user ?? null;
}