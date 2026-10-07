import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { ApiError } from "../../lib/api";
import { useAuth } from "../auth";
import { Button, ErrorBox, TextInput } from "../ui";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/admin/noticias" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith("/admin") && !from.startsWith("/admin/entrar") ? from : "/admin/noticias", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar sessão.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-wine px-4 py-10">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-5 rounded-2xl bg-foam p-7 shadow-xl" aria-labelledby="login-title">
        <div>
          <img src="/brand/unedo4all-logo.png" alt="UNEDO4ALL" width={619} height={103} className="h-8 w-auto" />
          <h1 id="login-title" className="mt-5 font-display text-3xl tracking-tight text-ink">
            Entrar no backoffice
          </h1>
        </div>
        {error ? <ErrorBox>{error}</ErrorBox> : null}
        <TextInput label="Email" type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput
          label="Palavra-passe"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy || !email || !password}>
          {busy ? "A entrar…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
