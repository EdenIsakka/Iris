import type { CreateGoalInput } from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const goalKeys = { all: ['goals'] as const };

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.all,
    queryFn: async () => {
      const res = await api.v1.goals.$get();
      if (!res.ok) throw new Error('No se pudieron cargar las metas');
      return res.json();
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const res = await api.v1.goals.$post({ json: input });
      if (!res.ok) throw new Error('No se pudo crear la meta');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useContribute(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amountMinor: string) => {
      const res = await api.v1.goals[':id'].contributions.$post({
        param: { id: goalId },
        json: { amountMinor },
      });
      if (!res.ok) throw new Error('No se pudo guardar el aporte');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}
