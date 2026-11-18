import { formatMoney, type InvestmentPeriod, PRICED, quantity } from '@finanzas/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Card } from '@/components/ui/card';
import { Button, Form, FormError } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { formatDate } from '@/lib/format-date';
import {
  useContributeInvestment,
  useInvestments,
  usePriceKey,
  useValuations,
  useValueInvestment,
} from '../api';
import { changeClass, formatChange, formatQuantity, formatRate, KIND_LABELS } from '../format';
import { QuantityInput } from './investment-form';
import { StatsBlock } from './investment-totals';
import { PeriodChips } from './period-chips';

type Props = { id: string; initialPeriod?: InvestmentPeriod };

export function InvestmentDetail({ id, initialPeriod = 'month' }: Props) {
  const [period, setPeriod] = useState(initialPeriod);
  const { data, isLoading, error } = useInvestments(period);
  const setValue = useValueInvestment(id);
  const contribute = useContributeInvestment(id);
  const priceKey = usePriceKey();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  const investment = data?.items.find((i) => i.id === id);
  if (!investment) return <Text className="p-4">No encontramos esta inversión.</Text>;

  return (
    <Form>
      <View className="px-1 pb-2">
        <Text className="text-[28px] font-bold tracking-tight">{investment.name}</Text>
        <Text className="text-[15px] text-secondary">
          {KIND_LABELS[investment.kind]}
          {investment.rateBps ? ` · ${formatRate(investment.rateBps)} EA, crece solo cada día` : ''}
          {investment.symbol ? ` · ${formatQuantity(investment.quantityE8)} unidades` : ''}
        </Text>
      </View>

      {investment.symbol &&
      PRICED[investment.symbol].kind === 'fund' &&
      priceKey.isSuccess &&
      !priceKey.data ? (
        <Link href="/price-key" asChild>
          <Pressable className="min-h-[44px] justify-center px-1" accessibilityRole="button">
            <Text className="text-[15px] text-accent">
              Para que el precio se actualice solo, agrega tu llave de Twelve Data
            </Text>
          </Pressable>
        </Link>
      ) : null}

      <PeriodChips value={period} onChange={setPeriod} />
      <View className="mt-2">
        <Card>
          <StatsBlock stats={investment} period={period} />
        </Card>
      </View>

      {/* Con precio automático el valor de hoy sale del precio. */}
      {investment.symbol ? null : (
        <AmountForm
          label="¿Cuánto vale hoy? (COP)"
          button="Actualizar valor"
          mutation={setValue}
          submit={(amount, _, onSuccess) => setValue.mutate(amount, { onSuccess })}
        />
      )}
      <AmountForm
        label={investment.symbol ? '¿Cuánto pagaste? (COP)' : '¿Cuánto más metiste? (COP)'}
        button="Aportar"
        mutation={contribute}
        withQuantity={Boolean(investment.symbol)}
        submit={(amount, units, onSuccess) =>
          contribute.mutate({ amountMinor: amount, quantity: units || undefined }, { onSuccess })
        }
      />

      <View className="mt-6">
        <Card title="Evolución">
          <History id={id} period={period} />
        </Card>
      </View>

      <Link href={{ pathname: '/investments/[id]/edit', params: { id } }} asChild>
        <Pressable
          className="mt-2 min-h-[44px] items-center justify-center"
          accessibilityRole="button"
        >
          <Text className="text-[17px] text-accent">Editar o borrar inversión</Text>
        </Pressable>
      </Link>
    </Form>
  );
}

/** Cada valor registrado en el periodo y cuánto cambió frente al anterior. */
function History({ id, period }: { id: string; period: InvestmentPeriod }) {
  const { data, isLoading, error } = useValuations(id, period);
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  if (!data?.length) return <Text className="text-secondary">Sin valores registrados.</Text>;
  return (
    <View>
      {data.map((v, i) => {
        const prev = data[i - 1];
        const diff = prev ? v.valueMinor - prev.valueMinor : null;
        return (
          <View
            key={v.id}
            className={`flex-row items-center gap-2 py-2 ${i > 0 ? 'border-t border-separator' : ''}`}
          >
            <Text className="w-24 text-[15px] text-secondary">{formatDate(v.occurredAt)}</Text>
            <Text className="text-[15px]">{formatMoney(v.valueMinor)}</Text>
            <Text
              className={`flex-1 text-right text-[13px] ${diff !== null ? changeClass(diff) : 'text-secondary'}`}
            >
              {diff !== null && prev ? formatChange(diff, prev.valueMinor) : 'Inicio'}
              {v.id === 'today' ? ' · hoy' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function AmountForm({
  label,
  button,
  mutation,
  withQuantity = false,
  submit,
}: {
  label: string;
  button: string;
  mutation: { isPending: boolean; error: Error | null };
  /** Con precio automático también pide las unidades compradas. */
  withQuantity?: boolean;
  submit: (amount: string, units: string, onSuccess: () => void) => void;
}) {
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const ready = Boolean(amount) && (!withQuantity || quantity.safeParse(units).success);
  return (
    <View className="mt-4 gap-2">
      <AmountInput label={label} value={amount} onChangeValue={setAmount} />
      {withQuantity ? <QuantityInput value={units} onChange={setUnits} /> : null}
      <FormError message={mutation.error?.message} />
      <Button
        label={mutation.isPending ? 'Guardando…' : button}
        onPress={() =>
          submit(amount, units, () => {
            setAmount('');
            setUnits('');
          })
        }
        disabled={!ready || mutation.isPending}
      />
    </View>
  );
}
