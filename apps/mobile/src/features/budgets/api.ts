import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionKeys } from '@/features/transactions/api';
import { api } from '@/lib/api-client';

// Cuelga de transactionKeys.all: un gasto nuevo cambia lo gastado contra el tope.
export const budgetKeys = { all: [...transactionKeys.all, 'budgets'] as const };

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.all,
    queryFn: async () => {
      const res = await api.v1.budgets.$get();
      if (!res.ok) throw new Error('No se pudieron cargar los topes');
      return res.json();
    },
  });
}

export type Budget = NonNullable<ReturnType<typeof useBudgets>['data']>[number];

export function useSaveBudget(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (limitMinor: string) => {
      const res = await api.v1.budgets[':id'].$put({
        param: { id: categoryId },
        json: { limitMinor },
      });
      if (!res.ok) throw new Error('No se pudo guardar el tope');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}

export function useDeleteBudget(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.v1.budgets[':id'].$delete({ param: { id: categoryId } });
      if (!res.ok) throw new Error('No se pudo quitar el tope');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}
