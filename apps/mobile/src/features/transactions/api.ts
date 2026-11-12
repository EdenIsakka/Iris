import type { CreateCategoryInput, CreateTransactionInput } from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const transactionKeys = { all: ['transactions'] as const };

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.v1.transactions[':id'].$delete({ param: { id } });
      if (!res.ok) throw new Error('No se pudo borrar el movimiento');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

// Billeteras y categorías solo las usa el formulario de movimientos por ahora (ADR-0005).
export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await api.v1.wallets.$get();
      if (!res.ok) throw new Error('No se pudieron cargar las billeteras');
      return res.json();
    },
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
