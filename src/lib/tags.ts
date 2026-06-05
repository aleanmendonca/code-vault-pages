import { listTags } from "@/lib/api";

/** Normaliza uma lista de nomes de tag: trim, remove vazios e duplicatas (case-insensitive). */
export function normalizeTagNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Busca todas as tags do usuário (ordenadas por nome) para sugerir no seletor. */
export async function fetchUserTags(): Promise<string[]> {
  const { data, error } = await listTags();
  if (error) throw new Error(error);
  return (data ?? []).map((t) => t.name).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Sincroniza as tags de um projeto: envia a lista de nomes ao servidor
 * para que ele faça o upsert na tabela tags e a关联 com project_tags.
 */
export async function syncProjectTags(projectId: string, names: string[]): Promise<void> {
  const clean = normalizeTagNames(names);
  const response = await fetch(`/api/projects/${projectId}/tags`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags: clean }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error ?? "Erro ao sincronizar tags");
  }
}
