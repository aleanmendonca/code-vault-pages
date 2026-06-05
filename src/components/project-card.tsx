import { Link } from "@tanstack/react-router";
import { ExternalLink, GitBranch, User, ImageIcon } from "lucide-react";
import { typeLabel, tagNamesOf, type ProjectWithTags } from "@/lib/project-types";

export function ProjectCard({ p }: { p: ProjectWithTags }) {
  const tags = tagNamesOf(p);

  return (
    <Link
      to="/p/$id"
      params={{ id: p.id }}
      className="group surface-elevated border border-border hover:border-foreground transition-colors"
    >
      {/* Cover - no rounded corners, rule 12 */}
      <div className="aspect-[16/9] bg-surface overflow-hidden relative">
        {p.cover_url ? (
          <img
            src={p.cover_url}
            alt={p.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="w-full h-full grid place-items-center bg-background">
            <ImageIcon className="h-8 w-8 text-muted" />
          </div>
        )}
        {/* Type label - micro text, uppercase */}
        <span className="absolute top-3 right-3 text-micro text-muted-foreground bg-background/80 px-2 py-1">
          {typeLabel(p.type)}
        </span>
      </div>

      {/* Content - asymmetric padding */}
      <div className="p-5">
        <h3 className="text-base font-medium tracking-tight mb-1">{p.title}</h3>
        {p.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.description}</p>
        )}

        {/* Meta - font-mono */}
        <div className="flex items-center gap-4 font-mono text-micro text-muted mb-4">
          {p.author && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {p.author}
            </span>
          )}
          {p.production_url && (
            <span className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <span>prod</span>
            </span>
          )}
          {p.git_url && (
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span>git</span>
            </span>
          )}
        </div>

        {/* Tags - micro text */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((t) => (
              <span key={t} className="text-micro text-muted-foreground bg-surface px-2 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}