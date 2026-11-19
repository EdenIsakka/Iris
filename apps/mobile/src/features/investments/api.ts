import { investmentsService, pricesService } from '@finanzas/db';
import type {
  ContributeToInvestmentInput,
  CreateInvestmentInput,
  InvestmentPeriod,
  UpdateInvestmentInput,
} from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { getPriceKey, setPriceKey } from '@/lib/price-key';

const investments = investmentsService(db);
const prices = pricesService(db);

export const investmentKeys = { all: ['investments'] as const };

const GONE = 'Esta inversión ya no existe.';

export function usePriceKey() {
  return useQuery({ queryKey: ['price-key'], queryFn: getPriceKey });
}

/** Revisa la llave con Twelve Data antes de guardarla; null la quita. */
export function useSavePriceKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string | null) => {
      if (key) {
        const ok = await prices.checkKey(key).catch(() => {
          throw new Error('No hay conexión para revisar la llave. Intenta de nuevo.');
        });
        if (!ok) throw new Error('Twelve Data no aceptó esa llave. Revisa que esté completa.');
      }
      await setPriceKey(key);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['price-key'] }),
  });
}

/**
 * Actualiza los precios automáticos al abrir y cada 10 minutos (los planes gratis limitan las
 * consultas). Si alguno cambió, refresca valores y totales.
 */
function usePrices() {
  const queryClient = useQueryClient();
  const key = usePriceKey();
  return useQuery({
    queryKey: ['prices', key.data ?? null],
    enabled: key.isSuccess,
    queryFn: async () => {
      const changed = await prices.refresh(key.data ?? null);
      if (changed) await queryClient.invalidateQueries({ queryKey: investmentKeys.all });
      return changed;
    },
    staleTime: 10 * 60_000,
  });
}

export function useInvestments(period: InvestmentPeriod) {
  usePrices();
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: investmentKeys.all });
      // Con precio automático, el valor de hoy sale de las unidades nuevas. Sin esperar la red:
      // lo guardado ya está.
      void queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
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
  return useInvestmentMutation((input: ContributeToInvestmentInput) =>
    investments.contribute(id, input),
  );
}

export function useValueInvestment(id: string) {
  return useInvestmentMutation((valueMinor: string) => investments.value(id, valueMinor));
}
