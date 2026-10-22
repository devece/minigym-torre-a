import { list } from '@vercel/blob';

// Totales públicos (sin nombres): cuenta archivos por sufijo, sin leer su contenido.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    let si = 0, no = 0, cursor;
    do {
      const page = await list({ prefix: 'votos/', limit: 1000, cursor });
      for (const b of page.blobs) {
        if (b.pathname.endsWith('--si.json')) si++;
        else if (b.pathname.endsWith('--no.json')) no++;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return res.status(200).json({ si, no });
  } catch (e) {
    console.error('resumen', e);
    return res.status(500).json({ error: 'no disponible' });
  }
}
