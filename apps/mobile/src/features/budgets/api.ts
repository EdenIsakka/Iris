import { budgetsService } from '@finanzas/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionKeys } from '@/features/transactions/api';
import { db } from '@/lib/db';

const budgets = budgetsService(db);

// Cuelga de transactionKeys.all: un gasto nuevo cambia lo gastado contra el tope.
export const budgetKeys = { all: [...transactionKeys.all, 'budgets'] as const };

export function useBudgets() {
  return useQuery({ queryKey: budgetKeys.all, queryFn: () => budgets.list() });
}

export type Budget = ReturnType<typeof budgets.list>[number];

const NOT_EXPENSE = 'Esta categoría ya no existe o no es de gasto.';

export function useSaveBudget(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (limitMinor: string) => {
      if (!budgets.set(categoryId, limitMinor)) throw new Error(NOT_EXPENSE);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}

export function useDeleteBudget(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!budgets.remove(categoryId)) throw new Error(NOT_EXPENSE);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}
