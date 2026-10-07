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
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { CaretDown, CheckCircle, WarningCircle, X } from "@phosphor-icons/react";

type Tone = "primary" | "secondary" | "dark" | "danger" | "ghost";

const toneClass: Record<Tone, string> = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:hover:bg-blue-600",
  secondary: "bg-white text-zinc-900 border border-zinc-200 shadow-sm hover:bg-zinc-50 disabled:hover:bg-white",
  dark: "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:hover:bg-red-600",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
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
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        small ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm"
      } ${toneClass[tone]} ${className}`}
    />
  );
}

/** Botão quadrado só com ícone (com rótulo acessível obrigatório). */
export function IconButton({
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent ${className}`}
    />
  );
}

export const inputClass =
  "block h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-[15px] text-zinc-900 shadow-[0_1px_2px_rgb(0_0_0/0.04)] placeholder:text-zinc-400 transition-colors hover:border-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-50 disabled:text-zinc-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/10";

export function Field({
  label,
  help,
  error,
  children,
  htmlFor,
  counter,
}: {
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  counter?: string;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm text-zinc-500">
          {label}
        </label>
        {counter ? <span className="text-xs text-zinc-400 tabular-nums">{counter}</span> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-[13px] text-red-600">
          <WarningCircle size={14} weight="bold" aria-hidden />
          {error}
        </p>
      ) : help ? (
        <p className="text-[13px] text-zinc-500">{help}</p>
      ) : null}
    </div>
  );
}

const count = (v: unknown, max?: number) => (max ? `${String(v ?? "").length} / ${max}` : undefined);

export function TextInput({
  label,
  help,
  error,
  showCount,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string; error?: string; showCount?: boolean }) {
  const id = useId();
  return (
    <Field label={label} help={help} error={error} htmlFor={id} counter={showCount ? count(props.value, props.maxLength) : undefined}>
      <input id={id} {...props} aria-invalid={error ? true : undefined} className={inputClass} />
    </Field>
  );
}

export function TextArea({
  label,
  help,
  error,
  showCount,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; help?: string; error?: string; showCount?: boolean }) {
  const id = useId();
  return (
    <Field label={label} help={help} error={error} htmlFor={id} counter={showCount ? count(props.value, props.maxLength) : undefined}>
      <textarea id={id} {...props} aria-invalid={error ? true : undefined} className={`${inputClass} h-auto min-h-24 py-2.5 leading-relaxed`} />
    </Field>
  );
}

export function Select({
  label,
  help,
  error,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; help?: string; error?: string }) {
  const id = useId();
  return (
    <Field label={label} help={help} error={error} htmlFor={id}>
      <div className="relative">
        <select id={id} {...props} className={`${inputClass} appearance-none pr-12`}>
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-2 right-0 flex items-center border-l border-zinc-200 px-3 text-zinc-600">
          <CaretDown size={16} weight="bold" aria-hidden />
        </span>
      </div>
    </Field>
  );
}

export function Card({ children, className = "", id, title, actions, description }: { children: ReactNode; className?: string; id?: string; title?: ReactNode; actions?: ReactNode; description?: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-[0_1px_3px_rgb(0_0_0/0.04)] md:p-8 ${className}`}>
      {title ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h2>
            {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function PageHeader({ title, intro, actions, meta }: { title: ReactNode; intro?: ReactNode; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-zinc-900 md:text-[2rem]">{title}</h1>
      {intro ? <p className="mt-2 max-w-[62ch] text-[15px] text-zinc-500">{intro}</p> : null}
      {actions || meta ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {actions}
          {meta ? <div className="ml-auto text-sm text-zinc-500">{meta}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

const badgeTone = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  gray: "bg-zinc-100 text-zinc-600 ring-zinc-500/15",
  red: "bg-red-50 text-red-700 ring-red-600/15",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
} as const;

export function Badge({ tone, children, dot }: { tone: keyof typeof badgeTone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${badgeTone[tone]}`}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function Spinner({ label = "A carregar…" }: { label?: string }) {
  return (
    <div role="status" className="grid gap-3 py-2" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-200/60" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <WarningCircle size={18} weight="bold" className="mt-px shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center">
      <p className="font-medium text-zinc-900">{title}</p>
      {children ? <p className="mx-auto mt-1 max-w-[42ch] text-sm text-zinc-500">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Navegação lateral «nesta página» (como no modelo), destacando a secção visível. */
export function SectionNav({ items }: { items: Array<{ id: string; label: string; flag?: boolean }> }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);
  return (
    <nav aria-label="Nesta página" className="sticky top-24 hidden w-44 shrink-0 self-start xl:block">
      <ul className="grid gap-1">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(i.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                setActive(i.id);
              }}
              className={`flex items-center gap-2 rounded-md py-1.5 text-[15px] transition-colors ${active === i.id ? "font-medium text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {i.label}
              {i.flag ? <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-label="(alterações por guardar)" /> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Barra fixa no fundo quando há alterações por guardar. */
export function SaveBar({ visible, busy, onSave, onDiscard, label = "Tem alterações por guardar." }: { visible: boolean; busy?: boolean; onSave: () => void; onDiscard: () => void; label?: string }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:pl-72">
      <div role="region" aria-label="Alterações por guardar" className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-xl bg-zinc-900 py-2.5 pr-2.5 pl-4 text-sm text-white shadow-xl">
        <span className="flex-1">{label}</span>
        <Button tone="ghost" small className="!text-zinc-300 hover:!bg-white/10 hover:!text-white" onClick={onDiscard} disabled={busy}>
          Descartar
        </Button>
        <Button small onClick={onSave} disabled={busy}>
          {busy ? "A guardar…" : "Guardar alterações"}
        </Button>
      </div>
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
  const dismiss = (id: number) => setItems((cur) => cur.filter((t) => t.id !== id));
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++counter.current;
    setItems((cur) => [...cur, { id, kind, text }]);
    window.setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 text-sm text-zinc-900 shadow-lg"
          >
            {t.kind === "error" ? (
              <WarningCircle size={20} weight="fill" className="shrink-0 text-red-600" aria-hidden />
            ) : (
              <CheckCircle size={20} weight="fill" className="shrink-0 text-emerald-600" aria-hidden />
            )}
            <span className="flex-1 pt-px">{t.text}</span>
            <button type="button" aria-label="Fechar aviso" onClick={() => dismiss(t.id)} className="text-zinc-400 hover:text-zinc-700">
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Diálogos ---------- */
export function Modal({ label, children, onClose, wide }: { label: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>("[data-autofocus], input, select, textarea, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-zinc-900/40 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className={`max-h-[90dvh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${wide ? "max-w-3xl" : "max-w-md"}`}>
        {children}
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-40 grid place-items-center bg-zinc-900/40 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="dlg-title" className="text-lg font-semibold text-zinc-900">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-zinc-600">{message}</div>
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

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]![0] : "")).toUpperCase() || "?";
}
