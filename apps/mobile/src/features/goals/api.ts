import { useQuery } from '@tanstack/react-query';
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
