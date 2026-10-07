import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../lib/api";
import { useAuth, type AdminUser } from "../auth";
import { Badge, Button, Card, ConfirmDialog, ErrorBox, PageHeader, Select, Spinner, TextInput, useToast } from "../ui";

type Editing = { mode: "new" } | { mode: "edit"; user: AdminUser };

export function UsersPage() {
  const toast = useToast();
  const { user: me, refresh } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    api<{ users: AdminUser[] }>("GET", "/admin/users")
      .then((r) => setUsers(r.users))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Erro ao carregar."));
  }, []);
  useEffect(load, [load]);

  async function remove() {
    if (!toDelete) return;
    try {
      await api("DELETE", `/admin/users/${toDelete.id}`);
      toast("ok", "Utilizador apagado.");
      load();
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível apagar.");
    }
    setToDelete(null);
  }

  return (
    <>
      <PageHeader
        title="Utilizadores"
        intro="Quem pode entrar no backoffice. Administradores gerem também os utilizadores; editores gerem notícias, textos e imagens."
        actions={<Button onClick={() => setEditing({ mode: "new" })}>Novo utilizador</Button>}
      />
      {error ? <ErrorBox>{error}</ErrorBox> : null}
      {!users && !error ? <Spinner /> : null}
      {users ? (
        <Card className="!p-0 overflow-hidden">
          <ul>
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 border-b border-ink/10 p-4 last:border-b-0">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-semibold">
                    {u.name} {u.id === me?.id ? <span className="text-sm font-normal text-ink-soft">(você)</span> : null}
                  </p>
                  <p className="text-sm text-ink-soft">{u.email}</p>
                </div>
                <Badge tone={u.role === "admin" ? "yellow" : "gray"}>{u.role === "admin" ? "Administrador" : "Editor"}</Badge>
                <Button tone="secondary" small onClick={() => setEditing({ mode: "edit", user: u })}>
                  Editar
                </Button>
                <Button tone="ghost" small className="!text-berry" disabled={u.id === me?.id} onClick={() => setToDelete(u)}>
                  Apagar
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {editing ? (
        <UserDialog
          editing={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
            void refresh();
          }}
        />
      ) : null}
      {toDelete ? (
        <ConfirmDialog
          title="Apagar utilizador?"
          danger
          confirmLabel="Apagar"
          message={`${toDelete.name} (${toDelete.email}) deixará de poder entrar.`}
          onConfirm={() => void remove()}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
    </>
  );
}

function UserDialog({ editing, onClose, onDone }: { editing: Editing; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const isNew = editing.mode === "new";
  const base = editing.mode === "edit" ? editing.user : null;
  const [email, setEmail] = useState(base?.email ?? "");
  const [name, setName] = useState(base?.name ?? "");
  const [role, setRole] = useState<"admin" | "editor">(base?.role ?? "editor");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      if (isNew) {
        await api("POST", "/admin/users", { email, name, role, password });
        toast("ok", "Utilizador criado.");
      } else {
        await api("PUT", `/admin/users/${base!.id}`, { name, role, ...(password ? { password } : {}) });
        toast("ok", "Utilizador atualizado.");
      }
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setFormError(err.message);
      } else setFormError("Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-label={isNew ? "Novo utilizador" : "Editar utilizador"} className="grid max-h-[90dvh] w-full max-w-md gap-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-2xl tracking-tight">{isNew ? "Novo utilizador" : "Editar utilizador"}</h2>
        {formError ? <ErrorBox>{formError}</ErrorBox> : null}
        <TextInput label="Email" type="email" value={email} disabled={!isNew} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="off" />
        <TextInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Select label="Função" value={role} onChange={(e) => setRole(e.target.value as "admin" | "editor")} error={errors.role}>
          <option value="editor">Editor — notícias, textos e imagens</option>
          <option value="admin">Administrador — tudo, incluindo utilizadores</option>
        </Select>
        <TextInput
          label={isNew ? "Palavra-passe" : "Nova palavra-passe (opcional)"}
          help="Mínimo de 10 caracteres."
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button tone="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "A guardar…" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
