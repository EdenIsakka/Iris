import { trmService, walletsService } from '@finanzas/db';
import type { CreateWalletInput } from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

const wallets = walletsService(db);
const trm = trmService(db);

export const walletKeys = { all: ['wallets'] as const };

export function useWallets() {
  return useQuery({ queryKey: walletKeys.all, queryFn: () => wallets.list() });
}

/** Última TRM: la trae al abrir y cada hora; sin red usa la guardada. null si nunca hubo. */
export function useTrm() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['trm'],
    queryFn: async () => {
      const before = trm.latest()?.date;
      const latest = await trm.refresh();
      // Los totales del mes pasan el USD a pesos con ella: se recalculan si cambió.
      if (latest && latest.date !== before) {
        void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'trm' });
      }
      return latest;
    },
    staleTime: 60 * 60_000,
  });
}

export type Wallet = ReturnType<typeof wallets.list>[number];

export function useSaveWallet(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWalletInput) => {
      if (!id) return void wallets.create(input);
      if (!wallets.update(id, input)) throw new Error('No encontramos esta billetera');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
}

const REMOVE_ERRORS = {
  'not-found': 'No encontramos esta billetera.',
  last: 'Necesitas al menos una billetera.',
  'has-transactions':
    'Esta billetera tiene movimientos o transferencias. Bórralos o pásalos a otra billetera primero.',
};

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = wallets.remove(id);
      if (result !== 'deleted') throw new Error(REMOVE_ERRORS[result]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
}
