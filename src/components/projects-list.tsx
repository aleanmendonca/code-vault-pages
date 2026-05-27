import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/project-card";
import { Link } from "@tanstack/react-router";
import { Plus, FolderOpen } from "lucide-react";
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
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.length ?? 0} {data?.length === 1 ? "projeto cadastrado" : "projetos cadastrados"}
          </p>
        </div>
        <Link
          to="/novo"
          search={{ type }}
          className="inline-flex items-center gap-2 text-sm h-10 px-4 rounded-xl bg-gradient-primary text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Novo projeto
        </Link>
      </header>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : !data || data.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent grid place-items-center mx-auto mb-4">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">Nenhum projeto ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Cadastre o primeiro para começar a versionar.</p>
          <Link
            to="/novo"
            search={{ type }}
            className="inline-flex items-center gap-2 mt-6 text-sm h-10 px-4 rounded-xl bg-gradient-primary text-primary-foreground shadow-sm"
          >
            <Plus className="h-4 w-4" /> Cadastrar projeto
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
