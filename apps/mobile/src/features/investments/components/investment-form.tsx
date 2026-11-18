import {
  createInvestmentSchema,
  type InvestmentKind,
  investmentKind,
  updateInvestmentSchema,
} from '@finanzas/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import { Button, FieldLabel, Form, FormError, inputClassName } from '@/components/ui/form';
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

/** Solo estos rinden una tasa fija; cripto y acciones se valoran a mano. */
const RATED_KINDS: InvestmentKind[] = ['cdt', 'fund', 'other'];
/** "11,5" → 1150 (centésimas de %); null si está vacío; NaN si no es una tasa válida. */
const parseRate = (text: string) =>
  !text
    ? null
    : /^\d{1,3}([.,]\d{1,2})?$/.test(text)
      ? Math.round(Number(text.replace(',', '.')) * 100)
      : Number.NaN;

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
  const [rate, setRate] = useState(
    investment?.rateBps ? String(investment.rateBps / 100).replace('.', ',') : '',
  );
  const [amount, setAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [startedAt, setStartedAt] = useState(() => new Date());
  const [pickingDate, setPickingDate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const rateBps = RATED_KINDS.includes(kind) ? parseRate(rate) : null;
    if (Number.isNaN(rateBps) || rateBps === 0) {
      return setError('Escribe la tasa como 11,5 (de 0,01 a 100).');
    }
    if (investment) {
      const parsed = updateInvestmentSchema.safeParse({ name, kind, rateBps });
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
      rateBps,
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
    <Form>
      <FieldLabel nativeID="investment-name-label">Nombre</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Bitcoin, acciones Ecopetrol"
        maxLength={80}
        accessibilityLabelledBy="investment-name-label"
        autoFocus={!investment}
      />

      <FieldLabel>Tipo</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        {investmentKind.options.map((k) => (
          <Chip key={k} label={KIND_LABELS[k]} selected={k === kind} onPress={() => setKind(k)} />
        ))}
      </View>

      {RATED_KINDS.includes(kind) ? (
        <>
          <FieldLabel nativeID="investment-rate-label">Tasa efectiva anual % (opcional)</FieldLabel>
          <TextInput
            className={`${inputClassName} text-[17px]`}
            value={rate}
            onChangeText={setRate}
            placeholder="Ej. 11,5"
            keyboardType="decimal-pad"
            maxLength={6}
            accessibilityLabelledBy="investment-rate-label"
          />
          <Text className="text-[13px] text-secondary">
            Para un CDT o una cajita de Nu: el valor crece solo cada día. Es ganancia bruta, sin
            descontar la retención. Si la tasa cambia, edítala aquí y desde hoy rinde la nueva.
          </Text>
        </>
      ) : null}

      {investment ? null : (
        <>
          <AmountInput label="¿Cuánto invertiste? (COP)" value={amount} onChangeValue={setAmount} />

          <FieldLabel>¿Desde cuándo?</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
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

      <FormError message={error ?? save.error?.message} />
      <Button
        label={save.isPending ? 'Guardando…' : investment ? 'Guardar' : 'Agregar inversión'}
        onPress={submit}
        disabled={save.isPending}
      />
      {footer}
    </Form>
  );
}
