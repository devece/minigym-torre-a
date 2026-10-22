import { put, del } from '@vercel/blob';

// Guarda (o actualiza) la respuesta de un departamento.
// Un archivo por depto: votos/<DEPTO>--si.json o votos/<DEPTO>--no.json
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'metodo no permitido' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  const nombre = String(b.nombre || '').trim().replace(/\s+/g, ' ');
  const depto = String(b.depto || '').trim().replace(/\s+/g, '').toUpperCase();

  if (nombre.length < 3 || nombre.length > 80) return res.status(400).json({ error: 'nombre invalido' });
  if (!/^[A-Z0-9-]{1,10}$/.test(depto)) return res.status(400).json({ error: 'depto invalido' });
  if (typeof b.apoyo !== 'boolean') return res.status(400).json({ error: 'apoyo invalido' });

  const nuevo = b.apoyo ? 'si' : 'no';
  const otro = b.apoyo ? 'no' : 'si';

  try {
    await put(
      `votos/${depto}--${nuevo}.json`,
      JSON.stringify({ depto, nombre, apoyo: b.apoyo, actualizado: new Date().toISOString() }),
      { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' }
    );
    // Si el depto había votado lo contrario, se elimina esa respuesta anterior.
    try { await del(`votos/${depto}--${otro}.json`); } catch { /* no existía */ }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('votar', e);
    return res.status(500).json({ error: 'no se pudo guardar' });
  }
}
