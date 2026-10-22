# Mini gym Torre A: registro de apoyo

Sitio de una sola página para que los vecinos de la Torre A (Torre Océano, Condominio Panorámico, 164 departamentos) registren si apoyan convertir la **sala de eventos norte** en un mini gym. Se necesitan **110 departamentos** para pedir la asamblea. Lo administra Daniel, presidente del comité de la Torre A.

Idioma de la interfaz, los mensajes y los comentarios: español.

## Cómo funciona

- Cada vecino ingresa nombre, número de departamento y Sí/No. **Un registro por departamento**: si el mismo depto vuelve a responder, se reemplaza su respuesta anterior.
- El avance público muestra solo totales (sí, no, sin responder). Los nombres solo los ve el comité mediante `/api/lista`.
- El contador es una barra olímpica: 5 pares de discos, cada uno equivale a 22 departamentos (5 × 22 = 110). El disco en curso se llena de abajo hacia arriba.

## Estructura

```
index.html        Página completa (HTML, CSS y JS en un solo archivo, sin build)
api/votar.js      POST {nombre, depto, apoyo:boolean}. Guarda o actualiza la respuesta
api/resumen.js    GET. Devuelve {si, no}. Es público y no lee contenido, solo cuenta archivos
api/lista.js      GET ?clave=<ADMIN_KEY>. Devuelve CSV con depto, nombre, apoyo, actualizado
package.json      Solo depende de @vercel/blob ("type": "module")
```

## Almacenamiento

Vercel Blob privado, store `minigym-votos`, conectado al proyecto de Vercel. Cada respuesta es un archivo:

- `votos/<DEPTO>--si.json` o `votos/<DEPTO>--no.json`
- Contenido: `{ depto, nombre, apoyo, actualizado }`
- `votar.js` escribe el archivo nuevo y borra el del voto contrario del mismo depto.
- `resumen.js` cuenta por el sufijo del nombre del archivo (`--si.json`, `--no.json`), por eso no necesita leer cada archivo.
- El depto se normaliza (`api/_depto.js`): sin espacios ni guiones, en mayúsculas y sin ceros a la izquierda. Solo se aceptan los 164 deptos de `api/_deptos.js` (piso x 100 + unidad, tomados de la lista de asistencia de la asamblea del 26-sep-2026).

## Vercel

- Equipo: `daniels-projects-f47730b3` (id `team_44zfh8JpaxAyRoCoD2Kuyb6A`)
- Proyecto: `minigym-torre-a` (id `prj_rBtecufiCYbFQnfkKMFqL1i8Jglb`), sin framework
- URL de producción: https://minigym-torre-a.vercel.app
- Variables de entorno: `BLOB_READ_WRITE_TOKEN` (la agrega la conexión del Blob) y `ADMIN_KEY` (clave de `/api/lista`; es tipo sensitive, no se puede leer desde Vercel ni debe escribirse en este repositorio).
- La protección de Vercel Auth está desactivada a propósito, porque los vecinos deben abrir la página sin cuenta.
- El proyecto **no está conectado a Git**. Las publicaciones se hicieron subiendo los archivos directamente. Para publicar desde aquí: `vercel deploy --prod`, o conectar este repositorio al proyecto desde el panel de Vercel.

## Diseño

- Tema de gimnasio: portada amarilla, bordes gruesos de 3 px con sombra dura, sin degradados.
- Paleta: iron `#20262E`, yellow `#F2C230`, chalk `#E8EAEC`, paper `#F7F8F9`, red `#C62B22`, blue `#1F58C9`, green `#187A41`. Los colores de los discos siguen los de discos de gimnasio.
- Tipografía: Big Shoulders Display (títulos y números) y Barlow (texto), desde Google Fonts, con fuentes de respaldo.
- El avance se anima solo si el visitante no pidió movimiento reducido.
- Constantes en el script de `index.html`: `META = 110`, `TOTAL = 164`, `PARES = 5`.

## Estado y pendientes

- Verificado: la página carga, `/api/resumen` responde `{"si":0,"no":0}` y `/api/lista` con la clave devuelve el encabezado del CSV.
- **No probado con datos reales**: enviar un voto (`/api/votar`) y la lectura de nombres en `/api/lista` (usa `get` de `@vercel/blob` con `access: 'private'`). Conviene hacer un voto de prueba y revisar la lista; si `get` falla en la versión instalada, usar `fetch` al `url` del blob con el token como Bearer.
- No se verifica la identidad de quien responde: cualquiera con el link puede escribir cualquier depto. El comité debe cotejar la lista con el registro de copropietarios antes de la asamblea.
- Ideas pendientes: limitar envíos por IP, un dominio propio, y mostrar el recuento también por piso o nivel si el comité lo pide.
