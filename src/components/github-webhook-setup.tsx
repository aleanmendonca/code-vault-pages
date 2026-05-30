import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GitBranch, Copy, Check, Webhook, Power, PowerOff } from "lucide-react";

export function GitHubWebhookSetup({ projectId, gitUrl }: { projectId: string; gitUrl: string | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [copied, setCopied] = useState<"url" | "secret" | null>(null);
  const [branch, setBranch] = useState("main");

  const repoFullName = extractRepoFullName(gitUrl);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["webhook-subscription", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user || !repoFullName) throw new Error("Dados insuficientes");
      const secret = generateSecret();
      const { error } = await supabase.from("webhook_subscriptions").insert({
        project_id: projectId,
        user_id: user.id,
        repo_full_name: repoFullName,
        webhook_secret: secret,
        branch,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook-subscription", projectId] });
      toast.success("Monitoramento ativado!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) return;
      const { error } = await supabase
        .from("webhook_subscriptions")
        .update({ is_active: !subscription.is_active })
        .eq("id", subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook-subscription", projectId] });
      toast.success(subscription?.is_active ? "Monitoramento pausado" : "Monitoramento reativado");
    },
    onError: (err: any) => toast.error(err.message),
  });

  function copyToClipboard(text: string, type: "url" | "secret") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!repoFullName) {
    return (
      <div className="rounded-2xl border border-border/60 bg-accent/30 p-5">
        <p className="text-sm text-muted-foreground">
          Adicione um link do Git ao projeto para habilitar o monitoramento automático de commits.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando…</div>;
  }

  const webhookUrl = `${window.location.origin}/api/github-webhook`;

  // No subscription yet — show setup form
  if (!subscription) {
    return (
      <div className="rounded-2xl border border-border/60 bg-accent/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Monitoramento GitHub</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Ative para registrar automaticamente cada push como nova versão.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs">Branch monitorada</Label>
          <Input
            className="h-9 rounded-lg text-sm"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
          />
        </div>
        <Button
          size="sm"
          className="rounded-lg"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <GitBranch className="h-3.5 w-3.5 mr-1.5" />
          {createMutation.isPending ? "Ativando…" : "Ativar monitoramento"}
        </Button>
      </div>
    );
  }

  // Subscription exists — show config info
  return (
    <div className="rounded-2xl border border-border/60 bg-accent/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Monitoramento GitHub</p>
        </div>
        <Badge variant={subscription.is_active ? "default" : "secondary"} className="text-[10px] rounded-full">
          {subscription.is_active ? "Ativo" : "Pausado"}
        </Badge>
      </div>

      <div className="space-y-3 text-xs">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Webhook URL (cole no GitHub)</Label>
          <div className="flex gap-1.5">
            <code className="flex-1 bg-background rounded-lg px-2.5 py-1.5 border text-[11px] truncate">
              {webhookUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => copyToClipboard(webhookUrl, "url")}
            >
              {copied === "url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Secret</Label>
          <div className="flex gap-1.5">
            <code className="flex-1 bg-background rounded-lg px-2.5 py-1.5 border text-[11px] truncate">
              {subscription.webhook_secret}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => copyToClipboard(subscription.webhook_secret, "secret")}
            >
              {copied === "secret" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <span>Branch: <strong className="text-foreground">{subscription.branch}</strong></span>
          {subscription.last_commit_sha && (
            <span>Último: <strong className="text-foreground">{subscription.last_commit_sha.slice(0, 7)}</strong></span>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          No GitHub: Settings → Webhooks → Add webhook. Cole a URL acima, o Secret,
          Content type = <code>application/json</code>, e selecione "Just the push event".
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="rounded-lg text-xs"
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
      >
        {subscription.is_active ? (
          <><PowerOff className="h-3 w-3 mr-1.5" /> Pausar</>
        ) : (
          <><Power className="h-3 w-3 mr-1.5" /> Reativar</>
        )}
      </Button>
    </div>
  );
}

function extractRepoFullName(gitUrl: string | null): string | null {
  if (!gitUrl) return null;
  // Handles: https://github.com/owner/repo, https://github.com/owner/repo.git
  const match = gitUrl.match(/github\.com[/:]([^/]+\/[^/.]+)/);
  return match?.[1] ?? null;
}

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
