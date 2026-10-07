import { useCallback, useEffect, useRef, useState } from "react";
import { Trash, UploadSimple } from "@phosphor-icons/react";
import { api, ApiError } from "../../lib/api";
import { formatBytes, uploadImage, type UploadItem } from "../ImagePicker";
import { useStats } from "../stats";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorBox, PageHeader, Spinner, useToast } from "../ui";

export function MediaPage() {
  const toast = useToast();
  const { refresh } = useStats();
  const [items, setItems] = useState<UploadItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<UploadItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api<{ uploads: UploadItem[] }>("GET", "/admin/uploads")
      .then((r) => setItems(r.uploads))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Erro ao carregar."));
  }, []);
  useEffect(load, [load]);

  async function onFiles(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    setBusy(true);
    let ok = 0;
    for (const file of list) {
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
    refresh();
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api("DELETE", `/admin/uploads/${toDelete.id}`);
      toast("ok", "Imagem apagada.");
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
        title="Imagens"
        intro="Imagens carregadas para usar nas notícias. Uma imagem que está a ser usada não pode ser apagada."
        actions={
          <>
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden data-testid="media-file" onChange={(e) => void onFiles(e.target.files)} />
            <Button tone="dark" onClick={() => fileRef.current?.click()} disabled={busy}>
              <UploadSimple size={16} weight="bold" aria-hidden /> {busy ? "A carregar…" : "Carregar imagens"}
            </Button>
          </>
        }
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void onFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl transition-colors ${dragging ? "bg-blue-50 ring-2 ring-blue-500 ring-dashed" : ""}`}
      >
        {error ? <ErrorBox>{error}</ErrorBox> : null}
        {!items && !error ? <Spinner /> : null}
        {items && items.length === 0 ? (
          <EmptyState title="Ainda não carregou imagens." action={<Button tone="secondary" onClick={() => fileRef.current?.click()}>Carregar imagens</Button>}>
            Arraste ficheiros para aqui ou use o botão. JPEG, PNG ou WebP, até 8 MB cada.
          </EmptyState>
        ) : null}
        {items && items.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" data-testid="media-list">
            {items.map((u) => (
              <li key={u.id} className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
                <img src={u.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <div className="grid gap-2 p-3">
                  <p className="truncate text-sm font-medium text-zinc-900" title={u.originalName}>
                    {u.originalName}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{formatBytes(u.size)}</span>
                    {u.usedBy ? <Badge tone="green">Em uso ({u.usedBy})</Badge> : <Badge tone="gray">Sem uso</Badge>}
                    <button
                      type="button"
                      aria-label={`Apagar ${u.originalName}`}
                      title={u.usedBy ? "Em uso numa notícia" : "Apagar"}
                      disabled={u.usedBy > 0}
                      onClick={() => setToDelete(u)}
                      className="ml-auto inline-grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
                    >
                      <Trash size={16} aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
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
