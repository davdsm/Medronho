import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { formatBytes, uploadImage, type UploadItem } from "../ImagePicker";
import { Button, Card, ConfirmDialog, ErrorBox, PageHeader, Spinner, useToast } from "../ui";

export function MediaPage() {
  const toast = useToast();
  const [items, setItems] = useState<UploadItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<UploadItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api<{ uploads: UploadItem[] }>("GET", "/admin/uploads")
      .then((r) => setItems(r.uploads))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Erro ao carregar."));
  }, []);
  useEffect(load, [load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadImage(file);
        ok++;
      } catch (e) {
        toast("error", `${file.name}: ${e instanceof ApiError ? e.message : "falhou o envio."}`);
      }
    }
    if (ok) toast("ok", ok === 1 ? "Imagem carregada." : `${ok} imagens carregadas.`);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api("DELETE", `/admin/uploads/${toDelete.id}`);
      toast("ok", "Imagem apagada.");
      setToDelete(null);
      load();
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível apagar.");
      setToDelete(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Imagens"
        intro="Imagens carregadas para usar nas notícias. Uma imagem em uso não pode ser apagada."
        actions={
          <>
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden data-testid="media-file" onChange={(e) => void onFiles(e.target.files)} />
            <Button onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? "A carregar…" : "Carregar imagens"}
            </Button>
          </>
        }
      />
      {error ? <ErrorBox>{error}</ErrorBox> : null}
      {!items && !error ? <Spinner /> : null}
      {items && items.length === 0 ? (
        <Card>
          <p className="text-ink-soft">Ainda não carregou imagens. JPEG, PNG ou WebP, até 8 MB cada.</p>
        </Card>
      ) : null}
      {items && items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((u) => (
            <li key={u.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/10">
              <img src={u.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="grid gap-1 p-3">
                <p className="truncate text-sm font-semibold" title={u.originalName}>
                  {u.originalName}
                </p>
                <p className="text-xs text-ink-soft">
                  {formatBytes(u.size)} · {u.usedBy ? `usada em ${u.usedBy} notícia(s)` : "sem uso"}
                </p>
                <Button tone="ghost" small className="mt-1 !justify-start !px-0 !text-berry" disabled={u.usedBy > 0} onClick={() => setToDelete(u)}>
                  Apagar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {toDelete ? (
        <ConfirmDialog
          title="Apagar imagem?"
          danger
          confirmLabel="Apagar"
          message={`«${toDelete.originalName}» será apagada definitivamente.`}
          onConfirm={() => void remove()}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
    </>
  );
}
