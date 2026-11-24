import { formatMoney } from '@finanzas/shared';
import { View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTrm, useWallets } from '@/features/wallets/api';
import { useMonthSummary } from '../api';
import { CategoryIcon, categoryColor } from './category-icon';

/** Gastos del mes por categoría: una barra con el reparto y una fila por categoría. */
export function MonthSummary() {
  const { data, isLoading, error } = useMonthSummary();
  const wallets = useWallets();
  const trm = useTrm();
  // Sin TRM los movimientos en dólares suman 0: se avisa en vez de mostrar un total incompleto.
  const noTrm = trm.isSuccess && !trm.data && wallets.data?.some((w) => w.currency === 'USD');

  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  if (!data) return null;

  const total = data.expenseMinor;
  // Porcentaje entero del total; bigint para no perder precisión con montos grandes.
  const share = (amount: bigint) => (total > 0n ? Number((amount * 100n) / total) : 0);

  // Lista simple (no FlatList): son pocas categorías y Resumen ya hace scroll.
  return (
    <Card title="Gastos del mes">
      {data.byCategory.length ? (
        <>
          <View className="my-2 h-2.5 flex-row overflow-hidden rounded-full bg-fill">
            {data.byCategory.map((c) => (
              <View
                key={c.id ?? 'sin-categoria'}
                style={{ flex: share(c.amountMinor), backgroundColor: categoryColor(c.name) }}
              />
            ))}
          </View>
          {data.byCategory.map((c) => (
            <View
              key={c.id ?? 'sin-categoria'}
              className="min-h-[48px] flex-row items-center gap-3"
            >
              <CategoryIcon name={c.name} />
              <View className="flex-1">
                <Text className="text-[15px]" numberOfLines={1}>
                  {c.name ?? 'Sin categoría'}
                </Text>
                <Text className="text-[13px] text-secondary">{share(c.amountMinor)}% del mes</Text>
              </View>
              <Text className="text-[15px] font-medium" style={{ fontVariant: ['tabular-nums'] }}>
                {formatMoney(c.amountMinor)}
              </Text>
            </View>
          ))}
        </>
      ) : (
        <Text className="py-1 text-secondary">Todavía no tienes gastos este mes.</Text>
      )}
      {noTrm ? (
        <Text className="pt-1 text-[13px] text-secondary">
          Los movimientos en dólares no se suman hasta tener la TRM: abre la app con internet.
        </Text>
      ) : null}
    </Card>
  );
}
