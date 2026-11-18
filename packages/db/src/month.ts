// shortcut: Colombia está fija en UTC−5 (sin horario de verano); pasar a zona por persona si se
// abre a otros países.
export const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Inicio (hora de Colombia) del mes que está `back` meses antes del de `now`. */
export function monthStart(now = new Date(), back = 0) {
  const local = new Date(now.getTime() - BOGOTA_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - back, 1) + BOGOTA_OFFSET_MS,
  );
}

/** 'YYYY-MM' del mes de Colombia en que cae `date`. */
export function monthKey(date: Date) {
  return new Date(date.getTime() - BOGOTA_OFFSET_MS).toISOString().slice(0, 7);
}
