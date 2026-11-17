import type { CreateWalletInput } from '@finanzas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const walletKeys = { all: ['wallets'] as const };

export function useWallets() {
  return useQuery({
    queryKey: walletKeys.all,
    queryFn: async () => {
      const res = await api.v1.wallets.$get();
      if (!res.ok) throw new Error('No se pudieron cargar las billeteras');
      return res.json();
    },
  });
}

export type Wallet = NonNullable<ReturnType<typeof useWallets>['data']>[number];

export function useSaveWallet(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: CreateWalletInput) => {
      const res = id
        ? await api.v1.wallets[':id'].$put({ param: { id }, json })
        : await api.v1.wallets.$post({ json });
      if (!res.ok) throw new Error('No se pudo guardar la billetera');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.v1.wallets[':id'].$delete({ param: { id } });
      // 409 trae la razón (tiene movimientos o es la única); el cliente tipado no la conoce.
      if ((res.status as number) === 409) {
        const body = (await res.json()) as unknown as { error: string };
        throw new Error(`${body.error}.`);
      }
      if (!res.ok) throw new Error('No se pudo borrar la billetera');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
}
