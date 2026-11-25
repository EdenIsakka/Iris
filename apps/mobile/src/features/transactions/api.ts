import { categoriesService, type TransactionsPage, transactionsService } from '@finanzas/db';
import {
  type CreateCategoryInput,
  type CreateTransactionInput,
  TRANSACTIONS_PAGE_SIZE,
} from '@finanzas/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletKeys } from '@/features/wallets/api';
import { db } from '@/lib/db';
import { queryClient } from '@/lib/query-client';

const transactions = transactionsService(db);
const categories = categoriesService(db);

export const transactionKeys = { all: ['transactions'] as const };
const categoryKeys = { all: ['categories'] as const };

/** Un movimiento cambia la lista, el resumen y el saldo de su billetera. */
function refreshAfterTransaction(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  queryClient.invalidateQueries({ queryKey: walletKeys.all });
}

const INVALID = 'La billetera o la categoría ya no existen. Elige otra.';

/** Movimientos de a páginas, del más nuevo al más viejo. */
export function useTransactions() {
  return useInfiniteQuery({
    queryKey: [...transactionKeys.all, 'list'],
    initialPageParam: undefined as TransactionsPage | undefined,
    queryFn: ({ pageParam }) => transactions.list(pageParam),
    getNextPageParam: (page): TransactionsPage | undefined => {
      const last = page.at(-1);
      return page.length === TRANSACTIONS_PAGE_SIZE && last
        ? { before: last.occurredAt, beforeId: last.id }
        : undefined;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({ queryKey: [...transactionKeys.all, id], queryFn: () => transactions.get(id) });
}

/** Todos los movimientos del mes que está `back` meses atrás (0 = este mes). */
export function useMonthTransactions(back: number) {
  return useQuery({
    queryKey: [...transactionKeys.all, 'month', back],
    queryFn: () => transactions.month(back),
  });
}

export type Transaction = NonNullable<ReturnType<typeof transactions.get>>;

// Cuelga de transactionKeys.all para que crear un movimiento también refresque el resumen.
export function useMonthSummary() {
  return useQuery({
    queryKey: [...transactionKeys.all, 'summary'],
    queryFn: () => transactions.monthSummary(),
  });
}

/** Ingresos y gastos de los últimos 6 meses; cuelga de transactionKeys.all como el resumen. */
export function useMonthlyTotals() {
  return useQuery({
    queryKey: [...transactionKeys.all, 'monthly'],
    queryFn: () => transactions.monthly(),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const row = transactions.create(input);
      if (!row) throw new Error(INVALID);
      return row;
    },
    onSuccess: () => refreshAfterTransaction(queryClient),
  });
}

export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const row = transactions.update(id, input);
      if (!row) throw new Error(INVALID);
      return row;
    },
    onSuccess: () => refreshAfterTransaction(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!transactions.remove(id)) throw new Error('Este movimiento ya no existe');
    },
    onSuccess: () => refreshAfterTransaction(queryClient),
  });
}

/** Vuelve a crear un movimiento borrado (con otro id). Para el "Deshacer". */
export function restoreTransaction(t: Transaction) {
  const created = transactions.create({
    walletId: t.walletId,
    categoryId: t.categoryId,
    kind: t.kind,
    amountMinor: t.amountMinor.toString(),
    occurredAt: t.occurredAt.toISOString(),
    note: t.note ?? undefined,
  });
  if (!created) throw new Error('La billetera de este movimiento ya no existe.');
  refreshAfterTransaction(queryClient);
}

export function useCategories() {
  return useQuery({ queryKey: categoryKeys.all, queryFn: () => categories.list() });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => categories.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useRenameCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const result = categories.rename(id, name);
      if (result === 'duplicate') throw new Error('Ya tienes una categoría con ese nombre.');
      if (result === 'not-found') throw new Error('Esta categoría ya no existe.');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      // El resumen muestra los nombres de las categorías.
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!categories.remove(id)) throw new Error('Esta categoría ya no existe');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
