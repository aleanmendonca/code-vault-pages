import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/project-card";
import { Link } from "@tanstack/react-router";
import { Plus, FolderOpen, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tagNamesOf, type ProjectType, type ProjectWithTags } from "@/lib/project-types";

export function ProjectsList({ type, title }: { type?: ProjectType; title: string }) {
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", type ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, project_tags(tags(id, name))")
        .order("created_at", { ascending: false });
      if (type) {
        query = query.eq("type", type);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ProjectWithTags[];
    },
  });

  const availableTags = useMemo(
    () =>
      Array.from(new Set((data ?? []).flatMap(tagNamesOf))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    if (selected.length === 0) return data;
    return data.filter((p) => {
      const tags = tagNamesOf(p);
      return selected.some((s) => tags.includes(s));
    });
  }, [data, selected]);

  function toggleTag(tag: string) {
    setSelected((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.length ?? 0} {data?.length === 1 ? "projeto cadastrado" : "projetos cadastrados"}
            {selected.length > 0 && ` · ${filtered.length} com o filtro`}
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

      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-8">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mr-1">
            <Tag className="h-3.5 w-3.5" /> Filtrar:
          </span>
          {availableTags.map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-accent/50 text-accent-foreground border-transparent hover:bg-accent",
                )}
              >
                {tag}
              </button>
            );
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum projeto com as tags selecionadas.</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
