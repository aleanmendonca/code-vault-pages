import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { login, register, getMe } from "@/lib/api";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Entrar — Cloud Vault" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMe().then(({ user }) => {
      if (user) nav({ to: "/paginas" });
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await register(email, password);
        if (error) throw new Error(error);
        toast.success("Conta criada. Você já pode entrar.");
        setMode("login");
      } else {
        const { error } = await login(email, password);
        if (error) throw new Error(error);
        nav({ to: "/paginas" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-start p-8">
      <Toaster richColors position="top-right" />

      {/* Asymmetric layout - rule 06: left-aligned, not centered */}
      <div className="w-full max-w-md offset-left">
        {/* Large display text - rule 05: extreme sizes */}
        <div className="mb-16">
          <h1 className="text-display-lg text-foreground/10">Vault</h1>
          <p className="text-micro text-muted mt-2">Cloud storage for your code projects</p>
        </div>

        {/* Auth card - minimal, no glassmorphism */}
        <div className="surface-elevated p-8">
          <h2 className="text-micro text-muted mb-8">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-micro text-muted-foreground block">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-micro text-muted-foreground block">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-foreground text-background text-micro disabled:opacity-50 transition-opacity hover:opacity-80"
              disabled={busy}
            >
              {busy ? "Wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="w-full text-sm text-muted hover:text-foreground transition-colors"
            >
              {mode === "login" ? "No account? Sign up" : "Have account? Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}