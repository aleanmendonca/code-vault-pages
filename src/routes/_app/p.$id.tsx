import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Download, ExternalLink, GitBranch, Trash2, Upload, User } from "lucide-react";

export const Route = createFileRoute("/_app/p/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Projeto — CodeVault" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [gitCommit, setGitCommit] = useState("");
  const [zip, setZip] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const project = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const versions = useQuery({
    queryKey: ["versions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("versions").select("*").eq("project_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function uploadVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !zip || !version.trim()) {
      toast.error("Informe a versão e selecione o arquivo .zip");
      return;
    }
    setUploading(true);
    try {
      const path = `${user.id}/${id}/${version.trim()}-${zip.name}`;
      const { error: upErr } = await supabase.storage.from("zips").upload(path, zip, { upsert: false });
      if (upErr) throw upErr;
      const { error: vErr } = await supabase.from("versions").insert({
        project_id: id,
        user_id: user.id,
        version: version.trim(),
        changelog: changelog.trim() || null,
        git_commit: gitCommit.trim() || null,
        zip_path: path,
        zip_size: zip.size,
      });
      if (vErr) throw vErr;
      toast.success("Nova versão enviada!");
      setVersion(""); setChangelog(""); setGitCommit(""); setZip(null);
      (document.getElementById("zip-input") as HTMLInputElement | null)?.value && ((document.getElementById("zip-input") as HTMLInputElement).value = "");
      qc.invalidateQueries({ queryKey: ["versions", id] });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar versão");
    } finally {
      setUploading(false);
    }
  }

  async function downloadZip(zip_path: string) {
    const { data, error } = await supabase.storage.from("zips").createSignedUrl(zip_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  async function deleteProject() {
    const p = project.data;
    if (!p) return;
    // delete zips
    const paths = (versions.data ?? []).map(v => v.zip_path);
    if (paths.length) await supabase.storage.from("zips").remove(paths);
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Projeto excluído");
    nav({ to: p.type === "saas" ? "/saas" : "/paginas" });
  }

  if (project.isLoading) return <div className="p-6 text-xs text-muted-foreground">Carregando…</div>;
  if (!project.data) return <div className="p-6 text-xs text-muted-foreground">Projeto não encontrado.</div>;
  const p = project.data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to={p.type === "saas" ? "/saas" : "/paginas"} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>

      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          {p.cover_url && (
            <div className="rounded-lg border border-border overflow-hidden aspect-[16/9] bg-muted">
              <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px] uppercase">{p.type === "pagina" ? "página" : "saas"}</Badge>
                {p.author && <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{p.author}</span>}
              </div>
              <h1 className="text-xl font-semibold tracking-tight">{p.title}</h1>
              {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação remove o projeto e todas as versões. Não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteProject}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {p.tags && p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {p.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Upload className="h-3.5 w-3.5" /> Nova versão</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={uploadVersion} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Versão *</Label>
                    <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1.0.0" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Git commit (opcional)</Label>
                    <Input value={gitCommit} onChange={(e) => setGitCommit(e.target.value)} placeholder="abc1234" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Arquivo .zip *</Label>
                  <Input id="zip-input" type="file" accept=".zip,application/zip" onChange={(e) => setZip(e.target.files?.[0] ?? null)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Changelog</Label>
                  <Textarea value={changelog} onChange={(e) => setChangelog(e.target.value)} rows={2} />
                </div>
                <Button type="submit" disabled={uploading} size="sm">{uploading ? "Enviando…" : "Subir versão"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Versões ({versions.data?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.isLoading ? (
                <div className="text-xs text-muted-foreground">Carregando…</div>
              ) : !versions.data || versions.data.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nenhuma versão enviada ainda.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {versions.data.map((v) => (
                    <li key={v.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{v.version}</span>
                          {v.git_commit && <span className="text-[10px] font-mono text-muted-foreground">{v.git_commit}</span>}
                        </div>
                        {v.changelog && <p className="text-xs text-muted-foreground mt-0.5">{v.changelog}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(v.created_at).toLocaleString("pt-BR")}
                          {v.zip_size ? ` · ${(v.zip_size / 1024 / 1024).toFixed(2)} MB` : ""}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => downloadZip(v.zip_path)}>
                        <Download className="h-3 w-3 mr-1" /> baixar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-3">
          <Card>
            <CardContent className="p-3 space-y-2">
              {p.production_url ? (
                <a href={p.production_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-foreground hover:text-primary">
                  <ExternalLink className="h-3.5 w-3.5" /> Ver em produção
                </a>
              ) : <p className="text-xs text-muted-foreground">Sem link de produção</p>}
              {p.git_url ? (
                <a href={p.git_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-foreground hover:text-primary">
                  <GitBranch className="h-3.5 w-3.5" /> Repositório
                </a>
              ) : <p className="text-xs text-muted-foreground">Sem repositório</p>}
            </CardContent>
          </Card>
          <p className="text-[10px] text-muted-foreground px-1">
            Criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}
          </p>
        </aside>
      </div>
    </div>
  );
}
