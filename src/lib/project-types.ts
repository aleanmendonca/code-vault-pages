import type { Database } from "@/integrations/supabase/types";

export type ProjectType = Database["public"]["Enums"]["project_type"];

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
