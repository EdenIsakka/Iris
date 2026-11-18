import { goalsService } from '@finanzas/db';
import type { CreateGoalInput } from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

const goals = goalsService(db);

export const goalKeys = { all: ['goals'] as const };

const GONE = 'Esta meta ya no existe.';

export function useGoals() {
  return useQuery({ queryKey: goalKeys.all, queryFn: () => goals.list() });
}

export type Goal = ReturnType<typeof goals.list>[number];

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => goals.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useUpdateGoal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const row = goals.update(id, input);
      if (!row) throw new Error(GONE);
      return row;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!goals.remove(id)) throw new Error(GONE);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useContribute(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amountMinor: string) => {
      const row = goals.contribute(goalId, amountMinor);
      if (!row) throw new Error(GONE);
      return row;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}
