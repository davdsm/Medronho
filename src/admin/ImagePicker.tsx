import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import { Button, ErrorBox, Spinner } from "./ui";

export type UploadItem = {
  id: number;
  url: string;
  originalName: string;
  mime: string;
  size: number;
  createdAt: string;
  usedBy: number;
};

export const SITE_PHOTOS = [
  { url: "/photos/branch.jpg", label: "Ramo" },
  { url: "/photos/hillside.jpg", label: "Encosta" },
  { url: "/photos/harvest.jpg", label: "Colheita" },
  { url: "/photos/basket.jpg", label: "Cesto" },
  { url: "/photos/jar.jpg", label: "Frasco" },
  { url: "/photos/plate.jpg", label: "Prato" },
];

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Envia uma imagem para o servidor. */
export async function uploadImage(file: File): Promise<UploadItem> {
  const fd = new FormData();
  fd.append("file", file);
  const { upload } = await api<{ upload: UploadItem }>("POST", "/admin/uploads", fd);
  return upload;
}

export function ImagePicker({ value, onChange, error }: { value: string; onChange: (url: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-semibold text-ink">Imagem</span>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-ink/20 bg-white p-3">
        {value ? <img src={value} alt="" className="h-24 w-36 rounded-md object-cover" /> : <div className="h-24 w-36 rounded-md bg-beige" />}
        <div className="grid gap-2">
          <code className="text-xs text-ink-soft">{value || "nenhuma imagem"}</code>
          <Button tone="secondary" small onClick={() => setOpen(true)}>
            Escolher ou carregar imagem
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-berry">
          {error}
        </p>
      ) : null}
      {open ? (
        <PickerDialog
          current={value}
          onClose={() => setOpen(false)}
          onPick={(url) => {
            onChange(url);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function PickerDialog({ current, onPick, onClose }: { current: string; onPick: (url: string) => void; onClose: () => void }) {
  const [uploads, setUploads] = useState<UploadItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api<{ uploads: UploadItem[] }>("GET", "/admin/uploads")
      .then((r) => setUploads(r.uploads))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Erro ao carregar imagens."));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const up = await uploadImage(file);
      onPick(up.url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível carregar a imagem.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const tile = (url: string, label: string) => (
    <li key={url}>
      <button
        type="button"
        onClick={() => onPick(url)}
        aria-pressed={url === current}
        className={`group block w-full overflow-hidden rounded-lg text-left ring-2 transition ${url === current ? "ring-wine" : "ring-transparent hover:ring-ink/30"}`}
      >
        <img src={url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
        <span className="block truncate bg-beige px-2 py-1 text-xs text-ink-soft">{label}</span>
      </button>
    </li>
  );

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Escolher imagem" className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl tracking-tight">Escolher imagem</h2>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void onFile(e.target.files?.[0])} data-testid="picker-file" />
            <Button onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? "A carregar…" : "Carregar nova imagem"}
            </Button>
            <Button tone="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-soft">JPEG, PNG ou WebP, até 8 MB.</p>
        {error ? (
          <div className="mt-3">
            <ErrorBox>{error}</ErrorBox>
          </div>
        ) : null}
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-ink-soft">Carregadas por si</h3>
        {!uploads && !error ? <Spinner /> : null}
        {uploads && uploads.length === 0 ? <p className="mt-2 text-ink-soft">Ainda não carregou imagens.</p> : null}
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{uploads?.map((u) => tile(u.url, u.originalName))}</ul>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-ink-soft">Fotografias do site</h3>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{SITE_PHOTOS.map((p) => tile(p.url, p.label))}</ul>
      </div>
    </div>
  );
}
