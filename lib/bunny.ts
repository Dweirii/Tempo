// Bunny.net storage + CDN. Uploads go to a Storage Zone (secret AccessKey,
// server-only); files are served publicly from the linked Pull Zone hostname.
//
// Env (server-only — no NEXT_PUBLIC):
//   BUNNY_STORAGE_ZONE      storage zone name
//   BUNNY_STORAGE_PASSWORD  storage zone password / AccessKey
//   BUNNY_STORAGE_REGION    region prefix: "" (DE default) | ny | la | sg | syd | uk | se | br | jh
//   BUNNY_CDN_HOSTNAME      pull-zone host, e.g. tempo-assets.b-cdn.net

const ZONE = process.env.BUNNY_STORAGE_ZONE;
const KEY = process.env.BUNNY_STORAGE_PASSWORD;
const REGION = process.env.BUNNY_STORAGE_REGION ?? "";
const CDN = process.env.BUNNY_CDN_HOSTNAME;

export const bunnyEnabled = Boolean(ZONE && KEY && CDN);

function storageHost(): string {
  return REGION ? `${REGION}.storage.bunnycdn.com` : "storage.bunnycdn.com";
}

export function bunnyPublicUrl(path: string): string {
  return `https://${CDN}/${path}`;
}

export async function uploadToBunny(
  path: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  if (!bunnyEnabled) {
    throw new Error(
      "Bunny CDN is not configured — set BUNNY_STORAGE_ZONE, BUNNY_STORAGE_PASSWORD and BUNNY_CDN_HOSTNAME",
    );
  }
  const res = await fetch(`https://${storageHost()}/${ZONE}/${path}`, {
    method: "PUT",
    headers: { AccessKey: KEY as string, "Content-Type": contentType },
    // Node's fetch accepts a Uint8Array body; cast satisfies the strict DOM type.
    body: body as BodyInit,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Bunny upload failed (${res.status}) ${detail}`.trim());
  }
  return bunnyPublicUrl(path);
}

export async function deleteFromBunny(path: string): Promise<void> {
  if (!bunnyEnabled) return;
  await fetch(`https://${storageHost()}/${ZONE}/${path}`, {
    method: "DELETE",
    headers: { AccessKey: KEY as string },
  }).catch(() => {
    // best-effort; orphaned objects can be cleaned up later
  });
}
