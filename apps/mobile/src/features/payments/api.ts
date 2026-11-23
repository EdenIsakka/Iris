import { paymentsService } from '@finanzas/db';
import type { SavePaymentInput } from '@finanzas/shared';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { askReminderPermission, scheduleReminders } from './reminders';

const payments = paymentsService(db);

export const paymentKeys = { all: ['payments'] as const };

export function usePayments() {
  return useQuery({ queryKey: paymentKeys.all, queryFn: () => payments.list() });
}

export type Payment = ReturnType<typeof payments.list>[number];

/**
 * Lo que queda tras cada pago depende de saldos, movimientos y billeteras: después de cualquier
 * cambio guardado en la app se recalcula la lista y se reprograman los avisos. Se llama una vez.
 */
export function watchPayments(queryClient: QueryClient) {
  // En fila: dos reprogramaciones a la vez dejarían avisos repetidos.
  let queue = Promise.resolve();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    queue = queue.then(() => scheduleReminders(payments.list())).catch(() => {});
  };
  refresh();
  return queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'success') refresh();
  });
}

const INVALID = 'La billetera o la categoría ya no existen. Elige otra.';

/** Crea el pago o, con `id`, lo edita. La primera vez pide permiso para avisar. */
export function useSavePayment(id?: string) {
  return useMutation({
    mutationFn: async (input: SavePaymentInput) => {
      const row = id ? payments.update(id, input) : payments.create(input);
      if (!row) throw new Error(INVALID);
      await askReminderPermission().catch(() => false);
    },
  });
}

export function useDeletePayment() {
  return useMutation({
    mutationFn: async (id: string) => {
      if (!payments.remove(id)) throw new Error('Este pago ya no existe.');
    },
  });
}

/** Lo registra como gasto de hoy: también cambian movimientos y saldos. */
export function usePayPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!payments.pay(id)) throw new Error('Este pago ya no existe.');
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
