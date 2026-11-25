import { createTransferSchema } from '@finanzas/shared';
import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import { DateField } from '@/components/ui/date-field';
import { Button, FieldLabel, Form, FormError, inputClassName } from '@/components/ui/form';
import { TextInput } from '@/components/ui/text';
import { useWallets } from '@/features/wallets/api';
import { useCreateTransfer } from '../api';

type Props = {
  onSaved: () => void;
  /** Lo que va arriba del formulario: el selector Gasto / Ingreso / Transferir. */
  header: ReactNode;
};

/** Pasar plata de una billetera a otra. Necesita al menos dos billeteras. */
export function TransferForm({ onSaved, header }: Props) {
  const wallets = useWallets().data ?? [];
  const create = useCreateTransfer();
  const [amount, setAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromId, setFromId] = useState(wallets[0]?.id ?? '');
  const [toId, setToId] = useState(wallets[1]?.id ?? '');
  const [date, setDate] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from = wallets.find((w) => w.id === fromId);
  const to = wallets.find((w) => w.id === toId);
  const fromCurrency = from?.currency ?? 'COP';
  const toCurrency = to?.currency ?? 'COP';
  const crossCurrency = fromCurrency !== toCurrency;

  // Elegir de origen la que estaba de destino las intercambia: nunca quedan iguales.
  const chooseFrom = (id: string) => {
    if (id === toId) setToId(fromId);
    setFromId(id);
  };

  function submit() {
    const parsed = createTransferSchema.safeParse({
      fromWalletId: fromId,
      toWalletId: toId,
      amountMinor: amount,
      toAmountMinor: crossCurrency ? toAmount : undefined,
      occurredAt: date.toISOString(),
      note: note.trim() || undefined,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(
        field === 'amountMinor'
          ? 'Escribe un monto mayor que 0.'
          : field === 'toAmountMinor'
            ? `Escribe cuánto llega en ${toCurrency}.`
            : 'Elige dos billeteras distintas.',
      );
      return;
    }
    setError(null);
    create.mutate(parsed.data, { onSuccess: onSaved });
  }

  const walletChips = (selected: string, onPress: (id: string) => void, skip?: string) => (
    <View className="flex-row flex-wrap gap-2">
      {wallets
        .filter((w) => w.id !== skip)
        .map((w) => (
          <Chip
            key={w.id}
            label={w.name}
            selected={w.id === selected}
            onPress={() => onPress(w.id)}
          />
        ))}
    </View>
  );

  return (
    <Form>
      {header}

      <AmountInput
        label={`Sale (${fromCurrency})`}
        value={amount}
        onChangeValue={setAmount}
        currency={fromCurrency}
        autoFocus
      />

      <FieldLabel>De</FieldLabel>
      {walletChips(fromId, chooseFrom)}
      <FieldLabel>A</FieldLabel>
      {walletChips(toId, setToId, fromId)}

      {crossCurrency ? (
        <AmountInput
          label={`Llega (${toCurrency})`}
          value={toAmount}
          onChangeValue={setToAmount}
          currency={toCurrency}
        />
      ) : null}

      <DateField value={date} onChange={setDate} />

      <FieldLabel nativeID="transfer-note-label">Nota (opcional)</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={note}
        onChangeText={setNote}
        maxLength={280}
        placeholder="Ej: Sacar para el mercado"
        accessibilityLabelledBy="transfer-note-label"
      />

      <FormError message={error ?? create.error?.message} />
      <Button
        label={create.isPending ? 'Guardando…' : 'Transferir'}
        onPress={submit}
        disabled={create.isPending}
      />
    </Form>
  );
}
