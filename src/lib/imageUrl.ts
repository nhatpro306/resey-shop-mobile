import { env } from "@/config/env";

// Turn a stored image value into a loadable absolute URL.
// - Absolute http(s) URLs (mobile uploads / CDN) are used as-is.
// - Relative paths like "/products/x.jpg" come from the web app's static files;
//   prepend the web base URL (EXPO_PUBLIC_WEB_URL).
export function resolveImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return env.webUrl ? `${env.webUrl}${raw}` : raw;
  return raw;
}

// Resolve + (for Supabase Storage URLs) request a CDN-resized variant.
export function getResizedImageUrl(raw: string | null | undefined, width: number): string | null {
  const url = resolveImageUrl(raw);
  if (!url) return null;
  if (!url.includes("/storage/v1/")) return url; // transform only applies to Supabase Storage
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${width}&format=webp`;
}
