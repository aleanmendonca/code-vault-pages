export type ProjectType = "pagina" | "saas" | "ia" | "n8n";

/** Projeto com as tags embutidas. */
export interface ProjectWithTags {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: ProjectType;
  author: string | null;
  git_url: string | null;
  production_url: string | null;
  cover_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string | null;
}

/** Extrai os nomes das tags (ordenados) de um projeto. */
export function tagNamesOf(p: Pick<ProjectWithTags, "tags">): string[] {
  return [...(p.tags ?? [])].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export type ProjectRoute = "/paginas" | "/saas" | "/ia" | "/n8n" | "/todos";

export const PROJECT_TYPES: { value: ProjectType; label: string; route: ProjectRoute }[] = [
  { value: "pagina", label: "Página", route: "/paginas" },
  { value: "saas", label: "SaaS", route: "/saas" },
  { value: "ia", label: "IA", route: "/ia" },
  { value: "n8n", label: "N8N", route: "/n8n" },
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
    case "n8n":
      return "/n8n";
    default:
      return "/paginas";
  }
}
