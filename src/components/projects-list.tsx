import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/project-card";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Enums"]["project_type"];

export function ProjectsList({ type, title }: { type: T; title: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["projects", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data?.length ?? 0} {data?.length === 1 ? "projeto" : "projetos"}
          </p>
        </div>
        <Link
          to="/novo"
          search={{ type }}
          className="inline-flex items-center gap-1.5 text-xs h-8 px-3 rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Novo
        </Link>
      </header>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Carregando…</div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm font-medium">Nenhum projeto ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Cadastre o primeiro para começar.</p>
          <Link
            to="/novo"
            search={{ type }}
            className="inline-flex items-center gap-1.5 mt-4 text-xs h-8 px-3 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Cadastrar projeto
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
