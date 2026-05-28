import type { Database } from "@/integrations/supabase/types";

export type ProjectType = Database["public"]["Enums"]["project_type"];

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

/** Projeto com as tags embutidas via join project_tags -> tags. */
export type ProjectWithTags = ProjectRow & {
  project_tags: { tags: { id: string; name: string } | null }[] | null;
};

/** Extrai os nomes das tags (ordenados) de um projeto vindo do join. */
export function tagNamesOf(p: Pick<ProjectWithTags, "project_tags">): string[] {
  return (p.project_tags ?? [])
    .map((pt) => pt.tags?.name)
    .filter((n): n is string => Boolean(n))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export type ProjectRoute = "/paginas" | "/saas" | "/ia";

export const PROJECT_TYPES: { value: ProjectType; label: string; route: ProjectRoute }[] = [
  { value: "pagina", label: "Página", route: "/paginas" },
  { value: "saas", label: "SaaS", route: "/saas" },
  { value: "ia", label: "IA", route: "/ia" },
];

export function typeLabel(type: ProjectType): string {
  return PROJECT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function routeForType(type: ProjectType): ProjectRoute {
  switch (type) {
    case "saas":
      return "/saas";
    case "ia":
      return "/ia";
    default:
      return "/paginas";
  }
}
