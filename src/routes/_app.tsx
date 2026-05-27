import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { FileCode2, Layers, Plus, LogOut, Vault, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!user) {
    nav({ to: "/login" });
    return null;
  }

  const items = [
    { to: "/paginas", label: "Páginas", icon: FileCode2 },
    { to: "/saas", label: "SaaS", icon: Layers },
    { to: "/ia", label: "IA", icon: Bot },
  ];

  return (
    <div className="min-h-screen flex">
      <Toaster richColors position="top-right" />
      <aside className="w-64 shrink-0 m-3 mr-0 rounded-2xl glass flex flex-col overflow-hidden">
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-border/60">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-sm">
            <Vault className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">Cloud Code Vault</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/novo"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-gradient-primary text-primary-foreground shadow-sm hover:opacity-95 transition-opacity mb-3"
          >
            <Plus className="h-4 w-4" />
            Novo projeto
          </Link>
          <div className="px-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold">Biblioteca</div>
          {items.map((it) => {
            const active = loc.pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm h-9 rounded-lg"
            onClick={async () => {
              await supabase.auth.signOut();
              nav({ to: "/login" });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
