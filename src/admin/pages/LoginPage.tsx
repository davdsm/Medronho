import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { ArrowLeft, Envelope, Eye, EyeSlash, LockSimple, WarningCircle } from "@phosphor-icons/react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../auth";

/** Fotografia de Ricardo Gomez Angel no Unsplash (licença Unsplash): https://unsplash.com/photos/Gh_Oc8USMe8 */
const LOGIN_PHOTO = "https://images.unsplash.com/photo-1569239591652-6cc3025b07fa?auto=format&fit=crop&w=1600&q=80";
const LOCAL_FALLBACK = "/photos/branch.jpg";
const REMEMBER_KEY = "unedo-admin-email";

function readRemembered(): string {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}
function writeRemembered(email: string | null) {
  try {
    if (email) window.localStorage.setItem(REMEMBER_KEY, email);
    else window.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* armazenamento indisponível: ignora */
  }
}

function Photo({ className = "" }: { className?: string }) {
  return (
    <img
      src={LOGIN_PHOTO}
      alt=""
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      onError={(e) => {
        // Sem acesso ao Unsplash (offline): usa a fotografia local.
        if (!e.currentTarget.src.endsWith(LOCAL_FALLBACK)) e.currentTarget.src = LOCAL_FALLBACK;
      }}
    />
  );
}

/** Campo em cartão: ícone, divisória, rótulo pequeno e valor. */
function CardField({ label, icon, trailing, invalid, children }: { label: string; icon: ReactNode; trailing?: ReactNode; invalid?: boolean; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition focus-within:ring-4 ${
        invalid ? "border-berry/60 focus-within:ring-berry/10" : "border-ink/12 focus-within:border-ink/40 focus-within:ring-ink/5"
      }`}
    >
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

const bare =
  "block w-full min-w-0 border-0 bg-transparent p-0 text-base font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/45 focus:outline-none focus:ring-0 focus-visible:!outline-none sm:text-[15px]";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const remembered = useRef(readRemembered());
  const [email, setEmail] = useState(remembered.current);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(Boolean(remembered.current));
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (remembered.current ? passwordRef : emailRef).current?.focus();
  }, []);

  if (user) return <Navigate to="/admin/noticias" replace />;

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!emailValid || !password) {
      setError(!emailValid ? "Introduza um email válido." : "Introduza a palavra-passe.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      writeRemembered(remember ? email.trim().toLowerCase() : null);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith("/admin") && !from.startsWith("/admin/entrar") ? from : "/admin/noticias", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar sessão.");
      setPassword("");
      passwordRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="grid min-h-dvh bg-white text-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Imagem em faixa no topo em ecrãs pequenos */}
      <div className="relative h-44 overflow-hidden sm:h-56 lg:hidden" aria-hidden="true">
        <Photo />
      </div>

      <div className="relative flex flex-col px-5 pb-6 sm:px-10 lg:px-16 lg:py-8">
        <div className="mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center py-10 lg:py-12">
          <a href="/" className="mx-auto mb-5 block" aria-label="UNEDO4ALL, ver o site">
            <img src="/brand/unedo4all-logo.png" alt="UNEDO4ALL" width={619} height={103} className="h-8 w-auto sm:h-9" />
          </a>
          <h1 className="text-center font-display text-[1.9rem] leading-tight tracking-tight sm:text-[2.1rem]">Bem-vindo de volta</h1>
          <p className="mt-2 text-center text-[15px] text-ink-soft">Entre com os seus dados para gerir o site do projeto.</p>

          <form onSubmit={submit} className="mt-8 grid gap-3.5" aria-label="Entrar no backoffice" noValidate>
            {error ? (
              <div role="alert" className="flex items-start gap-2 rounded-2xl bg-berry/8 px-4 py-3 text-sm font-medium text-berry">
                <WarningCircle size={18} weight="bold" className="mt-px shrink-0" aria-hidden />
                {error}
              </div>
            ) : null}
            <CardField label="Email" icon={<Envelope size={20} aria-hidden />} invalid={Boolean(error) && !emailValid}>
              {(id) => (
                <input
                  ref={emailRef}
                  id={id}
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.pt"
                  className={bare}
                />
              )}
            </CardField>
            <CardField
              label="Palavra-passe"
              icon={<LockSimple size={20} aria-hidden />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-pressed={show}
                  aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                  className="grid h-9 w-9 place-items-center rounded-xl text-ink-soft hover:bg-ink/5 hover:text-ink"
                >
                  {show ? <EyeSlash size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
                </button>
              }
            >
              {(id) => (
                <input
                  ref={passwordRef}
                  id={id}
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={onKey}
                  onKeyDown={onKey}
                  placeholder="A sua palavra-passe"
                  className={bare}
                />
              )}
            </CardField>
            {caps ? (
              <p className="-mt-1 px-1 text-[13px] text-ink-soft" role="status">
                Atenção: a tecla Caps Lock está ativa.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-[var(--color-berry)]" />
                Lembrar o meu email
              </label>
              <button type="button" onClick={() => setHelp((h) => !h)} aria-expanded={help} className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                Esqueceu-se da palavra-passe?
              </button>
            </div>
            {help ? (
              <p className="rounded-2xl bg-beige/70 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                Peça a um administrador para definir uma nova palavra-passe em «Utilizadores». Se for o único administrador, quem gere o servidor pode repô-la com <code className="rounded bg-white px-1">npm run cli -- reset-password</code>.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex h-[3.25rem] items-center justify-center gap-2 rounded-2xl bg-berry px-4 text-base font-semibold text-white shadow-[0_8px_20px_-8px] shadow-berry/70 transition hover:brightness-95 active:brightness-90 disabled:cursor-progress disabled:opacity-70"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />A entrar…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <a href="/" className="mx-auto mt-8 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft size={14} aria-hidden /> Voltar ao site
          </a>
        </div>

        <p className="mx-auto max-w-[34rem] text-center text-[13px] leading-relaxed text-ink-soft">
          Aqui gere as notícias, os textos e as imagens do site UNEDO4ALL, sobre a conservação e valorização integral do medronho.
        </p>
      </div>

      <div className="relative hidden overflow-hidden lg:block" aria-hidden="true">
        <Photo />
      </div>
    </div>
  );
}
