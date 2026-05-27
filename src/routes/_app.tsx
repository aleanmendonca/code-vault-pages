import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { FileCode2, Layers, Plus, LogOut, Vault } from "lucide-react";
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
    return <div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">Carregando…</div>;
  }
  if (!user) {
    nav({ to: "/login" });
    return null;
  }

  const items = [
    { to: "/paginas", label: "Páginas", icon: FileCode2 },
    { to: "/saas", label: "SaaS", icon: Layers },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Toaster richColors position="top-right" />
      <aside className="w-56 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="h-12 px-4 flex items-center gap-2 border-b border-sidebar-border">
          <Vault className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">CodeVault</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {items.map((it) => {
            const active = loc.pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <it.icon className="h-3.5 w-3.5" />
                {it.label}
              </Link>
            );
          })}
          <div className="pt-3 mt-3 border-t border-sidebar-border">
            <Link
              to="/novo"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo projeto
            </Link>
          </div>
        </nav>
        <div className="p-2 border-t border-sidebar-border">
          <div className="px-2.5 py-1.5 text-[11px] text-muted-foreground truncate">{user.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-7"
            onClick={async () => {
              await supabase.auth.signOut();
              nav({ to: "/login" });
            }}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
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
