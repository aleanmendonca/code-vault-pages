import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const searchSchema = z.object({
  type: z.enum(["pagina", "saas"]).optional(),
});

export const Route = createFileRoute("/_app/novo")({
  head: () => ({ meta: [{ title: "Novo projeto — CodeVault" }] }),
  validateSearch: searchSchema,
  component: NewProject,
});

function NewProject() {
  const nav = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    type: (search.type ?? "pagina") as "pagina" | "saas",
    title: "",
    description: "",
    production_url: "",
    git_url: "",
    author: "",
    tags: "",
    version: "v0.1.0",
    changelog: "",
  });
  const [cover, setCover] = useState<File | null>(null);
  const [zip, setZip] = useState<File | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let cover_url: string | null = null;
      if (cover) {
        const ext = cover.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("covers").upload(path, cover, { upsert: false });
        if (error) throw error;
        cover_url = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
      }

      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

      const { data: project, error: pErr } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim() || null,
          production_url: form.production_url.trim() || null,
          git_url: form.git_url.trim() || null,
          author: form.author.trim() || null,
          tags,
          cover_url,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      if (zip) {
        const path = `${user.id}/${project.id}/${form.version}-${zip.name}`;
        const { error: zErr } = await supabase.storage.from("zips").upload(path, zip, { upsert: false });
        if (zErr) throw zErr;
        const { error: vErr } = await supabase.from("versions").insert({
          project_id: project.id,
          user_id: user.id,
          version: form.version,
          changelog: form.changelog.trim() || null,
          zip_path: path,
          zip_size: zip.size,
        });
        if (vErr) throw vErr;
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
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Novo projeto</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Cadastre página ou SaaS com capa, links e zip.</p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pagina">Página</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Autor</Label>
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Seu nome" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Título *</Label>
          <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Descrição</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Link em produção</Label>
            <Input type="url" value={form.production_url} onChange={(e) => setForm({ ...form, production_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Link do Git</Label>
            <Input type="url" value={form.git_url} onChange={(e) => setForm({ ...form, git_url: e.target.value })} placeholder="https://github.com/…" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Tags (separadas por vírgula)</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, landing, marketing" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Imagem de capa</Label>
          <Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
        </div>

        <div className="rounded-lg border border-border p-3 space-y-3">
          <p className="text-xs font-medium">Versão inicial (opcional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tag da versão</Label>
              <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v0.1.0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Arquivo .zip do código</Label>
              <Input type="file" accept=".zip,application/zip" onChange={(e) => setZip(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Changelog</Label>
            <Textarea value={form.changelog} onChange={(e) => setForm({ ...form, changelog: e.target.value })} rows={2} placeholder="O que mudou nesta versão?" />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/paginas" })}>Cancelar</Button>
          <Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Cadastrar"}</Button>
        </div>
      </form>
    </div>
  );
}
