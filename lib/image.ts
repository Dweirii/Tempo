// Client-side image downscale: keeps uploads small enough for a server action
// and the DB. Re-encodes to JPEG at a capped dimension.

export interface DownscaledImage {
  filename: string;
  mimeType: string;
  dataBase64: string;
  width: number;
  height: number;
}

export async function downscaleImage(
  file: File,
  maxDim = 1024,
): Promise<DownscaledImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const mimeType = "image/jpeg";
  const dataUrl = canvas.toDataURL(mimeType, 0.82);
  const dataBase64 = dataUrl.split(",")[1] ?? "";
  const filename = file.name.replace(/\.[^.]+$/, "") + ".jpg";

  return { filename, mimeType, dataBase64, width, height };
}
