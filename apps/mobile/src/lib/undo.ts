import { useSyncExternalStore } from 'react';

type Pending = { message: string; undo: () => void } | null;

let pending: Pending = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const set = (next: Pending) => {
  pending = next;
  for (const l of listeners) l();
};

/** Muestra la barra "Deshacer" 5 segundos. Una nueva reemplaza a la anterior. */
export function showUndo(message: string, undo: () => void) {
  clearTimeout(timer);
  set({ message, undo });
  timer = setTimeout(() => set(null), 5000);
}

export function hideUndo() {
  clearTimeout(timer);
  set(null);
}

export const useUndo = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pending,
  );
