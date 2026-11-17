import { formatMoney, type InvestmentPeriod } from '@finanzas/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { formatDate } from '@/lib/format-date';
import { useContributeInvestment, useInvestments, useValuations, useValueInvestment } from '../api';
import { changeColor, formatChange, KIND_LABELS } from '../format';
import { StatsBlock } from './investment-totals';
import { PeriodChips } from './period-chips';

type Props = { id: string; initialPeriod?: InvestmentPeriod };

export function InvestmentDetail({ id, initialPeriod = 'month' }: Props) {
  const [period, setPeriod] = useState(initialPeriod);
  const { data, isLoading, error } = useInvestments(period);
  const setValue = useValueInvestment(id);
  const contribute = useContributeInvestment(id);

  if (isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  if (error) return <Text style={styles.pad}>{error.message}</Text>;
  const investment = data?.items.find((i) => i.id === id);
  if (!investment) return <Text style={styles.pad}>No encontramos esta inversión.</Text>;

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{investment.name}</Text>
      <Text style={styles.caption}>{KIND_LABELS[investment.kind]}</Text>

      <PeriodChips value={period} onChange={setPeriod} />
      <StatsBlock stats={investment} period={period} />

      <AmountForm label="¿Cuánto vale hoy? (COP)" button="Actualizar valor" mutation={setValue} />
      <AmountForm label="¿Cuánto más metiste? (COP)" button="Aportar" mutation={contribute} />

      <Text style={[styles.caption, styles.section]} accessibilityRole="header">
        Evolución
      </Text>
      <History id={id} period={period} />

      <Link href={{ pathname: '/investments/[id]/edit', params: { id } }} asChild>
        <Pressable style={styles.link} accessibilityRole="button">
          <Text style={styles.linkText}>Editar o borrar inversión</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

/** Cada valor registrado en el periodo y cuánto cambió frente al anterior. */
function History({ id, period }: { id: string; period: InvestmentPeriod }) {
  const { data, isLoading, error } = useValuations(id, period);
  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  if (!data?.length) return <Text>Sin valores registrados.</Text>;
  return (
    <View>
      {data.map((v, i) => {
        const prev = data[i - 1];
        const diff = prev ? (BigInt(v.valueMinor) - BigInt(prev.valueMinor)).toString() : null;
        return (
          <View key={v.id} style={styles.historyRow}>
            <Text style={styles.date}>{formatDate(new Date(v.occurredAt))}</Text>
            <Text>{formatMoney(BigInt(v.valueMinor))}</Text>
            <Text style={[styles.diff, diff ? { color: changeColor(diff) } : undefined]}>
              {diff && prev ? formatChange(diff, prev.valueMinor) : 'Inicio'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

type AmountMutation = {
  mutate: (amount: string, options: { onSuccess: () => void }) => void;
  isPending: boolean;
  error: Error | null;
};

function AmountForm({
  label,
  button,
  mutation,
}: {
  label: string;
  button: string;
  mutation: AmountMutation;
}) {
  const [amount, setAmount] = useState('');
  return (
    <View>
      <AmountInput label={label} value={amount} onChangeValue={setAmount} />
      {mutation.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {mutation.error.message}
        </Text>
      ) : null}
      <Pressable
        style={[styles.button, (!amount || mutation.isPending) && styles.buttonDisabled]}
        onPress={() => mutation.mutate(amount, { onSuccess: () => setAmount('') })}
        disabled={!amount || mutation.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: !amount || mutation.isPending }}
      >
        <Text style={styles.buttonText}>{mutation.isPending ? 'Guardando…' : button}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  body: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  caption: { color: '#555', fontWeight: '600' },
  section: { marginTop: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 8 },
  date: { width: 100 },
  diff: { flex: 1, textAlign: 'right' },
  error: { color: '#b00020' },
  button: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  linkText: { color: '#1b5e20', fontWeight: '600' },
});
