export function formatDate(date: Date) {
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Fecha local en AAAA-MM-DD (toISOString la pasaría a UTC y podría cambiar el día). */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
