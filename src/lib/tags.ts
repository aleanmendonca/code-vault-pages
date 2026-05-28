import { supabase } from "@/integrations/supabase/client";

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
export async function fetchUserTags(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("name")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => t.name);
}

/**
 * Sincroniza as tags de um projeto:
 * 1. garante que cada nome exista na tabela `tags` do usuário (cria se novo);
 * 2. substitui os vínculos em `project_tags` pelos selecionados.
 */
export async function syncProjectTags(projectId: string, userId: string, names: string[]): Promise<void> {
  const clean = normalizeTagNames(names);

  // 1. upsert das tags (a unique (user_id, name) evita duplicatas)
  let tagIds: string[] = [];
  if (clean.length) {
    const { data, error } = await supabase
      .from("tags")
      .upsert(
        clean.map((name) => ({ user_id: userId, name })),
        { onConflict: "user_id,name" },
      )
      .select("id");
    if (error) throw error;
    tagIds = (data ?? []).map((t) => t.id);
  }

  // 2. reseta os vínculos do projeto
  const { error: delErr } = await supabase.from("project_tags").delete().eq("project_id", projectId);
  if (delErr) throw delErr;

  if (tagIds.length) {
    const { error: insErr } = await supabase
      .from("project_tags")
      .insert(tagIds.map((tag_id) => ({ project_id: projectId, tag_id })));
    if (insErr) throw insErr;
  }
}
