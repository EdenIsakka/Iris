import type {
  CreateInvestmentInput,
  InvestmentPeriod,
  UpdateInvestmentInput,
} from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const investmentKeys = { all: ['investments'] as const };

export function useInvestments(period: InvestmentPeriod) {
  return useQuery({
    queryKey: [...investmentKeys.all, period],
    queryFn: async () => {
      const res = await api.v1.investments.$get({ query: { period } });
      if (!res.ok) throw new Error('No se pudieron cargar las inversiones');
      return res.json();
    },
  });
}

export type Investment = NonNullable<ReturnType<typeof useInvestments>['data']>['items'][number];

export function useValuations(id: string, period: InvestmentPeriod) {
  return useQuery({
    queryKey: [...investmentKeys.all, id, 'valuations', period],
    queryFn: async () => {
      const res = await api.v1.investments[':id'].valuations.$get({
        param: { id },
        query: { period },
      });
      if (!res.ok) throw new Error('No se pudo cargar el historial');
      return res.json();
    },
  });
}

/** Toda mutación cambia valores y totales: refresca todo lo de inversiones. */
function useInvestmentMutation<T>(fn: (input: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: investmentKeys.all }),
  });
}

export function useCreateInvestment() {
  return useInvestmentMutation(async (input: CreateInvestmentInput) => {
    const res = await api.v1.investments.$post({ json: input });
    if (!res.ok) throw new Error('No se pudo crear la inversión');
  });
}

export function useUpdateInvestment(id: string) {
  return useInvestmentMutation(async (input: UpdateInvestmentInput) => {
    const res = await api.v1.investments[':id'].$put({ param: { id }, json: input });
    if (!res.ok) throw new Error('No se pudo guardar la inversión');
  });
}

export function useDeleteInvestment() {
  return useInvestmentMutation(async (id: string) => {
    const res = await api.v1.investments[':id'].$delete({ param: { id } });
    if (!res.ok) throw new Error('No se pudo borrar la inversión');
  });
}

export function useContributeInvestment(id: string) {
  return useInvestmentMutation(async (amountMinor: string) => {
    const res = await api.v1.investments[':id'].contributions.$post({
      param: { id },
      json: { amountMinor },
    });
    if (!res.ok) throw new Error('No se pudo guardar el aporte');
  });
}

export function useValueInvestment(id: string) {
  return useInvestmentMutation(async (valueMinor: string) => {
    const res = await api.v1.investments[':id'].valuations.$post({
      param: { id },
      json: { valueMinor },
    });
    if (!res.ok) throw new Error('No se pudo guardar el valor');
  });
}
