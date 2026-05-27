import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, GitBranch, User, ImageIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { typeLabel } from "@/lib/project-types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      to="/p/$id"
      params={{ id: p.id }}
      className="group flex flex-col rounded-2xl glass overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-[16/10] bg-muted/50 overflow-hidden relative">
        {p.cover_url ? (
          <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground bg-gradient-to-br from-muted/40 to-accent/40">
            <ImageIcon className="h-8 w-8 opacity-40" />
          </div>
        )}
        <Badge variant="secondary" className="absolute top-3 right-3 text-[10px] uppercase tracking-wide rounded-full backdrop-blur-md bg-background/70">
          {typeLabel(p.type)}
        </Badge>
      </div>
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <h3 className="text-base font-semibold tracking-tight line-clamp-1">{p.title}</h3>
        {p.description && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
          {p.author && (
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{p.author}</span>
          )}
          {p.production_url && (
            <span className="flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />prod</span>
          )}
          {p.git_url && (
            <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" />git</span>
          )}
        </div>
        {p.tags && p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
