// ─────────────────────────────────────────────────────────────────
// SERVER-SIDE IMAGE FETCH → DATA URI (cached)
// Satori embeds these directly. Fetching server-side means no browser
// CORS-tainting, no toDataURL throw, and transparency is preserved
// natively — the failure mode that broke every prior version.
// ─────────────────────────────────────────────────────────────────

const cache = new Map(); // url -> dataUri | null

export async function fetchAsDataUri(url) {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const type = res.headers.get('content-type') || 'image/png';
    const buf = Buffer.from(await res.arrayBuffer());
    const dataUri = `data:${type};base64,${buf.toString('base64')}`;
    cache.set(url, dataUri);
    return dataUri;
  } catch (e) {
    // Fail soft → templates fall back to a clean wordmark, never a broken
    // image and never an "invented" logo.
    console.warn(`logo/image fetch failed (${url}): ${e.message}`);
    cache.set(url, null);
    return null;
  }
}
