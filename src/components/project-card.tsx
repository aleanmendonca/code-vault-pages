import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, GitBranch, User } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      to="/p/$id"
      params={{ id: p.id }}
      className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="aspect-[16/9] bg-muted overflow-hidden">
        {p.cover_url ? (
          <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">Sem capa</div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 min-h-[110px]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight line-clamp-1">{p.title}</h3>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide shrink-0">
            {p.type === "pagina" ? "página" : "saas"}
          </Badge>
        </div>
        {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
          {p.author && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.author}</span>
          )}
          {p.production_url && (
            <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" />prod</span>
          )}
          {p.git_url && (
            <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />git</span>
          )}
        </div>
        {p.tags && p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
