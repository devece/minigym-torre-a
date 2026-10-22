import { list, get, put, del } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

// TEMPORAL: corrige los votos registrados con letra (310A -> 310, 607A -> 607).
// Requiere ?clave=<ADMIN_KEY>. Se ejecuta una vez y luego se elimina este archivo.
const CORRECCIONES = { '310A': '310', '607A': '607' };

function claveOk(recibida) {
  const esperada = process.env.ADMIN_KEY || '';
  if (!esperada || typeof recibida !== 'string') return false;
  const a = Buffer.from(recibida), b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.ADMIN_KEY) return res.status(503).send('Falta configurar ADMIN_KEY');
  if (!claveOk(req.query?.clave)) return res.status(401).send('No autorizado');

  const informe = [];
  try {
    for (const [viejo, nuevo] of Object.entries(CORRECCIONES)) {
      const { blobs } = await list({ prefix: `votos/${viejo}--` });
      if (!blobs.length) { informe.push(`${viejo}: no hay voto que corregir`); continue; }

      // Si el depto correcto ya tiene voto, no se pisa.
      const { blobs: existentes } = await list({ prefix: `votos/${nuevo}--` });
      if (existentes.length) { informe.push(`${viejo}: omitido, ${nuevo} ya tiene un voto`); continue; }

      for (const b of blobs) {
        const r = await get(b.pathname, { access: 'private' });
        const d = JSON.parse(await new Response(r.stream).text());
        const sufijo = b.pathname.endsWith('--no.json') ? 'no' : 'si';
        await put(
          `votos/${nuevo}--${sufijo}.json`,
          JSON.stringify({ ...d, depto: nuevo }),
          { access: 'private', allowOverwrite: false, addRandomSuffix: false, contentType: 'application/json' }
        );
        await del(b.pathname);
        informe.push(`${viejo} -> ${nuevo}: corregido (${d.nombre})`);
      }
    }
    return res.status(200).type('text/plain; charset=utf-8').send(informe.join('\n'));
  } catch (e) {
    console.error('corregir', e);
    return res.status(500).type('text/plain; charset=utf-8').send(['Error al corregir', ...informe].join('\n'));
  }
}
