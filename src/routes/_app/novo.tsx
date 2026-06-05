import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { createProject, createVersion } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagPicker } from "@/components/tag-picker";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { routeForType } from "@/lib/project-types";
import { fetchUserTags } from "@/lib/tags";

const searchSchema = z.object({
  type: z.enum(["pagina", "saas", "ia", "n8n"]).optional(),
});

export const Route = createFileRoute("/_app/novo")({
  ssr: false,
  head: () => ({ meta: [{ title: "Novo projeto — Cloud Code Vault" }] }),
  validateSearch: searchSchema,
  component: NewProject,
});

function NewProject() {
  const nav = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    type: (search.type ?? "pagina") as "pagina" | "saas" | "ia" | "n8n",
    title: "",
    description: "",
    production_url: "",
    git_url: "",
    author: "",
    version: "v0.1.0",
    changelog: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [zip, setZip] = useState<File | null>(null);

  const { data: tagSuggestions } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchUserTags,
    enabled: !!user,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("type", form.type);
      fd.append("title", form.title.trim());
      if (form.description.trim()) fd.append("description", form.description.trim());
      if (form.production_url.trim()) fd.append("production_url", form.production_url.trim());
      if (form.git_url.trim()) fd.append("git_url", form.git_url.trim());
      if (form.author.trim()) fd.append("author", form.author.trim());
      if (tags.length) fd.append("tags", JSON.stringify(tags));
      if (cover) fd.append("cover_file", cover);

      const { data: project, error: pErr } = await createProject(fd);
      if (pErr) throw new Error(pErr);
      if (!project?.id) throw new Error("Projeto criado mas ID não retornado");

      if (zip) {
        const vfd = new FormData();
        vfd.append("version", form.version);
        if (form.changelog.trim()) vfd.append("changelog", form.changelog.trim());
        vfd.append("zip_file", zip);
        const { error: vErr } = await createVersion(project.id, vfd);
        if (vErr) throw new Error(vErr);
      }

      toast.success("Projeto cadastrado!");
      nav({ to: "/p/$id", params: { id: project.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao cadastrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => nav({ to: routeForType(form.type) })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="glass-strong rounded-3xl p-8">
        <header className="mb-6 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-sm shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Novo projeto</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Cadastre página ou SaaS com capa, links e arquivo .zip.</p>
          </div>
        </header>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Tipo</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagina">Página</SelectItem>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="ia">IA</SelectItem>
                  <SelectItem value="n8n">N8N</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Autor</Label>
              <Input className="h-11 rounded-xl" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Seu nome" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Título *</Label>
            <Input className="h-11 rounded-xl" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Descrição</Label>
            <Textarea className="rounded-xl" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Link em produção</Label>
              <Input className="h-11 rounded-xl" type="url" value={form.production_url} onChange={(e) => setForm({ ...form, production_url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Link do Git</Label>
              <Input className="h-11 rounded-xl" type="url" value={form.git_url} onChange={(e) => setForm({ ...form, git_url: e.target.value })} placeholder="https://github.com/…" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Tags</Label>
            <TagPicker value={tags} onChange={setTags} suggestions={tagSuggestions ?? []} />
            <p className="text-[11px] text-muted-foreground">Escolha tags já usadas ou crie novas — ficam salvas para reutilizar e filtrar.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Imagem de capa</Label>
            <Input className="h-11 rounded-xl file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
          </div>

          <div className="rounded-2xl border border-border/60 bg-accent/30 p-5 space-y-4">
            <p className="text-sm font-medium">Versão inicial (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Tag da versão</Label>
                <Input className="h-11 rounded-xl bg-background" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v0.1.0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Arquivo .zip do código</Label>
                <Input className="h-11 rounded-xl bg-background file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium" type="file" accept=".zip,application/zip" onChange={(e) => setZip(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Changelog</Label>
              <Textarea className="rounded-xl bg-background" value={form.changelog} onChange={(e) => setForm({ ...form, changelog: e.target.value })} rows={2} placeholder="O que mudou nesta versão?" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => nav({ to: routeForType(form.type) })}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="h-11 rounded-xl bg-gradient-primary px-6">{busy ? "Salvando…" : "Cadastrar projeto"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
