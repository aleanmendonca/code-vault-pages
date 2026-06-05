import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/api";
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
      const { data: projects, error } = await listProjects(type);
      if (error) throw new Error(error);
      return (projects ?? []) as ProjectWithTags[];
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
    <div className="max-w-6xl">
      {/* Header - asymmetric */}
      <div className="mb-12">
        <h1 className="text-display-sm text-foreground mb-4">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} {data?.length === 1 ? "project" : "projects"}
          {selected.length > 0 && ` · ${filtered.length} filtered`}
        </p>
      </div>

      {/* Tag filter - micro text */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <span className="text-micro text-muted-foreground flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Filter
          </span>
          {availableTags.map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-micro transition-colors px-2 py-1",
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
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
              className="text-micro text-muted-foreground hover:text-foreground transition-colors ml-2"
            >
              <X className="h-3 w-3 inline mr-1" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-micro text-muted">Loading</div>
      ) : !data || data.length === 0 ? (
        <div className="surface-elevated border border-border p-16 text-center">
          <div className="mb-6">
            <FolderOpen className="h-8 w-8 text-muted mx-auto" />
          </div>
          <p className="text-base font-medium mb-2">No projects yet</p>
          <p className="text-sm text-muted-foreground mb-6">Add your first project to start versioning.</p>
          <Link
            to="/novo"
            search={{ type }}
            className="inline-block bg-foreground text-background text-micro px-6 py-3 hover:opacity-80 transition-opacity"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Add project
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-elevated border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No projects with selected tags.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}