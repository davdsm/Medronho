import { useState, type FormEvent } from "react";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../auth";
import { Badge, Button, Card, ErrorBox, PageHeader, TextInput, useToast } from "../ui";

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
        setFormError(err.message);
      } else setFormError("Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="A minha conta" />
      <div className="grid max-w-xl gap-6">
        <Card>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-ink-soft">{user?.email}</p>
          <div className="mt-3">
            <Badge tone={user?.role === "admin" ? "yellow" : "gray"}>{user?.role === "admin" ? "Administrador" : "Editor"}</Badge>
          </div>
        </Card>
        <Card>
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <h2 className="font-display text-xl tracking-tight">Alterar palavra-passe</h2>
            {formError ? <ErrorBox>{formError}</ErrorBox> : null}
            <TextInput label="Palavra-passe atual" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.currentPassword} />
            <TextInput label="Nova palavra-passe" type="password" autoComplete="new-password" help="Mínimo de 10 caracteres." value={next} onChange={(e) => setNext(e.target.value)} error={errors.newPassword} />
            <TextInput label="Repetir nova palavra-passe" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} error={errors.again} />
            <div>
              <Button type="submit" disabled={busy || !current || !next}>
                {busy ? "A guardar…" : "Alterar palavra-passe"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
