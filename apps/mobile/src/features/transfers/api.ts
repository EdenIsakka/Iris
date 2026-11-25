import { transfersService } from '@finanzas/db';
import type { CreateTransferInput } from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { refreshAfterTransaction, transactionKeys } from '@/features/transactions/api';
import { db } from '@/lib/db';
import { queryClient } from '@/lib/query-client';

const transfers = transfersService(db);

// Cuelgan de transactionKeys.all: crear o borrar una refresca la lista del mes y los saldos.
const transferKeys = { all: [...transactionKeys.all, 'transfers'] as const };

export type Transfer = NonNullable<ReturnType<typeof transfers.get>>;

/** Las transferencias del mes que está `back` meses atrás (0 = este mes). */
export function useMonthTransfers(back: number) {
  return useQuery({
    queryKey: [...transferKeys.all, 'month', back],
    queryFn: () => transfers.month(back),
  });
}

export function useTransfer(id: string) {
  return useQuery({ queryKey: [...transferKeys.all, id], queryFn: () => transfers.get(id) });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const row = transfers.create(input);
      if (!row) throw new Error('Una de las billeteras ya no existe, o falta cuánto llega.');
      return row;
    },
    onSuccess: () => refreshAfterTransaction(queryClient),
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!transfers.remove(id)) throw new Error('Esta transferencia ya no existe.');
    },
    onSuccess: () => refreshAfterTransaction(queryClient),
  });
}

/** Vuelve a crear una transferencia borrada (con otro id). Para el "Deshacer". */
export function restoreTransfer(t: Transfer) {
  const created = transfers.create({
    fromWalletId: t.fromWalletId,
    toWalletId: t.toWalletId,
    amountMinor: t.amountMinor.toString(),
    toAmountMinor: t.toAmountMinor.toString(),
    occurredAt: t.occurredAt.toISOString(),
    note: t.note ?? undefined,
  });
  if (!created) throw new Error('Una de las billeteras de esta transferencia ya no existe.');
  refreshAfterTransaction(queryClient);
}
