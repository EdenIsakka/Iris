import {
  createInvestmentSchema,
  type InvestmentKind,
  investmentKind,
  updateInvestmentSchema,
} from '@finanzas/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import { Text, TextInput } from '@/components/ui/text';
import { formatDate } from '@/lib/format-date';
import { type Investment, useCreateInvestment, useUpdateInvestment } from '../api';
import { KIND_LABELS } from '../format';

type Props = {
  onSaved: () => void;
  /** Si viene, solo se editan nombre y tipo; los montos cambian desde el detalle. */
  investment?: Investment;
  footer?: ReactNode;
};

const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
// Fecha local en AAAA-MM-DD (toISOString la pasaría a UTC y podría cambiar el día).
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function InvestmentForm({ onSaved, investment, footer }: Props) {
  const create = useCreateInvestment();
  const update = useUpdateInvestment(investment?.id ?? '');
  const save = investment ? update : create;
  const [name, setName] = useState(investment?.name ?? '');
  const [kind, setKind] = useState<InvestmentKind>(investment?.kind ?? 'crypto');
  const [amount, setAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [startedAt, setStartedAt] = useState(() => new Date());
  const [pickingDate, setPickingDate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (investment) {
      const parsed = updateInvestmentSchema.safeParse({ name, kind });
      if (!parsed.success) return setError('Escribe un nombre.');
      setError(null);
      return update.mutate(parsed.data, { onSuccess: onSaved });
    }
    const parsed = createInvestmentSchema.safeParse({
      name,
      kind,
      amountMinor: amount,
      startedAt: isToday(startedAt) ? undefined : isoDate(startedAt),
      currentValueMinor: currentValue || undefined,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(field === 'name' ? 'Escribe un nombre.' : 'Escribe cuánto invertiste.');
      return;
    }
    setError(null);
    create.mutate(parsed.data, { onSuccess: onSaved });
  }

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.label} nativeID="investment-name-label">
        Nombre
      </Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Bitcoin, acciones Ecopetrol"
        maxLength={80}
        accessibilityLabelledBy="investment-name-label"
        autoFocus={!investment}
      />

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.row}>
        {investmentKind.options.map((k) => (
          <Chip key={k} label={KIND_LABELS[k]} selected={k === kind} onPress={() => setKind(k)} />
        ))}
      </View>

      {investment ? null : (
        <>
          <AmountInput label="¿Cuánto invertiste? (COP)" value={amount} onChangeValue={setAmount} />

          <Text style={styles.label}>¿Desde cuándo?</Text>
          <View style={styles.row}>
            <Chip
              label="Hoy"
              selected={isToday(startedAt)}
              onPress={() => setStartedAt(new Date())}
            />
            <Chip
              label={isToday(startedAt) ? 'Otra fecha' : formatDate(startedAt)}
              selected={!isToday(startedAt)}
              onPress={() => setPickingDate(true)}
            />
          </View>
          {pickingDate ? (
            <DateTimePicker
              value={startedAt}
              mode="date"
              maximumDate={new Date()}
              onChange={(event, picked) => {
                setPickingDate(false);
                if (event.type === 'set' && picked) setStartedAt(picked);
              }}
            />
          ) : null}

          {isToday(startedAt) ? null : (
            <AmountInput
              label="¿Cuánto vale hoy? (opcional)"
              value={currentValue}
              onChangeValue={setCurrentValue}
            />
          )}
        </>
      )}

      {error || save.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error ?? save.error?.message}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, save.isPending && styles.buttonDisabled]}
        onPress={submit}
        disabled={save.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: save.isPending }}
      >
        <Text style={styles.buttonText}>
          {save.isPending ? 'Guardando…' : investment ? 'Guardar' : 'Agregar inversión'}
        </Text>
      </Pressable>
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  error: { color: '#b00020' },
  button: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
