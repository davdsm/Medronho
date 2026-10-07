import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

type Tone = "primary" | "secondary" | "danger" | "ghost";

const toneClass: Record<Tone, string> = {
  primary: "bg-wine text-foam hover:bg-ink disabled:hover:bg-wine",
  secondary: "bg-white text-ink ring-1 ring-ink/20 hover:bg-beige disabled:hover:bg-white",
  danger: "bg-berry text-white hover:brightness-90 disabled:hover:brightness-100",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
};

export function Button({
  tone = "primary",
  small,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; small?: boolean }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        small ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-[15px]"
      } ${toneClass[tone]} ${className}`}
    />
  );
}

const inputClass =
  "w-full rounded-lg border border-ink/20 bg-white px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-soft/60 focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20 disabled:bg-beige";

export function Field({
  label,
  help,
  error,
  children,
  htmlFor,
}: {
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {help ? <p className="text-[13px] text-ink-soft">{help}</p> : null}
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-berry">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  label,
  help,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string; error?: string }) {
  const id = useId();
  return (
    <Field label={label} help={help} error={error} htmlFor={id}>
      <input id={id} {...props} aria-invalid={error ? true : undefined} className={inputClass} />
    </Field>
  );
}

export function TextArea({
  label,
  help,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; help?: string; error?: string }) {
  const id = useId();
  return (
    <Field label={label} help={help} error={error} htmlFor={id}>
      <textarea id={id} {...props} aria-invalid={error ? true : undefined} className={`${inputClass} min-h-24 leading-relaxed`} />
    </Field>
  );
}

export function Select({
  label,
  help,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; help?: string; error?: string }) {
  const id = useId();
  return (
    <Field label={label} help={help} error={error} htmlFor={id}>
      <select id={id} {...props} className={inputClass}>
        {children}
      </select>
    </Field>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10 md:p-6 ${className}`}>{children}</section>;
}

export function PageHeader({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl leading-tight tracking-tight text-ink md:text-4xl">{title}</h1>
        {intro ? <p className="mt-2 max-w-[60ch] text-ink-soft">{intro}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Badge({ tone, children }: { tone: "green" | "gray" | "red" | "yellow"; children: ReactNode }) {
  const map = {
    green: "bg-leaf/10 text-leaf",
    gray: "bg-ink/8 text-ink-soft",
    red: "bg-berry/10 text-berry",
    yellow: "bg-butter text-ink",
  } as const;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

export function Spinner({ label = "A carregar…" }: { label?: string }) {
  return (
    <p role="status" className="py-10 text-center text-ink-soft">
      {label}
    </p>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg bg-berry/10 px-4 py-3 text-[15px] font-medium text-berry">
      {children}
    </div>
  );
}

/* ---------- Avisos ---------- */
type Toast = { id: number; kind: "ok" | "error"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const counter = useRef(0);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++counter.current;
    setItems((cur) => [...cur, { id, kind, text }]);
    window.setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-[15px] font-medium shadow-lg ${
              t.kind === "error" ? "bg-berry text-white" : "bg-ink text-foam"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Confirmação ---------- */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  danger,
  onConfirm,
  onCancel,
  busy,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-cancel]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="dlg-title" className="font-display text-2xl tracking-tight">
          {title}
        </h2>
        <div className="mt-3 text-ink-soft">{message}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button tone="secondary" data-cancel onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button tone={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "A processar…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Avisa antes de sair com alterações por guardar (fecho do separador). */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
