// Normaliza el número de depto para que "0101", "101", "a-101" y "A101" cuenten como el mismo.
// Sin espacios ni guiones, en mayúsculas y sin ceros a la izquierda.
export function normalizarDepto(valor) {
  const d = String(valor || '').trim().replace(/[\s-]+/g, '').toUpperCase().replace(/^0+(?=.)/, '');
  return /^[A-Z0-9]{1,10}$/.test(d) ? d : null;
}
