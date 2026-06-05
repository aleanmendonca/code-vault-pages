import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, createFileRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getMe, logout } from "@/lib/api";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Bot, Layers, Plus, Zap, LogOut, LayoutGrid, GitBranch } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const nav = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then(({ user }) => {
      if (!user) {
        nav({ to: "/login", replace: true });
      } else {
        setUser(user);
        setLoading(false);
      }
    });
  }, [nav]);

  async function handleLogout() {
    await logout();
    nav({ to: "/login", replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-micro text-muted">Loading</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={new QueryClient()}>
      <div className="min-h-screen bg-background">
        <Toaster richColors position="top-right" />

        {/* Header - asymmetric, left-aligned */}
        <header className="fixed top-0 left-0 right-0 z-50 surface border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link to="/paginas" className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                  <span className="text-micro text-background">CV</span>
                </div>
                <span className="font-medium text-sm tracking-tight group-hover:opacity-70 transition-opacity">
                  Cloud Vault
                </span>
              </Link>

              {/* Navigation - asymmetric spacing */}
              <nav className="hidden md:flex items-center gap-1 ml-16">
                <NavLink to="/paginas" icon={<LayoutGrid className="w-4 h-4" />}>
                  Todos
                </NavLink>
                <NavLink to="/paginas?type=pagina" icon={<Layers className="w-4 h-4" />}>
                  Páginas
                </NavLink>
                <NavLink to="/paginas?type=saas" icon={<Zap className="w-4 h-4" />}>
                  SaaS
                </NavLink>
                <NavLink to="/paginas?type=ia" icon={<Bot className="w-4 h-4" />}>
                  IA
                </NavLink>
                <NavLink to="/paginas?type=n8n" icon={<GitBranch className="w-4 h-4" />}>
                  N8N
                </NavLink>
              </nav>
            </div>

            {/* Right side - asymmetric */}
            <div className="flex items-center gap-4">
              <Link
                to="/novo"
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-micro hover:bg-foreground/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-muted hover:text-foreground transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content - asymmetric padding */}
        <main className="pt-24 pb-12 px-6 md:px-12 offset-left">
          <Outlet />
        </main>

        {/* Footer - minimal */}
        <footer className="fixed bottom-0 left-0 right-0 px-6 py-3 surface border-t border-border">
          <div className="flex items-center justify-between text-micro text-muted">
            <span>Cloud Vault</span>
            <span>{user?.email}</span>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const isActive = currentPath === to || (to.includes("type=") && window.location.search.includes(to.split("=")[1]));

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 text-micro transition-colors ${
        isActive
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}