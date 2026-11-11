import { useQuery } from '@tanstack/react-query';
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
