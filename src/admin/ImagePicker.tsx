import { useCallback, useEffect, useRef, useState } from "react";
import { ImageSquare, UploadSimple } from "@phosphor-icons/react";
import { api, ApiError } from "../lib/api";
import { Button, ErrorBox, Modal, Spinner } from "./ui";

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
      <span className="text-sm text-zinc-500">Imagem principal</span>
      <div className={`flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center ${error ? "border-red-400" : "border-zinc-200"}`}>
        {value ? (
          <img src={value} alt="" className="aspect-[4/3] w-full rounded-lg object-cover sm:w-44" />
        ) : (
          <div className="grid aspect-[4/3] w-full place-items-center rounded-lg bg-zinc-100 text-zinc-400 sm:w-44">
            <ImageSquare size={32} aria-hidden />
          </div>
        )}
        <div className="grid min-w-0 gap-2">
          <p className="truncate text-sm text-zinc-500">{value ? value.split("/").pop() : "Nenhuma imagem escolhida."}</p>
          <div>
            <Button tone="secondary" small onClick={() => setOpen(true)}>
              {value ? "Trocar imagem" : "Escolher ou carregar imagem"}
            </Button>
          </div>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-red-600">
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
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api<{ uploads: UploadItem[] }>("GET", "/admin/uploads")
      .then((r) => setUploads(r.uploads))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Erro ao carregar imagens."));
  }, []);
  useEffect(load, [load]);

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
        className={`block w-full overflow-hidden rounded-lg text-left ring-2 transition ${url === current ? "ring-blue-600" : "ring-transparent hover:ring-zinc-300"}`}
      >
        <img src={url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
        <span className="block truncate bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600">{label}</span>
      </button>
    </li>
  );

  return (
    <Modal label="Escolher imagem" onClose={onClose} wide>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Escolher imagem</h2>
        <Button tone="ghost" small onClick={onClose}>
          Fechar
        </Button>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void onFile(e.dataTransfer.files?.[0]);
        }}
        className={`mt-4 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-zinc-200"}`}
      >
        <UploadSimple size={24} className="text-zinc-400" aria-hidden />
        <p className="text-sm text-zinc-600">Arraste uma imagem para aqui ou</p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void onFile(e.target.files?.[0])} data-testid="picker-file" />
        <Button tone="secondary" small onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "A carregar…" : "Escolher ficheiro"}
        </Button>
        <p className="text-xs text-zinc-400">JPEG, PNG ou WebP, até 8 MB.</p>
      </div>
      {error ? (
        <div className="mt-3">
          <ErrorBox>{error}</ErrorBox>
        </div>
      ) : null}
      <h3 className="mt-6 text-xs font-semibold tracking-[0.08em] text-zinc-400 uppercase">Carregadas</h3>
      {!uploads && !error ? <Spinner /> : null}
      {uploads && uploads.length === 0 ? <p className="mt-2 text-sm text-zinc-500">Ainda não carregou imagens.</p> : null}
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{uploads?.map((u) => tile(u.url, u.originalName))}</ul>
      <h3 className="mt-6 text-xs font-semibold tracking-[0.08em] text-zinc-400 uppercase">Fotografias do site</h3>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{SITE_PHOTOS.map((p) => tile(p.url, p.label))}</ul>
    </Modal>
  );
}
