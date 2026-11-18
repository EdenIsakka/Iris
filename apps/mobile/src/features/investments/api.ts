import { investmentsService } from '@finanzas/db';
import type {
  CreateInvestmentInput,
  InvestmentPeriod,
  UpdateInvestmentInput,
} from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

const investments = investmentsService(db);

export const investmentKeys = { all: ['investments'] as const };

const GONE = 'Esta inversión ya no existe.';

export function useInvestments(period: InvestmentPeriod) {
  return useQuery({
    queryKey: [...investmentKeys.all, period],
    queryFn: () => investments.list(period),
  });
}

export type Investment = ReturnType<typeof investments.list>['items'][number];

export function useValuations(id: string, period: InvestmentPeriod) {
  return useQuery({
    queryKey: [...investmentKeys.all, id, 'valuations', period],
    queryFn: () => {
      const rows = investments.history(id, period);
      if (!rows) throw new Error(GONE);
      return rows;
    },
  });
}

/**
 * Toda mutación cambia valores y totales: refresca todo lo de inversiones.
 * `fn` devuelve false si la inversión ya no existe.
 */
function useInvestmentMutation<T>(fn: (input: T) => unknown) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: T) => {
      if (fn(input) === false) throw new Error(GONE);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: investmentKeys.all }),
  });
}

export function useCreateInvestment() {
  return useInvestmentMutation((input: CreateInvestmentInput) => investments.create(input));
}

export function useUpdateInvestment(id: string) {
  return useInvestmentMutation(
    (input: UpdateInvestmentInput) => investments.update(id, input) ?? false,
  );
}

export function useDeleteInvestment() {
  return useInvestmentMutation((id: string) => investments.remove(id));
}

export function useContributeInvestment(id: string) {
  return useInvestmentMutation((amountMinor: string) => investments.contribute(id, amountMinor));
}

export function useValueInvestment(id: string) {
  return useInvestmentMutation((valueMinor: string) => investments.value(id, valueMinor));
}
