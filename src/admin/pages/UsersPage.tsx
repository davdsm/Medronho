import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { api, ApiError } from "../../lib/api";
import { formatDate } from "../../lib/types";
import { useAuth, type AdminUser } from "../auth";
import { useStats } from "../stats";
import { Badge, Button, ConfirmDialog, ErrorBox, IconButton, Modal, PageHeader, Select, Spinner, TextInput, initials, useToast } from "../ui";

type Editing = { mode: "new" } | { mode: "edit"; user: AdminUser };

export function UsersPage() {
  const toast = useToast();
  const { user: me, refresh: refreshMe } = useAuth();
  const { refresh } = useStats();
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
      refresh();
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível apagar.");
    }
    setToDelete(null);
  }

  return (
    <>
      <PageHeader
        title="Utilizadores"
        intro="Quem pode entrar no backoffice. Administradores gerem tudo, incluindo utilizadores; editores gerem notícias, textos e imagens."
        actions={
          <Button tone="dark" onClick={() => setEditing({ mode: "new" })}>
            <Plus size={16} weight="bold" aria-hidden /> Novo utilizador
          </Button>
        }
      />
      {error ? <ErrorBox>{error}</ErrorBox> : null}
      {!users && !error ? <Spinner /> : null}
      {users ? (
        <section className="rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
          <div className="hidden grid-cols-[minmax(0,1fr)_9rem_8rem_5rem] gap-4 border-b border-zinc-100 px-6 py-3 text-sm text-zinc-500 md:grid">
            <span>Nome</span>
            <span>Função</span>
            <span>Desde</span>
            <span className="text-right">Ações</span>
          </div>
          <ul data-testid="users-list">
            {users.map((u) => (
              <li key={u.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-zinc-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_9rem_8rem_5rem] md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-[13px] font-semibold text-zinc-700">{initials(u.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {u.name} {u.id === me?.id ? <span className="font-normal text-zinc-400">(você)</span> : null}
                    </p>
                    <p className="truncate text-[13px] text-zinc-500">{u.email}</p>
                  </div>
                </div>
                <div className="col-start-1 row-start-2 pl-12 md:col-start-auto md:row-start-auto md:pl-0">
                  <Badge tone={u.role === "admin" ? "blue" : "gray"}>{u.role === "admin" ? "Administrador" : "Editor"}</Badge>
                </div>
                <span className="hidden text-sm text-zinc-500 md:block">{u.createdAt ? formatDate(u.createdAt.slice(0, 10)) : ""}</span>
                <div className="row-span-2 flex justify-end md:row-span-1">
                  <IconButton label={`Editar ${u.name}`} onClick={() => setEditing({ mode: "edit", user: u })}>
                    <PencilSimple size={18} aria-hidden />
                  </IconButton>
                  <IconButton label={u.id === me?.id ? "Não pode apagar a sua própria conta" : `Apagar ${u.name}`} disabled={u.id === me?.id} onClick={() => setToDelete(u)} className="hover:!bg-red-50 hover:!text-red-600">
                    <Trash size={18} aria-hidden />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {editing ? (
        <UserDialog
          editing={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
            refresh();
            void refreshMe();
          }}
        />
      ) : null}
      {toDelete ? (
        <ConfirmDialog
          title="Apagar utilizador?"
          danger
          confirmLabel="Apagar"
          message={`${toDelete.name} (${toDelete.email}) deixa de poder entrar no backoffice.`}
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
        setFormError(err.fields && Object.keys(err.fields).length ? "Corrija os campos assinalados." : err.message);
      } else setFormError("Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal label={isNew ? "Novo utilizador" : "Editar utilizador"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="grid gap-5">
        <h2 className="text-lg font-semibold">{isNew ? "Novo utilizador" : "Editar utilizador"}</h2>
        {formError ? <ErrorBox>{formError}</ErrorBox> : null}
        <TextInput label="Email" type="email" value={email} disabled={!isNew} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="off" />
        <TextInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Select label="Função" value={role} onChange={(e) => setRole(e.target.value as "admin" | "editor")} error={errors.role}>
          <option value="editor">Editor: notícias, textos e imagens</option>
          <option value="admin">Administrador: tudo, incluindo utilizadores</option>
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
        <div className="flex justify-end gap-2 pt-1">
          <Button tone="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "A guardar…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
