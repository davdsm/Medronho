import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { ApiError } from "../../lib/api";
import { useAuth } from "../auth";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 8 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="3" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

/** Campo no estilo «cartão»: ícone, divisória, rótulo pequeno e valor. */
function CardField({ label, icon, trailing, children }: { label: string; icon: ReactNode; trailing?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink/12 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition focus-within:border-berry focus-within:ring-4 focus-within:ring-berry/12">
      <span className="text-ink-soft">{icon}</span>
      <span className="h-9 w-px shrink-0 bg-ink/12" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-[11px] font-medium text-ink-soft">
          {label}
        </label>
        {children(id)}
      </div>
      {trailing}
    </div>
  );
}

const bare = "block w-full min-w-0 border-0 bg-transparent p-0 text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/50 focus:outline-none focus:ring-0 focus-visible:!outline-none";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
    <div className="grid min-h-dvh bg-white text-ink lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <a href="/" aria-label="UNEDO4ALL — ver o site" className="mx-auto mt-2 block lg:mt-4">
          <img src="/brand/unedo4all-logo.png" alt="UNEDO4ALL" width={619} height={103} className="h-9 w-auto" />
        </a>

        <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center py-10">
          <h1 className="text-center font-display text-[2rem] leading-tight tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-2 text-center text-sm text-ink-soft">Entre com os seus dados para gerir o site do projeto.</p>

          <form onSubmit={submit} className="mt-8 grid gap-3.5" aria-label="Entrar no backoffice" noValidate>
            {error ? (
              <div role="alert" className="rounded-xl bg-berry/10 px-4 py-3 text-sm font-medium text-berry">
                {error}
              </div>
            ) : null}
            <CardField label="Email" icon={<MailIcon />}>
              {(id) => (
                <input id={id} type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.pt" className={bare} />
              )}
            </CardField>
            <CardField
              label="Palavra-passe"
              icon={<LockIcon />}
              trailing={
                <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink">
                  {show ? "Ocultar" : "Mostrar"}
                </button>
              }
            >
              {(id) => (
                <input
                  id={id}
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className={bare}
                />
              )}
            </CardField>
            <button
              type="submit"
              disabled={busy || !email || !password}
              className="mt-2 rounded-2xl bg-berry px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_16px_-6px] shadow-berry/60 transition hover:brightness-95 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {busy ? "A entrar…" : "Entrar"}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 text-xs text-ink-soft" aria-hidden="true">
            <span className="h-px flex-1 bg-ink/12" />
            Backoffice
            <span className="h-px flex-1 bg-ink/12" />
          </div>
        </div>

        <p className="mx-auto max-w-[34rem] text-center text-[13px] leading-relaxed text-ink-soft">
          Aqui gere as notícias, os textos e as imagens do site UNEDO4ALL — conservação e valorização integral do medronho.
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-butter lg:block" aria-hidden="true">
        <img src="/photos/branch.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Véu claro, como no modelo, e desvanecer suave na junção com o formulário. */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-butter/10 to-berry/10" />
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/50 to-transparent" />
      </div>
    </div>
  );
}
