import { list, get } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

// Lista completa para el comité (CSV). Requiere ?clave=<ADMIN_KEY>
function claveOk(recibida) {
  const esperada = process.env.ADMIN_KEY || '';
  if (!esperada || typeof recibida !== 'string') return false;
  const a = Buffer.from(recibida), b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

const csv = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.ADMIN_KEY) return res.status(503).send('Falta configurar ADMIN_KEY');
  if (!claveOk(req.query?.clave)) return res.status(401).send('No autorizado');

  try {
    const blobs = [];
    let cursor;
    do {
      const page = await list({ prefix: 'votos/', limit: 1000, cursor });
      blobs.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    const filas = [];
    for (const b of blobs) {
      try {
        const r = await get(b.pathname, { access: 'private' });
        const d = JSON.parse(await new Response(r.stream).text());
        filas.push(d);
      } catch (e) {
        console.error('lectura', b.pathname, e);
      }
    }
    // Un solo registro por depto: si hay dos, queda el más reciente.
    const porDepto = new Map();
    for (const f of filas) {
      const previo = porDepto.get(f.depto);
      if (!previo || String(f.actualizado) > String(previo.actualizado)) porDepto.set(f.depto, f);
    }
    filas.length = 0;
    filas.push(...porDepto.values());
    filas.sort((x, y) => String(x.depto).localeCompare(String(y.depto), 'es', { numeric: true }));

    const out = ['depto,nombre,apoyo,actualizado']
      .concat(filas.map(f => [csv(f.depto), csv(f.nombre), csv(f.apoyo ? 'SI' : 'NO'), csv(f.actualizado)].join(',')))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="apoyo-minigym-torre-a.csv"');
    return res.status(200).send('﻿' + out);
  } catch (e) {
    console.error('lista', e);
    return res.status(500).send('Error al leer los votos');
  }
}
