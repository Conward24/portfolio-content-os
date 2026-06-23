import { ImageResponse } from '@vercel/og';
import { put } from '@vercel/blob';
import { renderTemplate } from '../../lib/templates';
import { fontsForFamily } from '../../lib/fonts';
import { tokensFor } from '../../lib/brandTokens';
import { fetchAsDataUri } from '../../lib/imageFetch';
import { PLATFORM_SIZES } from '../../lib/constants';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

// Which logo (bg-matched, transparent) each brand/template uses. Only
// brands with explicit light/dark logo files use a real logo; others
// render a clean wordmark — never a knocked-out or broken image.
function logoUrlFor(brand, template, t) {
  if (brand === 'mylua') {
    // Black logomark on cream cards; dark teal "announce" → cream wordmark.
    return template === 'announce' ? null : t.logoUrl;
  }
  if (brand === 'henway') {
    // Only a black logo exists → use it on the light "quote" card; the
    // dark cards fall back to the yellow wordmark.
    return template === 'quote' ? t.logoBlackUrl : null;
  }
  if (brand === 'blabbing') {
    return t.logoDarkUrl; // all blabbing cards are dark bg → white logo
  }
  return null; // mike → wordmark + photo
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { brand, template, platform = 'Instagram Feed', data = {}, persist = false } = req.body;
  if (!brand || !template) return res.status(400).json({ error: 'Missing brand or template' });

  const size = PLATFORM_SIZES[platform] || PLATFORM_SIZES['Instagram Feed'];
  const t = tokensFor(brand);

  try {
    // Resolve brand assets server-side into data URIs (no CORS issues).
    const [logoDataUri, photoDataUri] = await Promise.all([
      fetchAsDataUri(logoUrlFor(brand, template, t)),
      brand === 'mike' ? fetchAsDataUri(t.photoUrl) : Promise.resolve(null),
    ]);

    const element = renderTemplate({
      brand,
      template,
      width: size.w,
      height: size.h,
      data: { ...data, logoDataUri, photoDataUri },
    });

    const image = new ImageResponse(element, {
      width: size.w,
      height: size.h,
      fonts: fontsForFamily(t.font),
    });

    const png = Buffer.from(await image.arrayBuffer());

    // Preview renders return inline base64 (no Blob spam). Saved/scheduled
    // renders persist to Blob and return a permanent URL.
    if (persist && process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(
        `portfolio/graphics/${brand}-${template}-${Date.now()}.png`,
        png,
        { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN, contentType: 'image/png' }
      );
      return res.status(200).json({ image: blob.url, url: blob.url, width: size.w, height: size.h });
    }

    return res.status(200).json({
      image: `data:image/png;base64,${png.toString('base64')}`,
      width: size.w,
      height: size.h,
    });
  } catch (err) {
    console.error('Render error:', err);
    return res.status(500).json({ error: 'Render failed', details: err.message });
  }
}
