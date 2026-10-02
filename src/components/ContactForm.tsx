import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent";
type Errors = {
  name?: string;
  email?: string;
  message?: string;
};

const fieldClass =
  "w-full rounded-[1.25rem] border border-foam/30 bg-foam px-4 py-3 text-ink outline-none placeholder:text-ink-soft focus-visible:border-berry";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const next: Errors = {};
    if (!name) next.name = "Falta o nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Esse email não parece certo.";
    if (!message) next.message = "Escreve a mensagem.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="max-w-[36ch] font-display text-3xl leading-[1.15] tracking-[-0.03em] text-butter" role="status">
        Recebemos a mensagem. Respondemos em dois dias úteis.
      </p>
    );
  }

  return (
    <form className="grid max-w-xl gap-5" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Nome
        </label>
        <input id="name" name="name" autoComplete="name" className={fieldClass} aria-invalid={Boolean(errors.name)} />
        {errors.name ? (
          <p className="mt-2 text-sm text-blush" role="alert">
            {errors.name}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          className={fieldClass}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? (
          <p className="mt-2 text-sm text-blush" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="org" className="mb-2 block text-sm font-medium">
          Casa ou organização
        </label>
        <input id="org" name="org" autoComplete="organization" className={fieldClass} />
        <p className="mt-2 text-sm text-foam-soft">Se quiseres, diz de que casa ou empresa és.</p>
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium">
          Mensagem
        </label>
        <textarea id="message" name="message" rows={5} className={fieldClass} aria-invalid={Boolean(errors.message)} />
        {errors.message ? (
          <p className="mt-2 text-sm text-blush" role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-fit rounded-full bg-butter px-6 py-3 font-semibold text-ink transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-70"
      >
        {status === "sending" ? "A enviar" : "Enviar"}
      </button>
    </form>
  );
}
