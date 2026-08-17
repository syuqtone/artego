import { createHash } from "node:crypto";

// Server-only. Signed uploads keep the API secret off the browser
// (CLAUDE.md rule 10: API keys never reach the browser).
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export async function uploadToCloudinary(
  bytes: Buffer,
  folder: string,
  filename: string,
  contentType: string,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signs the exact params sent (minus file/api_key/signature),
  // sorted alphabetically by key.
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(paramsToSign + API_SECRET).digest("hex");

  const form = new FormData();
  form.append("file", new File([new Uint8Array(bytes)], filename, { type: contentType }));
  form.append("api_key", API_KEY);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { public_id: string };
  return data.public_id;
}

// image-rules.md derivative set. f_auto/q_auto lets Cloudinary pick WebP
// for browsers that support it, with an automatic fallback otherwise —
// "Deliver WebP with a JPG fallback."
export const DERIVATIVE_SIZES = [
  { role: "display_2000", width: 2000 },
  { role: "display_1200", width: 1200 },
  { role: "card_600", width: 600 },
  { role: "thumbnail_300", width: 300 },
] as const;

export function cloudinaryDerivativeUrl(publicId: string, width: number): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},c_limit,f_auto,q_auto/${publicId}`;
}
