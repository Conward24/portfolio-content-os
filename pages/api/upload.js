import { put } from '@vercel/blob';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return res.status(400).json({ error: 'No boundary' });

    const parts = buffer.toString('binary').split(`--${boundary}`);
    let fileBuffer, fileName, mimeType, brand = 'mylua';

    for (const part of parts) {
      if (part.includes('Content-Disposition') && part.includes('filename=')) {
        const nameMatch = part.match(/filename="([^"]+)"/);
        const typeMatch = part.match(/Content-Type: ([^\r\n]+)/);
        if (nameMatch) fileName = nameMatch[1];
        if (typeMatch) mimeType = typeMatch[1].trim();
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        if (dataStart > 4 && dataEnd > dataStart) {
          fileBuffer = Buffer.from(part.slice(dataStart, dataEnd), 'binary');
        }
      }
      if (part.includes('name="brand"')) {
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        if (dataStart > 4) brand = part.slice(dataStart, dataEnd).trim();
      }
    }

    if (!fileBuffer || !fileName) return res.status(400).json({ error: 'No file found' });

    const blob = await put(`portfolio/${brand}/${Date.now()}-${fileName}`, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: mimeType || 'image/jpeg',
    });

    const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const photo = {
      id: photoId,
      url: blob.url,
      name: fileName,
      brand,
      uploadedAt: new Date().toISOString(),
    };

    // Store each photo as its own key — avoids Redis 1MB array limit
    await redis.set(`portfolio:photo:${photoId}`, JSON.stringify(photo));

    // Also maintain an index of photo IDs (much smaller than storing full objects)
    const index = await redis.get('portfolio:photo:index') || [];
    await redis.set('portfolio:photo:index', [photoId, ...index]);

    return res.status(200).json({ photo });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: 'Upload failed', details: e.message });
  }
}
