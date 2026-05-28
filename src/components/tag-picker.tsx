import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeTagNames } from "@/lib/tags";

export function TagPicker({
  value,
  onChange,
  suggestions = [],
  placeholder = "Digite e tecle Enter, ou escolha abaixo…",
  className,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedLower = new Set(value.map((v) => v.toLowerCase()));
  const q = query.trim().toLowerCase();
  const available = suggestions.filter((s) => !selectedLower.has(s.toLowerCase()));
  const filtered = q ? available.filter((s) => s.toLowerCase().includes(q)) : available;
  const exactExists = selectedLower.has(q) || suggestions.some((s) => s.toLowerCase() === q);
  const canCreate = q.length > 0 && !exactExists;

  function addTag(name: string) {
    onChange(normalizeTagNames([...value, name]));
    setQuery("");
  }
  function removeTag(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  return (
    <div className={cn("relative", className)}>
      <div className="min-h-11 rounded-xl border border-input bg-background px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-ring">
        {value.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 rounded-full pl-2.5">
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="rounded-full hover:bg-foreground/10 p-0.5"
              aria-label={`Remover ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && query.trim()) {
              e.preventDefault();
              addTag(query);
            } else if (e.key === "Backspace" && !query && value.length) {
              removeTag(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm px-1 py-1"
        />
      </div>

      {open && (filtered.length > 0 || canCreate) && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-md p-1 max-h-56 overflow-auto">
          {canCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(query)}
              className="w-full text-left text-sm px-2.5 py-1.5 rounded-lg hover:bg-accent"
            >
              Criar “{query.trim()}”
            </button>
          )}
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(s)}
              className="w-full text-left text-sm px-2.5 py-1.5 rounded-lg hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
