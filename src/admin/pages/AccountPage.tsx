import { useState, type FormEvent } from "react";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../auth";
import { Badge, Button, Card, ErrorBox, PageHeader, TextInput, initials, useToast } from "../ui";

export function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    if (next.length < 10) {
      setErrors({ newPassword: "A palavra-passe deve ter pelo menos 10 caracteres." });
      return;
    }
    if (next !== again) {
      setErrors({ again: "As palavras-passe não coincidem." });
      return;
    }
    setBusy(true);
    try {
      await api("POST", "/auth/password", { currentPassword: current, newPassword: next });
      toast("ok", "Palavra-passe alterada. As outras sessões foram terminadas.");
      setCurrent("");
      setNext("");
      setAgain("");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ ...(err.fields ?? {}) });
        setFormError(err.fields && Object.keys(err.fields).length ? null : err.message);
      } else setFormError("Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="A minha conta" />
      <div className="grid max-w-3xl gap-6">
        <Card title="Perfil">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-zinc-900 text-lg font-semibold text-white">{initials(user?.name ?? "")}</span>
            <div className="min-w-0 flex-1 basis-40">
              <p className="truncate font-medium text-zinc-900">{user?.name}</p>
              <p className="truncate text-sm text-zinc-500">{user?.email}</p>
            </div>
            <div>
              <Badge tone={user?.role === "admin" ? "blue" : "gray"}>{user?.role === "admin" ? "Administrador" : "Editor"}</Badge>
            </div>
          </div>
        </Card>
        <Card title="Alterar palavra-passe" description="Ao alterar, as sessões abertas noutros dispositivos são terminadas.">
          <form onSubmit={submit} className="grid gap-6" noValidate>
            {formError ? <ErrorBox>{formError}</ErrorBox> : null}
            <TextInput label="Palavra-passe atual" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.currentPassword} />
            <div className="grid gap-6 md:grid-cols-2">
              <TextInput label="Nova palavra-passe" type="password" autoComplete="new-password" help="Mínimo de 10 caracteres." value={next} onChange={(e) => setNext(e.target.value)} error={errors.newPassword} />
              <TextInput label="Repetir nova palavra-passe" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} error={errors.again} />
            </div>
            <div>
              <Button type="submit" disabled={busy || !current || !next || !again}>
                {busy ? "A guardar…" : "Alterar palavra-passe"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
