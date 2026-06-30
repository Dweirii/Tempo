"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X, Loader2, Download } from "lucide-react";
import { usePlanner } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AssetGallery({ itemId }: { itemId: string }) {
  const { assets, uploadAsset, deleteAsset } = usePlanner();
  const items = assets.filter((a) => a.contentItemId === itemId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const f of files) {
        if (f.type.startsWith("image/")) await uploadAsset(itemId, f);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="eyebrow">Assets</span>
      <div className="grid grid-cols-3 gap-2">
        {items.map((a) => (
          <div
            key={a.id}
            className="group relative aspect-square overflow-hidden rounded-lg border-2 border-ink bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.url}
              alt={a.filename}
              className="size-full object-cover"
            />
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open full size"
              className="absolute left-1 top-1 grid size-6 place-items-center rounded-md border-2 border-ink bg-white opacity-0 shadow-hard-sm transition-opacity group-hover:opacity-100"
            >
              <Download className="size-3.5" />
            </a>
            <button
              onClick={() => deleteAsset(a.id)}
              aria-label="Delete asset"
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-md border-2 border-ink bg-white opacity-0 shadow-hard-sm transition-opacity group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "grid aspect-square place-items-center rounded-lg border-2 border-dashed border-ink/40 bg-white text-muted transition-colors hover:border-ink hover:text-ink",
            busy && "opacity-60",
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
        </button>
      </div>
      {error ? (
        <span className="text-xs font-semibold text-[#d33]">{error}</span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />
    </div>
  );
}
