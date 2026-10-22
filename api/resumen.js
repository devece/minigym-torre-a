import { list } from '@vercel/blob';
import { DEPTOS } from './_deptos.js';

// Totales públicos (sin nombres): cuenta archivos por sufijo, sin leer su contenido.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const si = new Set(), no = new Set();
    let cursor;
    do {
      const page = await list({ prefix: 'votos/', limit: 1000, cursor });
      for (const b of page.blobs) {
        const m = b.pathname.match(/^votos\/(.+)--(si|no)\.json$/);
        if (m && DEPTOS.has(m[1])) (m[2] === 'si' ? si : no).add(m[1]);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    // Un depto cuenta una sola vez: si quedaron ambos archivos (fallo o envío simultáneo), se cuenta como "no".
    for (const d of no) si.delete(d);
    return res.status(200).json({ si: si.size, no: no.size });
  } catch (e) {
    console.error('resumen', e);
    return res.status(500).json({ error: 'no disponible' });
  }
}
