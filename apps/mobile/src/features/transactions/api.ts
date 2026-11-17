import type { CreateCategoryInput, CreateTransactionInput } from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletKeys } from '@/features/wallets/api';
import { api } from '@/lib/api-client';

export const transactionKeys = { all: ['transactions'] as const };

/** Un movimiento cambia la lista, el resumen y el saldo de su billetera. */
function refreshAfterTransaction(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  queryClient.invalidateQueries({ queryKey: walletKeys.all });
}

export function useTransactions() {
  return useQuery({
    queryKey: transactionKeys.all,
    queryFn: async () => {
      const res = await api.v1.transactions.$get();
      if (!res.ok) throw new Error('No se pudieron cargar los movimientos');
      return res.json();
    },
  });
}

// Cuelga de transactionKeys.all para que crear un movimiento también refresque el resumen.
export function useMonthSummary() {
  return useQuery({
    queryKey: [...transactionKeys.all, 'summary'],
    queryFn: async () => {
      const res = await api.v1.transactions.summary.$get();
      if (!res.ok) throw new Error('No se pudo cargar el resumen');
      return res.json();
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: CreateTransactionInput) => {
      const res = await api.v1.transactions.$post({ json });
      if (!res.ok) throw new Error('No se pudo guardar el movimiento');
      return res.json();
    },
    onSuccess: () => refreshAfterTransaction(queryClient),
  });
}

export type Transaction = NonNullable<ReturnType<typeof useTransactions>['data']>[number];

export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: CreateTransactionInput) => {
      const res = await api.v1.transactions[':id'].$put({ param: { id }, json });
      if (!res.ok) throw new Error('No se pudo guardar el movimiento');
      return res.json();
    },
    onSuccess: () => refreshAfterTransaction(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.v1.transactions[':id'].$delete({ param: { id } });
      if (!res.ok) throw new Error('No se pudo borrar el movimiento');
    },
    onSuccess: () => refreshAfterTransaction(queryClient),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: CreateCategoryInput) => {
      const res = await api.v1.categories.$post({ json });
      if (!res.ok) throw new Error('No se pudo crear la categoría');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

const categoryKeys = { all: ['categories'] as const };

export function useRenameCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await api.v1.categories[':id'].$put({ param: { id }, json: { name } });
      // 409 lo lanza HTTPException, que el cliente tipado no conoce.
      if ((res.status as number) === 409)
        throw new Error('Ya tienes una categoría con ese nombre.');
      if (!res.ok) throw new Error('No se pudo renombrar la categoría');
      return res.json();
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
      const res = await api.v1.categories[':id'].$delete({ param: { id } });
      if (!res.ok) throw new Error('No se pudo borrar la categoría');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: async () => {
      const res = await api.v1.categories.$get();
      if (!res.ok) throw new Error('No se pudieron cargar las categorías');
      return res.json();
    },
  });
}
